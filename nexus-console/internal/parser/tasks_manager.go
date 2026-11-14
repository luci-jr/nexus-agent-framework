package parser

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var (
	reTaskLine = regexp.MustCompile(`^-\s*\[([ xX])\]\s*\*\*\[(.*?)\]\s*(.*?)\*\*`)
)

// SectionHeader retorna o cabeçalho padrão para cada seção de tarefas
func SectionHeader(section string) string {
	switch section {
	case "todo":
		return "## 📋 A Fazer (To Do)"
	case "in_progress":
		return "## 🚀 Em Andamento (Sprint Atual)"
	case "homologacao":
		return "## 🔬 Em Homologação & QA"
	case "done":
		return "## ✅ Concluídas Recentemente"
	case "archived":
		return "## 🗄️ Arquivado & Descontinuado"
	default:
		return "## 📌 Backlog Prioritário"
	}
}

// matchSection retorna a chave da seção a partir do texto de cabeçalho
func matchSection(line string) string {
	if strings.Contains(line, "Backlog") {
		return "backlog"
	} else if strings.Contains(line, "A Fazer") || strings.Contains(line, "To Do") {
		return "todo"
	} else if strings.Contains(line, "Em Andamento") {
		return "in_progress"
	} else if strings.Contains(line, "Homologação") || strings.Contains(line, "QA") {
		return "homologacao"
	} else if strings.Contains(line, "Concluídas") {
		return "done"
	} else if strings.Contains(line, "Arquivado") || strings.Contains(line, "Descontinuado") || strings.Contains(line, "Desistido") || strings.Contains(line, "Arquivo") {
		return "archived"
	}
	return ""
}

// GenerateTaskID gera um ID amigável e único se nenhum for passado
func GenerateTaskID(title string) string {
	clean := strings.ToUpper(strings.TrimSpace(title))
	reg := regexp.MustCompile(`[^A-Z0-9]+`)
	slug := reg.ReplaceAllString(clean, "-")
	slug = strings.Trim(slug, "-")
	if len(slug) > 30 {
		slug = slug[:30]
		slug = strings.Trim(slug, "-")
	}
	if slug == "" {
		slug = "TASK"
	}
	return fmt.Sprintf("%s-%s", slug, time.Now().Format("020115"))
}

// TaskBlock representa as linhas brutas que compõem uma tarefa em todo.md
type TaskBlock struct {
	ID        string
	Title     string
	Completed bool
	Section   string
	Lines     []string
}

// readTodoFile lê todo.md e retorna as linhas
func readTodoLines(nexusDir string) ([]string, string, error) {
	todoPath := filepath.Join(nexusDir, "tasks", "todo.md")
	content, err := os.ReadFile(todoPath)
	if err != nil {
		return nil, todoPath, err
	}
	lines := strings.Split(string(content), "\n")
	return lines, todoPath, nil
}

// parseTaskBlocks disseca todo.md identificando onde cada tarefa começa e termina
func parseTaskBlocks(lines []string) ([]TaskBlock, error) {
	var blocks []TaskBlock
	var currentBlock *TaskBlock
	currentSection := ""

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(trimmed, "## ") {
			if currentBlock != nil {
				blocks = append(blocks, *currentBlock)
				currentBlock = nil
			}
			sec := matchSection(line)
			if sec != "" {
				currentSection = sec
			}
			continue
		}

		if match := reTaskLine.FindStringSubmatch(line); len(match) > 3 {
			if currentBlock != nil {
				blocks = append(blocks, *currentBlock)
			}
			completed := strings.ToLower(match[1]) == "x"
			id := match[2]
			title := match[3]
			currentBlock = &TaskBlock{
				ID:        id,
				Title:     title,
				Completed: completed,
				Section:   currentSection,
				Lines:     []string{line},
			}
			continue
		}

		if currentBlock != nil {
			if strings.HasPrefix(trimmed, "---") || strings.HasPrefix(trimmed, "#") {
				blocks = append(blocks, *currentBlock)
				currentBlock = nil
			} else {
				currentBlock.Lines = append(currentBlock.Lines, line)
			}
		}
	}

	if currentBlock != nil {
		blocks = append(blocks, *currentBlock)
	}

	return blocks, nil
}

