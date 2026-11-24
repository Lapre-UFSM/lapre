// Lembretes de agenda para o time responder os formulários (ex.: bem-estar antes e PSE depois do treino).
// O app só gera os eventos; quem avisa na hora é a agenda do celular. Nada é enviado para a internet.

const CHAVE_L = 'lapre.lembretes';
const DIAS_L = [['SU', 'Dom'], ['MO', 'Seg'], ['TU', 'Ter'], ['WE', 'Qua'], ['TH', 'Qui'], ['FR', 'Sex'], ['SA', 'Sáb']];
const lerConfL = () => { try { return JSON.parse(localStorage.getItem(CHAVE_L)) || null; } catch (e) { return null; } };
const confPadraoL = () => {
  const fim = new Date(); fim.setMonth(fim.getMonth() + 4);
  return { time: '', inicio: hojeISO(), fim: fim.toISOString().slice(0, 10), antes: 30, depois: 15,
    formAntes: 'hooper', formDepois: 'hooper', linkAntes: '', linkDepois: '',
    treinos: [{ dias: ['MO', 'WE'], ini: '18:00', fim: '20:00' }] };
};

// Formulários com link (os da liga) + "outro link" + "sem lembrete"
function opcoesFormL(sel) {
  const qs = QUESTIONARIOS.filter(q => q.url && !q.fechado);
  // Formulários de acompanhamento do time aparecem primeiro; os clínicos ficam num grupo separado
  const DO_TIME = ['Carga de treino e bem-estar', 'Sono', 'Saúde mental e psicologia do esporte'];
  const op = q => `<option value="${q.id}" ${q.id === sel ? 'selected' : ''}>${esc(q.sigla)}</option>`;
  return `<option value="">Sem lembrete</option>
    <optgroup label="Acompanhamento do time">${qs.filter(q => DO_TIME.includes(q.area)).map(op).join('')}<option value="outro" ${sel === 'outro' ? 'selected' : ''}>Outro link</option></optgroup>
    <optgroup label="Questionários clínicos">${qs.filter(q => !DO_TIME.includes(q.area)).map(op).join('')}</optgroup>`;
}
const linkFormL = (id, outro) => id === 'outro' ? outro.trim() : (id ? (qPorId(id) || {}).url || '' : '');
const nomeFormL = id => id === 'outro' ? 'formulário' : (qPorId(id) || {}).sigla || '';

