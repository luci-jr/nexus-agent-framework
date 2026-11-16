package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/luci-jr/nexus-console/internal/auth"
	"github.com/luci-jr/nexus-console/internal/bridge"
	"github.com/luci-jr/nexus-console/internal/parser"
	"github.com/luci-jr/nexus-console/internal/sync"
	"github.com/luci-jr/nexus-console/internal/terminal"
)

var ConsoleVersion = "2.2.33"

//go:embed web/*
var webFS embed.FS

func determineNexusDir() string {
	if env := os.Getenv("NEXUS_DIR"); env != "" {
		return env
	}
	// Se estiver em container com volume /nexus
	if _, err := os.Stat("/nexus/tasks/todo.md"); err == nil {
		return "/nexus"
	}
	// Se estiver executando na raiz do SSD externo com a pasta nexus-work
	if _, err := os.Stat("nexus-work/tasks/todo.md"); err == nil {
		if abs, err := filepath.Abs("nexus-work"); err == nil {
			return abs
		}
		return "nexus-work"
	}
	// Se estiver executando diretamente dentro de nexus-work no SSD
	if _, err := os.Stat("tasks/todo.md"); err == nil {
		if abs, err := filepath.Abs("."); err == nil {
			return abs
		}
		return "."
	}
	// Se estiver executando localmente dentro de nexus/nexus-console
	parentDir := filepath.Join("..")
	if _, err := os.Stat(filepath.Join(parentDir, "tasks", "todo.md")); err == nil {
		abs, err := filepath.Abs(parentDir)
		if err == nil {
			return abs
		}
		return parentDir
	}
	// Sem pistas: usa o diretório atual
	if abs, err := filepath.Abs("."); err == nil {
		return abs
	}
	return "."
}

func jsonResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Erro ao serializar JSON: %v", err)
	}
}

// authMgr concentra senha mestra, sessões e limite de tentativas (internal/auth).
var authMgr *auth.Manager

// consolePrivado, quando CONSOLE_PRIVATE=true, exige login também nas rotas de
// leitura (tarefas, ADRs, grafo, status, anexos e conteúdo).
var consolePrivado = os.Getenv("CONSOLE_PRIVATE") == "true"

func isAuthorized(r *http.Request) bool {
	return authMgr.Authorized(r)
}

func naoAutorizado(w http.ResponseWriter) {
	jsonResponse(w, map[string]interface{}{
		"ok":    false,
		"error": "Acesso não autorizado. Faça login com a Chave Mestra do Nexus para acessar este recurso.",
		"code":  "UNAUTHORIZED",
	}, http.StatusUnauthorized)
}

// requireAuth protege rotas confidenciais (Vault, Terminal, WhatsApp, Deletar)
func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !isAuthorized(r) {
			naoAutorizado(w)
			return
		}
		next(w, r)
	}
}

// authMiddleware cobre as rotas de leitura: públicas por padrão (modo
// visitante), protegidas quando CONSOLE_PRIVATE=true.
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if consolePrivado && !isAuthorized(r) {
			naoAutorizado(w)
			return
		}
		next(w, r)
	}
}

