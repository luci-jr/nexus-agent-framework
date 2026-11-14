package parser

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// TreeNode representa um nó da árvore de arquivos do Segundo Cérebro (Vault)
type TreeNode struct {
	Name     string      `json:"name"`
	Path     string      `json:"path"` // Caminho relativo a nexusDir (ex: "agentes/memoria_lucy.md")
	Type     string      `json:"type"` // "folder" ou "file"
	Ext      string      `json:"ext,omitempty"`
	Size     int64       `json:"size,omitempty"`
	ModTime  string      `json:"mod_time,omitempty"`
	Children []*TreeNode `json:"children,omitempty"`
}

// SearchResult representa um resultado de busca textual nos documentos
type SearchResult struct {
	Path    string `json:"path"`
	Title   string `json:"title"`
	Line    int    `json:"line"`
	Excerpt string `json:"excerpt"`
}

// Pastas que nunca devem ser exibidas no Vault (infra, backups, código-fonte e operacionais)
var ignoredDirs = map[string]bool{
	".git":              true,
	".system_generated": true,
	".trash":            true,
	"node_modules":      true,
	".vscode":           true,
	".idea":             true,
	"bin":               true,
	"web_backup_v154":   true,
	"iac":               true,
	"nexus-work":        true,
	"work":              true,
	"backups":           true,
	"portatil":          true,
	"scripts":           true,
	"recursos":          true,
	"nexus-console":     true,
	"nexus-mcp":         true,
	"skills":            true,
}

// Arquivos operacionais ou de configuração raiz que não devem poluir o Segundo Cérebro
var ignoredFiles = map[string]bool{
	"nexus.code-workspace": true,
	"backup_nexus.sh":      true,
	".mcp.json":            true,
	".gitattributes":       true,
	".gitignore":           true,
	".console_pass":        true,
}

// Extensões permitidas no Segundo Cérebro
var allowedExts = map[string]bool{
	".md":   true,
	".markdown": true,
	".txt":  true,
	".json": true,
	".yaml": true,
	".yml":  true,
	".sh":   true,
}

// isPathSafe garante que o caminho relativo não sai dos limites do diretório Nexus
func isPathSafe(nexusDir, relPath string) (string, error) {
	cleanRel := filepath.Clean(strings.TrimPrefix(relPath, "/"))
	if strings.HasPrefix(cleanRel, "..") || strings.Contains(cleanRel, "/../") {
		return "", fmt.Errorf("caminho inválido ou tentativa de path traversal")
	}
	target := filepath.Join(nexusDir, cleanRel)
	absNexus, err := filepath.Abs(nexusDir)
	if err != nil {
		return "", err
	}
	absTarget, err := filepath.Abs(target)
	if err != nil {
		return "", err
	}
	if !strings.HasPrefix(absTarget, absNexus) {
		return "", fmt.Errorf("acesso fora dos limites do cérebro negado")
	}
	return absTarget, nil
}

// BuildVaultTree escaneia recursivamente o diretório Nexus gerando a árvore do Segundo Cérebro
func BuildVaultTree(nexusDir string) (*TreeNode, error) {
	root := &TreeNode{
		Name:     "Nexus Vault",
		Path:     "",
		Type:     "folder",
		Children: []*TreeNode{},
	}

	var walk func(dir string, parent *TreeNode, depth int) error
	walk = func(dir string, parent *TreeNode, depth int) error {
		if depth > 7 {
			return nil
		}

		entries, err := os.ReadDir(dir)
		if err != nil {
			return err
		}

		var folders []*TreeNode
		var files []*TreeNode

		for _, entry := range entries {
			name := entry.Name()
			if strings.HasPrefix(name, ".") && name != ".agy" && name != ".agents" {
				continue
			}
			if ignoredDirs[name] {
				continue
			}
			if !entry.IsDir() && ignoredFiles[name] {
				continue
			}

			fullPath := filepath.Join(dir, name)
			rel, _ := filepath.Rel(nexusDir, fullPath)

			if entry.IsDir() {
				folderNode := &TreeNode{
					Name:     name,
					Path:     filepath.ToSlash(rel),
					Type:     "folder",
					Children: []*TreeNode{},
				}
				if err := walk(fullPath, folderNode, depth+1); err == nil {
					// Só exibe pastas que contenham arquivos ou subpastas
					if len(folderNode.Children) > 0 {
						folders = append(folders, folderNode)
					}
				}
			} else {
				ext := strings.ToLower(filepath.Ext(name))
				if allowedExts[ext] {
					info, _ := entry.Info()
					var size int64
					var modTime string
					if info != nil {
						size = info.Size()
						modTime = info.ModTime().Format(time.RFC3339)
					}

					files = append(files, &TreeNode{
						Name:    name,
						Path:    filepath.ToSlash(rel),
						Type:    "file",
						Ext:     ext,
						Size:    size,
						ModTime: modTime,
					})
				}
			}
		}

		// Ordenação amigável: pastas primeiro em ordem alfabética, depois arquivos
		sort.Slice(folders, func(i, j int) bool {
			return strings.ToLower(folders[i].Name) < strings.ToLower(folders[j].Name)
		})
		sort.Slice(files, func(i, j int) bool {
			return strings.ToLower(files[i].Name) < strings.ToLower(files[j].Name)
		})

		parent.Children = append(parent.Children, folders...)
		parent.Children = append(parent.Children, files...)
		return nil
	}

	err := walk(nexusDir, root, 0)
	return root, err
}

