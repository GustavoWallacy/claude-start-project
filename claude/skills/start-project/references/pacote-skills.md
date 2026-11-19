# Pacote de skills (repositório pack-skills)

Repositório com as skills recomendadas, separadas por categoria. O template
traz só `start-project` + as duas de segurança; o resto vem daqui na
Rodada 5.

```yaml
repositorio: "https://github.com/GustavoWallacy/pack-skills"
branch: "main"
```

## Como o repositório é organizado

```
<categoria>/            front-end · banco-de-dados · seguranca · fluxo · marketing
  README.md             o que tem na categoria
  externas.yaml         skills de terceiros: nome, para-que, repositorio, pasta | instalar, licenca
  <skill>/SKILL.md      skill guardada no próprio repositório (📁)
```

- **📁 guardada aqui** — pasta `<categoria>/<skill>/` com `SKILL.md`.
- **🔗 de terceiros** — item do `externas.yaml` com `pasta` (caminho da
  skill no repositório de origem).
- **🔗 com instalador próprio** — item com `instalar` (comando oficial) em
  vez de `pasta`. O autor pede para não copiar os arquivos.

Leia o repositório na hora: categorias e skills mudam. Não confie numa lista
escrita aqui.

## Procedimento

1. **Baixe** numa pasta temporária vazia, fora do projeto:
   `git clone --depth 1 --branch <branch> <repositorio> <temp>/pack-skills`.
   Falhou (sem rede/git) → avise, pule a Rodada 5.1 e siga; o projeto fica
   só com as skills do template.
2. **Monte o menu** — para cada categoria: o `README.md` (assunto), cada
   `<skill>/SKILL.md` (nome + `description`) e cada item do `externas.yaml`
   (nome + `para-que`). `seguranca/` já vem no template: não pergunte.
3. **Pergunte por categoria** (Rodada 5.1) — só as categorias que fazem
   sentido para o projeto (ver `entrevista.md`).
4. **Instale cada skill escolhida:**
   - **📁** → copie `<temp>/pack-skills/<categoria>/<skill>/` para
     `.claude/skills/<skill>/`.
   - **🔗 com `pasta`** → com Node disponível:
     `npx -y skills add <dono>/<repo> --skill <nome> -a claude-code -y --copy`
     (`<dono>/<repo>` = o `repositorio` sem `https://github.com/`). Sem
     Node: `git clone --depth 1 <repositorio> <temp>/<nome>-origem` e copie
     a `pasta` para `.claude/skills/<nome>/`.
   - **🔗 com `instalar`** → não rode você: o instalador faz perguntas no
     terminal. Mostre o comando e peça ao usuário para rodar com `!` na
     frente (ex.: `! npx @opengsd/gsd-core@latest`, escolhendo Claude Code
     e instalação no projeto).
   - Já existe uma skill com o mesmo nome → pergunte qual fica.
5. **Revise antes de manter** — leia o `SKILL.md` instalado e veja se há
   `scripts/`. Skill é instrução que o agente vai seguir; script é código
   que vai rodar. Algo inesperado (download, rede, comando destrutivo) →
   mostre ao usuário e pergunte antes de seguir.
6. **Permissão** — acrescente `Skill(<nome>)` em `permissions.allow` do
   `.claude/settings.json` para cada skill instalada.
7. **Limpe** — apague as pastas temporárias. O `skills-lock.json` que o
   `npx skills` cria na raiz **fica**: é ele que permite
   `npx skills update` depois. Cite no relatório.

## Skill exigida por hook

Projeto com banco SQL e hook `sql-skill` ligado → a skill de
`config.sql.skill` (padrão `supabase-postgres-best-practices`, em
`banco-de-dados/`) **precisa** ser instalada, senão o hook bloqueia toda
edição com SQL. Recusou → troque `config.sql.skill` pela skill de banco
escolhida ou desligue o hook, e diga isso no relatório.

## Melhorar o pacote

Skill nova, categoria nova ou link quebrado → pull request no
`pack-skills`, não na cópia do projeto.
