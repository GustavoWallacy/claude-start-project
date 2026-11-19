// Hook — lint e typecheck, só avisa ("nenhum problema NOVO", CLAUDE.md §4).
//
//   node qualidade.cjs baseline   SessionStart, em segundo plano: fotografa os
//                                problemas que já existem (ESLint do projeto
//                                inteiro + tsc de cada tsconfig do config).
//   node qualidade.cjs check      Stop, em segundo plano (asyncRewake): se algum
//                                arquivo lintável mudou desde a última checagem,
//                                roda de novo e, havendo problema que não estava
//                                na foto, sai com código 2 — o Claude é acordado
//                                com a lista.
//
// Cada problema é avisado uma vez por sessão; a dívida antiga da base nunca
// aparece. Configuração: config.cjs → qualidade. Pronto para JS/TS.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { PROJETO, config, lerEntrada, relativo, dirSessao, dirCache, lerJson, gravarJson } = require('./lib.cjs');

const CFG = config('qualidade');
if (!CFG.ativo) process.exit(0);

const ESLINT = path.join(PROJETO, 'node_modules', 'eslint', 'bin', 'eslint.js');
const TSC = path.join(PROJETO, 'node_modules', 'typescript', 'bin', 'tsc');
const USA_ESLINT = CFG.eslint !== false && fs.existsSync(ESLINT);
const PROJETOS_TS = (CFG.tsconfigs || []).filter((p) => fs.existsSync(TSC) && fs.existsSync(path.join(PROJETO, p.tsconfig)));
if (!USA_ESLINT && !PROJETOS_TS.length) process.exit(0);

const EXTENSOES = new Set(CFG.extensoes || ['.ts', '.tsx']);
const lintavel = (arq) => EXTENSOES.has(path.extname(arq));
const SEP = '\u0000';
const MAX_LINHAS = 25;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function rodar(args) {
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, args, { cwd: PROJETO, windowsHide: true });
    let stdout = '';
    filho.stdout.on('data', (d) => (stdout += d));
    filho.stderr.on('data', () => {});
    filho.on('close', () => resolve(stdout));
    filho.on('error', () => resolve(''));
  });
}

