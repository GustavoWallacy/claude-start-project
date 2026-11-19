# Claude Projeto

Template para começar **qualquer** repositório com Claude Code já
organizado:

- `CLAUDE.md` curto, que aponta para regras por área;
- registro do que existe no projeto (`docs/`);
- hooks que cobram as regras;
- um pacote de skills, incluindo segurança.

A skill **`/start-project`** entrevista você sobre o projeto (stack, banco,
testes, segurança, skills, fluxo) e preenche tudo para ele.

> **`claude/` vira `.claude/` no projeto.** Aqui a pasta fica sem o ponto
> para os hooks não rodarem enquanto você edita o próprio template. O
> Claude Code só lê skills, regras e hooks de uma pasta chamada exatamente
> `.claude`. Os comandos abaixo já copiam com o ponto. Copiar à mão?
> Renomeie `claude` → `.claude`, senão o `/start-project` nem aparece.

## Como usar

1. Abra o terminal **na raiz do seu projeto**.
2. O projeto já tem `CLAUDE.md` ou `.claude/settings.json`? Renomeie para
   `CLAUDE.antigo.md` / `.claude/settings.antigo.json`. A skill aproveita o
   que estiver neles.
3. Baixe o template e copie para o projeto. Vão só `CLAUDE.md`, `docs/` e
   `.claude/`: o README, a licença e os testes da skill ficam de fora.

   **Windows (PowerShell):**
   ```powershell
<<<<<<< HEAD
   $t = "$env:TEMP\claude-start-project"
   git clone --depth 1 https://github.com/GustavoWallacy/claude-start-project $t
   Copy-Item "$t\CLAUDE.md" .
   robocopy "$t\docs" docs /E
=======
   $t = "$env:TEMP\claude-projeto"
   git clone --depth 1 https://github.com/GustavoWallacy/claude-start-project $t
   robocopy $t . /E /XF "$t\README.md" /XD "$t\claude" "$t\.git"
>>>>>>> 4c628d01686984dc596b51015d1984e5503c3233
   robocopy "$t\claude" .claude /E /XD evals
   Remove-Item $t -Recurse -Force
   ```

   **macOS / Linux / Git Bash:**
   ```bash
   t="$(mktemp -d)/claude-start-project"
   git clone --depth 1 https://github.com/GustavoWallacy/claude-start-project "$t"
   cp "$t/CLAUDE.md" .
   mkdir -p docs .claude && cp -R "$t/docs/." docs/ && cp -R "$t/claude/." .claude/
   rm -rf .claude/skills/start-project/evals "$t"
   ```
4. Abra o Claude Code no projeto e rode **`/start-project`**.
5. Responda as seis rodadas: projeto e stack → backend e dados → testes e
   e2e → segurança → skills → fluxo de trabalho e hooks.
6. Revise o diff, abra uma sessão nova e confira os hooks com `/hooks`.

## O que tem aqui

```
CLAUDE.md                  raiz: gate, checklist, skills obrigatórias, regras universais, entrega
docs/ARQUITETURA.md        índice do registro "o que existe" (um arquivo por domínio)
claude/                    vira .claude/ no projeto
  settings.json            confirmações (push, commit, destrutivos, .env) + hooks ligados
  rules/
    testes.md              regras de teste: regressão, paridade, e2e (transação × banco separado)
    seguranca.md           quando chamar cada skill de segurança; nunca / sempre / pergunte antes
  hooks/                   7 hooks em Node + config.cjs (editar por stack) — ver hooks/README.md
  skills/                  pacote de skills (abaixo)
```

O `CLAUDE.md` e as regras têm marcadores `<!-- PREENCHER -->` e blocos
`<!-- SE x -->…<!-- FIM x -->`. A skill resolve todos e confere que nenhum
sobrou.

## Estrutura de apontamentos

| Camada | Arquivo | Carrega | Diz |
|---|---|---|---|
| Raiz | `CLAUDE.md` | sempre | como trabalhar em qualquer tarefa |
| Área | `.claude/rules/<area>.md` | quando a sessão abre arquivo do `paths:` | como trabalhar naquela área |
| Registro | `docs/arquitetura/<domínio>.md` | quando a regra aponta | o que existe hoje |
| Cobrança | `.claude/hooks/*.cjs` | em eventos fixos | nega, pede confirmação ou lembra |

## Hooks

Precisam de **Node.js** instalado.

| Hook | Faz |
|---|---|
| `segredos` | nega chave/token/senha literal no código |
| `seguranca-skill` | nega (ou avisa) edição sensível sem `security-and-hardening` |
| `sql-skill` | nega SQL sem a skill de banco |
| `banco-escrita` | pede confirmação para script, SQL ou migration que grava no banco |
| `qualidade` | acorda o Claude com problema **novo** de lint/typecheck |
| `lembretes` | lembra teste, doc e print pendentes no fim da resposta |
| `formatar` | roda o formatador no arquivo editado, só se a config dele existir (desligado por padrão) |

## Skills

O template traz só o essencial:

| Skill | Para quê | Origem |
|---|---|---|
| `start-project` | entrevista e monta o harness deste template | própria |
| `security-and-hardening` | preventiva: modelo de ameaça + regras ao escrever código sensível | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (MIT) |
| `security-review` | auditoria: revisa o diff, só reporta o explorável | [getsentry/skills](https://github.com/getsentry/skills) (Apache-2.0) |

As outras vêm do **[pack-skills](https://github.com/GustavoWallacy/pack-skills)**,
separadas por categoria (front-end, banco de dados, fluxo, marketing). Na
entrevista, o `/start-project` pergunta categoria por categoria e instala só
as escolhidas. Configuração em
`claude/skills/start-project/references/pacote-skills.md`.

## Contribuir

Mudança que vale para todo projeto (pergunta nova na entrevista, regra
genérica, hook novo) entra **aqui**, por branch + pull request. A cópia de
cada projeto é dele e não é sincronizada.
