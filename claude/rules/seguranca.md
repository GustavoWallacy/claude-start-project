---
paths:
  # PREENCHER: globs do código sensível (cada um precisa casar com ≥1 arquivo).
  # Ex.: "server/src/routes/**", "server/src/middleware/**", "src/auth/**", "api/**"
  # Projeto com front: inclua também as telas que renderizam dado externo ou
  # tratam login (ex.: "src/pages/**", "src/auth/**"), senão o bloco "Tela" não carrega.
  - "**/auth/**"
  - "**/routes/**"
  - "**/middleware/**"
---

# Segurança — regras

<!-- PREENCHER: 1 linha — o que é sensível neste projeto (ex.: "login por JWT, dados de alunos (PII), pagamento via webhook"). -->

## Quando carregar cada skill

| Situação | Skill | Para quê |
|---|---|---|
| **Antes de escrever** código que recebe dado externo, mexe em auth/sessão/permissão, guarda segredo/PII, executa comando, renderiza HTML cru ou integra terceiro | `security-and-hardening` | modelo de ameaça (STRIDE) + regras "sempre / pergunte antes / nunca" |
| **Antes de entregar** mudança nessas áreas, ou quando pedirem revisão de segurança | `security-review` | revisão do diff com rastreio do dado; só reporta o que é explorável |
| Revisão da branch inteira antes de PR | `/security-review` (nativo do Claude Code) | segunda opinião sobre o diff da branch |

O hook `seguranca-skill.cjs` cobra a primeira linha: edição em caminho ou
conteúdo sensível sem a skill carregada é negada (ou avisada, conforme
`config.cjs → seguranca.modo`).

## Nunca

- Segredo literal no código, em log ou em mensagem de erro — vem de variável
  de ambiente (hook `segredos.cjs`).
- SQL, comando de shell ou caminho de arquivo montado por concatenação com
  dado do usuário — use parâmetro / lista de argumentos / caminho validado.
- Confiar no front para autorizar: **toda** rota confere no back quem é o
  usuário e se ele pode agir **sobre aquele registro** (não só "está logado").
- Devolver ao cliente stack trace, SQL ou detalhe interno no erro.
- Desligar verificação (TLS, assinatura de webhook, CSRF, CORS `*` com
  credencial) para "fazer funcionar".

## Sempre

- Validar dado externo na borda (schema/tipo/tamanho) antes de usar.
- Webhook confere assinatura/segredo compartilhado antes de processar.
- Senha com hash forte (bcrypt/argon2/scrypt); token com expiração.
- Menor privilégio: usuário do banco, chave de API e perfil só com o que
  precisam.
- Log de ação sensível sem PII crua (mascarar e-mail, CPF, cartão).

<!-- SE frontend -->
## Tela (front)

- Variável de ambiente do front (`VITE_*`, `NEXT_PUBLIC_*`, `REACT_APP_*`)
  vai para o código **público** do navegador: nada de segredo, só chave
  feita para ser pública (ex.: chave anon/publicável).
- HTML vindo de dado (usuário, API, CMS) não entra cru
  (`dangerouslySetInnerHTML`, `v-html`, `innerHTML`): sanitize
  (DOMPurify) ou renderize como texto.
- Link/redirect montado com dado externo aceita só `https:`/caminho
  relativo — nunca `javascript:` nem domínio arbitrário (open redirect).
- Esconder botão não é permissão: a tela só reflete o que o back autoriza.
- Token de sessão em cookie `HttpOnly` quando o back permitir; em
  `localStorage`, assuma que qualquer XSS o lê.
<!-- FIM frontend -->

## Pergunte antes

- Fluxo de autenticação novo ou alterado; perfil/permissão novo.
- Guardar categoria nova de dado sensível (PII, pagamento, saúde).
- Integração nova com serviço externo; mudança de CORS.
- Dependência nova que roda script na instalação.
