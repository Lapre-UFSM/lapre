// Telas do app. Navegação por "#/rota" (sem recarregar a página).

const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lista = (arr, tag = 'ul') => `<${tag}>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</${tag}>`;
const tags = arr => arr.map(t => `<span class="tag">${esc(t)}</span>`).join('');
const voltar = (href, txt = 'Voltar') => `<a class="voltar" href="${href}">← ${txt}</a>`;

// ---------- Telas simples (conteúdo) ----------
function telaInicio() {
  const cards = [
    ['#/comecar', 'Como começar', 'O app no dia a dia, em 4 passos'],
    ['#/testes', 'Testes de avaliação', 'Como aplicar e interpretar'],
    ['#/exercicios', 'Exercícios', 'Progressões e regressões'],
    ['#/prevencao', 'Prevenção', 'FIFA 11+ e outros'],
    ['#/protocolos', 'Protocolos', 'Reabilitação por fases'],
    ['#/anatomia', 'Anatomia', 'Quadril, joelho, tornozelo e pé'],
    ['#/calculadoras', 'Calculadoras', 'LSI, Y Balance'],
    ['#/casos', 'Casos clínicos', 'Treine o raciocínio'],
    ['#/questionarios', 'Questionários', 'Escalas e envio por WhatsApp'],
    ['#/pre', 'Pré-temporada', 'Registro de testes e planilha'],
    ['#/evolucao', 'Evolução', 'Avaliações e evoluções (SOAP)'],
    ['#/projeto', 'Atendimentos', 'Números do mês para projetos'],
    ['#/lembretes', 'Lembretes do time', 'Agenda para responder antes e depois do treino'],
    ['#/copia', 'Cópia de segurança', 'Guardar e recuperar os dados do aparelho'],
    ['#/referencias', 'Referências', 'Artigos e fontes']
  ];
  // "Como começar" fica no topo; o resto em ordem alfabética
  cards.splice(1, cards.length, ...cards.slice(1).sort((x, y) => x[1].localeCompare(y[1], 'pt-BR')));
  // Lembra de fazer cópia quando há dados e a última cópia tem mais de 7 dias (ou nunca foi feita)
  const dias = diasDesdeBackup();
  const lembrarCopia = chavesDoApp().some(k => !k.startsWith('lapre.rascunho') && k !== 'lapre.lembretes') && (dias === null || dias > 7);
  return `<section class="hero">
      <div class="hero-texto"><span class="selo">UFSM</span><h1>Avaliar, prevenir e reabilitar.</h1>
        <p>Liga de Avaliação, Prevenção e Reabilitação Esportiva. Funciona sem internet depois de aberto uma vez.</p></div>
      <div class="hero-logo"><img src="imagens/logo-marca.svg" alt="Logo da LAPRE"><b>LAPRE</b></div>
    </section>
    ${lembrarCopia ? `<p class="aviso">Os dados ficam só neste aparelho. ${dias === null ? 'Você ainda não fez' : `Sua última cópia foi há ${dias} dias. Faça`} uma <a href="#/copia">cópia de segurança</a>.</p>` : ''}
    <div class="grade">${cards.map((c, i) => `<a class="card link" href="${c[0]}"><span class="num">${String(i + 1).padStart(2, '0')}</span><strong>${c[1]}</strong><span>${c[2]}</span></a>`).join('')}</div>
    <p class="aviso">Conteúdo educacional em construção. Não substitui o julgamento clínico.</p>`;
}

function telaTestes() {
  const regioes = ['Membro inferior', 'Membro superior', 'Coluna', 'Geral'];
  return `<h1>Testes de avaliação</h1>
    <input class="busca" id="busca" placeholder="Buscar teste, região ou tag...">
    <div id="itens">${regioes.map(r => {
      const lista = TESTES.filter(t => t.regiao === r);
      return `<section class="grupo"><h2>${esc(r)} <small>(${lista.length})</small></h2>
        ${lista.map(t => `<a class="card link" href="#/testes/${t.id}" data-busca="${esc((t.nome + t.regiao + t.tags.join(' ')).toLowerCase())}">
          <strong>${esc(t.nome)}</strong><div>${tags(t.tags)}</div></a>`).join('')}</section>`;
    }).join('')}</div>`;
}

