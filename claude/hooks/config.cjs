// Configuração dos hooks — EDITE À MÃO para a stack do projeto.
// A skill /start-project preenche este arquivo a partir das respostas da
// entrevista; depois disso ele é do projeto (ninguém sincroniza).
//
// Todo hook lê daqui. Para desligar um hook: `ativo: false` aqui OU tire a
// entrada dele do .claude/settings.json. Caminhos são relativos à raiz do
// projeto, sempre com "/".
'use strict';

module.exports = {
  // Nome da pasta de estado em %TEMP% (vazio = nome da pasta do projeto).
  nomeProjeto: '',

  // qualidade.cjs — foto de lint/typecheck no início da sessão; no fim de cada
  // resposta, problema NOVO acorda o Claude. Pronto para JS/TS (ESLint + tsc).
  // Outra stack (Python, Go…): `ativo: false` ou adapte lint()/typecheck().
  qualidade: {
    ativo: true,
    eslint: true, // usa node_modules/eslint do projeto; sem ESLint instalado, pula
    extensoes: ['.ts', '.tsx', '.js', '.jsx'],
    // Um item por tsconfig que deve compilar sem erro novo. [] = sem typecheck.
    tsconfigs: [{ nome: 'app', tsconfig: 'tsconfig.json' }],
  },

  // lembretes.cjs — no fim da resposta, lembra (uma vez por arquivo) o que
  // ficou para trás: teste, documentação, print de tela.
  lembretes: {
    ativo: true,
    // Código cuja mudança pede teste (prefixos). [] = não lembra de teste.
    codigoComTeste: ['server/src/', 'src/'],
    // Onde moram os testes (mexer aqui conta como "criou teste").
    pastasDeTeste: ['tests/', 'server/tests/', 'src/__tests__/'],
    // Comando que conta como "rodou teste".
    comandoDeTeste: /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test\b|\btest:[\w-]+|\bpytest\b|\bvitest\b|\bjest\b|\bgo\s+test\b/,
    // Código cuja mudança pede documentação.
    codigoComDoc: ['server/src/', 'src/'],
    // Mexer aqui conta como "atualizou a doc".
    pastasDeDoc: ['docs/', '.claude/rules/', 'CLAUDE.md'],
    // Tela alterada sem print (Playwright) → lembrete. null = desligado.
    telas: null, // ex.: /^src\/.*\.(?:tsx|vue|svelte)$/
  },

  // sql-skill.cjs — edição que escreve SQL sem a skill de banco carregada é NEGADA.
  sql: {
    ativo: true,
    skill: 'supabase-postgres-best-practices',
    // Pastas onde SQL dentro de .ts/.js/.py conta (arquivo .sql conta em qualquer lugar).
    pastas: ['server/', 'supabase/', 'db/', 'migrations/', 'src/server/'],
    // true = só casa SQL em MAIÚSCULA (menos falso positivo; exige o padrão no projeto).
    soMaiuscula: true,
  },

  // banco-escrita.cjs — comando que roda script/SQL de escrita pede confirmação.
  bancoEscrita: {
    ativo: true,
    // Rótulo do banco que o localhost usa: 'PRODUÇÃO' (aviso forte) ou 'desenvolvimento'.
    ambiente: 'PRODUÇÃO',
    // Arquivos de teste que rodam em transação/banco de teste e ficam de fora.
    padraoTeste: /\.(?:e2e|test|spec)\.[cm]?[jt]s$|(?:^|[\\/])test_[^\\/]+\.py$/,
    // Pastas extras onde procurar o script citado no comando (ex.: 'server').
    basesExtras: ['server'],
    // Runner de migration (alembic, prisma migrate, node-pg-migrate, knex,
    // manage.py migrate…) já vem coberto. Outro runner: regex aqui (substitui a lista).
    // migradores: /\bmeu-runner\s+up\b/,
  },

  // seguranca-skill.cjs — edição em código sensível sem a skill de segurança carregada.
  seguranca: {
    ativo: true,
    // 'bloquear' = nega a edição até carregar a skill; 'avisar' = deixa passar e lembra.
    modo: 'bloquear',
    skill: 'security-and-hardening',
    // Caminho sensível (regex sobre o caminho relativo).
    caminhos: [
      /(?:^|\/)(?:auth|authentication|login|session|sessions|middleware|permissions?|acl|security|crypto)(?:\/|\.|$)/i,
      /(?:^|\/)(?:routes?|api|controllers?|handlers?|webhooks?)\//i,
    ],
    // Conteúdo novo sensível (regex sobre o texto que a edição escreve).
    conteudo:
      /\b(?:jwt|jsonwebtoken|bcrypt|argon2|scrypt|createHash|createCipheriv|randomBytes|child_process|execSync|spawnSync|dangerouslySetInnerHTML|innerHTML|eval\s*\(|new\s+Function\s*\(|cors\s*\(|setCookie|res\.cookie|subprocess|os\.system|pickle\.loads|yaml\.load\b)/i,
  },

  // segredos.cjs — nega edição que escreve chave/token/senha literal no código.
  segredos: {
    ativo: true,
    // Arquivos onde segredo literal é esperado (regex sobre o caminho relativo).
    permitir: /(?:^|\/)\.env(?:\.[\w-]+)?$(?<!\.example)|(?:^|\/)\.dev\.vars$/,
  },

  // formatar.cjs — depois de editar, roda o formatador do projeto no arquivo.
  // Extensão → comando (o caminho do arquivo é acrescentado no fim).
  formatar: {
    ativo: false,
    // Só formata se UM destes existir ("arquivo#trecho" = trecho dentro do
    // arquivo). Sem config, o formatador reescreve tudo no estilo padrão dele.
    // [] = formata sempre (só se o projeto já segue o padrão do formatador).
    exigeConfig: [
      '.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.yaml',
      'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs', 'package.json#"prettier"',
      'ruff.toml', '.ruff.toml', 'pyproject.toml#[tool.ruff', 'pyproject.toml#[tool.black',
      'biome.json', 'go.mod',
    ],
    // Caminhos que nunca são formatados (regex sobre o caminho relativo).
    ignorar: /\.(?:md|mdx)$|(?:^|\/)(?:\.claude|docs)\//,
    comandos: {
      // '.ts': ['npx', 'prettier', '--write'],
      // '.tsx': ['npx', 'prettier', '--write'],
      // '.py': ['ruff', 'format'],
      // '.go': ['gofmt', '-w'],
    },
  },
};
