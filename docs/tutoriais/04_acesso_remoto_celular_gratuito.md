# 📱 Tutorial 04: Como Acessar o Nexus no Celular Fora de Casa (100% Gratuito)

Você não precisa pagar servidores caros, ter IP fixo ou abrir portas no roteador de casa (*port forwarding*) para acessar o **Nexus Web Console** no seu celular via 4G/5G.

Neste guia, você aprenderá as **duas melhores soluções gratuitas e seguras da indústria** para conectar seu celular ao seu computador de qualquer lugar do mundo.

---

## 🏆 Opção 1: Tailscale (VPN Pessoal Segura) — *Recomendada*

O **[Tailscale](https://tailscale.com)** cria uma rede privada segura (baseada no protocolo **WireGuard**) entre o seu computador e o seu celular. É **100% gratuito** para uso pessoal (até 100 dispositivos conectados).

```text
+-----------------------+                            +-------------------------------+
|     SEU COMPUTADOR    |       Criptografia         |       SEU CELULAR (4G/5G)     |
|   Nexus Console :8090 | <════════════════════════> |     Navegador ou App PWA      |
| (Tailscale: 100.x.y.z)|     WireGuard Ponta-a-Ponta| (Tailscale: http://nexus:8090)|
+-----------------------+                            +-------------------------------+
```

### Passo a Passo no Computador (Linux):

1. **Instale o Tailscale com um comando no terminal:**
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   ```

2. **Inicie e autentique:**
   ```bash
   sudo tailscale up
   ```
   *O terminal exibirá um link. Abra-o no navegador e faça login com sua conta do Google, GitHub ou Microsoft.*

3. **Verifique o nome e IP seguro da sua máquina:**
   ```bash
   tailscale ip -4
   # Exemplo de saída: 100.85.120.45
   ```

---

### Passo a Passo no Celular (Android ou iPhone):

1. Baixe o app oficial **Tailscale** na [Google Play Store](https://play.google.com/store/apps/details?id=com.tailscale.ipn) ou [Apple App Store](https://apps.apple.com/app/tailscale/id1470499037).
2. Abra o app e faça login com a **mesma conta** que você usou no computador.
3. Ative a chave de conexão (o ícone de VPN aparecerá no topo do celular).
4. No navegador do celular (Chrome ou Safari), acerte o endereço do seu computador na porta 8090:
   👉 **`http://100.85.120.45:8090`** (ou `http://nome-do-computador:8090`)

---

### 📲 Dica de Ouro: Transforme em App no Celular (PWA)
1. Com a página do Nexus Console aberta no navegador do celular:
   * **No Android (Chrome):** Toque nos 3 pontinhos no canto superior e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
   * **No iPhone (Safari):** Toque no botão de compartilhar (quadrado com seta para cima) e escolha **"Adicionar à Tela de Início"**.
2. **Pronto!** O Nexus agora se comporta como um **aplicativo nativo de celular**, abrindo em tela cheia com o ícone oficial do ecossistema, sem barra de navegação!

---

## ⚡ Opção 2: Cloudflare Tunnel (Sem Instalar Nada no Celular)

Se você não quiser instalar o app da VPN no celular e preferir acessar através de um link HTTPS comum na internet, a **Cloudflare** oferece o recurso **Cloudflare Tunnels** de forma **100% gratuita**.

### Passo a Passo:

1. **Baixe o utilitário oficial `cloudflared` no seu computador:**
   ```bash
   # Ubuntu / Debian:
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```

2. **Inicie um túnel temporário direto para a porta do Nexus:**
   ```bash
   cloudflared tunnel --url http://localhost:8090
   ```

3. **Copie o link seguro gerado:**
   O terminal exibirá uma URL pública protegida com SSL gratuito:
   ```text
   https://seunome-aleatorio.trycloudflare.com
   ```
4. Basta abrir esse link no navegador de qualquer celular no mundo (4G/5G).

> 🔒 **Dica de Segurança:** Para uso permanente com Cloudflare, você pode associar ao seu próprio domínio gratuito e ativar o **Cloudflare Access** (que exige um código de confirmação no seu e-mail antes de abrir a página).

---

## 📊 Comparativo: Qual Escolher?

| Critério | Opção 1: Tailscale (Recomendada) | Opção 2: Cloudflare Tunnel |
| :--- | :--- | :--- |
| **Custo** | **100% Gratuito** | **100% Gratuito** |
| **Segurança** | **Máxima:** Tráfego não passa na internet aberta (rede ponto a ponto criptografada). | **Alta:** Protegido por proxy da Cloudflare. |
| **Precisa abrir portas?** | **Não.** Funciona atrás de qualquer roteador ou operadora (CGNAT). | **Não.** Funciona de dentro para fora. |
| **Facilidade no Celular** | Instala o app uma vez e conecta com 1 toque. | Não precisa instalar app no celular (abre por link). |

---

## 🎯 Conclusão
Com o **Tailscale**, você tem o poder do **Nexus Ecosystem** e do seu Squad de IA rodando no seu computador potente em casa, acessível da palma da sua mão na rua, no café ou em viagem com **custo zero**.

