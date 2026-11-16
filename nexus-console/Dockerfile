# Multi-stage build do Nexus Web Console (Go)
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd/ cmd/
COPY internal/ internal/
COPY web/ web/
COPY main.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o nexus-console main.go

# Imagem de produção: só o necessário para o console e o terminal web.
# (Sem cliente Docker nem atalhos para o shell do host: um terminal web que
# alcança o host transforma qualquer falha de login em acesso total à máquina.)
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
    && rm -rf /var/lib/apt/lists/*

RUN git config --global --add safe.directory /nexus && \
    echo 'export PS1="\[\e[1;32m\]nexus\[\e[0m\]:\[\e[1;34m\]\w\[\e[0m\]# "' >> /etc/bash.bashrc && \
    echo "alias ll='ls -la --color=auto'" >> /etc/bash.bashrc

WORKDIR /app

COPY --from=builder /app/nexus-console /usr/local/bin/nexus-console

ENV CONSOLE_PORT=8090
ENV NEXUS_DIR=/nexus
ENV HOSTNAME=nexus
ENV HOME=/root

EXPOSE 8090

ENTRYPOINT ["/usr/local/bin/nexus-console"]
