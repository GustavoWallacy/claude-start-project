---
tags: [start-project]
max_turns: 80
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/start-project

O template já está aqui. Respostas para a entrevista (use quando for perguntar; o resto pelo recomendado, me avise no fim). Pode considerar a Fase 3 aprovada.

- Projeto: só backend, API de agendamento de uma clínica (FastAPI + SQLAlchemy). Pequeno, eu e mais uma pessoa.
- Banco: Postgres. Atenção: o localhost usa o banco de PRODUÇÃO. Migrations com `alembic upgrade head`.
- Integrações: nenhuma.
- Testes: pytest, e2e no banco real em transação com rollback. Regressão em bug corrigido: sim. Testes em tests/, rodam com `pytest`.
- Segurança: login (JWT) e dados pessoais de pacientes (nome, CPF). Bloquear. Caminhos: app/routes e app/auth.py.
- Auditoria: não.
- Skills: manter supabase-postgres-best-practices; tirar dashboard-bi, metrics-analyst e apple-hig-designer.
- Plano por etapa: só em tarefa grande.
- Hooks: segredos, segurança, SQL, escrita no banco, lembretes e formatador com ruff. Sem lint/typecheck por enquanto.
- Deploy: não se aplica ainda.

Input files: pyproject.toml, app/, tests/, alembic/, README.md, .env.example
