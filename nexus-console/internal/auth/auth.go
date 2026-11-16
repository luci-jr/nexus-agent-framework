// Package auth concentra a autenticação do Nexus Console.
//
// Regras:
//   - Não existe senha padrão. Sem senha configurada, uma senha aleatória é
//     gerada na inicialização, gravada em .console_pass (0600) e mostrada uma
//     única vez no log.
//   - O navegador nunca recebe a senha de volta. O login devolve um token de
//     sessão aleatório, com validade, que pode ser revogado.
//   - Comparações de segredo são feitas em tempo constante.
//   - O login tem limite de tentativas por endereço.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const (
	// CookieName é o cookie de sessão do console.
	CookieName = "nexus_token"
	// SessionTTL é a validade de uma sessão.
	SessionTTL = 30 * 24 * time.Hour
	// MinPasswordLen é o tamanho mínimo aceito para a senha mestra.
	MinPasswordLen = 12

	maxFailures = 5
	lockWindow  = time.Minute
)

// Senhas que já apareceram em código, exemplos ou tutoriais públicos.
// São tratadas como "sem senha": nunca autenticam ninguém.
var senhasVazadas = map[string]bool{
	"REDACTED_DEFAULT_PASSWORD":          true,
	"nexus2026":                    true,
	"altere_sua_senha_segura":      true,
	"altere_sua_senha_segura_aqui": true,
	"sua_senha_super_segura_aqui":  true,
}

// ErrSenhaFraca é devolvido quando a nova senha não atende ao mínimo.
var ErrSenhaFraca = errors.New("a senha deve ter no mínimo 12 caracteres e não pode ser uma senha de exemplo")

type tentativa struct {
	falhas    int
	bloqueado time.Time
}

// Manager guarda o segredo mestre, as sessões ativas e o limite de tentativas.
type Manager struct {
	passFile string
	noAuth   bool

	mu         sync.Mutex
	envSecret  string
	sessions   map[string]time.Time
	tentativas map[string]*tentativa
	now        func() time.Time
}

// New cria o gerenciador. Se nenhuma senha estiver configurada, gera uma e a
// devolve em geradaAgora para que o chamador a mostre uma única vez.
func New(nexusDir string) (m *Manager, geradaAgora string, err error) {
	m = &Manager{
		passFile:   filepath.Join(nexusDir, ".console_pass"),
		noAuth:     os.Getenv("CONSOLE_NO_AUTH") == "true",
		sessions:   make(map[string]time.Time),
		tentativas: make(map[string]*tentativa),
		now:        time.Now,
	}
	for _, nome := range []string{"CONSOLE_PASSWORD", "CONSOLE_AUTH_TOKEN", "NEXUS_AUTH_TOKEN"} {
		if v := strings.TrimSpace(os.Getenv(nome)); v != "" && !senhasVazadas[v] {
			m.envSecret = v
			break
		}
	}
	if m.noAuth || m.secret() != "" {
		return m, "", nil
	}

	geradaAgora, err = randomHex(16)
	if err != nil {
		return nil, "", err
	}
	// Tenta persistir; se o diretório for somente leitura, a senha vale só
	// para este processo.
	if werr := os.WriteFile(m.passFile, []byte(geradaAgora), 0o600); werr != nil {
		m.envSecret = geradaAgora
	}
	return m, geradaAgora, nil
}

// NoAuth informa se o console está em modo local sem autenticação.
func (m *Manager) NoAuth() bool { return m.noAuth }

// secret devolve a senha mestra atual: o arquivo .console_pass tem prioridade
// sobre as variáveis de ambiente, para que a troca de senha valha na hora.
func (m *Manager) secret() string {
	if data, err := os.ReadFile(m.passFile); err == nil {
		if p := strings.TrimSpace(string(data)); p != "" && !senhasVazadas[p] {
			return p
		}
	}
	return m.envSecret
}

// igual compara dois segredos em tempo constante, sem vazar o tamanho.
func igual(a, b string) bool {
	ha := sha256.Sum256([]byte(a))
	hb := sha256.Sum256([]byte(b))
	return subtle.ConstantTimeCompare(ha[:], hb[:]) == 1
}

// CheckPassword confere a senha mestra.
func (m *Manager) CheckPassword(p string) bool {
	s := m.secret()
	p = strings.TrimSpace(p)
	if s == "" || p == "" {
		return false
	}
	return igual(p, s)
}

