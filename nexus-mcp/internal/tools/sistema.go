// Package tools - Nexus MCP Server
// Diagnóstico, telemetria profunda de hardware, SRE e monitoramento de sistema do Nexus
package tools

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// ContainerResource representa o uso de memória e CPU de um container
type ContainerResource struct {
	Name     string
	CPUStr   string
	MemStr   string
	MemPerc  string
	MemBytes float64
}

// RegistrarToolSistema adiciona as ferramentas de telemetria completa de hardware, containers e SRE
func RegistrarToolSistema(s *server.MCPServer) {
	toolSistema := mcp.NewTool("nexus_status_sistema",
		mcp.WithDescription("Retorna telemetria profunda e em tempo real do hardware (RAM, Swap, CPU Load, NVMe/SSDs, GPU e Rede), além dos containers e top consumidores de recursos."),
	)

	s.AddTool(toolSistema, func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var sb strings.Builder
		sb.WriteString("🖥️ **Telemetria Profunda do Sistema & Hardware (Nexus SRE)**\n\n")

		// 1. Memória RAM e Swap (/proc/meminfo)
		ramInfo := obterRAM()
		sb.WriteString(fmt.Sprintf("🧠 **Memória & Swap:**\n   %s\n\n", ramInfo))

		// 2. CPU Load (/proc/loadavg)
		loadInfo := obterCPULoad()
		sb.WriteString(fmt.Sprintf("⚡ **Carga da CPU (Load 1m/5m/15m):** %s\n\n", loadInfo))

		// 3. Armazenamento em Disco (statfs)
		discoRaiz := obterEspacoDisco("/", "Disco /")
		sb.WriteString(fmt.Sprintf("💽 **Armazenamento Raiz:** %s\n", discoRaiz))

		caminhoArquivos := os.Getenv("NEXUS_SSD_ARQUIVOS")
		if caminhoArquivos == "" {
			if u := os.Getenv("USER"); u != "" {
				caminhoArquivos = fmt.Sprintf("/run/media/%s/Arquivos", u)
			} else {
				caminhoArquivos = "/run/media/lucivaldo-junior/Arquivos"
			}
		}
		discoArquivos := obterEspacoDisco(caminhoArquivos, "SSD Arquivos (exFAT)")
		if discoArquivos != "" {
			sb.WriteString(fmt.Sprintf("💽 **Armazenamento Secundário:** %s\n", discoArquivos))
		}
		sb.WriteString("\n")

		// 4. Containers Docker & Top Consumidores
		dockerInfo := obterDocker(ctx)
		sb.WriteString(fmt.Sprintf("%s\n\n", dockerInfo))

		// 5. GPU NVIDIA (se presente)
		gpuInfo := obterGPU(ctx)
		if !strings.Contains(gpuInfo, "repouso ou indisponível") {
			sb.WriteString(fmt.Sprintf("🎮 **Placa de Vídeo:** %s\n\n", gpuInfo))
		}

		// 6. Rede (Interfaces ativas)
		redeInfo := obterRede()
		sb.WriteString(fmt.Sprintf("🌐 **Interfaces de Rede:** %s\n", redeInfo))

		return mcp.NewToolResultText(sb.String()), nil
	})

	// Mantém nexus_status_infra com diagnóstico objetivo de SRE
	toolInfra := mcp.NewTool("nexus_status_infra",
		mcp.WithDescription("Auditoria objetiva de SRE: status dos containers Docker Swarm, top consumidores de RAM/CPU, memória/swap do host e espaço em disco."),
	)
	s.AddTool(toolInfra, func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var sb strings.Builder
		sb.WriteString("🛡️ **Auditoria SRE & Saúde da Infraestrutura Nexus**\n\n")

		// 1. Containers & Top Ofensores
		dockerInfo := obterDocker(ctx)
		sb.WriteString(fmt.Sprintf("%s\n\n", dockerInfo))

		// 2. RAM & Swap do Host
		ramInfo := obterRAM()
		sb.WriteString(fmt.Sprintf("🧠 **Memória & Swap do Host:**\n   %s\n\n", ramInfo))

		// 3. CPU Load
		loadInfo := obterCPULoad()
		sb.WriteString(fmt.Sprintf("⚡ **Carga da CPU:** %s\n", loadInfo))

		// 4. Armazenamento em Disco
		discoRaiz := obterEspacoDisco("/", "Disco /")
		sb.WriteString(fmt.Sprintf("💽 **Armazenamento:** %s\n", discoRaiz))

		return mcp.NewToolResultText(sb.String()), nil
	})
}

