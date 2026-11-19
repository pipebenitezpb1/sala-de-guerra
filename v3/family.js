// La familia de la foto vive en una de tus ciudades. Llaman durante la crisis; lo que le pase a esa ciudad, les pasa a ellos.
export default function (G) {
  const { THREE, S, on, EVENTS, cities, globe, R, addLog, FONT } = G;
  let local = { home: null, family: 'ok' };
  const sv = () => (G.campaign ? G.campaign.save : local), store = () => { if (G.campaign) G.campaign.store(); };
  // marcador de casa en el globo
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; { const g = cv.getContext('2d'); g.fillStyle = '#ffd27a'; g.beginPath(); g.moveTo(32, 8); g.lineTo(58, 30); g.lineTo(50, 30); g.lineTo(50, 54); g.lineTo(14, 54); g.lineTo(14, 30); g.lineTo(6, 30); g.closePath(); g.fill(); g.fillStyle = '#3a2a10'; g.fillRect(27, 38, 10, 16); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })); mark.scale.setScalar(0.03); mark.renderOrder = 3; mark.visible = false; globe.add(mark);

  let home = null, ring = null, ringLeft = 0, callAt = null, src = null;
  const NIGHT_CALLS = [
    { v: 'fam_1', t: 'Hola, amor. Perdona que llame a este número. Los niños preguntan si vienes a desayunar. No me digas nada, sé que no puedes. Solo vuelve.' },
    { v: 'fam_2', t: 'Hola. ¿Es verdad que va a haber una guerra? En el colegio dicen que sí. La profesora dijo que tú no ibas a dejar que pasara.' },
    { v: 'fam_3', t: 'Los vecinos están cargando el auto. Dicen que hay que salir de la ciudad esta noche. Tú sabes cosas que yo no. Dime la verdad: ¿nos vamos, o nos quedamos?', choice: true },
    { v: 'fam_4', t: 'No sé qué va a pasar esta noche. Pero pase lo que pase, estamos orgullosos de ti. Los niños ya se durmieron. Te dejé la luz prendida.' },
  ];
  function play(id) { const AC = G.AC; if (!AC) return; G.loadVoice(id).then(b => { if (src) try { src.stop(); } catch (e) {} src = AC.createBufferSource(); src.buffer = b; src.connect(G.radioIn); src.start(AC.currentTime + 0.4); }).catch(() => {}); }
  function card(body, opts) { EVENTS._fam = { title: 'LLAMADA: CASA · ' + home.name.toUpperCase(), color: '#ffd27a', body, opts }; G.showEvent('_fam'); }
  function answer() {
    const r = ring; ring = null; ringLeft = 0; if (!r) return;
    if (r.special === 'dead') { G.sndStatic(4, 0.05); sv().family = 'dead'; store(); if (G.drawPhoto) G.drawPhoto('', true);
      card('… Solo se escucha estática. Nadie habla al otro lado. La línea sigue abierta, pero no hay nadie.', [['Colgar', () => { addLog(`${home.name} era tu ciudad.`, '#ffd27a'); }]]); return; }
    if (r.special === 'alive') { play('fam_alive'); card('«¿Me escuchas? Estamos vivos. Salimos a tiempo. Estamos en la carretera. No sé qué queda de la casa. No sé qué queda de nada.»', [['Colgar', () => {}]]); return; }
    play(r.v);
    if (r.choice) card('«' + r.t + '»', [
      ['«Váyanse ahora»', () => { S.famLeft = true; if (G.world) S.support = Math.max(0, S.support - 5); G.adj(3, 0); addLog('Tu familia sale de la ciudad. Los vecinos ven partir a la familia del comandante: cunde el miedo.', '#ffd27a'); G.pushNews(`Rumor en ${home.name}: "los que saben ya se fueron".`); }],
      ['«Quédense, no va a pasar nada»', () => { addLog('Tu familia se queda en casa. Te creyeron.', '#ffd27a'); }]]);
    else card('«' + r.t + '»', [['Colgar', () => {}]]);
  }
  on('start', () => {
    const s = sv(); const mine = cities.filter(c => c.bloc === 'P');
    if (!s.home || !mine.some(c => c.name === s.home)) { s.home = mine[Math.floor(Math.random() * mine.length)].name; s.family = 'ok'; store(); }
    home = cities.find(c => c.name === s.home); mark.visible = true; mark.position.copy(home.n).multiplyScalar(R * 1.04);
    if (G.drawPhoto) G.drawPhoto(s.family === 'dead' ? '' : 'Te esperamos en ' + home.name, s.family === 'dead');
    ring = null; ringLeft = 0; callAt = null; S.famLeft = false; S.famResolved = false;
  });
  on('phoneAnswer', () => { if (ring) answer(); });
  on('update', dt => {
    if (!home || S.ended) return;
    if (ring) { ringLeft -= dt; if (ringLeft <= 0) { const r = ring; ring = null; if (G.phone) G.phone.stop();
        if (r.special === 'dead') { sv().family = 'dead'; store(); if (G.drawPhoto) G.drawPhoto('', true); addLog('Llamada perdida de casa. Cuando devuelves la llamada, nadie contesta.', '#ffd27a'); }
        else addLog('Llamada perdida de casa.', '#ffd27a'); } return; }
    if (S.paused || sv().family === 'dead') return;
    if (callAt === null) callAt = S.time + 20 * Math.max(G.TS, 0.5);
    if (callAt > 0 && S.time >= callAt && !S.event && S.phase < G.GUERRA && !(G.comms && G.comms.busy)) {
      callAt = -1; const n = G.campaign ? Math.min(3, G.campaign.save.night) : 0; ring = NIGHT_CALLS[n]; ringLeft = 18 * Math.max(G.TS, 0.6);
      addLog('Suena el teléfono rojo. El número es de tu casa.', '#ffd27a'); if (G.phone) G.phone.ring(); else answer();
    }
  });
  on('impact', (f, T) => {
    if (T !== home || S.famResolved || sv().family === 'dead') return; S.famResolved = true;
    const alive = Math.random() < (S.famLeft ? 1 : (home.evac || 1) < 1 ? 0.85 : 0.12);
    S.timers.push({ t: S.time + 7, fn: () => { ring = { special: alive ? 'alive' : 'dead' }; ringLeft = 20; addLog('Suena el teléfono rojo. El número es de tu casa.', '#ffd27a'); if (G.phone) G.phone.ring(); else answer(); } });
  });
  on('end', () => {
    if (!home) return; if (ring && ring.special === 'dead') { sv().family = 'dead'; store(); if (G.drawPhoto) G.drawPhoto('', true); } ring = null; if (G.phone) G.phone.stop();
    const hit = home.popRemaining < home.pop * 0.9, st = sv().family === 'dead' ? 'nadie contesta' : hit ? 'sobrevivieron, lejos de casa' : 'a salvo';
    const { g, w: W, h: H } = G.report; g.fillStyle = 'rgba(1,6,8,1)'; g.fillRect(12, H - 142, W - 24, 66); g.textAlign = 'center'; g.font = `32px ${FONT}`; g.fillStyle = '#ffd27a';
    g.fillText(`Tu familia, en ${home.name}: ${st}.`, W / 2, H - 98); g.textAlign = 'left'; G.report.tex.needsUpdate = true;
  });
  G.family = { get ringing() { return !!ring && ringLeft > 0; }, get home() { return home; }, get status() { return sv().family; }, force(kind) { ring = kind === 'night' ? NIGHT_CALLS[G.campaign ? Math.min(3, G.campaign.save.night) : 0] : { special: kind }; answer(); } };
}
