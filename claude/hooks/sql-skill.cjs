// Hook — PreToolUse (Edit|Write|MultiEdit).
// Edição que escreve SQL exige a skill de banco carregada nesta sessão
// (CLAUDE.md §2). Sem ela, a edição é negada e o Claude recebe o motivo para
// carregar a skill e repetir. Configuração: config.cjs → sql.
'use strict';
const fs = require('fs');
const path = require('path');
const { config, lerEntrada, relativo, dirSessao, skillCarregada, textosDaEdicao, decidir } = require('./lib.cjs');

const CFG = config('sql');
if (!CFG.ativo) process.exit(0);
const SKILL = CFG.skill || 'supabase-postgres-best-practices';

const PADRAO =
  '\\b(?:SELECT\\b[\\s\\S]{0,400}?\\bFROM|INSERT\\s+INTO|UPDATE\\s+[\\w."]+\\s+SET|DELETE\\s+FROM|CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:UNIQUE\\s+)?(?:TABLE|INDEX|FUNCTION|TRIGGER|VIEW|MATERIALIZED\\s+VIEW|POLICY|TYPE|EXTENSION|SEQUENCE)|ALTER\\s+(?:TABLE|FUNCTION|INDEX|VIEW|MATERIALIZED\\s+VIEW|TYPE)|DROP\\s+(?:TABLE|INDEX|FUNCTION|TRIGGER|VIEW|MATERIALIZED\\s+VIEW|COLUMN|TYPE|POLICY)|REFRESH\\s+MATERIALIZED\\s+VIEW|ON\\s+CONFLICT)\\b';
// soMaiuscula: casar só SQL em MAIÚSCULA evita falso positivo em código comum ("select from list").
const SQL = new RegExp(PADRAO, CFG.soMaiuscula === false ? 'i' : '');

const EXTENSOES = /\.(?:sql|ts|tsx|js|mjs|cjs|py|go|rb|php|java|kt|cs)$/;
const PASTAS = CFG.pastas || [];

function tocaSql(rel, novo) {
  if (!rel || !EXTENSOES.test(rel)) return false;
  if (rel.endsWith('.sql')) return true;
  if (PASTAS.length && !PASTAS.some((p) => rel.startsWith(p))) return false;
  return SQL.test(novo);
}

const entrada = lerEntrada();
const rel = relativo((entrada.tool_input || {}).file_path, entrada.cwd);
const { novo } = textosDaEdicao(entrada.tool_name, entrada.tool_input);
if (!tocaSql(rel, novo)) process.exit(0);

const marcador = path.join(dirSessao(entrada.session_id), `skill-${SKILL}.ok`);
if (fs.existsSync(marcador)) process.exit(0);
if (skillCarregada(entrada.transcript_path, SKILL)) {
  fs.writeFileSync(marcador, new Date().toISOString());
  process.exit(0);
}

decidir(
  'deny',
  `[harness] ${rel} recebe SQL, mas a skill ${SKILL} ainda não foi carregada nesta sessão ` +
    '(CLAUDE.md §2). Carregue-a com a ferramenta Skill, revise o SQL pelas regras dela e repita a edição.',
);