// SetPassword troca a senha mestra e derruba todas as sessões.
func (m *Manager) SetPassword(nova string) error {
	nova = strings.TrimSpace(nova)
	if len(nova) < MinPasswordLen || senhasVazadas[nova] {
		return ErrSenhaFraca
	}
	if err := os.WriteFile(m.passFile, []byte(nova), 0o600); err != nil {
		return err
	}
	m.mu.Lock()
	m.sessions = make(map[string]time.Time)
	m.mu.Unlock()
	return nil
}

// NewSession cria um token de sessão aleatório.
func (m *Manager) NewSession() (string, error) {
	tok, err := randomHex(32)
	if err != nil {
		return "", err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	agora := m.now()
	for t, exp := range m.sessions {
		if agora.After(exp) {
			delete(m.sessions, t)
		}
	}
	m.sessions[tok] = agora.Add(SessionTTL)
	return tok, nil
}

// ValidSession informa se o token é de uma sessão ativa.
func (m *Manager) ValidSession(tok string) bool {
	if tok == "" {
		return false
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	exp, ok := m.sessions[tok]
	if !ok {
		return false
	}
	if m.now().After(exp) {
		delete(m.sessions, tok)
		return false
	}
	return true
}

// DropSession encerra uma sessão.
func (m *Manager) DropSession(tok string) {
	m.mu.Lock()
	delete(m.sessions, tok)
	m.mu.Unlock()
}

// TokenFromRequest extrai o token apresentado: cabeçalho Authorization,
// cookie de sessão e, somente em handshakes de WebSocket (onde o navegador
// não consegue enviar cabeçalhos), o parâmetro ?token=.
func TokenFromRequest(r *http.Request) string {
	if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
		if t := strings.TrimSpace(strings.TrimPrefix(h, "Bearer ")); t != "" {
			return t
		}
	}
	if c, err := r.Cookie(CookieName); err == nil && c.Value != "" {
		return c.Value
	}
	if isWebSocket(r) {
		return strings.TrimSpace(r.URL.Query().Get("token"))
	}
	return ""
}

func isWebSocket(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("Upgrade"), "websocket")
}

// Authorized informa se a requisição está autenticada: por sessão válida ou,
// para clientes sem navegador (agente do túnel, scripts), pela senha mestra
// enviada como Bearer ou no handshake de WebSocket. A senha mestra nunca é
// aceita por cookie.
func (m *Manager) Authorized(r *http.Request) bool {
	if m.noAuth {
		return true
	}
	tok := TokenFromRequest(r)
	if tok == "" {
		return false
	}
	if m.ValidSession(tok) {
		return true
	}
	if c, err := r.Cookie(CookieName); err == nil && c.Value == tok {
		return false
	}
	return m.CheckPassword(tok)
}

// SessionToken devolve o token de sessão da requisição, se houver um válido.
func (m *Manager) SessionToken(r *http.Request) string {
	if tok := TokenFromRequest(r); m.ValidSession(tok) {
		return tok
	}
	return ""
}

// SetCookie grava o cookie de sessão: HttpOnly, SameSite=Strict e Secure
// quando a requisição chegou por HTTPS (direto ou atrás de proxy).
func SetCookie(w http.ResponseWriter, r *http.Request, tok string) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    tok,
		Path:     "/",
		HttpOnly: true,
		Secure:   isHTTPS(r),
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(SessionTTL / time.Second),
	})
}

func isHTTPS(r *http.Request) bool {
	return r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
}

// ClientKey identifica o cliente para o limite de tentativas.
func ClientKey(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// Locked informa se o cliente está bloqueado por excesso de tentativas e por
// quanto tempo.
func (m *Manager) Locked(key string) (bool, time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.tentativas[key]
	if !ok {
		return false, 0
	}
	if resta := t.bloqueado.Sub(m.now()); resta > 0 {
		return true, resta
	}
	return false, 0
}

// RecordFailure conta uma tentativa de login errada.
func (m *Manager) RecordFailure(key string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.tentativas[key]
	if !ok {
		t = &tentativa{}
		m.tentativas[key] = t
	}
	t.falhas++
	if t.falhas >= maxFailures {
		t.falhas = 0
		t.bloqueado = m.now().Add(lockWindow)
	}
}

// RecordSuccess zera o contador do cliente.
func (m *Manager) RecordSuccess(key string) {
	m.mu.Lock()
	delete(m.tentativas, key)
	m.mu.Unlock()
}

// SameOrigin aceita handshakes de WebSocket sem Origin (clientes que não são
// navegador) ou cuja origem seja o próprio host do console.
func SameOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	origin = strings.TrimPrefix(strings.TrimPrefix(origin, "https://"), "http://")
	return strings.EqualFold(origin, r.Host)
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
