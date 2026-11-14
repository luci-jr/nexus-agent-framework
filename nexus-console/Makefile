.PHONY: build run test docker-build clean

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o nexus-console main.go

run: build
	./nexus-console

docker-build:
	docker build -t nexus-console:1.0.0 .

clean:
	rm -f nexus-console
