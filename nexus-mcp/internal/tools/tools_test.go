package tools_test

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/luci-jr/nexus-mcp/internal/config"
	"github.com/luci-jr/nexus-mcp/internal/tools"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func TestToolsMemoria(t *testing.T) {
	tempDir := t.TempDir()
	memoriaFile := filepath.Join(tempDir, "memoria_teste.md")
	if err := os.WriteFile(memoriaFile, []byte("# Memoria Teste\n- Item inicial"), 0644); err != nil {
		t.Fatalf("Falha ao criar arquivo de teste: %v", err)
	}

	paths := &config.Paths{
		MemoriaPath: memoriaFile,
	}

	s := server.NewMCPServer("test-server", "1.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolsMemoria(s, paths)

	ctx := context.Background()

	// 1. Teste de Leitura
	toolObter := s.GetTool("nexus_obter_memoria")
	if toolObter == nil {
		t.Fatalf("Tool nexus_obter_memoria não foi registrada")
	}

	reqLeitura := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_obter_memoria",
		},
	}
	resLeitura, err := toolObter.Handler(ctx, reqLeitura)
	if err != nil {
		t.Fatalf("Erro ao chamar nexus_obter_memoria: %v", err)
	}
	if resLeitura.IsError {
		t.Fatalf("Tool retornou erro: %v", resLeitura.Content)
	}

	// 2. Teste de Escrita / Append
	toolRegistrar := s.GetTool("nexus_registrar_aprendizado")
	if toolRegistrar == nil {
		t.Fatalf("Tool nexus_registrar_aprendizado não foi registrada")
	}

	reqEscrita := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_registrar_aprendizado",
			Arguments: map[string]any{
				"entrada": "Teste de aprendizado unitário em Go",
			},
		},
	}
	resEscrita, err := toolRegistrar.Handler(ctx, reqEscrita)
	if err != nil {
		t.Fatalf("Erro ao chamar nexus_registrar_aprendizado: %v", err)
	}
	if resEscrita.IsError {
		t.Fatalf("Tool de escrita retornou erro: %v", resEscrita.Content)
	}

	// Verifica se foi gravado no disco
	conteudoAtualizado, err := os.ReadFile(memoriaFile)
	if err != nil {
		t.Fatalf("Erro ao reler arquivo de memória: %v", err)
	}
	if !strings.Contains(string(conteudoAtualizado), "Teste de aprendizado unitário em Go") {
		t.Errorf("Esperava que o arquivo contivesse a nova entrada, obteve:\n%s", string(conteudoAtualizado))
	}
	// 3. Teste de Validação: Entrada Vazia deve falhar
	reqVazia := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_registrar_aprendizado",
			Arguments: map[string]any{
				"entrada": "   ",
			},
		},
	}
	resVazia, err := toolRegistrar.Handler(ctx, reqVazia)
	if err != nil {
		t.Fatalf("Erro inesperado ao chamar entrada vazia: %v", err)
	}
	if !resVazia.IsError {
		t.Errorf("Esperava erro ao passar entrada vazia!")
	}

	// 4. Teste de Validação: Entrada > 1000 caracteres deve ser rejeitada (Context Poisoning)
	entradaGigante := strings.Repeat("A", 1001)
	reqGigante := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_registrar_aprendizado",
			Arguments: map[string]any{
				"entrada": entradaGigante,
			},
		},
	}
	resGigante, err := toolRegistrar.Handler(ctx, reqGigante)
	if err != nil {
		t.Fatalf("Erro inesperado ao chamar entrada gigante: %v", err)
	}
	if !resGigante.IsError {
		t.Errorf("Esperava erro ao passar entrada acima de 1.000 caracteres!")
	}

	// 5. Teste de Leitura Modular (ADR 0003)
	modularDir := filepath.Join(tempDir, "memoria")
	_ = os.MkdirAll(modularDir, 0750)
	stackFile := filepath.Join(modularDir, "01_stack_e_arquitetura.md")
	_ = os.WriteFile(stackFile, []byte("# Stack & Arquitetura\nJava 21 e Go"), 0600)
	paths.MemoriaModularDir = modularDir

	reqModular := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_obter_memoria",
			Arguments: map[string]any{"secao": "arquitetura"},
		},
	}
	resModular, err := toolObter.Handler(ctx, reqModular)
	if err != nil || resModular.IsError {
		t.Fatalf("Erro ao ler secao modular: %v", err)
	}
	if !strings.Contains(fmt.Sprint(resModular.Content), "Java 21 e Go") {
		t.Errorf("Esperava conteudo modular, obteve:\n%s", fmt.Sprint(resModular.Content))
	}

	// 6. Teste de Bloqueio de Senhas em nexus_registrar_aprendizado
	reqSenha := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_registrar_aprendizado",
			Arguments: map[string]any{"entrada": "api_key: secret-token-12345"},
		},
	}
	resSenha, err := toolRegistrar.Handler(ctx, reqSenha)
	if err != nil || !resSenha.IsError {
		t.Errorf("Esperava rejeição para entrada contendo credenciais")
	}

	// 5. Teste de Sanitização de Quebras de Linha
	reqQuebras := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_registrar_aprendizado",
			Arguments: map[string]any{
				"entrada": "Linha 1\nLinha 2\r\nLinha 3",
			},
		},
	}
	resQuebras, err := toolRegistrar.Handler(ctx, reqQuebras)
	if err != nil || resQuebras.IsError {
		t.Fatalf("Falha ao registrar entrada com quebras de linha sanitizadas: %v", err)
	}
	conteudoSanitizado, _ := os.ReadFile(memoriaFile)
	if strings.Contains(string(conteudoSanitizado), "Linha 1\nLinha 2") {
		t.Errorf("As quebras de linha deveriam ter sido sanitizadas para espaços!")
	}
}