function telaLembretes() {
  const c = lerConfL() || confPadraoL();
  return `<h1>Lembretes do time</h1>
    <p class="muted">Gera lembretes na agenda do celular dos atletas para responderem os formulários antes e depois do treino. Funciona sem servidor: quem avisa é a agenda (Google Agenda, calendário do iPhone ou da Samsung).</p>
    <div class="card"><strong>Time e período</strong>
      <label>Nome do time (aparece no lembrete)<input id="l-time" value="${esc(c.time)}" placeholder="ex.: Futsal feminino UFSM"></label>
      <div class="linha"><label style="flex:1">De<input type="date" id="l-inicio" value="${esc(c.inicio)}"></label>
      <label style="flex:1">Até<input type="date" id="l-fim" value="${esc(c.fim)}"></label></div></div>
    <div class="card"><strong>Horários de treino</strong>
      <p class="muted">Uma linha para cada horário diferente. Marque os dias que treinam nesse horário.</p>
      <div id="l-treinos">${c.treinos.map(linhaTreinoL).join('')}</div>
      <button class="sec" id="l-add" type="button">+ outro horário</button></div>
    <div class="card"><strong>Antes do treino</strong>
      <div class="linha"><label style="flex:1">Formulário<select id="l-fa">${opcoesFormL(c.formAntes)}</select></label>
      <label style="flex:1">Minutos antes<input id="l-antes" inputmode="numeric" value="${esc(c.antes)}"></label></div>
      <label id="l-la-box" ${c.formAntes === 'outro' ? '' : 'hidden'}>Link do formulário<input id="l-la" value="${esc(c.linkAntes)}" placeholder="https://..."></label></div>
    <div class="card"><strong>Depois do treino</strong>
      <div class="linha"><label style="flex:1">Formulário<select id="l-fd">${opcoesFormL(c.formDepois)}</select></label>
      <label style="flex:1">Minutos depois<input id="l-depois" inputmode="numeric" value="${esc(c.depois)}"></label></div>
      <label id="l-ld-box" ${c.formDepois === 'outro' ? '' : 'hidden'}>Link do formulário<input id="l-ld" value="${esc(c.linkDepois)}" placeholder="https://..."></label></div>
    <button id="l-gerar">Gerar lembretes</button>
    <div id="l-saida"></div>
    <p class="aviso">Se o horário do treino mudar, gere de novo e peça para apagarem os lembretes antigos. As respostas vão para a planilha do formulário do Google, não para este app.</p>`;
}
function linhaTreinoL(t) {
  return `<div class="treino card">
    <div class="dias">${DIAS_L.map(([k, n]) => `<label class="pill"><input type="checkbox" value="${k}" ${t.dias.includes(k) ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
    <div class="linha"><label style="flex:1">Início<input type="time" class="t-ini" value="${esc(t.ini)}"></label>
    <label style="flex:1">Fim<input type="time" class="t-fim" value="${esc(t.fim)}"></label>
    <button class="peq sec t-rem" type="button" title="Remover horário">✕</button></div></div>`;
}

function lerTelaL() {
  const v = id => document.getElementById(id).value;
  return { time: v('l-time').trim(), inicio: v('l-inicio'), fim: v('l-fim'), antes: num(v('l-antes')) ?? 0, depois: num(v('l-depois')) ?? 0,
    formAntes: v('l-fa'), formDepois: v('l-fd'), linkAntes: v('l-la'), linkDepois: v('l-ld'),
    treinos: [...document.querySelectorAll('#l-treinos .treino')].map(el => ({
      dias: [...el.querySelectorAll('.dias input:checked')].map(x => x.value), ini: el.querySelector('.t-ini').value, fim: el.querySelector('.t-fim').value })) };
}

// ---------- Datas ----------
const pad2 = n => String(n).padStart(2, '0');
const minutosDe = hhmm => { const [h, m] = (hhmm || '').split(':').map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
// Primeiro dia, a partir de `inicio`, que cai num dos dias marcados
function primeiroDiaL(inicio, dias) {
  const d = new Date(inicio + 'T12:00:00');
  for (let i = 0; i < 7; i++) { if (dias.includes(DIAS_L[d.getDay()][0])) return d; d.setDate(d.getDate() + 1); }
  return d;
}
// Data + minutos do dia -> '20261028T183000' (hora local, sem fuso)
function carimboL(dia, min) {
  const d = new Date(dia); d.setHours(0, 0, 0, 0); d.setMinutes(min);
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
}

// Monta a lista de lembretes: um por horário de treino e momento (antes/depois)
function lembretesL(c) {
  const lista = [], ate = c.fim.replace(/-/g, '') + 'T235959';
  c.treinos.forEach(t => {
    const ini = minutosDe(t.ini), fim = minutosDe(t.fim);
    if (!t.dias.length || ini === null || fim === null) return;
    const dia = primeiroDiaL(c.inicio, t.dias), dias = t.dias.join(',');
    const nomesDias = DIAS_L.filter(([k]) => t.dias.includes(k)).map(([, n]) => n).join(', ');
    [['antes', c.formAntes, c.linkAntes, Math.max(0, ini - c.antes)], ['depois', c.formDepois, c.linkDepois, Math.min(23 * 60 + 45, fim + c.depois)]].forEach(([mom, f, outro, min]) => {
      const link = linkFormL(f, outro);
      if (!f || !link) return;
      const titulo = `${mom === 'antes' ? 'Antes do treino' : 'Depois do treino'}: responder ${nomeFormL(f)}${c.time ? ' (' + c.time + ')' : ''}`;
      lista.push({ titulo, link, dias, nomesDias, hora: `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`,
        de: carimboL(dia, min), ate: carimboL(dia, min + 10), rrule: `FREQ=WEEKLY;BYDAY=${dias};UNTIL=${ate}`,
        texto: `Lembrete da LAPRE${c.time ? ' para o ' + c.time : ''}. Responda pelo link: ${link}` });
    });
  });
  return lista;
}

// Arquivo .ics (padrão de agenda): eventos semanais com alarme na hora do evento
function gerarICS(lista) {
  const escICS = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const dobra = l => { const out = []; while (l.length > 73) { out.push(l.slice(0, 73)); l = ' ' + l.slice(73); } out.push(l); return out.join('\r\n'); };
  const agora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ev = lista.map((e, i) => ['BEGIN:VEVENT', `UID:lapre-${agora}-${i}@lapre`, `DTSTAMP:${agora}`, `DTSTART:${e.de}`, `DTEND:${e.ate}`, `RRULE:${e.rrule}`,
    `SUMMARY:${escICS(e.titulo)}`, `DESCRIPTION:${escICS(e.texto)}`, `URL:${e.link}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escICS(e.titulo)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT']);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LAPRE UFSM//Lembretes//PT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...ev.flat(), 'END:VCALENDAR'].map(dobra).join('\r\n') + '\r\n';
}
// Link "Adicionar ao Google Agenda" (um por lembrete; aceita repetição semanal)
const linkGoogleL = e => 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
  action: 'TEMPLATE', text: e.titulo, dates: `${e.de}/${e.ate}`, details: e.texto, recur: 'RRULE:' + e.rrule, ctz: 'America/Sao_Paulo' }).toString();