function telaTeste(id) {
  const t = TESTES.find(x => x.id === id);
  if (!t) return naoEncontrado();
  const fonte = t.fonte === 'liga' ? 'Fonte: documento da liga (revisar com o orientador)' : 'Fonte: literatura (conferir as referências)';
  return `${voltar('#/testes', 'Testes')}<h1>${esc(t.nome)}</h1><div><span class="tag fonte">${esc(t.regiao)}</span>${tags(t.tags)}</div><p class="muted">${fonte}</p>
    <h2>Objetivo</h2><p>${esc(t.objetivo)}</p>
    <h2>Como aplicar</h2>${lista(t.como, 'ol')}
    <h2>O que observar</h2>${lista(t.observar)}
    <h2>Interpretação</h2>${lista(t.interpretacao)}
    <h2>Erros comuns</h2>${lista(t.erros)}
    <h2>Referências</h2>${lista(t.refs)}
    <p class="aviso">Confirme valores de corte com o orientador antes de usar clinicamente.</p>`;
}

function telaExercicios() {
  return `<h1>Exercícios</h1>
    <input class="busca" id="busca" placeholder="Buscar exercício ou tag...">
    <div id="itens">${EXERCICIOS.map(e => `<div class="card" data-busca="${esc((e.nome + e.tags.join(' ')).toLowerCase())}">
      <strong>${esc(e.nome)}</strong><div>${tags(e.tags)}</div><p>${esc(e.objetivo)}</p>
      <details><summary>Como fazer</summary>${lista(e.como, 'ol')}
        <p><b>Progressão:</b> ${esc(e.progressao)}</p><p><b>Regressão:</b> ${esc(e.regressao)}</p>${e.nota ? `<p><b>Evidência:</b> ${esc(e.nota)}</p>` : ''}${e.refs && e.refs.length ? `<details><summary>Referências (${e.refs.length})</summary>${listaRefs(e.refs)}</details>` : ''}</details></div>`).join('')}</div>`;
}

function telaPrevencao() {
  const exercicio = it => typeof it === 'string' ? `<li>${esc(it)}</li>` : `<details class="exerc"><summary>${esc(it.nome)}${it.dose ? ` <span class="muted">(${esc(it.dose)})</span>` : ''}</summary>
      ${it.oque ? `<p><b>Para que serve:</b> ${esc(it.oque)}</p>` : ''}
      ${it.como ? `<h4>Como fazer</h4>${lista(it.como, 'ol')}` : ''}
      ${it.niveis ? `<h4>Níveis</h4>${lista(it.niveis)}` : ''}</details>`;
  return `<h1>Prevenção</h1><p class="muted">Abra cada exercício para ver o que ele treina, como fazer e os níveis.</p>
    ${PREVENCAO.map(p => `<div class="card"><strong>${esc(p.nome)}</strong><p>${esc(p.resumo)}</p>
      ${p.quando ? `<p><b>Quando fazer:</b> ${esc(p.quando)}</p>` : ''}${p.material ? `<p><b>Material:</b> ${esc(p.material)}</p>` : ''}
      ${p.partes.map((pt, i) => `<h3>${esc(pt.nome)}</h3><div class="exercs">${pt.itens.map(exercicio).join('')}</div>`).join('')}
      ${p.cuidados ? `<details><summary>Cuidados</summary>${lista(p.cuidados)}</details>` : ''}
      <details><summary>O que a literatura mostra</summary>${Array.isArray(p.evidencia) ? lista(p.evidencia) : `<p>${esc(p.evidencia)}</p>`}</details>
      <details><summary>Referências (${p.refs.length})</summary>${listaRefs(p.refs)}</details></div>`).join('')}`;
}

// Transforma "doi:10.xxxx" no fim da referência em link clicável
const refComLink = r => {
  const m = r.match(/^(.*?)\s*doi:(10\.\S+)$/);
  return m ? `${esc(m[1])} <a href="https://doi.org/${esc(m[2])}" target="_blank" rel="noopener">doi:${esc(m[2])}</a>` : esc(r);
};
const listaRefs = arr => `<ul class="refs">${arr.map(r => `<li>${refComLink(r)}</li>`).join('')}</ul>`;

