// Package config gerencia os caminhos vitais do ecossistema Nexus no Linux.
package config

import (
	"os"
	"path/filepath"
)

// Paths armazena todos os caminhos vitais do ecossistema Nexus no Linux
type Paths struct {
	NexusDir               string // Caminho base: ~/Documentos/GitHub/projetos/nexus-ecosystem
	NexusIADir             string // Camada de IA e Agentes: <NexusDir>/agentes
	MemoriaPath            string // Master Ledger: <NexusIADir>/memoria_lucy.md
	MemoriaOperacionalPath string // Resumo de sessão rápida (3KB): <NexusIADir>/memoria_operacional.md
	MemoriaModularDir      string // Submódulos ADR 0003: <NexusIADir>/memoria
	RoteamentoJSONPath     string // Perfis canônicos de triagem: <NexusIADir>/perfis_roteamento.json
	CandidatoJSONPath      string // Dados estruturados ATS: <NexusIADir>/candidato.json
	BackupScript           string // Script de backup: <NexusDir>/backup_nexus.sh
	ReferenciasDir         string // Diretório de referências: <NexusIADir>/referencias
	RelatoriosDir          string // Diretório único de relatórios: <NexusDir>/relatorios
	PerfilPath             string // Perfil técnico: <NexusIADir>/perfil.md
	CVDir                  string // Pasta de currículos: ~/Documentos/GitHub/projetos/cv-lucivaldo
	EstadosDir             string // Estados compactos e snapshots das tarefas: <NexusIADir>/estado_tarefas
	ADRsDir                string // Diretório de Architecture Decision Records: <NexusDir>/docs/adrs
	VaultDir               string // Segundo Cérebro Soberano: <NexusDir>/vault
}

// GetPaths resolve dinamicamente a pasta home do usuário atual
func GetPaths() (*Paths, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	nexus := os.Getenv("NEXUS")
	if nexus != "" {
		nexus = filepath.Clean(nexus)
		// #nosec G703 - validacao de existencia do diretorio de configuracao
		if _, err := os.Stat(nexus); err != nil {
			nexus = ""
		}
	}

	if nexus == "" {
		// Fallback portátil: se o executável estiver dentro de um repositório nexus (ex: <raiz>/nexus-mcp/nexus-mcp)
		if exe, err := os.Executable(); err == nil {
			cand := filepath.Clean(filepath.Dir(filepath.Dir(exe)))
			if _, err := os.Stat(filepath.Join(cand, "agentes")); err == nil {
				nexus = cand
			}
		}
	}

	if nexus == "" {
		nexus = filepath.Join(home, "Documentos", "GitHub", "projetos", "nexus-ecosystem")
		if _, err := os.Stat(nexus); os.IsNotExist(err) {
			altLegacy := filepath.Join(home, "Documentos", "GitHub", "projetos", "nexus")
			if _, err := os.Stat(altLegacy); err == nil {
				nexus = altLegacy
			} else {
				altDocs := filepath.Join(home, "Documentos", "nexus")
				if _, err := os.Stat(altDocs); err == nil {
					nexus = altDocs
				} else {
					altNexus := filepath.Join(home, "Documentos", "GitHub", "nexus")
					if _, err := os.Stat(altNexus); err == nil {
						nexus = altNexus
					}
				}
			}
		}
	}

	agentes := filepath.Join(nexus, "agentes")
	// #nosec G703 - resolucao do diretorio de agentes do ecossistema
	if _, err := os.Stat(agentes); os.IsNotExist(err) {
		altIA := filepath.Join(nexus, "nexus-ia")
		// #nosec G703 - fallback para diretorio alternativo de agentes
		if _, err := os.Stat(altIA); err == nil {
			agentes = altIA
		}
	}

	cvDir := filepath.Join(home, "Documentos", "GitHub", "projetos", "cv-lucivaldo")
	if _, err := os.Stat(cvDir); os.IsNotExist(err) {
		altCV := filepath.Join(home, "Documentos", "cv-lucivaldo")
		if _, err := os.Stat(altCV); err == nil {
			cvDir = altCV
		} else {
			altDocuments := filepath.Join(home, "Documents", "cv-lucivaldo")
			if _, err := os.Stat(altDocuments); err == nil {
				cvDir = altDocuments
			}
		}
	}

	return &Paths{
		NexusDir:               nexus,
		NexusIADir:             agentes,
		MemoriaPath:            filepath.Join(agentes, "memoria_lucy.md"),
		MemoriaOperacionalPath: filepath.Join(agentes, "memoria_operacional.md"),
		MemoriaModularDir:      filepath.Join(agentes, "memoria"),
		RoteamentoJSONPath:     filepath.Join(agentes, "perfis_roteamento.json"),
		CandidatoJSONPath:      filepath.Join(agentes, "candidato.json"),
		BackupScript:           filepath.Join(nexus, "backup_nexus.sh"),
		ReferenciasDir:         filepath.Join(agentes, "referencias"),
		RelatoriosDir:          filepath.Join(nexus, "relatorios"),
		PerfilPath:             filepath.Join(agentes, "perfil.md"),
		CVDir:                  cvDir,
		EstadosDir:             filepath.Join(agentes, "estado_tarefas"),
		ADRsDir:                filepath.Join(nexus, "docs", "adrs"),
		VaultDir:               filepath.Join(nexus, "vault"),
	}, nil
}
