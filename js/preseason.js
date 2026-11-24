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
    derivados: v => [{ l: 'IMC', n: 'imc', calc: 'massa ÷ (altura em metros)²', v: v.altura && v.massa ? v.massa / Math.pow(v.altura / 100, 2) : null }] },
  { id: 'single_hop', sigla: 'shop', nome: 'Single Hop', campos: [
      { k: 'D', l: 'Direito (cm)' }, { k: 'E', l: 'Esquerdo (cm)' }],
    derivados: v => [{ l: 'Simetria (%)', n: 'simetria_pct', calc: 'menor ÷ maior × 100', v: simetria(v.D, v.E) }] },
  { id: 'triple_hop', sigla: 'thop', nome: 'Triple Hop', campos: [
      { k: 'D', l: 'Direito (cm)' }, { k: 'E', l: 'Esquerdo (cm)' }],
    derivados: v => [{ l: 'Simetria (%)', n: 'simetria_pct', calc: 'menor ÷ maior × 100', v: simetria(v.D, v.E) }] },
  { id: 'ybt', sigla: 'ybal', nome: 'Y Balance', campos: [
      { k: 'compD', l: 'Comp. membro D (cm)', de: 'basico.mmiiD' }, { k: 'compE', l: 'Comp. membro E (cm)', de: 'basico.mmiiE' },
      { k: 'D_ANT', l: 'D anterior' }, { k: 'D_PM', l: 'D póstero-medial' }, { k: 'D_PL', l: 'D póstero-lateral' },
      { k: 'E_ANT', l: 'E anterior' }, { k: 'E_PM', l: 'E póstero-medial' }, { k: 'E_PL', l: 'E póstero-lateral' }],
    derivados: v => [
      { l: 'Composto D (%)', n: 'composto_d_pct', calc: '(ANT + PM + PL) ÷ (3 × comprimento do membro D) × 100', v: v.compD && v.D_ANT && v.D_PM && v.D_PL ? (v.D_ANT + v.D_PM + v.D_PL) / (3 * v.compD) * 100 : null },
      { l: 'Composto E (%)', n: 'composto_e_pct', calc: '(ANT + PM + PL) ÷ (3 × comprimento do membro E) × 100', v: v.compE && v.E_ANT && v.E_PM && v.E_PL ? (v.E_ANT + v.E_PM + v.E_PL) / (3 * v.compE) * 100 : null },
      { l: 'Dif. anterior (cm)', n: 'dif_ant_cm', calc: '|D − E| na direção anterior', v: v.D_ANT && v.E_ANT ? Math.abs(v.D_ANT - v.E_ANT) : null }] },
  { id: 'dorsi', sigla: 'dorsi', nome: 'Dorsiflexão (knee-to-wall)', campos: [
      { k: 'D', l: 'Direito (cm)' }, { k: 'E', l: 'Esquerdo (cm)' }],
    derivados: v => [{ l: 'Diferença (cm)', n: 'dif_cm', calc: '|D − E|', v: v.D !== null && v.E !== null ? Math.abs(v.D - v.E) : null }] },
  // OSTRC (Clarsen et al., 2013 e 2020): 4 perguntas sobre os últimos 7 dias. Perguntas 1 e 4 valem 0-8-17-25; 2 e 3 valem 0-6-13-19-25.
  { id: 'ostrc', sigla: 'ostrc', nome: 'OSTRC: problemas de saúde (últimos 7 dias)', campos: [
      { k: 'regiao', l: 'Problema/região', tipo: 'texto' },
      { k: 'q1', l: '1. Participação', opcoes: [[0, 'Total, sem problema'], [8, 'Total, com problema'], [17, 'Reduzida'], [25, 'Não participou']] },
      { k: 'q2', l: '2. Redução do volume', opcoes: [[0, 'Nenhuma'], [6, 'Pequena'], [13, 'Moderada'], [19, 'Grande'], [25, 'Não participou']] },
      { k: 'q3', l: '3. Efeito no desempenho', opcoes: [[0, 'Nenhum'], [6, 'Pequeno'], [13, 'Moderado'], [19, 'Grande'], [25, 'Não participou']] },
      { k: 'q4', l: '4. Dor/sintomas', opcoes: [[0, 'Nenhum'], [8, 'Leve'], [17, 'Moderado'], [25, 'Intenso']] }],
    derivados: v => {
      const ok = ['q1', 'q2', 'q3', 'q4'].every(k => v[k] !== null);
      return [{ l: 'Gravidade (0 a 100)', n: 'gravidade', calc: 'soma das perguntas 1 a 4 (0 a 100)', v: ok ? v.q1 + v.q2 + v.q3 + v.q4 : null },
        { l: 'Problema substancial', n: 'substancial', calc: 'Sim se pergunta 2 ou 3 ≥ 13 ou pergunta 1 = 25', v: !ok ? null : (v.q2 >= 13 || v.q3 >= 13 || v.q1 === 25) ? 'Sim' : 'Não' }];
    },
    nota: 'Perguntas sobre a última semana: 1. Teve dificuldade para participar normalmente dos treinos e jogos por causa de lesão, dor ou doença? 2. Quanto reduziu o volume de treino por isso? 3. Quanto isso afetou o seu desempenho? 4. Quanta dor ou sintoma sentiu? Cada resposta vale de 0 a 25 pontos e a soma dá a gravidade (0 a 100). Problema substancial = redução moderada ou grande do volume ou do desempenho, ou não conseguir participar (Clarsen et al., 2013). Texto em tradução livre: a versão brasileira validada é o OSTRC-BR (Pimenta et al., 2021), conferir a redação oficial.',
    refs: ['Clarsen B, Myklebust G, Bahr R. Development and validation of a new method for the registration of overuse injuries in sports injury epidemiology: the Oslo Sports Trauma Research Centre (OSTRC) overuse injury questionnaire. Br J Sports Med. 2013;47(8):495-502. doi:10.1136/bjsports-2012-091524',
      'Clarsen B, Bahr R, Myklebust G, et al. Improved reporting of overuse injuries and health problems in sport: an update of the Oslo Sport Trauma Research Center questionnaires. Br J Sports Med. 2020;54(7):390-396. doi:10.1136/bjsports-2019-101337',
      'Pimenta RM, Hespanhol L, Lopes AD. Brazilian version of the OSTRC Questionnaire on health problems (OSTRC-BR): translation, cross-cultural adaptation and measurement properties. Braz J Phys Ther. 2021;25(6):785-793. doi:10.1016/j.bjpt.2021.06.010',
      'Martínez-Cal J, Molina-Torres G, Carrasco-Vega E, et al. Spanish cross-cultural adaptation and validation of the Oslo Sports Trauma Research Centre (OSTRC) Overuse Injury Questionnaire in handball players. Healthcare (Basel). 2023;11(6):912. doi:10.3390/healthcare11060912'] },
  // Bem-estar no formato do formulário da liga (5 itens de 1 a 5) e esforço da semana (Borg 6 a 20)
  { id: 'hooper', sigla: 'hooper', nome: 'Bem-estar (Hooper) e esforço (Borg)', campos: [
      { k: 'fadiga', l: 'Fadiga (1 a 5)' }, { k: 'sono', l: 'Qualidade do sono (1 a 5)' }, { k: 'dor', l: 'Dor muscular (1 a 5)' },
      { k: 'estresse', l: 'Estresse (1 a 5)' }, { k: 'humor', l: 'Humor (1 a 5)' }, { k: 'borg', l: 'Esforço da semana (Borg 6 a 20)' }],
    derivados: v => { const ks = ['fadiga', 'sono', 'dor', 'estresse', 'humor']; return [{ l: 'Índice de Hooper (5 a 25)', n: 'indice', calc: 'soma dos 5 itens (5 a 25)', v: ks.every(k => v[k] !== null) ? ks.reduce((t, k) => t + v[k], 0) : null }]; },
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
  return ler(CHAVE); // ler() protege contra dados danificados (ver armazenamento.js)
}
function salvarAvaliacoes(lista) {
  return gravar(CHAVE, lista);
}
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- Nome do atleta ----------
// O atleta é cadastrado pelo nome (decisão da liga). Para juntar planilhas de outros celulares, o nome é
// comparado sem diferença de maiúsculas, acentos e espaços extras ("joão  silva" = "João Silva").
// Também acerta as maiúsculas: "joão da silva" vira "João da Silva" (da, de, do, das, dos, e ficam minúsculos)
const limparNome = t => String(t || '').trim().replace(/\s+/g, ' ').split(' ')
  .map((w, i) => i > 0 && /^(da|de|do|das|dos|e)$/i.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
const chaveNome = t => limparNome(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// ---------- Planilha (CSV) ----------
// Separador ";" e vírgula decimal: abre direto no Excel em português.
const cabecalhoCampo = (t, c) => t.nome + ' - ' + c.l;

function gerarCSV(av) {
  const cab = ['Atleta'];
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

// ---------- Exportação para pesquisa ----------
// Banco no formato que os programas de estatística esperam: uma linha por atleta, variáveis com nome curto,
// sem acento e sem espaço, colunas fixas de identificação no começo e um dicionário que explica cada coluna.
const MOMENTOS = ['Pré-temporada', 'Meio da temporada', 'Fim da temporada', 'Reavaliação', 'Outro'];

// ID de pesquisa: sempre o mesmo para o mesmo nome (em qualquer celular e temporada), sem mostrar o nome.
// Hash FNV-1a do nome normalizado. Quem tem a lista de nomes consegue refazer o ID: é pseudônimo, não anonimato.
function idPesquisa(nome) {
  let h = 0x811c9dc5;
  for (const ch of chaveNome(nome)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return 'LP-' + h.toString(36).toUpperCase().padStart(7, '0');
}
// Nome da variável: camelCase e maiúsculas viram snake_case (mmiiD → mmii_d, D_ANT → d_ant), com a sigla do teste na frente
const snake = k => k.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
const varCampo = (t, c) => (t.sigla ? t.sigla + '_' : '') + snake(c.k);
const varDerivado = (t, d) => (t.sigla ? t.sigla + '_' : '') + d.n;
const COLS_ID = [
  ['id', 'ID de pesquisa do atleta (o mesmo nome gera sempre o mesmo ID)', 'texto', 'LP-XXXXXXX'],
  ['nome', 'Nome do atleta (só aparece se marcar "incluir o nome")', 'texto', ''],
  ['avaliacao', 'Nome da avaliação no app', 'texto', ''],
  ['equipe', 'Equipe', 'texto', ''],
  ['temporada', 'Temporada (ano)', 'texto', 'ex.: 2026'],
  ['momento', 'Momento da coleta', 'texto', MOMENTOS.join(' | ')],
  ['data', 'Data da coleta (ano-mês-dia)', 'data', 'AAAA-MM-DD']];

const juntarCSV = (linhas, sep) => {
  const aspas = x => { x = String(x ?? ''); return (x.includes(sep) || /["\n]/.test(x)) ? '"' + x.replace(/"/g, '""') + '"' : x; };
  return '﻿' + linhas.map(l => l.map(aspas).join(sep)).join('\r\n');
};

// formato: 'excel' (; e vírgula decimal) ou 'estat' (, e ponto decimal: Jamovi, JASP, R, SPSS)
function gerarCSVPesquisa(av, { comNome = false, formato = 'estat' } = {}) {
  const sep = formato === 'excel' ? ';' : ',';
  const dec = x => formato === 'excel' ? String(x).replace('.', ',') : String(x);
  const ids = COLS_ID.map(c => c[0]).filter(k => comNome || k !== 'nome');
  const cab = [...ids];
  av.testes.forEach(tid => { const t = testePorId(tid);
    t.campos.forEach(c => cab.push(varCampo(t, c)));
    t.derivados({}).forEach(d => cab.push(varDerivado(t, d))); });
  const linhas = [cab];
  av.atletas.forEach(a => {
    const fixo = { id: idPesquisa(a.nome), nome: a.nome, avaliacao: av.nome, equipe: av.equipe || '', temporada: av.temporada || '', momento: av.momento || '', data: av.data || '' };
    const l = ids.map(k => fixo[k]);
    av.testes.forEach(tid => { const t = testePorId(tid), v = valoresDoTeste(a, t);
      // campos numéricos saem com o valor usado no cálculo (inclui o comprimento vindo dos dados básicos)
      t.campos.forEach(c => l.push(c.tipo === 'texto' ? (a.dados[t.id + '.' + c.k] ?? '') : (v[c.k] === null ? '' : dec(v[c.k]))));
      t.derivados(v).forEach(d => l.push(typeof d.v === 'string' ? d.v : dec(f1(d.v)))); });
    linhas.push(l);
  });
  return juntarCSV(linhas, sep);
}

// Dicionário de dados: o que é cada coluna do banco, unidade, valores possíveis, como foi calculada e referência
function gerarDicionario(av, { formato = 'estat' } = {}) {
  const unid = l => (l.match(/\(([^)]*)\)\s*$/) || [null, ''])[1];
  const linhas = [['variavel', 'descricao', 'teste', 'tipo', 'unidade_ou_valores', 'calculo', 'referencia']];
  COLS_ID.forEach(([n, d, tp, v]) => linhas.push([n, d, 'Identificação', tp, v, '', '']));
  av.testes.forEach(tid => { const t = testePorId(tid), ref = (t.refs || [])[0] || '';
    t.campos.forEach(c => {
      const vals = c.opcoes ? c.opcoes.map(o => Array.isArray(o) ? `${o[0]} = ${o[1]}` : o).join(' | ') : unid(c.l);
      linhas.push([varCampo(t, c), c.l, t.nome, c.tipo === 'texto' ? 'texto' : 'número', vals, c.de ? 'se vazio, usa o comprimento dos dados básicos' : '', ref]);
    });
    t.derivados({}).forEach(d => linhas.push([varDerivado(t, d), d.l, t.nome, d.n === 'substancial' ? 'texto' : 'número',
      d.n === 'substancial' ? 'Sim | Não' : unid(d.l), 'calculado pelo app: ' + d.calc, ref]));
  });
  linhas.push(['', 'Célula vazia = dado não coletado. Valores calculados com 1 casa decimal.', '', '', '', '', '']);
  return juntarCSV(linhas, formato === 'excel' ? ';' : ',');
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

// Junta um CSV (de outro celular) na avaliação. Casa atletas pelo nome (1ª coluna).
// Só preenche células que vêm com valor; colunas calculadas são ignoradas.
function importarCSV(av, texto) {
  const linhas = lerCSV(texto);
  if (linhas.length < 2) return { erro: 'Arquivo vazio ou inválido.' };
  const mapa = {};
  PRE_TESTES.forEach(t => t.campos.forEach(c => { mapa[cabecalhoCampo(t, c)] = { t, c }; }));
  const cols = linhas[0].map(h => mapa[h.trim()] || null);
  let novos = 0, celulas = 0;
  linhas.slice(1).forEach(l => {
    const nome = limparNome(l[0]);
    if (!nome) return;
    let a = av.atletas.find(x => chaveNome(x.nome) === chaveNome(nome));
    if (!a) { a = { nome, dados: {} }; av.atletas.push(a); novos++; }
    cols.forEach((m, i) => {
      const val = (l[i] || '').trim();
      if (!m || !val) return;
      a.dados[m.t.id + '.' + m.c.k] = m.c.tipo === 'texto' ? val : val.replace(',', '.');
      if (!av.testes.includes(m.t.id)) av.testes.push(m.t.id);
      celulas++;
    });
  });
  return { novos, celulas };
}
