// Hook — PostToolUse (Edit|Write|MultiEdit).
// Roda o formatador do projeto no arquivo que acabou de ser editado, para o
// diff ficar no estilo do repositório sem gastar uma volta do Claude.
// Silencioso: se o formatador falhar ou não existir, não faz nada.
// Configuração: config.cjs → formatar (desligado por padrão).
//
// Só formata se a configuração do formatador existir no projeto
// (`exigeConfig`): sem ela, o formatador aplica o estilo padrão dele e
// reescreve o arquivo inteiro num estilo que o projeto não usa.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { PROJETO, config, lerEntrada, relativo } = require('./lib.cjs');

const CFG = config('formatar');
if (!CFG.ativo) process.exit(0);

const entrada = lerEntrada();
const rel = relativo((entrada.tool_input || {}).file_path, entrada.cwd);
if (!rel) process.exit(0);

const IGNORAR = CFG.ignorar instanceof RegExp ? CFG.ignorar : /\.(?:md|mdx)$|(?:^|\/)(?:\.claude|docs)\//;
if (IGNORAR.test(rel)) process.exit(0);

const comando = (CFG.comandos || {})[path.extname(rel)];
if (!Array.isArray(comando) || !comando.length) process.exit(0);

/** Algum item existe? "arquivo" ou "arquivo#trecho" (trecho dentro do arquivo). */
function temConfig(lista) {
  if (!Array.isArray(lista) || !lista.length) return true;
  return lista.some((item) => {
    const [arquivo, trecho] = String(item).split('#');
    const abs = path.join(PROJETO, arquivo);
    if (!fs.existsSync(abs)) return false;
    if (!trecho) return true;
    try {
      return fs.readFileSync(abs, 'utf8').includes(trecho);
    } catch {
      return false;
    }
  });
}

if (!temConfig(CFG.exigeConfig)) process.exit(0);

const [exe, ...args] = comando;
spawnSync(exe, [...args, rel], {
  cwd: PROJETO,
  stdio: 'ignore',
  timeout: 25000,
  windowsHide: true,
  shell: process.platform === 'win32', // npx/ruff no Windows são .cmd
});
process.exit(0);