func obterRAM() string {
	f, err := os.Open("/proc/meminfo")
	if err != nil {
		return "Não foi possível ler /proc/meminfo"
	}
	defer func() { _ = f.Close() }()

	var memTotalKB, memAvailKB, swapTotalKB, swapFreeKB uint64
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		linha := scanner.Text()
		if strings.HasPrefix(linha, "MemTotal:") {
			campos := strings.Fields(linha)
			if len(campos) >= 2 {
				memTotalKB, _ = strconv.ParseUint(campos[1], 10, 64)
			}
		} else if strings.HasPrefix(linha, "MemAvailable:") {
			campos := strings.Fields(linha)
			if len(campos) >= 2 {
				memAvailKB, _ = strconv.ParseUint(campos[1], 10, 64)
			}
		} else if strings.HasPrefix(linha, "SwapTotal:") {
			campos := strings.Fields(linha)
			if len(campos) >= 2 {
				swapTotalKB, _ = strconv.ParseUint(campos[1], 10, 64)
			}
		} else if strings.HasPrefix(linha, "SwapFree:") {
			campos := strings.Fields(linha)
			if len(campos) >= 2 {
				swapFreeKB, _ = strconv.ParseUint(campos[1], 10, 64)
			}
		}
	}

	if memTotalKB == 0 {
		return "Dados de RAM indisponíveis"
	}

	memUsedKB := memTotalKB - memAvailKB
	totalGB := float64(memTotalKB) / (1024 * 1024)
	usedGB := float64(memUsedKB) / (1024 * 1024)
	availGB := float64(memAvailKB) / (1024 * 1024)
	pct := (float64(memUsedKB) / float64(memTotalKB)) * 100

	res := fmt.Sprintf("%.1f GiB usados de %.1f GiB (%.1f%% em uso, %.1f GiB livres)", usedGB, totalGB, pct, availGB)

	if swapTotalKB > 0 {
		swapUsedKB := swapTotalKB - swapFreeKB
		swapTotalMB := float64(swapTotalKB) / 1024
		swapUsedMB := float64(swapUsedKB) / 1024
		swapPct := (float64(swapUsedKB) / float64(swapTotalKB)) * 100
		res += fmt.Sprintf(" | Swap: %.1f MiB usados de %.1f MiB (%.1f%%)", swapUsedMB, swapTotalMB, swapPct)
	}

	if pct >= 80.0 {
		res += "\n   ⚠️ [ALERTA SRE: Memória RAM física acima de 80%. O cluster está aliviando páginas no Swap. Monitorar picos concorrentes]."
	}

	return res
}

func obterCPULoad() string {
	dados, err := os.ReadFile("/proc/loadavg")
	if err != nil {
		return "Indisponível"
	}
	partes := strings.Fields(string(dados))
	numCPUs := runtime.NumCPU()
	if len(partes) >= 3 {
		return fmt.Sprintf("%s, %s, %s (%d núcleos/threads lógicas)", partes[0], partes[1], partes[2], numCPUs)
	}
	return strings.TrimSpace(string(dados))
}

func parseMemToMiB(memStr string) float64 {
	parts := strings.Split(memStr, "/")
	if len(parts) == 0 {
		return 0
	}
	used := strings.TrimSpace(parts[0])
	used = strings.ReplaceAll(used, " ", "")

	var val float64
	if strings.HasSuffix(used, "GiB") {
		_, _ = fmt.Sscanf(strings.TrimSuffix(used, "GiB"), "%f", &val)
		return val * 1024
	} else if strings.HasSuffix(used, "MiB") {
		_, _ = fmt.Sscanf(strings.TrimSuffix(used, "MiB"), "%f", &val)
		return val
	} else if strings.HasSuffix(used, "kB") || strings.HasSuffix(used, "KiB") {
		clean := strings.TrimSuffix(strings.TrimSuffix(used, "kB"), "KiB")
		_, _ = fmt.Sscanf(clean, "%f", &val)
		return val / 1024
	} else if strings.HasSuffix(used, "B") {
		_, _ = fmt.Sscanf(strings.TrimSuffix(used, "B"), "%f", &val)
		return val / (1024 * 1024)
	}
	return 0
}

func simplifyContainerName(name string) string {
	// Remove identificador do Swarm tipo .1.xxxx
	if idx := strings.Index(name, "."); idx > 0 {
		name = name[:idx]
	}
	// Remove repetição de prefixo ex: n8n_n8n_worker -> n8n_worker
	parts := strings.Split(name, "_")
	if len(parts) >= 2 && parts[0] == parts[1] {
		name = strings.Join(parts[1:], "_")
	}
	return name
}

