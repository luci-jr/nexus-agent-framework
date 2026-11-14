// Package tools implementa as ferramentas do servidor MCP.
package tools

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

var memoriaWriteMu sync.Mutex

// RegistrarToolsMemoria adiciona as ferramentas de leitura modular (ADR 0003), busca e gravação thread-safe
func RegistrarToolsMemoria(s *server.MCPServer, paths *config.Paths) {
	// 1. Tool de Leitura Otimizada (ADR 0003): nexus_obter_memoria
	toolObter := mcp.NewTool("nexus_obter_memoria",
		mcp.WithDescription("Lê a memória modular do Nexus (ADR 0003) economizando até 95% de tokens. Padrão lê 'operacional' (3KB)."),
		mcp.WithString("secao", mcp.Description("Módulo para ler: 'operacional' (padrão rápido), 'arquitetura' (01_stack), 'regras' (02_regras), 'rotinas' (03_rotinas), 'historico' (04_historico), 'perfil' ou 'completa' (lê memoria_lucy.md inteiro)")),
		mcp.WithNumber("ultimos_itens", mcp.Description("Quantidade máxima de aprendizados recentes a retornar do Master Ledger (ex: 5 ou 10).")),
	)

	s.AddTool(toolObter, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		secao := strings.ToLower(strings.TrimSpace(request.GetString("secao", "operacional")))
		ultimosItens := int(request.GetFloat("ultimos_itens", 0))

		// Se solicitou apenas aprendizados recentes, extrai direto do Master Ledger
		if ultimosItens > 0 {
			conteudoBytes, err := ReadCached(paths.MemoriaPath)
			if err != nil {
				return mcp.NewToolResultError(fmt.Sprintf("Erro ao ler memoria_lucy.md: %v", err)), nil
			}
			resumo := extrairUltimosAprendizados(string(conteudoBytes), ultimosItens)
			return mcp.NewToolResultText(resumo), nil
		}

		// Roteamento Modular de Arquivos (ADR 0003)
		if paths != nil && paths.MemoriaModularDir != "" {
			mapaModulos := map[string]string{
				"operacional":  paths.MemoriaOperacionalPath,
				"estado":       paths.MemoriaOperacionalPath,
				"arquitetura":  filepath.Join(paths.MemoriaModularDir, "01_stack_e_arquitetura.md"),
				"stack":        filepath.Join(paths.MemoriaModularDir, "01_stack_e_arquitetura.md"),
				"padroes":      filepath.Join(paths.MemoriaModularDir, "01_stack_e_arquitetura.md"),
				"regras":       filepath.Join(paths.MemoriaModularDir, "02_regras_e_politicas.md"),
				"politicas":    filepath.Join(paths.MemoriaModularDir, "02_regras_e_politicas.md"),
				"ambiente":     filepath.Join(paths.MemoriaModularDir, "02_regras_e_politicas.md"),
				"rotinas":      filepath.Join(paths.MemoriaModularDir, "03_rotinas_e_solopreneur.md"),
				"solopreneur":  filepath.Join(paths.MemoriaModularDir, "03_rotinas_e_solopreneur.md"),
				"historico":    filepath.Join(paths.MemoriaModularDir, "04_historico_e_adrs.md"),
				"adrs":         filepath.Join(paths.MemoriaModularDir, "04_historico_e_adrs.md"),
				"perfil":       paths.PerfilPath,
			}

			if caminhoModulo, ok := mapaModulos[secao]; ok && caminhoModulo != "" {
				if dados, err := ReadCached(caminhoModulo); err == nil {
					return mcp.NewToolResultText(string(dados)), nil
				}
			}
		}

		// Fallback ou leitura explícita do Master Ledger
		conteudoBytes, err := ReadCached(paths.MemoriaPath)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao ler memoria_lucy.md: %v", err)), nil
		}
		conteudo := string(conteudoBytes)

		if secao == "completa" || secao == "todas" || secao == "operacional" {
			return mcp.NewToolResultText(conteudo), nil
		}

		if bloco := extrairSecao(conteudo, secao); bloco != "" {
			return mcp.NewToolResultText(bloco), nil
		}

		return mcp.NewToolResultText(conteudo), nil
	})

	// 2. Tool de Busca Cirúrgica: nexus_buscar_memoria
	toolBuscar := mcp.NewTool("nexus_buscar_memoria",
		mcp.WithDescription("Realiza busca textual cirúrgica em toda a memória persistente (módulos ADR 0003 + Master Ledger) e retorna apenas os trechos relevantes."),
		mcp.WithString("termo", mcp.Required(), mcp.Description("Termo, tecnologia ou assunto a buscar (ex: 'VictoriaMetrics', 'Jungle Gaming', 'Swarm')")),
		mcp.WithNumber("limite", mcp.Description("Número máximo de ocorrências a retornar (padrão: 5)")),
	)

	s.AddTool(toolBuscar, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		termo, err := request.RequireString("termo")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'termo' é obrigatório"), nil
		}

		termo = strings.TrimSpace(termo)
		if termo == "" {
			return mcp.NewToolResultError("O termo de busca não pode ser vazio"), nil
		}

		limite := int(request.GetFloat("limite", 5))
		if limite <= 0 {
			limite = 5
		}

		conteudoBytes, err := ReadCached(paths.MemoriaPath)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao ler memoria_lucy.md: %v", err)), nil
		}

		resultado := buscarNaMemoria(string(conteudoBytes), termo, limite)
		return mcp.NewToolResultText(resultado), nil
	})

	// 3. Tool de Escrita Thread-Safe (Append Seguro): nexus_registrar_aprendizado
	toolRegistrar := mcp.NewTool("nexus_registrar_aprendizado",
		mcp.WithDescription("Registra uma nova decisão técnica, preferência ou rotina na memória viva do Nexus com lock de concorrência e proteção contra context poisoning"),
		mcp.WithString("entrada", mcp.Required(), mcp.Description("Texto descritivo do aprendizado ou decisão a registrar")),
	)

	s.AddTool(toolRegistrar, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		entrada, err := request.RequireString("entrada")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'entrada' é obrigatório"), nil
		}

		entradaLimpa := strings.TrimSpace(entrada)
		if len(entradaLimpa) == 0 {
			return mcp.NewToolResultError("Acesso negado: a entrada não pode ser vazia."), nil
		}

		if len(entradaLimpa) > 1000 {
			return mcp.NewToolResultError("Acesso negado: entrada excede o limite máximo de segurança (1.000 caracteres) para prevenir Context Poisoning."), nil
		}

		if segredoNoEstado.MatchString(entradaLimpa) {
			return mcp.NewToolResultError("Acesso negado: possível credencial, token ou senha detectada na entrada."), nil
		}

		entradaLimpa = strings.ReplaceAll(entradaLimpa, "\r\n", " ")
		entradaLimpa = strings.ReplaceAll(entradaLimpa, "\n", " ")

		dataHoje := time.Now().Format("2006-01-02")
		linha := fmt.Sprintf("\n- **[%s]**: %s", dataHoje, entradaLimpa)

		memoriaWriteMu.Lock()
		defer memoriaWriteMu.Unlock()

		f, err := os.OpenFile(paths.MemoriaPath, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao abrir memória para escrita: %v", err)), nil
		}
		defer func() { _ = f.Close() }()

		if _, err := f.WriteString(linha); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao gravar aprendizado: %v", err)), nil
		}

		InvalidateCache(paths.MemoriaPath)

		return mcp.NewToolResultText(fmt.Sprintf("Aprendizado registrado com sucesso em %s na memória do Nexus.", dataHoje)), nil
	})
}

