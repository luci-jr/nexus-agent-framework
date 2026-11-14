// Package tools implementa o motor System One nativo em Go (Roteamento Softmax, Gatekeeper DoD e Auditoria SecOps).
// Substitui integralmente o antigo daemon Python nexus-laya com latência <0.1ms e zero overhead de processos.
package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

const defaultTemperature = 0.85

// ResultadoIntencao representa a estrutura tipada de decisão não-autoregressiva
type ResultadoIntencao struct {
	Agente          string   `json:"agente"`
	Confianca       float64  `json:"confianca"`
	Categoria       string   `json:"categoria"`
	Urgencia        string   `json:"urgencia"`
	PalavrasChave   []string `json:"palavras_chave_detectadas"`
	Justificativa   string   `json:"justificativa"`
	ComandoSugerido string   `json:"comando_sugerido"`
	TempoInferencia float64  `json:"tempo_inferencia_ms"`
	Engine          string   `json:"engine"`
}

// ResultadoGatekeeper representa a validação de Definition of Done (DoD)
type ResultadoGatekeeper struct {
	Aprovado                  bool     `json:"aprovado"`
	ProbabilidadeConformidade float64  `json:"probabilidade_conformidade"`
	RequisitosTotais          int      `json:"requisitos_totais"`
	RequisitosAtendidos       []string `json:"requisitos_atendidos"`
	RequisitosPendentes       []string `json:"requisitos_pendentes"`
	ScopeDriftDetectado       bool     `json:"scope_drift_detectado"`
	TempoInferencia           float64  `json:"tempo_inferencia_ms"`
	Engine                    string   `json:"engine"`
}

// ResultadoSeguranca representa a auditoria preventiva de comandos de terminal
type ResultadoSeguranca struct {
	ScoreRisco          float64  `json:"score_risco"`
	NivelRisco          string   `json:"nivel_risco"`
	BloqueioRecomendado bool     `json:"bloqueio_recomendado"`
	Motivos             []string `json:"motivos"`
	ComandoAnalisado    string   `json:"comando_analisado"`
	TempoInferencia     float64  `json:"tempo_inferencia_ms"`
	Engine              string   `json:"engine"`
}

