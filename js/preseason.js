// Pré-temporada / reavaliações: catálogo de testes, cálculos, salvamento e planilha (CSV).
// Tudo fica salvo no próprio aparelho (localStorage). Nada é enviado para a internet.

const CHAVE = 'lapre.avaliacoes';

// Converte texto em número (aceita vírgula ou ponto). Devolve null se vazio/inválido.
const num = v => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isNaN(n) ? null : n;
};
// Formata número com 1 casa. Vazio se não tiver valor.
const f1 = n => typeof n === 'string' ? n : (n === null || n === undefined || !isFinite(n)) ? '' : (Math.round(n * 10) / 10).toString();
// Simetria: menor ÷ maior × 100
const simetria = (a, b) => (a && b) ? Math.min(a, b) / Math.max(a, b) * 100 : null;

// Testes que podem entrar numa avaliação. `derivados` calcula resultados automáticos.
const PRE_TESTES = [
  // `opcoes` vira uma lista de escolha. Texto: ['A', 'B']. Número: [[pontos, 'rótulo'], ...]
  { id: 'basico', nome: 'Dados básicos', campos: [
      { k: 'idade', l: 'Idade (anos)' }, { k: 'sexo', l: 'Sexo (F/M)', tipo: 'texto', opcoes: ['F', 'M'] },
      { k: 'altura', l: 'Altura (cm)' }, { k: 'massa', l: 'Massa (kg)' },
      { k: 'raca', l: 'Raça/cor (IBGE)', tipo: 'texto', opcoes: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefere não informar'] },
      { k: 'posicao', l: 'Posição/função', tipo: 'texto' }, { k: 'dominante', l: 'Membro dominante (D/E)', tipo: 'texto', opcoes: ['D', 'E'] },
      { k: 'tempo_treino', l: 'Tempo de treinamento (anos)' }, { k: 'freq_treino', l: 'Frequência de treino (dias/semana)' },
      { k: 'vol_treino', l: 'Volume de treino (horas/semana)' },
      { k: 'mmiiD', l: 'Comprimento MMII D (cm)' }, { k: 'mmiiE', l: 'Comprimento MMII E (cm)' },
      { k: 'mmssD', l: 'Comprimento MMSS D (cm)' }, { k: 'mmssE', l: 'Comprimento MMSS E (cm)' },
      { k: 'lesao', l: 'Lesão prévia (local/ano)', tipo: 'texto' }],
    nota: 'Comprimento dos MMII medido como no Y Balance do app (da EIAS ao maléolo). Se o Y Balance ficar sem o comprimento, o app usa o daqui.',
    derivados: v => [{ l: 'IMC', v: v.altura && v.massa ? v.massa / Math.pow(v.altura / 100, 2) : null }] },
  { id: 'single_hop', nome: 'Single Hop', campos: [
      { k: 'D', l: 'Direito (cm)' }, { k: 'E', l: 'Esquerdo (cm)' }],
    derivados: v => [{ l: 'Simetria (%)', v: simetria(v.D, v.E) }] },
  { id: 'triple_hop', nome: 'Triple Hop', campos: [
      { k: 'D', l: 'Direito (cm)' }, { k: 'E', l: 'Esquerdo (cm)' }],
    derivados: v => [{ l: 'Simetria (%)', v: simetria(v.D, v.E) }] },
  { id: 'ybt', nome: 'Y Balance', campos: [
      { k: 'compD', l: 'Comp. membro D (cm)', de: 'basico.mmiiD' }, { k: 'compE', l: 'Comp. membro E (cm)', de: 'basico.mmiiE' },
      { k: 'D_ANT', l: 'D anterior' }, { k: 'D_PM', l: 'D póstero-medial' }, { k: 'D_PL', l: 'D póstero-lateral' },
      { k: 'E_ANT', l: 'E anterior' }, { k: 'E_PM', l: 'E póstero-medial' }, { k: 'E_PL', l: 'E póstero-lateral' }],
    derivados: v => [
      { l: 'Composto D (%)', v: v.compD && v.D_ANT && v.D_PM && v.D_PL ? (v.D_ANT + v.D_PM + v.D_PL) / (3 * v.compD) * 100 : null },
      { l: 'Composto E (%)', v: v.compE && v.E_ANT && v.E_PM && v.E_PL ? (v.E_ANT + v.E_PM + v.E_PL) / (3 * v.compE) * 100 : null },
      { l: 'Dif. anterior (cm)', v: v.D_ANT && v.E_ANT ? Math.abs(v.D_ANT - v.E_ANT) : null }] },
  { id: 'dorsi', nome: 'Dorsiflexão (knee-to-wall)', campos: [
      { k: 'D', l: 'Direito (cm)' }, { k: 'E', l: 'Esquerdo (cm)' }],
    derivados: v => [{ l: 'Diferença (cm)', v: v.D !== null && v.E !== null ? Math.abs(v.D - v.E) : null }] },
  // OSTRC (Clarsen et al., 2013 e 2020): 4 perguntas sobre os últimos 7 dias. Perguntas 1 e 4 valem 0-8-17-25; 2 e 3 valem 0-6-13-19-25.
  { id: 'ostrc', nome: 'OSTRC: problemas de saúde (últimos 7 dias)', campos: [
      { k: 'regiao', l: 'Problema/região', tipo: 'texto' },
      { k: 'q1', l: '1. Participação', opcoes: [[0, 'Total, sem problema'], [8, 'Total, com problema'], [17, 'Reduzida'], [25, 'Não participou']] },
      { k: 'q2', l: '2. Redução do volume', opcoes: [[0, 'Nenhuma'], [6, 'Pequena'], [13, 'Moderada'], [19, 'Grande'], [25, 'Não participou']] },
      { k: 'q3', l: '3. Efeito no desempenho', opcoes: [[0, 'Nenhum'], [6, 'Pequeno'], [13, 'Moderado'], [19, 'Grande'], [25, 'Não participou']] },
      { k: 'q4', l: '4. Dor/sintomas', opcoes: [[0, 'Nenhum'], [8, 'Leve'], [17, 'Moderado'], [25, 'Intenso']] }],
    derivados: v => {
      const ok = ['q1', 'q2', 'q3', 'q4'].every(k => v[k] !== null);
      return [{ l: 'Gravidade (0 a 100)', v: ok ? v.q1 + v.q2 + v.q3 + v.q4 : null },
        { l: 'Problema substancial', v: !ok ? null : (v.q2 >= 13 || v.q3 >= 13 || v.q1 === 25) ? 'Sim' : 'Não' }];
    },
    nota: 'Perguntas sobre a última semana: 1. Teve dificuldade para participar normalmente dos treinos e jogos por causa de lesão, dor ou doença? 2. Quanto reduziu o volume de treino por isso? 3. Quanto isso afetou o seu desempenho? 4. Quanta dor ou sintoma sentiu? Cada resposta vale de 0 a 25 pontos e a soma dá a gravidade (0 a 100). Problema substancial = redução moderada ou grande do volume ou do desempenho, ou não conseguir participar (Clarsen et al., 2013). Texto em tradução livre: a versão brasileira validada é o OSTRC-BR (Pimenta et al., 2021), conferir a redação oficial.',
    refs: ['Clarsen B, Myklebust G, Bahr R. Development and validation of a new method for the registration of overuse injuries in sports injury epidemiology: the Oslo Sports Trauma Research Centre (OSTRC) overuse injury questionnaire. Br J Sports Med. 2013;47(8):495-502. doi:10.1136/bjsports-2012-091524',
      'Clarsen B, Bahr R, Myklebust G, et al. Improved reporting of overuse injuries and health problems in sport: an update of the Oslo Sport Trauma Research Center questionnaires. Br J Sports Med. 2020;54(7):390-396. doi:10.1136/bjsports-2019-101337',
      'Pimenta RM, Hespanhol L, Lopes AD. Brazilian version of the OSTRC Questionnaire on health problems (OSTRC-BR): translation, cross-cultural adaptation and measurement properties. Braz J Phys Ther. 2021;25(6):785-793. doi:10.1016/j.bjpt.2021.06.010',
      'Martínez-Cal J, Molina-Torres G, Carrasco-Vega E, et al. Spanish cross-cultural adaptation and validation of the Oslo Sports Trauma Research Centre (OSTRC) Overuse Injury Questionnaire in handball players. Healthcare (Basel). 2023;11(6):912. doi:10.3390/healthcare11060912'] },
  // Bem-estar no formato do formulário da liga (5 itens de 1 a 5) e esforço da semana (Borg 6 a 20)
  { id: 'hooper', nome: 'Bem-estar (Hooper) e esforço (Borg)', campos: [
      { k: 'fadiga', l: 'Fadiga (1 a 5)' }, { k: 'sono', l: 'Qualidade do sono (1 a 5)' }, { k: 'dor', l: 'Dor muscular (1 a 5)' },
      { k: 'estresse', l: 'Estresse (1 a 5)' }, { k: 'humor', l: 'Humor (1 a 5)' }, { k: 'borg', l: 'Esforço da semana (Borg 6 a 20)' }],
    derivados: v => { const ks = ['fadiga', 'sono', 'dor', 'estresse', 'humor']; return [{ l: 'Índice de Hooper (5 a 25)', v: ks.every(k => v[k] !== null) ? ks.reduce((t, k) => t + v[k], 0) : null }]; },
    nota: 'Mesmos itens do formulário Hooper da liga. Quanto MAIOR o índice, PIOR o bem-estar (no original de Hooper, 4 itens de 1 a 7). Não há ponto de corte único: compare o atleta com ele mesmo ao longo da temporada. Conferir com a liga o sentido dos números (1 = melhor ou pior).',
    refs: ['Hooper SL, Mackinnon LT, Howard A, Gordon RD, Bachmann AW. Markers for monitoring overtraining and recovery. Med Sci Sports Exerc. 1995;27(1):106-112. doi:10.1249/00005768-199501000-00019',
      'Borg GA. Psychophysical bases of perceived exertion. Med Sci Sports Exerc. 1982;14(5):377-381. doi:10.1249/00005768-198205000-00012'] }
];

const testePorId = id => PRE_TESTES.find(t => t.id === id);

// Valores numéricos de um atleta para um teste
function valoresDoTeste(atleta, teste) {
  const v = {};
  // `de`: se o campo estiver vazio, usa o valor de outro teste (ex.: comprimento do membro dos dados básicos)
  teste.campos.forEach(c => { v[c.k] = num(atleta.dados[teste.id + '.' + c.k]) ?? (c.de ? num(atleta.dados[c.de]) : null); });
  return v;
}

// ---------- Salvamento ----------
function carregarAvaliacoes() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { return []; }
}
function salvarAvaliacoes(lista) {
  return gravar(CHAVE, lista);
}
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- Código do atleta ----------
// Dado de saúde nunca vai junto com o nome: cada atleta tem um CÓDIGO (protocolo de dados da liga).
// Padrão: sigla do time + ano + número, ex.: FUTF26-07. A tabela código e nome fica só com o responsável.
// (O campo interno continua se chamando `nome` para as avaliações antigas seguirem abrindo.)
const normCodigo = t => String(t || '').trim().toUpperCase().replace(/\s*-\s*/g, '-');
// Parece nome de pessoa? (tem espaço ou só letras longas, sem número). Ex.: "Ana Souza", "Joao"
const pareceNome = t => /\s/.test(String(t).trim()) || /^[A-Za-zÀ-ÿ]{4,}$/.test(String(t).trim());
// Próximo código da sigla: FUTF26 -> FUTF26-01, FUTF26-02...
function proximoCodigo(av, sigla) {
  sigla = normCodigo(sigla).replace(/-+$/, '');
  const usados = av.atletas.map(a => a.nome).filter(c => c.startsWith(sigla + '-')).map(c => parseInt(c.slice(sigla.length + 1), 10)).filter(n => !isNaN(n));
  const n = (usados.length ? Math.max(...usados) : 0) + 1;
  return sigla + '-' + String(n).padStart(2, '0');
}

