# Multi-stage build para o Nexus Web Console em Go
FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata bash curl jq git

COPY go.mod go.sum* ./
COPY vendor/ vendor/
COPY internal/ internal/
COPY web/ web/
COPY main.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -ldflags="-s -w" -o nexus-console main.go

# Imagem de produção em Ubuntu 24.04 (Compatibilidade total com glibc, agy CLI, terminal interativo e git)
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Belem

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    bash \
    curl \
    jq \
    git \
    procps \
    nano \
    openssh-client \
    docker.io \
    ffmpeg \
    python3 \
    python3-pil \
    python3-pip \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Configuração do prompt do terminal (mostra 'nexus' limpo com cores ANSI) e Git SSH
RUN git config --global --add safe.directory /nexus && \
    git config --system core.sshCommand "ssh -F /dev/null -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new" && \
    echo "export GIT_SSH_COMMAND='ssh -F /dev/null -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new'" >> /root/.bashrc && \
    echo "export GIT_SSH_COMMAND='ssh -F /dev/null -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new'" >> /etc/bash.bashrc && \
    echo 'export PS1="\[\e[1;32m\]nexus\[\e[0m\]:\[\e[1;34m\]\w\[\e[0m\]# "' >> /root/.bashrc && \
    echo 'export PS1="\[\e[1;32m\]nexus\[\e[0m\]:\[\e[1;34m\]\w\[\e[0m\]# "' >> /etc/bash.bashrc && \
    echo 'export PS1="\[\e[1;32m\]nexus\[\e[0m\]:\[\e[1;34m\]\w\[\e[0m\]# "' >> /etc/profile && \
    echo "export HOSTNAME=nexus" >> /root/.bashrc && \
    echo "alias lucy='/usr/local/bin/lucy'" >> /root/.bashrc && \
    echo "alias lucy='/usr/local/bin/lucy'" >> /etc/bash.bashrc && \
    echo "alias ll='ls -la --color=auto'" >> /root/.bashrc && \
    echo "alias l='ls -CF --color=auto'" >> /root/.bashrc && \
    echo "alias host='/usr/local/bin/host'" >> /root/.bashrc && \
    echo "alias host='/usr/local/bin/host'" >> /etc/bash.bashrc && \
    echo "alias acessar-host='/usr/local/bin/host'" >> /root/.bashrc && \
    echo "alias acessar-host='/usr/local/bin/host'" >> /etc/bash.bashrc && \
    echo "alias atualizar='/usr/local/bin/atualizar-host'" >> /root/.bashrc && \
    echo "alias atualizar='/usr/local/bin/atualizar-host'" >> /etc/bash.bashrc && \
    echo "alias atualizar-host='/usr/local/bin/atualizar-host'" >> /root/.bashrc && \
    echo "alias atualizar-host='/usr/local/bin/atualizar-host'" >> /etc/bash.bashrc && \
    echo 'echo -e "\033[01;36m🌌 NEXUS CLOUD TERMINAL (CONTAINER)\033[00m"' >> /etc/bash.bashrc && \
    echo 'echo -e "\033[00;33m💡 Comandos Rápidos:\033[00m"' >> /etc/bash.bashrc && \
    echo 'echo -e "   • \033[01;32mhost\033[00m           -> Acessa o shell da máquina host (Ubuntu EC2)"' >> /etc/bash.bashrc && \
    echo 'echo -e "   • \033[01;32matualizar-host\033[00m -> Atualiza e recompila o Nexus Console no Swarm\n"' >> /etc/bash.bashrc

WORKDIR /app

# Utilitários de acesso ao Host e atualização automática
COPY scripts/host.sh /usr/local/bin/host
COPY scripts/atualizar-host.sh /usr/local/bin/atualizar-host
RUN chmod +x /usr/local/bin/host /usr/local/bin/atualizar-host && \
    ln -s /usr/local/bin/host /usr/local/bin/acessar-host && \
    ln -s /usr/local/bin/atualizar-host /usr/local/bin/atualizar

COPY --from=builder /app/nexus-console /usr/local/bin/nexus-console

ENV CONSOLE_PORT=8090
ENV NEXUS_DIR=/nexus
ENV HOSTNAME=nexus
ENV HOME=/root

EXPOSE 8090

ENTRYPOINT ["/usr/local/bin/nexus-console"]