func TestToolsReferencias(t *testing.T) {
	tempDir := t.TempDir()
	contratosDir := filepath.Join(tempDir, "contratos")
	if err := os.MkdirAll(contratosDir, 0755); err != nil {
		t.Fatalf("Falha ao criar pasta de contratos: %v", err)
	}

	contratoFile := filepath.Join(contratosDir, "minuta_pj.md")
	if err := os.WriteFile(contratoFile, []byte("# Contrato PJ Teste"), 0644); err != nil {
		t.Fatalf("Falha ao criar arquivo de referência: %v", err)
	}

	paths := &config.Paths{
		ReferenciasDir: tempDir,
	}

	s := server.NewMCPServer("test-server", "1.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolReferencias(s, paths)

	ctx := context.Background()
	toolRef := s.GetTool("nexus_consultar_referencia")
	if toolRef == nil {
		t.Fatalf("Tool nexus_consultar_referencia não foi registrada")
	}

	// 1. Teste de Listagem
	reqListar := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_consultar_referencia",
		},
	}
	resListar, err := toolRef.Handler(ctx, reqListar)
	if err != nil {
		t.Fatalf("Erro ao listar referências: %v", err)
	}
	if resListar.IsError {
		t.Fatalf("Tool retornou erro ao listar: %v", resListar.Content)
	}

	// 2. Teste de Leitura de Documento
	reqLer := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_consultar_referencia",
			Arguments: map[string]any{
				"categoria": "contratos",
				"arquivo":   "minuta_pj.md",
			},
		},
	}
	resLer, err := toolRef.Handler(ctx, reqLer)
	if err != nil {
		t.Fatalf("Erro ao ler documento de referência: %v", err)
	}
	if resLer.IsError {
		t.Fatalf("Tool retornou erro ao ler: %v", resLer.Content)
	}

	// 3. Teste de Proteção contra Path Traversal (Tentativa de invadir fora da pasta)
	reqInvasao := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_consultar_referencia",
			Arguments: map[string]any{
				"arquivo": "../../etc/passwd",
			},
		},
	}
	resInvasao, err := toolRef.Handler(ctx, reqInvasao)
	if err != nil {
		t.Fatalf("Erro inesperado: %v", err)
	}
	if !resInvasao.IsError {
		t.Errorf("Esperava que a tentativa de Path Traversal retornasse erro de segurança!")
	}

	// 4. Teste de Proteção contra Extensão Não Autorizada
	scriptFile := filepath.Join(contratosDir, "malicious.sh")
	_ = os.WriteFile(scriptFile, []byte("rm -rf /"), 0644)
	reqExt := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_consultar_referencia",
			Arguments: map[string]any{
				"categoria": "contratos",
				"arquivo":   "malicious.sh",
			},
		},
	}
	resExt, err := toolRef.Handler(ctx, reqExt)
	if err != nil {
		t.Fatalf("Erro inesperado: %v", err)
	}
	if !resExt.IsError {
		t.Errorf("Esperava que extensão .sh fosse rejeitada pela lista branca de segurança!")
	}
}

