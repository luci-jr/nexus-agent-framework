package terminal

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true // Permite acesso via console web autenticado
	},
}

type resizeMessage struct {
	Type string `json:"type"`
	Cols uint16 `json:"cols"`
	Rows uint16 `json:"rows"`
}

// Handler gerencia sessões de terminal interativo via WebSockets (Cloud e Local Agent)
type Handler struct {
	nexusDir string

	// Estado do agente do PC local
	agentMu            sync.RWMutex
	agentConn          *websocket.Conn
	agentWriteMu       sync.Mutex
	localClientMu      sync.Mutex
	localClientConn    *websocket.Conn
	localClientWriteMu sync.Mutex
	localScrollback    []byte
	localScrollbackMu  sync.RWMutex
}

// NewHandler cria uma nova instância do gerenciador de terminal
func NewHandler(nexusDir string) *Handler {
	return &Handler{
		nexusDir:        nexusDir,
		localScrollback: make([]byte, 0, 64*1024),
	}
}

func (h *Handler) checkAuth(r *http.Request) bool {
	if os.Getenv("CONSOLE_NO_AUTH") == "true" {
		return true
	}
	expected := strings.TrimSpace(os.Getenv("CONSOLE_AUTH_TOKEN"))
	if expected == "" {
		expected = strings.TrimSpace(os.Getenv("NEXUS_AUTH_TOKEN"))
	}
	passFile := filepath.Join(h.nexusDir, ".console_pass")
	if data, err := os.ReadFile(passFile); err == nil {
		if p := strings.TrimSpace(string(data)); p != "" {
			expected = p
		}
	}
	if expected == "" {
		expected = "REDACTED_DEFAULT_PASSWORD"
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		if cookie, err := r.Cookie("nexus_token"); err == nil {
			token = strings.TrimSpace(cookie.Value)
		}
	}
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		token = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	}
	return token != "" && token == expected
}

// IsAgentConnected verifica se o agente do PC local está conectado à nuvem
func (h *Handler) IsAgentConnected() bool {
	h.agentMu.RLock()
	defer h.agentMu.RUnlock()
	return h.agentConn != nil
}

