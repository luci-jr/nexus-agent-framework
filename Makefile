.PHONY: all build build-console build-mcp run-console test clean

all: build

build: build-console build-mcp

build-console:
	@echo "==> Compilando Nexus Web Console..."
	@cd nexus-console && go build -ldflags="-s -w" -o ../bin/nexus-console main.go

build-mcp:
	@echo "==> Compilando Nexus MCP Server..."
	@cd nexus-mcp && go build -ldflags="-s -w" -o ../bin/nexus-mcp main.go

run-console: build-console
	@echo "==> Iniciando Nexus Web Console em http://localhost:8090"
	@./bin/nexus-console

test:
	@echo "==> Executando testes..."
	@cd nexus-mcp && go test ./...
	@cd nexus-console && go test ./...

clean:
	@rm -rf bin/
