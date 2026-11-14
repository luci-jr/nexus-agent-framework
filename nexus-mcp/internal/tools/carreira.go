// Package tools - Nexus MCP Server
// Ferramentas de apoio a carreira, auditoria de currículo e análise de vagas (Framework PERF)
package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarToolsCarreira adiciona as ferramentas de apoio a carreira e vagas do Frellas e Lucy
func RegistrarToolsCarreira(s *server.MCPServer, paths *config.Paths) {
	// 1. Tool: nexus_listar_cvs
	toolListar := mcp.NewTool("nexus_listar_cvs",
		mcp.WithDescription("Lista todos os currículos compilados e documentos oficiais de carreira em ~/Documentos/cv-lucivaldo/ com datas e tamanhos."),
	)

	s.AddTool(toolListar, func(_ context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		entradas, err := os.ReadDir(paths.CVDir)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao acessar diretório de currículos (%s): %v", paths.CVDir, err)), nil
		}

		var pdfs []string
		for _, e := range entradas {
			if !e.IsDir() && strings.HasSuffix(strings.ToLower(e.Name()), ".pdf") {
				info, err := e.Info()
				if err == nil {
					tamKB := float64(info.Size()) / 1024
					dataMod := info.ModTime().Format("02/01/2006 15:04")
					pdfs = append(pdfs, fmt.Sprintf("📄 **%s** — %.1f KB (Atualizado em: %s)", e.Name(), tamKB, dataMod))
				}
			}
		}

		if len(pdfs) == 0 {
			return mcp.NewToolResultText("Nenhum arquivo PDF de currículo encontrado no diretório."), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("📋 **Currículos Oficiais Compilados no Nexus (`%s`):**\n\n%s",
			paths.CVDir, strings.Join(pdfs, "\n"))), nil
	})

	// 2. Tool: nexus_analisar_fit_vaga
	toolFit := mcp.NewTool("nexus_analisar_fit_vaga",
		mcp.WithDescription("Analisa a aderência de uma vaga tech ao perfil real de Lucivaldo Junior via Framework PERF (Score de Fit %, Pontos Fortes, Gaps e CV Recomendado)."),
		mcp.WithString("descricao_vaga", mcp.Required(), mcp.Description("Texto completo ou requisitos da vaga (CLT ou PJ)")),
		mcp.WithString("cargo_alvo", mcp.Description("Foco opcional da candidatura: 'backend', 'java', 'go', 'frontend' ou 'fullstack' (padrão: auto-detectar)")),
	)

	s.AddTool(toolFit, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		descricao, err := request.RequireString("descricao_vaga")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'descricao_vaga' é obrigatório"), nil
		}

		cargoAlvo := strings.ToLower(request.GetString("cargo_alvo", ""))
		resultado := executarAnalisePERF(paths, descricao, cargoAlvo)
		return mcp.NewToolResultText(resultado), nil
	})
}

type stackMatch struct {
	nome      string
	sinonimos []string
	forte     bool
}

