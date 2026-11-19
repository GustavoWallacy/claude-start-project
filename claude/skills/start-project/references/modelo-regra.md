# Modelo de arquivo de regra e de registro

## Arquivo de regra (`.claude/rules/<area>.md`)

```markdown
---
paths:
  - "server/src/routes/**"
  - "server/src/services/pagamentos/**"
---

# Pagamentos — regras

Registro: `docs/arquitetura/pagamentos.md`.

## Webhook
- Confira a assinatura antes de ler o corpo: `verificarAssinatura()` em
  `server/src/webhooks/stripe.ts`. Coberto por `tests/webhook.e2e.ts`.
- Evento repetido não gera efeito duplo: grave `event_id` com UNIQUE e
  ignore o conflito.
  **Por quê:** o provedor reenvia o mesmo evento até receber 200.
```

Como escrever:

- **`paths:`** — lista de globs entre aspas; cada um precisa casar com ≥ 1
  arquivo (confira com Glob). É o que decide quando a regra carrega: glob
  largo demais carrega a regra em toda sessão; estreito demais, nunca.
- **Título + "Registro:"** apontando para o doc do domínio.
- **Regra:** imperativa, curta (1–3 linhas), autossuficiente, com a âncora
  no código (arquivo/função/constante) e o teste que a cobra, quando houver.
- **Por quê:** uma linha, só quando a regra parece arbitrária sem ela.
- Agrupe em `##` por assunto. Sem datas, sem histórico, sem "nesta sessão".
- Não repita regra da raiz (`CLAUDE.md`): ela já carrega sempre.
- Fora: descrição de fato sem instrução (vai para `docs/`), comportamento
  óbvio, regra que só vale para uma tarefa.
- Alvo ≤ 150 linhas por arquivo. Passou → divida por subárea ou corte o que
  não evita dano real (perda de dado, vazamento de acesso, métrica errada,
  efeito duplicado, integração quebrada).

## Registro do domínio (`docs/arquitetura/<dominio>.md`)

```markdown
# Pagamentos

Estado atual. Regras de trabalho: `.claude/rules/pagamentos.md`.

## Endpoints
| Método e rota | Quem chama | O que faz |
|---|---|---|

## Tabelas
| Tabela | Colunas-chave | Quem escreve |
|---|---|---|

## Jobs e integrações
- …

## Acesso
| Ação | Perfis |
|---|---|
```

Só o que **existe** hoje. Mudou o código → atualize o registro na mesma
entrega.
