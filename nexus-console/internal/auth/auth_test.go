package auth

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func limparEnv(t *testing.T) {
	t.Helper()
	for _, k := range []string{"CONSOLE_PASSWORD", "CONSOLE_AUTH_TOKEN", "NEXUS_AUTH_TOKEN", "CONSOLE_NO_AUTH"} {
		t.Setenv(k, "")
	}
}

func TestSemSenhaConfiguradaGeraUmaAleatoria(t *testing.T) {
	limparEnv(t)
	dir := t.TempDir()
	m, gerada, err := New(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(gerada) < 32 {
		t.Fatalf("esperava senha gerada longa, veio %q", gerada)
	}
	if !m.CheckPassword(gerada) {
		t.Fatal("a senha gerada deveria autenticar")
	}
	info, err := os.Stat(filepath.Join(dir, ".console_pass"))
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("permissão de .console_pass = %v, esperava 0600", info.Mode().Perm())
	}
	_, outra, _ := New(t.TempDir())
	if outra == gerada {
		t.Fatal("duas instalações não podem gerar a mesma senha")
	}
}

func TestSenhasVazadasNuncaAutenticam(t *testing.T) {
	for senha := range senhasVazadas {
		limparEnv(t)
		t.Setenv("CONSOLE_PASSWORD", senha)
		m, gerada, err := New(t.TempDir())
		if err != nil {
			t.Fatal(err)
		}
		if gerada == "" {
			t.Fatalf("%q deveria ser tratada como sem senha", senha)
		}
		if m.CheckPassword(senha) {
			t.Fatalf("a senha pública %q não pode autenticar", senha)
		}
	}
}

func TestSenhaVazadaNoArquivoEhIgnorada(t *testing.T) {
	limparEnv(t)
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, ".console_pass"), []byte("REDACTED_DEFAULT_PASSWORD\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	m, gerada, err := New(dir)
	if err != nil {
		t.Fatal(err)
	}
	if gerada == "" || m.CheckPassword("REDACTED_DEFAULT_PASSWORD") {
		t.Fatal("senha pública no arquivo deveria ser substituída")
	}
}

