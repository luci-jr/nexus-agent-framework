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
		{"+55 (91) 8268-7350", "5511999990000"},
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
	req := httptest.NewRequest(http.MethodPost, "/api/ponte/whatsapp", strings.NewReader(body))
	w := httptest.NewRecorder()

	b.HandleWhatsApp(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Esperava status 200 OK, obteve %d", resp.StatusCode)
	}
}
