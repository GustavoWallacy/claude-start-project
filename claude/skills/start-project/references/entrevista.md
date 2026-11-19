# Roteiro da entrevista

Seis rodadas, nesta ordem, uma chamada de AskUserQuestion por rodada (até 4
perguntas). Regras de toda rodada:

- **Pré-preencha** pelo reconhecimento: a opção que o repo indica vem primeiro
  com "(Recomendado)" e a descrição diz de onde veio ("achei `vitest` no
  package.json").
- Pergunta que o repo já responde sem dúvida vira **confirmação** dentro de
  outra pergunta, não pergunta própria.
- Cada pergunta se sustenta sozinha (o usuário pode ver só o diálogo).
- Abra cada rodada com uma linha dizendo o tema e por que ele importa.
- Texto livre ("Outro") sempre existe; não crie opção "Outro".

As tags `[→ x]` dizem o que cada resposta liga na montagem
(`montagem.md`).

---

## Rodada 1 — Projeto e stack

1. **Tipo do projeto** — Front só (site/SPA) · Back só (API/serviço/worker) ·
   Full-stack (front + back no mesmo repo) · Script/automação/CLI.
   `[→ SE frontend, SE backend]`
2. **Stack principal** — opções a partir do reconhecimento (ex.: "Node + TS +
   React + Express", "Python + FastAPI", "Next.js"). `[→ Comandos, config.qualidade]`
3. **Tamanho e equipe** — Pequeno, só eu · Pequeno, com time · Grande / vai
   crescer / várias pessoas. `[→ escolha do e2e, plano-por-etapa]`
4. **Objetivo em uma frase** (texto livre pela opção "Outro"; ofereça 2
   rascunhos tirados do README). `[→ cabeçalho do CLAUDE.md]`

## Rodada 2 — Backend e dados

Pule a rodada inteira se a Rodada 1 disse "Front só" e não há banco.

1. **Banco** — Postgres · MySQL · SQLite · NoSQL (Mongo/Firestore…) · Nenhum.
   `[→ SE banco, config.sql, config.bancoEscrita]`
2. **O localhost aponta para qual banco?** — Banco local/dev próprio ·
   Banco de PRODUÇÃO (compartilhado) · Não sei. Produção → avisos fortes no
   CLAUDE.md e `bancoEscrita.ambiente = 'PRODUÇÃO'`. `[→ config.bancoEscrita]`
3. **Como se aplica migration** — Runner do ORM/ferramenta (qual comando) ·
   À mão, direto no banco · Não tem migration. `[→ §3 Migration]`
   Runner fora da lista do `banco-escrita.cjs` (alembic, prisma, knex,
   node-pg-migrate, manage.py, drizzle, typeorm, goose…) →
   `config.bancoEscrita.migradores`. `[→ config.bancoEscrita]`
4. **Integrações de fora** que escrevem ou leem o banco/API (n8n, webhook,
   outro sistema, BI) — Nenhuma · Sim (quais). `[→ Impacto no §1, paridade
   código × doc, regra da área]`

## Rodada 3 — Testes e e2e

1. **Framework de teste** — o detectado (Recomendado) · outro · Ainda não tem
   (proponha um para a stack). `[→ testes.md, config.lembretes]`
2. **Estratégia de e2e** — explique a troca na descrição:
   - *Banco real em transação (BEGIN/ROLLBACK)* — simples; bom para projeto
     pequeno; exige cuidado com triggers e dados reais. `[→ SE e2e-transacao]`
   - *Banco de teste separado* (container/instância/branch) — isolado; para
     projeto grande ou com time. `[→ SE e2e-banco-separado]`
   - *Sem e2e de banco* — só unitário/integração com mock. `[→ SE sem-banco]`
   Recomende pelo tamanho da Rodada 1 (grande → separado).
3. **Regra de regressão** — "Bug corrigido sempre ganha teste que falha antes
   e passa depois" (Recomendado) · Só quando eu pedir. `[→ §3, lembretes]`
4. **Onde ficam e como rodam** — confirme pasta e comando detectados
   (ex.: `server/tests/*.e2e.ts` via `npm test`). `[→ paths de testes.md,
   config.lembretes.pastasDeTeste/comandoDeTeste, Comandos]`

## Rodada 4 — Segurança

1. **O que é sensível aqui** (multiSelect) — Login/sessão · Perfis e
   permissões · Dados pessoais (PII) · Pagamento · Webhooks/integrações ·
   Upload de arquivo · Nada disso. `[→ seguranca.md, SE acesso]`
2. **Hook da skill de segurança** — Bloquear edição sensível sem a skill
   (Recomendado se houver auth/PII/pagamento) · Só avisar · Desligado.
   `[→ config.seguranca.modo/ativo]`
3. **Caminhos sensíveis** — confirme os detectados (rotas, middleware, auth)
   ou informe outros. `[→ config.seguranca.caminhos, paths de seguranca.md]`
4. **Auditoria** — Ação que altera dado entra numa trilha de histórico? Sim,
   já existe helper (qual) · Sim, criar depois · Não. `[→ SE auditoria]`

## Rodada 5 — Skills

O template já traz `start-project`, `security-and-hardening` e
`security-review` (sempre ficam). As outras vêm do repositório
`pack-skills`: baixe e monte o menu antes desta rodada, conforme
`pacote-skills.md` (passos 1–2).

1. **Uma pergunta por categoria** (multiSelect; 📁/🔗 não importa para o
   usuário, mostre nome + uma linha). Só as categorias que fazem sentido:
   - **Front-end** — se houver tela. Recomende pela stack (ex.:
     `apple-hig-designer` só com app/UI Apple, `dashboard-bi` só com
     dashboard/BI).
   - **Banco de dados** — se houver banco. A skill do hook `sql-skill`
     (padrão `supabase-postgres-best-practices`) vem marcada e com
     "(Recomendado — o hook de SQL exige)"; com banco não-Postgres,
     pergunte qual skill de banco usar.
   - **Fluxo** — sempre (`brainstorm` recomendado).
   - **Marketing** — só se o projeto tem site, landing ou página de venda.
   - Categoria nova no repositório → pergunte se o assunto existir no
     projeto.
   AskUserQuestion aceita até 4 opções: categoria com mais skills vira duas
   perguntas. Item com `instalar` → avise que é instalado por comando do
   usuário. `[→ instalar, Skill(...) no settings]`
2. **Skill obrigatória por área** — alguma área exige skill (ex.: telas de
   métrica → `dashboard-bi`; SQL → skill de banco; ideia vaga →
   `brainstorm`)? Só entre as instaladas. `[→ §2]`

## Rodada 6 — Fluxo de trabalho e hooks

1. **Plano por etapa** — Tarefa com várias etapas: montar plano e aprovar
   etapa por etapa antes de editar? Sim · Só em tarefa grande · Não.
   `[→ SE plano-por-etapa]`
2. **Hooks** (multiSelect, mostre o que cada um faz em 1 linha; recomende
   pela stack): segredos · segurança · SQL sem skill · escrita no banco ·
   lint/typecheck novos · lembretes de teste/doc · formatador · print de tela.
   `[→ config.*.ativo, settings.json]`
3. **Formatador** (só se ligado) — prettier · ruff · gofmt · outro.
   Confira na recon se a **config dele existe** (`.prettierrc`,
   `package.json#prettier`, `ruff.toml`, `[tool.ruff]`…). Não existe →
   pergunte: Criar a config agora com o estilo que o código já usa
   (Recomendado; confira 2–3 arquivos: aspas, ponto e vírgula, largura) ·
   Deixar o formatador desligado. Nunca ligue sem config: ele reescreve o
   projeto no estilo padrão dele. `[→ config.formatar.comandos/exigeConfig]`
4. **Deploy e documentação** — Como se distribui uma entrega (texto livre ou
   "não se aplica") e se há manual para pessoas além do `docs/` técnico.
   `[→ SE deploy, Mapa]`