func TestConsolePasswordDoEnvEhLida(t *testing.T) {
	limparEnv(t)
	t.Setenv("CONSOLE_PASSWORD", "uma-senha-bem-comprida")
	m, gerada, err := New(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if gerada != "" {
		t.Fatal("não deveria gerar senha quando CONSOLE_PASSWORD está definida")
	}
	if !m.CheckPassword("uma-senha-bem-comprida") || m.CheckPassword("outra") || m.CheckPassword("") {
		t.Fatal("CheckPassword errado")
	}
}

func novo(t *testing.T) *Manager {
	t.Helper()
	limparEnv(t)
	t.Setenv("CONSOLE_PASSWORD", "uma-senha-bem-comprida")
	m, _, err := New(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	return m
}

func TestSessaoNaoEhASenhaEExpira(t *testing.T) {
	m := novo(t)
	tok, err := m.NewSession()
	if err != nil {
		t.Fatal(err)
	}
	if tok == "uma-senha-bem-comprida" || len(tok) != 64 {
		t.Fatalf("token de sessão inesperado: %q", tok)
	}
	if !m.ValidSession(tok) {
		t.Fatal("sessão recém-criada deveria valer")
	}
	agora := time.Now()
	m.now = func() time.Time { return agora.Add(SessionTTL + time.Second) }
	if m.ValidSession(tok) {
		t.Fatal("sessão deveria ter expirado")
	}
}

func TestAuthorized(t *testing.T) {
	m := novo(t)
	tok, _ := m.NewSession()

	req := func(mod func(*http.Request)) *http.Request {
		r := httptest.NewRequest(http.MethodGet, "/api/file?path=x", nil)
		mod(r)
		return r
	}
	casos := []struct {
		nome string
		r    *http.Request
		quer bool
	}{
		{"sem nada", req(func(*http.Request) {}), false},
		{"sessão no cookie", req(func(r *http.Request) { r.AddCookie(&http.Cookie{Name: CookieName, Value: tok}) }), true},
		{"sessão no Bearer", req(func(r *http.Request) { r.Header.Set("Authorization", "Bearer "+tok) }), true},
		{"senha no Bearer (agente)", req(func(r *http.Request) { r.Header.Set("Authorization", "Bearer uma-senha-bem-comprida") }), true},
		{"senha no cookie é recusada", req(func(r *http.Request) {
			r.AddCookie(&http.Cookie{Name: CookieName, Value: "uma-senha-bem-comprida"})
		}), false},
		{"token na URL fora de WebSocket é ignorado", httptest.NewRequest(http.MethodGet, "/api/file?token="+tok, nil), false},
		{"token na URL em WebSocket", req(func(r *http.Request) {
			r.URL.RawQuery = "token=" + tok
			r.Header.Set("Upgrade", "websocket")
		}), true},
		{"senha padrão antiga", req(func(r *http.Request) { r.Header.Set("Authorization", "Bearer REDACTED_DEFAULT_PASSWORD") }), false},
	}
	for _, c := range casos {
		if got := m.Authorized(c.r); got != c.quer {
			t.Errorf("%s: Authorized = %v, esperava %v", c.nome, got, c.quer)
		}
	}

	m.DropSession(tok)
	if m.Authorized(req(func(r *http.Request) { r.Header.Set("Authorization", "Bearer "+tok) })) {
		t.Error("sessão encerrada não pode autorizar")
	}
}

func TestTrocaDeSenhaDerrubaSessoes(t *testing.T) {
	m := novo(t)
	tok, _ := m.NewSession()
	if err := m.SetPassword("curta"); err != ErrSenhaFraca {
		t.Fatalf("senha curta deveria ser recusada, veio %v", err)
	}
	if err := m.SetPassword("REDACTED_DEFAULT_PASSWORD"); err != ErrSenhaFraca {
		t.Fatalf("senha pública deveria ser recusada, veio %v", err)
	}
	if err := m.SetPassword("nova-senha-bem-comprida"); err != nil {
		t.Fatal(err)
	}
	if m.ValidSession(tok) {
		t.Fatal("trocar a senha deveria derrubar as sessões")
	}
	if m.CheckPassword("uma-senha-bem-comprida") || !m.CheckPassword("nova-senha-bem-comprida") {
		t.Fatal("a senha nova deveria valer no lugar da antiga")
	}
}

func TestLimiteDeTentativas(t *testing.T) {
	m := novo(t)
	agora := time.Now()
	m.now = func() time.Time { return agora }
	for i := 0; i < maxFailures-1; i++ {
		m.RecordFailure("1.2.3.4")
	}
	if b, _ := m.Locked("1.2.3.4"); b {
		t.Fatal("ainda não deveria bloquear")
	}
	m.RecordFailure("1.2.3.4")
	if b, _ := m.Locked("1.2.3.4"); !b {
		t.Fatal("deveria bloquear após o limite")
	}
	if b, _ := m.Locked("5.6.7.8"); b {
		t.Fatal("outro endereço não deveria ser afetado")
	}
	m.now = func() time.Time { return agora.Add(lockWindow + time.Second) }
	if b, _ := m.Locked("1.2.3.4"); b {
		t.Fatal("o bloqueio deveria expirar")
	}
}

func TestCookieSeguro(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
	r.Header.Set("X-Forwarded-Proto", "https")
	SetCookie(w, r, "abc")
	c := w.Result().Cookies()[0]
	if !c.HttpOnly || !c.Secure || c.SameSite != http.SameSiteStrictMode {
		t.Fatalf("cookie inseguro: %+v", c)
	}
}

func TestSameOrigin(t *testing.T) {
	casos := []struct {
		origin, host string
		quer         bool
	}{
		{"", "nexus.exemplo.com", true},
		{"https://nexus.exemplo.com", "nexus.exemplo.com", true},
		{"http://localhost:8090", "localhost:8090", true},
		{"https://site-malicioso.com", "nexus.exemplo.com", false},
	}
	for _, c := range casos {
		r := httptest.NewRequest(http.MethodGet, "/ws/terminal", nil)
		r.Host = c.host
		if c.origin != "" {
			r.Header.Set("Origin", c.origin)
		}
		if got := SameOrigin(r); got != c.quer {
			t.Errorf("origin %q host %q: %v, esperava %v", c.origin, c.host, got, c.quer)
		}
	}
}

func TestNoAuthLiberaTudo(t *testing.T) {
	limparEnv(t)
	t.Setenv("CONSOLE_NO_AUTH", "true")
	m, gerada, err := New(t.TempDir())
	if err != nil || gerada != "" {
		t.Fatalf("modo local não deveria gerar senha (err=%v)", err)
	}
	if !m.Authorized(httptest.NewRequest(http.MethodGet, "/", nil)) {
		t.Fatal("CONSOLE_NO_AUTH=true deveria liberar")
	}
}