/** Arquivos lintáveis alterados no working tree → "mtime:tamanho". */
function impressaoDigital() {
  const r = spawnSync('git', ['status', '--porcelain', '-uall', '-z'], { cwd: PROJETO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const partes = (r.stdout || '').split('\0');
  const mapa = {};
  for (let i = 0; i < partes.length; i++) {
    const p = partes[i];
    if (p.length < 4) continue;
    const xy = p.slice(0, 2);
    const arq = p.slice(3);
    if (xy.includes('R') || xy.includes('C')) i++; // -z: o caminho antigo vem na entrada seguinte
    if (!lintavel(arq)) continue;
    try {
      const st = fs.statSync(path.join(PROJETO, arq));
      mapa[arq] = `${st.mtimeMs}:${st.size}`;
    } catch {
      // apagado: não tem o que checar
    }
  }
  return mapa;
}

/** { arquivo: { "regra␀mensagem": [linhas] } } */
async function lint(arquivos) {
  if (!USA_ESLINT) return {};
  const cache = path.join(dirCache(), 'eslintcache');
  const alvo = arquivos.length ? arquivos : ['.'];
  const saida = await rodar([ESLINT, '-f', 'json', '--cache', '--cache-location', cache, '--no-warn-ignored', ...alvo]);
  let relatorio = [];
  try {
    relatorio = JSON.parse(saida);
  } catch {
    return {};
  }
  const res = {};
  for (const r of relatorio) {
    const arq = relativo(r.filePath);
    if (!arq || !r.messages.length) continue;
    const porChave = (res[arq] = {});
    for (const m of r.messages) {
      const chave = `${m.ruleId || 'parse'}${SEP}${m.message}`;
      (porChave[chave] = porChave[chave] || []).push(m.line || 0);
    }
  }
  return res;
}

/** { "arquivo␀TSxxxx␀mensagem": ["arquivo:linha"] } — sem número de linha na chave. */
async function typecheck() {
  const res = {};
  const cache = dirCache();
  await Promise.all(
    PROJETOS_TS.map(async (p) => {
      const saida = await rodar([
        TSC, '--noEmit', '-p', p.tsconfig, '--incremental',
        '--tsBuildInfoFile', path.join(cache, `${p.nome}.tsbuildinfo`), '--pretty', 'false',
      ]);
      for (const linha of saida.split(/\r?\n/)) {
        const m = linha.match(/^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/);
        if (!m) continue;
        const chave = [m[1].replace(/\\/g, '/'), m[3], m[4]].join(SEP);
        (res[chave] = res[chave] || []).push(`${m[1].replace(/\\/g, '/')}:${m[2]}`);
      }
    }),
  );
  return res;
}

function contar(mapa) {
  const res = {};
  for (const [k, v] of Object.entries(mapa)) res[k] = Array.isArray(v) ? v.length : contar(v);
  return res;
}

async function criarBaseline(dir) {
  const pendente = path.join(dir, 'baseline.pendente');
  fs.writeFileSync(pendente, String(process.pid));
  try {
    const impressao = impressaoDigital();
    const [eslint, tsc] = await Promise.all([lint([]), typecheck()]);
    gravarJson(path.join(dir, 'baseline.json'), {
      criadoEm: new Date().toISOString(),
      impressao,
      eslint: contar(eslint),
      tsc: contar(tsc),
    });
  } finally {
    fs.rmSync(pendente, { force: true });
  }
}

async function checar(dir) {
  const arqBase = path.join(dir, 'baseline.json');
  const pendente = path.join(dir, 'baseline.pendente');
  for (let i = 0; i < 120 && !fs.existsSync(arqBase) && fs.existsSync(pendente); i++) await esperar(2000);
  if (!fs.existsSync(arqBase)) {
    // Sessão aberta antes do hook existir: a foto é tirada agora e vale a partir da próxima resposta.
    await criarBaseline(dir);
    return 0;
  }

  const trava = path.join(dir, 'checagem.trava');
  try {
    if (Date.now() - fs.statSync(trava).mtimeMs < 5 * 60 * 1000) return 0;
  } catch {
    // sem trava
  }
  fs.writeFileSync(trava, String(process.pid));
  try {
    const base = lerJson(arqBase, {});
    const arqEstado = path.join(dir, 'qualidade.json');
    const estado = lerJson(arqEstado, { impressao: base.impressao || {}, avisados: [] });
    const atual = impressaoDigital();
    const mudados = Object.keys(atual).filter((f) => atual[f] !== estado.impressao[f]);
    estado.impressao = atual;
    if (!mudados.length) {
      gravarJson(arqEstado, estado);
      return 0;
    }

    const [eslint, tsc] = await Promise.all([lint(mudados), typecheck()]);
    const avisados = new Set(estado.avisados);

    const linhasLint = [];
    for (const [arq, chaves] of Object.entries(eslint)) {
      for (const [chave, linhas] of Object.entries(chaves)) {
        const novos = linhas.length - (((base.eslint || {})[arq] || {})[chave] || 0);
        const assinatura = `L${SEP}${arq}${SEP}${chave}${SEP}${linhas.length}`;
        if (novos <= 0 || avisados.has(assinatura)) continue;
        avisados.add(assinatura);
        const [regra, msg] = chave.split(SEP);
        const qtd = novos < linhas.length ? ` (${novos} novo(s) entre ${linhas.length})` : '';
        linhasLint.push(`${arq}:${linhas.join(',')} ${regra} — ${msg}${qtd}`);
      }
    }

    const linhasTsc = [];
    for (const [chave, locais] of Object.entries(tsc)) {
      const novos = locais.length - ((base.tsc || {})[chave] || 0);
      const assinatura = `T${SEP}${chave}${SEP}${locais.length}`;
      if (novos <= 0 || avisados.has(assinatura)) continue;
      avisados.add(assinatura);
      const [, codigo, msg] = chave.split(SEP);
      linhasTsc.push(`${locais.join(', ')} ${codigo} — ${msg}`);
    }

    estado.avisados = [...avisados];
    gravarJson(arqEstado, estado);
    if (!linhasLint.length && !linhasTsc.length) return 0;

    const blocos = [];
    if (linhasLint.length) blocos.push(`ESLint:\n- ${linhasLint.slice(0, MAX_LINHAS).join('\n- ')}`);
    if (linhasTsc.length) blocos.push(`Typecheck:\n- ${linhasTsc.slice(0, MAX_LINHAS).join('\n- ')}`);
    process.stderr.write(
      '[harness · qualidade] Problemas NOVOS desde o início da sessão (CLAUDE.md §4):\n' +
        `${blocos.join('\n')}\n` +
        'Só aviso: corrija os que vieram das suas mudanças; se algum não for seu ou ficar de propósito, diga ao usuário.',
    );
    return 2;
  } finally {
    fs.rmSync(trava, { force: true });
  }
}

const modo = process.argv[2];
const entrada = lerEntrada();
const dir = dirSessao(entrada.session_id);

(async () => {
  if (modo === 'baseline') {
    if (!fs.existsSync(path.join(dir, 'baseline.json')) && !fs.existsSync(path.join(dir, 'baseline.pendente'))) {
      await criarBaseline(dir);
    }
    return 0;
  }
  if (modo === 'check') return checar(dir);
  return 0;
})()
  .then((codigo) => {
    process.exitCode = codigo;
  })
  .catch(() => {
    process.exitCode = 0;
  });
