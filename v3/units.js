// Unidades: radares con alcance, bombarderos (se pueden llamar de vuelta), submarino móvil, señuelos, sabotaje y contactos fantasma.
export default function (G) {
  const { THREE, S, M, on, TABS, globe, R, defenses, silos, cities, flights, ll2v, v2ll, nearestN, sprite, texTri, texSq, texDot, addLog, beep, pulse, rand, pushNews, adj } = G;
  const D2R = Math.PI / 180;
  let pend = null; // orden pendiente de elegir lugar en el globo

  // ---------- radares ----------
  const rings = new THREE.Group(); globe.add(rings); let ringKey = '';
  function ringPts(n, deg) {
    const u = new THREE.Vector3(0, 1, 0).cross(n); if (u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize(); const v = n.clone().cross(u);
    const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R), pts = [];
    for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; pts.push(n.clone().multiplyScalar(c).addScaledVector(u, s * Math.cos(a)).addScaledVector(v, s * Math.sin(a)).multiplyScalar(R * 1.005)); }
    return pts;
  }
  const radarDeg = () => M.radarDeg || 38;
  function rebuildRings() {
    const k = defenses.length + ':' + radarDeg(); if (k === ringKey) return; ringKey = k;
    while (rings.children.length) { const c = rings.children.pop(); c.geometry.dispose(); c.material.dispose(); }
    for (const d of defenses) rings.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts(d.n, radarDeg())), new THREE.LineBasicMaterial({ color: 0x7dff9a, transparent: true, opacity: 0.32, depthWrite: false })));
  }
  const inRadar = p => { const n = p.clone().normalize(), c = Math.cos(radarDeg() * D2R); return defenses.some(d => !d.destroyed && d.n.dot(n) > c); };

  // ---------- contactos fantasma (señuelos enemigos) ----------
  on('launch', f => {
    if (f.owner !== 'E') return;
    f.seen = false; f.head.visible = false; f.trail.visible = false; if (f.guide) f.guide.visible = false; f.wHead.visible = false;
    if (f.target.type === 'city' && Math.random() < (S.ghostRate ?? 0.2)) f.ghost = true;
  });
  on('preImpact', (f, T) => {
    if (f.ghost) { addLog(`El contacto hacia ${T.name} era un señuelo: no había ojiva.`, '#9dffb0'); beep(500, 700, 0.08); return true; }
    if (f.bomber) {
      if (S.phase < G.ROJA && !S.firstStriker) { f.silo.missiles++; S.playerLaunched--; addLog(`Bombarderos sin autorización sobre ${T.name}: regresan a base.`, '#9fc9ce'); return true; }
      if (!S.firstStriker) { G.say('Bombas lanzadas. Ya no se puede revertir.', 'irreversible', 2, '#7ccfff'); G.startWar('P'); }
    }
    if (T.type === 'decoy') { const i = decoys.indexOf(T); if (i >= 0) decoys.splice(i, 1); globe.remove(T.mk); T.mk.material.dispose(); G.spawnBlast(T.n); addLog('El enemigo gastó un misil en un silo señuelo vacío.', '#9dffb0'); return true; }
  });

  // ---------- bases aéreas y bombarderos ----------
  const bases = [['Base Aérea Norte', 47.5, -122], ['Base Aérea Sur', 28.5, -81.5]].map(([name, lat, lon]) => {
    const b = { name, n: ll2v(lat, lon), lat, lon, missiles: 2, max: 2, bloc: 'P' }; b.mk = sprite(texDot, 0xffe9a0, 0.02); b.mk.position.copy(b.n).multiplyScalar(R * 1.012); globe.add(b.mk); return b; });
  let bomberNext = false;
  on('preLaunch', f => { if (!bomberNext) return; bomberNext = false; f.bomber = true; f.h = 0.012; f.dur *= 3.2; });
  function sendBombers() {
    const tgt = S.armed; if (!tgt) { addLog('Primero fije un objetivo en el globo (gatillo sobre una ciudad o silo).', '#ffb340'); beep(180, 140, 0.15, 'square', 0.04); return; }
    const b = nearestN(bases, tgt.n, 180, b => b.missiles > 0); if (!b) { addLog('No quedan escuadrones en tierra.', '#ffb340'); return; }
    if (S.authority < 2) { G.say('No tiene autoridad suficiente.', 'sin_autoridad', 0, '#ffb340'); return; }
    S.authority -= 2; bomberNext = true; const f = G.launch('P', b, tgt); f.head.material.color.setHex(0xffe9a0); f.trail.material.color.setHex(0xffd060); f.trail.material.opacity = 0.5;
    if (S.phase < G.GUERRA) adj(10, -4); pulse(0.5, 150); beep(300, 380, 0.15, 'sawtooth', 0.05);
    addLog(`Escuadrón en el aire desde ${b.name} hacia ${tgt.name}. Aún puede ordenarles volver.`, '#ffe9a0'); pushNews('Bombarderos estratégicos despegan en plena noche.');
  }
  function recall() {
    const bs = flights.filter(f => f.bomber && f.t < 0.9); if (!bs.length) { addLog('No hay bombarderos que llamar de vuelta.', '#9fc9ce'); return; }
    for (const f of bs) { f.silo.missiles++; S.playerLaunched--; G.removeFlight(f); }
    if (S.phase < G.GUERRA) adj(-7, 3); beep(700, 500, 0.12); addLog(`${bs.length} escuadrón(es) regresan a base. Nadie murió por esta orden.`, '#9dffb0');
  }

  // ---------- submarino móvil, señuelos, sabotaje ----------
  const decoys = []; G.decoys = decoys;
  const mySub = () => silos.find(s => s.sub && s.bloc === 'P' && !s.destroyed);
  function sabotage() {
    if (!M.sabotage || S.authority < 4 || (S.cd.sab || 0) > S.time) { beep(180, 140, 0.15, 'square', 0.04); return; }
    const tg = silos.filter(s => s.bloc === 'E' && !s.destroyed && s.missiles > 0 && !s.sub); if (!tg.length) return;
    S.authority -= 4; S.cd.sab = S.time + 40 * Math.max(G.TS, 0.5); const s = G.pick(tg), n = Math.min(3, s.missiles); s.missiles -= n; beep(660, 990, 0.08);
    if (Math.random() < 0.25) { adj(12, -6); addLog(`Sabotaje descubierto en ${s.name}: ${n} misiles inutilizados, pero el enemigo lo sabe.`, '#ffb340'); pushNews('El bloque este denuncia un acto de sabotaje.'); }
    else addLog(`Sabotaje exitoso: ${n} misiles inutilizados en un silo enemigo.`, '#9dffb0');
  }
  on('select', hit => {
    if (!pend || !hit.n) return;
    const ll = v2ll(hit.n);
    if (pend === 'sub') { const s = mySub(); if (s) { s.dest = hit.n.clone(); addLog('Submarino Orca: rumbo fijado. Navegación silenciosa.', '#9fe0ff'); beep(660, 880, 0.07); } pend = null; G.dirty(); return true; }
    if (pend === 'decoy') {
      const own = ll.lon > -168 && ll.lon < -34 && ll.lat > -56 && ll.lat < 72 && !!nearestN([...cities, ...silos], hit.n, 18, t => t.bloc === 'P' && !t.sub);
      if (!own) { addLog('Ese lugar está fuera de nuestro territorio.', '#ffb340'); return true; }
      if (S.authority < 2) { pend = null; G.dirty(); return true; }
      S.authority -= 2; const d = { type: 'decoy', name: 'un silo señuelo', bloc: 'P', n: hit.n.clone(), lat: ll.lat, lon: ll.lon }; d.mk = sprite(texTri, 0x9fe0ff, 0.022); d.mk.material.opacity = 0.55; d.mk.position.copy(d.n).multiplyScalar(R * 1.012); globe.add(d.mk); decoys.push(d);
      pend = null; G.dirty(); beep(660, 990, 0.08); addLog('Silo señuelo desplegado. Desde el satélite parece real.', '#9fe0ff'); return true;
    }
  });
  on('enemyTarget', tgt => { if (decoys.length && Math.random() < 0.4) return G.pick(decoys); });

  TABS.units = { label: 'UNIDADES', hint: 'Fije un objetivo antes de despegar',
    rows() {
      const live = S.started && !S.ended, air = flights.filter(f => f.bomber).length, ground = bases.reduce((a, b) => a + b.missiles, 0), sub = mySub();
      return [
        { name: 'DESPEGAR BOMBARDEROS', desc: S.armed ? `Hacia ${S.armed.name} · lentos, pero se pueden llamar de vuelta` : 'Fije un objetivo en el globo primero', right: ground + ' en tierra', on: live && ground > 0 && !!S.armed && S.authority >= 2 },
        { name: 'ORDENAR REGRESO', desc: 'Los bombarderos en vuelo vuelven a base', right: air + ' en vuelo', on: live && air > 0 },
        { name: 'MOVER SUBMARINO', desc: sub ? (pend === 'sub' ? 'Apunta a un punto del océano y aprieta' : 'Más cerca del enemigo = menos tiempo de aviso') : 'Despliega un submarino en ACCIONES', right: sub ? sub.missiles + ' misiles' : '—', on: live && !!sub, pend: pend === 'sub' },
        { name: 'SILO SEÑUELO', desc: M.decoys ? (pend === 'decoy' ? 'Apunta a tu territorio y aprieta' : 'Atrae misiles enemigos hacia un silo vacío') : 'Requiere mejora de ESPIONAJE', right: M.decoys ? '2 ◆' : '—', on: live && !!M.decoys && S.authority >= 2, pend: pend === 'decoy' },
        { name: 'SABOTAJE', desc: M.sabotage ? 'Inutiliza hasta 3 misiles de un silo enemigo · riesgo de ser descubierto' : 'Requiere mejora de ESPIONAJE', right: M.sabotage ? ((S.cd.sab || 0) > S.time ? Math.ceil(S.cd.sab - S.time) + ' s' : '4 ◆') : '—', on: live && !!M.sabotage && S.authority >= 4 && !((S.cd.sab || 0) > S.time) },
        { name: 'RADARES', desc: `Alcance ${radarDeg()}° · los misiles solo se pueden interceptar dentro del anillo verde`, right: defenses.length + ' bases', on: false },
      ];
    },
    click(i) { if (!S.started || S.ended) return;
      if (i === 0) sendBombers(); else if (i === 1) recall();
      else if (i === 2 && mySub()) { pend = pend === 'sub' ? null : 'sub'; beep(660, 880, 0.07); }
      else if (i === 3 && M.decoys) { pend = pend === 'decoy' ? null : 'decoy'; beep(660, 880, 0.07); }
      else if (i === 4) sabotage();
      G.dirty(); } };

  on('update', dt => {
    rebuildRings();
    for (const f of flights) if (f.owner === 'E' && f.seen === false && (inRadar(f.pos) || f.t > 0.82)) {
      f.seen = true; f.head.visible = true; f.trail.visible = true; if (f.guide) f.guide.visible = true; f.wHead.visible = true; beep(1100, 0, 0.05, 'square', 0.03);
      if (f.ghost && M.informants) { f.head.material.color.setHex(0xfff080); addLog(`Informantes: el contacto hacia ${f.target.name} es probablemente un señuelo.`, '#fff080'); }
      else addLog(`Contacto de radar: misil hacia ${f.target.name}. Ya se puede interceptar.`, '#ff9a8a');
    }
    const s = mySub(); if (s && s.dest) { const ang = s.n.angleTo(s.dest), step = 2.2 * D2R * dt / Math.max(G.TS, 0.5);
      if (ang <= step) { s.n.copy(s.dest); s.dest = null; addLog('Submarino Orca en posición.', '#9fe0ff'); } else G.slerpV(s.n.clone(), s.dest, ang, step / ang, s.n).normalize();
      s.mk.position.copy(s.n).multiplyScalar(R * 1.012); const ll = v2ll(s.n); s.lat = ll.lat; s.lon = ll.lon; }
  });
  on('reset', () => { pend = null; for (const b of bases) b.missiles = b.max; for (const d of decoys) { globe.remove(d.mk); d.mk.material.dispose(); } decoys.length = 0; ringKey = ''; });
}