// CreateTask adiciona uma nova tarefa ao todo.md
func CreateTask(nexusDir string, item TaskItem, targetSection string) (*TaskItem, error) {
	if strings.TrimSpace(item.Title) == "" {
		return nil, fmt.Errorf("o título da tarefa não pode estar vazio")
	}

	if targetSection == "" {
		targetSection = "backlog"
	}

	if strings.TrimSpace(item.ID) == "" {
		item.ID = GenerateTaskID(item.Title)
	} else {
		item.ID = strings.ToUpper(strings.TrimSpace(item.ID))
	}

	lines, todoPath, err := readTodoLines(nexusDir)
	if err != nil {
		return nil, err
	}

	// Verifica duplicidade de ID
	targetBracket := fmt.Sprintf("[%s]", item.ID)
	for _, l := range lines {
		if strings.Contains(l, targetBracket) && (strings.Contains(l, "- [ ]") || strings.Contains(l, "- [x]")) {
			return nil, fmt.Errorf("já existe uma tarefa com o ID '%s'", item.ID)
		}
	}

	checkChar := " "
	if targetSection == "done" || item.Completed {
		checkChar = "x"
		item.Completed = true
	}

	// Monta as linhas da nova tarefa
	nowDate := time.Now().Format("02/01/2006")
	headerLine := fmt.Sprintf("- [%s] **[%s] %s (%s)**", checkChar, item.ID, item.Title, nowDate)
	newBlockLines := []string{headerLine}

	if strings.TrimSpace(item.Context) != "" {
		newBlockLines = append(newBlockLines, fmt.Sprintf("  - **Contexto:** %s", strings.TrimSpace(item.Context)))
	}
	if strings.TrimSpace(item.Responsible) != "" {
		newBlockLines = append(newBlockLines, fmt.Sprintf("  - **Responsável:** %s", strings.TrimSpace(item.Responsible)))
	}
	newBlockLines = append(newBlockLines, "")

	// Encontra a seção de destino para inserir logo abaixo dela
	sectionHeaderFound := false
	var newLines []string

	for i := 0; i < len(lines); i++ {
		line := lines[i]
		newLines = append(newLines, line)

		if strings.HasPrefix(strings.TrimSpace(line), "## ") && matchSection(line) == targetSection {
			sectionHeaderFound = true
			// Inserir após o cabeçalho (e pular linha em branco se houver)
			if i+1 < len(lines) && strings.TrimSpace(lines[i+1]) == "" {
				newLines = append(newLines, lines[i+1])
				i++
			}
			newLines = append(newLines, newBlockLines...)
		}
	}

	if !sectionHeaderFound {
		// Se a seção não existir no arquivo, adiciona no final
		newLines = append(newLines, "", SectionHeader(targetSection), "")
		newLines = append(newLines, newBlockLines...)
	}

	output := strings.Join(newLines, "\n")
	if err := os.WriteFile(todoPath, []byte(output), 0644); err != nil {
		return nil, err
	}

	return &item, nil
}

