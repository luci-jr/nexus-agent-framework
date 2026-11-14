// Package resources implementa os Recursos MCP (Model Context Protocol) nativos do Nexus.
package resources

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarResources expõe documentos vitais do ecossistema como recursos nativos do protocolo MCP
func RegistrarResources(s *server.MCPServer, paths *config.Paths) {
	// 1. Recurso: Memória Contínua (nexus://memoria)
	resMemoria := mcp.NewResource("nexus://memoria", "Memória Contínua do Lucy",
		mcp.WithResourceDescription("Contexto vivo de longo prazo, histórico de decisões e preferências do desenvolvedor"),
		mcp.WithMIMEType("text/markdown"),
	)
	s.AddResource(resMemoria, func(_ context.Context, _ mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
		// #nosec G304 - recurso institucional do nexus
		conteudo, err := os.ReadFile(filepath.Clean(paths.MemoriaPath))
		if err != nil {
			return nil, fmt.Errorf("erro ao carregar recurso nexus://memoria: %w", err)
		}
		return []mcp.ResourceContents{
			mcp.TextResourceContents{
				URI:      "nexus://memoria",
				MIMEType: "text/markdown",
				Text:     string(conteudo),
			},
		}, nil
	})

	// 2. Recurso: Perfil Profissional (nexus://perfil)
	resPerfil := mcp.NewResource("nexus://perfil", "Perfil Profissional e Stacks",
		mcp.WithResourceDescription("Stacks dominadas, senioridade real (Júnior em transição) e diferenciais competitivos"),
		mcp.WithMIMEType("text/markdown"),
	)
	s.AddResource(resPerfil, func(_ context.Context, _ mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
		// #nosec G304 - recurso institucional do nexus
		conteudo, err := os.ReadFile(filepath.Clean(paths.PerfilPath))
		if err != nil {
			return nil, fmt.Errorf("erro ao carregar recurso nexus://perfil: %w", err)
		}
		return []mcp.ResourceContents{
			mcp.TextResourceContents{
				URI:      "nexus://perfil",
				MIMEType: "text/markdown",
				Text:     string(conteudo),
			},
		}, nil
	})

	// 3. Recurso: Políticas de Segurança (nexus://seguranca)
	caminhoSeg := filepath.Join(paths.NexusIADir, "politicas_seguranca.md")
	resSeguranca := mcp.NewResource("nexus://seguranca", "Políticas de Segurança do Nexus",
		mcp.WithResourceDescription("Diretrizes mandatórias de sigilo de dados sensíveis e autorização em disco"),
		mcp.WithMIMEType("text/markdown"),
	)
	s.AddResource(resSeguranca, func(_ context.Context, _ mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
		// #nosec G304 - recurso institucional do nexus
		conteudo, err := os.ReadFile(filepath.Clean(caminhoSeg))
		if err != nil {
			return nil, fmt.Errorf("erro ao carregar recurso nexus://seguranca: %w", err)
		}
		return []mcp.ResourceContents{
			mcp.TextResourceContents{
				URI:      "nexus://seguranca",
				MIMEType: "text/markdown",
				Text:     string(conteudo),
			},
		}, nil
	})
}