// ---------- Planilha (CSV) ----------
// Separador ";" e vírgula decimal: abre direto no Excel em português.
const cabecalhoCampo = (t, c) => t.nome + ' - ' + c.l;

function gerarCSV(av) {
  const cab = ['Código'];
  av.testes.forEach(id => {
    const t = testePorId(id);
    t.campos.forEach(c => cab.push(cabecalhoCampo(t, c)));
    t.derivados({}).forEach(d => cab.push(t.nome + ' - ' + d.l));
  });
  const linhas = [cab];
  av.atletas.forEach(a => {
    const l = [a.nome];
    av.testes.forEach(id => {
      const t = testePorId(id);
      // números saem com vírgula decimal (Excel pt-BR); campos de texto ficam como estão
      t.campos.forEach(c => { const x = a.dados[t.id + '.' + c.k] ?? ''; l.push(c.tipo === 'texto' ? x : String(x).replace('.', ',')); });
      t.derivados(valoresDoTeste(a, t)).forEach(d => l.push(f1(d.v).replace('.', ',')));
    });
    linhas.push(l);
  });
  const aspas = x => { x = String(x); return /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
  // Cabeçalho fica como está; nos valores, o ponto decimal vira vírgula (Excel pt-BR)
  // ﻿ = marca para o Excel entender acentos
  return '﻿' + linhas.map(l => l.map(aspas).join(';')).join('\r\n');
}

// Lê CSV simples (com aspas). Detecta separador ; ou ,
function lerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const sep = (texto.split('\n')[0].match(/;/g) || []).length ? ';' : ',';
  const linhas = []; let atual = [], campo = '', aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') aspas = false;
      else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) { atual.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++;
      atual.push(campo); campo = '';
      if (atual.some(x => x !== '')) linhas.push(atual);
      atual = [];
    } else campo += ch;
  }
  atual.push(campo);
  if (atual.some(x => x !== '')) linhas.push(atual);
  return linhas;
}

