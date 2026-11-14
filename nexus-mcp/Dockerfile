FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata docker-cli procps
WORKDIR /
COPY nexus-mcp /usr/local/bin/nexus-mcp
RUN chmod +x /usr/local/bin/nexus-mcp
ENV MCP_TRANSPORT=sse \
    MCP_PORT=8085 \
    NEXUS=/nexus
EXPOSE 8085
CMD ["/usr/local/bin/nexus-mcp"]
