BINARY_NAME=nexus-mcp

.PHONY: all build test fmt lint lint-full test-sec clean run

all: build

build:
	go build -ldflags="-s -w" -o $(BINARY_NAME) main.go

test:
	go test -v -count=1 ./...

fmt:
	go fmt ./...

lint:
	@which golangci-lint > /dev/null 2>&1 && golangci-lint run ./... || go vet ./...

lint-full:
	golangci-lint run -v ./...

test-sec: test lint
	@echo "Auditoria de segurança e integridade concluída com sucesso!"

run: build
	./$(BINARY_NAME)

clean:
	rm -f $(BINARY_NAME)
