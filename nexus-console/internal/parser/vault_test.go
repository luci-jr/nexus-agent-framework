package parser

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDeleteFileSecurely_BlocksVitalFiles(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "nexus-vault-test-*")
	if err != nil {
		t.Fatalf("falha ao criar tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Cria arquivo vital simulado
	memoriaPath := filepath.Join(tmpDir, "memoria_lucy.md")
	_ = os.WriteFile(memoriaPath, []byte("vital memory"), 0644)

	// Tenta deletar arquivo vital
	_, err = DeleteFileSecurely(tmpDir, "memoria_lucy.md")
	if err == nil {
		t.Errorf("esperava erro ao tentar excluir memoria_lucy.md, mas teve sucesso")
	}
	if !strings.Contains(err.Error(), "vital de governança") {
		t.Errorf("mensagem de erro inesperada: %v", err)
	}

	// Tenta deletar arquivo em diretório protegido (iac/)
	_ = os.MkdirAll(filepath.Join(tmpDir, "iac"), 0755)
	iacFile := filepath.Join(tmpDir, "iac", "stack.yaml")
	_ = os.WriteFile(iacFile, []byte("stack"), 0644)
	_, err = DeleteFileSecurely(tmpDir, "iac/stack.yaml")
	if err == nil {
		t.Errorf("esperava erro ao tentar excluir arquivo em iac/, mas teve sucesso")
	}
}

func TestDeleteFileSecurely_MovesToTrash(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "nexus-vault-test-*")
	if err != nil {
		t.Fatalf("falha ao criar tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Cria arquivo comum no vault
	relPath := "notas/rascunho.md"
	notePath := filepath.Join(tmpDir, "notas", "rascunho.md")
	_ = os.MkdirAll(filepath.Dir(notePath), 0755)
	_ = os.WriteFile(notePath, []byte("# Rascunho"), 0644)

	trashRel, err := DeleteFileSecurely(tmpDir, relPath)
	if err != nil {
		t.Fatalf("DeleteFileSecurely falhou: %v", err)
	}

	// Verifica se arquivo original sumiu
	if _, err := os.Stat(notePath); !os.IsNotExist(err) {
		t.Errorf("o arquivo original ainda existe em %s", notePath)
	}

	// Verifica se arquivo foi para .trash
	trashAbs := filepath.Join(tmpDir, trashRel)
	if _, err := os.Stat(trashAbs); err != nil {
		t.Errorf("o arquivo não foi encontrado na lixeira em %s: %v", trashAbs, err)
	}

	content, _ := os.ReadFile(trashAbs)
	if string(content) != "# Rascunho" {
		t.Errorf("conteúdo corrompido na lixeira: %s", string(content))
	}
}