function telaProtocolos() {
  return `<h1>Protocolos</h1>${PROTOCOLOS.map(p => `<div class="card"><strong>${esc(p.nome)}</strong>
    <div><span class="tag fonte">${p.fonte === 'liga' ? 'Protocolo da liga' : p.fonte === 'literatura' ? 'Guideline e literatura' : 'Exemplo'}</span></div>
    <p class="aviso">${esc(p.aviso)}</p>
    ${p.resumo ? `<p>${esc(p.resumo)}</p>` : ''}
    ${p.avaliacao ? `<details><summary>Avaliação inicial</summary>${lista(p.avaliacao)}</details>` : ''}
    ${p.fases.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.nome)}</summary>
      ${f.objetivos ? `<h3>Objetivos</h3>${lista(f.objetivos)}` : ''}${f.conteudo ? `<h3>Conduta</h3>${lista(f.conteudo)}` : ''}${f.criterios ? `<h3>${esc(f.rotuloCriterios || 'Critérios para progredir')}</h3>${lista(f.criterios)}` : ''}</details>`).join('')}
    ${p.evidencia ? `<details><summary>O que a literatura mostra</summary>${lista(p.evidencia)}</details>` : ''}
    ${p.refs ? `<details><summary>Referências (${p.refs.length})</summary>${listaRefs(p.refs)}</details>` : ''}</div>`).join('')}`;
}

function telaAnatomia() {
  return `<h1>Anatomia e biomecânica</h1><p class="muted">Resumos de aula da liga, com os pontos a confirmar marcados.</p>
    ${ANATOMIA.map(a => `<div class="card"><strong>${esc(a.nome)}</strong>
      <div><span class="tag fonte">${a.fonte === 'liga' ? 'Resumo da liga' : 'Literatura (sem resumo da liga)'}</span></div>
      <p class="aviso">${esc(a.aviso)}</p><p>${esc(a.resumo)}</p>
      ${a.secoes.map((s, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(s.titulo)}</summary>${lista(s.itens)}</details>`).join('')}
      ${a.clinica ? `<details><summary>Na prática clínica</summary>${lista(a.clinica)}</details>` : ''}
      ${a.confirmar ? `<details><summary>Confirmar antes de usar</summary>${lista(a.confirmar)}</details>` : ''}
      ${a.refs ? `<details><summary>Referências (${a.refs.length})</summary>${listaRefs(a.refs)}</details>` : ''}</div>`).join('')}`;
}

function telaCasos() {
  return `<h1>Casos clínicos</h1><p class="muted">Pense na resposta antes de abrir.</p>
    ${CASOS.map(c => `<div class="card"><strong>${esc(c.nome)}</strong><p>${esc(c.historia)}</p>
      ${c.perguntas.map(p => `<details><summary>${esc(p.q)}</summary><p>${esc(p.r)}</p></details>`).join('')}
      ${c.refs ? `<details><summary>Referências (${c.refs.length})</summary>${listaRefs(c.refs)}</details>` : ''}</div>`).join('')}`;
}

function telaReferencias() {
  const todas = [...TESTES.flatMap(t => t.refs), ...PREVENCAO.flatMap(p => p.refs), ...PROTOCOLOS.flatMap(p => p.refs || []), ...ANATOMIA.flatMap(a => a.refs || []), ...CASOS.flatMap(c => c.refs || []), ...EXERCICIOS.flatMap(e => e.refs || [])];
  const doiDe = r => (r.match(/10\.\d{4,}\/\S+/) || [''])[0].toLowerCase().replace(/[.,;]+$/, '');
  const vistas = new Set();
  const unicas = todas.filter(r => { const k = doiDe(r) || r; if (vistas.has(k)) return false; vistas.add(k); return true; });
  return `<h1>Referências</h1>${listaRefs(unicas)}<p class="aviso">Confira cada referência antes de citar em trabalhos.</p>`;
}

// ---------- Calculadoras ----------
function telaCalculadoras() {
  return `<h1>Calculadoras</h1>
    <div class="card"><strong>Simetria dos membros (LSI)</strong>
      <p class="muted">Membro envolvido ÷ não envolvido × 100</p>
      <label>Membro envolvido<input type="text" inputmode="decimal" id="lsi-a"></label>
      <label>Membro não envolvido<input type="text" inputmode="decimal" id="lsi-b"></label>
      <div class="resultado" id="lsi-r">—</div></div>
    <div class="card"><strong>Y Balance: escore composto</strong>
      <p class="muted">(ANT + PM + PL) ÷ (3 × comprimento do membro) × 100</p>
      <label>Comprimento do membro (cm)<input type="text" inputmode="decimal" id="y-c"></label>
      <label>Anterior (cm)<input type="text" inputmode="decimal" id="y-a"></label>
      <label>Póstero-medial (cm)<input type="text" inputmode="decimal" id="y-m"></label>
      <label>Póstero-lateral (cm)<input type="text" inputmode="decimal" id="y-l"></label>
      <div class="resultado" id="y-r">—</div></div>`;
}

function ligarCalculadoras() {
  const $ = id => document.getElementById(id);
  const lsi = () => {
    const a = num($('lsi-a').value), b = num($('lsi-b').value);
    if (!a || !b) { $('lsi-r').textContent = '—'; return; }
    const v = a / b * 100;
    $('lsi-r').innerHTML = `LSI: <b>${f1(v)}%</b> ${v >= 90 ? '<span class="ok">≥ 90%</span>' : '<span class="alerta">abaixo de 90%</span>'}`;
  };
  const y = () => {
    const c = num($('y-c').value), a = num($('y-a').value), m = num($('y-m').value), l = num($('y-l').value);
    if (!c || !a || !m || !l) { $('y-r').textContent = '—'; return; }
    $('y-r').innerHTML = `Composto: <b>${f1((a + m + l) / (3 * c) * 100)}%</b>`;
  };
  ['lsi-a', 'lsi-b'].forEach(i => $(i).addEventListener('input', lsi));
  ['y-c', 'y-a', 'y-m', 'y-l'].forEach(i => $(i).addEventListener('input', y));
}

