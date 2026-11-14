// Package tools implementa as ferramentas do servidor MCP.
package tools

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarToolsADR adiciona as ferramentas de governança de Architecture Decision Records
func RegistrarToolsADR(s *server.MCPServer, paths *config.Paths) {
	// 1. Tool de Listagem: nexus_listar_adrs
	toolListar := mcp.NewTool("nexus_listar_adrs",
		mcp.WithDescription("Lista todos os Architecture Decision Records (ADRs) oficiais do ecossistema Nexus com status e data."),
	)

	s.AddTool(toolListar, func(_ context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if paths.ADRsDir == "" {
			return mcp.NewToolResultError("Diretório de ADRs não configurado"), nil
		}

		arquivos, err := os.ReadDir(paths.ADRsDir)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao ler diretório de ADRs (%s): %v", paths.ADRsDir, err)), nil
		}

		sort.Slice(arquivos, func(i, j int) bool {
			return arquivos[i].Name() < arquivos[j].Name()
		})

		var linhas []string
		linhas = append(linhas, "| ID | Título da Decisão Arquitetural | Status | Data | Arquivo |")
		linhas = append(linhas, "| :--- | :--- | :--- | :--- | :--- |")

		var contagem int
		for _, arq := range arquivos {
			nome := arq.Name()
			if arq.IsDir() || !strings.HasSuffix(nome, ".md") || nome == "0000-template.md" {
				continue
			}

			caminhoCompleto := filepath.Clean(filepath.Join(paths.ADRsDir, nome))
			// #nosec G304 -- leitura segura de arquivos controlados no diretorio de ADRs
			dados, err := os.ReadFile(caminhoCompleto)
			if err != nil {
				continue
			}

			titulo, status, data := extrairMetadadosADR(string(dados), nome)
			linhas = append(linhas, fmt.Sprintf("| `%s` | %s | **%s** | %s | [%s](file://%s) |",
				extrairNumeroADR(nome), titulo, status, data, nome, caminhoCompleto))
			contagem++
		}

		if contagem == 0 {
			return mcp.NewToolResultText("Nenhum ADR registrado no momento. Utilize `nexus_gerar_adr` para registrar a primeira decisão."), nil
		}

		resultado := fmt.Sprintf("### 🏛️ Architecture Decision Records (ADRs) do Ecossistema Nexus (%d registros)\n\n%s",
			contagem, strings.Join(linhas, "\n"))

		return mcp.NewToolResultText(resultado), nil
	})

	// 2. Tool de Criação: nexus_gerar_adr
	toolGerar := mcp.NewTool("nexus_gerar_adr",
		mcp.WithDescription("Gera e registra um novo Architecture Decision Record (ADR) padronizado no diretório nexus/docs/adrs/"),
		mcp.WithNumber("numero", mcp.Required(), mcp.Description("Número sequencial do ADR (ex: 4 para ADR 0004)")),
		mcp.WithString("titulo", mcp.Required(), mcp.Description("Título conciso da decisão (ex: 'Adoção de Cache Distribuído no Gateway')")),
		mcp.WithString("status", mcp.Description("Status da decisão: 'Aceito' (padrão), 'Proposto', 'Substituído'")),
		mcp.WithString("contexto", mcp.Required(), mcp.Description("Contexto operacional e declaração do problema que motivou a decisão")),
		mcp.WithString("decisao", mcp.Required(), mcp.Description("Descrição objetiva da decisão técnica adotada")),
		mcp.WithString("consequencias", mcp.Required(), mcp.Description("Impactos positivos (ganhos) e riscos mitigados/trade-offs")),
	)

	s.AddTool(toolGerar, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		numero := int(request.GetFloat("numero", 0))
		if numero <= 0 {
			return mcp.NewToolResultError("O parâmetro 'numero' deve ser um inteiro positivo maior que zero."), nil
		}

		titulo, err := request.RequireString("titulo")
		if err != nil || strings.TrimSpace(titulo) == "" {
			return mcp.NewToolResultError("O parâmetro 'titulo' é obrigatório."), nil
		}

		contexto, err := request.RequireString("contexto")
		if err != nil || strings.TrimSpace(contexto) == "" {
			return mcp.NewToolResultError("O parâmetro 'contexto' é obrigatório."), nil
		}

		decisao, err := request.RequireString("decisao")
		if err != nil || strings.TrimSpace(decisao) == "" {
			return mcp.NewToolResultError("O parâmetro 'decisao' é obrigatório."), nil
		}

		consequencias, err := request.RequireString("consequencias")
		if err != nil || strings.TrimSpace(consequencias) == "" {
			return mcp.NewToolResultError("O parâmetro 'consequencias' é obrigatório."), nil
		}

		status := strings.TrimSpace(request.GetString("status", "Aceito"))
		if status == "" {
			status = "Aceito"
		}

		// #nosec G301 -- diretorio com permissoes restritas 0750
		if err := os.MkdirAll(paths.ADRsDir, 0750); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao criar pasta de ADRs: %v", err)), nil
		}

		slug := slugificar(titulo)
		nomeArquivo := fmt.Sprintf("%04d-%s.md", numero, slug)
		caminhoDestino := filepath.Clean(filepath.Join(paths.ADRsDir, nomeArquivo))

		dataHoje := time.Now().Format("2006-01-02")
		conteudo := fmt.Sprintf(`# ADR %04d: %s

* **Status:** %s
* **Data:** %s
* **Autor:** Lucivaldo Junior & Lucy (Orquestrador)
* **Decisores:** Lucivaldo Junior (Tech Lead Sênior) & Lucy (Arquiteto)

---

## 1. Contexto & Declaração do Problema
%s

---

## 2. Decisão Arquitetural
%s

---

## 3. Consequências & Trade-offs
%s

---

## 4. Conformidade & Validação (DoD)
* [x] Decisão registrada formalmente no diretório canônico de ADRs.
* [x] Sincronização e paridade com a memória do Lucy.
`, numero, strings.TrimSpace(titulo), status, dataHoje, strings.TrimSpace(contexto), strings.TrimSpace(decisao), strings.TrimSpace(consequencias))

		// #nosec G306 -- escrita segura de arquivo de ADR com permissao restrita 0600
		if err := os.WriteFile(caminhoDestino, []byte(conteudo), 0600); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao gravar arquivo de ADR: %v", err)), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("ADR %04d criado com sucesso em: %s", numero, caminhoDestino)), nil
	})
}