// SaveFileContent salva as alterações de um arquivo no disco
func SaveFileContent(nexusDir, relPath, content string) error {
	target, err := isPathSafe(nexusDir, relPath)
	if err != nil {
		return err
	}

	// Garante que o diretório pai existe
	if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
		return err
	}

	return os.WriteFile(target, []byte(content), 0644)
}

// CreateNewNote cria uma nova nota no Segundo Cérebro
func CreateNewNote(nexusDir, relPath, initialContent string) error {
	if !strings.HasSuffix(strings.ToLower(relPath), ".md") {
		relPath += ".md"
	}

	target, err := isPathSafe(nexusDir, relPath)
	if err != nil {
		return err
	}

	if _, err := os.Stat(target); err == nil {
		return fmt.Errorf("o arquivo '%s' já existe", relPath)
	}

	if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
		return err
	}

	if initialContent == "" {
		baseName := strings.TrimSuffix(filepath.Base(relPath), ".md")
		initialContent = fmt.Sprintf("# 📝 %s\n\n> Criado em: %s\n\n---\n\n",
			baseName, time.Now().Format("02/01/2006 15:04"))
	}

	return os.WriteFile(target, []byte(initialContent), 0644)
}

// ToggleTask alterna o status [ ] <-> [x] de uma tarefa em tasks/todo.md
func ToggleTask(nexusDir, taskId string) (bool, error) {
	todoPath := filepath.Join(nexusDir, "tasks", "todo.md")
	content, err := os.ReadFile(todoPath)
	if err != nil {
		return false, err
	}

	lines := strings.Split(string(content), "\n")
	found := false
	nowCompleted := false

	targetBracket := fmt.Sprintf("[%s]", taskId)

	for i, line := range lines {
		if strings.Contains(line, targetBracket) {
			if strings.Contains(line, "- [ ]") {
				lines[i] = strings.Replace(line, "- [ ]", "- [x]", 1)
				nowCompleted = true
				found = true
				break
			} else if strings.Contains(line, "- [x]") || strings.Contains(line, "- [X]") {
				lines[i] = strings.Replace(line, "- [x]", "- [ ]", 1)
				lines[i] = strings.Replace(lines[i], "- [X]", "- [ ]", 1)
				nowCompleted = false
				found = true
				break
			}
		}
	}

	if !found {
		return false, fmt.Errorf("tarefa com ID '%s' não encontrada", taskId)
	}

	output := strings.Join(lines, "\n")
	if err := os.WriteFile(todoPath, []byte(output), 0644); err != nil {
		return false, err
	}

	return nowCompleted, nil
}

// SearchVault realiza busca textual case-insensitive em arquivos Markdown do cérebro
func SearchVault(nexusDir, query string) ([]SearchResult, error) {
	query = strings.TrimSpace(strings.ToLower(query))
	if query == "" {
		return []SearchResult{}, nil
	}

	var results []SearchResult
	maxResults := 50

	err := filepath.Walk(nexusDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if info.IsDir() {
			name := info.Name()
			if strings.HasPrefix(name, ".") && name != ".agy" && name != ".agents" {
				return filepath.SkipDir
			}
			if ignoredDirs[name] {
				return filepath.SkipDir
			}
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if ext != ".md" && ext != ".markdown" && ext != ".txt" {
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			return nil
		}
		defer file.Close()

		rel, _ := filepath.Rel(nexusDir, path)
		relPath := filepath.ToSlash(rel)
		fileName := filepath.Base(path)

		scanner := bufio.NewScanner(file)
		lineNum := 0

		for scanner.Scan() {
			lineNum++
			lineText := scanner.Text()
			lower := strings.ToLower(lineText)

			if strings.Contains(lower, query) {
				excerpt := strings.TrimSpace(lineText)
				if len(excerpt) > 140 {
					idx := strings.Index(lower, query)
					start := idx - 40
					if start < 0 {
						start = 0
					}
					end := idx + len(query) + 60
					if end > len(excerpt) {
						end = len(excerpt)
					}
					excerpt = "..." + excerpt[start:end] + "..."
				}

				results = append(results, SearchResult{
					Path:    relPath,
					Title:   fileName,
					Line:    lineNum,
					Excerpt: excerpt,
				})

				if len(results) >= maxResults {
					return fmt.Errorf("limite atingido")
				}
			}
		}

		return nil
	})

	if err != nil && err.Error() != "limite atingido" {
		return results, err
	}

	return results, nil
}

