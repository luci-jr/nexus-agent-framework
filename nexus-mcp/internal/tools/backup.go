// Package tools - Nexus MCP Server
// Implementação do backup seguro do ecossistema no Linux/Google Drive
package tools

import (
	"context"
	"fmt"
	"os/exec"
	"time"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarToolBackup adiciona a ferramenta de backup oficial do Nexus ao servidor MCP
func RegistrarToolBackup(s *server.MCPServer, paths *config.Paths) {
	toolBackup := mcp.NewTool("nexus_executar_backup",
		mcp.WithDescription("Executa o backup espelhado do Nexus. Requer confirmação explícita porque remove apenas arquivos obsoletos dos destinos de backup."),
		mcp.WithBoolean("confirmar_exclusoes", mcp.Required(), mcp.Description("Confirma a exclusão de arquivos obsoletos nos destinos de backup.")),
	)

	s.AddTool(toolBackup, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if !request.GetBool("confirmar_exclusoes", false) {
			return mcp.NewToolResultError("Confirmação obrigatória ausente. Informe confirmar_exclusoes=true para executar o espelhamento com exclusões."), nil
		}
		// Define um timeout de 3 minutos para a operação de backup
		ctxTimeout, cancel := context.WithTimeout(ctx, 3*time.Minute)
		defer cancel()

		// Executa o script oficial via bash
		// #nosec G204 -- script de backup local e caminho controlado internamente
		cmd := exec.CommandContext(ctxTimeout, "bash", paths.BackupScript)
		cmd.Env = append(cmd.Environ(), "NEXUS_CONFIRM_DELETE=SIM", "NEXUS_AUTO_COMMIT=1")
		saida, err := cmd.CombinedOutput()
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Égua, o backup falhou: %v\nLogs:\n%s", err, string(saida))), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("Backup executado com sucesso e no prumo!\n\nRelatório do terminal:\n%s", string(saida))), nil
	})
}
