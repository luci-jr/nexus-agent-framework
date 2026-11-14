# 👤 Tutorial 05: Personalizando Seu Perfil, Currículo e Preferências

O **Nexus Agent Framework** foi desenhado para se moldar perfeitamente a **você**.

Quando você preenche seu perfil e currículo, os copilotos (especialmente a **Lucy** e o **Frellas**) passam a te tratar pelo seu nome, avaliar vagas de acordo com sua pretensão salarial real e escrever código respeitando exatamente a sua senioridade.

---

## 📂 Onde estão os Templates?

Na pasta [`templates/`](../../templates/), você encontrará 3 arquivos de modelo prontos para preencher:

```text
templates/
├── perfil.example.md          # Suas stacks, objetivos e histórico profissional
├── candidato.example.json     # Seus dados estruturados para análise ATS com IA
└── preferencias.example.md    # Como você quer que a Lucy te responda
```

---

## 🛠️ Passo a Passo de Configuração

### 1. Criando seu Perfil Técnico (`perfil.md`)
Copie o template para a raiz ou pasta de configuração:
```bash
cp templates/perfil.example.md perfil.md
```
Abra o arquivo e preencha:
* Seu nome e links (GitHub, LinkedIn, Portfólio).
* Suas stacks dominadas (Back-end, Front-end, Cloud, Bancos).
* Seus objetivos de carreira (Júnior, Pleno, Sênior, Tech Lead).

> 💡 **Onde o agente usa isso:** Toda vez que você pedir para o copiloto **Backend** ou **Frontend** criar um projeto ou resolver uma arquitetura, ele usará as ferramentas e padrões que você domina.

---

### 2. Configurando para Análise de Vagas (`candidato.json`)
Copie o modelo de candidato:
```bash
cp templates/candidato.example.json candidato.json
```
Preencha suas preferências reais de contratação:
* `pretensao_salarial`: Valores mínimos e ideais para CLT e PJ.
* `modalidade_aceita`: "100% Remoto", "Híbrido" ou "Presencial".
* `curriculos_pdf`: O caminho onde você guarda seus currículos no computador.

> 💼 **Onde o agente usa isso:** Quando você colar uma descrição de vaga no chat e pedir para o **Frellas** avaliar, ele usará a ferramenta `nexus_analisar_fit_vaga` para calcular a nota de aderência de 0 a 100% contra o seu `candidato.json` e te dizer se a vaga vale a pena ou se é uma vaga fantasma!

---

### 3. Ajustando o Tom da Lucy (`preferencias.md`)
Copie o modelo de preferências:
```bash
cp templates/preferencias.example.md preferencias.md
```
Escolha como prefere ser tratado:
* Se prefere tratamento formal (*Você*) ou regional (*Tu*).
* Se prefere respostas socráticas guiadas ou direto ao código.

---

## 🎯 Conclusão
Com esses 3 arquivos preenchidos, o **Nexus Agent Framework** deixa de ser um assistente genérico e se torna o **seu copiloto de carreira e engenharia personalizado**.

