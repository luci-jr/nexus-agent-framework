// Package prompts implementa os Prompts padronizados do protocolo MCP para o ecossistema Nexus.
package prompts

import (
	"context"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarPrompts adiciona templates de prompts inteligentes padronizados do Lucy
func RegistrarPrompts(s *server.MCPServer) {
	// 1. Prompt: Mentoria Técnica Socrática
	promptMentoria := mcp.NewPrompt("mentoria_tecnica",
		mcp.WithPromptDescription("Aciona o método socrático do Lucy para explicação de fundamentos e causa-raiz técnica"),
		mcp.WithArgument("topico", mcp.ArgumentDescription("Conceito ou tópico a ser mentorado (ex: 'Garbage Collector G1', 'Channels em Go', 'Signals no Angular')"), mcp.RequiredArgument()),
		mcp.WithArgument("linguagem", mcp.ArgumentDescription("Linguagem ou ecossistema (Java, Go, TypeScript)")),
	)

	s.AddPrompt(promptMentoria, func(_ context.Context, req mcp.GetPromptRequest) (*mcp.GetPromptResult, error) {
		topico := req.Params.Arguments["topico"]
		lang := req.Params.Arguments["linguagem"]
		if lang == "" {
			lang = "Geral / Arquitetura"
		}

		instrucao := fmt.Sprintf(`Fala, irmão! Como teu Tech Lead e Mentor Sênior, conduza uma mentoria técnica profunda sobre o tópico: **%s** (Stack: %s).
Siga rigorosamente a estrutura pedagógica do Lucy:
1. [CONCEITO]: Explicação cirúrgica em 2 ou 3 frases sobre o funcionamento interno e fundamentos de computação.
2. [SNIPPET]: Exemplo de código limpo, moderno e conciso (<15 linhas).
3. [ONDE APLICA]: Impacto real na arquitetura corporativa, performance e prevenção de bugs em produção.
4. [DESAFIO]: Exercício prático para eu testar no meu terminal Ubuntu ou na minha IDE.`, topico, lang)

		msg := mcp.NewPromptMessage(mcp.RoleUser, mcp.NewTextContent(instrucao))
		return mcp.NewGetPromptResult("Mentoria Técnica Socrática — Ecossistema Nexus", []mcp.PromptMessage{msg}), nil
	})

	// 2. Prompt: Análise de Vagas no Framework PERF
	promptPERF := mcp.NewPrompt("analise_vaga_perf",
		mcp.WithPromptDescription("Aciona o copiloto Frellas para auditar uma vaga de emprego com o Framework PERF e sugerir abordagem"),
		mcp.WithArgument("descricao_vaga", mcp.ArgumentDescription("Texto completo da vaga de emprego (CLT ou PJ)"), mcp.RequiredArgument()),
	)

	s.AddPrompt(promptPERF, func(_ context.Context, req mcp.GetPromptRequest) (*mcp.GetPromptResult, error) {
		vaga := req.Params.Arguments["descricao_vaga"]
		instrucao := fmt.Sprintf(`Como Headhunter e Tech Recruiter Especialista (Frellas), avalie com rigor de Framework PERF a aderência do perfil de Lucivaldo Junior à seguinte vaga:

%s

Entregáveis Obrigatórios:
- Tabela comparativa de Requisitos vs. Perfil Real
- Score de Fit Técnico (0%% a 100%%)
- Versão recomendada do currículo em ~/Documentos/cv-lucivaldo/ (Backend Geral, Java, Go ou Frontend)
- Minuta de abordagem direta (InMail) limpa e profissional valorizando os 15+ anos de transição de liderança.`, vaga)

		msg := mcp.NewPromptMessage(mcp.RoleUser, mcp.NewTextContent(instrucao))
		return mcp.NewGetPromptResult("Auditoria de Vagas — Framework PERF", []mcp.PromptMessage{msg}), nil
	})

	// 3. Prompt: Code Review Sênior (Clean Code & Arquitetura Limpa)
	promptReview := mcp.NewPrompt("code_review_senior",
		mcp.WithPromptDescription("Realiza code review aprofundado com foco em concorrência, consumo de memória e Clean Architecture"),
		mcp.WithArgument("codigo", mcp.ArgumentDescription("Código-fonte a ser auditado"), mcp.RequiredArgument()),
	)

	s.AddPrompt(promptReview, func(_ context.Context, req mcp.GetPromptRequest) (*mcp.GetPromptResult, error) {
		codigo := req.Params.Arguments["codigo"]
		instrucao := fmt.Sprintf(`Analise criticamente o seguinte trecho de código como Tech Lead Sênior:

`+"```"+`
%s
`+"```"+`

Critérios de Inspeção:
1. Alocações desnecessárias na memória (Heap vs. Stack / Garbage Collector / Slices em Go).
2. Concorrência e thread-safety (Race conditions, deadlocks, canais ou locks).
3. Legibilidade, Clean Code e tratamento robusto de erros.
4. Sugestão refinada de implementação (<20 linhas).`, codigo)

		msg := mcp.NewPromptMessage(mcp.RoleUser, mcp.NewTextContent(instrucao))
		return mcp.NewGetPromptResult("Code Review Sênior — Ecossistema Nexus", []mcp.PromptMessage{msg}), nil
	})
}