func extrairNumeroADR(nomeArquivo string) string {
	parts := strings.Split(nomeArquivo, "-")
	if len(parts) > 0 {
		return parts[0]
	}
	return "ADR"
}

func extrairMetadadosADR(conteudo string, fallbackNome string) (string, string, string) {
	titulo := fallbackNome
	status := "Aceito"
	data := time.Now().Format("2006-01-02")

	linhas := strings.Split(conteudo, "\n")
	for _, l := range linhas {
		lTrim := strings.TrimSpace(l)
		if strings.HasPrefix(lTrim, "# ADR ") || strings.HasPrefix(lTrim, "# ") {
			idx := strings.Index(lTrim, ":")
			if idx != -1 && idx < len(lTrim)-1 {
				titulo = strings.TrimSpace(lTrim[idx+1:])
			} else {
				titulo = strings.TrimPrefix(lTrim, "# ")
			}
		} else if strings.Contains(lTrim, "**Status:**") {
			parts := strings.Split(lTrim, "**Status:**")
			if len(parts) > 1 {
				status = strings.TrimSpace(parts[1])
			}
		} else if strings.Contains(lTrim, "**Data:**") {
			parts := strings.Split(lTrim, "**Data:**")
			if len(parts) > 1 {
				data = strings.TrimSpace(parts[1])
			}
		}
	}
	return titulo, status, data
}

func slugificar(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug := reg.ReplaceAllString(s, "-")
	return strings.Trim(slug, "-")
}
