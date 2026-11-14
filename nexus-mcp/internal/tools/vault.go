// Package tools implementa a consulta ao Segundo Cérebro (Vault Soberano) do Nexus.
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

// RegistrarToolVault expõe a ferramenta de consulta ao Segundo Cérebro (Vault) do Nexus
func RegistrarToolVault(s *server.MCPServer, paths *config.Paths) {
	toolVault := mcp.NewTool("nexus_consultar_vault",
		mcp.WithDescription("Consulta o Segundo Cérebro Soberano do Nexus (~/nexus/vault/). Permite listar e ler post-mortems de bugs, runbooks de infraestrutura, cheat sheets e snippets de código para nunca reaprender o que já foi solucionado."),
		mcp.WithString("categoria", mcp.Description("Categoria opcional: bugs, runbooks, snippets ou decisoes")),
		mcp.WithString("busca", mcp.Description("Termo de busca textual para filtrar notas do cofre")),
		mcp.WithString("arquivo", mcp.Description("Caminho ou nome do arquivo específico para ler o conteúdo (ex: 'bugs/2026-11-04_ssh_deploy_key_pty_disconnect.md')")),
	)

	s.AddTool(toolVault, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		categoria := request.GetString("categoria", "")
		busca := strings.ToLower(strings.TrimSpace(request.GetString("busca", "")))
		arquivo := strings.TrimSpace(request.GetString("arquivo", ""))

		vaultDir := paths.VaultDir
		if _, err := os.Stat(vaultDir); os.IsNotExist(err) {
			return mcp.NewToolResultError(fmt.Sprintf("Diretório do Vault não encontrado em: %s", vaultDir)), nil
		}

		// 1. Se um arquivo específico foi solicitado: valida e lê o conteúdo
		if arquivo != "" {
			caminhoCompleto := filepath.Clean(filepath.Join(vaultDir, arquivo))
			rel, err := filepath.Rel(vaultDir, caminhoCompleto)
			if err != nil || strings.HasPrefix(rel, "..") || strings.HasPrefix(rel, "/") {
				return mcp.NewToolResultError("Acesso negado: o arquivo solicitado tenta escapar do cofre de notas."), nil
			}

			conteudo, err := os.ReadFile(caminhoCompleto)
			if err != nil {
				return mcp.NewToolResultError(fmt.Sprintf("Erro ao ler nota '%s': %v", arquivo, err)), nil
			}

			return mcp.NewToolResultText(fmt.Sprintf("# 📄 Nota do Vault: %s\n\n%s", rel, string(conteudo))), nil
		}

		// 2. Se nenhuma nota específica foi informada: lista e busca
		pastaAlvo := vaultDir
		if categoria != "" {
			pastaAlvo = filepath.Join(vaultDir, categoria)
		}

		var resultados []string
		err := filepath.Walk(pastaAlvo, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil
			}
			if info.IsDir() {
				if strings.HasPrefix(info.Name(), ".") {
					return filepath.SkipDir
				}
				return nil
			}
			if !strings.HasSuffix(info.Name(), ".md") {
				return nil
			}

			rel, _ := filepath.Rel(vaultDir, path)

			// Se houver filtro de busca, verifica se o nome ou conteúdo contém o termo
			if busca != "" {
				conteudo, err := os.ReadFile(filepath.Clean(path)) // #nosec G304 G122 - leitura segura restrita ao vaultDir validado no Walk
				if err != nil {
					return nil
				}
				if !strings.Contains(strings.ToLower(rel), busca) && !strings.Contains(strings.ToLower(string(conteudo)), busca) {
					return nil
				}
			}

			resultados = append(resultados, fmt.Sprintf("- **%s** (`%s`)", info.Name(), rel))
			return nil
		})

		if err != nil || len(resultados) == 0 {
			if busca != "" {
				return mcp.NewToolResultText(fmt.Sprintf("Nenhuma nota encontrada no Vault com o termo '%s'.", busca)), nil
			}
			return mcp.NewToolResultText("Nenhuma nota encontrada nessa categoria do Vault."), nil
		}

		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("# 🧠 Segundo Cérebro Nexus — Notas Encontradas (%d)\n\n", len(resultados)))
		sb.WriteString(strings.Join(resultados, "\n"))
		sb.WriteString("\n\nPara ler uma nota completa, chame `nexus_consultar_vault` informando o parâmetro `arquivo`.")

		return mcp.NewToolResultText(sb.String()), nil
	})
}
