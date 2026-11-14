// Package main - Nexus MCP Server (Versão 3.0.0)
// Desenvolvido por Lucivaldo Junior em Belém do Pará.
// Servidor nativo de alta performance para orquestrar o ecossistema Nexus via protocolo MCP.
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/luci-jr/nexus-mcp/internal/prompts"
	"github.com/luci-jr/nexus-mcp/internal/resources"
	"github.com/luci-jr/nexus-mcp/internal/tools"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	transportFlag := flag.String("transport", "", "Modo de transporte: stdio ou sse (padrão stdio ou env MCP_TRANSPORT)")
	portFlag := flag.String("port", "8085", "Porta HTTP para o modo SSE (padrão 8085 ou env MCP_PORT)")
	flag.Parse()

	transport := *transportFlag
	if transport == "" {
		transport = os.Getenv("MCP_TRANSPORT")
		if transport == "" {
			transport = "stdio"
		}
	}

	port := *portFlag
	if p := os.Getenv("MCP_PORT"); p != "" {
		port = p
	}

	// 1. Mapeia os caminhos vitais do ecossistema no Linux (sem hardcode, direto na fonte)
	paths, err := config.GetPaths()
	if err != nil {
		log.Fatalf("Égua, deu ruim na hora de resolver os caminhos do Nexus: %v", err)
	}

	// 2. Inicializa o servidor MCP padronizado com suporte total a Tools, Resources e Prompts
	s := server.NewMCPServer(
		"nexus-mcp",
		"3.0.0",
		server.WithToolCapabilities(false),
		server.WithResourceCapabilities(false, false),
		server.WithPromptCapabilities(false),
	)

	// 3. Registra as Ferramentas Nativas (Tools)
	tools.RegistrarToolsMemoria(s, paths)
	tools.RegistrarToolsEstadoTarefa(s, paths)
	tools.RegistrarToolBackup(s, paths)
	tools.RegistrarToolSistema(s)
	tools.RegistrarToolReferencias(s, paths)
	tools.RegistrarToolsCarreira(s, paths)
	tools.RegistrarToolRelatorios(s, paths)
	tools.RegistrarToolIntencao(s, paths)
	tools.RegistrarToolGrafo(s, paths)
	tools.RegistrarToolVisaoUI(s)
	tools.RegistrarToolsADR(s, paths)
	tools.RegistrarToolVault(s, paths)

	// 4. Registra os Recursos Nativos (Resources - nexus://)
	resources.RegistrarResources(s, paths)

	// 5. Registra os Prompts Inteligentes Padronizados (Prompts)
	prompts.RegistrarPrompts(s)

	// 6. Inicia conforme o transporte configurado
	if transport == "sse" {
		portNum, err := strconv.Atoi(port)
		if err != nil || portNum < 1 || portNum > 65535 {
			log.Fatalf("Porta inválida para o modo SSE: deve ser um número entre 1 e 65535")
		}
		addr := fmt.Sprintf("0.0.0.0:%d", portNum)
		// #nosec G706 -- porta estritamente validada e convertida para inteiro
		log.Printf("Iniciando Nexus MCP Server em modo SSE na porta %d...", portNum)
		sseServer := server.NewSSEServer(s)
		if err := sseServer.Start(addr); err != nil {
			log.Fatalf("Servidor SSE finalizado com erro: %v", err)
		}
	} else {
		// Inicia no canal stdio (comunicação ultrarrápida JSON-RPC 2.0 via stdin/stdout)
		if err := server.ServeStdio(s); err != nil {
			log.Fatalf("Servidor MCP finalizado com erro: %v", err)
		}
	}
}
