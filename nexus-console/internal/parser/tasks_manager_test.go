package parser

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const sampleTodo = `# 📋 Nexus Tasks — Teste

## 📌 Backlog Prioritário

- [ ] **[TASK-1] Primeira Tarefa**
  - **Contexto:** Contexto 1
  - **Responsável:** @lucy

- [ ] **[TASK-2] Segunda Tarefa**
  - **Contexto:** Contexto 2

---

## 🔬 Em Homologação & QA

*(Nenhuma tarefa)*

---

## 🚀 Em Andamento (Sprint Atual)

- [ ] **[TASK-3] Tarefa em andamento**

---

## ✅ Concluídas Recentemente

- [x] **[TASK-DONE-1] Tarefa finalizada**
`

func setupTestTodo(t *testing.T) (string, func()) {
	tmpDir, err := os.MkdirTemp("", "nexus-tasks-test-*")
	if err != nil {
		t.Fatalf("falha ao criar tmpDir: %v", err)
	}
	tasksDir := filepath.Join(tmpDir, "tasks")
	_ = os.MkdirAll(tasksDir, 0755)
	todoPath := filepath.Join(tasksDir, "todo.md")
	if err := os.WriteFile(todoPath, []byte(sampleTodo), 0644); err != nil {
		t.Fatalf("falha ao criar todo.md: %v", err)
	}
	return tmpDir, func() { os.RemoveAll(tmpDir) }
}

func TestCreateTask(t *testing.T) {
	dir, teardown := setupTestTodo(t)
	defer teardown()

	item := TaskItem{
		ID:          "TASK-NEW",
		Title:       "Nova Tarefa Criada",
		Context:     "Testando criação",
		Responsible: "@backend",
	}

	created, err := CreateTask(dir, item, "backlog")
	if err != nil {
		t.Fatalf("CreateTask falhou: %v", err)
	}
	if created.ID != "TASK-NEW" {
		t.Errorf("ID esperado TASK-NEW, obtido %s", created.ID)
	}

	tasks, err := ParseTasks(dir)
	if err != nil {
		t.Fatalf("ParseTasks falhou: %v", err)
	}

	found := false
	for _, tsk := range tasks.Backlog {
		if tsk.ID == "TASK-NEW" {
			found = true
			if tsk.Title == "" || !strings.Contains(tsk.Title, "Nova Tarefa Criada") {
				t.Errorf("título incorreto: %s", tsk.Title)
			}
			break
		}
	}
	if !found {
		t.Errorf("tarefa criada não encontrada no backlog via ParseTasks")
	}

	// Testa duplicação de ID
	_, err = CreateTask(dir, item, "backlog")
	if err == nil {
		t.Errorf("esperava erro de duplicidade de ID, mas teve sucesso")
	}
}

func TestMoveTask(t *testing.T) {
	dir, teardown := setupTestTodo(t)
	defer teardown()

	// Move TASK-1 de backlog para in_progress
	err := MoveTask(dir, "TASK-1", "in_progress")
	if err != nil {
		t.Fatalf("MoveTask falhou: %v", err)
	}

	tasks, err := ParseTasks(dir)
	if err != nil {
		t.Fatalf("ParseTasks falhou: %v", err)
	}

	// Verifica se saiu do backlog
	for _, tsk := range tasks.Backlog {
		if tsk.ID == "TASK-1" {
			t.Errorf("TASK-1 ainda está no backlog após mover")
		}
	}

	// Verifica se entrou em in_progress
	foundProg := false
	for _, tsk := range tasks.InProgress {
		if tsk.ID == "TASK-1" {
			foundProg = true
			if tsk.Completed {
				t.Errorf("TASK-1 não deveria estar concluída em in_progress")
			}
		}
	}
	if !foundProg {
		t.Errorf("TASK-1 não foi encontrada em in_progress")
	}

	// Move TASK-1 para done (deve marcar [x])
	err = MoveTask(dir, "TASK-1", "done")
	if err != nil {
		t.Fatalf("MoveTask para done falhou: %v", err)
	}

	tasks, _ = ParseTasks(dir)
	foundDone := false
	for _, tsk := range tasks.Done {
		if tsk.ID == "TASK-1" {
			foundDone = true
			if !tsk.Completed {
				t.Errorf("TASK-1 deveria estar marcada como concluída em done")
			}
		}
	}
	if !foundDone {
		t.Errorf("TASK-1 não foi encontrada em done")
	}

	// Move TASK-DONE-1 de done para backlog (deve desmarcar para [ ])
	err = MoveTask(dir, "TASK-DONE-1", "backlog")
	if err != nil {
		t.Fatalf("MoveTask de done para backlog falhou: %v", err)
	}

	tasks, _ = ParseTasks(dir)
	foundBack := false
	for _, tsk := range tasks.Backlog {
		if tsk.ID == "TASK-DONE-1" {
			foundBack = true
			if tsk.Completed {
				t.Errorf("TASK-DONE-1 deveria ter sido desmarcada para [ ]")
			}
		}
	}
	if !foundBack {
		t.Errorf("TASK-DONE-1 não foi encontrada no backlog")
	}
}

func TestUpdateTask(t *testing.T) {
	dir, teardown := setupTestTodo(t)
	defer teardown()

	item := TaskItem{
		ID:          "TASK-2",
		Title:       "Segunda Tarefa Atualizada",
		Context:     "Novo Contexto Atualizado",
		Responsible: "@qa",
	}

	// Atualiza e move para homologação
	err := UpdateTask(dir, item, "homologacao")
	if err != nil {
		t.Fatalf("UpdateTask falhou: %v", err)
	}

	tasks, err := ParseTasks(dir)
	if err != nil {
		t.Fatalf("ParseTasks falhou: %v", err)
	}

	found := false
	for _, tsk := range tasks.Homologacao {
		if tsk.ID == "TASK-2" {
			found = true
			if !strings.Contains(tsk.Title, "Segunda Tarefa Atualizada") {
				t.Errorf("título não atualizado: %s", tsk.Title)
			}
			if tsk.Context != "Novo Contexto Atualizado" {
				t.Errorf("contexto não atualizado: %s", tsk.Context)
			}
			if tsk.Responsible != "@qa" {
				t.Errorf("responsável não atualizado: %s", tsk.Responsible)
			}
		}
	}
	if !found {
		t.Errorf("TASK-2 não foi encontrada em homologação após update")
	}
}

func TestDeleteTask(t *testing.T) {
	dir, teardown := setupTestTodo(t)
	defer teardown()

	err := DeleteTask(dir, "TASK-3")
	if err != nil {
		t.Fatalf("DeleteTask falhou: %v", err)
	}

	tasks, err := ParseTasks(dir)
	if err != nil {
		t.Fatalf("ParseTasks falhou: %v", err)
	}

	for _, tsk := range tasks.InProgress {
		if tsk.ID == "TASK-3" {
			t.Errorf("TASK-3 não foi deletada de in_progress")
		}
	}

	// Tentar deletar inexistente deve dar erro
	err = DeleteTask(dir, "TASK-NAO-EXISTE")
	if err == nil {
		t.Errorf("esperava erro ao deletar tarefa inexistente")
	}
}
