---
name: premium-ui-landing-page
description: Especificação de Engenharia e Design System de Alta Conversão para Landing Pages e Protótipos Web Premium (Tailwind CSS 3, Google Fonts, Lucide Icons, Unsplash CDN, Carrosséis Interativos, Glassmorphism e WhatsApp CTA)
---

# 🎨 Premium UI Landing Page — Design System de Alta Conversão

Este padrão define a arquitetura, estrutura visual e boas práticas obrigatórias para a geração de landing pages, protótipos web e páginas comerciais de alto padrão (nível agência internacional / Awwwards) para o Ecossistema Nexus.

---

## 1. Stack & Fundamentos Técnicos Obrigatórios

Toda página gerada em arquivo único (`index.html`) deve ser autossuficiente e carregar via CDN oficial:

1. **Tailwind CSS 3 (Engine de Estilização):**
   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   ```
2. **Google Fonts (Tipografia de Grife):**
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
   ```
3. **Lucide Icons (Vetor SVG Nítido):**
   ```html
   <script src="https://unpkg.com/lucide@latest"></script>
   ```
   *Inicialização obrigatória antes do fechamento do `</body>`:*
   ```html
   <script>lucide.createIcons();</script>
   ```
4. **Tailwind Config Embutida:**
   ```html
   <script>
     tailwind.config = {
       darkMode: 'class',
       theme: {
         extend: {
           fontFamily: {
             sans: ['Plus Jakarta Sans', 'sans-serif'],
             display: ['Outfit', 'sans-serif']
           }
         }
       }
     }
   </script>
   ```

---

## 2. Proibições Críticas de Design

- 🚫 **TERMINANTEMENTE PROIBIDO EMOJIS COMO FOTO OU ÍCONE:** Nunca use emojis (🍕, ✂️, 💈, 🍔, ⭐) como ilustrações de produtos, cards de serviços ou marcadores de lista. Use fotos reais do Unsplash e ícones SVG da Lucide (`<i data-lucide="..."></i>`).
- 🚫 **TERMINANTEMENTE PROIBIDO CARDS VAZIOS/CINZAS:** Todo card de produto ou serviço DEVE conter uma imagem real em alta resolução com proporção consistente (`aspect-[4/3]` ou `aspect-square`, `object-cover`).
- 🚫 **TERMINANTEMENTE PROIBIDO FUNDOS BRANCOS PUROS SEM CONTRASTE:** Use fundos profundos (*Dark Mode Premium* como `bg-slate-950` ou `bg-neutral-950`) ou paletas ricas com degradês suaves e efeito de vidro (*Glassmorphism* com `backdrop-blur-xl border border-white/10`).

---

## 3. Banco de Imagens Curadas do Unsplash (Por Nicho)

Use URLs de fotos profissionais em alta definição com query params de otimização:

| Nicho | Exemplos de URLs de Imagens Curadas |
| :--- | :--- |
| **Barbearia / Barber** | `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80` |
| **Hamburgueria Artesanal** | `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80` |
| **Cafeteria / Café Gourmet** | `https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80` |
| **Pizzaria Artesanal / Forno a Lenha** | `https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80` |
| **Doceria / Confeitaria Fina** | `https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80` |
| **Academia / Crossfit / Fitness** | `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80` |
| **Estética / Salão de Beleza / Spa** | `https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80`<br>`https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80` |

---

## 4. Componente de Carrossel Interativo Padronizado

```html
<!-- Cabeçalho do Carrossel com Controles -->
<div class="flex items-end justify-between mb-8">
  <div>
    <span class="text-xs uppercase tracking-widest text-amber-500 font-semibold">Seleção Exclusiva</span>
    <h2 class="text-3xl sm:text-4xl font-extrabold font-display text-white mt-1">Destaques do Cardápio</h2>
  </div>
  <div class="flex gap-3">
    <button onclick="rolarCarrossel('esq')" class="w-11 h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white flex items-center justify-center transition">
      <i data-lucide="chevron-left" class="w-5 h-5"></i>
    </button>
    <button onclick="rolarCarrossel('dir')" class="w-11 h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white flex items-center justify-center transition">
      <i data-lucide="chevron-right" class="w-5 h-5"></i>
    </button>
  </div>
</div>

<!-- Container com Snap Horizontal -->
<div id="carousel" class="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6" style="scrollbar-width: none;">
  <!-- Card Exemplo -->
  <div class="snap-start min-w-[280px] sm:min-w-[340px] bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col justify-between hover:border-amber-500/40 hover:-translate-y-1.5 transition-all duration-300">
    <div class="relative h-48 overflow-hidden">
      <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80" alt="Produto" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
      <span class="absolute top-3 right-3 bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full">Mais Pedido</span>
    </div>
    <div class="p-6 flex flex-col flex-grow justify-between">
      <div>
        <div class="flex justify-between items-baseline mb-2">
          <h3 class="text-xl font-bold font-display text-white">Classic Trufado</h3>
          <span class="text-lg font-extrabold text-amber-400">R$ 44,90</span>
        </div>
        <p class="text-slate-400 text-sm mb-6 leading-relaxed">Blend 180g Angus, queijo cheddar inglês derretido, maionese trufada e cebola caramelizada.</p>
      </div>
      <a href="https://wa.me/5591999999999?text=Ol%C3%A1%2C%20gostaria%20de%20pedir%20o%20Classic%20Trufado" target="_blank" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-center text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/10">
        <i data-lucide="shopping-bag" class="w-4 h-4"></i> Pedir pelo WhatsApp
      </a>
    </div>
  </div>
</div>
```

---

## 5. Conversão Direta com WhatsApp Flutuante

Sempre incluir no canto inferior da página:
```html
<a href="https://wa.me/5591999999999?text=Ol%C3%A1%21%20Gostaria%20de%20fazer%20um%20pedido." target="_blank" class="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-110 group">
  <i data-lucide="message-circle" class="w-6 h-6"></i>
  <span class="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 text-sm font-bold">Fale no WhatsApp</span>
</a>
```