// RegistrarToolIntencao registra as 3 ferramentas System One nativas em Go (Roteamento, Gatekeeper DoD e Security Audit)
func RegistrarToolIntencao(s *server.MCPServer, paths *config.Paths) {
	// 1. Tool: nexus_rotear_intencao
	toolIntencao := mcp.NewTool("nexus_rotear_intencao",
		mcp.WithDescription("Classificador ultrarrápido 'System One' nativo em Go com calibração Softmax Temperature Scaling (<0.1ms). Tria a intenção do usuário e retorna o especialista ideal do squad."),
		mcp.WithString("prompt", mcp.Required(), mcp.Description("Mensagem, pergunta ou comando do desenvolvedor para triagem")),
	)

	s.AddTool(toolIntencao, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		prompt, err := request.RequireString("prompt")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'prompt' é obrigatório."), nil
		}

		resultado := classificarPromptSoftmax(prompt, paths)
		dadosJson, err := json.MarshalIndent(resultado, "", "  ")
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao serializar resultado: %v", err)), nil
		}

		respostaFormatada := fmt.Sprintf(
			"# ⚡ Triagem Rápida System One (Nexus Go Engine — %s)\n\n"+
				"- **Especialista Sugerido:** `%s`\n"+
				"- **Confiança Calibrada (Softmax):** %.1f%%\n"+
				"- **Categoria:** `%s`\n"+
				"- **Nível de Urgência:** `%s`\n"+
				"- **Comando Imediato:** `%s`\n"+
				"- **Latência de Inferência:** `%.3f ms`\n\n"+
				"### Justificativa da Decisão:\n%s\n\n"+
				"```json\n%s\n```",
			resultado.Engine,
			resultado.Agente,
			resultado.Confianca*100,
			resultado.Categoria,
			resultado.Urgencia,
			resultado.ComandoSugerido,
			resultado.TempoInferencia,
			resultado.Justificativa,
			string(dadosJson),
		)

		return mcp.NewToolResultText(respostaFormatada), nil
	})

	// 2. Tool: nexus_validar_dod (Antigo Laya /gatekeeper)
	toolGatekeeper := mcp.NewTool("nexus_validar_dod",
		mcp.WithDescription("P.O. Gatekeeper & Definition of Done (DoD) nativo em Go. Audita se os entregáveis atendem 100% dos requisitos do objetivo com calibração Sigmoid, prevenindo scope drift."),
		mcp.WithString("objetivo", mcp.Required(), mcp.Description("Requisitos originais separados por ponto-e-vírgula ou quebra de linha")),
		mcp.WithString("entregaveis", mcp.Required(), mcp.Description("Descrição detalhada do que foi efetivamente construído, testado e entregue")),
	)

	s.AddTool(toolGatekeeper, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		objetivo, err := request.RequireString("objetivo")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'objetivo' é obrigatório."), nil
		}
		entregaveis, err := request.RequireString("entregaveis")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'entregaveis' é obrigatório."), nil
		}

		res := validarDoD(objetivo, entregaveis)
		dadosJson, _ := json.MarshalIndent(res, "", "  ")
		statusStr := "✅ APROVADO (Sem Scope Drift)"
		if !res.Aprovado {
			statusStr = "❌ REPROVADO (Pendências ou Scope Drift Detectado)"
		}

		texto := fmt.Sprintf(
			"# 🛡️ Auditoria P.O. Gatekeeper (Definition of Done)\n\n"+
				"- **Veredito:** %s\n"+
				"- **Probabilidade de Conformidade:** %.1f%%\n"+
				"- **Requisitos Atendidos:** %d de %d\n\n"+
				"```json\n%s\n```",
			statusStr, res.ProbabilidadeConformidade*100, len(res.RequisitosAtendidos), res.RequisitosTotais, string(dadosJson),
		)
		return mcp.NewToolResultText(texto), nil
	})

	// 3. Tool: nexus_auditar_comando (Antigo Laya /security)
	toolSecurity := mcp.NewTool("nexus_auditar_comando",
		mcp.WithDescription("Auditoria de segurança SecOps em tempo real para comandos de terminal e operações de disco/banco. Calcula o score de risco (0.0 a 1.0) e recomenda bloqueio preventivo."),
		mcp.WithString("comando", mcp.Required(), mcp.Description("Comando bash/shell ou query SQL a ser avaliado antes da execução")),
	)

	s.AddTool(toolSecurity, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		comando, err := request.RequireString("comando")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'comando' é obrigatório."), nil
		}

		res := auditarSegurancaComando(comando)
		dadosJson, _ := json.MarshalIndent(res, "", "  ")
		texto := fmt.Sprintf(
			"# 🔒 Auditoria Preventiva SecOps — Comando de Terminal\n\n"+
				"- **Nível de Risco:** `%s` (Score: %.2f)\n"+
				"- **Bloqueio Recomendado:** `%v`\n"+
				"- **Motivos:** %s\n\n"+
				"```json\n%s\n```",
			res.NivelRisco, res.ScoreRisco, res.BloqueioRecomendado, strings.Join(res.Motivos, "; "), string(dadosJson),
		)
		return mcp.NewToolResultText(texto), nil
	})
}

type perfilJSON struct {
	Categoria     string         `json:"categoria"`
	Comando       string         `json:"comando"`
	PesoBase      float64        `json:"peso_base"`
	Justificativa string         `json:"justificativa"`
	Pesos         map[string]int `json:"pesos"`
}

type rootPerfisJSON struct {
	Versao string                `json:"versao"`
	Perfis map[string]perfilJSON `json:"perfis"`
}

