package bridge

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Request é o payload recebido do webhook do n8n / Evolution API
type Request struct {
	Sender  string `json:"sender"`  // Número do WhatsApp (ex: "5511999990000" ou "5511999990000@s.whatsapp.net")
	Text    string `json:"text"`    // Mensagem / Comando enviado pelo usuário
	Name    string `json:"name"`    // Nome do remetente (PushName)
	Engine  string `json:"engine"`  // "agy" (padrão) ou "claude"
	Session string `json:"session"` // ID de sessão forçado (opcional)
}

// Response é a resposta enviada de volta para o n8n despachar no WhatsApp
type Response struct {
	OK             bool    `json:"ok"`
	Response       string  `json:"response"`
	ConversationID string  `json:"conversation_id,omitempty"`
	Engine         string  `json:"engine"`
	Sender         string  `json:"sender"`
	DurationSec    float64 `json:"duration_seconds,omitempty"`
	Error          string  `json:"error,omitempty"`
}

// AgyJSONResult espelha a saída JSON do comando agy --output-format json
type AgyJSONResult struct {
	ConversationID string                 `json:"conversation_id"`
	Status         string                 `json:"status"`
	Response       string                 `json:"response"`
	DurationSec    float64                `json:"duration_seconds"`
	NumTurns       int                    `json:"num_turns"`
	Usage          map[string]interface{} `json:"usage"`
}

// Session mantém o estado de conversa por remetente
type Session struct {
	Sender         string    `json:"sender"`
	Engine         string    `json:"engine"`
	ConversationID string    `json:"conversation_id"`
	LastActive     time.Time `json:"last_active"`
	Turns          int       `json:"turns"`
}

// Bridge gerencia a execução headless de agentes e sessões WhatsApp
type Bridge struct {
	nexusDir       string
	allowedNumbers map[string]bool
	authToken      string
	defaultEngine  string
	sessionsFile   string
	sessions       map[string]*Session
	evolutionURL   string
	evolutionToken string
	mu             sync.RWMutex
}

var nonDigitsRegex = regexp.MustCompile(`[^\d]`)

func cleanPhoneNumber(raw string) string {
	cleaned := strings.Split(raw, "@")[0]
	return nonDigitsRegex.ReplaceAllString(cleaned, "")
}

// NewBridge inicializa o módulo de ponte
func NewBridge(nexusDir string) *Bridge {
	allowed := make(map[string]bool)

	// Número do desenvolvedor como dono primário padrão
	allowed["5511999990000"] = true

	// Adiciona números extras configurados na variável de ambiente
	if envNums := os.Getenv("AUTHORIZED_WHATSAPP_NUMBERS"); envNums != "" {
		for _, num := range strings.Split(envNums, ",") {
			cleaned := cleanPhoneNumber(strings.TrimSpace(num))
			if cleaned != "" {
				allowed[cleaned] = true
			}
		}
	}

	sessionsDir := filepath.Join(nexusDir, ".system_generated")
	_ = os.MkdirAll(sessionsDir, 0755)
	sessionsPath := filepath.Join(sessionsDir, "whatsapp_sessions.json")

	evoURL := os.Getenv("EVOLUTION_URL")
	if evoURL == "" {
		evoURL = "http://evolution_go:4000"
	}
	evoToken := os.Getenv("EVOLUTION_TOKEN")
	if evoToken == "" {
		evoToken = "REDACTED_EVOLUTION_TOKEN"
	}

	b := &Bridge{
		nexusDir:       nexusDir,
		allowedNumbers: allowed,
		authToken:      os.Getenv("BRIDGE_AUTH_TOKEN"),
		defaultEngine:  "agy",
		sessionsFile:   sessionsPath,
		sessions:       make(map[string]*Session),
		evolutionURL:   strings.TrimRight(evoURL, "/"),
		evolutionToken: evoToken,
	}

	if envEngine := os.Getenv("BRIDGE_DEFAULT_ENGINE"); envEngine != "" {
		b.defaultEngine = envEngine
	}

	b.loadSessions()
	return b
}

func (b *Bridge) loadSessions() {
	b.mu.Lock()
	defer b.mu.Unlock()

	data, err := os.ReadFile(b.sessionsFile)
	if err != nil {
		return
	}

	var loaded map[string]*Session
	if err := json.Unmarshal(data, &loaded); err == nil {
		b.sessions = loaded
		log.Printf("📱 [NEXUS BRIDGE] %d sessões WhatsApp carregadas de %s", len(loaded), b.sessionsFile)
	}
}