// Junta um CSV (de outro celular) na avaliação. Casa atletas pelo código (1ª coluna).
// Avisa quantas linhas parecem ter nome no lugar do código (planilhas antigas).
// Só preenche células que vêm com valor; colunas calculadas são ignoradas.
function importarCSV(av, texto) {
  const linhas = lerCSV(texto);
  if (linhas.length < 2) return { erro: 'Arquivo vazio ou inválido.' };
  const mapa = {};
  PRE_TESTES.forEach(t => t.campos.forEach(c => { mapa[cabecalhoCampo(t, c)] = { t, c }; }));
  const cols = linhas[0].map(h => mapa[h.trim()] || null);
  let novos = 0, celulas = 0, comNome = 0;
  linhas.slice(1).forEach(l => {
    const bruto = (l[0] || '').trim();
    if (!bruto) return;
    if (pareceNome(bruto)) comNome++;
    const nome = pareceNome(bruto) ? bruto : normCodigo(bruto);
    let a = av.atletas.find(x => normCodigo(x.nome) === normCodigo(nome));
    if (!a) { a = { nome, dados: {} }; av.atletas.push(a); novos++; }
    cols.forEach((m, i) => {
      const val = (l[i] || '').trim();
      if (!m || !val) return;
      a.dados[m.t.id + '.' + m.c.k] = m.c.tipo === 'texto' ? val : val.replace(',', '.');
      if (!av.testes.includes(m.t.id)) av.testes.push(m.t.id);
      celulas++;
    });
  });
  return { novos, celulas, comNome };
}
