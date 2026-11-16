package main

import (
	"crypto/tls"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

const (
	AgentVersion    = "1.0.0"
	DefaultEndpoint = "wss://nexus-console.lucivaldo.cloud/ws/tunnel/agent"
)

func resolveToken(tokenFlag string) string {
	if tokenFlag != "" {
		return tokenFlag
	}
	if t := os.Getenv("CONSOLE_AUTH_TOKEN"); t != "" {
		return t
	}
	if t := os.Getenv("NEXUS_AUTH_TOKEN"); t != "" {
		return t
	}

	// Tenta ler .console_pass do repositório local
	home, _ := os.UserHomeDir()
	candidatePaths := []string{
		filepath.Join(home, "Documentos/GitHub/projetos/nexus-ecosystem/.console_pass"),
		filepath.Join(home, ".console_pass"),
	}
	for _, p := range candidatePaths {
		if data, err := os.ReadFile(p); err == nil {
			if s := strings.TrimSpace(string(data)); s != "" {
				return s
			}
		}
	}
	// Sem senha padrão: o agente não se conecta sem credencial explícita.
	return ""
}

func main() {
	serverURL := flag.String("url", DefaultEndpoint, "URL WebSocket do túnel do Nexus Console")
	token := flag.String("token", "", "Token / Senha Mestra de autenticação")
	shellPath := flag.String("shell", "", "Shell a ser executado (padrão: $SHELL ou /bin/bash)")
	flag.Parse()

	masterToken := resolveToken(*token)
	if masterToken == "" {
		log.Fatal("Nenhuma credencial encontrada. Use -token, NEXUS_AUTH_TOKEN ou um arquivo .console_pass.")
	}

	log.Printf("🌌 [NEXUS AGENT v%s] Inicializando agente reverso de terminal local...", AgentVersion)
	log.Printf("🔗 [NEXUS AGENT] Servidor alvo: %s", *serverURL)

	// Intercepta sinais do sistema para encerramento gracioso
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("\n🛑 [NEXUS AGENT] Encerrando agente reverso...")
		os.Exit(0)
	}()

	selectedShell := *shellPath
	if selectedShell == "" {
		selectedShell = os.Getenv("SHELL")
		if selectedShell == "" {
			selectedShell = "/bin/bash"
		}
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "/tmp"
	}

	// Loop infinito de reconexão resiliente
	for {
		err := runSession(*serverURL, masterToken, selectedShell, homeDir)
		if err != nil {
			log.Printf("⚠️ [NEXUS AGENT] Sessão desconectada: %v. Reconectando em 3s...", err)
		}
		time.Sleep(3 * time.Second)
	}
}

func runSession(rawURL, token, shell, homeDir string) error {
	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("URL inválida: %w", err)
	}

	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()

	dialer := websocket.Dialer{
		TLSClientConfig:  &tls.Config{InsecureSkipVerify: false},
		HandshakeTimeout: 10 * time.Second,
	}

	header := http.Header{}
	header.Set("User-Agent", "NexusLocalAgent/"+AgentVersion)

	log.Printf("🔌 [NEXUS AGENT] Conectando ao túnel do Nexus Console...")
	conn, resp, err := dialer.Dial(u.String(), header)
	if err != nil {
		if resp != nil {
			return fmt.Errorf("falha ao discar (HTTP %d): %w", resp.StatusCode, err)
		}
		return fmt.Errorf("falha ao discar: %w", err)
	}
	defer conn.Close()

	log.Printf("✅ [NEXUS AGENT] Conexão estabelecida com sucesso com a nuvem Nexus!")

	var wsWriteMu sync.Mutex

	// Inicia o shell local com PTY
	cmd := exec.Command(shell, "--login")
	cmd.Dir = homeDir
	cmd.Env = append(os.Environ(),
		"TERM=xterm-256color",
		"COLORTERM=truecolor",
		"NEXUS_NODE=local",
	)

	ptyFile, err := pty.Start(cmd)
	if err != nil {
		return fmt.Errorf("falha ao iniciar PTY local: %w", err)
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

	// Configura timeouts de leitura e Pong handler
	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Goroutine: Ticker Keep-Alive ping a cada 15 segundos protegido por mutex
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			wsWriteMu.Lock()
			err := conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"ping"}`))
			wsWriteMu.Unlock()
			if err != nil {
				closeAll()
				return
			}
		}
	}()

	// Goroutine: Lê saída do PTY local e envia como BinaryMessage para a nuvem
	go func() {
		defer closeAll()
		buf := make([]byte, 4096)
		for {
			n, err := ptyFile.Read(buf)
			if err != nil {
				if err != io.EOF {
					log.Printf("ℹ️ [NEXUS AGENT] PTY stdout encerrado: %v", err)
				}
				return
			}
			wsWriteMu.Lock()
			err = conn.WriteMessage(websocket.BinaryMessage, buf[:n])
			wsWriteMu.Unlock()
			if err != nil {
				return
			}
		}
	}()

	// Loop principal: Lê do WebSocket e repassa para o PTY local
	for {
		msgType, p, err := conn.ReadMessage()
		if err != nil {
			return err
		}
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		if msgType == websocket.TextMessage {
			var ctrl struct {
				Type string `json:"type"`
				Cols uint16 `json:"cols"`
				Rows uint16 `json:"rows"`
			}
			if err := json.Unmarshal(p, &ctrl); err == nil {
				if ctrl.Type == "pong" {
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
				return err
			}
		}
	}
}
