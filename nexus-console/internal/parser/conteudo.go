package parser

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

// ConteudoItem representa um pacote de mídia gerado (vídeo, carrossel, thumbnail ou site/projeto web)
type ConteudoItem struct {
	Tipo       string    `json:"tipo"`                 // "video", "carrossel", "thumbnail", "site"
	Slug       string    `json:"slug"`                 // Nome da pasta
	Titulo     string    `json:"titulo"`               // Título derivado do slug ou meta.json
	Data       string    `json:"data"`                 // Data de criação (YYYY-MM-DD)
	Arquivos   []string  `json:"arquivos"`             // URLs web relativas (/conteudo/...)
	Principal  string    `json:"principal"`            // URL do arquivo principal (vídeo, pdf, print ou thumb)
	URL        string    `json:"url,omitempty"`        // URL externa do site (se tipo=="site")
	Nicho      string    `json:"nicho,omitempty"`      // Nicho/Categoria do projeto (se tipo=="site")
	Descricao  string    `json:"descricao,omitempty"`  // Descrição do projeto (se tipo=="site")
	Status     string    `json:"status,omitempty"`     // Status do projeto (online, desenvolvimento, concluido)
	Modificado time.Time `json:"modificado"`
}

// SiteMeta armazena os metadados persistentes de um projeto web em meta.json
type SiteMeta struct {
	Titulo       string `json:"titulo"`
	URL          string `json:"url"`
	Nicho        string `json:"nicho"`
	Descricao    string `json:"descricao"`
	Print        string `json:"print,omitempty"`
	Status       string `json:"status,omitempty"`
	CriadoEm     string `json:"criado_em,omitempty"`
	AtualizadoEm string `json:"atualizado_em,omitempty"`
}

// SitePayload representa os dados recebidos para salvar ou editar um site
type SitePayload struct {
	Slug        string `json:"slug"`
	Titulo      string `json:"titulo"`
	URL         string `json:"url"`
	Nicho       string `json:"nicho"`
	Descricao   string `json:"descricao"`
	Status      string `json:"status"`
	PrintBase64 string `json:"print_base64,omitempty"`
	PrintURL    string `json:"print_url,omitempty"`
}

// ConteudoList consolida os 4 pilares de conteúdo
type ConteudoList struct {
	Videos     []ConteudoItem `json:"videos"`
	Carrosseis []ConteudoItem `json:"carrosseis"`
	Thumbnails []ConteudoItem `json:"thumbnails"`
	Sites      []ConteudoItem `json:"sites"`
	Total      int            `json:"total"`
}

