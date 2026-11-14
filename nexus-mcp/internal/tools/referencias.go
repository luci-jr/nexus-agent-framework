// Package tools - Nexus MCP Server
// Consulta e listagem da base de referências corporativas do Nexus
package tools

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarToolReferencias adiciona a ferramenta de consulta às referências do Nexus
func RegistrarToolReferencias(s *server.MCPServer, paths *config.Paths) {
	toolRef := mcp.NewTool("nexus_consultar_referencia",
		mcp.WithDescription("Consulta a base de referências corporativas do Nexus (~/nexus/referencias/). Permite listar documentos ou ler minutas de contratos, templates e padrões arquiteturais."),
		mcp.WithString("categoria", mcp.Description("Categoria opcional: contratos, templates, arquitetura ou dados")),
		mcp.WithString("arquivo", mcp.Description("Nome do arquivo específico para ler o conteúdo (ex: contrato_pj.md). Se vazio, lista os arquivos disponíveis.")),
	)

	s.AddTool(toolRef, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		categoria := request.GetString("categoria", "")
		arquivo := request.GetString("arquivo", "")

		pastaAlvo := paths.ReferenciasDir
		if categoria != "" {
			pastaAlvo = filepath.Join(paths.ReferenciasDir, categoria)
		}

		// 1. Se nenhum arquivo foi especificado, lista as referências disponíveis
		if arquivo == "" {
			var listaArquivos []string
			err := filepath.Walk(pastaAlvo, func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}
				if !info.IsDir() {
					rel, _ := filepath.Rel(paths.ReferenciasDir, path)
					listaArquivos = append(listaArquivos, fmt.Sprintf("📄 %s", rel))
				}
				return nil
			})

			if err != nil || len(listaArquivos) == 0 {
				return mcp.NewToolResultText("Nenhum documento de referência encontrado nessa pasta ainda."), nil
			}

			return mcp.NewToolResultText(fmt.Sprintf("Documentos de Referência Disponíveis no Nexus:\n\n%s", strings.Join(listaArquivos, "\n"))), nil
		}

		// 2. Se o arquivo foi especificado, valida o caminho por segurança (evita Path Traversal estrito)
		caminhoCompleto := filepath.Clean(filepath.Join(pastaAlvo, arquivo))
		rel, err := filepath.Rel(paths.ReferenciasDir, caminhoCompleto)
		if err != nil || strings.HasPrefix(rel, "..") || strings.HasPrefix(rel, "/") {
			return mcp.NewToolResultError("Acesso negado: o caminho solicitado tenta escapar da pasta de referências."), nil
		}

		// Valida lista branca de extensões permitidas para evitar leitura de binários ou arquivos indevidos
		ext := strings.ToLower(filepath.Ext(caminhoCompleto))
		permitidas := map[string]bool{
			".md":   true,
			".txt":  true,
			".json": true,
			".csv":  true,
			".yaml": true,
			".yml":  true,
		}
		if !permitidas[ext] {
			return mcp.NewToolResultError(fmt.Sprintf("Acesso negado: extensão '%s' não permitida por segurança. Permitidas: .md, .txt, .json, .csv, .yaml, .yml", ext)), nil
		}

		conteudo, err := ReadCached(caminhoCompleto)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Égua, não encontrei o arquivo '%s': %v", arquivo, err)), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("Conteúdo da Referência [%s]:\n\n%s", arquivo, string(conteudo))), nil
	})
}
