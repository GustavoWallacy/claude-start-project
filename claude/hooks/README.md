# Hooks

Scripts que o Claude Code roda sozinho em momentos fixos, ligados em
`.claude/settings.json`. Eles não dependem de o Claude lembrar da regra.
Resumo para a sessão: `CLAUDE.md` → "Automático (hooks e confirmações)".

- Escritos em Node (`.cjs`, funcionam mesmo com `"type": "module"` no
  `package.json`). Precisam só de `node` no PATH, qualquer que seja a stack.
- **Tudo que depende da stack fica em `config.cjs`** — edite à mão (a skill
  `/start-project` faz a primeira versão). Desligar um hook: `ativo: false`
  no `config.cjs` ou tirar a entrada dele do `settings.json` (`/hooks` mostra
  o que está ativo).

| Arquivo               | Quando                                                                           | O que faz                                                                                                                                                                                        | Depende da stack?                                                    |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `segredos.cjs`        | antes de Edit/Write                                                              | **Nega** edição que escreve chave de API, token, chave privada ou senha em connection string fora do `.env`.                                                                                     | não                                                                  |
| `seguranca-skill.cjs` | antes de Edit/Write                                                              | Edição em código sensível (auth, sessão, rota, webhook, cripto, `exec`, `innerHTML`…) sem a skill `security-and-hardening` carregada → **nega** (ou só avisa, `modo: 'avisar'`).                 | caminhos sensíveis                                                   |
| `sql-skill.cjs`       | antes de Edit/Write                                                              | Edição que escreve SQL sem a skill de banco carregada → **nega** e manda carregar.                                                                                                               | pastas, skill de banco                                               |
| `banco-escrita.cjs`   | antes de Bash/PowerShell                                                         | Comando que roda script ou SQL com escrita (INSERT, UPDATE, DELETE, DDL…) ou runner de migration (alembic, prisma migrate, knex, node-pg-migrate…) → **pede confirmação**. Testes ficam de fora. | rótulo do banco, padrão de teste, runners extras                     |
| `formatar.cjs`        | depois de Edit/Write                                                             | Roda o formatador (prettier, ruff, gofmt…) no arquivo editado — só se a config dele existir no projeto; nunca em `.md`/`docs/`. Desligado por padrão.                                            | comandos por extensão, config exigida, ignorados                     |
| `qualidade.cjs`       | início da sessão (`baseline`) e fim de cada resposta (`check`), em segundo plano | Fotografa os problemas de ESLint/tsc ao abrir a sessão; no fim de cada resposta, problema **novo** acorda o Claude com a lista.                                                                  | JS/TS pronto; outra stack: desligue ou adapte `lint()`/`typecheck()` |
| `lembretes.cjs`       | fim de cada resposta                                                             | Lembra, uma vez por arquivo: código mudou sem teste; código mudou sem doc; tela mudou sem print.                                                                                                 | prefixos de código, testes e docs                                    |

`lib.cjs` tem o que todos compartilham (entrada, caminhos, transcript,
estado, "a skill X foi carregada?").

Além dos hooks, o `settings.json` **pede confirmação** para `git push`,
`git commit`, comandos que descartam trabalho (`reset --hard`, `clean`,
`restore`, `branch -D`, `rm -rf`…) e para ler/editar `.env`.

## Estado

Fora do repo, em `%TEMP%\claude-hooks-<projeto>\`: foto do início da sessão,
offsets do transcript, avisos já dados, marcadores de skill carregada e o
cache do tsc/ESLint. Pode apagar a pasta a qualquer momento.

## Testar um hook

Cada script lê o JSON do evento no stdin. Saída vazia = deixou passar.

```powershell
'{"tool_name":"Write","tool_input":{"file_path":"src/config.ts","content":"const k = \"AKIAABCDEFGHIJKLMNOP\""},"cwd":"."}' |
  node .claude/hooks/segredos.cjs
```

## Hook novo

1. Copie o mais parecido (PreToolUse que nega → `sql-skill.cjs`; Stop que
   lembra → `lembretes.cjs`).
2. Ponha o que depende da stack num bloco novo do `config.cjs`.
3. Ligue no `settings.json`, teste pelo stdin e acrescente uma linha na
   tabela acima e no `CLAUDE.md` → "Automático".
