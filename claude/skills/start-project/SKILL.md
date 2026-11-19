---
name: start-project
description: Configura o harness do Claude Code num repositório que acabou de receber o template "Claude Projeto" (CLAUDE.md com marcadores PREENCHER, .claude/rules, hooks, skills). Reconhece o repo, entrevista o usuário em rodadas fixas (projeto e stack, backend e dados, testes e e2e, segurança, skills, fluxo de trabalho e hooks) e então preenche CLAUDE.md, regras por área, docs/ARQUITETURA.md, config dos hooks e o pacote de skills. Use sempre que o usuário digitar /start-project, disser "inicia/configura este projeto", "monta o CLAUDE.md daqui", "aplica o template", "prepara o repo para o Claude", ou quando o CLAUDE.md ainda tiver marcadores <!-- PREENCHER -->.
---

# Start project (iniciar projeto)

Transforma o template copiado num harness **deste** projeto: um `CLAUDE.md`
curto que aponta para regras por área (`.claude/rules/*.md`, carregadas pelo
`paths:`), um registro do que existe (`docs/ARQUITETURA.md`) e hooks que
cobram as regras sem depender de memória.

O valor está em duas coisas: **perguntar o que o código não diz** e **não
deixar nada genérico para trás**. Um CLAUDE.md com placeholder ou regra que
não se aplica ensina o agente a ignorar o arquivo inteiro.

## Antes de começar

1. Confirme que o template está na raiz do repo: `CLAUDE.md` com
   `<!-- PREENCHER`, `.claude/hooks/config.cjs`, `.claude/rules/testes.md`.
   Faltando → diga ao usuário para copiar o template "Claude Projeto"
   (passo a passo no README.md do repositório do template) e pare.
2. Existe `CLAUDE.antigo.md` ou `.claude/settings.antigo.json` (o repo já
   tinha harness)? Leia: o que estiver lá entra como resposta pré-preenchida
   e precisa ser **portado**, não perdido. No fim, pergunte se pode apagar.
3. `git status`: anote o que já estava modificado para não misturar com o
   que você vai escrever.

## Fase 1 — Reconhecimento (sem perguntar nada)

Leia o repo antes de perguntar, para que cada pergunta venha com uma resposta
sugerida. Procure, no mínimo:

- **Manifestos:** `package.json` (scripts, deps), `pyproject.toml`,
  `requirements*.txt`, `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`.
- **Estrutura:** pastas de front (`src/`, `app/`, `pages/`, `components/`),
  back (`server/`, `api/`, `backend/`), testes, migrations, scripts.
- **Banco:** ORM/driver nas deps (`pg`, `prisma`, `drizzle`, `sqlalchemy`,
  `supabase`…), pasta de migrations, `DATABASE_URL` no `.env.example`.
- **Testes:** framework (vitest, jest, playwright, pytest, go test), onde
  moram, se há e2e e contra qual banco.
- **Qualidade:** ESLint, Prettier, tsconfigs, ruff/black, CI (`.github/`).
- **Docs existentes:** README, `docs/`, CLAUDE.md antigo.

Guarde como uma lista "o que já sei" (stack, pastas, comandos, banco,
testes). Repo vazio é válido: a entrevista decide tudo.

## Fase 2 — Entrevista em rodadas

Siga o roteiro de `references/entrevista.md`: **seis rodadas, nesta ordem**,
uma por vez, com a ferramenta AskUserQuestion (até 4 perguntas por rodada,
opção recomendada primeiro, preenchida a partir do reconhecimento).

1. Projeto e stack
2. Backend e dados (pule se não houver backend nem banco)
3. Testes e e2e
4. Segurança
5. Skills
6. Fluxo de trabalho e hooks

Por que rodadas fixas: o usuário reconhece o caminho de um projeto para outro
e nenhum tema obrigatório (testes, segurança, backend) fica sem resposta. Por
que uma por vez: a resposta de uma rodada muda as perguntas da próxima
(sem banco, não há e2e em transação; sem front, não há print de tela).

Resposta "não sei" ou "depois" → use o padrão recomendado e anote como
**decisão provisória** no relatório final. Resposta ambígua → pergunte de
novo antes de seguir; não adivinhe.

## Fase 3 — Confirmação

Antes de escrever, mostre um resumo curto das decisões (uma linha por
rodada) e a lista de arquivos que serão criados, alterados ou apagados.
Escreva só depois do "ok".

## Fase 4 — Montagem

Siga `references/montagem.md`. Em resumo:

- **`CLAUDE.md`:** resolve cada `<!-- SE x -->…<!-- FIM x -->` (mantém o
  conteúdo e tira os marcadores, ou apaga o bloco) e troca cada
  `<!-- PREENCHER -->` por conteúdo real. Alvo ≤ 150 linhas.
- **`.claude/rules/`:** `testes.md` e `seguranca.md` ajustados + um arquivo
  por área que tenha regra própria, no formato de
  `references/modelo-regra.md`. Cada glob do `paths:` precisa casar com
  ≥ 1 arquivo (confira com Glob); área sem arquivo ainda → glob da pasta que
  vai existir e aviso no relatório.
- **`docs/ARQUITETURA.md`** + `docs/arquitetura/<domínio>.md` por domínio
  que já existe.
- **Hooks:** `config.cjs` conforme as respostas; entradas do `settings.json`
  dos hooks desligados removidas; `permissions.allow` com os comandos reais
  do projeto.
- **Skills:** instala as escolhidas na Rodada 5 a partir do repositório
  `pack-skills` (`references/pacote-skills.md`) e acerta os `Skill(...)`
  do settings.
- **`.gitignore`:** acrescenta `.claude/settings.local.json` e `.env*` (com
  exceção `!.env.example`) se faltarem.

## Fase 5 — Verificação

Não entregue sem rodar:

- `grep -rn "PREENCHER\|<!-- SE \|<!-- FIM " CLAUDE.md .claude/rules docs` → vazio.
- `node --check` em cada `.claude/hooks/*.cjs` e `node -e "require('./.claude/hooks/config.cjs')"`.
- `.claude/settings.json` é JSON válido e só aponta para hooks que existem.
- Cada glob de `paths:` casa com algo (ou está no relatório como futuro).
- Teste de fumaça de 2 hooks pelo stdin (exemplos em `.claude/hooks/README.md`):
  `segredos.cjs` nega uma chave falsa; `seguranca-skill.cjs` reage a um
  arquivo de rota.
- Os comandos da tabela "Comandos" existem (`npm run` lista os scripts).

## Fase 6 — Relatório

Termine com:

1. O que foi criado/alterado (arquivo → uma linha).
2. Decisões provisórias e o que ficou para depois (ex.: área sem arquivo
   ainda, repositório de skills vazio).
3. Próximos passos: revisar o diff, `/hooks` para conferir os hooks ativos,
   abrir uma sessão nova (o CLAUDE.md e as rules carregam no início).
4. Não faça commit: pergunte se o usuário quer.

Melhoria que valeria para **todo** projeto (pergunta que faltou, regra
genérica nova)? Sugira levá-la ao repositório do template por pull request — é lá
que ela passa a valer para o próximo projeto.
