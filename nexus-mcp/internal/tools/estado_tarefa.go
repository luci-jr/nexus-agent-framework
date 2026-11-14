// Package tools implementa o estado compacto e versionado das tarefas do Nexus.
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

const maxEstadoCampo = 2000

var (
	tarefaValida    = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{0,63}$`)
	segredoNoEstado = regexp.MustCompile(`(?i)(api[_-]?key|password|senha|token|secret)\s*[:=]\s*[^\s]+`)
)

// RegistrarToolsEstadoTarefa expõe o estado pequeno, recuperável e versionado de cada tarefa.
func RegistrarToolsEstadoTarefa(s *server.MCPServer, paths *config.Paths) {
	toolObter := mcp.NewTool("nexus_obter_estado_tarefa",
		mcp.WithDescription("Lê o estado compacto atual de uma tarefa. Use antes de delegar para evitar enviar histórico desnecessário."),
		mcp.WithString("tarefa", mcp.Required(), mcp.Description("Identificador minúsculo da tarefa, por exemplo: 'migracao-mcp'")),
	)
	s.AddTool(toolObter, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		tarefa, erro := tarefaSegura(request)
		if erro != nil {
			return mcp.NewToolResultError(erro.Error()), nil
		}
		conteudo, err := os.ReadFile(caminhoEstadoAtivo(paths, tarefa))
		if os.IsNotExist(err) {
			return mcp.NewToolResultText(fmt.Sprintf("Não há estado ativo para '%s'. Crie-o com nexus_salvar_estado_tarefa antes de delegar.", tarefa)), nil
		}
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao ler estado da tarefa: %v", err)), nil
		}
		return mcp.NewToolResultText(string(conteudo)), nil
	})

	toolSalvar := mcp.NewTool("nexus_salvar_estado_tarefa",
		mcp.WithDescription("Cria ou atualiza um estado compacto da tarefa e salva um snapshot automático da versão anterior. Não inclua segredos."),
		mcp.WithString("tarefa", mcp.Required(), mcp.Description("Identificador minúsculo, até 64 caracteres, usando letras, números, hífen ou sublinhado.")),
		mcp.WithString("objetivo", mcp.Required(), mcp.Description("Resultado esperado em uma frase.")),
		mcp.WithString("status", mcp.Required(), mcp.Description("Status atual, por exemplo: em_andamento, bloqueado ou concluido.")),
		mcp.WithString("resumo", mcp.Required(), mcp.Description("Contexto decisório compacto, sem repetir o histórico completo.")),
		mcp.WithString("decisoes", mcp.Description("Decisões técnicas já tomadas.")),
		mcp.WithString("arquivos", mcp.Description("Arquivos afetados ou analisados.")),
		mcp.WithString("testes", mcp.Description("Testes, comandos e resultado da validação.")),
		mcp.WithString("pendencias", mcp.Description("Riscos, bloqueios ou próximo passo.")),
		mcp.WithString("agente", mcp.Required(), mcp.Description("Agente que atualiza o estado: lucy, backend, qa, sysops etc.")),
		mcp.WithNumber("contexto_caracteres", mcp.Description("Quantidade aproximada de caracteres enviados ao especialista nesta rodada.")),
		mcp.WithNumber("reaberturas", mcp.Description("Número de vezes que a tarefa foi reaberta após uma validação.")),
	)
	s.AddTool(toolSalvar, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		tarefa, erro := tarefaSegura(request)
		if erro != nil {
			return mcp.NewToolResultError(erro.Error()), nil
		}

		campos := map[string]string{
			"objetivo":   strings.TrimSpace(request.GetString("objetivo", "")),
			"status":     strings.TrimSpace(request.GetString("status", "")),
			"resumo":     strings.TrimSpace(request.GetString("resumo", "")),
			"decisoes":   strings.TrimSpace(request.GetString("decisoes", "")),
			"arquivos":   strings.TrimSpace(request.GetString("arquivos", "")),
			"testes":     strings.TrimSpace(request.GetString("testes", "")),
			"pendencias": strings.TrimSpace(request.GetString("pendencias", "")),
			"agente":     strings.TrimSpace(request.GetString("agente", "")),
		}
		for nome, valor := range campos {
			if (nome == "objetivo" || nome == "status" || nome == "resumo" || nome == "agente") && valor == "" {
				return mcp.NewToolResultError(fmt.Sprintf("O campo '%s' é obrigatório.", nome)), nil
			}
			if len(valor) > maxEstadoCampo {
				return mcp.NewToolResultError(fmt.Sprintf("O campo '%s' excede %d caracteres; mantenha o estado compacto.", nome, maxEstadoCampo)), nil
			}
			if segredoNoEstado.MatchString(valor) {
				return mcp.NewToolResultError("Possível segredo detectado. Remova credenciais, tokens e senhas antes de salvar o estado."), nil
			}
		}

		contexto := int(request.GetFloat("contexto_caracteres", 0))
		reaberturas := int(request.GetFloat("reaberturas", 0))
		if contexto < 0 || reaberturas < 0 {
			return mcp.NewToolResultError("contexto_caracteres e reaberturas não podem ser negativos."), nil
		}

		ativo := caminhoEstadoAtivo(paths, tarefa)
		if err := snapshotEstadoAnterior(paths, tarefa, ativo); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao versionar estado anterior: %v", err)), nil
		}

		agora := time.Now()
		conteudo := montarEstadoTarefa(tarefa, campos, contexto, reaberturas, agora)
		if err := escreverPrivado(ativo, []byte(conteudo)); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao salvar estado da tarefa: %v", err)), nil
		}
		return mcp.NewToolResultText(fmt.Sprintf("Estado compacto de '%s' salvo. Especialistas devem receber este estado e devolver apenas evidências incrementais.", tarefa)), nil
	})

	toolMetricas := mcp.NewTool("nexus_metricas_fluxo",
		mcp.WithDescription("Resume métricas locais do fluxo de agentes: tarefas ativas, snapshots, contexto informado e reaberturas."),
	)
	s.AddTool(toolMetricas, func(_ context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		resultado, err := metricasFluxo(paths)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Erro ao calcular métricas de fluxo: %v", err)), nil
		}
		return mcp.NewToolResultText(resultado), nil
	})
}

func tarefaSegura(request mcp.CallToolRequest) (string, error) {
	tarefa, err := request.RequireString("tarefa")
	if err != nil {
		return "", fmt.Errorf("o parâmetro 'tarefa' é obrigatório")
	}
	tarefa = strings.ToLower(strings.TrimSpace(tarefa))
	if !tarefaValida.MatchString(tarefa) {
		return "", fmt.Errorf("identificador de tarefa inválido; use letras minúsculas, números, hífen ou sublinhado (até 64 caracteres)")
	}
	return tarefa, nil
}

func caminhoEstadoAtivo(paths *config.Paths, tarefa string) string {
	return filepath.Join(paths.EstadosDir, "ativas", tarefa+".md")
}

func snapshotEstadoAnterior(paths *config.Paths, tarefa, ativo string) error {
	// #nosec G304 -- ativo deriva de EstadosDir interno e identificador estritamente validado.
	anterior, err := os.ReadFile(ativo)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	nome := time.Now().UTC().Format("20060102T150405.000000000Z") + ".md"
	return escreverPrivado(filepath.Join(paths.EstadosDir, "snapshots", tarefa, nome), anterior)
}

func escreverPrivado(caminho string, conteudo []byte) error {
	if err := os.MkdirAll(filepath.Dir(caminho), 0700); err != nil {
		return err
	}
	temp, err := os.CreateTemp(filepath.Dir(caminho), ".estado-*")
	if err != nil {
		return err
	}
	tempNome := temp.Name()
	defer func() { _ = os.Remove(tempNome) }()
	if err := temp.Chmod(0600); err != nil {
		_ = temp.Close()
		return err
	}
	if _, err := temp.Write(conteudo); err != nil {
		_ = temp.Close()
		return err
	}
	if err := temp.Close(); err != nil {
		return err
	}
	return os.Rename(tempNome, caminho)
}

func montarEstadoTarefa(tarefa string, campos map[string]string, contexto, reaberturas int, agora time.Time) string {
	secao := func(titulo, valor string) string {
		if valor == "" {
			valor = "Nenhum registro informado."
		}
		return fmt.Sprintf("## %s\n%s\n\n", titulo, valor)
	}
	return fmt.Sprintf("# Estado compacto — %s\n\n- **Atualizado em:** %s\n- **Agente responsável:** %s\n- **Status:** %s\n- **Contexto enviado nesta rodada:** %d caracteres\n- **Reaberturas:** %d\n\n%s%s%s%s%s",
		tarefa, agora.Format(time.RFC3339), campos["agente"], campos["status"], contexto, reaberturas,
		secao("Objetivo", campos["objetivo"]), secao("Resumo decisório", campos["resumo"]),
		secao("Decisões", campos["decisoes"]), secao("Arquivos e evidências", campos["arquivos"]),
		secao("Validação e pendências", strings.TrimSpace(campos["testes"]+"\n\nPendências: "+campos["pendencias"])))
}

func metricasFluxo(paths *config.Paths) (string, error) {
	ativas, err := os.ReadDir(filepath.Join(paths.EstadosDir, "ativas"))
	if os.IsNotExist(err) {
		return "Ainda não há estados de tarefa. Crie o primeiro com nexus_salvar_estado_tarefa.", nil
	}
	if err != nil {
		return "", err
	}
	tarefas := make([]string, 0, len(ativas))
	snapshots := 0
	for _, entrada := range ativas {
		if entrada.IsDir() || filepath.Ext(entrada.Name()) != ".md" {
			continue
		}
		tarefa := strings.TrimSuffix(entrada.Name(), ".md")
		tarefas = append(tarefas, tarefa)
		historico, err := os.ReadDir(filepath.Join(paths.EstadosDir, "snapshots", tarefa))
		if err == nil {
			snapshots += len(historico)
		}
	}
	sort.Strings(tarefas)
	return fmt.Sprintf("# Métricas de fluxo do Nexus\n\n- **Tarefas ativas:** %d\n- **Snapshots versionados:** %d\n- **Tarefas:** %s\n\nUse os campos contexto_caracteres e reaberturas em cada atualização para acompanhar eficiência e retrabalho.", len(tarefas), snapshots, strings.Join(tarefas, ", ")), nil
}