// MoveTask move uma tarefa de uma coluna/seção para outra
func MoveTask(nexusDir string, taskID string, targetSection string) error {
	taskID = strings.TrimSpace(taskID)
	if taskID == "" {
		return fmt.Errorf("ID da tarefa é obrigatório")
	}
	if targetSection == "" {
		targetSection = "backlog"
	}

	lines, todoPath, err := readTodoLines(nexusDir)
	if err != nil {
		return err
	}

	targetBracket := fmt.Sprintf("[%s]", taskID)
	startIdx := -1
	endIdx := -1

	// Localiza início do bloco da tarefa
	for i, line := range lines {
		if strings.Contains(line, targetBracket) && (strings.Contains(line, "- [ ]") || strings.Contains(line, "- [x]") || strings.Contains(line, "- [X]")) {
			startIdx = i
			break
		}
	}

	if startIdx == -1 {
		return fmt.Errorf("tarefa com ID '%s' não encontrada", taskID)
	}

	// Localiza fim do bloco da tarefa
	endIdx = len(lines)
	for i := startIdx + 1; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "- [") || strings.HasPrefix(trimmed, "## ") || strings.HasPrefix(trimmed, "---") {
			endIdx = i
			break
		}
	}

	// Extrai as linhas do bloco
	taskLines := make([]string, endIdx-startIdx)
	copy(taskLines, lines[startIdx:endIdx])

	// Ajusta o checkbox conforme a seção de destino
	if targetSection == "done" {
		taskLines[0] = strings.Replace(taskLines[0], "- [ ]", "- [x]", 1)
	} else {
		taskLines[0] = strings.Replace(taskLines[0], "- [x]", "- [ ]", 1)
		taskLines[0] = strings.Replace(taskLines[0], "- [X]", "- [ ]", 1)
	}

	// Limpa linhas em branco extras no final do bloco da tarefa
	for len(taskLines) > 0 && strings.TrimSpace(taskLines[len(taskLines)-1]) == "" {
		taskLines = taskLines[:len(taskLines)-1]
	}
	taskLines = append(taskLines, "")

	// Remove as linhas antigas
	linesWithoutTask := append(lines[:startIdx], lines[endIdx:]...)

	// Insere na nova seção
	var resultLines []string
	inserted := false

	for i := 0; i < len(linesWithoutTask); i++ {
		line := linesWithoutTask[i]
		resultLines = append(resultLines, line)

		if !inserted && strings.HasPrefix(strings.TrimSpace(line), "## ") && matchSection(line) == targetSection {
			inserted = true
			if i+1 < len(linesWithoutTask) && strings.TrimSpace(linesWithoutTask[i+1]) == "" {
				resultLines = append(resultLines, linesWithoutTask[i+1])
				i++
			}
			resultLines = append(resultLines, taskLines...)
		}
	}

	if !inserted {
		resultLines = append(resultLines, "", SectionHeader(targetSection), "")
		resultLines = append(resultLines, taskLines...)
	}

	output := strings.Join(resultLines, "\n")
	return os.WriteFile(todoPath, []byte(output), 0644)
}

