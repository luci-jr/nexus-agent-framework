package config_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/luci-jr/nexus-mcp/internal/config"
)

func TestGetPaths(t *testing.T) {
	paths, err := config.GetPaths()
	if err != nil {
		t.Fatalf("Erro inesperado ao resolver caminhos: %v", err)
	}

	home, _ := os.UserHomeDir()

	if !strings.HasPrefix(paths.NexusDir, home) {
		t.Errorf("Esperava que NexusDir iniciasse com %s, obteve %s", home, paths.NexusDir)
	}

	if filepath.Base(paths.MemoriaPath) != "memoria_lucy.md" {
		t.Errorf("Esperava memoria_lucy.md, obteve %s", filepath.Base(paths.MemoriaPath))
	}

	if !strings.Contains(paths.MemoriaPath, "agentes") && !strings.Contains(paths.MemoriaPath, "nexus-ia") {
		t.Errorf("Esperava que MemoriaPath contivesse 'agentes' ou 'nexus-ia', obteve %s", paths.MemoriaPath)
	}

	if filepath.Base(paths.NexusIADir) != "agentes" && filepath.Base(paths.NexusIADir) != "nexus-ia" {
		t.Errorf("Esperava pasta agentes, obteve %s", filepath.Base(paths.NexusIADir))
	}

	if filepath.Base(paths.BackupScript) != "backup_nexus.sh" {
		t.Errorf("Esperava backup_nexus.sh, obteve %s", filepath.Base(paths.BackupScript))
	}

	if filepath.Base(paths.ReferenciasDir) != "referencias" {
		t.Errorf("Esperava referencias, obteve %s", filepath.Base(paths.ReferenciasDir))
	}

	if filepath.Base(paths.RelatoriosDir) != "relatorios" {
		t.Errorf("Esperava pasta relatorios, obteve %s", filepath.Base(paths.RelatoriosDir))
	}

	if filepath.Base(paths.PerfilPath) != "perfil.md" {
		t.Errorf("Esperava perfil.md, obteve %s", filepath.Base(paths.PerfilPath))
	}

	if filepath.Base(paths.CVDir) != "cv-lucivaldo" {
		t.Errorf("Esperava cv-lucivaldo, obteve %s", filepath.Base(paths.CVDir))
	}
}
