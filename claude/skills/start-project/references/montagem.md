# Montagem

Como cada resposta da entrevista vira arquivo. Escreva em português, frases
curtas e imperativas; nada de data, histórico ou "nesta sessão".

## Marcadores do template

| Marcador | O que fazer |
|---|---|
| `<!-- PREENCHER: instrução -->` | Troque por conteúdo real seguindo a instrução. Sem conteúdo para pôr → apague a linha inteira. |
| `<!-- SE x -->` … `<!-- FIM x -->` | Condição verdadeira → mantenha o miolo e apague os dois marcadores. Falsa → apague o bloco inteiro. Também vale dentro de uma linha. |

Condições:

| Condição | Verdadeira quando |
|---|---|
| `frontend` | Rodada 1 = front só ou full-stack |
| `backend` | Rodada 1 = back só, full-stack ou script com servidor |
| `banco` | Rodada 2.1 ≠ Nenhum |
| `acesso` | Rodada 4.1 marcou login/sessão ou perfis |
| `auditoria` | Rodada 4.4 = sim |
| `plano-por-etapa` | Rodada 6.1 = sim / só em tarefa grande (escreva a variante) |
| `deploy` | Rodada 6.4 deu uma forma de deploy |
| `e2e-transacao` · `e2e-banco-separado` · `sem-banco` | Rodada 3.2 (exatamente um) |

## CLAUDE.md

- **Cabeçalho:** nome, 2–4 linhas de o que é + stack.
- **Comandos:** só comandos que existem (confira `package.json`/Makefile);
  marque ⚠️ o que toca banco real ou serviço externo. Inclua como rodar uma
  suíte só.
- **Mapa:** 3–6 bullets de pasta → papel, só o que não é óbvio.
- **§2:** a skill de banco pelo nome real; skills obrigatórias da Rodada 5.3.
- **§3:** regras universais do domínio (caixa do dado, fuso, moeda) só se o
  usuário citou; regra de uma área vai para a regra da área.
- **Banco de produção no localhost** (Rodada 2.2): acrescente no §3 "O
  localhost usa o banco de PRODUÇÃO: script e clique que gravam são reais" e
  ⚠️ no comando de dev.
- **§4:** comandos reais de lint/typecheck. Se a base já tem dívida
  (rode-os uma vez para saber), escreva "compare com o antes, não exija verde
  global".
- **Automático:** reflita exatamente os hooks ligados.
- **Tabela de regras:** uma linha por arquivo em `.claude/rules/`.
- Alvo ≤ 150 linhas. Passou → mova o que é de uma área só para a regra dela.

## .claude/rules/

- `testes.md`: resolva os blocos; `paths:` com os globs reais dos testes;
  primeira linha com framework + onde moram.
- `seguranca.md`: `paths:` com os caminhos sensíveis confirmados; linha do
  que é sensível; tire do "Nunca/Sempre" o que não se aplica à stack (ex.:
  CORS num CLI).
- Uma regra por área com regra própria (ex.: `backend.md`, `frontend.md`,
  `<domínio>.md`), no formato de `modelo-regra.md`. Projeto novo e vazio:
  crie só `testes.md` e `seguranca.md`; as outras nascem quando a área
  ganhar regra.
- **Nunca** deixe arquivo em `.claude/rules/` sem `paths:` a menos que deva
  carregar em toda sessão (aí ele pertence ao CLAUDE.md).

## docs/

- `ARQUITETURA.md`: nome + uma linha por domínio que já existe.
- `docs/arquitetura/<domínio>.md`: o que existe hoje (endpoints, tabelas,
  telas, jobs, integrações, quem acessa). Projeto vazio → só o índice com a
  tabela vazia e o aviso "domínio novo ganha arquivo novo".

## Hooks — `.claude/hooks/config.cjs`

| Bloco | De onde vem |
|---|---|
| `nomeProjeto` | nome da Rodada 1 em kebab-case |
| `qualidade` | stack JS/TS → `eslint` se instalado, `tsconfigs` reais (um por projeto TS: app, server…). Outra stack → `ativo: false` e anote no relatório "adaptar lint/typecheck para <stack>" |
| `lembretes` | `codigoComTeste`/`codigoComDoc` = pastas de código; `pastasDeTeste`/`comandoDeTeste` = Rodada 3.4; `telas` = regex das telas se frontend e o usuário quis print |
| `sql` | `ativo` = banco SQL; `skill` = skill de banco escolhida; `pastas` = onde mora SQL; `soMaiuscula` = só se o projeto escreve SQL em maiúscula (confira 2–3 queries) |
| `bancoEscrita` | `ativo` = banco; `ambiente` = Rodada 2.2; `padraoTeste` = padrão real dos testes; `basesExtras` = pasta do back; `migradores` só se o runner da Rodada 2.3 não estiver na lista padrão do hook. Não ponha `ask` de runner no `settings.json`: o hook já pede confirmação |
| `seguranca` | `ativo`/`modo` = Rodada 4.2; `caminhos` = Rodada 4.3 como regex sobre caminho relativo |
| `segredos` | ligado sempre (só desligue a pedido) |
| `formatar` | Rodada 6.3. `ativo: true` só com a config do formatador presente (ou criada nesta montagem); `exigeConfig` fica com a lista padrão; `.md` e `docs/` ficam em `ignorar`. **Não rode o formatador no projeto** para testar: o teste de fumaça usa um arquivo temporário |

`settings.json`:

- Tire as entradas dos hooks com `ativo: false` (evita processo à toa).
- `permissions.allow`: acrescente os comandos de leitura/teste do projeto
  (`Bash(npm run *)`, `Bash(npx tsc *)`, `Bash(pytest *)`…) e as versões
  `PowerShell(...)` se o usuário usa Windows. Nunca libere `git push`/`commit`.
- `Skill(...)`: uma por skill que ficou.

Depois de editar, rode `node --check` em cada hook e o teste de fumaça do
README da pasta.

## Skills

- Apague as pastas recusadas na Rodada 5.1 (nunca `security-*`,
  `brainstorm`, `start-project`).
- Pacote do GitHub: procedimento em `pacote-skills.md`.

## .gitignore

Acrescente, se faltar:

```
.claude/settings.local.json
.env
.env.*
!.env.example
```

## Arquivos antigos

`CLAUDE.antigo.md` / `settings.antigo.json`: porte cada regra ainda válida
para o lugar certo (raiz ou regra da área), liste no relatório o que foi
descartado e por quê, e pergunte antes de apagar os antigos.
