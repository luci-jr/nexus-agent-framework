// Package tools implementa o grafo de dependências e auditoria de impacto estilo GNN.
package tools

import (
	"context"
	"fmt"
	"strings"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// NoGrafo representa um componente ou artefato no grafo do ecossistema Nexus
type NoGrafo struct {
	ID                 string   `json:"id"`
	Tipo               string   `json:"tipo"`
	Caminho            string   `json:"caminho"`
	Descricao          string   `json:"descricao"`
	DependeDe          []string `json:"depende_de"`
	ImpactaDiretamente []string `json:"impacta_diretamente"`
	ChecklistAuditoria []string `json:"checklist_auditoria"`
}

// RegistrarToolGrafo adiciona a análise de impacto topológico do ecossistema ao servidor MCP
func RegistrarToolGrafo(s *server.MCPServer, paths *config.Paths) {
	toolGrafo := mcp.NewTool("nexus_auditar_impacto",
		mcp.WithDescription("Analisa o grafo de dependências topológicas do ecossistema Nexus (estilo GNN). Mapeia conexões de 1º e 2º grau e gera checklist anti-regressão antes de alterar qualquer arquivo ou script."),
		mcp.WithString("alvo", mcp.Required(), mcp.Description("Nome do arquivo, serviço ou componente para auditar impacto (ex: 'backup_nexus.sh', 'crontab', 'paths.go', 'memoria_lucy.md', 'cofre.py', 'docker-compose' ou 'todos')")),
	)

	s.AddTool(toolGrafo, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		alvo, err := request.RequireString("alvo")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'alvo' é obrigatório."), nil
		}

		grafo := construirGrafoNexus(paths)
		alvoSanitizado := strings.ToLower(strings.TrimSpace(alvo))

		if alvoSanitizado == "todos" || alvoSanitizado == "lista" {
			var sb strings.Builder
			sb.WriteString("# 🌐 Grafo de Dependências do Ecossistema Nexus (Topologia Completa)\n\n")
			sb.WriteString(fmt.Sprintf("Total de nós mapeados: **%d nós**\n\n", len(grafo)))
			for id, no := range grafo {
				sb.WriteString(fmt.Sprintf("- **%s** (`%s`): %s\n", id, no.Tipo, no.Descricao))
			}
			sb.WriteString("\nConsulte um nó específico passando seu nome no parâmetro `alvo` para ver a análise de impacto detalhada.")
			return mcp.NewToolResultText(sb.String()), nil
		}

		noEncontrado, ok := buscarNo(grafo, alvoSanitizado)
		if !ok {
			return mcp.NewToolResultError(fmt.Sprintf("Nó '%s' não encontrado no grafo do Nexus. Tente 'backup_nexus.sh', 'crontab', 'paths.go', 'memoria_lucy.md', 'cofre.py', 'docker-compose' ou 'todos'.", alvo)), nil
		}

		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("# 🛡️ Auditoria Topológica de Impacto — %s\n\n", noEncontrado.ID))
		sb.WriteString(fmt.Sprintf("- **Tipo do Nó:** `%s`\n", noEncontrado.Tipo))
		sb.WriteString(fmt.Sprintf("- **Localização:** `%s`\n", noEncontrado.Caminho))
		sb.WriteString(fmt.Sprintf("- **Papel do Componente:** %s\n\n", noEncontrado.Descricao))

		sb.WriteString("### 🔗 Dependências Diretas (O que este nó consome):\n")
		if len(noEncontrado.DependeDe) == 0 {
			sb.WriteString("- *Nenhuma dependência externa declarada (nó raiz).*\n")
		} else {
			for _, dep := range noEncontrado.DependeDe {
				sb.WriteString(fmt.Sprintf("- ➔ `%s`\n", dep))
			}
		}

		sb.WriteString("\n### ⚠️  Raio de Impacto (Quem pode quebrar se este nó sofrer alteração):\n")
		if len(noEncontrado.ImpactaDiretamente) == 0 {
			sb.WriteString("- *Nenhum dependente downstream registrado.*\n")
		} else {
			for _, imp := range noEncontrado.ImpactaDiretamente {
				sb.WriteString(fmt.Sprintf("- 💥 `%s`\n", imp))
			}
		}

		sb.WriteString("\n### 📋 Checklist Obrigatório Anti-Regressão:\n")
		for i, check := range noEncontrado.ChecklistAuditoria {
			sb.WriteString(fmt.Sprintf("%d. [ ] %s\n", i+1, check))
		}

		return mcp.NewToolResultText(sb.String()), nil
	})
}