func TestToolsNovas(t *testing.T) {
	tempDir := t.TempDir()
	memoriaFile := filepath.Join(tempDir, "memoria.md")
	_ = os.WriteFile(memoriaFile, []byte("## 1. Perfil\n- Dev Back-end Java e Go\n## 5. Histórico\n- **[2026-09-26]**: Teste com Pitfall e Go"), 0644)

	cvDir := filepath.Join(tempDir, "cv")
	_ = os.MkdirAll(cvDir, 0755)
	_ = os.WriteFile(filepath.Join(cvDir, "CV - Lucivaldo 2026 - Java.pdf"), []byte("%PDF-1.4 mock"), 0644)

	relatoriosDir := filepath.Join(tempDir, "relatorios")
	_ = os.MkdirAll(relatoriosDir, 0755)

	paths := &config.Paths{
		MemoriaPath:   memoriaFile,
		CVDir:         cvDir,
		RelatoriosDir: relatoriosDir,
	}

	s := server.NewMCPServer("test-server", "3.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolsMemoria(s, paths)
	tools.RegistrarToolSistema(s)
	tools.RegistrarToolsCarreira(s, paths)
	tools.RegistrarToolRelatorios(s, paths)

	ctx := context.Background()

	// 1. Teste de Busca na Memória
	toolBuscar := s.GetTool("nexus_buscar_memoria")
	if toolBuscar == nil {
		t.Fatalf("Tool nexus_buscar_memoria não foi registrada")
	}
	resBusca, err := toolBuscar.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_buscar_memoria",
			Arguments: map[string]any{
				"termo": "Pitfall",
			},
		},
	})
	if err != nil || resBusca.IsError {
		t.Fatalf("Erro na busca de memória: %v", err)
	}

	// 2. Teste de Status do Sistema
	toolSys := s.GetTool("nexus_status_sistema")
	if toolSys == nil {
		t.Fatalf("Tool nexus_status_sistema não foi registrada")
	}
	resSys, err := toolSys.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{Name: "nexus_status_sistema"},
	})
	if err != nil || resSys.IsError {
		t.Fatalf("Erro ao chamar nexus_status_sistema: %v", err)
	}

	// 3. Teste de Listagem de CVs
	toolCV := s.GetTool("nexus_listar_cvs")
	if toolCV == nil {
		t.Fatalf("Tool nexus_listar_cvs não foi registrada")
	}
	resCV, err := toolCV.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{Name: "nexus_listar_cvs"},
	})
	if err != nil || resCV.IsError {
		t.Fatalf("Erro ao listar CVs: %v", err)
	}

	// 4. Teste de Análise de Vaga PERF
	toolFit := s.GetTool("nexus_analisar_fit_vaga")
	if toolFit == nil {
		t.Fatalf("Tool nexus_analisar_fit_vaga não foi registrada")
	}
	resFit, err := toolFit.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_analisar_fit_vaga",
			Arguments: map[string]any{
				"descricao_vaga": "Buscamos Desenvolvedor Java com Spring Boot, Docker e AWS",
			},
		},
	})
	if err != nil || resFit.IsError {
		t.Fatalf("Erro ao analisar fit de vaga: %v", err)
	}

	// 5. Teste de Salvar Relatório
	toolRel := s.GetTool("nexus_salvar_relatorio")
	if toolRel == nil {
		t.Fatalf("Tool nexus_salvar_relatorio não foi registrada")
	}
	resRel, err := toolRel.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_salvar_relatorio",
			Arguments: map[string]any{
				"tipo":     "lucy",
				"titulo":   "teste_sprint_mcp",
				"conteudo": "Relatório de teste unitário",
			},
		},
	})
	if err != nil || resRel.IsError {
		t.Fatalf("Erro ao salvar relatório: %v", err)
	}

	// 6. Suporte, BI e FinOps devem manter a autoria correta no destino.
	for _, tipo := range []string{"suporte", "bi", "finops"} {
		res, err := toolRel.Handler(ctx, mcp.CallToolRequest{
			Params: mcp.CallToolParams{
				Name: "nexus_salvar_relatorio",
				Arguments: map[string]any{
					"tipo":     tipo,
					"titulo":   "teste_tipo_" + tipo,
					"conteudo": "Relatório de teste unitário",
				},
			},
		})
		if err != nil || res.IsError {
			t.Fatalf("Erro ao salvar relatório do tipo %s: %v", tipo, err)
		}
		if _, err := os.Stat(filepath.Join(relatoriosDir, tipo)); err != nil {
			t.Fatalf("Esperava diretório de relatórios para %s: %v", tipo, err)
		}
	}

	// 7. Um tipo desconhecido não pode ser redirecionado silenciosamente para Lucy.
	resInvalido, err := toolRel.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_salvar_relatorio",
			Arguments: map[string]any{
				"tipo":     "invalido",
				"titulo":   "nao_deve_salvar",
				"conteudo": "Relatório de teste unitário",
			},
		},
	})
	if err != nil || !resInvalido.IsError {
		t.Fatal("Esperava erro para tipo de relatório inválido")
	}
}

