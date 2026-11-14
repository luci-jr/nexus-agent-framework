package parser

import (
	"os"
	"path/filepath"
	"testing"
)

func TestTaskDetailsLifecycle(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nexus-task-details-test-*")
	if err != nil {
		t.Fatalf("Erro ao criar temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Cria estrutura mínima
	_ = os.MkdirAll(filepath.Join(tempDir, "tasks"), 0755)
	todoContent := "## 📌 Backlog Prioritário\n- [ ] **[TASK-TEST-1] Tarefa de Teste**\n  - **Contexto:** Descrição inicial\n  - **Responsável:** Lucy\n"
	_ = os.WriteFile(filepath.Join(tempDir, "tasks", "todo.md"), []byte(todoContent), 0644)

	// 1. GetTaskDetails deve carregar do todo.md
	details, err := GetTaskDetails(tempDir, "TASK-TEST-1")
	if err != nil {
		t.Fatalf("GetTaskDetails falhou: %v", err)
	}
	if details.Title != "Tarefa de Teste" {
		t.Errorf("Esperava título 'Tarefa de Teste', obteve '%s'", details.Title)
	}
	if details.Description != "Descrição inicial" {
		t.Errorf("Esperava descrição 'Descrição inicial', obteve '%s'", details.Description)
	}

	// 2. Salvar detalhes atualizados
	details.Description = "Nova descrição detalhada com markdown"
	details.Tags = []string{"Frontend", "Quadro"}
	if err := SaveTaskDetails(tempDir, details); err != nil {
		t.Fatalf("SaveTaskDetails falhou: %v", err)
	}

	updated, err := GetTaskDetails(tempDir, "TASK-TEST-1")
	if err != nil || updated.Description != "Nova descrição detalhada com markdown" {
		t.Errorf("Falha ao persistir descrição atualizada: %v", err)
	}

	// 3. Comentários
	c1, err := AddComment(tempDir, "TASK-TEST-1", "Lucivaldo", "👨‍💻", "Primeiro comentário de andamento!")
	if err != nil || c1 == nil {
		t.Fatalf("AddComment falhou: %v", err)
	}
	updated, _ = GetTaskDetails(tempDir, "TASK-TEST-1")
	if len(updated.Comments) != 1 || updated.Comments[0].Text != "Primeiro comentário de andamento!" {
		t.Errorf("Comentário não adicionado corretamente")
	}

	// 4. Links
	l1, err := AddLink(tempDir, "TASK-TEST-1", "Documentação", "https://nexus.lucivaldo.cloud")
	if err != nil || l1 == nil {
		t.Fatalf("AddLink falhou: %v", err)
	}
	updated, _ = GetTaskDetails(tempDir, "TASK-TEST-1")
	if len(updated.Links) != 1 || updated.Links[0].URL != "https://nexus.lucivaldo.cloud" {
		t.Errorf("Link não adicionado corretamente")
	}

	// 5. Anexo
	a1, err := AddAttachment(tempDir, "TASK-TEST-1", "print.png", "tasks/attachments/TASK-TEST-1/print.png", "120 KB", "image/png")
	if err != nil || a1 == nil {
		t.Fatalf("AddAttachment falhou: %v", err)
	}
	updated, _ = GetTaskDetails(tempDir, "TASK-TEST-1")
	if len(updated.Attachments) != 1 {
		t.Errorf("Anexo não adicionado corretamente")
	}

	// 6. Delete Link, Comment, Attachment
	if err := DeleteLink(tempDir, "TASK-TEST-1", l1.ID); err != nil {
		t.Errorf("DeleteLink falhou: %v", err)
	}
	if err := DeleteComment(tempDir, "TASK-TEST-1", c1.ID); err != nil {
		t.Errorf("DeleteComment falhou: %v", err)
	}
	if err := DeleteAttachment(tempDir, "TASK-TEST-1", a1.ID); err != nil {
		t.Errorf("DeleteAttachment falhou: %v", err)
	}

	updated, _ = GetTaskDetails(tempDir, "TASK-TEST-1")
	if len(updated.Links) != 0 || len(updated.Comments) != 0 || len(updated.Attachments) != 0 {
		t.Errorf("Falha ao remover link, comentário ou anexo")
	}
}
