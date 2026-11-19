---
tags: [start-project]
max_turns: 80
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/start-project

Já copiei o template para cá. Para não precisar perguntar, aqui vão minhas respostas para a entrevista (use-as quando for perguntar; o que não estiver aqui, decida pelo padrão recomendado e me diga no final). Pode considerar o resumo da Fase 3 aprovado.

- Projeto: full-stack, loja de cursos online (catálogo, checkout, área do aluno). Vai crescer, time de 4 devs.
- Banco: Postgres. O localhost usa um banco de desenvolvimento próprio, não a produção. Migrations com `npm run db:migrate` (node-pg-migrate).
- Integrações: webhook do gateway de pagamento grava em `pedidos`; o n8n lê `pedidos` para mandar e-mail.
- Testes: vitest. E2E em banco de teste separado (DATABASE_URL_TEST). Bug corrigido sempre ganha teste de regressão. Testes em server/tests, rodam com `npm test`.
- Segurança: login (JWT), perfis (aluno/admin), dados pessoais dos alunos, pagamento via webhook. Bloquear edição sensível sem a skill. Caminhos: server/src/routes, server/src/middleware.
- Auditoria: não por enquanto.
- Skills: tirar apple-hig-designer e dashboard-bi. Manter o resto.
- Plano por etapa: sim, sempre.
- Hooks: todos, menos o formatador.
- Deploy: Docker no EasyPanel, deploy pelo push na main.

Input files: package.json, tsconfig.json, server/, src/, migrations/, README.md, .env.example
