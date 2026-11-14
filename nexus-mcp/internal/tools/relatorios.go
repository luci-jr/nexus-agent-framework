// Package tools - Nexus MCP Server
// Gerenciamento e persistência padronizada de relatórios técnicos do Nexus
package tools

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarToolRelatorios adiciona a ferramenta para salvar relatórios estruturados
func RegistrarToolRelatorios(s *server.MCPServer, paths *config.Paths) {
	toolRelatorio := mcp.NewTool("nexus_salvar_relatorio",
		mcp.WithDescription("Salva um relatório técnico padronizado em ~/Documentos/nexus/relatorios/<tipo>/ seguindo a convenção oficial YYYY-MM-DD_<slug>.md"),
		mcp.WithString("tipo", mcp.Required(), mcp.Description("Copiloto responsável: 'lucy', 'backend', 'frontend', 'sysops', 'frellas', 'qa', 'secops', 'suporte', 'bi' ou 'finops'")),
		mcp.WithString("titulo", mcp.Required(), mcp.Description("Título descritivo do relatório (ex: 'analise_vaga_jungle_gaming' ou 'planejamento_sprint')")),
		mcp.WithString("conteudo", mcp.Required(), mcp.Description("Conteúdo completo do relatório em formato Markdown")),
	)

	s.AddTool(toolRelatorio, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		tipo, err := request.RequireString("tipo")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'tipo' é obrigatório"), nil
		}

		titulo, err := request.RequireString("titulo")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'titulo' é obrigatório"), nil
		}

		conteudo, err := request.RequireString("conteudo")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'conteudo' é obrigatório"), nil
		}

		tipoSanitizado := strings.ToLower(strings.TrimSpace(tipo))
		tiposValidos := map[string]bool{
			"lucy":     true,
			"backend":  true,
			"frontend": true,
			"sysops":   true,
			"frellas":  true,
			"qa":       true,
			"secops":   true,
			"suporte":  true,
			"bi":       true,
			"finops":   true,
		}
		if !tiposValidos[tipoSanitizado] {
			return mcp.NewToolResultError(fmt.Sprintf("Tipo de relatório '%s' inválido. Tipos válidos: lucy, backend, frontend, sysops, frellas, qa, secops, suporte, bi e finops.", tipo)), nil
		}

		// Gera slug limpo para o nome do arquivo
		slug := gerarSlug(titulo)
		hoje := time.Now().Format("2006-01-02")
		nomeArquivo := fmt.Sprintf("%s_%s.md", hoje, slug)

		pastaDestino := filepath.Join(paths.RelatoriosDir, tipoSanitizado)
		if err := os.MkdirAll(pastaDestino, 0750); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao criar diretório de relatórios (%s): %v", pastaDestino, err)), nil
		}

		caminhoCompleto := filepath.Join(pastaDestino, nomeArquivo)

		// Cabeçalho institucional do relatório
		cabecalho := fmt.Sprintf("# 📊 Relatório Nexus — %s\n\n- **Data de Registro:** %s\n- **Copiloto Responsável:** %s\n- **Autor/Desenvolvedor:** Lucivaldo Junior\n- **Status:** Persistido no Ecossistema\n\n---\n\n",
			formatarTituloSlug(slug), time.Now().Format("02/01/2006 15:04"), tipoSanitizado)

		conteudoFinal := cabecalho + strings.TrimSpace(conteudo) + "\n"

		if err := os.WriteFile(caminhoCompleto, []byte(conteudoFinal), 0600); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao gravar arquivo de relatório: %v", err)), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("✅ Relatório salvo com sucesso no Nexus!\n📁 **Caminho:** `%s`\n📄 **Arquivo:** `%s`", caminhoCompleto, nomeArquivo)), nil
	})
}

var regEspacos = regexp.MustCompile(`[^\w\-]+`)

func formatarTituloSlug(s string) string {
	partes := strings.FieldsFunc(s, func(r rune) bool {
		return r == '-' || r == '_'
	})
	for i, p := range partes {
		if len(p) > 0 {
			partes[i] = strings.ToUpper(p[:1]) + p[1:]
		}
	}
	return strings.Join(partes, " ")
}

func gerarSlug(titulo string) string {
	limpo := strings.ToLower(strings.TrimSpace(titulo))
	limpo = strings.ReplaceAll(limpo, " ", "_")
	limpo = regEspacos.ReplaceAllString(limpo, "")
	if len(limpo) > 60 {
		limpo = limpo[:60]
	}
	if limpo == "" {
		limpo = "relatorio"
	}
	return limpo
}
