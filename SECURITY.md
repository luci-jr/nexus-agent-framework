# Segurança

O Nexus Console expõe um terminal Linux pelo navegador. Trate a senha do
console como trataria uma chave SSH.

## Como a autenticação funciona

- **Não existe senha padrão.** Defina `CONSOLE_PASSWORD` (mínimo de 12
  caracteres) ou deixe vazia: o console gera uma senha aleatória na primeira
  execução, grava em `.console_pass` (permissão 0600) e a mostra uma única vez
  no log.
- **O navegador nunca recebe a senha.** O login devolve um token de sessão
  aleatório, válido por 30 dias, guardado em cookie `HttpOnly` e
  `SameSite=Strict` (`Secure` sob HTTPS). Trocar a senha derruba todas as
  sessões.
- **Limite de tentativas.** Cinco senhas erradas do mesmo endereço bloqueiam o
  login por um minuto.
- **Leitura pública é opcional.** Com `CONSOLE_PRIVATE=true`, tarefas, ADRs,
  grafo, anexos e conteúdo também exigem login.
- **O que não está configurado fica desligado:** a ponte do WhatsApp sem
  `BRIDGE_AUTH_TOKEN`, o webhook do GitHub sem `GITHUB_WEBHOOK_SECRET` e o
  login por ForwardAuth sem `CONSOLE_FORWARD_AUTH=true`.

## Se você usou uma versão anterior a esta

Versões anteriores tinham uma senha padrão e uma chave de API escritas no
código público. Se você rodou uma delas exposta à internet:

1. Troque a senha do console (`CONSOLE_PASSWORD` ou `.console_pass`).
2. Troque as chaves SSH e os tokens que o container ou o servidor acessavam.
3. Gere um novo `EVOLUTION_TOKEN` na sua instância da Evolution API.
4. Revise os logs de acesso do servidor.

## Como relatar uma falha

Abra um aviso privado em **Security → Report a vulnerability** no GitHub, em
vez de uma issue pública.