func (b *Bridge) saveSessionsLocked() {
	data, err := json.MarshalIndent(b.sessions, "", "  ")
	if err != nil {
		return
	}
	_ = os.WriteFile(b.sessionsFile, data, 0644)
}

func (b *Bridge) getSession(sender, engine string) *Session {
	b.mu.Lock()
	defer b.mu.Unlock()

	cleaned := cleanPhoneNumber(sender)
	sess, exists := b.sessions[cleaned]
	if !exists {
		sess = &Session{
			Sender:     cleaned,
			Engine:     engine,
			LastActive: time.Now(),
			Turns:      0,
		}
		b.sessions[cleaned] = sess
		b.saveSessionsLocked()
		return sess
	}

	// Reinicia a conversa após 6 horas de inatividade
	if time.Since(sess.LastActive) > 6*time.Hour {
		log.Printf("⏳ [NEXUS BRIDGE] Sessão de %s expirou (>6h). Iniciando novo contexto.", cleaned)
		sess.ConversationID = ""
		sess.Turns = 0
	}

	sess.Engine = engine
	sess.LastActive = time.Now()
	b.saveSessionsLocked()
	return sess
}

func (b *Bridge) resetSession(sender string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	cleaned := cleanPhoneNumber(sender)
	if sess, exists := b.sessions[cleaned]; exists {
		sess.ConversationID = ""
		sess.Turns = 0
		sess.LastActive = time.Now()
		b.saveSessionsLocked()
		log.Printf("🔄 [NEXUS BRIDGE] Sessão de %s resetada com sucesso.", cleaned)
	}
}

func resolveBinary(name string) string {
	if custom := os.Getenv(strings.ToUpper(name) + "_BIN"); custom != "" {
		if _, err := os.Stat(custom); err == nil {
			return custom
		}
	}

	homeDir, _ := os.UserHomeDir()
	candidates := []string{
		filepath.Join(homeDir, ".local", "bin", name),
		filepath.Join("/usr", "local", "bin", name),
		filepath.Join("/usr", "bin", name),
	}

	for _, cand := range candidates {
		if _, err := os.Stat(cand); err == nil {
			return cand
		}
	}

	if path, err := exec.LookPath(name); err == nil {
		return path
	}

	return name
}

