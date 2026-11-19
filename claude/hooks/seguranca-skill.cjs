// Hook — PreToolUse (Edit|Write|MultiEdit).
// Edição em código sensível (auth, sessão, rota, webhook, cripto, execução de
// comando, HTML cru…) exige a skill de segurança carregada nesta sessão
// (CLAUDE.md §2, .claude/rules/seguranca.md). Modo 'bloquear' nega a edição
// até a skill ser carregada; 'avisar' deixa passar e lembra o Claude.
// Configuração: config.cjs → seguranca.
'use strict';
const fs = require('fs');
const path = require('path');
const { config, lerEntrada, relativo, dirSessao, skillCarregada, textosDaEdicao, decidir, avisar } = require('./lib.cjs');

const CFG = config('seguranca');
if (!CFG.ativo) process.exit(0);
const SKILL = CFG.skill || 'security-and-hardening';

const CODIGO = /\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rb|php|java|kt|cs|rs|vue|svelte)$/;
const IGNORAR = /(?:^|\/)(?:node_modules|dist|build|\.next|coverage|vendor|\.claude)\/|\.(?:test|spec|e2e)\.[cm]?[jt]sx?$|(?:^|\/)test_[^/]+\.py$/;

function motivo(rel, novo) {
  if (!rel || !CODIGO.test(rel) || IGNORAR.test(rel)) return null;
  const caminho = (CFG.caminhos || []).find((re) => re instanceof RegExp && re.test(rel));
  if (caminho) return 'caminho sensível';
  if (CFG.conteudo instanceof RegExp) {
    const m = String(novo || '').match(CFG.conteudo);
    if (m) return `escreve \`${m[0].trim()}\``;
  }
  return null;
}

const entrada = lerEntrada();
const rel = relativo((entrada.tool_input || {}).file_path, entrada.cwd);
const { novo } = textosDaEdicao(entrada.tool_name, entrada.tool_input);
const porque = motivo(rel, novo);
if (!porque) process.exit(0);

const marcador = path.join(dirSessao(entrada.session_id), `skill-${SKILL}.ok`);
if (fs.existsSync(marcador)) process.exit(0);
if (skillCarregada(entrada.transcript_path, SKILL)) {
  fs.writeFileSync(marcador, new Date().toISOString());
  process.exit(0);
}

const texto =
  `[harness · segurança] ${rel} (${porque}) mexe em código sensível e a skill ${SKILL} ainda não foi ` +
  'carregada nesta sessão (CLAUDE.md §2, .claude/rules/seguranca.md). Carregue-a com a ferramenta Skill, ' +
  'confira a edição pelo modelo de ameaça e pelas regras "sempre / pergunte antes / nunca" dela';

if (CFG.modo === 'avisar') {
  avisar('PreToolUse', `${texto}.`);
} else {
  decidir('deny', `${texto} e repita a edição.`);
}
