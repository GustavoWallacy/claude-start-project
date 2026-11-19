// Hook — Stop, só lembra (CLAUDE.md §3 e §4).
// Lê o que a resposta fez (transcript desde o último Stop) e, uma vez por
// arquivo na sessão, lembra: teste para mudança de código, documentação para
// mudança de código e conferência por print para mudança de tela.
// Configuração: config.cjs → lembretes.
'use strict';
const path = require('path');
const { config, lerEntrada, dirSessao, lerJson, gravarJson, usosDoTranscript, arquivoEditado } = require('./lib.cjs');

const CFG = config('lembretes');
if (!CFG.ativo) process.exit(0);

const entrada = lerEntrada();
if (entrada.stop_hook_active) process.exit(0);

const dir = dirSessao(entrada.session_id);
const arqEstado = path.join(dir, 'lembretes.json');
const estado = lerJson(arqEstado, { offset: 0, lembrados: {} });
const { usos, total } = usosDoTranscript(entrada.transcript_path, estado.offset);
estado.offset = total;

const editados = new Set();
const comandos = [];
let tirouPrint = false;
for (const uso of usos) {
  const rel = arquivoEditado(uso);
  if (rel) editados.add(rel);
  if (uso.nome === 'Bash' || uso.nome === 'PowerShell') comandos.push(String(uso.entrada.command || ''));
  if (/playwright.*screenshot|screenshot/i.test(uso.nome)) tirouPrint = true;
}

const lista = [...editados];
const comPrefixo = (prefixos) => (f) => (prefixos || []).some((p) => f === p || f.startsWith(p));
const ehTeste = (f) => comPrefixo(CFG.pastasDeTeste)(f) || /\.(?:test|spec|e2e)\.[cm]?[jt]sx?$|(?:^|\/)test_[^/]+\.py$/.test(f);
const ehDoc = comPrefixo(CFG.pastasDeDoc);

const rodouTeste = CFG.comandoDeTeste ? comandos.some((c) => CFG.comandoDeTeste.test(c)) : false;
const mexeuEmTeste = lista.some(ehTeste);
const mexeuEmDoc = lista.some(ehDoc);

const mudou = (n) => `${n.join(', ')} ${n.length > 1 ? 'mudaram' : 'mudou'}`;

/** Arquivos ainda não lembrados nesta categoria (marca como lembrados). */
function novos(categoria, arquivos) {
  const ja = new Set(estado.lembrados[categoria] || []);
  const pendentes = arquivos.filter((f) => !ja.has(f));
  estado.lembrados[categoria] = [...ja, ...pendentes];
  return pendentes;
}

const lembretes = [];

const comTeste = lista.filter((f) => comPrefixo(CFG.codigoComTeste)(f) && !ehTeste(f) && !ehDoc(f));
if (comTeste.length && !rodouTeste && !mexeuEmTeste) {
  const n = novos('teste', comTeste);
  if (n.length) {
    lembretes.push(
      `Teste: ${mudou(n)} sem teste criado nem rodado. Bug corrigido → teste de regressão que falha antes ` +
        'e passa depois; regra ou rota alterada → rode a suíte do domínio (CLAUDE.md §3, .claude/rules/testes.md).',
    );
  }
}

const comDoc = lista.filter((f) => comPrefixo(CFG.codigoComDoc)(f) && !ehTeste(f) && !ehDoc(f));
if (comDoc.length && !mexeuEmDoc) {
  const n = novos('doc', comDoc);
  if (n.length) {
    lembretes.push(
      `Documentação: ${mudou(n)}. Se o que existe mudou (endpoint, tabela, regra, tela) → ` +
        'docs/arquitetura/<domínio>.md; se mudou como se trabalha → CLAUDE.md ou .claude/rules/ (CLAUDE.md §4).',
    );
  }
}

if (CFG.telas instanceof RegExp) {
  const telas = lista.filter((f) => CFG.telas.test(f));
  if (telas.length && !tirouPrint) {
    const n = novos('print', telas);
    if (n.length) {
      lembretes.push(
        `Tela: ${mudou(n)} e não houve print. Confira desktop e celular com o Playwright (CLAUDE.md §4).`,
      );
    }
  }
}

gravarJson(arqEstado, estado);
if (!lembretes.length) process.exit(0);

process.stdout.write(
  JSON.stringify({
    decision: 'block',
    reason:
      `[harness] Antes de encerrar:\n- ${lembretes.join('\n- ')}\n` +
      'Faça o que se aplica; o que não se aplicar (ex.: mudança sem efeito visual ou sem regra nova), diga em uma linha ao usuário.',
  }),
);
