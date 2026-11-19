// Mundo vivo: bloques neutrales que toman partido, ciudades neutrales y apoyo interno.
export default function (G) {
  const { THREE, S, M, on, TABS, globe, R, ll2v, sprite, texDot, texSq, addLog, pushNews, beep, rand, defenses, silos, FONT } = G;
  const BLOCS = [
    { id: 'eur', name: 'Europa', lat: 50, lon: 12, base: 12, cities: [['Londres', 51.5, -0.1, 9.5e6], ['París', 48.9, 2.35, 11e6], ['Berlín', 52.5, 13.4, 4.5e6]] },
    { id: 'ind', name: 'India', lat: 21, lon: 79, base: 0, cities: [['Delhi', 28.6, 77.2, 32e6], ['Bombay', 19.1, 72.9, 21e6]] },
    { id: 'afr', name: 'África', lat: 4, lon: 21, base: 0, cities: [['Lagos', 6.5, 3.4, 15e6], ['El Cairo', 30.0, 31.2, 21e6]] },
    { id: 'pac', name: 'Pacífico', lat: -12, lon: 134, base: 6, cities: [['Tokio', 35.7, 139.7, 37e6], ['Sídney', -33.9, 151.2, 5.3e6], ['Yakarta', -6.2, 106.8, 11e6]] },
  ];
  const tagTex = b => { const c = b.cv || (b.cv = document.createElement('canvas')); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.clearRect(0, 0, 256, 64);
    const col = b.stance >= 50 ? '#6fc3ff' : b.stance <= -50 ? '#ff6a5a' : b.stance > 15 ? '#a8d8f0' : b.stance < -15 ? '#f0b0a0' : '#d8d8d0';
    g.fillStyle = 'rgba(2,10,13,0.75)'; g.fillRect(0, 0, 256, 64); g.strokeStyle = col; g.lineWidth = 4; g.strokeRect(2, 2, 252, 60);
    g.font = `26px ${FONT}`; g.fillStyle = col; g.textAlign = 'center'; g.fillText(b.name.toUpperCase(), 128, 28); g.font = `20px ${FONT}`; g.fillText(label(b), 128, 54);
    if (!b.tex) { b.tex = new THREE.CanvasTexture(c); b.tex.colorSpace = THREE.SRGBColorSpace; } b.tex.needsUpdate = true; return b.tex; };
  const label = b => b.stance >= 50 ? 'ALIADO' : b.stance <= -50 ? 'CON EL ENEMIGO' : b.stance > 15 ? 'favorable' : b.stance < -15 ? 'hostil' : 'neutral';
  for (const b of BLOCS) {
    b.stance = b.base; b.side = 0; b.n = ll2v(b.lat, b.lon);
    b.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex(b), transparent: true, depthWrite: false, toneMapped: false })); b.tag.scale.set(0.11, 0.0275, 1); b.tag.renderOrder = 2; b.tag.position.copy(b.n).multiplyScalar(R * 1.05); globe.add(b.tag);
    b.cityObjs = b.cities.map(([name, lat, lon, pop]) => { const c = { type: 'ncity', name, lat, lon, pop, popRemaining: pop, bloc: 'N', n: ll2v(lat, lon), blocRef: b }; c.mk = sprite(texDot, 0xe8e8d8, 0.018); c.mk.position.copy(c.n).multiplyScalar(R * 1.012); globe.add(c.mk); return c; });
  }
  G.world = { BLOCS, shift, get support() { return S.support; } };
  function shift(b, d, why) {
    const list = b ? [b] : BLOCS; for (const x of list) { const prev = x.side; x.stance = G.clamp(x.stance + d, -100, 100); x.side = x.stance >= 50 ? 1 : x.stance <= -50 ? -1 : 0; tagTex(x);
      if (x.side !== prev) sideChange(x, prev); }
    if (why) addLog(why, d > 0 ? '#a8d8f0' : '#f0b0a0'); G.dirty();
  }
  function sideChange(b, prev) {
    if (b.side === 1) { const d = { type: 'def', temp: true, ally: b, name: 'Radar ' + b.name, bloc: 'P', n: b.n.clone(), lat: b.lat, lon: b.lon, destroyed: false }; d.mk = sprite(texSq, 0x7dff9a, 0.024); d.mk.position.copy(d.n).multiplyScalar(R * 1.012); globe.add(d.mk); defenses.push(d); b.def = d;
      S.interceptors += 2; addLog(`${b.name} se alía con nosotros: radar y dos interceptores en su territorio.`, '#6fc3ff'); pushNews(`${b.name} anuncia su alineamiento con el bloque oeste.`); beep(660, 990, 0.1); }
    if (b.side === -1) { const e = G.launchers('E').filter(s => !s.sub)[0] || silos.find(s => s.bloc === 'E' && !s.destroyed); if (e) e.missiles += 3;
      addLog(`${b.name} se alinea con el enemigo: le cede bases y combustible (+3 misiles).`, '#ff6a5a'); pushNews(`${b.name} firma un pacto con el bloque este.`); G.alarm(2, 0.05); G.adj(6, -5); }
    if (prev === 1 && b.def) { const i = defenses.indexOf(b.def); if (i >= 0) defenses.splice(i, 1); globe.remove(b.def.mk); b.def = null; addLog(`${b.name} rompe la alianza y retira el radar.`, '#ffb340'); }
  }
  let lastNeg = 0, lastTen = 25, acc = 0;
  on('start', () => { lastNeg = S.negotiation; lastTen = S.tension; if (S.support === undefined) S.support = 62; for (const b of BLOCS) shift(b, 0); });
  on('update', dt => {
    acc += dt; if (acc < 1) return; acc = 0; if (S.ended) return;
    const dn = S.negotiation - lastNeg, dT = S.tension - lastTen; lastNeg = S.negotiation; lastTen = S.tension;
    if (dn >= 8) { shift(null, 3); S.support = Math.min(100, S.support + 3); }
    if (dT >= 9) { shift(null, -2); S.support = Math.max(0, S.support - 2); }
    if (S.phase < G.GUERRA) { if (S.tension > 75) S.support = Math.max(0, S.support - 0.25); else if (S.tension < 45) S.support = Math.min(100, S.support + 0.15);
      const avg = BLOCS.reduce((a, b) => a + b.stance, 0) / BLOCS.length; S.tension = G.clamp(S.tension - avg * 0.0012 / G.TS, 0, 100); }
    M.incomeK = (M.incomeBase || 1) * (0.6 + S.support / 100 * 0.8) * (1 + 0.12 * BLOCS.filter(b => b.side === 1).length);
    if (S.support < 18 && !S.riot) { S.riot = true; addLog('Disturbios en nuestras ciudades: el gobierno pierde autoridad.', '#ffb340'); pushNews('Barricadas frente a los ministerios.'); S.authority = Math.max(0, S.authority - 3); }
  });
  on('mods', () => { M.incomeBase = M.incomeK; });
  on('war', by => {
    if (by === 'P') { shift(null, S.falseAlarm ? -55 : -35, 'El mundo vio quién disparó primero. Los países neutrales se alejan de nosotros.'); S.support = Math.max(0, S.support - 25);
      if (S.pledge) { shift(null, -30, 'Rompimos nuestra palabra de no disparar primero.'); S.support = Math.max(0, S.support - 15); } }
    else { shift(null, 28, 'El mundo vio que ellos dispararon primero. Los países neutrales se acercan a nosotros.'); S.support = Math.min(100, S.support + 15); }
  });
  on('impact', (f, T, near) => {
    if (T.type === 'city' && T.bloc === 'E') shift(null, -3); else if (T.type === 'city' && T.bloc === 'P') { shift(null, 2); S.support = Math.max(0, S.support - 6); }
    if (T.type === 'ncity') { const k = T.popRemaining * rand(0.35, 0.6); T.popRemaining -= k; S.winterCas += k; S.winter = Math.min(100, S.winter + 3.2); T.mk.material.color.set(0x5a1a14); G.paintScar(T.lat, T.lon);
      addLog(`${T.name}, ciudad de un país que no estaba en guerra, fue alcanzada: ${G.fmtM(k)} de muertos.`, '#e8d8a0'); pushNews(`${T.name} destruida. ${T.blocRef.name} no había disparado un solo misil.`); G.civilRadio(); }
  });
  // el enemigo castiga a nuestros aliados
  on('enemyTarget', () => { const al = BLOCS.filter(b => b.side === 1); if (al.length && Math.random() < 0.14) return G.pick(G.pick(al).cityObjs); });
  TABS.world = { label: 'MUNDO', hint: 'Ayuda a un bloque: 2 ◆ (+12)',
    rows() { const live = S.started && !S.ended && S.phase < G.GUERRA;
      return [{ name: 'APOYO INTERNO', desc: 'Con poco apoyo ganas menos Autoridad', right: Math.round(S.support ?? 62) + ' %', on: false, owned: (S.support ?? 62) >= 60 },
        ...BLOCS.map(b => ({ name: b.name.toUpperCase(), desc: label(b) + ' · toca para enviar ayuda y acercarlo', right: (b.stance > 0 ? '+' : '') + Math.round(b.stance), on: live && S.authority >= 2, owned: b.side === 1 }))]; },
    click(i) { const b = BLOCS[i - 1]; if (!b || !S.started || S.ended || S.phase >= G.GUERRA) return; if (S.authority < 2) { beep(180, 140, 0.15, 'square', 0.04); return; }
      S.authority -= 2; shift(b, 12, `Ayuda enviada a ${b.name}.`); beep(660, 990, 0.08); } };
  on('reset', () => { for (const b of BLOCS) { if (b.def) { const i = defenses.indexOf(b.def); if (i >= 0) defenses.splice(i, 1); b.def = null; } b.side = 0; tagTex(b); } });
  G.world.restore = st => { for (const b of BLOCS) { b.stance = st && st[b.id] !== undefined ? st[b.id] : b.base; b.side = 0; tagTex(b); } };
  G.world.snapshot = () => Object.fromEntries(BLOCS.map(b => [b.id, Math.round(b.stance)]));
  G.world.resetCities = saved => { for (const b of BLOCS) for (const c of b.cityObjs) { c.popRemaining = saved && saved[c.name] !== undefined ? saved[c.name] : c.pop; c.mk.material.color.set(c.popRemaining < c.pop * 0.98 ? 0x5a1a14 : 0xe8e8d8); } };
}