func TestToolBackupExigeConfirmacao(t *testing.T) {
	paths := &config.Paths{BackupScript: "/nao-deve-ser-executado"}
	s := server.NewMCPServer("test-server", "3.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolBackup(s, paths)

	toolBackup := s.GetTool("nexus_executar_backup")
	if toolBackup == nil {
		t.Fatal("Tool nexus_executar_backup não foi registrada")
	}

	resultado, err := toolBackup.Handler(context.Background(), mcp.CallToolRequest{
		Params: mcp.CallToolParams{Name: "nexus_executar_backup"},
	})
	if err != nil {
		t.Fatalf("Erro inesperado: %v", err)
	}
	if !resultado.IsError {
		t.Error("Esperava bloqueio sem confirmar_exclusoes=true")
	}
}

func TestToolsEstadoTarefa(t *testing.T) {
	tempDir := t.TempDir()
	paths := &config.Paths{EstadosDir: filepath.Join(tempDir, "estado_tarefas")}
	s := server.NewMCPServer("test-server", "3.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolsEstadoTarefa(s, paths)

	salvar := s.GetTool("nexus_salvar_estado_tarefa")
	obter := s.GetTool("nexus_obter_estado_tarefa")
	metricas := s.GetTool("nexus_metricas_fluxo")
	if salvar == nil || obter == nil || metricas == nil {
		t.Fatal("As tools de estado da tarefa deveriam estar registradas")
	}

	argumentos := map[string]any{
		"tarefa":              "migracao-mcp",
		"objetivo":            "Migrar o MCP sem interromper os agentes.",
		"status":              "em_andamento",
		"resumo":              "Caminhos canônicos já foram definidos.",
		"decisoes":            "Usar snapshots locais em Markdown.",
		"arquivos":            "internal/tools/estado_tarefa.go",
		"testes":              "go test -race ./...: pendente",
		"pendencias":          "Validar integração com o cliente MCP.",
		"agente":              "lucy",
		"contexto_caracteres": 850,
		"reaberturas":         0,
	}
	ctx := context.Background()
	resultado, err := salvar.Handler(ctx, mcp.CallToolRequest{Params: mcp.CallToolParams{Name: "nexus_salvar_estado_tarefa", Arguments: argumentos}})
	if err != nil || resultado.IsError {
		t.Fatalf("Erro ao salvar estado: %v", err)
	}

	resultado, err = obter.Handler(ctx, mcp.CallToolRequest{Params: mcp.CallToolParams{Name: "nexus_obter_estado_tarefa", Arguments: map[string]any{"tarefa": "migracao-mcp"}}})
	if err != nil || resultado.IsError || !strings.Contains(fmt.Sprint(resultado.Content), "Caminhos canônicos") {
		t.Fatalf("Erro ao obter estado salvo: %v", err)
	}

	argumentos["status"] = "concluido"
	resultado, err = salvar.Handler(ctx, mcp.CallToolRequest{Params: mcp.CallToolParams{Name: "nexus_salvar_estado_tarefa", Arguments: argumentos}})
	if err != nil || resultado.IsError {
		t.Fatalf("Erro ao atualizar estado: %v", err)
	}

	snapshots, err := os.ReadDir(filepath.Join(paths.EstadosDir, "snapshots", "migracao-mcp"))
	if err != nil || len(snapshots) != 1 {
		t.Fatalf("Esperava um snapshot da atualização, obteve %d: %v", len(snapshots), err)
	}

	resultado, err = metricas.Handler(ctx, mcp.CallToolRequest{Params: mcp.CallToolParams{Name: "nexus_metricas_fluxo"}})
	if err != nil || resultado.IsError || !strings.Contains(fmt.Sprint(resultado.Content), "Snapshots versionados:** 1") {
		t.Fatalf("Erro ao obter métricas de fluxo: %v", err)
	}

	argumentos["tarefa"] = "../fora"
	resultado, err = salvar.Handler(ctx, mcp.CallToolRequest{Params: mcp.CallToolParams{Name: "nexus_salvar_estado_tarefa", Arguments: argumentos}})
	if err != nil || !resultado.IsError {
		t.Fatal("Esperava bloqueio para identificador com path traversal")
	}
}

func TestToolIntencao(t *testing.T) {
	s := server.NewMCPServer("test-server", "3.1.0", server.WithToolCapabilities(true))
	paths := &config.Paths{}
	tools.RegistrarToolIntencao(s, paths)

	tool := s.GetTool("nexus_rotear_intencao")
	if tool == nil {
		t.Fatal("Tool nexus_rotear_intencao não foi registrada")
	}

	ctx := context.Background()

	// 1. Teste de intenção backend (Java/Spring)
	res, err := tool.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_rotear_intencao",
			Arguments: map[string]any{"prompt": "Preciso criar uma API REST em Spring Boot com Postgres e JPA"},
		},
	})
	if err != nil || res.IsError {
		t.Fatalf("Erro ao classificar prompt: %v", err)
	}
	conteudo := fmt.Sprint(res.Content)
	if !strings.Contains(conteudo, "`backend`") {
		t.Errorf("Esperava direcionamento para 'backend', obteve:\n%s", conteudo)
	}

	// 2. Teste de intenção frontend (Angular/Signals)
	res, err = tool.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_rotear_intencao",
			Arguments: map[string]any{"prompt": "Como criar um componente Standalone com Signals no Angular 21?"},
		},
	})
	if err != nil || res.IsError {
		t.Fatalf("Erro ao classificar prompt frontend: %v", err)
	}
	if !strings.Contains(fmt.Sprint(res.Content), "`frontend`") {
		t.Errorf("Esperava direcionamento para 'frontend'")
	}

	// 3. Teste com prompt vazio (espera erro)
	resInvalido, err := tool.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{Name: "nexus_rotear_intencao", Arguments: map[string]any{}},
	})
	if err != nil || !resInvalido.IsError {
		t.Fatal("Esperava erro para prompt ausente")
	}

	// 4. Teste de Gatekeeper DoD (nexus_validar_dod)
	toolDod := s.GetTool("nexus_validar_dod")
	if toolDod == nil {
		t.Fatal("Tool nexus_validar_dod não foi registrada")
	}
	resDod, err := toolDod.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_validar_dod",
			Arguments: map[string]any{
				"objetivo":    "Criar endpoint REST; Adicionar testes unitarios; Validar cobertura",
				"entregaveis": "Endpoint REST implementado e validado com testes unitarios de alta cobertura",
			},
		},
	})
	if err != nil || resDod.IsError {
		t.Fatalf("Erro ao validar DoD: %v", err)
	}
	if !strings.Contains(fmt.Sprint(resDod.Content), "APROVADO") {
		t.Errorf("Esperava aprovação de DoD, obteve:\n%s", fmt.Sprint(resDod.Content))
	}

	// 5. Teste de SecOps Auditoria de Comando (nexus_auditar_comando)
	toolSec := s.GetTool("nexus_auditar_comando")
	if toolSec == nil {
		t.Fatal("Tool nexus_auditar_comando não foi registrada")
	}
	resSec, err := toolSec.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_auditar_comando",
			Arguments: map[string]any{
				"comando": "rm -rf /var/log/*",
			},
		},
	})
	if err != nil || resSec.IsError {
		t.Fatalf("Erro ao auditar comando SecOps: %v", err)
	}
	if !strings.Contains(fmt.Sprint(resSec.Content), "CRITICO") {
		t.Errorf("Esperava nível CRITICO para rm -rf, obteve:\n%s", fmt.Sprint(resSec.Content))
	}
}

