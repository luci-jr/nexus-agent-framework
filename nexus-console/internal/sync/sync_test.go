package sync

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func assinar(segredo, corpo string) string {
	mac := hmac.New(sha256.New, []byte(segredo))
	mac.Write([]byte(corpo))
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

func TestAssinaturaValida(t *testing.T) {
	corpo := `{"ref":"refs/heads/main"}`
	if !assinaturaValida("segredo", []byte(corpo), assinar("segredo", corpo)) {
		t.Fatal("assinatura correta deveria passar")
	}
	for nome, cab := range map[string]string{
		"vazia":         "",
		"sem prefixo":   strings.TrimPrefix(assinar("segredo", corpo), "sha256="),
		"outro segredo": assinar("outro", corpo),
		"outro corpo":   assinar("segredo", corpo+" "),
		"hex inválido":  "sha256=zz",
	} {
		if assinaturaValida("segredo", []byte(corpo), cab) {
			t.Errorf("%s: não deveria passar", nome)
		}
	}
}

func TestWebhookRecusaSemSegredoOuAssinatura(t *testing.T) {
	s := NewSyncer(t.TempDir())
	chamar := func(assinatura string) int {
		r := httptest.NewRequest(http.MethodPost, "/api/webhook/github", strings.NewReader("{}"))
		if assinatura != "" {
			r.Header.Set("X-Hub-Signature-256", assinatura)
		}
		w := httptest.NewRecorder()
		s.HandleWebhookGitHub(w, r)
		return w.Result().StatusCode
	}

	t.Setenv("GITHUB_WEBHOOK_SECRET", "")
	if got := chamar(assinar("x", "{}")); got != http.StatusServiceUnavailable {
		t.Errorf("sem segredo configurado esperava 503, veio %d", got)
	}
	t.Setenv("GITHUB_WEBHOOK_SECRET", "segredo")
	if got := chamar(""); got != http.StatusUnauthorized {
		t.Errorf("sem assinatura esperava 401, veio %d", got)
	}
	if got := chamar(assinar("errado", "{}")); got != http.StatusUnauthorized {
		t.Errorf("assinatura errada esperava 401, veio %d", got)
	}
}
