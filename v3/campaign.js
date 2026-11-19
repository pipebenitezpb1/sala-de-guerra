// Campaña de 4 noches con guardado: lo que pasa una noche cambia la siguiente.
export default function (G) {
  const { S, M, on, EVENTS, EV_SCHED, cities, silos, addLog, pushNews, FONT } = G;
  const KEY = 'sala-de-guerra-v3';
  const NIGHTS = [
    { title: 'LA ALARMA', date: '3 DE NOVIEMBRE · 02:40 ZULÚ', voice: 'brief_1', tension: 22, drift: 0.9, ghost: 0.1, eMiss: 4, sched: [[40, 'llamada'], [84, 'falsa'], [130, 'protestas'], [176, 'ejercicios']],
      body: 'Primera noche de guardia. Las negociaciones se rompieron ayer. Baje la tensión con la línea directa (descuelgue el teléfono rojo o use ACCIONES) y lleve la NEGOCIACIÓN a 100. Si la TENSIÓN llega a 100, ellos dispararán. Para lanzar: fije un objetivo en el globo, gire la llave, levante la tapa y apriete el botón rojo.' },
    { title: 'EL ESTRECHO', date: '9 DE NOVIEMBRE · 23:15 ZULÚ', voice: 'brief_2', tension: 34, drift: 1, ghost: 0.2, eMiss: 6, sub: true, sched: [[30, 'sub'], [70, 'generales'], [112, 'ejercicios'], [150, 'filtracion'], [196, 'llamada']],
      body: 'Seis días después. Dos flotas se vigilan en un estrecho de 40 km. Un submarino enemigo ya patrulla frente a nuestra costa. Tiene bombarderos y puede construir silos y defensas. Cada movimiento naval sube la tensión. Los países neutrales están mirando.' },
    { title: 'EL TOPO', date: '17 DE NOVIEMBRE · 04:05 ZULÚ', voice: 'brief_3', tension: 40, drift: 1.05, ghost: 0.42, eMiss: 6, realAlarm: true, sched: [[34, 'filtracion'], [74, 'falsa'], [118, 'llamada'], [160, 'generales'], [204, 'ejercicios']],
      body: 'Hay un infiltrado en el mando. Parte de lo que escuche esta noche es mentira: contactos de radar que no existen, llamadas que son trampas. Y la próxima alerta temprana podría ser real. Una red de informantes (MEJORAS · ESPIONAJE) ayuda a distinguir.' },
    { title: 'AMANECER', date: '24 DE NOVIEMBRE · 05:30 ZULÚ', voice: 'brief_4', tension: 50, drift: 1.25, ghost: 0.25, eMiss: 7, sub: true, sched: [[26, 'ejercicios'], [60, 'generales'], [96, 'falsa'], [134, 'sub'], [170, 'protestas'], [206, 'filtracion']],
      body: 'Última noche. Los dos bloques están en alerta máxima y la tensión sube más rápido que nunca. Todo lo que hizo en las noches anteriores cuenta: sus aliados, sus mejoras, la confianza del enemigo y las ciudades que ya no están. Si llega el amanecer sin que nadie dispare, se acaba la crisis.' },
  ];
  const fresh = () => ({ night: 0, owned: [], pops: {}, npops: {}, stance: null, trust: 0, support: 62, carry: 0, history: [] });
  let save = fresh(), epiPending = false;
  try { const raw = localStorage.getItem(KEY); if (raw) save = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
  const origFalse = EVENTS.falsa.opts[1][1];
  G.campaign = { NIGHTS, get save() { return save; }, reset() { save = fresh(); store(); if (G.tree) { G.tree.owned.clear(); G.tree.apply(); } }, setNight(n) { save.night = n; store(); } };
  if (G.tree) { for (const id of save.owned) G.tree.owned.add(id); }

  // botón en la portada
  const card = document.getElementById('card');
  if (card) { const el = document.createElement('div'); el.style.cssText = 'margin-top:18px;font-size:13px;color:#8fbfc6';
    const paint = () => { el.innerHTML = `Campaña: <b style="color:#e8f6f8">Noche ${Math.min(4, save.night + 1)} de 4 · ${NIGHTS[Math.min(3, save.night)].title}</b> &nbsp;·&nbsp; <a href="#" id="newc" style="color:#ff8a7a">empezar campaña nueva</a>`;
      el.querySelector('#newc').onclick = e => { e.preventDefault(); e.stopPropagation(); G.campaign.reset(); paint(); }; };
    paint(); card.insertBefore(el, card.querySelector('.hint')); }

  const night = () => NIGHTS[Math.min(3, save.night)];
  on('mods', () => { const n = night(); M.startTension = G.clamp(n.tension - save.trust * 6, 10, 70); M.startAuthority = 4 + Math.min(8, save.carry); M.driftK *= n.drift * (1 - 0.05 * Math.max(0, save.trust)); M.negK *= 1 + 0.1 * Math.max(0, save.trust); });
  function prepare() {
    const n = night();
    if (save.night >= 4) { save = fresh(); if (G.tree) G.tree.owned.clear(); store(); }
    if (G.tree) G.tree.apply(); else G.fire('mods');
    EV_SCHED.length = 0; for (const e of night().sched) EV_SCHED.push(e);
    S.ghostRate = night().ghost; S.support = save.support;
    for (const s of silos) if (s.bloc === 'E' && !s.temp) { s.max = night().eMiss; s.missiles = s.max; }
    for (const c of cities) { const p = save.pops[c.name]; if (p !== undefined) { c.popRemaining = p; if (p < c.pop * 0.98) { c.mk.material.color.set(0x5a1a14); c.burn.visible = true; c.hits = 1; } } }
    if (G.world) { G.world.restore(save.stance); G.world.resetCities(save.npops); }
    setTimeout(() => { for (const c of cities) if (c.popRemaining < c.pop * 0.98) G.paintScar(c.lat, c.lon); }, 2500);
    EVENTS.falsa.opts[1][1] = night().realAlarm ? () => { G.adj(6, 0); S.timers.push({ t: S.time + 14 * Math.max(G.TS, 0.5), fn: () => { if (S.phase >= G.GUERRA) return;
      if (Math.random() < 0.5) { addLog('La alerta era REAL. Los misiles ya están en vuelo.', '#ff4a3a'); G.startWar('E'); } else { G.say('Confirmado: era una falsa alarma.', 'ev_falsa_resuelta', 2, '#9dffb0'); G.adj(-8, 8); } } }); } : origFalse;
    if (night().sub) S.timers.push({ t: 1.5, fn: () => { if (!silos.some(s => s.sub && s.bloc === 'E')) G.addLauncher('Submarino enemigo', 33, -66, 'E', 4); } });
  }
  on('start', () => {
    prepare(); const n = night(), i = Math.min(3, save.night);
    S.tension = M.startTension; S.authority = M.startAuthority;
    const prev = save.history[save.history.length - 1];
    const recap = prev ? (prev.kind === 'paz' ? ' La noche anterior terminó en acuerdo: el enemigo confía un poco más en usted.' : ` La noche anterior murieron ${G.fmtM(prev.dead)} de personas. Las ciudades destruidas siguen en ruinas.`) : '';
    EVENTS._brief = { title: `NOCHE ${i + 1} DE 4 · ${n.title}`, color: '#8fd0ff', voice: n.voice, body: n.date + '. ' + n.body + recap,
      opts: [['ASUMIR EL MANDO', () => { S.paused = false; pushNews(`Noche ${i + 1}: los gobiernos guardan silencio.`); }]] };
    S.evQueue.push('_brief'); if (epiPending) { epiPending = false; S.evQueue.unshift('_epi'); } return true;
  });
  on('treeBuy', () => { save.owned = [...G.tree.owned]; store(); });
  on('end', kind => {
    const dead = S.enemyCas + S.playerCas + S.winterCas;
    save.history.push({ night: save.night, kind, dead: Math.round(dead), first: S.firstStriker, falseAlarm: S.falseAlarm });
    save.trust = G.clamp(save.trust + (kind === 'paz' ? 1 : S.firstStriker === 'P' ? -2 : -1), -3, 3);
    save.carry = Math.floor(S.authority / 2); save.support = Math.round(G.clamp((S.support ?? 62) + (kind === 'paz' ? 8 : -10), 5, 100));
    for (const c of cities) save.pops[c.name] = Math.round(c.popRemaining);
    if (G.world) { save.stance = G.world.snapshot(); for (const b of G.world.BLOCS) for (const c of b.cityObjs) save.npops[c.name] = Math.round(c.popRemaining); }
    if (G.tree) save.owned = [...G.tree.owned];
    const last = save.night >= 3; save.night++; store();
    const { g, w: W, h: H } = G.report; g.fillStyle = 'rgba(1,6,8,1)'; g.fillRect(12, H - 70, W - 24, 58); g.textAlign = 'center'; g.font = `30px ${FONT}`; g.fillStyle = '#8fd0ff';
    g.fillText(last ? 'Fin de la campaña · aprieta el gatillo para ver el epílogo' : `Aprieta el gatillo para pasar a la NOCHE ${save.night + 1}: ${NIGHTS[save.night].title}`, W / 2, H - 30); g.textAlign = 'left'; G.report.tex.needsUpdate = true;
  });
  on('reset', () => {
    if (save.night < 4) return;
    // epílogo
    const h = save.history, peace = h.filter(x => x.kind === 'paz').length, dead = h.reduce((a, x) => a + x.dead, 0), firsts = h.filter(x => x.first === 'P').length;
    let txt;
    if (peace === 4) txt = 'Cuatro noches. Cuatro amaneceres. Nadie fuera de esta sala sabrá jamás su nombre, ni lo cerca que estuvo todo. Vuelva a casa: lo están esperando.';
    else if (dead > 2e9) txt = `Murieron ${G.fmtM(dead)} de personas en cuatro noches. Ya no hay bloques, ni fronteras, ni nadie que reciba este informe. La foto de su escritorio sigue ahí.`;
    else if (firsts > 0) txt = `Usted dio la orden ${firsts === 1 ? 'una vez' : firsts + ' veces'}. ${G.fmtM(dead)} de personas murieron. Algunos lo llamarán firmeza. Usted sabrá cómo llamarlo cuando no pueda dormir.`;
    else txt = `Sobrevivió ${peace} de 4 noches sin que nadie disparara. En las otras murieron ${G.fmtM(dead)} de personas. Hizo lo que pudo. Pregúntese si era todo lo que podía.`;
    EVENTS._epi = { title: 'EPÍLOGO', color: '#e8d8a0', body: txt + ` Balance: ${peace} noches de paz, ${4 - peace} de guerra.`, opts: [['EMPEZAR UNA CAMPAÑA NUEVA', () => {}]] };
    epiPending = true;
  });
}