// ---------- Pré-temporada ----------
function telaPre() {
  const avs = carregarAvaliacoes();
  return `<h1>Pré-temporada e reavaliações</h1>
    <p class="muted">Os dados ficam só neste aparelho. Exporte para planilha ao terminar.</p>
    <p class="muted">Para o time lembrar dos questionários semanais: <a href="#/lembretes">Lembretes do time</a>.</p>
    <div class="card"><strong>Nova avaliação</strong>
      <label>Nome (ex.: Futsal Feminino, pré 2026)<input id="av-nome"></label>
      <button id="av-criar">Criar</button></div>
    ${avs.map(a => `<a class="card link" href="#/pre/${a.id}"><strong>${esc(a.nome)}</strong>
      <span>${a.atletas.length} atleta(s) · ${a.testes.length} teste(s)</span></a>`).join('') || '<p class="muted">Nenhuma avaliação ainda.</p>'}`;
}

function ligarPre() {
  document.getElementById('av-criar').onclick = () => {
    const nome = document.getElementById('av-nome').value.trim();
    if (!nome) return alert('Dê um nome para a avaliação.');
    const avs = carregarAvaliacoes();
    const av = { id: novoId(), nome, testes: ['basico', 'single_hop', 'ybt'], atletas: [],
      temporada: String(new Date().getFullYear()), momento: 'Pré-temporada', data: new Date().toISOString().slice(0, 10) };
    avs.push(av);
    if (!salvarAvaliacoes(avs)) return;
    location.hash = '#/pre/' + av.id;
  };
}

function acharAv(id) {
  const avs = carregarAvaliacoes();
  return { avs, av: avs.find(a => a.id === id) };
}