// Execute executa o prompt headless usando o motor configurado
func (b *Bridge) Execute(ctx context.Context, req Request) (Response, error) {
	start := time.Now()
	sender := cleanPhoneNumber(req.Sender)
	text := strings.TrimSpace(req.Text)
	engine := req.Engine
	if engine == "" {
		engine = b.defaultEngine
	}

	// 1. Verificação de permissões do remetente
	if len(b.allowedNumbers) > 0 && !b.allowedNumbers[sender] {
		log.Printf("🚫 [NEXUS BRIDGE] Tentativa não autorizada do número: %s", sender)
		return Response{
			OK:       false,
			Sender:   sender,
			Engine:   engine,
			Response: "Acesso não autorizado. Apenas o desenvolvedor e contatos autorizados podem interagir com o Lucy.",
			Error:    "unauthorized_sender",
		}, nil
	}

	// 2. Interceptação de comandos rápidos
	lowerText := strings.ToLower(text)
	if lowerText == "/nova" || lowerText == "/novo" || lowerText == "/clear" || lowerText == "/reset" {
		b.resetSession(sender)
		return Response{
			OK:          true,
			Sender:      sender,
			Engine:      engine,
			Response:    "Sessão do Lucy reiniciada! Contexto zerado com sucesso. O que tu queres construir agora, irmão?",
			DurationSec: time.Since(start).Seconds(),
		}, nil
	}

	if lowerText == "/status" || lowerText == "/ping" {
		session := b.getSession(sender, engine)
		return Response{
			OK:     true,
			Sender: sender,
			Engine: engine,
			Response: fmt.Sprintf("🌌 *Nexus Lucy Core Online*\n\n• Motor ativo: `%s`\n• Remetente: `%s`\n• Sessão atual: `%s`\n• Turnos acumulados: %d\n• Uptime: 100%% verde no cluster.",
				engine, sender, session.ConversationID, session.Turns),
			DurationSec: time.Since(start).Seconds(),
		}, nil
	}

	if lowerText == "/ajuda" || lowerText == "/help" {
		return Response{
			OK:     true,
			Sender: sender,
			Engine: engine,
			Response: "🌌 *Comandos Disponíveis do Lucy WhatsApp*\n\n" +
				"• `/nova` ou `/reset`: Zera o histórico e inicia uma nova conversa.\n" +
				"• `/status`: Mostra a saúde do cérebro e o motor em execução.\n" +
				"• `/ajuda`: Exibe esta lista de instruções.\n\n" +
				"Qualquer outra mensagem é processada diretamente com as ferramentas e a memória contínua do Lucy!",
			DurationSec: time.Since(start).Seconds(),
		}, nil
	}

	// 3. Obtenção da sessão do usuário
	session := b.getSession(sender, engine)
	if req.Session != "" {
		session.ConversationID = req.Session
	}

	// 4. Execução do Motor de IA
	var outputText string
	var finalConversationID string

	switch engine {
	case "claude":
		binPath := resolveBinary("claude")
		args := []string{
			"-p", text,
			"--output-format", "text",
			"--permission-mode", "acceptEdits",
			"--allowedTools", "Bash", "Read", "Write", "Edit", "Glob", "Grep", "Skill", "Task", "WebFetch", "WebSearch",
		}
		if session.ConversationID != "" {
			args = append(args, "--resume", session.ConversationID)
		}

		cmd := exec.CommandContext(ctx, binPath, args...)
		cmd.Dir = b.nexusDir
		out, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("❌ [NEXUS BRIDGE] Erro ao executar claude: %v (saída: %s)", err, string(out))
			return Response{
				OK:          false,
				Sender:      sender,
				Engine:      engine,
				Response:    fmt.Sprintf("Houve uma oscilação na execução do Claude Code: %s", string(out)),
				Error:       err.Error(),
				DurationSec: time.Since(start).Seconds(),
			}, nil
		}
		outputText = strings.TrimSpace(string(out))
		finalConversationID = session.ConversationID

	default: // "agy" (Antigravity CLI)
		binPath := resolveBinary("agy")
		args := []string{
			"-p", text,
			"--output-format", "json",
			"--dangerously-skip-permissions",
			"--print-timeout", "5m",
		}
		if session.ConversationID != "" {
			args = append(args, "--conversation", session.ConversationID)
		}

		cmd := exec.CommandContext(ctx, binPath, args...)
		cmd.Dir = b.nexusDir

		// Herda variáveis de ambiente locais essenciais
		cmd.Env = os.Environ()

		out, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("❌ [NEXUS BRIDGE] Erro ao executar agy: %v (saída: %s)", err, string(out))
			// Fallback: se houver saída de texto mesmo com erro
			outputText = strings.TrimSpace(string(out))
			if outputText == "" {
				outputText = fmt.Sprintf("Erro ao executar Antigravity CLI: %v", err)
			}
		} else {
			// Tenta decodificar o JSON estruturado do agy
			var agyRes AgyJSONResult
			if jsonErr := json.Unmarshal(out, &agyRes); jsonErr == nil && agyRes.Response != "" {
				outputText = strings.TrimSpace(agyRes.Response)
				finalConversationID = agyRes.ConversationID
			} else {
				outputText = strings.TrimSpace(string(out))
			}
		}
	}

	// Atualiza sessão com o ID gerado pelo motor
	b.mu.Lock()
	if finalConversationID != "" {
		session.ConversationID = finalConversationID
	}
	session.Turns++
	session.LastActive = time.Now()
	b.saveSessionsLocked()
	b.mu.Unlock()

	return Response{
		OK:             true,
		Response:       outputText,
		ConversationID: session.ConversationID,
		Engine:         engine,
		Sender:         sender,
		DurationSec:    time.Since(start).Seconds(),
	}, nil
}

// HandleWhatsApp é o handler HTTP para POST /api/ponte/whatsapp
func (b *Bridge) HandleWhatsApp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido (use POST)", http.StatusMethodNotAllowed)
		return
	}

	// Validação de token se configurado
	if b.authToken != "" {
		authHeader := r.Header.Get("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			token = r.Header.Get("X-Bridge-Token")
		}
		if token == "" {
			token = r.URL.Query().Get("token")
		}

		if token != b.authToken {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Não autorizado"})
			return
		}
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "JSON inválido: " + err.Error()})
		return
	}

	if strings.TrimSpace(req.Text) == "" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Parâmetro 'text' é obrigatório"})
		return
	}

	// Limite de timeout global para a execução da ponte (5 minutos)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	log.Printf("📩 [NEXUS BRIDGE] Mensagem recebida de %s: %q", cleanPhoneNumber(req.Sender), req.Text)

	res, err := b.Execute(ctx, req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(res)
}