// HandleAgentTunnel recebe a conexão WebSocket reversa do agente local do desenvolvedor
func (h *Handler) HandleAgentTunnel(w http.ResponseWriter, r *http.Request) {
	if !h.checkAuth(r) {
		log.Printf("⚠️ [NEXUS AGENT TUNNEL] Conexão não autorizada do agente local (token inválido).")
		http.Error(w, "Agente não autorizado", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ [NEXUS AGENT TUNNEL] Falha no upgrade WebSocket do agente: %v", err)
		return
	}

	log.Printf("💻 [NEXUS AGENT TUNNEL] Agente do PC Local conectado com sucesso! (Origem: %s)", r.RemoteAddr)

	h.agentMu.Lock()
	if h.agentConn != nil {
		_ = h.agentConn.Close()
	}
	h.agentConn = conn
	h.agentMu.Unlock()

	defer func() {
		h.agentMu.Lock()
		if h.agentConn == conn {
			h.agentConn = nil
		}
		h.agentMu.Unlock()
		_ = conn.Close()
		log.Printf("💻 [NEXUS AGENT TUNNEL] Agente do PC Local desconectado.")

		// Notifica cliente web local se houver
		h.localClientMu.Lock()
		client := h.localClientConn
		h.localClientMu.Unlock()
		if client != nil {
			h.localClientWriteMu.Lock()
			_ = client.WriteMessage(websocket.TextMessage, []byte("\r\n\x1b[31m✕ [PC LOCAL OFFLINE] O agente no seu PC encerrou a conexão.\x1b[0m\r\n"))
			h.localClientWriteMu.Unlock()
		}
	}()

	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Loop lendo mensagens do Agente (stdout e eventos)
	for {
		msgType, p, err := conn.ReadMessage()
		if err != nil {
			break
		}
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		if msgType == websocket.BinaryMessage {
			// Salva no scrollback buffer (mantém últimos 64KB)
			h.localScrollbackMu.Lock()
			h.localScrollback = append(h.localScrollback, p...)
			if len(h.localScrollback) > 64*1024 {
				h.localScrollback = h.localScrollback[len(h.localScrollback)-64*1024:]
			}
			h.localScrollbackMu.Unlock()

			// Repassa imediatamente ao navegador conectado
			h.localClientMu.Lock()
			client := h.localClientConn
			h.localClientMu.Unlock()

			if client != nil {
				h.localClientWriteMu.Lock()
				_ = client.WriteMessage(websocket.BinaryMessage, p)
				h.localClientWriteMu.Unlock()
			}
		} else if msgType == websocket.TextMessage {
			var ctrl struct {
				Type string `json:"type"`
			}
			if err := json.Unmarshal(p, &ctrl); err == nil && ctrl.Type == "ping" {
				h.agentWriteMu.Lock()
				_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"pong"}`))
				h.agentWriteMu.Unlock()
			}
		}
	}
}

// HandleWebSocket lida com a conexão WebSocket do terminal (Cloud ou Local)
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	if !h.checkAuth(r) {
		log.Printf("⚠️ [NEXUS TERMINAL] Acesso não autorizado ao terminal. Token fornecido difere do token esperado.")
		http.Error(w, "Terminal Linux restrito: autenticação obrigatória", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ [NEXUS TERMINAL] Falha no handshake WebSocket: %v", err)
		return
	}
	defer conn.Close()

	isLocalMode := os.Getenv("CONSOLE_NO_AUTH") == "true"
	target := strings.TrimSpace(r.URL.Query().Get("target"))
	if !isLocalMode && target == "local" {
		h.handleLocalClient(conn)
		return
	}

	// ==========================================
	// NÓ DE SHELL: Nativo Local ou Container Nuvem
	// ==========================================
	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/bash"
	}

	cmd := exec.Command(shell, "-l")
	cmd.Dir = h.nexusDir

	if isLocalMode {
		if target == "cloud" {
			// Acesso direto à Nuvem AWS via SSH com a chave do host
			keyPath := os.Getenv("NEXUS_AWS_KEY")
			if keyPath == "" {
				home, _ := os.UserHomeDir()
				keyPath = filepath.Join(home, ".ssh", "key-nexus-project.pem")
			}
			awsHost := os.Getenv("NEXUS_AWS_HOST")
			if awsHost == "" {
				awsHost = "192.0.2.1"
			}
			awsUser := os.Getenv("NEXUS_AWS_USER")
			if awsUser == "" {
				awsUser = "ubuntu"
			}

			cmd = exec.Command("ssh",
				"-i", keyPath,
				"-o", "StrictHostKeyChecking=accept-new",
				"-o", "ConnectTimeout=10",
				"-t",
				fmt.Sprintf("%s@%s", awsUser, awsHost),
				"env TERM=xterm-256color COLORTERM=truecolor bash -l",
			)
			cmd.Env = append(os.Environ(),
				"TERM=xterm-256color",
				"COLORTERM=truecolor",
			)
		} else {
			// Modo Local: Preserva o ambiente nativo do usuário (home, zsh/bash, PATH, aliases)
			env := os.Environ()
			env = append(env,
				"TERM=xterm-256color",
				"COLORTERM=truecolor",
				"NEXUS_DIR="+h.nexusDir,
			)
			cmd.Env = env
		}
	} else {
		// Modo Nuvem (AWS Docker Swarm Container)
		cmd.Env = append(os.Environ(),
			"TERM=xterm-256color",
			"COLORTERM=truecolor",
			"NEXUS_DIR="+h.nexusDir,
			"HOME=/root",
			"HOSTNAME=nexus",
			"GIT_SSH_COMMAND=ssh -F /dev/null -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new",
			"PS1=\033[01;32mnexus\033[00m:\033[01;34m\\w\033[00m# ",
			"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
		)
	}

	// Inicia o terminal PTY
	ptyFile, err := pty.Start(cmd)
	if err != nil {
		log.Printf("❌ [NEXUS TERMINAL] Falha ao iniciar PTY: %v", err)
		_ = conn.WriteMessage(websocket.TextMessage, []byte("Falha ao abrir terminal: "+err.Error()+"\r\n"))
		return
	}
	defer func() {
		_ = ptyFile.Close()
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
	}()

	_ = pty.Setsize(ptyFile, &pty.Winsize{Rows: 30, Cols: 120})

	var once sync.Once
	closeAll := func() {
		once.Do(func() {
			_ = ptyFile.Close()
			_ = conn.Close()
		})
	}

	var clientWriteMu sync.Mutex

	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Goroutine: Keep-Alive Heartbeat Cloud
	go func() {
		ticker := time.NewTicker(20 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			clientWriteMu.Lock()
			err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second))
			clientWriteMu.Unlock()
			if err != nil {
				return
			}
		}
	}()

	// Goroutine: Lê do PTY e envia para o WebSocket
	go func() {
		defer closeAll()
		buf := make([]byte, 4096)
		for {
			n, err := ptyFile.Read(buf)
			if err != nil {
				if err != io.EOF {
					log.Printf("ℹ️ [NEXUS TERMINAL] Saída do PTY encerrada: %v", err)
				}
				return
			}
			clientWriteMu.Lock()
			err = conn.WriteMessage(websocket.BinaryMessage, buf[:n])
			clientWriteMu.Unlock()
			if err != nil {
				return
			}
		}
	}()

	// Loop principal Cloud
	for {
		msgType, p, err := conn.ReadMessage()
		if err != nil {
			break
		}
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		if msgType == websocket.TextMessage {
			var ctrl struct {
				Type string `json:"type"`
				Cols uint16 `json:"cols"`
				Rows uint16 `json:"rows"`
			}
			if err := json.Unmarshal(p, &ctrl); err == nil {
				if ctrl.Type == "ping" {
					clientWriteMu.Lock()
					_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"pong"}`))
					clientWriteMu.Unlock()
					continue
				}
				if ctrl.Type == "resize" && ctrl.Cols > 0 && ctrl.Rows > 0 {
					_ = pty.Setsize(ptyFile, &pty.Winsize{Rows: ctrl.Rows, Cols: ctrl.Cols})
					continue
				}
			}
		}

		if msgType == websocket.BinaryMessage || msgType == websocket.TextMessage {
			if _, err := ptyFile.Write(p); err != nil {
				break
			}
		}
	}
}