func executarAnalisePERF(paths *config.Paths, descricao string, cargoAlvo string) string {
	descLower := strings.ToLower(descricao)

	competencias := []stackMatch{
		{"Java 17/21 LTS", []string{"java", "java 17", "java 21", "jdk"}, true},
		{"Spring Boot 3", []string{"spring", "spring boot", "springboot", "spring framework"}, true},
		{"Go (Golang 1.22+)", []string{"go", "golang", "goroutines"}, true},
		{"PostgreSQL", []string{"postgres", "postgresql", "sql", "relational database"}, true},
		{"Docker & Swarm", []string{"docker", "docker compose", "containers", "swarm"}, true},
		{"AWS Cloud", []string{"aws", "amazon web services", "cloud", "ec2", "s3"}, true},
		{"Redis (Cache)", []string{"redis", "cache"}, true},
		{"APIs RESTful", []string{"rest", "restful", "api", "apis", "endpoints"}, true},
		{"Git / GitHub", []string{"git", "github", "versionamento"}, true},
		{"JUnit 5 / Testes", []string{"junit", "testes unitarios", "unit tests", "mockito", "tdd"}, true},
		{"Linux Ubuntu", []string{"linux", "ubuntu", "bash", "shell"}, true},
		{"Angular / TypeScript", []string{"angular", "typescript", "frontend", "javascript", "js", "ts"}, false},
	}

	matches := 0
	totalConsideradas := 0
	var pontosFortes []string
	var mencaoJava, mencaoGo, mencaoFront bool

	for _, c := range competencias {
		encontrou := false
		for _, s := range c.sinonimos {
			if strings.Contains(descLower, s) {
				encontrou = true
				break
			}
		}

		if encontrou {
			totalConsideradas++
			matches++
			pontosFortes = append(pontosFortes, fmt.Sprintf("✅ **%s** (Requisito atendido com proficiência prática)", c.nome))
			if strings.Contains(c.nome, "Java") {
				mencaoJava = true
			}
			if strings.Contains(c.nome, "Go") {
				mencaoGo = true
			}
			if strings.Contains(c.nome, "Angular") {
				mencaoFront = true
			}
		}
	}

	// Mapeia gaps comuns da indústria
	gapsPossiveis := []struct {
		requisito string
		sinonimos []string
	}{
		{"Kubernetes / K8s", []string{"kubernetes", "k8s"}},
		{"Kafka / RabbitMQ", []string{"kafka", "rabbitmq", "mensageria"}},
		{"CI/CD Pipelines", []string{"ci/cd", "github actions", "gitlab ci", "jenkins"}},
		{"Microfrontends", []string{"microfrontends", "micro-frontends"}},
		{"Inglês Fluente/Avançado", []string{"fluent english", "ingles avancado", "ingles fluente", "advanced english"}},
	}

	var gapsIdentificados []string
	for _, g := range gapsPossiveis {
		for _, s := range g.sinonimos {
			if strings.Contains(descLower, s) {
				if strings.Contains(g.requisito, "Inglês") {
					gapsIdentificados = append(gapsIdentificados, fmt.Sprintf("⚠️ **%s** (Atenção: Nível atual é técnico/instrumental, nunca declarar fluência)", g.requisito))
				} else {
					gapsIdentificados = append(gapsIdentificados, fmt.Sprintf("⚠️ **%s** (Requisito citado: abordar com franqueza ou demonstrar capacidade rápida de assimilação)", g.requisito))
				}
				break
			}
		}
	}

	// Cálculo de Fit
	score := 50
	if totalConsideradas > 0 {
		score = (matches * 100) / (totalConsideradas + len(gapsIdentificados))
		if score > 95 {
			score = 95
		}
		if score < 20 {
			score = 25
		}
	}

	// Seleção da melhor versão de CV
	cvRecomendado := "CV - Lucivaldo 2026 - Backend.pdf (Foco Back-end Completo)"
	if cargoAlvo == "java" || (mencaoJava && !mencaoGo) {
		cvRecomendado = "CV - Lucivaldo 2026 - Java.pdf (Foco Especialista Java/Spring Boot)"
	} else if cargoAlvo == "go" || (mencaoGo && !mencaoJava) {
		cvRecomendado = "CV - Lucivaldo 2026 - Go.pdf (Foco Especialista Go/WASM)"
	} else if cargoAlvo == "frontend" || (mencaoFront && !mencaoJava && !mencaoGo) {
		cvRecomendado = "CV - Lucivaldo 2026 - Frontend.pdf (Foco Front-end Angular 21)"
	} else if cargoAlvo == "fullstack" {
		cvRecomendado = "CV - Lucivaldo 2026 - Fullstack.pdf (Foco Híbrido Java + Angular)"
	}

	var sb strings.Builder
	sb.WriteString("🎯 **Auditoria de Fit da Vaga — Framework PERF (Lucy & Frellas)**\n\n")
	sb.WriteString(fmt.Sprintf("📊 **Score de Compatibilidade Técnica:** **%d%%**\n\n", score))

	sb.WriteString("📂 **Versão Recomendada do Currículo:**\n")
	sb.WriteString(fmt.Sprintf("👉 `%s`\n\n", cvRecomendado))

	sb.WriteString("💪 **Pontos Fortes Imediatos (Match de Stack):**\n")
	if len(pontosFortes) > 0 {
		sb.WriteString(strings.Join(pontosFortes, "\n") + "\n\n")
	} else {
		sb.WriteString("Nenhuma stack chave explicitamente detectada no texto.\n\n")
	}

	sb.WriteString("🚧 **Gaps Técnicos & Pontos de Atenção:**\n")
	if len(gapsIdentificados) > 0 {
		sb.WriteString(strings.Join(gapsIdentificados, "\n") + "\n\n")
	} else {
		sb.WriteString("✅ Nenhum gap impeditivo crítico detectado na descrição.\n\n")
	}

	sb.WriteString("💡 **Diretriz de Abordagem ao Recrutador:**\n")
	sb.WriteString("- Utilizar o modelo de InMail/Mensagem Direta (texto limpo, sem markdown complexo).\n")
	sb.WriteString("- Destacar os 3 projetos vitrine: Engine de Apostas (Jungle Gaming), Égua Mano! Gamer (Go/WASM) e Comunidade Tech (Angular).\n")
	sb.WriteString("- Valorizar a maturidade da transição de carreira de 15+ anos em liderança operacional como diferencial de inteligência emocional.\n\n")

	if paths != nil && paths.CandidatoJSONPath != "" {
		if dadosBytes, err := ReadCached(paths.CandidatoJSONPath); err == nil {
			var cand struct {
				Compliance struct {
					Pretensao struct {
						PJTexto  string `json:"pj_texto"`
						CLTTexto string `json:"clt_texto"`
					} `json:"pretensao_salarial"`
					Modalidades []string `json:"modalidade_aceita"`
				} `json:"compliance_e_preferencias"`
			}
			if err := json.Unmarshal(dadosBytes, &cand); err == nil {
				sb.WriteString("💰 **Parâmetros de Compliance & Negociação (candidato.json):**\n")
				if cand.Compliance.Pretensao.PJTexto != "" {
					sb.WriteString(fmt.Sprintf("- **PJ Alvo:** %s\n", cand.Compliance.Pretensao.PJTexto))
				}
				if cand.Compliance.Pretensao.CLTTexto != "" {
					sb.WriteString(fmt.Sprintf("- **CLT Alvo:** %s\n", cand.Compliance.Pretensao.CLTTexto))
				}
				if len(cand.Compliance.Modalidades) > 0 {
					sb.WriteString(fmt.Sprintf("- **Modalidades Aceitas:** %s\n", strings.Join(cand.Compliance.Modalidades, " / ")))
				}
				sb.WriteString("\n")
			}
		}
	}

	return sb.String()
}
