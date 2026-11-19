// Hook — PreToolUse (Bash|PowerShell).
// Comando que roda script com SQL de escrita (INSERT, UPDATE, DELETE, DDL…)
// ou SQL inline de escrita pede confirmação do usuário. A regra de permissão
// só vê `npx tsx x.ts`; este hook abre o script e procura a escrita.
// Testes (config.cjs → bancoEscrita.padraoTeste, `npm test`) ficam de fora:
// rodam em transação ou em banco de teste (.claude/rules/testes.md).
'use strict';
const fs = require('fs');
const path = require('path');
const { PROJETO, config, lerEntrada, decidir } = require('./lib.cjs');

const CFG = config('bancoEscrita');
if (!CFG.ativo) process.exit(0);
const AMBIENTE = CFG.ambiente || 'PRODUÇÃO';
const PADRAO_TESTE = CFG.padraoTeste instanceof RegExp ? CFG.padraoTeste : /\.(?:e2e|test|spec)\.[cm]?[jt]s$/;

const ESCRITA =
  /\b(?:INSERT\s+INTO|UPDATE\s+[\w."]+\s+SET|DELETE\s+FROM|TRUNCATE\b|ALTER\s+(?:TABLE|FUNCTION|INDEX|VIEW|MATERIALIZED\s+VIEW|TYPE|SEQUENCE)|DROP\s+(?:TABLE|INDEX|FUNCTION|TRIGGER|VIEW|MATERIALIZED\s+VIEW|TYPE|POLICY|SCHEMA|DATABASE)|CREATE\s+(?:OR\s+REPLACE\s+)?(?:UNIQUE\s+)?(?:TABLE|INDEX|FUNCTION|TRIGGER|VIEW|MATERIALIZED\s+VIEW|POLICY|TYPE|SEQUENCE)|REFRESH\s+MATERIALIZED\s+VIEW|REINDEX\b|VACUUM\b)/gi;

// Runner de migration: grava no banco sem SQL visível no comando.
const MIGRADOR_PADRAO =
  /\b(?:alembic\s+(?:upgrade|downgrade|stamp)|prisma\s+(?:migrate\s+(?:dev|deploy|reset|resolve)|db\s+(?:push|execute|seed))|node-pg-migrate(?:\s+\S+)*?\s+(?:up|down|redo)|knex\s+(?:migrate:(?:latest|up|down|rollback)|seed:run)|sequelize(?:-cli)?\s+db:(?:migrate|seed)|typeorm(?:-ts-node-\w+)?\s+(?:migration:(?:run|revert)|schema:(?:sync|drop))|drizzle-kit\s+(?:push|migrate)|supabase\s+(?:db\s+(?:push|reset)|migration\s+up)|flyway\s+(?:migrate|clean|repair)|liquibase\s+update|(?:rails|rake)\s+db:(?:migrate|rollback|reset|seed|schema:load)|manage\.py\s+(?:migrate|flush|loaddata)|goose(?:\s+\S+)*?\s+(?:up|down|reset)|dbmate\s+(?:up|down|migrate|rollback)|diesel\s+migration\s+(?:run|revert|redo)|sqlx\s+migrate\s+run|mikro-orm\s+migration:(?:up|down)|\bmigrate\s+(?:-path|-source|-database)\b[^|;&]*?\s(?:up|down|force|drop)\b)/i;
const MIGRADOR = CFG.migradores instanceof RegExp ? CFG.migradores : MIGRADOR_PADRAO;

// Só olha comandos que podem executar código ou SQL.
const EXECUTOR = /\b(?:node|tsx|ts-node|psql|mysql|sqlite3|npx|npm|pnpm|yarn|bun|deno|python|py)\b/;

// Arquivo EXECUTADO (não qualquer arquivo citado: `npx eslint rota.ts` só lê).
const EXECUTADO = [
  /\b(?:node|tsx|ts-node|bun|python|py)(?:\s+watch)?(?:\s+--?[\w-]+(?:[= ](?![^\s"']+\.(?:mjs|cjs|js|mts|cts|ts|py)\b)\S+)?)*\s+["']?([^\s"';|&<>()]+\.(?:mjs|cjs|js|mts|cts|ts|py))\b/g,
  /\b(?:psql|mysql|sqlite3)\b[^|;&]*?(?:-f\s*|--file[= ]|<\s*)["']?([^\s"';|&<>()]+\.sql)\b/g,
];

/** Resolve cada arquivo executado contra a 1ª base em que ele existe. */
function arquivosExecutados(texto, bases) {
  const saida = [];
  for (const re of EXECUTADO) {
    for (const m of texto.matchAll(re)) {
      const achado = bases.map((b) => path.resolve(b, m[1])).find((abs) => fs.existsSync(abs));
      if (achado) saida.push(achado);
    }
  }
  return saida;
}

const LIMITE_BYTES = 2 * 1024 * 1024;

function trechos(texto) {
  const achados = new Set();
  for (const m of texto.matchAll(ESCRITA)) {
    achados.add(texto.slice(m.index, m.index + 60).replace(/\s+/g, ' ').trim());
    if (achados.size >= 3) break;
  }
  return [...achados];
}

/** Arquivos executados por `npm run <script>` (exceto test*), lidos do package.json. */
function arquivosDeNpmRun(comando, bases) {
  const saida = [];
  const re = /\b(?:npm|pnpm|yarn|bun)\s+(?:--prefix\s+(\S+)\s+)?run(?:-script)?\s+([\w:.-]+)/g;
  for (const m of comando.matchAll(re)) {
    const nome = m[2];
    if (nome === 'test' || nome.startsWith('test:')) continue;
    const candidatos = m[1] ? [path.resolve(bases[0], m[1]), ...bases] : bases;
    for (const dir of candidatos) {
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      } catch {
        continue;
      }
      const script = pkg.scripts && pkg.scripts[nome];
      if (!script) continue;
      const mig = script.match(MIGRADOR);
      if (mig) migracoes.push(`npm run ${nome} → ${mig[0].trim()}`);
      saida.push(...arquivosExecutados(script, [dir]));
      break;
    }
  }
  return saida;
}

const migracoes = [];
const entrada = lerEntrada();
const comando = String((entrada.tool_input || {}).command || '');
const migInline = comando.match(MIGRADOR);
if (migInline) migracoes.push(migInline[0].trim());
if (!EXECUTOR.test(comando) && !migracoes.length) process.exit(0);
if (/^\s*(?:cd\s+\S+\s*(?:&&|;)\s*)?(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test\b/.test(comando)) process.exit(0);

const cwd = entrada.cwd || PROJETO;
// `cd server && npx tsx scripts/x.ts`: o caminho é relativo ao destino do cd.
const destinosCd = [...comando.matchAll(/\bcd\s+["']?([^\s"';&|]+)/g)].map((m) => path.resolve(cwd, m[1]));
const bases = [...destinosCd, cwd, PROJETO, ...(CFG.basesExtras || []).map((b) => path.join(PROJETO, b))];
const motivos = [];

const inline = trechos(comando);
if (inline.length) motivos.push(`comando: ${inline.join(' · ')}`);

const vistos = new Set();
for (const abs of [...arquivosExecutados(comando, bases), ...arquivosDeNpmRun(comando, bases)]) {
  if (vistos.has(abs) || PADRAO_TESTE.test(abs)) continue;
  vistos.add(abs);
  let conteudo;
  try {
    if (fs.statSync(abs).size > LIMITE_BYTES) continue;
    conteudo = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  const t = trechos(conteudo);
  const rel = path.relative(PROJETO, abs);
  const nome = rel.startsWith('..') ? abs : rel.split(path.sep).join('/');
  if (t.length) motivos.push(`${nome}: ${t.join(' · ')}`);
}

if (migracoes.length) motivos.unshift(`migration: ${[...new Set(migracoes)].join(' · ')}`);
if (!motivos.length) process.exit(0);

decidir(
  'ask',
  `⚠️ GRAVA NO BANCO (${AMBIENTE}) — ${motivos.join(' | ')}. ` + 'Aprove só se você autorizou esta escrita ou migration.',
);
