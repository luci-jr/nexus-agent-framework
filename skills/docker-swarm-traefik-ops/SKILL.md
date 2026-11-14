---
name: docker-swarm-traefik-ops
description: >-
  Operational runbook for Docker Swarm, Traefik v2/v3 reverse proxy, dynamic routing, Portainer management, service scaling, overlay networks, persistent volume governance, and CPU/RAM resource limits. Use when deploying, diagnosing, or managing container infrastructure.
---

# Docker Swarm & Traefik SysOps Runbook

Guia operacional para orquestração de containers sob Docker Swarm com Traefik v2/v3 e Portainer no ambiente Linux Ubuntu.

## 1. Ciclo de Vida de Serviços e Desired State
- **Docker Swarm vs Containers Standalone**:
  - `docker stop` em containers gerenciados pelo Swarm dispara provisionamento automático de nova tarefa.
  - Para pausar serviços sem remover a definição:
    ```bash
    docker service scale <nome_do_servico>=0
    ```
  - Para reativar:
    ```bash
    docker service scale <nome_do_servico>=1
    ```
- **Stacks**:
  - Deploy: `docker stack deploy -c docker-compose.yml <nome_da_stack>`
  - Remoção: `docker stack rm <nome_da_stack>`

## 2. Roteamento Dinâmico com Traefik
- Configure serviços no Swarm via `deploy.labels`:
  ```yaml
  deploy:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`app.lucivaldo.cloud`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=8080"
  ```
- **Rede Overlay**:
  - Sempre conecte os serviços roteáveis à rede overlay pública do Traefik (ex: `traefik-public` com `driver: overlay` e `attachable: true`).

## 3. Limites de Recursos & Isolamento de Memória
- Em todos os serviços de produção, declare estritamente reservas e limites no `deploy.resources`:
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '0.50'
        memory: 512M
      reservations:
        memory: 128M
  ```
- Isso impede que processos em vazamento de memória (como Node.js ou Java) derrubem o nó do host via Linux OOM-Killer.

## 4. Diagnósticos de Infraestrutura e zRAM
- Checagem rápida de uso de recursos:
  ```bash
  docker stats --no-stream
  docker service ls
  free -h
  ```