// ProtectedCoreFiles lista arquivos essenciais de governança que nunca podem ser excluídos pelo console
var ProtectedCoreFiles = map[string]bool{
	"memoria_lucy.md":         true,
	"agentes/memoria_lucy.md": true,
	"tasks/todo.md":           true,
	"tasks/lessons.md":        true,
	"README.md":               true,
	"backup_nexus.sh":         true,
	".mcp.json":               true,
	".gitignore":              true,
	".gitattributes":          true,
	"nexus.code-workspace":    true,
}

// ProtectedDirPrefixes lista prefixos de diretórios vitais protegidos contra exclusão
var ProtectedDirPrefixes = []string{
	".git",
	".agy",
	".github",
	".system_generated",
	"iac",
	"nexus-mcp",
	"agentes/memoria",
	"agentes/agents",
	"scripts/setup",
}

// DeleteFileSecurely move um arquivo do vault para a lixeira (.trash/YYYY-MM-DD/) com proteções estritas
func DeleteFileSecurely(nexusDir, relPath string) (string, error) {
	cleanRel := filepath.Clean(strings.TrimPrefix(relPath, "/"))
	if cleanRel == "" || cleanRel == "." {
		return "", fmt.Errorf("caminho de arquivo inválido")
	}

	// 1. Verificação na Blacklist de arquivos vitais
	if ProtectedCoreFiles[cleanRel] {
		return "", fmt.Errorf("ação bloqueada: '%s' é um arquivo vital de governança e não pode ser excluído", cleanRel)
	}

	// 2. Verificação de prefixos protegidos
	for _, prefix := range ProtectedDirPrefixes {
		if cleanRel == prefix || strings.HasPrefix(cleanRel, prefix+"/") {
			return "", fmt.Errorf("ação bloqueada: o diretório '%s' é protegido contra exclusão", prefix)
		}
	}

	// 3. Validação de Path Traversal
	target, err := isPathSafe(nexusDir, cleanRel)
	if err != nil {
		return "", err
	}

	fileInfo, err := os.Stat(target)
	if err != nil {
		if os.IsNotExist(err) {
			return "", fmt.Errorf("arquivo '%s' não existe", cleanRel)
		}
		return "", err
	}

	if fileInfo.IsDir() {
		return "", fmt.Errorf("exclusão de pastas completas não é permitida pelo console por segurança")
	}

	// 4. Criação do diretório de Lixeira diária: /nexus/.trash/YYYY-MM-DD
	todayTrashDir := filepath.Join(nexusDir, ".trash", time.Now().Format("2006-01-02"))
	if err := os.MkdirAll(todayTrashDir, 0755); err != nil {
		return "", fmt.Errorf("falha ao criar pasta de lixeira: %v", err)
	}

	// 5. Destino seguro (se já existir um arquivo com mesmo nome na lixeira, adiciona timestamp)
	fileName := filepath.Base(cleanRel)
	destPath := filepath.Join(todayTrashDir, fileName)
	if _, err := os.Stat(destPath); err == nil {
		ext := filepath.Ext(fileName)
		base := strings.TrimSuffix(fileName, ext)
		destPath = filepath.Join(todayTrashDir, fmt.Sprintf("%s_%s%s", base, time.Now().Format("150405"), ext))
	}

	// 6. Move o arquivo para a lixeira (Rename ou Fallback Copy+Remove)
	if err := os.Rename(target, destPath); err != nil {
		// Fallback para cross-device
		content, readErr := os.ReadFile(target)
		if readErr != nil {
			return "", fmt.Errorf("falha ao mover arquivo: %v", readErr)
		}
		if writeErr := os.WriteFile(destPath, content, 0644); writeErr != nil {
			return "", fmt.Errorf("falha ao gravar na lixeira: %v", writeErr)
		}
		if remErr := os.Remove(target); remErr != nil {
			return "", fmt.Errorf("falha ao remover original: %v", remErr)
		}
	}

	relDest, _ := filepath.Rel(nexusDir, destPath)
	return relDest, nil
}
