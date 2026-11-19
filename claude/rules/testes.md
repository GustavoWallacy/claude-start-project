---
paths:
  # PREENCHER: globs dos testes e do código que eles cobrem (cada um precisa casar com ≥1 arquivo).
  - "tests/**"
  - "**/*.{test,spec,e2e}.*"
---

# Testes — regras

Registro: `docs/arquitetura/testes.md` <!-- PREENCHER: ou apague se não houver -->

<!-- PREENCHER: 1 linha — framework e onde moram os testes. Ex.: "Vitest; e2e em `server/tests/*.e2e.ts`, rodados por `npm test`." -->

## Sempre

- **Bug corrigido → teste de regressão** que **falha antes** da correção e
  **passa depois**. Rode nas duas versões (ou mostre a falha) antes de entregar.
- Regra ou rota alterada → rode a suíte do domínio, não só o teste novo.
- Teste novo entra no comando que roda tudo (`npm test`, `pytest`, CI) — teste
  que só roda à mão é esquecido.
- **Paridade:** regra ou lista que existe em dois lados (front × back, SQL ×
  código, código × doc de integração) tem um teste que importa os dois e
  falha se divergirem.
- Teste testa comportamento (entrada → saída/efeito), não detalhe de
  implementação; nome do teste diz a regra que ele cobra.
- API externa (pagamento, e-mail, agenda, LLM) é **mockada**: teste não gasta
  cota nem cria recurso real.
- Teste não depende de ordem nem de relógio: data fixa ou injetada.

<!-- SE e2e-transacao -->
## E2E no banco real, em transação (projeto pequeno)

O teste usa o mesmo banco do desenvolvimento, dentro de `BEGIN … ROLLBACK`:
nada fica gravado. Funciona enquanto o banco é pequeno e o time também.

- Toda suíte abre transação no início e dá **ROLLBACK** no fim, inclusive em
  erro (`finally`). Teste que precisa de COMMIT não entra aqui: vai para um
  banco de teste.
- **O código testado usa a conexão da transação**, nunca abre a própria: a
  conexão é injetada (parâmetro, `Depends`/override no FastAPI, contexto da
  requisição, client passado ao service). Rota ou service que pega conexão
  nova do pool escapa do ROLLBACK e grava de verdade. Teste de rota troca a
  dependência de conexão pela da transação antes de chamar.
- Dado semeado fica numa **janela sem dado real** (ex.: datas de 2020, ids com
  prefixo `TESTE_`), nunca em "hoje" — senão o agregado soma dado real e passa
  por acidente.
- Trigger com efeito externo (notificação, fila, webhook) é desligado na
  semeadura (`SET LOCAL session_replication_role = replica` no Postgres) ou o
  teste confere que não disparou.
- Tabela que outro sistema lê ao vivo (automação, BI) não é tocada: use um
  schema espelho.
- Query pesada tem **teto de tempo** no teste.
- Objeto de banco de que o código depende (view, trigger, função) tem teste
  que confere o **aplicado no banco**, além do SQL do repositório.
<!-- FIM e2e-transacao -->

<!-- SE e2e-banco-separado -->
## E2E em banco de teste separado (projeto grande)

O teste roda num banco só dele (container, branch de banco ou instância de
teste). Produção nunca é alvo de teste.

- A URL do banco de teste vem de variável própria
  (`<!-- PREENCHER: ex. DATABASE_URL_TEST -->`); o setup **aborta** se ela
  apontar para o mesmo host/banco da produção.
- O schema do banco de teste é criado pelas **mesmas migrations** do projeto
  (`<!-- PREENCHER: comando -->`) — nunca por um dump à mão que diverge.
- Cada suíte parte de estado conhecido: truncar + seed (ou transação por
  teste). Seed mínimo, em fixtures versionadas.
- Testes paralelos não compartilham linha: cada um cria os próprios dados
  (ids únicos) ou usa schema/banco próprio.
- Query pesada tem **teto de tempo** e volume de seed realista para ela.
- CI sobe o banco de teste do zero a cada execução.
<!-- FIM e2e-banco-separado -->

<!-- SE sem-banco -->
## Sem banco

- Teste unitário para regra pura; teste de integração para a borda (rota,
  CLI, arquivo) com as dependências externas mockadas.
<!-- FIM sem-banco -->

<!-- SE frontend -->
## Tela

- Regra de tela (cálculo, filtro, formatação) mora numa função pura testada,
  não dentro do componente.
- Fluxo crítico (login, compra, envio de formulário) tem teste de ponta a ponta
  no navegador (<!-- PREENCHER: Playwright/Cypress -->) ou, no mínimo, print
  conferido em desktop e celular.
<!-- FIM frontend -->
