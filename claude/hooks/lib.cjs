// Utilitários compartilhados pelos hooks (ver README.md desta pasta).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJETO = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');

let CONFIG = {};
try {
  CONFIG = require('./config.cjs');
} catch {
  CONFIG = {};
}

/** Bloco de configuração de um hook; `ativo` ausente conta como ligado. */
function config(nome) {
  const c = CONFIG[nome] || {};
  return { ...c, ativo: c.ativo !== false };
}

/** JSON que o Claude Code manda no stdin do hook. */
function lerEntrada() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

/** Caminho relativo à raiz do projeto, sempre com "/"; null se estiver fora dele. */
function relativo(arquivo, base = PROJETO) {
  if (!arquivo) return null;
  const abs = path.resolve(base, String(arquivo));
  const rel = path.relative(PROJETO, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}

function garantirDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function raizEstado() {
  const nome = String(CONFIG.nomeProjeto || path.basename(PROJETO)).replace(/[^\w-]/g, '_');
  return path.join(os.tmpdir(), `claude-hooks-${nome}`);
}

/** Estado por sessão (offsets, baseline, marcadores) — fora do repo. */
function dirSessao(sessionId) {
  const id = String(sessionId || 'sem-sessao').replace(/[^\w-]/g, '_');
  return garantirDir(path.join(raizEstado(), id));
}

/** Cache que sobrevive entre sessões (tsbuildinfo, cache do ESLint). */
function dirCache() {
  return garantirDir(path.join(raizEstado(), '_cache'));
}

function lerJson(arquivo, padrao) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    return padrao;
  }
}

function gravarJson(arquivo, valor) {
  const tmp = `${arquivo}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(valor));
  fs.renameSync(tmp, arquivo);
}

/** Entrada do transcript que é um pedido digitado (não resultado de ferramenta). */
function ehPedido(e) {
  if (!e || e.type !== 'user' || !e.message) return false;
  const c = e.message.content;
  if (typeof c === 'string') return true;
  return Array.isArray(c) && c.some((item) => item && item.type === 'text');
}

/**
 * Usos de ferramenta do turno atual: depois do último pedido do usuário e a
 * partir da linha `desde`. Só lê linhas completas (o transcript é gravado de
 * forma assíncrona) e devolve `total` para o próximo `desde`.
 */
function usosDoTranscript(transcript, desde = 0) {
  let texto = '';
  try {
    texto = fs.readFileSync(transcript, 'utf8');
  } catch {
    return { usos: [], total: desde };
  }
  const linhas = texto.split('\n');
  const total = linhas.length - 1;
  const inicio = desde > total ? 0 : desde;
  let usos = [];
  for (let i = inicio; i < total; i++) {
    if (!linhas[i]) continue;
    let e;
    try {
      e = JSON.parse(linhas[i]);
    } catch {
      continue;
    }
    if (ehPedido(e)) {
      usos = [];
      continue;
    }
    const conteudo = e && e.message && e.message.content;
    if (!Array.isArray(conteudo)) continue;
    for (const item of conteudo) {
      if (item && item.type === 'tool_use') usos.push({ nome: item.name, entrada: item.input || {} });
    }
  }
  return { usos, total };
}

/**
 * A skill foi carregada nesta sessão? Procura no transcript a chamada da
 * ferramenta Skill ou o comando `/skill` digitado pelo usuário.
 */
function skillCarregada(transcript, skill) {
  let texto = '';
  try {
    texto = fs.readFileSync(transcript, 'utf8');
  } catch {
    return false;
  }
  if (!texto.includes(skill)) return false;
  const comando = `<command-name>/${skill}`;
  for (const linha of texto.split('\n')) {
    if (!linha.includes(skill)) continue;
    let e;
    try {
      e = JSON.parse(linha);
    } catch {
      continue;
    }
    const conteudo = e && e.message && e.message.content;
    if (typeof conteudo === 'string') {
      if (conteudo.includes(comando)) return true;
      continue;
    }
    if (!Array.isArray(conteudo)) continue;
    for (const item of conteudo) {
      if (item.type === 'tool_use' && item.name === 'Skill' && String((item.input || {}).skill || '').includes(skill)) return true;
      if (item.type === 'text' && String(item.text || '').includes(comando)) return true;
    }
  }
  return false;
}

const FERRAMENTAS_DE_EDICAO = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

/** Arquivo editado por um uso de ferramenta (relativo ao projeto) ou null. */
function arquivoEditado(uso) {
  if (!FERRAMENTAS_DE_EDICAO.has(uso.nome)) return null;
  return relativo(uso.entrada.file_path || uso.entrada.notebook_path);
}

/** Texto que a edição escreve e o texto que ela substitui. */
function textosDaEdicao(toolName, toolInput) {
  const i = toolInput || {};
  if (toolName === 'Edit') return { novo: i.new_string || '', antigo: i.old_string || '' };
  if (toolName === 'MultiEdit') {
    const edits = Array.isArray(i.edits) ? i.edits : [];
    return {
      novo: edits.map((e) => e.new_string || '').join('\n'),
      antigo: edits.map((e) => e.old_string || '').join('\n'),
    };
  }
  if (toolName === 'Write') return { novo: i.content || '', antigo: null };
  return { novo: '', antigo: '' };
}

/** Conteúdo do arquivo no HEAD (string vazia se não existir lá). */
function conteudoNoHead(rel) {
  const r = spawnSync('git', ['show', `HEAD:${rel}`], { cwd: PROJETO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : '';
}

function responder(objeto) {
  process.stdout.write(JSON.stringify(objeto));
}

/** Resposta de PreToolUse: 'deny' | 'ask' | 'allow', com o motivo. */
function decidir(decisao, motivo) {
  responder({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decisao, permissionDecisionReason: motivo },
  });
}

/** Contexto extra para o Claude, sem bloquear (PreToolUse/PostToolUse). */
function avisar(evento, texto) {
  responder({ hookSpecificOutput: { hookEventName: evento, additionalContext: texto } });
}

module.exports = {
  PROJETO,
  config,
  lerEntrada,
  relativo,
  dirSessao,
  dirCache,
  lerJson,
  gravarJson,
  usosDoTranscript,
  skillCarregada,
  arquivoEditado,
  textosDaEdicao,
  conteudoNoHead,
  responder,
  decidir,
  avisar,
};