// handleLocalClient conecta o navegador do desenvolvedor ao agente reverso do PC Local
func (h *Handler) handleLocalClient(conn *websocket.Conn) {
	h.localClientMu.Lock()
	if h.localClientConn != nil && h.localClientConn != conn {
		_ = h.localClientConn.Close()
	}
	h.localClientConn = conn
	h.localClientMu.Unlock()

	defer func() {
		h.localClientMu.Lock()
		if h.localClientConn == conn {
			h.localClientConn = nil
		}
		h.localClientMu.Unlock()
	}()

	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	h.agentMu.RLock()
	agent := h.agentConn
	h.agentMu.RUnlock()

	if agent == nil {
		h.localClientWriteMu.Lock()
		_ = conn.WriteMessage(websocket.TextMessage, []byte("\r\n\x1b[33m! [PC LOCAL OFFLINE] O agente no seu PC não está conectado à nuvem.\r\n\x1b[36mPara conectar seu computador, inicie o serviço no terminal:\r\n  systemctl --user start nexus-agent\r\n  (ou execute no terminal: nexus-agent start)\x1b[0m\r\n"))
		h.localClientWriteMu.Unlock()
	} else {
		// Envia scrollback existente para restaurar visualização
		h.localScrollbackMu.RLock()
		scroll := make([]byte, len(h.localScrollback))
		copy(scroll, h.localScrollback)
		h.localScrollbackMu.RUnlock()

		if len(scroll) > 0 {
			h.localClientWriteMu.Lock()
			_ = conn.WriteMessage(websocket.BinaryMessage, scroll)
			h.localClientWriteMu.Unlock()
		} else {
			h.localClientWriteMu.Lock()
			_ = conn.WriteMessage(websocket.TextMessage, []byte("\r\n\x1b[32m● Conectado ao PC Local via túnel seguro WebSocket.\x1b[0m\r\n"))
			h.localClientWriteMu.Unlock()
		}
	}

	// Goroutine: Ticker Keep-Alive Local
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			h.localClientWriteMu.Lock()
			if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second)); err != nil {
				h.localClientWriteMu.Unlock()
				return
			}
			h.localClientWriteMu.Unlock()
		}
	}()

	// Loop lendo do navegador e enviando ao PC local
	for {
		msgType, p, err := conn.ReadMessage()
		if err != nil {
			break
		}
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		h.agentMu.RLock()
		currentAgent := h.agentConn
		h.agentMu.RUnlock()

		if currentAgent == nil {
			if msgType == websocket.TextMessage && strings.Contains(string(p), `"type":"ping"`) {
				h.localClientWriteMu.Lock()
				_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"pong"}`))
				h.localClientWriteMu.Unlock()
			}
			continue
		}

		if msgType == websocket.BinaryMessage {
			h.agentWriteMu.Lock()
			_ = currentAgent.WriteMessage(websocket.BinaryMessage, p)
			h.agentWriteMu.Unlock()
		} else if msgType == websocket.TextMessage {
			var ctrl struct {
				Type string `json:"type"`
				Cols uint16 `json:"cols"`
				Rows uint16 `json:"rows"`
			}
			if err := json.Unmarshal(p, &ctrl); err == nil {
				if ctrl.Type == "ping" {
					h.localClientWriteMu.Lock()
					_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"pong"}`))
					h.localClientWriteMu.Unlock()
					continue
				}
				if ctrl.Type == "resize" && ctrl.Cols > 0 && ctrl.Rows > 0 {
					h.agentWriteMu.Lock()
					_ = currentAgent.WriteMessage(websocket.TextMessage, p)
					h.agentWriteMu.Unlock()
					continue
				}
			}
			h.agentWriteMu.Lock()
			_ = currentAgent.WriteMessage(websocket.TextMessage, p)
			h.agentWriteMu.Unlock()
		}
	}
}