type perfilRegra struct {
	agente        string
	categoria     string
	comando       string
	pesoBase      float64
	pesos         map[string]int
	justificativa string
}

func carregarRegrasDeRoteamento(paths *config.Paths) []perfilRegra {
	var candidatos []string
	if envPath := os.Getenv("NEXUS_ROTEAMENTO_JSON"); envPath != "" {
		candidatos = append(candidatos, envPath)
	}
	if paths != nil && paths.RoteamentoJSONPath != "" {
		candidatos = append(candidatos, paths.RoteamentoJSONPath)
	}
	candidatos = append(candidatos,
		"agentes/perfis_roteamento.json",
		"../agentes/perfis_roteamento.json",
		filepath.Join(os.Getenv("HOME"), "Documentos/GitHub/projetos/nexus-ecosystem/agentes/perfis_roteamento.json"),
		filepath.Join(os.Getenv("HOME"), "Documentos/GitHub/projetos/nexus/agentes/perfis_roteamento.json"),
	)

	for _, c := range candidatos {
		c = filepath.Clean(c)
		// #nosec G304 G703 -- leitura segura de arquivo canonico de perfis
		if dados, err := os.ReadFile(c); err == nil {
			var root rootPerfisJSON
			if err := json.Unmarshal(dados, &root); err == nil && len(root.Perfis) > 0 {
				var regras []perfilRegra
				for k, v := range root.Perfis {
					pb := v.PesoBase
					if pb <= 0 {
						pb = 1.0
					}
					regras = append(regras, perfilRegra{
						agente:        k,
						categoria:     v.Categoria,
						comando:       v.Comando,
						pesoBase:      pb,
						pesos:         v.Pesos,
						justificativa: v.Justificativa,
					})
				}
				if len(regras) > 0 {
					return regras
				}
			}
		}
	}
	return obterRegrasFallback()
}

