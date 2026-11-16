# ☁️ Tutorial 05: Deploy na Nuvem & VPS Gratuita (24/7 com SSL Automático)

Bem-vindo ao guia de implantação em nuvem do **Nexus Ecosystem (Open Source Edition)**!

Este tutorial ensina como colocar o seu **Nexus Web Console** e ecossistema de governança rodando 24 horas por dia, 7 dias por semana, em uma máquina virtual (VPS) na nuvem, com **HTTPS automático (SSL Let's Encrypt)** e **custo zero** utilizando camadas Always Free.

---

## 🎯 Por Que Rodar na Nuvem?

1. **Acesso Permanente:** Acesse seu painel executivo de tarefas e métricas de qualquer dispositivo (celular, tablet, notebook) sem precisar deixar seu computador de casa ligado.
2. **Isolamento e Segurança:** O Traefik v3 gerencia e renova seus certificados SSL automaticamente, blindando o acesso com autenticação e HTTPS.
3. **Leveza Extrema (< 50MB de RAM):** Como o Nexus é escrito em **Go puro**, ele roda com folga mesmo nas menores instâncias gratuitas da nuvem.

---

## ☁️ 1. Onde Hospedar Gratuitamente (Always Free)

Você pode escolher qualquer provedor de computação em nuvem. Recomendamos duas opções gratuitas permanentes:

### Opção A: Google Cloud Platform (GCP) — Always Free
* **Recurso Grátis:** 1 instância de VM `e2-micro` (2 vCPUs compartilhadas, 1 GB de RAM, 30 GB de disco rígido padrão).
* **Regiões válidas:** `us-central1`, `us-east1` ou `us-west1`.
* **Custo:** R\$ 0,00 permanente (dentro dos limites da camada gratuita do GCP).

### Opção B: Oracle Cloud Infrastructure (OCI) — Always Free
* **Recurso Grátis:** Até 4 OCPUs e 24 GB de RAM em instâncias Ampere A1 (ARM) ou 2 instâncias AMD micro.
* **Custo:** R\$ 0,00 permanente.

*(Ou utilize qualquer VPS de baixo custo como Hetzner Cloud, Hostinger, DigitalOcean ou Linode por \$3 a \$5/mês).*

---

## 📋 2. Pré-Requisitos na sua VPS

Ao criar sua VM com **Ubuntu 22.04 ou 24.04 LTS**, conecte via SSH e instale o Docker e o Git:

```bash
# 1. Atualizar pacotes do sistema:
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker com o script oficial:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Aplicar permissões (ou reconectar ao SSH):
newgrp docker

# 4. Verificar instalação:
docker compose version
```

---

## 🌐 3. Configurando o Domínio e DNS

Para que o Traefik emita o certificado SSL gratuito (HTTPS), você precisa de um domínio apontando para o IP público da sua VPS:

1. Acesse o gerenciador de DNS do seu domínio (ex: Cloudflare, Registro.br, GoDaddy).
2. Crie um apontamento do tipo **A**:
   * **Nome:** `nexus` (ou `@` se for domínio raiz).
   * **Conteúdo / IPv4:** `IP_PUBLICO_DA_SUA_VPS`.
   * **TTL:** Automático ou 2 minutos.
   * *(Se usar Cloudflare, deixe inicialmente a nuvem Cinza / DNS Only para a primeira emissão do SSL).*

---

## 🚀 4. Realizando o Deploy em 4 Passos

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/luci-jr/nexus-ecosystem-open.git
cd nexus-ecosystem-open
```

### Passo 2: Configurar o Arquivo de Ambiente
Navegue até a pasta `deploy/` e crie o seu `.env`:

```bash
cd deploy
cp .env.example .env
nano .env
```

Preencha os valores:
```env
# Seu domínio configurado no DNS:
NEXUS_DOMAIN=nexus.seudominio.com

# Seu e-mail real para o Let's Encrypt:
ACME_EMAIL=seu-email@dominio.com

# Suas credenciais de login no painel.
# A senha é obrigatória e precisa ter 12 caracteres ou mais.
# Gere uma com: openssl rand -hex 16
CONSOLE_USER=admin
CONSOLE_PASSWORD=cole_aqui_a_senha_gerada

CONSOLE_PORT=8090
NEXUS_ENV=production
```
*(Salve com `Ctrl + O`, `Enter` e saia com `Ctrl + X`)*.

### Passo 3: Iniciar a Stack com Docker Compose
Execute dentro da pasta `deploy/`:

```bash
docker compose up -d
```

O Docker irá:
1. Baixar o **Traefik v3**.
2. Compilar o container ultra-leve do **Nexus Web Console**.
3. Gerar o certificado SSL criptografado automaticamente.

### Passo 4: Verificar a Saúde dos Serviços
```bash
docker compose ps
```
Você verá os dois containers (`nexus-traefik` e `nexus-console`) com status `Up`.

---

## 🔒 5. Acessando seu Console Seguro

Abra o navegador e acerte o endereço:
👉 `https://nexus.seudominio.com`

* O Traefik redirecionará automaticamente qualquer chamada HTTP para HTTPS seguro.
* Digite a senha (`CONSOLE_PASSWORD`) configurada no `.env`.
* Pronto! Seu **Nexus Web Console** está no ar 24/7 com telemetria, squad de copilotos e governança no bolso!

---

## 🔄 6. Como Atualizar no Futuro

Quando novas versões do Nexus forem lançadas, atualizar é imediato:

```bash
cd ~/nexus-ecosystem-open
git pull origin main
cd deploy
docker compose build --no-cache nexus-console
docker compose up -d
```