// protegerSePrivado aplica a mesma regra a handlers de arquivos estáticos.
func protegerSePrivado(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if consolePrivado && !isAuthorized(r) {
			naoAutorizado(w)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// nomeAdmin é o nome mostrado para o usuário autenticado (CONSOLE_USER).
func nomeAdmin() string {
	if u := strings.TrimSpace(os.Getenv("CONSOLE_USER")); u != "" {
		return u
	}
	return "admin"
}

func main() {
	nexusDir := determineNexusDir()
	syncer := sync.NewSyncer(nexusDir)
	port := os.Getenv("CONSOLE_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "8090"
	}

	var senhaGerada string
	var errAuth error
	authMgr, senhaGerada, errAuth = auth.New(nexusDir)
	if errAuth != nil {
		log.Fatalf("Falha ao inicializar a autenticação: %v", errAuth)
	}
	if senhaGerada != "" {
		log.Printf("🔐 [NEXUS AUTH] Nenhuma senha configurada. Senha mestra gerada para esta instalação: %s", senhaGerada)
		log.Printf("🔐 [NEXUS AUTH] Guarde-a agora. Para definir a sua, use CONSOLE_PASSWORD ou o arquivo .console_pass.")
	}
	if authMgr.NoAuth() {
		log.Printf("⚠️ [NEXUS AUTH] CONSOLE_NO_AUTH=true: console SEM autenticação. Use apenas em localhost.")
	}

	log.Printf("🌌 [NEXUS CONSOLE] Inicializando servidor web em Go...")
	log.Printf("📂 [NEXUS DIR] Diretório de governança: %s", nexusDir)

	mux := http.NewServeMux()

	// Sub-sistema de arquivos embutido para /web
	staticFS, err := fs.Sub(webFS, "web")
	if err != nil {
		log.Fatalf("Falha ao carregar assets embutidos: %v", err)
	}

	// Servir HTML e estáticos com blindagem anti-cache para atualizações imediatas
	fileServer := http.FileServer(http.FS(staticFS))
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, ".html") || strings.HasSuffix(r.URL.Path, ".css") || strings.HasSuffix(r.URL.Path, ".js") || strings.HasSuffix(r.URL.Path, ".ico") || strings.HasSuffix(r.URL.Path, ".png") || strings.HasSuffix(r.URL.Path, ".jpg") || strings.HasSuffix(r.URL.Path, ".jpeg") || r.URL.Path == "/" {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Header().Set("Pragma", "no-cache")
			w.Header().Set("Expires", "0")
		}
		fileServer.ServeHTTP(w, r)
	})

	// Healthcheck
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, map[string]interface{}{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   ConsoleVersion,
		}, http.StatusOK)
	})

	// API: Status do Sistema e Squad
	mux.HandleFunc("GET /api/status", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		status := parser.GetSystemStatus(nexusDir)
		status.ConsoleVersion = ConsoleVersion
		jsonResponse(w, status, http.StatusOK)
	}))

	// API: Tarefas (todo.md)
	mux.HandleFunc("GET /api/tasks", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		tasks, err := parser.ParseTasks(nexusDir)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao ler tarefas: %v", err)}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, tasks, http.StatusOK)
	}))

	// API: Lições Aprendidas (lessons.md)
	mux.HandleFunc("GET /api/lessons", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		lessons, err := parser.ParseLessons(nexusDir)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao ler lições: %v", err)}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, lessons, http.StatusOK)
	}))

	// API: Listar ADRs
	mux.HandleFunc("GET /api/adrs", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		adrs, err := parser.ListADRs(nexusDir)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao listar ADRs: %v", err)}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, adrs, http.StatusOK)
	}))

	// API: Conteúdo de ADR específico
	mux.HandleFunc("GET /api/adrs/{filename}", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		filename := r.PathValue("filename")
		content, err := parser.GetADRContent(nexusDir, filename)
		if err != nil {
			jsonResponse(w, map[string]string{"error": "ADR não encontrado"}, http.StatusNotFound)
			return
		}
		jsonResponse(w, map[string]string{
			"filename": filename,
			"content":  content,
		}, http.StatusOK)
	}))

	// API: Grafo Neural do Lucy (Nós e Sinapses do Orquestrador)
	mux.HandleFunc("GET /api/graph", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		graph, err := parser.BuildGraphData(nexusDir)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao gerar grafo: %v", err)}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, graph, http.StatusOK)
	}))
	mux.HandleFunc("GET /api/grafo", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		graph, err := parser.BuildGraphData(nexusDir)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao gerar grafo: %v", err)}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, graph, http.StatusOK)
	}))

	// 🔐 Módulo 0: Autenticação & Sessão do Console
	mux.HandleFunc("POST /api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		cliente := auth.ClientKey(r)
		if bloqueado, resta := authMgr.Locked(cliente); bloqueado {
			w.Header().Set("Retry-After", fmt.Sprintf("%d", int(resta.Seconds())+1))
			jsonResponse(w, map[string]interface{}{
				"ok":    false,
				"error": "Muitas tentativas. Aguarde um minuto e tente de novo.",
			}, http.StatusTooManyRequests)
			return
		}

		var payload struct {
			Password string `json:"password"`
			Token    string `json:"token"`
		}
		_ = json.NewDecoder(io.LimitReader(r.Body, 4096)).Decode(&payload)
		provided := strings.TrimSpace(payload.Password)
		if provided == "" {
			provided = strings.TrimSpace(payload.Token)
		}
		if !authMgr.CheckPassword(provided) {
			authMgr.RecordFailure(cliente)
			jsonResponse(w, map[string]interface{}{
				"ok":    false,
				"error": "Chave Mestra ou Senha incorreta.",
			}, http.StatusUnauthorized)
			return
		}
		authMgr.RecordSuccess(cliente)

		// O navegador recebe um token de sessão aleatório, nunca a senha.
		sessao, err := authMgr.NewSession()
		if err != nil {
			jsonResponse(w, map[string]interface{}{"ok": false, "error": "Falha ao criar sessão."}, http.StatusInternalServerError)
			return
		}
		auth.SetCookie(w, r, sessao)

		jsonResponse(w, map[string]interface{}{
			"ok":    true,
			"token": sessao,
			"user":  nomeAdmin(),
			"role":  "admin",
		}, http.StatusOK)
	})

	// 🔐 Módulo 0.1: Login via Traefik ForwardAuth (opcional).
	// Só existe quando CONSOLE_FORWARD_AUTH=true E o proxy já autenticou o
	// usuário (cabeçalho X-Forwarded-User, que o Traefik deve sobrescrever).
	// Sem isso a rota responde 404: ela não pode entregar sessão a qualquer um.
	mux.HandleFunc("GET /auth/google", func(w http.ResponseWriter, r *http.Request) {
		if os.Getenv("CONSOLE_FORWARD_AUTH") != "true" || strings.TrimSpace(r.Header.Get("X-Forwarded-User")) == "" {
			http.NotFound(w, r)
			return
		}
		sessao, err := authMgr.NewSession()
		if err != nil {
			http.Error(w, "Falha ao criar sessão", http.StatusInternalServerError)
			return
		}
		auth.SetCookie(w, r, sessao)
		http.Redirect(w, r, "/?auth=google_success", http.StatusTemporaryRedirect)
	})

	mux.HandleFunc("GET /api/auth/status", func(w http.ResponseWriter, r *http.Request) {
		isNoAuth := authMgr.NoAuth()
		autenticado := isAuthorized(r)
		role := "guest"
		name := "Visitante"
		token := ""
		if autenticado {
			role = "admin"
			name = nomeAdmin()
			// Devolve apenas o token de sessão que o próprio cliente apresentou.
			token = authMgr.SessionToken(r)
		}
		jsonResponse(w, map[string]interface{}{
			"authenticated": autenticado,
			"no_auth_mode":  isNoAuth,
			"token":         token,
			"user":          map[string]interface{}{"name": name, "role": role},
		}, http.StatusOK)
	})

	// 🔐 Módulo 0.2: Logout Global do Console e ForwardAuth
	logoutHandler := func(w http.ResponseWriter, r *http.Request) {
		authMgr.DropSession(auth.TokenFromRequest(r))
		epoch := time.Unix(0, 0)
		dominios := []string{""}
		if d := strings.TrimSpace(os.Getenv("CONSOLE_COOKIE_DOMAIN")); d != "" {
			dominios = append(dominios, d, "."+strings.TrimPrefix(d, "."))
		}
		for _, domain := range dominios {
			http.SetCookie(w, &http.Cookie{
				Name:     auth.CookieName,
				Value:    "",
				Path:     "/",
				Domain:   domain,
				HttpOnly: true,
				MaxAge:   -1,
				Expires:  epoch,
			})
			for _, nome := range []string{"_forward_auth", "_forward_auth_csrf"} {
				http.SetCookie(w, &http.Cookie{
					Name:     nome,
					Value:    "",
					Path:     "/",
					Domain:   domain,
					HttpOnly: true,
					Secure:   true,
					SameSite: http.SameSiteLaxMode,
					MaxAge:   -1,
					Expires:  epoch,
				})
			}
		}
		if r.Method == http.MethodPost {
			jsonResponse(w, map[string]interface{}{"ok": true}, http.StatusOK)
			return
		}
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
	}
	mux.HandleFunc("POST /api/auth/logout", logoutHandler)
	mux.HandleFunc("GET /auth/logout", logoutHandler)

	// API: Alteração Segura de Senha Mestra
	mux.HandleFunc("POST /api/auth/change-password", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			CurrentPassword string `json:"current_password"`
			NewPassword     string `json:"new_password"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 4096)).Decode(&payload); err != nil {
			jsonResponse(w, map[string]interface{}{"ok": false, "error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if !authMgr.CheckPassword(payload.CurrentPassword) {
			jsonResponse(w, map[string]interface{}{"ok": false, "error": "Senha atual incorreta."}, http.StatusUnauthorized)
			return
		}
		if err := authMgr.SetPassword(payload.NewPassword); err != nil {
			if err == auth.ErrSenhaFraca {
				jsonResponse(w, map[string]interface{}{"ok": false, "error": err.Error()}, http.StatusBadRequest)
				return
			}
			jsonResponse(w, map[string]interface{}{"ok": false, "error": fmt.Sprintf("Erro ao salvar senha no disco: %v", err)}, http.StatusInternalServerError)
			return
		}

		// A troca derruba todas as sessões; esta continua com um token novo.
		sessao, err := authMgr.NewSession()
		if err != nil {
			jsonResponse(w, map[string]interface{}{"ok": false, "error": "Senha alterada, mas falhou ao recriar a sessão. Faça login de novo."}, http.StatusInternalServerError)
			return
		}
		auth.SetCookie(w, r, sessao)

		jsonResponse(w, map[string]interface{}{"ok": true, "token": sessao, "message": "Senha mestra alterada com sucesso!"}, http.StatusOK)
	}))

	// API: Leitura Segura de Documento Markdown do Nexus (Restrito)
	mux.HandleFunc("GET /api/file", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		relPath := r.URL.Query().Get("path")
		if relPath == "" {
			jsonResponse(w, map[string]string{"error": "Parâmetro path obrigatório"}, http.StatusBadRequest)
			return
		}
		content, err := parser.GetFileContent(nexusDir, relPath)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao ler arquivo: %v", err)}, http.StatusNotFound)
			return
		}
		jsonResponse(w, map[string]string{
			"path":    relPath,
			"content": content,
		}, http.StatusOK)
	}))

	// 🧠 Módulo Segundo Cérebro (Vault): Árvore de Arquivos (Restrito)
	mux.HandleFunc("GET /api/tree", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		tree, err := parser.BuildVaultTree(nexusDir)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, tree, http.StatusOK)
	}))

	// 🧠 Módulo Segundo Cérebro (Vault): Salvar Arquivo (Restrito)
	mux.HandleFunc("POST /api/file", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido: " + err.Error()}, http.StatusBadRequest)
			return
		}
		if payload.Path == "" {
			jsonResponse(w, map[string]string{"error": "Parâmetro path obrigatório"}, http.StatusBadRequest)
			return
		}
		if err := parser.SaveFileContent(nexusDir, payload.Path, payload.Content); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(vault): alteração no arquivo " + payload.Path)
		jsonResponse(w, map[string]interface{}{"ok": true, "path": payload.Path, "saved_at": time.Now().Format(time.RFC3339)}, http.StatusOK)
	}))

	// 🧠 Módulo Segundo Cérebro (Vault): Criar Nova Nota (Restrito)
	mux.HandleFunc("POST /api/file/new", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if payload.Path == "" {
			jsonResponse(w, map[string]string{"error": "Nome/caminho do arquivo obrigatório"}, http.StatusBadRequest)
			return
		}
		if err := parser.CreateNewNote(nexusDir, payload.Path, payload.Content); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		syncer.AutoSyncAsync("sync(vault): nova nota " + payload.Path)
		jsonResponse(w, map[string]interface{}{"ok": true, "path": payload.Path}, http.StatusOK)
	}))

	// 🗑️ Módulo Segundo Cérebro (Vault): Mover Arquivo para Lixeira Segura (Restrito)
	mux.HandleFunc("POST /api/file/delete", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Path string `json:"path"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if payload.Path == "" {
			jsonResponse(w, map[string]string{"error": "Parâmetro path obrigatório"}, http.StatusBadRequest)
			return
		}
		trashRelPath, err := parser.DeleteFileSecurely(nexusDir, payload.Path)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		syncer.AutoSyncAsync("sync(vault): exclusão de nota " + payload.Path)
		jsonResponse(w, map[string]interface{}{
			"ok":         true,
			"message":    "Arquivo movido para a Lixeira com sucesso",
			"path":       payload.Path,
			"trash_path": trashRelPath,
		}, http.StatusOK)
	}))

	// 📋 Módulo Tarefas: Alternar Checkbox [ ] <-> [x] (Restrito)
	mux.HandleFunc("POST /api/tasks/toggle", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			ID string `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if payload.ID == "" {
			jsonResponse(w, map[string]string{"error": "ID da tarefa obrigatório"}, http.StatusBadRequest)
			return
		}
		completed, err := parser.ToggleTask(nexusDir, payload.ID)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): alternada tarefa " + payload.ID)
		jsonResponse(w, map[string]interface{}{"ok": true, "id": payload.ID, "completed": completed}, http.StatusOK)
	}))

	// 📋 Módulo Tarefas: Criar Nova Tarefa (Restrito)
	mux.HandleFunc("POST /api/tasks", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			ID          string `json:"id"`
			Title       string `json:"title"`
			Context     string `json:"context"`
			Responsible string `json:"responsible"`
			Section     string `json:"section"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(payload.Title) == "" {
			jsonResponse(w, map[string]string{"error": "Título da tarefa obrigatório"}, http.StatusBadRequest)
			return
		}
		item := parser.TaskItem{
			ID:          payload.ID,
			Title:       payload.Title,
			Context:     payload.Context,
			Responsible: payload.Responsible,
		}
		created, err := parser.CreateTask(nexusDir, item, payload.Section)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): criada tarefa " + created.ID)
		jsonResponse(w, map[string]interface{}{"ok": true, "task": created}, http.StatusCreated)
	}))

	// 📋 Módulo Tarefas: Mover Tarefa entre Colunas (Drag & Drop) (Restrito)
	mux.HandleFunc("POST /api/tasks/move", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			ID      string `json:"id"`
			Section string `json:"section"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(payload.ID) == "" || strings.TrimSpace(payload.Section) == "" {
			jsonResponse(w, map[string]string{"error": "ID e Section são obrigatórios"}, http.StatusBadRequest)
			return
		}
		if err := parser.MoveTask(nexusDir, payload.ID, payload.Section); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		syncer.AutoSyncAsync(fmt.Sprintf("sync(tasks): movida tarefa %s para %s", payload.ID, payload.Section))
		jsonResponse(w, map[string]interface{}{"ok": true, "id": payload.ID, "section": payload.Section}, http.StatusOK)
	}))

	// 📋 Módulo Tarefas: Mover Tarefas em Lote (Salvar Alterações) (Restrito)
	mux.HandleFunc("POST /api/tasks/move-batch", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Moves []struct {
				ID      string `json:"id"`
				Section string `json:"section"`
			} `json:"moves"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if len(payload.Moves) == 0 {
			jsonResponse(w, map[string]interface{}{"ok": true, "count": 0}, http.StatusOK)
			return
		}
		for _, m := range payload.Moves {
			mID := strings.TrimSpace(m.ID)
			mSec := strings.TrimSpace(m.Section)
			if mID == "" || mSec == "" {
				continue
			}
			if err := parser.MoveTask(nexusDir, mID, mSec); err != nil {
				jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao mover tarefa %s: %v", mID, err)}, http.StatusBadRequest)
				return
			}
		}
		if len(payload.Moves) == 1 {
			syncer.AutoSyncAsync(fmt.Sprintf("sync(tasks): movida tarefa %s para %s", payload.Moves[0].ID, payload.Moves[0].Section))
		} else {
			syncer.AutoSyncAsync(fmt.Sprintf("sync(tasks): salvas alterações de %d tarefas no kanban", len(payload.Moves)))
		}
		jsonResponse(w, map[string]interface{}{"ok": true, "count": len(payload.Moves)}, http.StatusOK)
	}))

	// 📋 Módulo Tarefas: Atualizar Tarefa (Restrito)
	mux.HandleFunc("PUT /api/tasks", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			ID          string `json:"id"`
			Title       string `json:"title"`
			Context     string `json:"context"`
			Responsible string `json:"responsible"`
			Section     string `json:"section"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(payload.ID) == "" {
			jsonResponse(w, map[string]string{"error": "ID da tarefa é obrigatório"}, http.StatusBadRequest)
			return
		}
		item := parser.TaskItem{
			ID:          payload.ID,
			Title:       payload.Title,
			Context:     payload.Context,
			Responsible: payload.Responsible,
		}
		if err := parser.UpdateTask(nexusDir, item, payload.Section); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): atualizada tarefa " + payload.ID)
		jsonResponse(w, map[string]interface{}{"ok": true, "id": payload.ID}, http.StatusOK)
	}))

	// 📋 Módulo Tarefas: Deletar Tarefa (Restrito)
	mux.HandleFunc("DELETE /api/tasks", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		taskID := strings.TrimSpace(r.URL.Query().Get("id"))
		if taskID == "" {
			var payload struct {
				ID string `json:"id"`
			}
			if err := json.NewDecoder(r.Body).Decode(&payload); err == nil {
				taskID = strings.TrimSpace(payload.ID)
			}
		}
		if taskID == "" {
			jsonResponse(w, map[string]string{"error": "ID da tarefa obrigatório"}, http.StatusBadRequest)
			return
		}
		if err := parser.DeleteTask(nexusDir, taskID); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): excluída tarefa " + taskID)
		jsonResponse(w, map[string]interface{}{"ok": true, "id": taskID}, http.StatusOK)
	}))

	// 📎 Servidor de Anexos do Kanban (Modo Detalhes do Card)
	tasksAttDir := filepath.Join(nexusDir, "tasks", "attachments")
	_ = os.MkdirAll(tasksAttDir, 0755)
	mux.Handle("GET /tasks/attachments/", protegerSePrivado(http.StripPrefix("/tasks/attachments/", http.FileServer(http.Dir(tasksAttDir)))))

	// 📋 Módulo Tarefas: Obter Detalhes do Card
	mux.HandleFunc("GET /api/tasks/details", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		taskID := strings.TrimSpace(r.URL.Query().Get("id"))
		if taskID == "" {
			jsonResponse(w, map[string]string{"error": "ID da tarefa obrigatório"}, http.StatusBadRequest)
			return
		}
		details, err := parser.GetTaskDetails(nexusDir, taskID)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, details, http.StatusOK)
	}))

	// 📦 Módulo Tarefas: Exportar Quadro (.json, .csv, .txt, .md)
	mux.HandleFunc("GET /api/tasks/export", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		format := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("format")))
		dateStr := time.Now().Format("2006-01-02")

		switch format {
		case "csv":
			data, err := parser.ExportTasksCSV(nexusDir)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/csv; charset=utf-8")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"nexus_kanban_%s.csv\"", dateStr))
			w.Write(data)
		case "md":
			data, err := parser.ExportTasksMD(nexusDir)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"nexus_kanban_%s.md\"", dateStr))
			w.Write(data)
		case "txt":
			data, err := parser.ExportTasksTXT(nexusDir)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"nexus_kanban_%s.txt\"", dateStr))
			w.Write(data)
		default: // "json"
			data, err := parser.ExportTasksJSON(nexusDir)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"nexus_kanban_%s.json\"", dateStr))
			w.Write(data)
		}
	}))

	// 📋 Módulo Tarefas: Atualizar Detalhes do Card (Restrito)
	mux.HandleFunc("POST /api/tasks/details", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload parser.TaskDetails
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(payload.ID) == "" {
			jsonResponse(w, map[string]string{"error": "ID da tarefa é obrigatório"}, http.StatusBadRequest)
			return
		}
		if err := parser.SaveTaskDetails(nexusDir, &payload); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): atualizados detalhes do card " + payload.ID)
		jsonResponse(w, map[string]interface{}{"ok": true, "id": payload.ID}, http.StatusOK)
	}))

	// 💬 Módulo Tarefas: Adicionar Comentário no Card (Restrito)
	mux.HandleFunc("POST /api/tasks/comment", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			ID     string `json:"id"`
			Author string `json:"author"`
			Avatar string `json:"avatar"`
			Text   string `json:"text"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(payload.ID) == "" || strings.TrimSpace(payload.Text) == "" {
			jsonResponse(w, map[string]string{"error": "ID e texto do comentário são obrigatórios"}, http.StatusBadRequest)
			return
		}
		comment, err := parser.AddComment(nexusDir, payload.ID, payload.Author, payload.Avatar, payload.Text)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): novo comentário no card " + payload.ID)
		jsonResponse(w, map[string]interface{}{"ok": true, "comment": comment}, http.StatusCreated)
	}))

	// 💬 Módulo Tarefas: Excluir Comentário do Card (Restrito)
	mux.HandleFunc("DELETE /api/tasks/comment", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		taskID := strings.TrimSpace(r.URL.Query().Get("id"))
		commentID := strings.TrimSpace(r.URL.Query().Get("comment_id"))
		if taskID == "" || commentID == "" {
			jsonResponse(w, map[string]string{"error": "ID e comment_id são obrigatórios"}, http.StatusBadRequest)
			return
		}
		if err := parser.DeleteComment(nexusDir, taskID, commentID); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): comentário excluído no card " + taskID)
		jsonResponse(w, map[string]interface{}{"ok": true}, http.StatusOK)
	}))

	// 🔗 Módulo Tarefas: Adicionar Link no Card (Restrito)
	mux.HandleFunc("POST /api/tasks/link", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			ID    string `json:"id"`
			Title string `json:"title"`
			URL   string `json:"url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(payload.ID) == "" || strings.TrimSpace(payload.URL) == "" {
			jsonResponse(w, map[string]string{"error": "ID e URL do link são obrigatórios"}, http.StatusBadRequest)
			return
		}
		link, err := parser.AddLink(nexusDir, payload.ID, payload.Title, payload.URL)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): novo link no card " + payload.ID)
		jsonResponse(w, map[string]interface{}{"ok": true, "link": link}, http.StatusCreated)
	}))

	// 🔗 Módulo Tarefas: Excluir Link do Card (Restrito)
	mux.HandleFunc("DELETE /api/tasks/link", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		taskID := strings.TrimSpace(r.URL.Query().Get("id"))
		linkID := strings.TrimSpace(r.URL.Query().Get("link_id"))
		if taskID == "" || linkID == "" {
			jsonResponse(w, map[string]string{"error": "ID e link_id são obrigatórios"}, http.StatusBadRequest)
			return
		}
		if err := parser.DeleteLink(nexusDir, taskID, linkID); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): link excluído no card " + taskID)
		jsonResponse(w, map[string]interface{}{"ok": true}, http.StatusOK)
	}))

	// 📎 Módulo Tarefas: Upload de Arquivo no Card (Restrito)
	mux.HandleFunc("POST /api/tasks/upload", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(50 << 20); err != nil {
			jsonResponse(w, map[string]string{"error": "Arquivo excede o limite permitido (50MB)"}, http.StatusBadRequest)
			return
		}
		taskID := strings.TrimSpace(r.FormValue("id"))
		if taskID == "" {
			jsonResponse(w, map[string]string{"error": "ID da tarefa é obrigatório"}, http.StatusBadRequest)
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			jsonResponse(w, map[string]string{"error": "Nenhum arquivo enviado"}, http.StatusBadRequest)
			return
		}
		defer file.Close()

		attDir := parser.GetTaskAttachmentsDir(nexusDir, taskID)
		cleanFileName := filepath.Base(header.Filename)
		dstPath := filepath.Join(attDir, cleanFileName)
		dst, err := os.Create(dstPath)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao criar arquivo: %v", err)}, http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		sizeBytes, err := io.Copy(dst, file)
		if err != nil {
			jsonResponse(w, map[string]string{"error": fmt.Sprintf("Erro ao salvar arquivo: %v", err)}, http.StatusInternalServerError)
			return
		}

		sizeStr := fmt.Sprintf("%d KB", sizeBytes/1024)
		if sizeBytes >= 1024*1024 {
			sizeStr = fmt.Sprintf("%.1f MB", float64(sizeBytes)/(1024*1024))
		}
		relPath := filepath.ToSlash(filepath.Join("tasks", "attachments", taskID, cleanFileName))
		mimeType := header.Header.Get("Content-Type")

		att, err := parser.AddAttachment(nexusDir, taskID, cleanFileName, relPath, sizeStr, mimeType)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): anexo enviado para " + taskID)
		jsonResponse(w, map[string]interface{}{"ok": true, "attachment": att}, http.StatusCreated)
	}))

	// 📎 Módulo Tarefas: Excluir Anexo do Card (Restrito)
	mux.HandleFunc("DELETE /api/tasks/attachment", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		taskID := strings.TrimSpace(r.URL.Query().Get("id"))
		attID := strings.TrimSpace(r.URL.Query().Get("attachment_id"))
		if taskID == "" || attID == "" {
			jsonResponse(w, map[string]string{"error": "ID e attachment_id são obrigatórios"}, http.StatusBadRequest)
			return
		}
		if err := parser.DeleteAttachment(nexusDir, taskID, attID); err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		syncer.AutoSyncAsync("sync(tasks): anexo excluído no card " + taskID)
		jsonResponse(w, map[string]interface{}{"ok": true}, http.StatusOK)
	}))

	// 🔍 Módulo Segundo Cérebro (Vault): Busca Global em Texto (Restrito)
	mux.HandleFunc("GET /api/search", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		if query == "" {
			jsonResponse(w, []parser.SearchResult{}, http.StatusOK)
			return
		}
		results, err := parser.SearchVault(nexusDir, query)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, results, http.StatusOK)
	}))

	// 📱 Módulo 1: Ponte de Execução Headless WhatsApp ↔ Motor de IA
	bridgeHandler := bridge.NewBridge(nexusDir)
	mux.HandleFunc("POST /api/ponte/whatsapp", bridgeHandler.HandleWhatsApp)
	mux.HandleFunc("POST /api/ponte/whatsapp/send-real", requireAuth(bridgeHandler.HandleSendReal))
	mux.HandleFunc("POST /api/ponte/whatsapp/ask-and-send", requireAuth(bridgeHandler.HandleAskAndSend))
	mux.HandleFunc("GET /api/ponte/status", bridgeHandler.HandleStatus)
	mux.HandleFunc("GET /api/ponte/sessions", requireAuth(bridgeHandler.HandleSessions))

	// 💻 Módulo 2: Terminal Web Interativo (PTY + WebSocket) e Túnel Reverso PC Local
	termHandler := terminal.NewHandler(nexusDir, authMgr.Authorized)
	mux.HandleFunc("GET /ws/terminal", termHandler.HandleWebSocket)
	mux.HandleFunc("GET /ws/tunnel/agent", termHandler.HandleAgentTunnel)
	mux.HandleFunc("GET /api/terminal/status", func(w http.ResponseWriter, r *http.Request) {
		osInfo := parser.GetSystemOSInfo()
		jsonResponse(w, map[string]interface{}{
			"cloud":          true,
			"local":          termHandler.IsAgentConnected(),
			"terminal_title": osInfo.TerminalTitle,
			"os_info":        osInfo,
		}, http.StatusOK)
	})

	// 🎬 Módulo 3: Servidor de Conteúdos Estáticos (Vídeos, Carrosséis e Thumbnails)
	conteudoDir := filepath.Join(nexusDir, "conteudo")
	_ = os.MkdirAll(conteudoDir, 0755)
	mux.Handle("GET /conteudo/", protegerSePrivado(http.StripPrefix("/conteudo/", http.FileServer(http.Dir(conteudoDir)))))

	// 🎬 API: Listar Conteúdos Gerados
	mux.HandleFunc("GET /api/conteudo", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		conteudos := parser.ListConteudos(nexusDir)
		jsonResponse(w, conteudos, http.StatusOK)
	}))

	// 🗑️ API: Excluir Mídia de Conteúdo (Move para a Lixeira .trash com segurança - Restrito)
	mux.HandleFunc("POST /api/conteudo/delete", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Tipo string `json:"tipo"`
			Slug string `json:"slug"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido"}, http.StatusBadRequest)
			return
		}
		if payload.Tipo == "" || payload.Slug == "" {
			jsonResponse(w, map[string]string{"error": "Parâmetros 'tipo' e 'slug' são obrigatórios"}, http.StatusBadRequest)
			return
		}
		trashPath, err := parser.DeleteConteudoItem(nexusDir, payload.Tipo, payload.Slug)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		jsonResponse(w, map[string]interface{}{
			"ok":         true,
			"message":    "Mídia movida para a Lixeira com sucesso",
			"slug":       payload.Slug,
			"trash_path": trashPath,
		}, http.StatusOK)
	}))

	// 🌐 API: Salvar ou Editar Projeto Web / Site
	mux.HandleFunc("POST /api/conteudo/sites/save", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		var payload parser.SitePayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			jsonResponse(w, map[string]string{"error": "JSON inválido: " + err.Error()}, http.StatusBadRequest)
			return
		}
		item, err := parser.SaveSiteItem(nexusDir, payload)
		if err != nil {
			jsonResponse(w, map[string]string{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		jsonResponse(w, map[string]interface{}{
			"ok":      true,
			"message": "Projeto web salvo com sucesso!",
			"site":    item,
		}, http.StatusOK)
	}))

	// 🔄 Módulo 4: Sincronização Contínua Git & Webhooks (PC ↔ Celular / Nuvem)
	mux.HandleFunc("POST /api/webhook/github", syncer.HandleWebhookGitHub)
	mux.HandleFunc("POST /api/sync/pull", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		out, err := syncer.Pull()
		if err != nil {
			jsonResponse(w, map[string]interface{}{"ok": false, "error": err.Error()}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, map[string]interface{}{"ok": true, "output": out, "synced_at": time.Now().Format(time.RFC3339)}, http.StatusOK)
	}))
	mux.HandleFunc("POST /api/sync/push", requireAuth(func(w http.ResponseWriter, r *http.Request) {
		out, err := syncer.Push("")
		if err != nil {
			jsonResponse(w, map[string]interface{}{"ok": false, "error": err.Error()}, http.StatusInternalServerError)
			return
		}
		jsonResponse(w, map[string]interface{}{"ok": true, "output": out, "synced_at": time.Now().Format(time.RFC3339)}, http.StatusOK)
	}))

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 15 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	log.Printf("🚀 [NEXUS CONSOLE] Ouvindo em http://0.0.0.0:%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Erro no servidor HTTP: %v", err)
	}
}