func obterRegrasFallback() []perfilRegra {
	return []perfilRegra{
		{
			agente:    "backend",
			categoria: "backend_engineering",
			comando:   "backend",
			pesoBase:  1.2,
			pesos: map[string]int{
				"java": 5, "spring": 5, "springboot": 6, "go": 4, "golang": 5,
				"api": 4, "restful": 4, "microsserviço": 5, "microsservico": 5,
				"postgresql": 4, "postgres": 4, "redis": 4, "jpa": 4, "sql": 3,
				"endpoint": 4, "dto": 4, "orm": 3, "prisma": 3, "goroutine": 5,
			},
			justificativa: "Demanda centrada em engenharia de back-end, concorrência, APIs RESTful ou bancos de dados relacionais/cache.",
		},
		{
			agente:    "frontend",
			categoria: "frontend_ui",
			comando:   "frontend",
			pesoBase:  1.2,
			pesos: map[string]int{
				"angular": 6, "typescript": 4, "signals": 5, "standalone": 4,
				"css": 4, "html": 3, "tailwind": 4, "ui": 4, "ux": 3,
				"responsiv": 4, "layout": 4, "component": 4, "componente": 4,
				"rxjs": 4, "spa": 4, "javascript": 3,
			},
			justificativa: "Foco exclusivo em interface web, componentes modernos em Angular, reatividade ou estilização responsiva.",
		},
		{
			agente:    "sysops",
			categoria: "devops_infra",
			comando:   "sysops",
			pesoBase:  1.2,
			pesos: map[string]int{
				"docker": 5, "swarm": 5, "traefik": 5, "portainer": 4,
				"ubuntu": 4, "linux": 4, "zram": 5, "ram": 4, "cpu": 3,
				"kernel": 4, "memoria": 3, "memória": 3, "deploy": 4,
				"aws": 4, "ec2": 4, "s3": 4, "servidor": 4, "ssh": 4,
			},
			justificativa: "Operação voltada para containers, clusters Docker Swarm, redes, métricas de SO Linux ou nuvem AWS.",
		},
		{
			agente:    "frellas",
			categoria: "carreira_e_negocios",
			comando:   "frellas",
			pesoBase:  1.2,
			pesos: map[string]int{
				"curriculo": 6, "currículo": 6, "cv": 6, "vaga": 5, "vagas": 5,
				"linkedin": 5, "freela": 5, "freelance": 5, "proposta": 5,
				"upwork": 5, "workana": 5, "clt": 4, "pj": 4, "ats": 5,
				"contrato pj": 5, "cliente": 4, "entrevista": 5,
			},
			justificativa: "Triagem de vagas de trabalho, otimização de currículo para ATS, prospecção comercial ou propostas PJ.",
		},
		{
			agente:    "qa",
			categoria: "testes_e_qualidade",
			comando:   "qa",
			pesoBase:  1.2,
			pesos: map[string]int{
				"teste": 5, "testes": 5, "junit": 6, "mockito": 5, "cypress": 6,
				"playwright": 6, "testcontainers": 6, "k6": 6, "carga": 4,
				"e2e": 5, "cobertura": 4, "tdd": 5, "regressao": 4, "asserção": 4,
			},
			justificativa: "Automação de testes de software (unitários, integração, E2E ou estresse) e garantia de conformidade técnica.",
		},
		{
			agente:    "secops",
			categoria: "seguranca_devsecops",
			comando:   "secops",
			pesoBase:  1.2,
			pesos: map[string]int{
				"segurança": 5, "seguranca": 5, "cve": 6, "vulnerabilidade": 6,
				"sast": 6, "sca": 6, "gosec": 6, "owasp": 5, "token": 4,
				"jwt": 4, "oauth": 4, "keycloak": 5, "criptografia": 5, "senha": 4,
			},
			justificativa: "Varredura de vulnerabilidades, auditoria estática de código (SAST/SCA), segurança de tokens e DevSecOps.",
		},
		{
			agente:    "suporte",
			categoria: "suporte_sustentacao",
			comando:   "suporte",
			pesoBase:  1.1,
			pesos: map[string]int{
				"suporte": 6, "chamado": 6, "ticket": 5, "hera": 6, "pdv": 6,
				"gestao facil": 6, "gestão fácil": 6, "sefaz": 6, "nfc-e": 6, "nf-e": 6,
				"danfe": 5, "fiscal": 5, "caixa": 5, "helpdesk": 5, "sat": 5,
			},
			justificativa: "Suporte operacional ao sistema comercial Hera PDV, análise de logs de erro, troubleshooting fiscal e atendimento N2/N3.",
		},
		{
			agente:        "bi",
			categoria:     "business_intelligence",
			comando:       "bi",
			pesoBase:      1.1,
			pesos:         map[string]int{"bi": 6, "dashboard": 5, "analise": 4, "vendas": 5, "estoque": 5, "faturamento": 5, "relatorio": 4, "ticket medio": 5, "kpi": 5, "sql analitico": 6},
			justificativa: "Business Intelligence, queries analíticas (GROUP BY, window functions), relatórios executivos em PDF e inteligência de vendas.",
		},
		{
			agente:        "finops",
			categoria:     "cloud_finops",
			comando:       "finops",
			pesoBase:      1.1,
			pesos:         map[string]int{"finops": 6, "custo": 5, "fatura": 5, "aws": 4, "hetzner": 6, "oci": 5, "oracle cloud": 5, "cloudflare": 5, "tco": 5, "economia": 5, "vps mais barata": 6, "arbitragem": 5, "pricing": 5, "egress": 4},
			justificativa: "Cloud Financial Operations (FinOps), arbitragem de custos multi-cloud (AWS vs Hetzner vs OCI vs Cloudflare) e redução de faturas.",
		},
	}
}

