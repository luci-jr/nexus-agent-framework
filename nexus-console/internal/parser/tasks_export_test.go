package parser

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestTasksExportAllFormats(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nexus-tasks-export-test-*")
	if err != nil {
		t.Fatalf("Erro ao criar tempdir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	tasksDir := filepath.Join(tempDir, "tasks")
	if err := os.MkdirAll(tasksDir, 0755); err != nil {
		t.Fatalf("Erro ao criar tasks dir: %v", err)
	}

	mockContent := `# 📋 Nexus Tasks
## 📌 Backlog Prioritário
- [ ] **[TASK-01] Primeira Tarefa no Backlog**
  - **Contexto:** Teste do backlog
  - **Responsável:** Lucy

## 📋 A Fazer (To Do)
- [ ] **[TASK-02] Tarefa a Fazer**
  - **Contexto:** Pronta para sprint

## 🚀 Em Andamento (Sprint Atual)
- [ ] **[TASK-03] Tarefa em Andamento**
  - **Contexto:** Codando agora

## 🔬 Em Homologação & QA
- [ ] **[TASK-04] Tarefa em Homologação**
  - **Contexto:** Validando testes

## ✅ Concluídas Recentemente
- [x] **[TASK-05] Tarefa Concluída**
  - **Contexto:** Feita e homologada

## 🗄️ Arquivado & Descontinuado
- [ ] **[TASK-06] Ideia Congelada ou Descontinuada**
  - **Contexto:** Projeto pausado por inviabilidade técnica
`
	if err := os.WriteFile(filepath.Join(tasksDir, "todo.md"), []byte(mockContent), 0644); err != nil {
		t.Fatalf("Erro ao escrever todo.md: %v", err)
	}

	// 1. Validar que ParseTasks lê as 6 colunas corretamente
	data, err := ParseTasks(tempDir)
	if err != nil {
		t.Fatalf("ParseTasks falhou: %v", err)
	}
	if len(data.Backlog) != 1 || data.Backlog[0].ID != "TASK-01" {
		t.Errorf("Backlog inesperado: %+v", data.Backlog)
	}
	if len(data.ToDo) != 1 || data.ToDo[0].ID != "TASK-02" {
		t.Errorf("ToDo inesperado: %+v", data.ToDo)
	}
	if len(data.InProgress) != 1 || data.InProgress[0].ID != "TASK-03" {
		t.Errorf("InProgress inesperado: %+v", data.InProgress)
	}
	if len(data.Homologacao) != 1 || data.Homologacao[0].ID != "TASK-04" {
		t.Errorf("Homologacao inesperado: %+v", data.Homologacao)
	}
	if len(data.Done) != 1 || data.Done[0].ID != "TASK-05" {
		t.Errorf("Done inesperado: %+v", data.Done)
	}
	if len(data.Archived) != 1 || data.Archived[0].ID != "TASK-06" {
		t.Errorf("Archived inesperado: %+v", data.Archived)
	}

	// 2. Testar ExportTasksJSON
	jsonData, err := ExportTasksJSON(tempDir)
	if err != nil {
		t.Fatalf("ExportTasksJSON falhou: %v", err)
	}
	var parsedJSON map[string]interface{}
	if err := json.Unmarshal(jsonData, &parsedJSON); err != nil {
		t.Fatalf("JSON exportado inválido: %v", err)
	}
	if total, ok := parsedJSON["total_tasks"].(float64); !ok || total != 6 {
		t.Errorf("Esperado 6 tarefas no JSON, obtido %v", parsedJSON["total_tasks"])
	}

	// 3. Testar ExportTasksCSV
	csvData, err := ExportTasksCSV(tempDir)
	if err != nil {
		t.Fatalf("ExportTasksCSV falhou: %v", err)
	}
	csvStr := string(csvData)
	if !strings.Contains(csvStr, "TASK-01") || !strings.Contains(csvStr, "TASK-06") {
		t.Errorf("CSV exportado não contém todas as tarefas: %s", csvStr)
	}
	if !strings.Contains(csvStr, "Arquivado & Descontinuado") {
		t.Errorf("CSV exportado não contém a 6ª coluna: %s", csvStr)
	}

	// 4. Testar ExportTasksTXT
	txtData, err := ExportTasksTXT(tempDir)
	if err != nil {
		t.Fatalf("ExportTasksTXT falhou: %v", err)
	}
	txtStr := string(txtData)
	if !strings.Contains(txtStr, "ARQUIVADO & DESCONTINUADO") || !strings.Contains(txtStr, "[TASK-06]") {
		t.Errorf("TXT exportado não contém a 6ª seção: %s", txtStr)
	}

	// 5. Testar ExportTasksMD
	mdData, err := ExportTasksMD(tempDir)
	if err != nil {
		t.Fatalf("ExportTasksMD falhou: %v", err)
	}
	mdStr := string(mdData)
	if !strings.Contains(mdStr, "TASK-06") || !strings.Contains(mdStr, "Arquivado & Descontinuado") {
		t.Errorf("MD exportado não contém conteúdo esperado: %s", mdStr)
	}
	if strings.Contains(mdStr, "- [ ]") || strings.Contains(mdStr, "- [x]") || strings.Contains(mdStr, "- [X]") {
		t.Errorf("MD exportado ainda contém checkboxes indesejadas: %s", mdStr)
	}
	if !strings.Contains(mdStr, "- **[TASK-01] Primeira Tarefa no Backlog**") {
		t.Errorf("MD exportado não contém a tarefa convertida sem checkbox: %s", mdStr)
	}

	// 6. Testar MoveTask para 'archived'
	if err := MoveTask(tempDir, "TASK-01", "archived"); err != nil {
		t.Fatalf("MoveTask para archived falhou: %v", err)
	}
	updatedData, err := ParseTasks(tempDir)
	if err != nil {
		t.Fatalf("ParseTasks pós-move falhou: %v", err)
	}
	if len(updatedData.Backlog) != 0 {
		t.Errorf("Backlog deveria estar vazio após mover TASK-01")
	}
	if len(updatedData.Archived) != 2 {
		t.Errorf("Archived deveria ter 2 tarefas após mover TASK-01, tem %d", len(updatedData.Archived))
	}
}