func buscarNo(grafo map[string]NoGrafo, alvo string) (NoGrafo, bool) {
	for k, v := range grafo {
		if strings.EqualFold(k, alvo) || strings.Contains(strings.ToLower(v.Caminho), alvo) {
			return v, true
		}
	}
	return NoGrafo{}, false
}

func construirGrafoNexus(paths *config.Paths) map[string]NoGrafo {
	g := make(map[string]NoGrafo)

	g["backup_nexus.sh"] = NoGrafo{
		ID:        "backup_nexus.sh",
		Tipo:      "Script de Sistema / Shell",
		Caminho:   paths.BackupScript,
		Descricao: "Script oficial de sincronização incremental para o Google Drive e Git auto-sync.",
		DependeDe: []string{
			"rclone (Google Drive remoto GD-Lucivaldo:nexus-ecosystem)",
			"git (Repositório local e GitHub origin/main)",
			"Variáveis de Ambiente: NEXUS_CONFIRM_DELETE e NEXUS_AUTO_COMMIT",
		},
		ImpactaDiretamente: []string{
			"crontab (Agendamento de domingo 23:00)",
			"nexus_executar_backup (Tool no MCP)",
			"Backups físicos no SSD Arquivos e SSD Externo",
			"Backup portátil no Pendrive .nexus",
		},
		ChecklistAuditoria: []string{
			"Garantir que a sintaxe seja válida com 'bash -n backup_nexus.sh'.",
			"Verificar se o crontab passa NEXUS_CONFIRM_DELETE=SIM e NEXUS_AUTO_COMMIT=1.",
			"Confirmar se 'nexus-mcp/internal/tools/backup.go' exporta as variáveis de ambiente corretas.",
			"Validar se credenciais (.env, *.key, rclone.conf) permanecem na lista SENSITIVE_EXCLUDES.",
		},
	}

	g["crontab"] = NoGrafo{
		ID:        "crontab",
		Tipo:      "Serviço Agendador do SO (Cron)",
		Caminho:   "/var/spool/cron/crontabs/lucivaldo-junior",
		Descricao: "Agendamento semanal recorrente para executar o backup às 23:00 de domingo.",
		DependeDe: []string{
			"backup_nexus.sh",
			"Ambiente Linux (env, bash, rclone)",
		},
		ImpactaDiretamente: []string{
			"Integridade periódica do repositório no Google Drive",
		},
		ChecklistAuditoria: []string{
			"Verificar 'crontab -l' para garantir que os caminhos absolutos estejam corretos.",
			"Confirmar que as variáveis NEXUS_CONFIRM_DELETE e NEXUS_AUTO_COMMIT estão definidas antes do comando.",
			"Validar redirecionamento de logs para não acumular processos travados.",
		},
	}

	g["paths.go"] = NoGrafo{
		ID:        "paths.go",
		Tipo:      "Configuração Canônica em Go",
		Caminho:   "nexus-mcp/internal/config/paths.go",
		Descricao: "Mapeamento central e canônico de todos os caminhos do ecossistema para o servidor MCP.",
		DependeDe: []string{
			"Diretório base do usuário ($HOME)",
			"Estrutura de diretórios de ~/Documentos/nexus",
		},
		ImpactaDiretamente: []string{
			"Todas as ferramentas do servidor nexus-mcp (memoria, relatorios, backup, estado_tarefa)",
			"Testes unitários 'paths_test.go' e 'tools_test.go'",
		},
		ChecklistAuditoria: []string{
			"Rodar 'go test ./internal/config/...' imediatamente após alterações.",
			"Garantir retrocompatibilidade com links de relatórios e memória.",
			"Recompilar o binário nexus-mcp se algum caminho mudar.",
		},
	}

	g["memoria_lucy.md"] = NoGrafo{
		ID:        "memoria_lucy.md",
		Tipo:      "Base de Conhecimento Viva / Markdown",
		Caminho:   paths.MemoriaPath,
		Descricao: "Fonte da verdade histórica contendo preferências, decisões técnicas, hardware e formações.",
		DependeDe: []string{
			"Registro contínuo do agente Lucy e interações do desenvolvedor",
		},
		ImpactaDiretamente: []string{
			"nexus_obter_memoria e nexus_buscar_memoria (MCP)",
			"Contexto de inicialização e diretrizes globais do agente Lucy",
			"Prompts do ecossistema e relatórios de acompanhamento",
		},
		ChecklistAuditoria: []string{
			"Nunca usar citações com '>' para evitar linhas laterais na tela.",
			"Preservar as convenções em dialeto paraense ('tu') e pronomes masculinos.",
			"Manter o histórico ordenado por data e preservar registros anteriores.",
		},
	}

	g["nexus-work"] = NoGrafo{
		ID:        "nexus-work",
		Tipo:      "Suíte Corporativa & Audit-Proof",
		Caminho:   "nexus-work",
		Descricao: "Ambiente corporativo leve, despersonalizado e seguro (BYOK) para estações de trabalho.",
		DependeDe: []string{
			"Variável de ambiente GEMINI_API_KEY em memória",
			"Scripts de inicialização rápida (lucy.sh, abrir_console.sh)",
		},
		ImpactaDiretamente: []string{
			"Pair programming e engenharia corporativa",
			"nexus-console (Dashboard Web local)",
		},
		ChecklistAuditoria: []string{
			"Garantir ausência total de credenciais ou histórico pessoal no repositório.",
			"Validar execução em terminais corporativos e WSL2.",
		},
	}

	g["nexus-console"] = NoGrafo{
		ID:        "nexus-console",
		Tipo:      "Servidor Web & Telemetria em Go",
		Caminho:   "nexus-console",
		Descricao: "Dashboard web local para monitoramento em tempo real do ecossistema e tarefas.",
		DependeDe: []string{
			"Go 1.22+",
			"Arquivo tasks/todo.md e tasks/lessons.md",
		},
		ImpactaDiretamente: []string{
			"Acesso web na porta local 8080",
			"Visualização de progresso e métricas de tarefas",
		},
		ChecklistAuditoria: []string{
			"Garantir compilação limpa com 'go build'.",
			"Validar portas e ausência de vazamento de credenciais.",
		},
	}

	g["estado_tarefas"] = NoGrafo{
		ID:        "estado_tarefas",
		Tipo:      "Armazenamento de Estado & Snapshots",
		Caminho:   paths.EstadosDir,
		Descricao: "Diretório de resumos compactos e snapshots históricos para transferências eficientes de tarefas.",
		DependeDe: []string{
			"nexus_salvar_estado_tarefa e nexus_obter_estado_tarefa (MCP)",
		},
		ImpactaDiretamente: []string{
			"Eficiência de contexto entre Lucy e os especialistas",
			"Métricas de retrabalho e reaberturas",
		},
		ChecklistAuditoria: []string{
			"Arquivos devem manter permissões 0600 em disco.",
			"Sanitizar strings para impedir qualquer inserção de API Keys ou senhas.",
		},
	}

	return g
}