// Campo de lançamento da pré-temporada: lista de escolha (opcoes), texto ou número
function campoPre(c, valor, attrs) {
  if (c.opcoes) {
    const ops = c.opcoes.map(o => Array.isArray(o) ? o : [o, o]);
    return `<select ${attrs}${c.tipo === 'texto' ? ' data-t="texto"' : ''}><option value="">—</option>${ops.map(([v, r]) => `<option value="${esc(v)}" ${String(v) === String(valor ?? '') ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>`;
  }
  return c.tipo === 'texto'
    ? `<input type="text" class="txt" ${attrs} data-t="texto" value="${esc(valor ?? '')}">`
    : `<input type="text" inputmode="decimal" ${attrs} value="${esc(valor ?? '')}">`;
}
// Ficha de dados básicos que abre embaixo do nome do atleta
let fichaAberta = null;
const derFicha = a => { const t = testePorId('basico'); return t.derivados(valoresDoTeste(a, t)).map(d => `${d.l}: ${f1(d.v) || '—'}`).join(' · '); };
const qtdFicha = a => testePorId('basico').campos.filter(c => (a.dados['basico.' + c.k] ?? '') !== '').length;

function telaAvaliacao(id) {
  const { av } = acharAv(id);
  if (!av) return naoEncontrado();
  return `${voltar('#/pre', 'Avaliações')}<h1>${esc(av.nome)}</h1>
    <div class="card"><strong>Dados da avaliação</strong>
      <p class="muted">Vão para o banco de pesquisa: permitem juntar equipes e temporadas e comparar pré, meio e fim.</p>
      <div class="ficha-campos">
        <label>Equipe<input class="txt" data-av="equipe" value="${esc(av.equipe || '')}" placeholder="ex.: Futsal feminino"></label>
        <label>Temporada<input class="txt" data-av="temporada" inputmode="numeric" value="${esc(av.temporada || '')}" placeholder="ex.: 2026"></label>
        <label>Momento<select data-av="momento"><option value="">—</option>${MOMENTOS.map(m => `<option ${m === av.momento ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label>
        <label>Data da coleta<input type="date" data-av="data" value="${esc(av.data || '')}"></label></div></div>
    <div class="card"><strong>Testes desta avaliação</strong>
      <p class="muted">Marque o que vocês vão aplicar neste time.</p>
      ${PRE_TESTES.map(t => `<label class="check"><input type="checkbox" data-teste="${t.id}" ${av.testes.includes(t.id) ? 'checked' : ''}> ${esc(t.nome)}</label>`).join('')}</div>
    <div class="card"><strong>Atletas (${av.atletas.length})</strong>
      <p class="aviso">São dados de saúde: ficam só neste celular. Não envie a planilha em grupos e faça a <a href="#/copia">cópia de segurança</a>.</p>
      <div class="linha"><input id="at-nome" placeholder="Nome do atleta" autocapitalize="words"><button id="at-add">Adicionar</button></div>
      <p class="muted" id="at-msg"></p>
      <p class="muted">Toque no nome para abrir os dados básicos do atleta.</p>
      ${av.atletas.map((a, i) => `<details class="ficha" data-i="${i}" ${fichaAberta === a.nome ? 'open' : ''}><summary>${esc(a.nome)} <span class="muted peq-txt">${qtdFicha(a)} de ${testePorId('basico').campos.length} dados</span></summary>
        <div class="ficha-campos">${testePorId('basico').campos.map(c => `<label>${esc(c.l)}${campoPre(c, a.dados['basico.' + c.k], `data-fk="${c.k}"`)}</label>`).join('')}</div>
        <p class="muted" data-der>${derFicha(a)}</p>
        <button class="peq sec" data-ren="${i}">corrigir nome</button> <button class="peq sec" data-rem="${i}">remover atleta</button></details>`).join('')}</div>
    <h2>Lançar dados</h2>
    <div class="grade">${av.testes.map(tid => `<a class="card link" href="#/pre/${av.id}/${tid}"><strong>${esc(testePorId(tid).nome)}</strong></a>`).join('')}</div>
    <h2>Planilha</h2>
    <div class="card">
      <button id="exp">Exportar para planilha (CSV)</button>
      <label class="arquivo">Juntar planilha de outro celular<input type="file" id="imp" accept=".csv,text/csv"></label>
      <p class="muted" id="msg"></p></div>
    <div class="card"><strong>Para pesquisa (TCC, artigos)</strong>
      <p class="muted">Banco pronto para estatística: uma linha por atleta, cada atleta com um ID de pesquisa (o mesmo nome gera sempre o mesmo ID), variáveis com nome curto e o dicionário de dados explicando cada coluna.</p>
      <label>Programa<select id="pq-fmt"><option value="estat">Jamovi, JASP, R ou SPSS (vírgula e ponto decimal)</option><option value="excel">Excel (ponto e vírgula e vírgula decimal)</option></select></label>
      <label class="check"><input type="checkbox" id="pq-nome"> Incluir o nome do atleta (só para uso interno da liga)</label>
      <button id="pq-banco">Baixar banco de dados</button> <button class="sec" id="pq-dic">Baixar dicionário de dados</button></div>
    <button class="perigo" id="apagar">Apagar esta avaliação</button>`;
}

function ligarAvaliacao(id) {
  const rerender = () => { render(); };
  const salvar = fn => { const { avs, av } = acharAv(id); fn(av); return salvarAvaliacoes(avs); };
  document.querySelectorAll('[data-teste]').forEach(cb => cb.onchange = () => {
    salvar(av => { av.testes = PRE_TESTES.map(t => t.id).filter(t => t === cb.dataset.teste ? cb.checked : av.testes.includes(t)); });
    rerender();
  });
  const msg = t => { document.getElementById('at-msg').textContent = t; };
  // Adiciona um atleta pelo nome (sem repetir o mesmo nome na avaliação)
  const addNome = nome => {
    nome = limparNome(nome);
    if (!nome) return;
    if (acharAv(id).av.atletas.some(a => chaveNome(a.nome) === chaveNome(nome))) return msg(`${nome} já está na lista.`);
    salvar(av => { av.atletas.push({ nome, dados: {} }); });
    fichaAberta = nome;
    rerender();
  };
  const add = () => addNome(document.getElementById('at-nome').value);
  document.querySelectorAll('[data-ren]').forEach(b => b.onclick = () => {
    const { av } = acharAv(id); const atual = av.atletas[b.dataset.ren].nome;
    const novo = limparNome(prompt(`Nome correto de ${atual}:`, atual) || '');
    if (!novo || novo === atual) return;
    if (av.atletas.some((a, j) => j != b.dataset.ren && chaveNome(a.nome) === chaveNome(novo))) return alert(`${novo} já está na lista.`);
    salvar(av => { av.atletas[b.dataset.ren].nome = novo; });
    fichaAberta = novo;
    rerender();
  });
  // ficha aberta logo depois de adicionar: o cursor já vai para o primeiro dado
  const aberta = document.querySelector('details.ficha[open] [data-fk]');
  if (aberta && fichaAberta) { aberta.focus(); fichaAberta = null; }
  document.querySelectorAll('[data-fk]').forEach(el => ['input', 'change'].forEach(ev => el.addEventListener(ev, () => {
    const det = el.closest('details');
    const { avs, av } = acharAv(id); const a = av.atletas[det.dataset.i];
    a.dados['basico.' + el.dataset.fk] = el.dataset.t === 'texto' ? el.value.trim() : el.value.trim().replace(',', '.');
    if (!av.testes.includes('basico')) { av.testes.unshift('basico'); const cb = document.querySelector('[data-teste="basico"]'); if (cb) cb.checked = true; }
    salvarAvaliacoes(avs);
    det.querySelector('[data-der]').textContent = derFicha(a);
    det.querySelector('summary .muted').textContent = `${qtdFicha(a)} de ${testePorId('basico').campos.length} dados`;
  })));
  document.getElementById('at-add').onclick = add;
  document.getElementById('at-nome').onkeydown = e => { if (e.key === 'Enter') add(); };
  document.querySelectorAll('[data-rem]').forEach(b => b.onclick = () => {
    const { av } = acharAv(id);
    if (!confirm(`Remover ${av.atletas[b.dataset.rem].nome} e os dados dele(a)?`)) return;
    salvar(av => av.atletas.splice(b.dataset.rem, 1));
    rerender();
  });
  // Dados da avaliação (equipe, temporada, momento, data)
  document.querySelectorAll('[data-av]').forEach(el => el.onchange = () => salvar(av => { av[el.dataset.av] = el.value.trim(); }));
  // Exportação para pesquisa
  const arqPq = (av, sufixo) => av.nome.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') + '_' + sufixo + '.csv';
  const fmtPq = () => document.getElementById('pq-fmt').value;
  document.getElementById('pq-banco').onclick = () => {
    const { av } = acharAv(id);
    baixarArquivo(arqPq(av, 'pesquisa'), gerarCSVPesquisa(av, { comNome: document.getElementById('pq-nome').checked, formato: fmtPq() }), 'text/csv;charset=utf-8');
  };
  document.getElementById('pq-dic').onclick = () => {
    const { av } = acharAv(id);
    baixarArquivo(arqPq(av, 'dicionario'), gerarDicionario(av, { formato: fmtPq() }), 'text/csv;charset=utf-8');
  };
  document.getElementById('exp').onclick = () => {
    const { av } = acharAv(id);
    const blob = new Blob([gerarCSV(av)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = av.nome.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') + '.csv';
    a.click();
  };
  document.getElementById('imp').onchange = async e => {
    const arq = e.target.files[0]; if (!arq) return;
    const texto = await arq.text();
    let r;
    salvar(av => { r = importarCSV(av, texto); });
    if (r.erro) document.getElementById('msg').textContent = r.erro;
    else { render(); document.getElementById('msg').textContent = `Importado: ${r.celulas} valores, ${r.novos} atleta(s) novo(s). Atletas com o mesmo nome foram juntados.`; }
  };
  document.getElementById('apagar').onclick = () => {
    const { av } = acharAv(id);
    if (!confirm(`Apagar "${av.nome}" e todos os dados? Isso não pode ser desfeito.`)) return;
    salvarAvaliacoes(carregarAvaliacoes().filter(a => a.id !== id));
    location.hash = '#/pre';
  };
}

// Tela de lançamento: uma tabela atletas x campos para UM teste (cada pessoa fica no seu teste)
function telaLancamento(id, tid) {
  const { av } = acharAv(id); const t = testePorId(tid);
  if (!av || !t) return naoEncontrado();
  if (!av.atletas.length) return `${voltar('#/pre/' + id)}<h1>${esc(t.nome)}</h1><p class="muted">Adicione atletas primeiro.</p>`;
  const rotulosDer = t.derivados({}).map(d => d.l);
  return `${voltar('#/pre/' + id, av.nome)}<h1>${esc(t.nome)}</h1>
    <p class="muted">Salva automaticamente. Aceita vírgula ou ponto.</p>
    ${t.nota ? `<p class="muted">${esc(t.nota)}</p>` : ''}${t.refs ? `<details><summary>Referências</summary>${lista(t.refs)}</details>` : ''}
    <div class="tabela-rolagem"><table class="lanc"><thead><tr><th>Atleta</th>${t.campos.map(c => `<th>${esc(c.l)}</th>`).join('')}${rotulosDer.map(l => `<th class="der">${esc(l)}</th>`).join('')}</tr></thead>
    <tbody>${av.atletas.map((a, i) => `<tr data-i="${i}"><td class="nome">${esc(a.nome)}</td>
      ${t.campos.map(c => `<td>${campoPre(c, a.dados[tid + '.' + c.k], `data-k="${c.k}"`)}</td>`).join('')}
      ${t.derivados(valoresDoTeste(a, t)).map((d, j) => `<td class="der" data-d="${j}">${f1(d.v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function ligarLancamento(id, tid) {
  const t = testePorId(tid);
  document.querySelectorAll('.lanc input, .lanc select').forEach(inp => ['input', 'change'].forEach(ev => inp.addEventListener(ev, () => {
    const tr = inp.closest('tr'); const { avs, av } = acharAv(id);
    const a = av.atletas[tr.dataset.i];
    // números aceitam vírgula; campos de texto ficam como foram digitados
    a.dados[tid + '.' + inp.dataset.k] = inp.dataset.t === 'texto' ? inp.value.trim() : inp.value.trim().replace(',', '.');
    salvarAvaliacoes(avs);
    // Atualiza só as colunas calculadas desta linha (não perde o foco do teclado)
    t.derivados(valoresDoTeste(a, t)).forEach((d, j) => { tr.querySelector(`[data-d="${j}"]`).textContent = f1(d.v); });
  })));
}

// ---------- Como começar ----------
function telaComecar() {
  const passo = (titulo, href, link, itens) => `<div class="card"><strong>${titulo}</strong>${lista(itens, 'ol')}<a href="${href}">${link} →</a></div>`;
  return `<h1>Como começar</h1>
    <p class="muted">Os quatro usos do dia a dia na liga e no estágio.</p>
    <div class="card"><strong>Antes de tudo</strong>${lista([
      'Instale o app: no celular, abra o site e toque em "Adicionar à tela inicial". Depois funciona sem internet.',
      'Atletas e pacientes são cadastrados pelo nome. São dados de saúde: não envie as planilhas em grupos.',
      'Tudo o que você digita fica só no seu celular. Ninguém mais vê, e se o celular sumir os dados somem junto.',
      'O conteúdo clínico é rascunho em revisão pelo orientador. Não substitui o julgamento clínico.'])}</div>
    ${passo('1. Pré-temporada do time', '#/pre', 'Abrir a pré-temporada', [
      'Crie a avaliação com o nome do time e a temporada.',
      'Digite o nome de cada atleta e toque em "Adicionar": a ficha de dados básicos abre logo embaixo.',
      'Cada pessoa da liga fica num teste e lança os dados no próprio celular.',
      'No fim, cada um exporta a planilha (CSV) e uma pessoa junta todas com "Juntar planilha de outro celular".'])}
    ${passo('2. Paciente na clínica', '#/evolucao', 'Abrir a Evolução', [
      'Digite o nome do paciente e toque em "Criar".',
      'Registre a avaliação inicial e as evoluções no formato SOAP, com a dor de 0 a 10.',
      'Aplique o questionário da região na avaliação, na reavaliação e na alta.'])}
    ${passo('3. Acompanhamento semanal do time', '#/lembretes', 'Montar os lembretes', [
      'Monte os horários de treino do time e escolha o formulário de antes e o de depois do treino.',
      'Envie o arquivo de agenda ou a mensagem pelo WhatsApp do time.',
      'As respostas vão para a planilha do Google da liga, não para o app.'])}
    ${passo('4. No fim do dia', '#/copia', 'Fazer a cópia de segurança', [
      'Faça a cópia de segurança e guarde o arquivo na pasta da liga (com acesso restrito).',
      'Se trocar de celular, use "Recuperar de uma cópia".'])}`;
}

// ---------- Cópia de segurança ----------
function telaCopia() {
  const dias = diasDesdeBackup();
  const n = k => { try { return (JSON.parse(localStorage.getItem(k)) || []).length; } catch (e) { return 0; } };
  return `<h1>Cópia de segurança</h1>
    <p class="muted">Pré-temporada, Evolução e Questionários ficam só neste aparelho. Se limpar o navegador, trocar ou perder o celular, os dados somem. A cópia é um arquivo com tudo, que você guarda na pasta da liga (Drive) e usa para recuperar.</p>
    <div class="card"><strong>Neste aparelho</strong>
      <p>${n('lapre.avaliacoes')} avaliação(ões) de pré-temporada · ${n('lapre.pacientes')} paciente(s) · ${n('lapre.questionarios')} questionário(s) preenchido(s)</p>
      <p class="muted">${dias === null ? 'Nenhuma cópia feita ainda.' : dias === 0 ? 'Última cópia: hoje.' : `Última cópia: há ${dias} dia(s).`}</p>
      <button id="cp-baixar">Fazer cópia de segurança</button></div>
    <div class="card"><strong>Recuperar de uma cópia</strong>
      <p class="muted">Troca os dados deste aparelho pelos do arquivo. Antes, o app baixa uma cópia do que está aqui agora, por garantia.</p>
      <label class="arquivo">Escolher arquivo da cópia (.json)<input type="file" id="cp-arq" accept=".json,application/json"></label>
      <p class="muted" id="cp-msg"></p></div>
    <p class="aviso">O arquivo tem nomes e dados de saúde. Guarde em pasta com acesso restrito e não envie em grupos.</p>`;
}

function ligarCopia() {
  document.getElementById('cp-baixar').onclick = () => { baixarBackup(); render(); };
  document.getElementById('cp-arq').onchange = async e => {
    const arq = e.target.files[0]; if (!arq) return;
    const r = lerBackup(await arq.text());
    const msg = document.getElementById('cp-msg');
    if (r.erro) { msg.textContent = r.erro; return; }
    const quando = r.criado ? new Date(r.criado).toLocaleString('pt-BR') : 'data desconhecida';
    if (!confirm(`Recuperar a cópia de ${quando}? Os dados atuais deste aparelho serão trocados pelos do arquivo (uma cópia do que está aqui será baixada antes).`)) return;
    baixarBackup('lapre-antes-de-recuperar');
    if (restaurarBackup(r.dados)) { render(); document.getElementById('cp-msg').textContent = 'Cópia recuperada.'; }
    else msg.textContent = 'Não foi possível recuperar: falta espaço no aparelho.';
  };
}

// ---------- Roteador ----------
function naoEncontrado() { return `<h1>Não encontrado</h1><a href="#/">Voltar ao início</a>`; }

function render() {
  const [r, a, b, c] = location.hash.replace(/^#\//, '').split('/');
  let html, depois = () => {};
  switch (r || '') {
    case '': html = telaInicio(); break;
    case 'testes': html = a ? telaTeste(a) : telaTestes(); if (!a) depois = ligarBusca; break;
    case 'exercicios': html = telaExercicios(); depois = ligarBusca; break;
    case 'prevencao': html = telaPrevencao(); break;
    case 'protocolos': html = telaProtocolos(); break;
    case 'anatomia': html = telaAnatomia(); break;
    case 'casos': html = telaCasos(); break;
    case 'referencias': html = telaReferencias(); break;
    case 'calculadoras': html = telaCalculadoras(); depois = ligarCalculadoras; break;
    case 'questionarios':
      if (!a) { html = telaQuestionarios(); depois = ligarQuestionarios; }
      else if (!b) { html = telaQuestionario(a); depois = () => ligarQuestionario(a); }
      else if (b === 'preencher') { html = telaPreencher(a); depois = () => ligarPreencher(a); }
      else { html = telaResultado(a, c); depois = () => ligarResultado(a, c); }
      break;
    case 'pre':
      if (!a) { html = telaPre(); depois = ligarPre; }
      else if (!b) { html = telaAvaliacao(a); depois = () => ligarAvaliacao(a); }
      else { html = telaLancamento(a, b); depois = () => ligarLancamento(a, b); }
      break;
    case 'evolucao':
      if (!a) { html = telaPacientes(); depois = ligarPacientes; }
      else if (!b) { html = telaPaciente(a); depois = () => ligarPaciente(a); }
      else { html = telaAtendimento(a, b); depois = () => ligarAtendimento(a, b); }
      break;
    case 'projeto': html = telaProjeto(); depois = ligarProjeto; break;
    case 'lembretes': html = telaLembretes(); depois = ligarLembretes; break;
    case 'copia': html = telaCopia(); depois = ligarCopia; break;
    case 'comecar': html = telaComecar(); break;
    default: html = naoEncontrado();
  }
  app.innerHTML = html;
  depois();
  document.querySelectorAll('.menu a').forEach(l => l.classList.toggle('ativo', l.dataset.r === (r || '')));
  window.scrollTo(0, 0);
}

function ligarBusca() {
  const campo = document.getElementById('busca');
  campo.addEventListener('input', () => {
    const q = campo.value.toLowerCase().trim();
    document.querySelectorAll('#itens [data-busca]').forEach(el => { el.hidden = q && !el.dataset.busca.includes(q); });
    // esconde o título de um grupo quando nenhum item dele aparece
    document.querySelectorAll('#itens .grupo').forEach(g => { g.hidden = ![...g.querySelectorAll('[data-busca]')].some(el => !el.hidden); });
  });
}

window.addEventListener('hashchange', render);
render();

// Registra o service worker (offline). Só funciona via http(s) ou localhost.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  // Se a página já era controlada por um service worker, uma troca de controle significa versão nova do app.
  // (Na primeira instalação não havia controle antes, então não mostra nada.)
  const tinhaVersao = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!tinhaVersao || document.getElementById('faixa-versao')) return;
    // Não recarrega sozinho para não perder o que está sendo digitado: a pessoa toca quando puder.
    const f = document.createElement('div');
    f.id = 'faixa-versao';
    f.className = 'faixa-topo info';
    f.setAttribute('role', 'button');
    f.textContent = 'Nova versão disponível. Toque para atualizar.';
    f.onclick = () => location.reload();
    document.body.prepend(f);
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
