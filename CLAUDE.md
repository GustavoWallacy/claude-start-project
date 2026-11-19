# <!-- PREENCHER: nome do projeto --> — regras de trabalho

<!-- PREENCHER: 2 a 4 linhas — o que é o projeto, para quem, stack (front, back, banco, integrações). -->

> Este arquivo vale para TODA tarefa. As regras de cada área ficam em
> `.claude/rules/` e carregam sozinhas quando a sessão abre um arquivo da área
> (índice no fim). O que **existe** (endpoints, tabelas, jobs, telas,
> integrações) está em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) → arquivo
> do domínio. Aqui fica **como trabalhar**; lá, **o que existe**.
<!-- PREENCHER: branch base, se não for a padrão. Ex.: "Base de trabalho: branch `develop`." Senão apague esta linha. -->

## Comandos

| Comando | Para quê |
|---|---|
<!-- PREENCHER: uma linha por comando real (dev, build, lint, typecheck, test, uma suíte só). Marque com ⚠️ o que toca banco real ou serviço externo. -->

## Mapa

<!-- PREENCHER: 3 a 6 bullets — pasta → o que mora nela. Só o que não é óbvio pelo nome. -->

## 0. Gate antes de QUALQUER edição

Valide o pedido contra a checklist abaixo. Faltou item obrigatório → **pare,
não edite**: liste o que falta e pergunte.

## 1. Checklist do pedido

- **O quê, onde e comportamento esperado.**
- **Dados:** campos e origens envolvidos.
- **Impacto:** outras telas, rotas, integrações e automações afetadas.
<!-- SE frontend -->
- **Layout:** tela nova ou redesenhada → o pedido diz o layout (ou referência).
  Sem isso, pergunte com 2 ou 3 opções (rascunho desktop + celular).
<!-- FIM frontend -->
<!-- SE acesso -->
- **Acesso:** rota, página ou ação sensível nova ou alterada → o pedido diz
  qual(is) perfil(is) pode(m). Sem isso, pergunte.
<!-- FIM acesso -->
<!-- SE auditoria -->
- **Histórico:** ação que modifica dados → o pedido diz se entra na trilha de
  auditoria. <!-- PREENCHER: helper de auditoria do projeto. -->
<!-- FIM auditoria -->
<!-- SE plano-por-etapa -->
- **Plano:** tarefa com mais de uma etapa → monte o plano de execução e peça
  aprovação etapa por etapa antes de editar.
<!-- FIM plano-por-etapa -->
<!-- SE deploy -->
- **Deploy:** entrega que exige deploy → pergunte a forma de distribuir.
  <!-- PREENCHER: opções de deploy do projeto (ex.: só front, migração + back, troca de segredo). -->
<!-- FIM deploy -->

## 2. Skills obrigatórias

- **Segurança:** antes de escrever código que recebe dado externo (rota, form,
  webhook, upload), mexe em auth/sessão/permissão, guarda segredo ou PII,
  executa comando ou integra serviço de terceiro → carregue a skill
  **`security-and-hardening`**. Antes de entregar mudança nessas áreas, rode a
  **`security-review`** no diff. Detalhe em `.claude/rules/seguranca.md`.
<!-- SE banco -->
- **Banco:** toda mudança com SQL — query nova ou alterada, migration, trigger,
  função, índice, view — carrega a skill
  **`<!-- PREENCHER: skill de banco, ex.: supabase-postgres-best-practices -->`**
  antes de escrever.
<!-- FIM banco -->
<!-- SE skill-brainstorm -->
- **Ideia vaga ou decisão de arquitetura** → `brainstorm` antes de planejar.
<!-- FIM skill-brainstorm -->
<!-- PREENCHER: outras skills obrigatórias do projeto (ex.: DS, dashboard-bi para telas de métrica). Apague se não houver. -->

## 3. Regras universais

- **Segredo nunca no código:** chave, token e senha vêm de variável de
  ambiente; o repositório só tem `.env.example` com placeholders.
- **Definição única + paridade testada:** lista ou regra que dois lados
  repetem (front × back, SQL × código, código × doc de integração) tem UM
  export de cada lado e um teste que falha se divergirem.
- **Bug corrigido → teste de regressão** que falha antes e passa depois.
  Rode e confirme antes de entregar. Como escrever: `.claude/rules/testes.md`.
<!-- SE banco -->
- **Migration** só é aplicada com permissão explícita do usuário.
  <!-- PREENCHER: como se aplica (runner/comando ou "à mão, direto no banco"). -->
<!-- FIM banco -->
<!-- PREENCHER: regras de domínio que valem para TODO o projeto (caixa de dado gravado, fuso, moeda…). Regra de uma área só vai para .claude/rules/. -->

## 4. Antes de entregar

- Código alterado → **nenhum problema NOVO** de lint/typecheck nos arquivos
  tocados. <!-- PREENCHER: comandos de lint/typecheck; se a base já tem dívida, diga "compare com o antes, não exija verde global". -->
- Testes do que mudou rodados e passando (`.claude/rules/testes.md`).
<!-- SE frontend -->
- Tela alterada → conferida em print, desktop e celular.
<!-- FIM frontend -->
- Não commitar nem dar push sem pedido.
- **Documentação:** mudou o que existe → `docs/arquitetura/<domínio>.md`;
  mudou como se trabalha → `CLAUDE.md` ou `.claude/rules/`. Avise o usuário
  apontando arquivo e seção.

## Automático (hooks e confirmações)

Configurado em `.claude/settings.json` + `.claude/hooks/config.cjs`; detalhe
em `.claude/hooks/README.md`. Aviso de hook não é opcional: trate, ou diga ao
usuário por que não se aplica.

- **Pedem confirmação:** `git push`, `git commit`, comandos que descartam
  trabalho, ler ou editar `.env`<!-- SE banco -->, comando ou script que grava no banco<!-- FIM banco -->.
- **Bloqueiam:** escrever segredo literal no código; editar código sensível
  sem a skill de segurança<!-- SE banco -->; escrever SQL sem a skill de banco<!-- FIM banco -->.
- **Avisam:** problema novo de lint/typecheck e, no fim da resposta, teste e
  documentação pendentes.
<!-- PREENCHER: tirar o que foi desligado no config.cjs e acrescentar hook próprio. -->

## Regras por área (`.claude/rules/`)

Cada arquivo carrega quando a sessão lê ou edita um arquivo listado no `paths:`
do topo dele. Planejando sem ter aberto arquivo da área? Leia o da área antes
de propor.

| Arquivo | Área |
|---|---|
| `testes.md` | como escrever e rodar testes, e2e, regressão, paridade |
| `seguranca.md` | quando carregar cada skill de segurança, regras que nunca se quebram |
<!-- PREENCHER: uma linha por arquivo de regra criado (ex.: backend.md, frontend.md, <domínio>.md). -->
