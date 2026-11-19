# Pacote de skills do GitHub

Repositório com as skills que o usuário mais usa, para instalar em projetos
novos além das que já vêm no template.

```yaml
repositorio: ""        # ex.: https://github.com/<usuario>/<repo-de-skills>
branch: "main"
pasta: "skills"        # pasta do repo onde fica uma subpasta por skill
```

> **Vazio por enquanto.** Com `repositorio: ""`, a Rodada 5.2 da entrevista
> só informa que não há pacote configurado e segue. Para ativar, preencha o
> bloco acima no repositório do template (por PR), não só na cópia do projeto.

## Procedimento (quando preenchido)

1. Clone raso numa pasta temporária vazia, fora do projeto:
   `git clone --depth 1 --branch <branch> <repositorio> <temp>/pacote-skills`.
2. Liste `<pasta>/*/SKILL.md` e mostre ao usuário nome + `description` de
   cada uma (Rodada 5.2).
3. Para cada skill escolhida, **leia o SKILL.md e veja se há `scripts/`**
   antes de copiar — skill é instrução que o agente vai seguir; script é
   código que vai rodar. Algo inesperado (download, rede, comando
   destrutivo) → mostre ao usuário e pergunte.
4. Copie `<pasta>/<skill>/` para `.claude/skills/<skill>/` do projeto. Já
   existe uma com o mesmo nome → pergunte qual fica.
5. Acrescente `Skill(<skill>)` em `permissions.allow` do
   `.claude/settings.json`.
6. Apague o clone temporário.