func TestToolGrafo(t *testing.T) {
	paths := &config.Paths{
		BackupScript: "/home/user/nexus/backup_nexus.sh",
		MemoriaPath:  "/home/user/nexus/memoria_lucy.md",
		EstadosDir:   "/home/user/nexus/estados",
	}
	s := server.NewMCPServer("test-server", "3.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolGrafo(s, paths)

	tool := s.GetTool("nexus_auditar_impacto")
	if tool == nil {
		t.Fatal("Tool nexus_auditar_impacto não foi registrada")
	}

	ctx := context.Background()

	// 1. Consulta ao nó de backup
	res, err := tool.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_auditar_impacto",
			Arguments: map[string]any{"alvo": "backup_nexus.sh"},
		},
	})
	if err != nil || res.IsError {
		t.Fatalf("Erro ao consultar nó de backup: %v", err)
	}
	conteudo := fmt.Sprint(res.Content)
	if !strings.Contains(conteudo, "crontab") || !strings.Contains(conteudo, "Checklist") {
		t.Errorf("Esperava dependência de crontab e checklist no resultado:\n%s", conteudo)
	}

	// 2. Consulta à lista geral
	res, err = tool.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_auditar_impacto",
			Arguments: map[string]any{"alvo": "todos"},
		},
	})
	if err != nil || res.IsError || !strings.Contains(fmt.Sprint(res.Content), "Total de nós mapeados") {
		t.Fatalf("Erro ao consultar lista completa do grafo")
	}

	// 3. Consulta a nó inexistente (deve retornar erro)
	resInexistente, err := tool.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_auditar_impacto",
			Arguments: map[string]any{"alvo": "arquivo_fantasma.xyz"},
		},
	})
	if err != nil || !resInexistente.IsError {
		t.Fatal("Esperava erro ao buscar nó inexistente")
	}
}