func extrairSecao(conteudo string, secao string) string {
	titulos := map[string][]string{
		"perfil":       {"## 1. Perfil", "## 1."},
		"ambiente":     {"## 2. Configurações", "## 2."},
		"arquitetura":  {"## 3. Decisões", "## 3."},
		"estado":       {"## 4. Estado", "## 4."},
		"aprendizados": {"## 5. Histórico", "## 5."},
	}

	alvos, ok := titulos[secao]
	if !ok {
		return ""
	}

	linhas := strings.Split(conteudo, "\n")
	inicio := -1
	fim := len(linhas)

	for i, l := range linhas {
		if inicio == -1 {
			for _, alvo := range alvos {
				if strings.HasPrefix(strings.TrimSpace(l), alvo) {
					inicio = i
					break
				}
			}
		} else if strings.HasPrefix(strings.TrimSpace(l), "## ") {
			fim = i
			break
		}
	}

	if inicio != -1 {
		return strings.Join(linhas[inicio:fim], "\n")
	}
	return ""
}

func extrairUltimosAprendizados(conteudo string, limite int) string {
	var entradas []string
	var buffer strings.Builder
	scanner := bufio.NewScanner(strings.NewReader(conteudo))

	for scanner.Scan() {
		linha := scanner.Text()
		if strings.HasPrefix(linha, "- **[") || strings.HasPrefix(linha, "* **[") {
			if buffer.Len() > 0 {
				entradas = append(entradas, strings.TrimSpace(buffer.String()))
				buffer.Reset()
			}
			buffer.WriteString(linha)
		} else if buffer.Len() > 0 {
			if strings.HasPrefix(linha, "## ") {
				entradas = append(entradas, strings.TrimSpace(buffer.String()))
				buffer.Reset()
			} else {
				buffer.WriteString("\n" + linha)
			}
		}
	}
	if buffer.Len() > 0 {
		entradas = append(entradas, strings.TrimSpace(buffer.String()))
	}

	total := len(entradas)
	if total == 0 {
		return "Nenhum aprendizado registrado com a formatação padrão '- **[YYYY-MM-DD]**'."
	}

	inicio := total - limite
	if inicio < 0 {
		inicio = 0
	}

	selecionadas := entradas[inicio:]
	return fmt.Sprintf("### 🧠 Últimos %d Aprendizados Registrados no Nexus:\n\n%s",
		len(selecionadas), strings.Join(selecionadas, "\n\n"))
}

func buscarNaMemoria(conteudo string, termo string, limite int) string {
	termoLower := strings.ToLower(termo)
	var matches []string

	linhas := strings.Split(conteudo, "\n")
	encontrados := 0

	for i := 0; i < len(linhas) && encontrados < limite; i++ {
		if strings.Contains(strings.ToLower(linhas[i]), termoLower) {
			encontrados++
			start := i - 1
			if start < 0 {
				start = 0
			}
			end := i + 3
			if end > len(linhas) {
				end = len(linhas)
			}
			trecho := strings.TrimSpace(strings.Join(linhas[start:end], "\n"))
			matches = append(matches, fmt.Sprintf("🔍 **Resultado %d (Linha ~%d):**\n```markdown\n%s\n```", encontrados, i+1, trecho))
			i = end - 1
		}
	}

	if len(matches) == 0 {
		return fmt.Sprintf("Nenhuma ocorrência encontrada para o termo '%s' na memória persistente.", termo)
	}

	return fmt.Sprintf("### 🔍 Busca na Memória do Nexus por '%s' (%d resultados):\n\n%s",
		termo, len(matches), strings.Join(matches, "\n\n"))
}