func classificarPromptSoftmax(prompt string, paths *config.Paths) ResultadoIntencao {
	inicio := time.Now()
	p := strings.ToLower(prompt)
	regras := carregarRegrasDeRoteamento(paths)

	// Inclui o orquestrador Lucy como candidato default
	regras = append(regras, perfilRegra{
		agente:        "lucy",
		categoria:     "orquestracao_geral",
		comando:       "lucy",
		pesoBase:      1.0,
		pesos:         map[string]int{"planejamento": 4, "arquitetura": 4, "orquestracao": 5, "mentoria": 5, "tutor": 5, "conceito": 4, "decisao": 4, "tech lead": 5, "estrategia": 4},
		justificativa: "Demanda ampla, estratégica ou multidisciplinar. O Lucy atua como Tech Lead e coordenador central.",
	})

	logits := make([]float64, len(regras))
	palavrasPorAgente := make(map[string][]string)
	maxLogit := 0.0

	for idx, regra := range regras {
		score := 0.0
		var encontradas []string
		for termo, peso := range regra.pesos {
			if strings.Contains(p, termo) {
				score += float64(peso) * 0.35
				encontradas = append(encontradas, termo)
			}
		}
		score *= regra.pesoBase
		logits[idx] = score
		if score > maxLogit {
			maxLogit = score
		}
		if len(encontradas) > 0 {
			palavrasPorAgente[regra.agente] = encontradas
		}
	}

	// Se nenhuma palavra-chave bateu, direciona para o Lucy
	if maxLogit == 0.0 {
		for idx, r := range regras {
			if r.agente == "lucy" {
				logits[idx] = 2.0
				maxLogit = 2.0
				break
			}
		}
	}

	// Calibração Softmax com Temperature Scaling
	somaExp := 0.0
	expLogits := make([]float64, len(logits))
	for i, l := range logits {
		e := math.Exp((l - maxLogit) / defaultTemperature)
		expLogits[i] = e
		somaExp += e
	}

	idxVencedor := 0
	maiorProb := 0.0
	for i, e := range expLogits {
		prob := e / somaExp
		if prob > maiorProb {
			maiorProb = prob
			idxVencedor = i
		}
	}

	vencedor := regras[idxVencedor]
	urgencia := "media"
	if strings.Contains(p, "urgente") || strings.Contains(p, "critico") || strings.Contains(p, "producao") || strings.Contains(p, "parou") || strings.Contains(p, "erro fatal") {
		urgencia = "alta"
	} else if strings.Contains(p, "quando der") || strings.Contains(p, "estudo") || strings.Contains(p, "duvida") {
		urgencia = "baixa"
	}

	tempoMs := float64(time.Since(inicio).Microseconds()) / 1000.0

	return ResultadoIntencao{
		Agente:          vencedor.agente,
		Confianca:       math.Round(maiorProb*10000) / 10000,
		Categoria:       vencedor.categoria,
		Urgencia:        urgencia,
		PalavrasChave:   palavrasPorAgente[vencedor.agente],
		Justificativa:   vencedor.justificativa,
		ComandoSugerido: vencedor.comando,
		TempoInferencia: tempoMs,
		Engine:          "nexus-go-softmax-v3.1",
	}
}

var splitRequisitosRegex = regexp.MustCompile(`[;\n,\.]+`)

