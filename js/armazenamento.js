// Armazenamento do app: gravação segura, armazenamento persistente e cópia de segurança.
// Tudo fica no próprio aparelho (localStorage). Nada é enviado para a internet.

const PREFIXO_DADOS = 'lapre.';
const CHAVE_ULTIMO_BACKUP = 'lapre.ultimoBackup';

// Grava e AVISA se falhar (ex.: memória cheia ou navegador em modo privado). Devolve true se gravou.
let avisouFalha = false;
function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (e) {
    if (!avisouFalha) {
      avisouFalha = true;
      alert('ATENÇÃO: não foi possível salvar neste aparelho (memória cheia ou modo privado). ' +
        'O que você digitou agora pode se perder. Faça uma cópia de segurança ou exporte a planilha.');
    }
    return false;
  }
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
  Object.keys(j.dados).filter(k => k.startsWith(PREFIXO_DADOS)).forEach(k => { dados[k] = j.dados[k]; });
  return { dados, criado: j.criado };
}

// Troca os dados do aparelho pelos da cópia (só as partes que existem na cópia)
function restaurarBackup(dados) {
  try {
    Object.keys(dados).forEach(k => localStorage.setItem(k, dados[k]));
    return true;
  } catch (e) { return false; }
}

// Dias desde a última cópia (null = nunca fez)
function diasDesdeBackup() {
  const d = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
  return d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;
}