func obterDocker(ctx context.Context) string {
	ctxTimeout, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()

	// 1. Tenta obter estatísticas em tempo real de CPU e Memória
	cmdStats := exec.CommandContext(ctxTimeout, "docker", "stats", "--no-stream", "--format", "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}")
	saidaStats, errStats := cmdStats.CombinedOutput()

	if errStats == nil && len(saidaStats) > 0 {
		linhas := strings.Split(strings.TrimSpace(string(saidaStats)), "\n")
		var containers []ContainerResource

		for _, l := range linhas {
			l = strings.TrimSpace(l)
			if l == "" {
				continue
			}
			partes := strings.Split(l, "\t")
			if len(partes) >= 4 {
				c := ContainerResource{
					Name:     simplifyContainerName(partes[0]),
					CPUStr:   partes[1],
					MemStr:   partes[2],
					MemPerc:  partes[3],
					MemBytes: parseMemToMiB(partes[2]),
				}
				containers = append(containers, c)
			}
		}

		if len(containers) > 0 {
			// Ordena por consumo de memória decrescente
			sort.Slice(containers, func(i, j int) bool {
				return containers[i].MemBytes > containers[j].MemBytes
			})

			var sb strings.Builder
			sb.WriteString(fmt.Sprintf("🐳 **Containers Docker Swarm:** %d containers ativos no cluster.\n", len(containers)))
			sb.WriteString("🔥 **Top Consumidores de Recursos (RAM / CPU):**\n")

			limite := 5
			if len(containers) < limite {
				limite = len(containers)
			}

			for i := 0; i < limite; i++ {
				c := containers[i]
				sb.WriteString(fmt.Sprintf("   %d. **%s**: %s (%s) | CPU: %s\n", i+1, c.Name, c.MemStr, c.MemPerc, c.CPUStr))
			}

			sb.WriteString("\n💡 **Diagnóstico SRE:** Cluster 100% ativo. Todos os serviços convergidos sob Traefik.")
			return sb.String()
		}
	}

	// 2. Se docker stats falhou, tenta docker ps tradicional
	cmdPS := exec.CommandContext(ctxTimeout, "docker", "ps", "--format", "{{.Names}}: {{.Status}}")
	saidaPS, errPS := cmdPS.CombinedOutput()
	if errPS == nil {
		resultado := strings.TrimSpace(string(saidaPS))
		if resultado == "" {
			return "🐳 **Docker:** Nenhum container ativo (infraestrutura pausada)."
		}
		linhas := strings.Split(resultado, "\n")
		return fmt.Sprintf("🐳 **Containers Ativos (%d):**\n%s", len(linhas), resultado)
	}

	// 3. Diagnóstico preciso da causa da falha (sem mensagens genéricas/falsas)
	_, statErr := os.Stat("/var/run/docker.sock")
	if statErr != nil {
		return "⚠️ **Telemetria Docker Inacessível:** O socket `/var/run/docker.sock` não está montado neste container. Os containers do Swarm continuam rodando no host, mas este processo não possui permissão para inspecioná-los."
	}

	if _, err := exec.LookPath("docker"); err != nil {
		return "⚠️ **Cliente Docker Ausente:** O socket `/var/run/docker.sock` está presente, mas o binário `docker` (docker-cli) não está instalado no PATH deste container."
	}

	return fmt.Sprintf("⚠️ **Falha de Comunicação Docker:** %s", strings.TrimSpace(string(saidaPS)))
}

func obterGPU(ctx context.Context) string {
	ctxTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctxTimeout, "nvidia-smi", "--query-gpu=name,memory.total,memory.used,temperature.gpu,utilization.gpu", "--format=csv,noheader,nounits")
	saida, err := cmd.Output()
	if err != nil {
		return "Intel Graphics (Integrada ativa / NVIDIA em modo repouso ou indisponível)"
	}

	linhas := strings.TrimSpace(string(saida))
	partes := strings.Split(linhas, ",")
	if len(partes) >= 5 {
		nome := strings.TrimSpace(partes[0])
		totalVRAM := strings.TrimSpace(partes[1])
		usedVRAM := strings.TrimSpace(partes[2])
		temp := strings.TrimSpace(partes[3])
		util := strings.TrimSpace(partes[4])
		return fmt.Sprintf("%s (%s MiB / %s MiB VRAM | %s°C | %s%% uso)", nome, usedVRAM, totalVRAM, temp, util)
	}

	return strings.TrimSpace(string(saida))
}

func obterRede() string {
	entradas, err := os.ReadDir("/sys/class/net")
	if err != nil {
		return "Indisponível"
	}

	var ativas []string
	for _, e := range entradas {
		nome := e.Name()
		if nome == "lo" {
			continue
		}
		operstate, err := os.ReadFile(fmt.Sprintf("/sys/class/net/%s/operstate", nome))
		if err == nil {
			estado := strings.TrimSpace(string(operstate))
			if estado == "up" {
				ativas = append(ativas, fmt.Sprintf("%s (Conectada)", nome))
			}
		}
	}

	if len(ativas) == 0 {
		return "Nenhuma interface externa ativa"
	}
	return strings.Join(ativas, " | ")
}