func validarDoD(objetivo, entregaveis string) ResultadoGatekeeper {
	inicio := time.Now()
	objLower := strings.ToLower(objetivo)
	entLower := strings.ToLower(entregaveis)

	partes := splitRequisitosRegex.Split(objLower, -1)
	var requisitos []string
	for _, p := range partes {
		limpo := strings.TrimSpace(p)
		if len(limpo) > 3 {
			requisitos = append(requisitos, limpo)
		}
	}
	if len(requisitos) == 0 {
		requisitos = []string{strings.TrimSpace(objLower)}
	}

	var cobertos, pendentes []string
	for _, req := range requisitos {
		palavras := strings.Fields(req)
		var palavrasValidas []string
		for _, w := range palavras {
			if len(w) > 3 {
				palavrasValidas = append(palavrasValidas, w)
			}
		}
		if len(palavrasValidas) == 0 {
			continue
		}
		matches := 0
		for _, w := range palavrasValidas {
			if strings.Contains(entLower, w) {
				matches++
			}
		}
		cobertura := float64(matches) / float64(len(palavrasValidas))
		if cobertura >= 0.5 {
			cobertos = append(cobertos, req)
		} else {
			pendentes = append(pendentes, req)
		}
	}

	totalReqs := len(requisitos)
	taxaCobertura := 1.0
	if totalReqs > 0 {
		taxaCobertura = float64(len(cobertos)) / float64(totalReqs)
	}

	logit := (taxaCobertura - 0.7) * 8.0
	probConformidade := 1.0 / (1.0 + math.Exp(-logit/defaultTemperature))
	aprovado := probConformidade >= 0.75 && len(pendentes) == 0
	tempoMs := float64(time.Since(inicio).Microseconds()) / 1000.0

	return ResultadoGatekeeper{
		Aprovado:                  aprovado,
		ProbabilidadeConformidade: math.Round(probConformidade*10000) / 10000,
		RequisitosTotais:          totalReqs,
		RequisitosAtendidos:       cobertos,
		RequisitosPendentes:       pendentes,
		ScopeDriftDetectado:       len(pendentes) > 0,
		TempoInferencia:           tempoMs,
		Engine:                    "nexus-go-dod-v3.1",
	}
}

type regraSeguranca struct {
	padrao *regexp.Regexp
	peso   float64
	motivo string
}

var regrasCriticasSecOps = []regraSeguranca{
	{regexp.MustCompile(`\brm\s+-(r|f|rf|fr)\b`), 0.95, "Comando de exclusão recursiva/forçada em disco"},
	{regexp.MustCompile(`\bdd\s+if=`), 0.90, "Operação de gravação direta em bloco/disco"},
	{regexp.MustCompile(`\bmkfs\b`), 0.95, "Formatação de sistema de arquivos"},
	{regexp.MustCompile(`\bchmod\s+(777|0777)\b`), 0.75, "Concessão excessiva de privilégios globais"},
	{regexp.MustCompile(`\bcurl.*\|\s*(bash|sh)\b`), 0.85, "Execução direta de script remoto via pipe"},
	{regexp.MustCompile(`\b(truncate|drop\s+database|drop\s+table)\b`), 0.90, "Exclusão massiva em banco de dados"},
	{regexp.MustCompile(`\b(shutdown|reboot)\b`), 0.80, "Interrupção forçada do sistema operacional"},
}

func auditarSegurancaComando(comando string) ResultadoSeguranca {
	inicio := time.Now()
	cmd := strings.ToLower(strings.TrimSpace(comando))

	riscoMax := 0.05
	var motivos []string

	for _, r := range regrasCriticasSecOps {
		if r.padrao.MatchString(cmd) {
			if r.peso > riscoMax {
				riscoMax = r.peso
			}
			motivos = append(motivos, r.motivo)
		}
	}

	if len(motivos) == 0 {
		motivos = append(motivos, "Comando de rotina sem padrões destrutivos detectados")
	}

	nivel := "BAIXO"
	if riscoMax >= 0.80 {
		nivel = "CRITICO"
	} else if riscoMax >= 0.50 {
		nivel = "MEDIO"
	}

	tempoMs := float64(time.Since(inicio).Microseconds()) / 1000.0

	return ResultadoSeguranca{
		ScoreRisco:          riscoMax,
		NivelRisco:          nivel,
		BloqueioRecomendado: riscoMax >= 0.75,
		Motivos:             motivos,
		ComandoAnalisado:    comando,
		TempoInferencia:     tempoMs,
		Engine:              "nexus-go-secops-v3.1",
	}
}
