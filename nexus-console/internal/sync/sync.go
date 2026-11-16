// Package sync gerencia a sincronização contínua e bidirecional Git entre PC, Nuvem (AWS EC2) e Celular.
package sync

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

// Syncer gerencia operações atômicas de Git no ecossistema
type Syncer struct {
	nexusDir string
	mu       sync.Mutex
}

// NewSyncer cria uma nova instância do sincronizador Git
func NewSyncer(nexusDir string) *Syncer {
	return &Syncer{nexusDir: nexusDir}
}

// runGit executa comandos git com timeout e credenciais transparentes
func (s *Syncer) runGit(args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = s.nexusDir

	env := os.Environ()
	// Se a Deploy Key do container estiver presente, usa sem prompts bloqueantes
	if _, err := os.Stat("/root/.ssh/id_ed25519"); err == nil {
		env = append(env, "GIT_SSH_COMMAND=ssh -F /dev/null -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new")
	}
	cmd.Env = env

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		errMsg := strings.TrimSpace(stderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}
		return strings.TrimSpace(out.String()), fmt.Errorf("%s", errMsg)
	}
	return strings.TrimSpace(out.String()), nil
}

// Pull atualiza o repositório a partir de origin/main
func (s *Syncer) Pull() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	log.Printf("🔄 [GIT SYNC] Executando git pull origin main em %s...", s.nexusDir)
	out, err := s.runGit("pull", "--rebase", "origin", "main")
	if err != nil {
		// Fallback para merge padrão caso rebase falhe
		outFallback, errFallback := s.runGit("pull", "origin", "main")
		if errFallback != nil {
			return out, fmt.Errorf("pull falhou: %w", err)
		}
		return outFallback, nil
	}
	return out, nil
}

// Push realiza commit e push de alterações locais para origin/main
func (s *Syncer) Push(commitMsg string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	status, err := s.runGit("status", "--porcelain")
	if err != nil {
		return "", fmt.Errorf("falha ao verificar status git: %w", err)
	}
	if strings.TrimSpace(status) == "" {
		return "Nenhuma alteração pendente para sincronizar.", nil
	}

	if commitMsg == "" {
		commitMsg = fmt.Sprintf("sync(mobile): alteração via Nexus Console em %s", time.Now().Format("2006-01-02 15:04:05"))
	}

	if _, err := s.runGit("add", "."); err != nil {
		return "", fmt.Errorf("falha no git add: %w", err)
	}

	if _, err := s.runGit("commit", "-m", commitMsg); err != nil {
		return "", fmt.Errorf("falha no git commit: %w", err)
	}

	out, err := s.runGit("push", "origin", "main")
	if err != nil {
		return out, fmt.Errorf("falha no git push: %w", err)
	}
	return out, nil
}

// AutoSyncAsync dispara em goroutine desvinculada para não travar a resposta HTTP
func (s *Syncer) AutoSyncAsync(commitMsg string) {
	go func() {
		// Pequeno delay para garantir que a escrita em disco foi finalizada
		time.Sleep(500 * time.Millisecond)
		out, err := s.Push(commitMsg)
		if err != nil {
			log.Printf("⚠️ [GIT AUTO-SYNC] Erro no push automático: %v", err)
		} else {
			log.Printf("✅ [GIT AUTO-SYNC] Sucesso: %s", out)
		}
	}()
}

// HandleWebhookGitHub processa notificações de push vindas do GitHub
func (s *Syncer) HandleWebhookGitHub(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// O webhook dispara um git pull: só aceita chamadas assinadas pelo GitHub
	// com o segredo GITHUB_WEBHOOK_SECRET (cabeçalho X-Hub-Signature-256).
	segredo := os.Getenv("GITHUB_WEBHOOK_SECRET")
	if segredo == "" {
		http.Error(w, "Webhook desativado: defina GITHUB_WEBHOOK_SECRET", http.StatusServiceUnavailable)
		return
	}
	corpo, err := io.ReadAll(io.LimitReader(r.Body, 5<<20))
	if err != nil || !assinaturaValida(segredo, corpo, r.Header.Get("X-Hub-Signature-256")) {
		log.Printf("🚫 [GIT WEBHOOK] Assinatura ausente ou inválida (origem: %s)", r.RemoteAddr)
		http.Error(w, "Assinatura inválida", http.StatusUnauthorized)
		return
	}

	event := r.Header.Get("X-GitHub-Event")
	log.Printf("📥 [GIT WEBHOOK] Recebido evento GitHub: %s", event)

	// Dispara o git pull para atualizar o servidor na hora
	out, err := s.Pull()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err != nil {
		log.Printf("❌ [GIT WEBHOOK] Falha ao sincronizar: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":    false,
			"error": err.Error(),
			"event": event,
		})
		return
	}

	log.Printf("✅ [GIT WEBHOOK] Repositório sincronizado instantaneamente: %s", out)
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":        true,
		"message":   "Repositório sincronizado com sucesso a partir do GitHub",
		"output":    out,
		"event":     event,
		"synced_at": time.Now().Format(time.RFC3339),
	})
}

// assinaturaValida confere o HMAC-SHA256 que o GitHub envia em
// X-Hub-Signature-256 ("sha256=<hex>") sobre o corpo da requisição.
func assinaturaValida(segredo string, corpo []byte, cabecalho string) bool {
	const prefixo = "sha256="
	if !strings.HasPrefix(cabecalho, prefixo) {
		return false
	}
	recebida, err := hex.DecodeString(strings.TrimPrefix(cabecalho, prefixo))
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, []byte(segredo))
	mac.Write(corpo)
	return hmac.Equal(recebida, mac.Sum(nil))
}
