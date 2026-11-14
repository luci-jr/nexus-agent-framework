package parser

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var reCheckboxes = regexp.MustCompile(`(?m)^(\s*[-*+])\s*\[[ xX]\]\s+`)

// StripCheckboxes remove checkboxes '- [ ]', '- [x]', '- [X]' mantendo apenas o marcador de lista limpo
func StripCheckboxes(input string) string {
	return reCheckboxes.ReplaceAllString(input, "$1 ")
}

// ExportTasksJSON exporta todo o quadro em formato JSON estruturado e identado
func ExportTasksJSON(nexusDir string) ([]byte, error) {
	data, err := ParseTasks(nexusDir)
	if err != nil {
		return nil, err
	}

	total := len(data.Backlog) + len(data.ToDo) + len(data.InProgress) + len(data.Homologacao) + len(data.Done) + len(data.Archived)

	cleanTasks := func(items []TaskItem) []TaskItem {
		out := make([]TaskItem, len(items))
		for i, it := range items {
			it.Raw = StripCheckboxes(it.Raw)
			it.Title = StripCheckboxes(it.Title)
			it.Context = StripCheckboxes(it.Context)
			out[i] = it
		}
		return out
	}

	payload := map[string]interface{}{
		"title":       "Nexus Ecosystem — Quadro de Tarefas & Engenharia",
		"exported_at": time.Now().Format(time.RFC3339),
		"total_tasks": total,
		"columns": map[string]interface{}{
			"backlog":     cleanTasks(data.Backlog),
			"todo":        cleanTasks(data.ToDo),
			"in_progress": cleanTasks(data.InProgress),
			"homologacao": cleanTasks(data.Homologacao),
			"done":        cleanTasks(data.Done),
			"archived":    cleanTasks(data.Archived),
		},
	}

	return json.MarshalIndent(payload, "", "  ")
}

// ExportTasksCSV exporta todo o quadro em formato CSV RFC 4180 com UTF-8 BOM
func ExportTasksCSV(nexusDir string) ([]byte, error) {
	data, err := ParseTasks(nexusDir)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	// UTF-8 BOM para garantir compatibilidade perfeita com Excel / LibreOffice
	buf.WriteString("\xef\xbb\xbf")

	writer := csv.NewWriter(&buf)
	header := []string{"ID", "Título", "Coluna", "Status", "Responsável", "Contexto"}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	sections := []struct {
		name  string
		items []TaskItem
	}{
		{"Backlog Prioritário", data.Backlog},
		{"A Fazer (To Do)", data.ToDo},
		{"Em Andamento", data.InProgress},
		{"Homologação & QA", data.Homologacao},
		{"Concluídas", data.Done},
		{"Arquivado & Descontinuado", data.Archived},
	}

	for _, sec := range sections {
		for _, item := range sec.items {
			status := "Pendente"
			if item.Completed {
				status = "Concluído"
			}
			record := []string{
				item.ID,
				StripCheckboxes(item.Title),
				sec.name,
				status,
				item.Responsible,
				StripCheckboxes(item.Context),
			}
			if err := writer.Write(record); err != nil {
				return nil, err
			}
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// ExportTasksTXT exporta o quadro em texto legível e diagramado
func ExportTasksTXT(nexusDir string) ([]byte, error) {
	data, err := ParseTasks(nexusDir)
	if err != nil {
		return nil, err
	}

	total := len(data.Backlog) + len(data.ToDo) + len(data.InProgress) + len(data.Homologacao) + len(data.Done) + len(data.Archived)
	now := time.Now().Format("02/01/2006 15:04:05")

	var sb strings.Builder
	sb.WriteString("================================================================================\n")
	sb.WriteString("🌌 NEXUS ECOSYSTEM — EXPORTAÇÃO DO QUADRO DE ENGENHARIA & TAREFAS\n")
	sb.WriteString(fmt.Sprintf("Data de Exportação: %s (Horário de Brasília)\n", now))
	sb.WriteString(fmt.Sprintf("Total de Tarefas Registradas: %d\n", total))
	sb.WriteString("================================================================================\n\n")

	sections := []struct {
		title string
		items []TaskItem
	}{
		{"1. 📌 BACKLOG PRIORITÁRIO", data.Backlog},
		{"2. 📋 A FAZER (TO DO)", data.ToDo},
		{"3. 🚀 EM ANDAMENTO (SPRINT ATUAL)", data.InProgress},
		{"4. 🔬 EM HOMOLOGAÇÃO & QA", data.Homologacao},
		{"5. ✅ CONCLUÍDAS RECENTEMENTE", data.Done},
		{"6. 🗄️ ARQUIVADO & DESCONTINUADO", data.Archived},
	}

	for _, sec := range sections {
		sb.WriteString(fmt.Sprintf("[%s] (%d tarefas)\n", sec.title, len(sec.items)))
		sb.WriteString("--------------------------------------------------------------------------------\n")
		if len(sec.items) == 0 {
			sb.WriteString("  (Nenhuma tarefa registrada nesta seção)\n\n")
			continue
		}
		for _, item := range sec.items {
			status := "Pendente"
			if item.Completed {
				status = "Concluído"
			}
			title := StripCheckboxes(item.Title)
			context := StripCheckboxes(item.Context)
			sb.WriteString(fmt.Sprintf("* [%s] %s\n", item.ID, title))
			sb.WriteString(fmt.Sprintf("  - Status: %s\n", status))
			if item.Responsible != "" {
				sb.WriteString(fmt.Sprintf("  - Responsável: %s\n", item.Responsible))
			}
			if context != "" {
				sb.WriteString(fmt.Sprintf("  - Contexto: %s\n", context))
			}
			sb.WriteString("\n")
		}
	}

	return []byte(sb.String()), nil
}

// ExportTasksMD exporta o quadro completo em formato Markdown nativo sem checkboxes
func ExportTasksMD(nexusDir string) ([]byte, error) {
	todoPath := filepath.Join(nexusDir, "tasks", "todo.md")
	content, err := os.ReadFile(todoPath)
	if err != nil {
		return nil, err
	}

	cleanStr := StripCheckboxes(string(content))

	// Adiciona cabeçalho de exportação com carimbo de data/hora
	now := time.Now().Format("02/01/2006 15:04:05")
	header := fmt.Sprintf("<!-- Exportação Gerada Automaticamente pelo Nexus Console em %s -->\n", now)
	result := []byte(header + cleanStr)
	return result, nil
}