func formatTitleFromSlug(slug string) string {
	parts := strings.SplitN(slug, "_", 2)
	raw := slug
	if len(parts) == 2 && len(parts[0]) == 10 { // YYYY-MM-DD
		raw = parts[1]
	}
	words := strings.Split(raw, "_")
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

func sanitizeSlug(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	reg := regexp.MustCompile(`[^a-z0-9_-]+`)
	s = reg.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 60 {
		s = s[:60]
	}
	return s
}

func scanCategory(baseDir, category, tipo string) []ConteudoItem {
	var items []ConteudoItem
	catDir := filepath.Join(baseDir, "conteudo", category)
	entries, err := os.ReadDir(catDir)
	if err != nil {
		return items
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		itemDir := filepath.Join(catDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		item := ConteudoItem{
			Tipo:       tipo,
			Slug:       entry.Name(),
			Titulo:     formatTitleFromSlug(entry.Name()),
			Modificado: info.ModTime(),
		}

		// Extrai data do início do slug se houver (ex: 2026-11-04)
		if len(entry.Name()) >= 10 && entry.Name()[4] == '-' && entry.Name()[7] == '-' {
			item.Data = entry.Name()[:10]
		} else {
			item.Data = info.ModTime().Format("2006-01-02")
		}

		// Se houver meta.json (muito comum em sites/projetos web)
		metaFile := filepath.Join(itemDir, "meta.json")
		if metaBytes, err := os.ReadFile(metaFile); err == nil {
			var meta SiteMeta
			if json.Unmarshal(metaBytes, &meta) == nil {
				if meta.Titulo != "" {
					item.Titulo = meta.Titulo
				}
				if meta.URL != "" {
					item.URL = meta.URL
				}
				if meta.Nicho != "" {
					item.Nicho = meta.Nicho
				}
				if meta.Descricao != "" {
					item.Descricao = meta.Descricao
				}
				if meta.Status != "" {
					item.Status = meta.Status
				}
				if meta.CriadoEm != "" {
					item.Data = meta.CriadoEm
				}
				if meta.Print != "" {
					item.Principal = meta.Print
				}
			}
		}

		// Varrer arquivos dentro da pasta
		subEntries, _ := os.ReadDir(itemDir)
		for _, sub := range subEntries {
			if sub.IsDir() {
				continue
			}
			name := sub.Name()
			webPath := "/conteudo/" + category + "/" + entry.Name() + "/" + name
			item.Arquivos = append(item.Arquivos, webPath)

			// Definir arquivo principal
			if tipo == "video" && (name == "video_final.mp4" || strings.HasSuffix(name, ".mp4")) {
				item.Principal = webPath
			} else if tipo == "carrossel" && strings.HasSuffix(name, ".pdf") {
				item.Principal = webPath
			} else if tipo == "thumbnail" && strings.HasPrefix(name, "thumb_a") {
				item.Principal = webPath
			} else if tipo == "site" && item.Principal == "" {
				if strings.HasPrefix(name, "print") || strings.HasPrefix(name, "screenshot") || strings.HasPrefix(name, "capa") {
					item.Principal = webPath
				}
			}
		}

		// Fallback de principal
		if item.Principal == "" && len(item.Arquivos) > 0 {
			// Procura primeiro qualquer imagem se for site
			if tipo == "site" {
				for _, f := range item.Arquivos {
					lower := strings.ToLower(f)
					if strings.HasSuffix(lower, ".png") || strings.HasSuffix(lower, ".jpg") || strings.HasSuffix(lower, ".jpeg") || strings.HasSuffix(lower, ".webp") {
						item.Principal = f
						break
					}
				}
			}
			if item.Principal == "" {
				item.Principal = item.Arquivos[0]
			}
		}

		items = append(items, item)
	}

	// Ordena do mais recente para o mais antigo
	sort.Slice(items, func(i, j int) bool {
		return items[i].Modificado.After(items[j].Modificado)
	})

	return items
}

// ListConteudos varre a pasta conteudo/ e agrupa vídeos, carrosséis, thumbnails e sites
func ListConteudos(nexusDir string) ConteudoList {
	videos := scanCategory(nexusDir, "videos", "video")
	carrosseis := scanCategory(nexusDir, "carrosseis", "carrossel")
	thumbs := scanCategory(nexusDir, "thumbnails", "thumbnail")
	sites := scanCategory(nexusDir, "sites", "site")

	return ConteudoList{
		Videos:     videos,
		Carrosseis: carrosseis,
		Thumbnails: thumbs,
		Sites:      sites,
		Total:      len(videos) + len(carrosseis) + len(thumbs) + len(sites),
	}
}

// SaveSiteItem salva ou atualiza um projeto web com seus metadados e imagem/print
func SaveSiteItem(nexusDir string, payload SitePayload) (*ConteudoItem, error) {
	if strings.TrimSpace(payload.Titulo) == "" {
		return nil, fmt.Errorf("o título do site/projeto é obrigatório")
	}

	slug := strings.TrimSpace(payload.Slug)
	now := time.Now()
	today := now.Format("2006-01-02")

	if slug == "" {
		slugTitle := sanitizeSlug(payload.Titulo)
		if slugTitle == "" {
			slugTitle = "site"
		}
		slug = fmt.Sprintf("%s_%s", today, slugTitle)
	} else {
		slug = filepath.Clean(slug)
		if strings.Contains(slug, "..") || strings.Contains(slug, "/") || strings.Contains(slug, "\\") {
			return nil, fmt.Errorf("slug inválido: %s", slug)
		}
	}

	siteDir := filepath.Join(nexusDir, "conteudo", "sites", slug)
	if err := os.MkdirAll(siteDir, 0755); err != nil {
		return nil, fmt.Errorf("falha ao criar pasta do site: %v", err)
	}

	// Metadados existentes ou novos
	meta := SiteMeta{
		Titulo:       payload.Titulo,
		URL:          payload.URL,
		Nicho:        payload.Nicho,
		Descricao:    payload.Descricao,
		Status:       payload.Status,
		AtualizadoEm: today,
	}
	if meta.Status == "" {
		meta.Status = "online"
	}
	if meta.Nicho == "" {
		meta.Nicho = "Landing Page"
	}

	metaPath := filepath.Join(siteDir, "meta.json")
	if existingBytes, err := os.ReadFile(metaPath); err == nil {
		var existing SiteMeta
		if json.Unmarshal(existingBytes, &existing) == nil {
			meta.CriadoEm = existing.CriadoEm
			if meta.Print == "" && existing.Print != "" {
				meta.Print = existing.Print
			}
		}
	}
	if meta.CriadoEm == "" {
		meta.CriadoEm = today
	}

	// Processa print enviado em base64 se houver
	if strings.TrimSpace(payload.PrintBase64) != "" {
		b64Data := payload.PrintBase64
		ext := "png"
		if idx := strings.Index(b64Data, ";base64,"); idx != -1 {
			prefix := b64Data[:idx]
			if strings.Contains(prefix, "jpeg") || strings.Contains(prefix, "jpg") {
				ext = "jpg"
			} else if strings.Contains(prefix, "webp") {
				ext = "webp"
			}
			b64Data = b64Data[idx+8:]
		}

		imgBytes, err := base64.StdEncoding.DecodeString(b64Data)
		if err == nil && len(imgBytes) > 0 {
			printFileName := "print." + ext
			printFilePath := filepath.Join(siteDir, printFileName)
			if err := os.WriteFile(printFilePath, imgBytes, 0644); err == nil {
				meta.Print = fmt.Sprintf("/conteudo/sites/%s/%s", slug, printFileName)
			}
		}
	} else if payload.PrintURL != "" {
		meta.Print = payload.PrintURL
	}

	// Se ainda não tem print, verifica se já existe algum arquivo de imagem na pasta
	if meta.Print == "" {
		entries, _ := os.ReadDir(siteDir)
		for _, e := range entries {
			lower := strings.ToLower(e.Name())
			if strings.HasSuffix(lower, ".png") || strings.HasSuffix(lower, ".jpg") || strings.HasSuffix(lower, ".jpeg") || strings.HasSuffix(lower, ".webp") {
				meta.Print = fmt.Sprintf("/conteudo/sites/%s/%s", slug, e.Name())
				break
			}
		}
	}

	// Grava meta.json
	metaBytes, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("falha ao codificar meta.json: %v", err)
	}
	if err := os.WriteFile(metaPath, metaBytes, 0644); err != nil {
		return nil, fmt.Errorf("falha ao gravar meta.json: %v", err)
	}

	item := &ConteudoItem{
		Tipo:       "site",
		Slug:       slug,
		Titulo:     meta.Titulo,
		Data:       meta.CriadoEm,
		Principal:  meta.Print,
		URL:        meta.URL,
		Nicho:      meta.Nicho,
		Descricao:  meta.Descricao,
		Status:     meta.Status,
		Modificado: now,
		Arquivos:   []string{meta.Print},
	}
	return item, nil
}

// DeleteConteudoItem move com segurança um pacote de mídia (vídeo, carrossel, thumbnail ou site) para a Lixeira (.trash/YYYY-MM-DD/conteudo/...)
func DeleteConteudoItem(nexusDir, tipo, slug string) (string, error) {
	var category string
	switch tipo {
	case "video":
		category = "videos"
	case "carrossel":
		category = "carrosseis"
	case "thumbnail":
		category = "thumbnails"
	case "site":
		category = "sites"
	default:
		return "", fmt.Errorf("tipo de mídia inválido: '%s' (permitidos: video, carrossel, thumbnail, site)", tipo)
	}

	cleanSlug := filepath.Clean(slug)
	if cleanSlug == "" || cleanSlug == "." || strings.Contains(cleanSlug, "..") || strings.Contains(cleanSlug, "/") || strings.Contains(cleanSlug, "\\") {
		return "", fmt.Errorf("nome de slug inválido ou suspeito: '%s'", slug)
	}

	targetDir := filepath.Join(nexusDir, "conteudo", category, cleanSlug)
	info, err := os.Stat(targetDir)
	if err != nil {
		if os.IsNotExist(err) {
			return "", fmt.Errorf("pasta de mídia não encontrada: '%s/%s'", category, cleanSlug)
		}
		return "", err
	}
	if !info.IsDir() {
		return "", fmt.Errorf("o alvo '%s' não é um diretório de mídia", cleanSlug)
	}

	// Cria pasta na lixeira diária: .trash/YYYY-MM-DD/conteudo/category
	todayTrashDir := filepath.Join(nexusDir, ".trash", time.Now().Format("2006-01-02"), "conteudo", category)
	if err := os.MkdirAll(todayTrashDir, 0755); err != nil {
		return "", fmt.Errorf("falha ao criar pasta de lixeira: %v", err)
	}

	destDir := filepath.Join(todayTrashDir, cleanSlug)
	if _, err := os.Stat(destDir); err == nil {
		destDir = filepath.Join(todayTrashDir, fmt.Sprintf("%s_%s", cleanSlug, time.Now().Format("150405")))
	}

	if err := os.Rename(targetDir, destDir); err != nil {
		// Fallback para cross-filesystem ou permissão: remove diretamente se o rename falhar
		if removeErr := os.RemoveAll(targetDir); removeErr != nil {
			return "", fmt.Errorf("falha ao excluir pasta de mídia: %v (tentativa de mover falhou com: %v)", removeErr, err)
		}
		return "removido", nil
	}

	relTrash, _ := filepath.Rel(nexusDir, destDir)
	return relTrash, nil
}