// UpdateTask atualiza os dados de uma tarefa existente (título, contexto, responsável e/ou seção)
func UpdateTask(nexusDir string, item TaskItem, targetSection string) error {
	taskID := strings.TrimSpace(item.ID)
	if taskID == "" {
		return fmt.Errorf("ID da tarefa é obrigatório")
	}

	lines, todoPath, err := readTodoLines(nexusDir)
	if err != nil {
		return err
	}

	targetBracket := fmt.Sprintf("[%s]", taskID)
	startIdx := -1
	endIdx := -1
	currentSection := ""

	// Localiza início e seção
	sec := ""
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "## ") {
			if s := matchSection(line); s != "" {
				sec = s
			}
		}
		if strings.Contains(line, targetBracket) && (strings.Contains(line, "- [ ]") || strings.Contains(line, "- [x]") || strings.Contains(line, "- [X]")) {
			startIdx = i
			currentSection = sec
			break
		}
	}

	if startIdx == -1 {
		return fmt.Errorf("tarefa com ID '%s' não encontrada", taskID)
	}

	// Localiza fim do bloco
	endIdx = len(lines)
	for i := startIdx + 1; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "- [") || strings.HasPrefix(trimmed, "## ") || strings.HasPrefix(trimmed, "---") {
			endIdx = i
			break
		}
	}

	// Determina se a seção mudou
	destinationSection := currentSection
	if targetSection != "" {
		destinationSection = targetSection
	}

	// Constrói o novo bloco
	isCompleted := destinationSection == "done" || item.Completed
	checkChar := " "
	if isCompleted {
		checkChar = "x"
	}

	title := strings.TrimSpace(item.Title)
	if title == "" {
		// Mantém o título original se não informado
		if match := reTaskLine.FindStringSubmatch(lines[startIdx]); len(match) > 3 {
			title = match[3]
		}
	}

	newBlockLines := []string{
		fmt.Sprintf("- [%s] **[%s] %s**", checkChar, taskID, title),
	}
	if strings.TrimSpace(item.Context) != "" {
		newBlockLines = append(newBlockLines, fmt.Sprintf("  - **Contexto:** %s", strings.TrimSpace(item.Context)))
	}
	if strings.TrimSpace(item.Responsible) != "" {
		newBlockLines = append(newBlockLines, fmt.Sprintf("  - **Responsável:** %s", strings.TrimSpace(item.Responsible)))
	}
	newBlockLines = append(newBlockLines, "")

	// Se a seção for a mesma, substitui in-place
	if destinationSection == currentSection {
		newLines := append(lines[:startIdx], append(newBlockLines, lines[endIdx:]...)...)
		output := strings.Join(newLines, "\n")
		return os.WriteFile(todoPath, []byte(output), 0644)
	}

	// Se mudou de seção, remove do local antigo e insere na nova seção
	linesWithoutOld := append(lines[:startIdx], lines[endIdx:]...)
	var finalLines []string
	inserted := false

	for i := 0; i < len(linesWithoutOld); i++ {
		line := linesWithoutOld[i]
		finalLines = append(finalLines, line)

		if !inserted && strings.HasPrefix(strings.TrimSpace(line), "## ") && matchSection(line) == destinationSection {
			inserted = true
			if i+1 < len(linesWithoutOld) && strings.TrimSpace(linesWithoutOld[i+1]) == "" {
				finalLines = append(finalLines, linesWithoutOld[i+1])
				i++
			}
			finalLines = append(finalLines, newBlockLines...)
		}
	}

	if !inserted {
		finalLines = append(finalLines, "", SectionHeader(destinationSection), "")
		finalLines = append(finalLines, newBlockLines...)
	}

	output := strings.Join(finalLines, "\n")
	return os.WriteFile(todoPath, []byte(output), 0644)
}

// DeleteTask remove completamente uma tarefa do todo.md
func DeleteTask(nexusDir string, taskID string) error {
	taskID = strings.TrimSpace(taskID)
	if taskID == "" {
		return fmt.Errorf("ID da tarefa é obrigatório")
	}

	lines, todoPath, err := readTodoLines(nexusDir)
	if err != nil {
		return err
	}

	targetBracket := fmt.Sprintf("[%s]", taskID)
	startIdx := -1
	endIdx := -1

	for i, line := range lines {
		if strings.Contains(line, targetBracket) && (strings.Contains(line, "- [ ]") || strings.Contains(line, "- [x]") || strings.Contains(line, "- [X]")) {
			startIdx = i
			break
		}
	}

	if startIdx == -1 {
		return fmt.Errorf("tarefa com ID '%s' não encontrada", taskID)
	}

	endIdx = len(lines)
	for i := startIdx + 1; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "- [") || strings.HasPrefix(trimmed, "## ") || strings.HasPrefix(trimmed, "---") {
			endIdx = i
			break
		}
	}

	// Pula linha em branco imediatamente após o bloco se existir
	if endIdx < len(lines) && strings.TrimSpace(lines[endIdx]) == "" {
		endIdx++
	}

	resultLines := append(lines[:startIdx], lines[endIdx:]...)
	output := strings.Join(resultLines, "\n")
	return os.WriteFile(todoPath, []byte(output), 0644)
}

// ParseTasksWithSections traz as tarefas associadas às suas seções
func ParseTasksFile(scanner *bufio.Scanner) {
	// Mantido para compatibilidade se necessário
}
