package bridge

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCleanPhoneNumber(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"5511999990000@s.whatsapp.net", "5511999990000"},
		{"+55 (11) 99999-0000", "5511999990000"},
		{"5511999990000", "5511999990000"},
		{"user@c.us", ""},
	}

	for _, c := range cases {
		got := cleanPhoneNumber(c.input)
		if got != c.expected {
			t.Errorf("cleanPhoneNumber(%q) = %q; esperado %q", c.input, got, c.expected)
		}
	}
}

func TestBridgeUnauthorized(t *testing.T) {
	b := NewBridge("/tmp")
	b.allowedNumbers = map[string]bool{"5511999990000": true}

	res, err := b.Execute(context.Background(), Request{
		Sender: "551199999999",
		Text:   "/status",
	})
	if err != nil {
		t.Fatalf("Erro inesperado: %v", err)
	}
	if res.OK {
		t.Errorf("Esperava rejeição para número não autorizado")
	}
	if res.Error != "unauthorized_sender" {
		t.Errorf("Esperava erro unauthorized_sender, obteve %q", res.Error)
	}
}

func TestBridgeQuickCommands(t *testing.T) {
	b := NewBridge("/tmp")
	b.allowedNumbers = map[string]bool{"5511999990000": true}

	// 1. Status
	res, err := b.Execute(context.Background(), Request{
		Sender: "5511999990000@s.whatsapp.net",
		Text:   "/status",
	})
	if err != nil {
		t.Fatalf("Erro no /status: %v", err)
	}
	if !res.OK {
		t.Errorf("Esperava OK true no /status")
	}
	if !strings.Contains(res.Response, "Nexus Lucy Core Online") {
		t.Errorf("Resposta inesperada no /status: %s", res.Response)
	}

	// 2. Reset
	resReset, err := b.Execute(context.Background(), Request{
		Sender: "5511999990000",
		Text:   "/reset",
	})
	if err != nil {
		t.Fatalf("Erro no /reset: %v", err)
	}
	if !resReset.OK || !strings.Contains(resReset.Response, "reiniciada") {
		t.Errorf("Resposta inesperada no /reset: %s", resReset.Response)
	}
}

func TestHandleWhatsAppHTTP(t *testing.T) {
	b := NewBridge("/tmp")
	b.allowedNumbers = map[string]bool{"5511999990000": true}

	// Payload JSON válido com comando /status
	body := `{"sender":"5511999990000","text":"/status"}`
	chamar := func(token string) int {
		req := httptest.NewRequest(http.MethodPost, "/api/ponte/whatsapp", strings.NewReader(body))
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		b.HandleWhatsApp(w, req)
		return w.Result().StatusCode
	}

	// Sem BRIDGE_AUTH_TOKEN configurado a ponte fica desligada.
	b.authToken = ""
	if got := chamar(""); got != http.StatusServiceUnavailable {
		t.Errorf("sem token configurado esperava 503, obteve %d", got)
	}

	b.authToken = "token-de-teste"
	if got := chamar(""); got != http.StatusUnauthorized {
		t.Errorf("sem token na requisição esperava 401, obteve %d", got)
	}
	if got := chamar("errado"); got != http.StatusUnauthorized {
		t.Errorf("token errado esperava 401, obteve %d", got)
	}
	if got := chamar("token-de-teste"); got != http.StatusOK {
		t.Errorf("token certo esperava 200, obteve %d", got)
	}
}

func TestListaVaziaNaoAutorizaNinguem(t *testing.T) {
	b := NewBridge("/tmp")
	b.allowedNumbers = map[string]bool{}
	res, _ := b.Execute(context.Background(), Request{Sender: "5511999990000", Text: "/status"})
	if res.OK {
		t.Error("com a lista de números vazia ninguém deveria ser autorizado")
	}
}
