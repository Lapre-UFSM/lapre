// Armazenamento do app: gravação segura, armazenamento persistente e cópia de segurança.
// Tudo fica no próprio aparelho (localStorage). Nada é enviado para a internet.

const PREFIXO_DADOS = 'lapre.';
const CHAVE_ULTIMO_BACKUP = 'lapre.ultimoBackup';

// Chaves cujo conteúdo estava danificado ao ler: o app não grava por cima delas (para não apagar o original).
const chavesBloqueadas = new Set();

// Lê uma lista guardada no aparelho.
// - chave que não existe: devolve [] (lista vazia, normal no primeiro uso)
// - conteúdo danificado (não é JSON ou não é lista): guarda o texto original em
//   "lapre.corrompido.<chave>.<data>", avisa uma vez, bloqueia a chave e devolve [].
//   Assim a próxima gravação NÃO apaga o original com uma lista vazia.
function ler(chave) {
  const bruto = localStorage.getItem(chave);
  if (bruto === null) return [];
  let v;
  try { v = JSON.parse(bruto); } catch (e) { v = undefined; }
  if (Array.isArray(v)) return v;
  if (v === null) return []; // "null" guardado: trata como vazio
  if (!chavesBloqueadas.has(chave)) {
    chavesBloqueadas.add(chave);
    const prefixo = 'lapre.corrompido.' + chave + '.';
    // não duplica a cópia se o mesmo texto já foi guardado antes
    const jaGuardado = Object.keys(localStorage).some(k => k.startsWith(prefixo) && localStorage.getItem(k) === bruto);
    if (!jaGuardado) {
      try { localStorage.setItem(prefixo + new Date().toISOString(), bruto); } catch (e) { /* sem espaço: o original continua na própria chave */ }
    }
    alert('ATENÇÃO: os dados guardados em "' + chave + '" estão danificados e não puderam ser lidos. ' +
      'O app guardou o texto original e não vai gravar por cima dele. Faça a cópia de segurança (Início > Cópia de segurança) e peça ajuda para recuperar.');
  }
  return [];
}

// Grava e AVISA se falhar (ex.: memória cheia, modo privado ou chave bloqueada). Devolve true se gravou.
function gravar(chave, valor) {
  if (chavesBloqueadas.has(chave)) { faixaFalha(true); return false; }
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    faixaFalha(false);
    return true;
  } catch (e) {
    faixaFalha(true);
    return false;
  }
}

// Faixa fixa no topo enquanto a última gravação tiver falhado (some quando uma gravação der certo).
// Substitui o alerta que aparecia uma vez só: assim ninguém continua digitando sem saber que não está salvando.
let ultimaGravacaoFalhou = false;
function faixaFalha(falhou) {
  ultimaGravacaoFalhou = falhou;
  if (typeof document === 'undefined' || !document.body) return; // teste automático (sem tela)
  let f = document.getElementById('faixa-falha');
  if (falhou && !f) {
    f = document.createElement('div');
    f.id = 'faixa-falha';
    f.className = 'faixa-topo erro';
    f.setAttribute('role', 'alert');
    f.innerHTML = 'Não está salvando neste aparelho. <a href="#/copia">Faça a cópia de segurança.</a>';
    document.body.prepend(f);
  }
  if (f) f.hidden = !falhou;
}

// Pede ao navegador para não apagar os dados do app sozinho quando faltar espaço.
// Em alguns celulares só funciona depois de instalar o app na tela inicial.
async function pedirPersistencia() {
  try {
    if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch (e) { /* navegador sem suporte: segue normal */ }
}
pedirPersistencia();

// Chaves que entram na cópia de segurança (tudo do app, menos o controle da própria cópia)
const chavesDoApp = () => Object.keys(localStorage).filter(k => k.startsWith(PREFIXO_DADOS) && k !== CHAVE_ULTIMO_BACKUP);

function gerarBackup() {
  const dados = {};
  chavesDoApp().forEach(k => { dados[k] = localStorage.getItem(k); });
  return JSON.stringify({ app: 'LAPRE', tipo: 'copia-de-seguranca', versao: 1, criado: new Date().toISOString(), dados }, null, 1);
}

// Baixa um arquivo no aparelho
function baixarArquivo(nome, conteudo, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  a.download = nome;
  a.click();
}

const dataArquivo = () => new Date().toISOString().slice(0, 10);

function baixarBackup(prefixoNome) {
  baixarArquivo(`${prefixoNome || 'lapre-copia'}-${dataArquivo()}.json`, gerarBackup(), 'application/json');
  try { localStorage.setItem(CHAVE_ULTIMO_BACKUP, new Date().toISOString()); } catch (e) { /* sem espaço: segue */ }
}

// Lê o arquivo de cópia. Devolve { dados } ou { erro }.
function lerBackup(texto) {
  let j;
  try { j = JSON.parse(texto); } catch (e) { return { erro: 'Arquivo inválido: não é uma cópia de segurança do app.' }; }
  if (!j || j.app !== 'LAPRE' || !j.dados) return { erro: 'Este arquivo não é uma cópia de segurança do app da LAPRE.' };
  const dados = {};
  const danificadas = [];
  Object.keys(j.dados).filter(k => k.startsWith(PREFIXO_DADOS)).forEach(k => {
    const v = j.dados[k];
    // cada valor precisa ser texto JSON válido; cópias de dados danificados (lapre.corrompido.*) entram como estão
    let ok = typeof v === 'string';
    if (ok && !k.startsWith('lapre.corrompido.')) { try { JSON.parse(v); } catch (e) { ok = false; } }
    if (ok) dados[k] = v; else danificadas.push(k);
  });
  if (danificadas.length) return { erro: 'A cópia tem partes danificadas (' + danificadas.join(', ') + '). Nada foi alterado no aparelho.' };
  return { dados, criado: j.criado };
}

// Troca os dados do aparelho pelos da cópia (só as partes que existem na cópia).
// Tudo ou nada: se alguma gravação falhar (ex.: falta espaço), volta exatamente ao que havia antes.
function restaurarBackup(dados) {
  const chaves = Object.keys(dados);
  const antes = {};
  chaves.forEach(k => { antes[k] = localStorage.getItem(k); });
  try {
    chaves.forEach(k => localStorage.setItem(k, dados[k]));
  } catch (e) {
    // primeiro apaga o que entrou (libera espaço), depois devolve os valores antigos
    chaves.forEach(k => { try { localStorage.removeItem(k); } catch (e2) { /* segue */ } });
    chaves.forEach(k => { if (antes[k] !== null) { try { localStorage.setItem(k, antes[k]); } catch (e2) { /* segue */ } } });
    return false;
  }
  chaves.forEach(k => chavesBloqueadas.delete(k)); // dados novos e válidos: pode voltar a gravar
  return true;
}

// Dias desde a última cópia (null = nunca fez)
function diasDesdeBackup() {
  const d = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
  return d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;
}