function mensagemZapL(c, lista) {
  return `Pessoal${c.time ? ' do ' + c.time : ''}, para não esquecer os questionários da LAPRE, adicionem os lembretes na agenda do celular:\n\n` +
    lista.map(e => `• ${e.titulo} — ${e.nomesDias}, às ${e.hora}\n${linkGoogleL(e)}`).join('\n\n') +
    `\n\nNo iPhone, também dá para abrir o arquivo de agenda (.ics) que vou mandar aqui. Depois de adicionar, confira se a notificação está "no horário do evento".`;
}

function ligarLembretes() {
  const box = (sel, boxId) => document.getElementById(sel).addEventListener('change', e => { document.getElementById(boxId).hidden = e.target.value !== 'outro'; });
  box('l-fa', 'l-la-box'); box('l-fd', 'l-ld-box');
  const ligarRem = () => document.querySelectorAll('.t-rem').forEach(b => b.onclick = () => {
    if (document.querySelectorAll('#l-treinos .treino').length > 1) b.closest('.treino').remove();
  });
  ligarRem();
  document.getElementById('l-add').onclick = () => {
    document.getElementById('l-treinos').insertAdjacentHTML('beforeend', linhaTreinoL({ dias: [], ini: '18:00', fim: '20:00' }));
    ligarRem();
  };
  document.getElementById('l-gerar').onclick = () => {
    const c = lerTelaL(), saida = document.getElementById('l-saida');
    if (!c.inicio || !c.fim || c.fim < c.inicio) return alert('Confira o período (a data final deve ser depois da inicial).');
    try { localStorage.setItem(CHAVE_L, JSON.stringify(c)); } catch (e) { /* segue sem guardar */ }
    const lista = lembretesL(c);
    if (!lista.length) { saida.innerHTML = '<p class="aviso">Nenhum lembrete: marque ao menos um dia, os horários e um formulário com link.</p>'; return; }
    const ics = gerarICS(lista), msg = mensagemZapL(c, lista);
    saida.innerHTML = `<div class="card"><strong>${lista.length} lembrete(s) semanal(is)</strong>
      ${lista.map(e => `<div class="linha item"><span>${esc(e.titulo)}<br><span class="muted">${esc(e.nomesDias)} às ${e.hora}</span></span>
        <a class="peq-link" href="${esc(linkGoogleL(e))}" target="_blank" rel="noopener">Google Agenda</a></div>`).join('')}
      <button id="l-ics">Baixar arquivo de agenda (.ics)</button>
      <button class="sec" id="l-zap">Enviar pelo WhatsApp</button><button class="sec" id="l-copiar">Copiar mensagem</button>
      <p class="muted" id="l-msg"></p>
      <details><summary>Como os atletas adicionam</summary><ul><li><b>Android:</b> tocar no link "Adicionar ao Google Agenda" da mensagem e salvar o evento.</li>
        <li><b>iPhone:</b> abrir o arquivo .ics no Safari ou no app Arquivos e tocar em "Adicionar tudo".</li>
        <li>Conferir a notificação do evento: deve estar "no horário do evento" (o Google Agenda às vezes coloca 30 minutos antes).</li></ul></details></div>`;
    document.getElementById('l-ics').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      a.download = 'Lembretes_' + (c.time || 'LAPRE').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') + '.ics'; a.click();
    };
    document.getElementById('l-zap').onclick = () => abrirWhatsApp(msg, '');
    document.getElementById('l-copiar').onclick = async () => {
      try { await navigator.clipboard.writeText(msg); document.getElementById('l-msg').textContent = 'Mensagem copiada.'; } catch (e) { prompt('Copie a mensagem:', msg); }
    };
  };
}
