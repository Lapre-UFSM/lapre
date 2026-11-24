// Evolução clínica (pacientes, avaliações e evoluções em SOAP) e números de atendimento para projetos.
// Tudo fica salvo no próprio aparelho (localStorage). Use sempre um CÓDIGO ou iniciais, nunca o nome completo.

const CHAVE_P = 'lapre.pacientes';
const carregarP = () => ler(CHAVE_P); // ler() protege contra dados danificados (ver armazenamento.js)
const salvarP = l => gravar(CHAVE_P, l);

const REGIOES_P = ['Ombro', 'Cotovelo', 'Punho e mão', 'Coluna cervical', 'Coluna torácica', 'Coluna lombar', 'Quadril e pelve', 'Coxa', 'Joelho', 'Perna', 'Tornozelo e pé', 'Cabeça', 'Outra'];
const TIPOS_AT = ['Avaliação', 'Evolução', 'Reavaliação', 'Alta'];
const STATUS_P = ['Em atendimento', 'Alta', 'Abandono', 'Encaminhado'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Campos do cadastro do paciente (o nome é obrigatório; o resto é opcional). O nome fica no campo interno `codigo`.
const CAMPOS_P = [
  { k: 'sexo', l: 'Sexo', o: ['F', 'M'] },
  { k: 'idade', l: 'Idade (anos)', n: true },
  { k: 'esporte', l: 'Esporte/modalidade' },
  { k: 'regiao', l: 'Região da queixa', o: REGIOES_P },
  { k: 'lado', l: 'Lado', o: ['D', 'E', 'Bilateral', 'Não se aplica'] },
  { k: 'diagnostico', l: 'Diagnóstico ou hipótese' },
  { k: 'medida', l: 'Medida para acompanhar (opcional, ex.: LSI do hop, KOOS esporte)' },
  { k: 'status', l: 'Situação', o: STATUS_P }
];
// Campos SOAP do atendimento, com o que costuma entrar em cada um
const SOAP = [
  { k: 's', l: 'S · Subjetivo', d: 'Queixa principal, história, mecanismo da lesão, o que piora e o que melhora, objetivo do paciente.' },
  { k: 'o', l: 'O · Objetivo', d: 'Inspeção, palpação, ADM, força, testes especiais e funcionais, questionários.' },
  { k: 'a', l: 'A · Avaliação', d: 'Hipótese ou diagnóstico funcional, problemas principais, resposta ao tratamento.' },
  { k: 'p', l: 'P · Plano', d: 'Objetivos, conduta realizada, orientações, exercícios para casa e próximo passo.' }
];

const hojeISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const dataCurta = iso => iso ? iso.split('-').reverse().join('/') : '';
const porData = (a, b) => (a.data || '').localeCompare(b.data || '');
const acharP = id => { const ps = carregarP(); return { ps, p: ps.find(x => x.id === id) }; };
const f1br = n => f1(n).replace('.', ','); // número com vírgula decimal
const nvl = x => (x === undefined || x === null) ? '' : x;
let abrirDadosP = null; // paciente recém-criado: abre o cadastro na tela dele

// Campo de formulário simples (texto, número ou lista)
function campoForm(c, v, attr) {
  if (c.o) return `<label>${esc(c.l)}<select ${attr}><option value="">—</option>${c.o.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  return `<label>${esc(c.l)}<input type="text" ${c.n ? 'inputmode="decimal"' : ''} ${attr} value="${esc(nvl(v))}"></label>`;
}

// Gráfico de linha simples em SVG. pontos: [{x: rótulo, y: número}]
function graficoLinha(pontos, rotulo, maxFixo) {
  if (pontos.length < 2) return `<p class="muted">${esc(rotulo)}: o gráfico aparece a partir de 2 registros.</p>`;
  const W = 340, H = 160, m = { l: 30, r: 12, t: 16, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const ys = pontos.map(p => p.y), ymin = Math.min(0, ...ys);
  const ymax = maxFixo ?? (Math.max(...ys) > ymin ? Math.max(...ys) * 1.1 : ymin + 1);
  const X = i => m.l + i * iw / (pontos.length - 1), Y = v => m.t + ih - (v - ymin) / (ymax - ymin) * ih;
  const guias = [ymin, (ymin + ymax) / 2, ymax];
  return `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(rotulo)}">
    ${guias.map(g => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(g)}" y2="${Y(g)}" class="g-guia"/><text x="${m.l - 6}" y="${Y(g) + 4}" class="g-eixo" text-anchor="end">${f1br(g)}</text>`).join('')}
    <polyline class="g-linha" points="${pontos.map((p, i) => X(i) + ',' + Y(p.y)).join(' ')}"/>
    ${pontos.map((p, i) => `<circle class="g-ponto" cx="${X(i)}" cy="${Y(p.y)}" r="4"><title>${esc(p.x)}: ${f1br(p.y)}</title></circle>
      <text x="${X(i)}" y="${Y(p.y) - 8}" class="g-valor" text-anchor="middle">${f1br(p.y)}</text>`).join('')}
    <text x="${m.l}" y="${H - 8}" class="g-eixo">${esc(pontos[0].x)}</text>
    <text x="${W - m.r}" y="${H - 8}" class="g-eixo" text-anchor="end">${esc(pontos[pontos.length - 1].x)}</text>
  </svg><p class="muted peq-txt">${esc(rotulo)}</p>`;
}

// ---------- Lista de pacientes ----------
function telaPacientes() {
  const ps = carregarP();
  const ultimo = p => (p.atend || []).slice().sort(porData).pop();
  const ord = ps.slice().sort((a, b) => ((ultimo(b) || {}).data || '').localeCompare((ultimo(a) || {}).data || ''));
  return `<h1>Evolução</h1>
    <p class="muted">Avaliação inicial, evoluções e reavaliações de cada paciente, no formato SOAP.</p>
    <p class="aviso">São dados de saúde: ficam só neste aparelho. Não envie a planilha em grupos e faça a <a href="#/copia">cópia de segurança</a> com frequência.</p>
    <div class="card"><strong>Novo paciente</strong>
      <div class="linha"><input id="p-cod" placeholder="Nome do paciente" autocapitalize="words"><button id="p-criar">Criar</button></div>
      <p class="muted" id="p-msg"></p></div>
    <input class="busca" id="p-busca" placeholder="Buscar por nome, esporte, região ou diagnóstico...">
    <div id="p-lista">${ord.map(p => { const u = ultimo(p), n = (p.atend || []).length;
      return `<a class="card link" href="#/evolucao/${p.id}" data-busca="${esc([p.codigo, p.esporte, p.regiao, p.diagnostico].join(' ').toLowerCase())}">
        <strong>${esc(p.codigo)}</strong><span>${esc([p.regiao, p.diagnostico, p.esporte].filter(Boolean).join(' · ') || 'Sem dados de cadastro')}</span>
        <span>${n} atendimento(s)${u ? ' · último em ' + dataCurta(u.data) : ''} · ${esc(p.status || 'Em atendimento')}</span></a>`; }).join('') || '<p class="muted">Nenhum paciente ainda.</p>'}</div>
    <h2>Planilha</h2>
    <div class="card">
      <button id="p-exp" ${ps.length ? '' : 'disabled'}>Exportar atendimentos (CSV)</button>
      <label class="arquivo">Juntar planilha de outro celular<input type="file" id="p-imp" accept=".csv,text/csv"></label>
      <p class="muted" id="p-msg-imp"></p>
      <p class="muted">Os números por mês (para relatórios e projetos) ficam em <a href="#/projeto">Atendimentos</a>.</p></div>`;
}

function ligarPacientes() {
  const criar = () => {
    const nome = limparNome(document.getElementById('p-cod').value);
    if (!nome) return;
    const ps = carregarP();
    // mesmo nome (sem diferença de acento e maiúsculas): abre o paciente que já existe
    const ja = ps.find(p => chaveNome(p.codigo) === chaveNome(nome));
    if (ja) { location.hash = '#/evolucao/' + ja.id; return; }
    const p = { id: novoId(), codigo: nome, status: 'Em atendimento', atend: [] };
    ps.push(p); salvarP(ps); abrirDadosP = p.id;
    location.hash = '#/evolucao/' + p.id;
  };
  document.getElementById('p-criar').onclick = criar;
  document.getElementById('p-cod').onkeydown = e => { if (e.key === 'Enter') criar(); };
  document.getElementById('p-busca').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('#p-lista [data-busca]').forEach(el => { el.hidden = q && !el.dataset.busca.includes(q); });
  });
  document.getElementById('p-exp').onclick = () => baixarCSV('Atendimentos_LAPRE_' + hojeISO() + '.csv', linhasCSVAtend());
  document.getElementById('p-imp').onchange = async e => {
    const arq = e.target.files[0]; if (!arq) return;
    const r = importarAtend(await arq.text());
    if (r.erro) { document.getElementById('p-msg-imp').textContent = r.erro; return; }
    render();
    document.getElementById('p-msg-imp').textContent = `Importado: ${r.atend} atendimento(s) novo(s), ${r.novos} paciente(s) novo(s). Repetidos (mesmo nome, data e tipo) foram ignorados.`;
  };
}

// ---------- Planilha dos atendimentos ----------
const CAB_AT = ['Nome', 'Sexo', 'Idade', 'Esporte', 'Região', 'Lado', 'Diagnóstico', 'Situação', 'Medida acompanhada', 'Data', 'Tipo', 'Dor (0 a 10)', 'Medida (valor)', 'S - Subjetivo', 'O - Objetivo', 'A - Avaliação', 'P - Plano'];
function linhasCSVAtend() {
  const linhas = [CAB_AT];
  carregarP().forEach(p => {
    const base = [p.codigo, p.sexo, num(p.idade) ?? nvl(p.idade), p.esporte, p.regiao, p.lado, p.diagnostico, p.status, p.medida];
    const ats = (p.atend || []).slice().sort(porData);
    if (!ats.length) linhas.push([...base, '', '', '', '', '', '', '', '']);
    ats.forEach(a => linhas.push([...base, dataCurta(a.data), a.tipo, a.dor ?? '', a.mvalor ?? '', a.s, a.o, a.a, a.p]));
  });
  return linhas;
}

// Junta a planilha de outro celular. Casa o paciente pelo nome; atendimento repetido = mesmo nome, data e tipo.
// Planilhas antigas, com a coluna "Código", também são aceitas.
function importarAtend(texto) {
  const linhas = lerCSV(texto);
  if (linhas.length < 2) return { erro: 'Arquivo vazio ou inválido.' };
  const idx = nome => linhas[0].findIndex(h => h.trim() === nome);
  const col = CAB_AT.map(idx);
  if (col[0] < 0) col[0] = idx('Código'); // planilha antiga
  if (col[0] < 0 || col[9] < 0) return { erro: 'Esta planilha não parece ser de atendimentos (faltam as colunas Nome e Data).' };
  const ps = carregarP(); let novos = 0, atend = 0;
  const pegar = (l, i) => col[i] < 0 ? '' : (l[col[i]] || '').trim();
  const isoDe = br => { const m = br.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : (/^\d{4}-\d{2}-\d{2}$/.test(br) ? br : ''); };
  linhas.slice(1).forEach(l => {
    const cod = limparNome(pegar(l, 0)); if (!cod) return;
    let p = ps.find(x => chaveNome(x.codigo) === chaveNome(cod));
    if (!p) { p = { id: novoId(), codigo: cod, atend: [] }; ps.push(p); novos++; }
    // cadastro: só preenche o que estiver vazio neste aparelho
    ['sexo', 'idade', 'esporte', 'regiao', 'lado', 'diagnostico', 'status', 'medida'].forEach((k, j) => { const v = pegar(l, j + 1); if (v && !p[k]) p[k] = v; });
    const data = isoDe(pegar(l, 9)), tipo = pegar(l, 10);
    if (!data) return;
    p.atend = p.atend || [];
    if (p.atend.some(a => a.data === data && a.tipo === tipo)) return;
    p.atend.push({ id: novoId(), data, tipo: tipo || 'Evolução', dor: num(pegar(l, 11)), mvalor: num(pegar(l, 12)), s: pegar(l, 13), o: pegar(l, 14), a: pegar(l, 15), p: pegar(l, 16) });
    atend++;
  });
  salvarP(ps);
  return { novos, atend };
}

// ---------- Paciente ----------
function telaPaciente(id) {
  const { p } = acharP(id);
  if (!p) return naoEncontrado();
  const ats = (p.atend || []).slice().sort(porData);
  const comDor = ats.filter(a => typeof a.dor === 'number');
  const comMed = ats.filter(a => typeof a.mvalor === 'number');
  let mudanca = '';
  if (comDor.length >= 2) {
    const ini = comDor[0].dor, fim = comDor[comDor.length - 1].dor, dif = ini - fim;
    const pct = ini > 0 ? dif / ini * 100 : null;
    const importante = dif >= 2 || (pct !== null && pct >= 30);
    mudanca = `<p>Dor: de <b>${f1br(ini)}</b> para <b>${f1br(fim)}</b> (${dif >= 0 ? 'redução' : 'aumento'} de ${f1br(Math.abs(dif))} ponto(s)${pct !== null ? ', ' + f1br(Math.abs(pct)) + '%' : ''}).
      ${dif > 0 ? (importante ? 'Mudança clinicamente importante.' : 'Mudança ainda abaixo do clinicamente importante.') : ''}</p>
      <p class="muted peq-txt">Na escala numérica de 0 a 10, reduções de cerca de 2 pontos ou 30% foram consideradas clinicamente importantes em dor crônica (Farrar et al., 2001). Em dor aguda, os valores variam entre os estudos.</p>`;
  }
  const quest = typeof carregarQ === 'function' ? carregarQ().filter(x => chaveNome(x.codigo) === chaveNome(p.codigo)).reverse() : [];
  return `${voltar('#/evolucao', 'Pacientes')}<h1>${esc(p.codigo)}</h1>
    <div>${[p.regiao, p.lado, p.esporte, p.status || 'Em atendimento'].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    ${p.diagnostico ? `<p>${esc(p.diagnostico)}</p>` : ''}
    <details class="card" id="p-dados" ${abrirDadosP === id ? 'open' : ''}><summary>Dados do paciente</summary>
      <p class="muted">Salva automaticamente.</p>
      ${CAMPOS_P.map(c => campoForm(c, p[c.k], `data-pk="${c.k}"`)).join('')}</details>
    <a class="botao" href="#/evolucao/${p.id}/novo">Registrar atendimento</a>
    <h2>Evolução</h2>
    <div class="card">${graficoLinha(comDor.map(a => ({ x: dataCurta(a.data).slice(0, 5), y: a.dor })), 'Dor (0 a 10) por atendimento', 10)}${mudanca}
      ${p.medida ? graficoLinha(comMed.map(a => ({ x: dataCurta(a.data).slice(0, 5), y: a.mvalor })), p.medida) : ''}</div>
    <h2>Atendimentos (${ats.length})</h2>
    ${ats.slice().reverse().map(a => `<a class="card link" href="#/evolucao/${p.id}/${a.id}"><strong>${dataCurta(a.data)} · ${esc(a.tipo)}${typeof a.dor === 'number' ? ' · dor ' + f1br(a.dor) : ''}</strong>
      <span>${esc((a.a || a.s || a.p || '').slice(0, 140)) || 'Sem anotações'}</span></a>`).join('') || '<p class="muted">Nenhum atendimento registrado. Comece pela avaliação.</p>'}
    <h2>Questionários deste paciente (${quest.length})</h2>
    <p class="muted">Preenchimentos salvos em Questionários com o mesmo nome (${esc(p.codigo)}).</p>
    ${quest.map(x => { const q = qPorId(x.q); return `<a class="card link" href="#/questionarios/${x.q}/resultado/${x.id}"><strong>${esc(q ? q.sigla : x.q)} · ${dataBR(x.data)}</strong><span>${esc(resumoTexto(x.res) || 'sem pontuação')}</span></a>`; }).join('') || `<p class="muted">Nenhum. <a href="#/questionarios">Abrir questionários</a></p>`}
    <button class="perigo" id="p-apagar">Apagar este paciente</button>`;
}

function ligarPaciente(id) {
  abrirDadosP = null;
  document.querySelectorAll('[data-pk]').forEach(el => ['input', 'change'].forEach(ev => el.addEventListener(ev, () => {
    const { ps, p } = acharP(id); if (!p) return;
    p[el.dataset.pk] = el.value.trim(); salvarP(ps);
  })));
  // ao fechar o cadastro, atualiza o topo da tela com os dados novos
  const d = document.getElementById('p-dados');
  if (d) d.addEventListener('toggle', () => { if (!d.open) render(); });
  document.getElementById('p-apagar').onclick = () => {
    const { p } = acharP(id);
    if (!confirm(`Apagar o paciente ${p.codigo} e todos os ${(p.atend || []).length} atendimento(s)? Isso não pode ser desfeito. Exporte a planilha antes, se quiser guardar.`)) return;
    salvarP(carregarP().filter(x => x.id !== id));
    location.hash = '#/evolucao';
  };
}

// ---------- Atendimento (novo ou edição) ----------
function telaAtendimento(pid, aid) {
  const { p } = acharP(pid);
  if (!p) return naoEncontrado();
  const novo = aid === 'novo', at = novo ? null : (p.atend || []).find(a => a.id === aid);
  if (!novo && !at) return naoEncontrado();
  const a = at || { data: hojeISO(), tipo: (p.atend || []).length ? 'Evolução' : 'Avaliação' };
  return `${voltar('#/evolucao/' + pid, p.codigo)}<h1>${novo ? 'Novo atendimento' : 'Atendimento'}</h1>
    <div class="card">
      <div class="linha"><label style="flex:1">Data<input type="date" id="a-data" value="${esc(a.data)}"></label>
      <label style="flex:1">Tipo<select id="a-tipo">${TIPOS_AT.map(t => `<option ${t === a.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <p><b>Dor agora (0 = sem dor, 10 = pior dor imaginável)</b></p>
      <div class="escala">${Array.from({ length: 11 }, (_, i) => `<label class="pill"><input type="radio" name="a-dor" value="${i}" ${a.dor === i ? 'checked' : ''}><span>${i}</span></label>`).join('')}</div>
      <button class="peq sec" id="a-semdor" type="button">sem registro de dor</button>
      ${p.medida ? `<label>${esc(p.medida)} (valor)<input type="text" inputmode="decimal" id="a-med" value="${esc(nvl(a.mvalor))}"></label>` : ''}</div>
    ${SOAP.map(c => `<div class="card"><label><b>${esc(c.l)}</b><span class="muted peq-txt" style="display:block">${esc(c.d)}</span>
      <textarea id="a-${c.k}" rows="4">${esc(nvl(a[c.k]))}</textarea></label></div>`).join('')}
    <button id="a-salvar">Salvar</button><a class="botao sec" href="#/evolucao/${pid}">Cancelar</a>
    ${novo ? '' : '<button class="perigo" id="a-apagar">Apagar este atendimento</button>'}`;
}

function ligarAtendimento(pid, aid) {
  const { p } = acharP(pid); if (!p) return;
  document.getElementById('a-semdor').onclick = () => document.querySelectorAll('[name="a-dor"]').forEach(r => { r.checked = false; });
  document.getElementById('a-salvar').onclick = () => {
    const data = document.getElementById('a-data').value;
    if (!data) return alert('Informe a data do atendimento.');
    const marcado = document.querySelector('[name="a-dor"]:checked');
    const med = document.getElementById('a-med');
    const reg = { data, tipo: document.getElementById('a-tipo').value, dor: marcado ? Number(marcado.value) : null, mvalor: med ? num(med.value) : null };
    SOAP.forEach(c => { reg[c.k] = document.getElementById('a-' + c.k).value.trim(); });
    const { ps, p } = acharP(pid);
    p.atend = p.atend || [];
    if (aid === 'novo') p.atend.push({ id: novoId(), ...reg });
    else Object.assign(p.atend.find(a => a.id === aid), reg);
    if (reg.tipo === 'Alta' && (!p.status || p.status === 'Em atendimento')) p.status = 'Alta';
    salvarP(ps);
    location.hash = '#/evolucao/' + pid;
  };
  const ap = document.getElementById('a-apagar');
  if (ap) ap.onclick = () => {
    if (!confirm('Apagar este atendimento? Isso não pode ser desfeito.')) return;
    const { ps, p } = acharP(pid);
    p.atend = p.atend.filter(a => a.id !== aid); salvarP(ps);
    location.hash = '#/evolucao/' + pid;
  };
}

// ---------- Números para projetos ----------
let anoProjeto = null;
function resumoAno(ano) {
  const ps = carregarP();
  const meses = MESES.map(() => ({ at: 0, pac: new Set(), novos: 0, aval: 0, altas: 0 }));
  const noAno = new Set();
  ps.forEach(p => {
    const ats = (p.atend || []).filter(a => a.data).sort(porData);
    if (ats.length && ats[0].data.slice(0, 4) === ano) meses[Number(ats[0].data.slice(5, 7)) - 1].novos++;
    ats.forEach(a => {
      if (a.data.slice(0, 4) !== ano) return;
      const m = meses[Number(a.data.slice(5, 7)) - 1];
      m.at++; m.pac.add(p.id); noAno.add(p.id);
      if (a.tipo === 'Avaliação') m.aval++;
      if (a.tipo === 'Alta') m.altas++;
    });
  });
  return { ps, meses, noAno };
}

function contar(lista, campo) {
  const c = {};
  lista.forEach(p => { const v = p[campo] || 'Não informado'; c[v] = (c[v] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

function telaProjeto() {
  const todos = carregarP();
  const anos = [...new Set(todos.flatMap(p => (p.atend || []).map(a => (a.data || '').slice(0, 4))).filter(Boolean))].sort().reverse();
  const ano = anoProjeto && anos.includes(anoProjeto) ? anoProjeto : (anos[0] || hojeISO().slice(0, 4));
  const { ps, meses, noAno } = resumoAno(ano);
  const pacAno = ps.filter(p => noAno.has(p.id));
  const totAt = meses.reduce((s, m) => s + m.at, 0);
  // dor da primeira e da última medida de quem tem 2 ou mais registros no ano
  const dores = pacAno.map(p => (p.atend || []).filter(a => (a.data || '').startsWith(ano) && typeof a.dor === 'number').sort(porData)).filter(l => l.length >= 2);
  const media = l => l.length ? l.reduce((s, x) => s + x, 0) / l.length : null;
  const blocos = [['Região', 'regiao'], ['Esporte', 'esporte'], ['Sexo', 'sexo'], ['Situação atual', 'status']];
  return `<h1>Atendimentos</h1>
    <p class="muted">Números por mês para relatórios e projetos, calculados a partir da aba <a href="#/evolucao">Evolução</a>. Contam só os dados deste aparelho: para o total da liga, junte as planilhas dos outros celulares na aba Evolução.</p>
    <div class="card"><label>Ano<select id="pj-ano">${(anos.length ? anos : [ano]).map(a => `<option ${a === ano ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      <p><b>${noAno.size}</b> paciente(s) atendido(s) e <b>${totAt}</b> atendimento(s) em ${ano}${noAno.size ? ` · média de ${f1br(totAt / noAno.size)} atendimento(s) por paciente` : ''}.</p></div>
    <div class="tabela-rolagem"><table class="lanc tab-num"><thead><tr><th>Mês</th><th>Atendimentos</th><th>Pacientes atendidos</th><th>Pacientes novos</th><th>Avaliações</th><th>Altas</th></tr></thead>
      <tbody>${meses.map((m, i) => `<tr><td class="nome">${MESES[i]}</td><td>${m.at}</td><td>${m.pac.size}</td><td>${m.novos}</td><td>${m.aval}</td><td>${m.altas}</td></tr>`).join('')}
      <tr class="total"><td class="nome">Total</td><td>${totAt}</td><td>${noAno.size}</td><td>${meses.reduce((s, m) => s + m.novos, 0)}</td><td>${meses.reduce((s, m) => s + m.aval, 0)}</td><td>${meses.reduce((s, m) => s + m.altas, 0)}</td></tr></tbody></table></div>
    <p class="muted peq-txt">Pacientes novos = primeiro atendimento registrado caiu naquele mês. No total, cada paciente conta uma vez no ano.</p>
    <h2>Perfil dos pacientes atendidos em ${ano}</h2>
    <div class="grade">${blocos.map(([t, k]) => `<div class="card"><strong>${t}</strong>${contar(pacAno, k).map(([v, n]) => `<div class="linha item"><span>${esc(v)}</span><b>${n}</b></div>`).join('') || '<p class="muted">—</p>'}</div>`).join('')}</div>
    <h2>Dor</h2>
    <div class="card">${dores.length ? `<p>Em ${dores.length} paciente(s) com 2 ou mais registros de dor no ano: média de <b>${f1br(media(dores.map(l => l[0].dor)))}</b> no primeiro e <b>${f1br(media(dores.map(l => l[l.length - 1].dor)))}</b> no último registro.</p>` : '<p class="muted">Sem pacientes com 2 ou mais registros de dor neste ano.</p>'}</div>
    <h2>Planilha</h2>
    <div class="card"><button id="pj-exp" ${noAno.size ? '' : 'disabled'}>Exportar resumo de ${ano} (CSV)</button>
      <button class="sec" id="pj-exp-at" ${todos.length ? '' : 'disabled'}>Exportar todos os atendimentos (CSV)</button></div>
    <p class="aviso">Para usar estes dados em pesquisa ou publicação, o projeto precisa de aprovação do Comitê de Ética em Pesquisa e do consentimento dos pacientes. Combine com o orientador antes de coletar.</p>`;
}

function ligarProjeto() {
  document.getElementById('pj-ano').onchange = e => { anoProjeto = e.target.value; render(); };
  document.getElementById('pj-exp').onclick = () => {
    const ano = document.getElementById('pj-ano').value, { ps, meses, noAno } = resumoAno(ano);
    const pacAno = ps.filter(p => noAno.has(p.id));
    const linhas = [['Mês', 'Atendimentos', 'Pacientes atendidos', 'Pacientes novos', 'Avaliações', 'Altas'],
      ...meses.map((m, i) => [MESES[i] + '/' + ano, m.at, m.pac.size, m.novos, m.aval, m.altas]),
      ['Total ' + ano, meses.reduce((s, m) => s + m.at, 0), noAno.size, meses.reduce((s, m) => s + m.novos, 0), meses.reduce((s, m) => s + m.aval, 0), meses.reduce((s, m) => s + m.altas, 0)], []];
    [['Região', 'regiao'], ['Esporte', 'esporte'], ['Sexo', 'sexo'], ['Situação atual', 'status']].forEach(([t, k]) => {
      linhas.push([t, 'Pacientes']); contar(pacAno, k).forEach(r => linhas.push(r)); linhas.push([]);
    });
    baixarCSV('Resumo_atendimentos_' + ano + '.csv', linhas);
  };
  document.getElementById('pj-exp-at').onclick = () => baixarCSV('Atendimentos_LAPRE_' + hojeISO() + '.csv', linhasCSVAtend());
}