func TestToolVisaoUI(t *testing.T) {
	s := server.NewMCPServer("test-server", "3.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolVisaoUI(s)

	tool := s.GetTool("nexus_engenharia_reversa_ui")
	if tool == nil {
		t.Fatal("Tool nexus_engenharia_reversa_ui não foi registrada")
	}

	ctx := context.Background()

	// 1. Geração de scaffold de UI
	res, err := tool.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_engenharia_reversa_ui",
			Arguments: map[string]any{
				"descricao_visual": "Card com fundo escuro, botões roxos destacados, grid de 3 colunas e badge ativo",
				"tipo_componente":  "card_grid",
				"nome_componente":  "PlanoDestaqueCard",
			},
		},
	})
	if err != nil || res.IsError {
		t.Fatalf("Erro ao gerar scaffold de UI: %v", err)
	}
	conteudo := fmt.Sprint(res.Content)
	if !strings.Contains(conteudo, "PlanoDestaqueCard") || !strings.Contains(conteudo, "signal<boolean>") {
		t.Errorf("Esperava componente Standalone com Signals no resultado:\n%s", conteudo)
	}
}

func TestToolsADR(t *testing.T) {
	tempDir := t.TempDir()
	adrsDir := filepath.Join(tempDir, "adrs")
	if err := os.MkdirAll(adrsDir, 0755); err != nil {
		t.Fatalf("Erro ao criar pasta temporária de ADRs: %v", err)
	}

	paths := &config.Paths{
		ADRsDir: adrsDir,
	}

	s := server.NewMCPServer("test-server", "3.0.0", server.WithToolCapabilities(true))
	tools.RegistrarToolsADR(s, paths)

	ctx := context.Background()

	toolListar := s.GetTool("nexus_listar_adrs")
	if toolListar == nil {
		t.Fatal("Tool nexus_listar_adrs não registrada")
	}

	toolGerar := s.GetTool("nexus_gerar_adr")
	if toolGerar == nil {
		t.Fatal("Tool nexus_gerar_adr não registrada")
	}

	// 1. Listar inicialmente vazio
	resListarVazio, err := toolListar.Handler(ctx, mcp.CallToolRequest{Params: mcp.CallToolParams{Name: "nexus_listar_adrs"}})
	if err != nil || resListarVazio.IsError {
		t.Fatalf("Erro ao listar ADRs vazio: %v", err)
	}

	// 2. Criar ADR 0001
	resGerar, err := toolGerar.Handler(ctx, mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "nexus_gerar_adr",
			Arguments: map[string]any{
				"numero":        1,
				"titulo":        "Decisão de Teste",
				"status":        "Aceito",
				"contexto":      "Contexto de teste unitário",
				"decisao":       "Adotar ferramenta de teste",
				"consequencias": "Cobertura aumentada",
			},
		},
	})
	if err != nil || resGerar.IsError {
		t.Fatalf("Erro ao gerar ADR: %v", err)
	}

	// 3. Listar novamente (deve conter o novo ADR)
	resListar, err := toolListar.Handler(ctx, mcp.CallToolRequest{Params: mcp.CallToolParams{Name: "nexus_listar_adrs"}})
	if err != nil || resListar.IsError {
		t.Fatalf("Erro ao listar ADRs: %v", err)
	}
	if !strings.Contains(fmt.Sprint(resListar.Content), "Decisão de Teste") {
		t.Errorf("Esperava encontrar 'Decisão de Teste' na listagem de ADRs")
	}
}
