// Package tools implementa a engenharia reversa visual e scaffold de componentes UI estilo Vision Models.
package tools

import (
	"context"
	"fmt"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// RegistrarToolVisaoUI adiciona o analisador e scaffold de interfaces visuais para Angular 21+
func RegistrarToolVisaoUI(s *server.MCPServer) {
	toolVisao := mcp.NewTool("nexus_engenharia_reversa_ui",
		mcp.WithDescription("Engenharia reversa visual de interfaces (estilo Vision Models). Decompõe capturas de tela e descrições de layouts em tokens de design, hierarquia espacial e scaffold de componentes Angular 21+ Standalone (Signals, @if/@for)."),
		mcp.WithString("descricao_visual", mcp.Required(), mcp.Description("Descrição detalhada da tela ou imagem (elementos, cores predominantes, cartões, formulários, botões e alinhamentos)")),
		mcp.WithString("tipo_componente", mcp.Description("Tipo de interface: 'landing_page', 'dashboard', 'formulario', 'card_grid', 'navbar' ou 'ecommerce' (padrão: 'card_grid')")),
		mcp.WithString("nome_componente", mcp.Description("Nome em PascalCase para o componente (ex: 'PlanoAssinaturaCard', 'HeroBanner') (padrão: 'NexusUiComponent')")),
	)

	s.AddTool(toolVisao, func(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		desc, err := request.RequireString("descricao_visual")
		if err != nil {
			return mcp.NewToolResultError("O parâmetro 'descricao_visual' é obrigatório."), nil
		}

		tipo := strings.ToLower(strings.TrimSpace(request.GetString("tipo_componente", "card_grid")))
		if tipo == "" {
			tipo = "card_grid"
		}

		nome := strings.TrimSpace(request.GetString("nome_componente", "NexusUiComponent"))
		if nome == "" {
			nome = "NexusUiComponent"
		}
		// Garante PascalCase básico
		nome = strings.ToUpper(nome[:1]) + nome[1:]

		scaffold := gerarScaffoldAngular(desc, tipo, nome)
		return mcp.NewToolResultText(scaffold), nil
	})
}

func gerarScaffoldAngular(descricao, tipo, nome string) string {
	d := strings.ToLower(descricao)

	// Extração inteligente de tokens de design
	corPrimaria := "#2563eb" // Azul royal padrão moderno
	corFundo := "#0f172a"    // Slate escuro moderno
	if strings.Contains(d, "roxo") || strings.Contains(d, "púrpura") || strings.Contains(d, "violeta") {
		corPrimaria = "#7c3aed"
	} else if strings.Contains(d, "verde") || strings.Contains(d, "esmeralda") {
		corPrimaria = "#059669"
	} else if strings.Contains(d, "laranja") || strings.Contains(d, "dourado") {
		corPrimaria = "#d97706"
	} else if strings.Contains(d, "vermelho") {
		corPrimaria = "#dc2626"
	}

	if strings.Contains(d, "claro") || strings.Contains(d, "branco") || strings.Contains(d, "clean") {
		corFundo = "#f8fafc"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("# 🎨 Engenharia Reversa Visual — Componente `%s`\n\n", nome))
	sb.WriteString(fmt.Sprintf("- **Categoria de UI:** `%s`\n", tipo))
	sb.WriteString("- **Arquitetura Gerada:** Angular 21+ Standalone Component (Signals Reativos, Sem NgModules)\n")
	sb.WriteString(fmt.Sprintf("- **Tokens Extraídos:** Cor Primária: `%s` | Superfície: `%s`\n\n", corPrimaria, corFundo))

	sb.WriteString("### 🧩 Hierarquia Espacial & Árvore de Elementos:\n")
	sb.WriteString("1. **Container Principal (Root View):** Layout responsivo flex/grid com padding adaptativo.\n")
	sb.WriteString("2. **Cabeçalho Visual (Header / Hero):** Tipografia semântica, contraste WCAG AA+ e badge de status.\n")
	sb.WriteString("3. **Área de Ação / Conteúdo Interativo:** Cards dinâmicos gerenciados por Signals.\n")
	sb.WriteString("4. **Barra de Fechamento / CTA:** Botão primário com estados de foco, hover e carregamento.\n\n")

	sb.WriteString("### 💻 Código TypeScript — Angular 21 Standalone:\n```typescript\n")
	sb.WriteString(fmt.Sprintf(`import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-%s',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './%s.component.html',
  styleUrls: ['./%s.component.css']
})
export class %s {
  // Estado Reativo com Angular Signals
  readonly estaCarregando = signal<boolean>(false);
  readonly itens = signal<Array<{ id: number; titulo: string; ativo: boolean }>>([
    { id: 1, titulo: 'Item de Destaque 1', ativo: true },
    { id: 2, titulo: 'Item de Destaque 2', ativo: false }
  ]);

  // Sinal Derivado
  readonly totalAtivos = computed(() => this.itens().filter(i => i.ativo).length);

  alternarItem(id: number): void {
    this.itens.update(lista =>
      lista.map(item => item.id === id ? { ...item, ativo: !item.ativo } : item)
    );
  }
}
`, toKebabCase(nome), toKebabCase(nome), toKebabCase(nome), nome))
	sb.WriteString("```\n\n")

	sb.WriteString("### 📄 Template HTML Moderno (Controle de Fluxo Nativo):\n```html\n")
	sb.WriteString(fmt.Sprintf(`<section class="nexus-ui-container">
  <header class="nexus-ui-header">
    <h2 class="nexus-ui-title">%s</h2>
    <span class="nexus-badge">Total Ativo: {{ totalAtivos() }}</span>
  </header>

  <div class="nexus-ui-grid">
    @for (item of itens(); track item.id) {
      <article class="nexus-card" [class.ativo]="item.ativo">
        <h3>{{ item.titulo }}</h3>
        <button type="button" class="nexus-btn-toggle" (click)="alternarItem(item.id)">
          {{ item.ativo ? 'Desativar' : 'Ativar' }}
        </button>
      </article>
    } @empty {
      <p class="nexus-empty">Nenhum elemento encontrado na visão.</p>
    }
  </div>

  @if (estaCarregando()) {
    <div class="nexus-spinner">Processando...</div>
  }
</section>
`, nome))
	sb.WriteString("```\n\n")

	sb.WriteString("### 🎨 Estilos CSS Modernos com Variáveis de Design:\n```css\n")
	sb.WriteString(fmt.Sprintf(`:host {
  display: block;
  --nexus-primary: %s;
  --nexus-bg: %s;
  --nexus-radius: 12px;
  --nexus-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.nexus-ui-container {
  background-color: var(--nexus-bg);
  border-radius: var(--nexus-radius);
  padding: 1.5rem;
  box-shadow: var(--nexus-shadow);
}

.nexus-ui-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.nexus-ui-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--nexus-primary);
}

.nexus-ui-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.nexus-card {
  padding: 1rem;
  border-radius: calc(var(--nexus-radius) - 4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.nexus-card.ativo {
  border-color: var(--nexus-primary);
}

.nexus-btn-toggle {
  margin-top: 0.75rem;
  background-color: var(--nexus-primary);
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
`, corPrimaria, corFundo))
	sb.WriteString("```\n")

	return sb.String()
}

func toKebabCase(s string) string {
	var sb strings.Builder
	for i, r := range s {
		if r >= 'A' && r <= 'Z' {
			if i > 0 {
				sb.WriteByte('-')
			}
			sb.WriteRune(r + 32)
		} else {
			sb.WriteRune(r)
		}
	}
	return sb.String()
}
