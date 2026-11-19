// Hook — PreToolUse (Edit|Write|MultiEdit).
// Nega edição que ESCREVE segredo literal (chave de API, token, chave
// privada, senha em connection string) fora dos arquivos de ambiente. Só olha
// o texto novo: segredo que já estava no arquivo não trava a edição.
// Configuração: config.cjs → segredos.
'use strict';
const { config, lerEntrada, relativo, textosDaEdicao, decidir } = require('./lib.cjs');

const CFG = config('segredos');
if (!CFG.ativo) process.exit(0);

const PADROES = [
  { nome: 'chave privada', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { nome: 'AWS access key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { nome: 'token do GitHub', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { nome: 'chave da Anthropic', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { nome: 'chave da OpenAI', re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/ },
  { nome: 'token do Slack', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}/ },
  { nome: 'chave do Google', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { nome: 'chave do Stripe', re: /\b[rs]k_live_[A-Za-z0-9]{20,}/ },
  { nome: 'senha em connection string', re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^:\s/'"]+:([^@\s'"]{6,})@/ },
  {
    nome: 'segredo atribuído literal',
    re: /\b(?:api[_-]?key|secret|client[_-]?secret|password|passwd|senha|access[_-]?token|auth[_-]?token|private[_-]?key)\b["']?\s*[:=]\s*["']([^"'\s]{12,})["']/i,
  },
];

// Valores que são claramente exemplo/placeholder.
const PLACEHOLDER = /^(?:x+|\*+|\.{3,}|<[^>]+>|\$\{[^}]+\}|your[_-]|seu[_-]|sua[_-]|changeme|example|exemplo|placeholder|test|dummy|fake|process\.env|os\.environ)/i;

const entrada = lerEntrada();
const rel = relativo((entrada.tool_input || {}).file_path, entrada.cwd);
if (!rel) process.exit(0);
if (CFG.permitir instanceof RegExp && CFG.permitir.test(rel)) process.exit(0);

const { novo, antigo } = textosDaEdicao(entrada.tool_name, entrada.tool_input);
const achados = [];
for (const { nome, re } of PADROES) {
  const m = String(novo || '').match(re);
  if (!m) continue;
  const valor = m[1] || m[0];
  if (PLACEHOLDER.test(valor)) continue;
  if (antigo && antigo.includes(m[0])) continue; // já estava lá
  achados.push(nome);
}
if (!achados.length) process.exit(0);

decidir(
  'deny',
  `[harness · segredos] ${rel} receberia ${[...new Set(achados)].join(', ')} escrito no código. ` +
    'Leia o valor de variável de ambiente (.env fora do git) e deixe só o nome da variável / um placeholder ' +
    'no .env.example. Se for falso positivo (valor de teste, fixture), troque por um placeholder óbvio ou diga ao usuário.',
);