// HandleStatus retorna o status da ponte
func (b *Bridge) HandleStatus(w http.ResponseWriter, r *http.Request) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	status := map[string]interface{}{
		"status":          "online",
		"default_engine":  b.defaultEngine,
		"allowed_numbers": len(b.allowedNumbers),
		"active_sessions": len(b.sessions),
		"bin_agy":         resolveBinary("agy"),
		"bin_claude":      resolveBinary("claude"),
		"timestamp":       time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(status)
}

// HandleSessions lista as sessões ativas
func (b *Bridge) HandleSessions(w http.ResponseWriter, r *http.Request) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(b.sessions)
}

// SendWhatsAppText despacha uma mensagem de texto física para o celular via Evolution Go
func (b *Bridge) SendWhatsAppText(ctx context.Context, number, text string) (map[string]interface{}, error) {
	cleaned := cleanPhoneNumber(number)
	if cleaned == "" {
		return nil, fmt.Errorf("número de telefone inválido")
	}

	payload := map[string]interface{}{
		"number": cleaned,
		"text":   text,
		"delay":  0,
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	reqURL := fmt.Sprintf("%s/send/text", b.evolutionURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", b.evolutionToken)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar na Evolution Go (%s): %w", b.evolutionURL, err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("resposta inválida da Evolution Go (HTTP %d)", resp.StatusCode)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return result, fmt.Errorf("Evolution Go retornou HTTP %d: %v", resp.StatusCode, result)
	}

	return result, nil
}

// HandleSendReal é o handler HTTP para POST /api/ponte/whatsapp/send-real
func (b *Bridge) HandleSendReal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido (use POST)", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Number string `json:"number"`
		Text   string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "JSON inválido: " + err.Error()})
		return
	}

	text := strings.TrimSpace(req.Text)
	if text == "" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Mensagem é obrigatória"})
		return
	}

	number := strings.TrimSpace(req.Number)
	if number == "" {
		number = "5511999990000" // Dono padrão
	}

	res, err := b.SendWhatsAppText(r.Context(), number, text)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":    false,
			"error": err.Error(),
		})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "Mensagem entregue com sucesso no WhatsApp do celular!",
		"number":  number,
		"data":    res,
	})
}

// HandleAskAndSend executa o prompt no Lucy Headless e despacha a resposta real no WhatsApp do celular
func (b *Bridge) HandleAskAndSend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido (use POST)", http.StatusMethodNotAllowed)
		return
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "JSON inválido: " + err.Error()})
		return
	}

	if strings.TrimSpace(req.Text) == "" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Mensagem é obrigatória"})
		return
	}

	if strings.TrimSpace(req.Sender) == "" {
		req.Sender = "5511999990000"
	}

	// Resposta instantânea (<50ms) para não prender o navegador nem estourar o timeout de 100s do Cloudflare
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"status":  "processing",
		"message": "Pergunta enviada ao Lucy com sucesso! O processamento foi iniciado em segundo plano e a resposta completa será entregue diretamente no teu WhatsApp.",
		"sender":  req.Sender,
	})

	// Processa em background com contexto desacoplado e entrega física no celular
	go func(targetReq Request) {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		log.Printf("🤖 [NEXUS BRIDGE] Executando Lucy em background para %s: %q", targetReq.Sender, targetReq.Text)
		resp, err := b.Execute(bgCtx, targetReq)
		if err != nil {
			log.Printf("❌ [NEXUS BRIDGE] Erro ao executar Lucy em background: %v", err)
			_, _ = b.SendWhatsAppText(bgCtx, targetReq.Sender, fmt.Sprintf("⚠️ [Lucy]: Desculpe, irmão. Tive uma oscilação ao processar: %v", err))
			return
		}

		if resp.OK && resp.Response != "" {
			_, sendErr := b.SendWhatsAppText(bgCtx, targetReq.Sender, resp.Response)
			if sendErr != nil {
				log.Printf("❌ [NEXUS BRIDGE] Falha ao enviar resposta no WhatsApp: %v", sendErr)
			} else {
				log.Printf("✅ [NEXUS BRIDGE] Resposta do Lucy entregue com sucesso no WhatsApp de %s!", targetReq.Sender)
			}
		}
	}(req)
}
