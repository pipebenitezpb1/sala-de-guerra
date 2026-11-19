// Árbol de mejoras: se compran con Autoridad y son permanentes durante la campaña.
export default function (G) {
  const { S, M, on, TABS } = G;
  const BR = [
    { name: 'DEFENSA', ups: [
      { id: 'd1', name: 'Radar de largo alcance', desc: 'Alcance de radar +14° · intercepción automática +10 %', cost: 4, fx: m => { m.radarDeg = 52; m.autoIntercept += 0.1; } },
      { id: 'd2', name: 'Interceptores guiados', desc: 'Éxito de tus interceptores: 65 % → 82 %', cost: 6, fx: m => { m.interceptSuccess = 0.82; } },
      { id: 'd3', name: 'Escudo orbital', desc: 'Destruye solo los 3 primeros misiles de cada noche', cost: 9, fx: m => { m.shield = 3; } } ] },
    { name: 'ATAQUE', ups: [
      { id: 'a1', name: 'Misiles hipersónicos', desc: 'Tus misiles llegan un 40 % más rápido', cost: 5, fx: m => { m.flightK = 0.6; } },
      { id: 'a2', name: 'Ojivas múltiples', desc: 'Cada misil golpea también una segunda ciudad cercana', cost: 7, fx: m => { m.mirv = true; } },
      { id: 'a3', name: 'Mano muerta', desc: 'Un silo destruido dispara solo sus misiles restantes', cost: 9, fx: m => { m.deadHand = true; } } ] },
    { name: 'DIPLOMACIA', ups: [
      { id: 'p1', name: 'Canal secreto', desc: 'La línea directa se recarga un 45 % más rápido', cost: 4, fx: m => { m.dipCdK = 0.55; } },
      { id: 'p2', name: 'Mediador neutral', desc: 'La negociación avanza un 60 % más rápido', cost: 6, fx: m => { m.negK *= 1.6; } },
      { id: 'p3', name: 'Tratado de verificación', desc: 'La tensión sube un 35 % más lento', cost: 8, fx: m => { m.driftK *= 0.65; } } ] },
    { name: 'ESPIONAJE', ups: [
      { id: 'e1', name: 'Red de informantes', desc: 'Detecta señuelos enemigos y trampas en las llamadas', cost: 4, fx: m => { m.informants = true; } },
      { id: 'e2', name: 'Silos señuelo', desc: 'Desbloquea señuelos baratos que atraen misiles', cost: 5, fx: m => { m.decoys = true; } },
      { id: 'e3', name: 'Sabotaje', desc: 'Desbloquea operaciones contra silos enemigos', cost: 7, fx: m => { m.sabotage = true; } } ] },
  ];
  const owned = new Set(); let bi = 0, mirvGuard = false;
  function apply() {
    for (const k of ['radarDeg', 'mirv', 'deadHand', 'shield', 'informants', 'decoys', 'sabotage']) delete M[k];
    G.resetMods(); for (const b of BR) for (const u of b.ups) if (owned.has(u.id)) u.fx(M);
    G.fire('mods'); G.dirty();
  }
  G.tree = { owned, apply, BR };
  TABS.tree = { label: 'MEJORAS', hint: 'Permanentes en la campaña',
    rows() { const b = BR[bi]; return [{ name: 'RAMA: ' + b.name, desc: `Toca para cambiar de rama (${bi + 1}/${BR.length})`, right: '▸', on: true },
      ...b.ups.map((u, i) => { const has = owned.has(u.id), prev = i === 0 || owned.has(b.ups[i - 1].id);
        return { name: u.name, desc: prev || has ? u.desc : 'Requiere la mejora anterior', right: has ? 'ACTIVA' : u.cost + ' ◆', owned: has, on: !has && prev && S.authority >= u.cost && S.started && !S.ended }; })]; },
    click(i) {
      if (i === 0) { bi = (bi + 1) % BR.length; G.beep(700, 0, 0.05); return; }
      const b = BR[bi], u = b.ups[i - 1]; if (!u || owned.has(u.id) || !S.started || S.ended) return;
      if (i > 1 && !owned.has(b.ups[i - 2].id)) { G.beep(180, 140, 0.15, 'square', 0.04); return; }
      if (S.authority < u.cost) { G.beep(180, 140, 0.15, 'square', 0.04); G.say('No tiene autoridad suficiente.', 'sin_autoridad', 0, '#ffb340'); return; }
      S.authority -= u.cost; owned.add(u.id); apply(); if (u.id === 'd3') S.shieldLeft = 3;
      G.beep(660, 990, 0.1); G.pulse(0.5, 120); G.addLog(`Mejora adquirida: ${u.name}.`, '#4dff9a'); G.fire('treeBuy', u);
    } };
  on('start', () => { S.shieldLeft = M.shield || 0; });
  // ojivas múltiples
  on('launch', f => {
    if (!M.mirv || mirvGuard || f.owner !== 'P' || f.bomber || f.target.type !== 'city') return;
    const o = G.nearestN(G.cities, f.target.n, 14, c => c.bloc === 'E' && c !== f.target); if (!o) return;
    mirvGuard = true; f.silo.missiles++; G.launch('P', f.silo, o); S.playerLaunched--; mirvGuard = false;
  });
  // mano muerta
  on('preImpact', (f, T) => {
    if (!M.deadHand || T.type !== 'silo' || T.bloc !== 'P' || T.sub || T.missiles <= 0) return;
    const tg = G.cities.filter(c => c.bloc === 'E').sort((a, b) => b.popRemaining - a.popRemaining);
    const n = T.missiles; for (let i = 0; i < n; i++) G.launch('P', T, tg[i % tg.length]);
    G.addLog(`Mano muerta: ${T.name} disparó ${n} misiles antes de ser destruido.`, '#7ccfff'); G.sndLaunch();
  });
  // escudo orbital
  on('update', () => {
    if (!(S.shieldLeft > 0)) return;
    for (const f of [...G.flights]) if (f.owner === 'E' && f.t > 0.6 && S.shieldLeft > 0) { S.shieldLeft--; G.spawnFlash(f.pos, 0xbfe8ff, 0.1, 1.4); G.removeFlight(f); G.beep(1480, 1980, 0.07, 'sine', 0.04);
      G.addLog(`Escudo orbital: misil hacia ${f.target.name} destruido (${S.shieldLeft} cargas).`, '#9dffb0'); }
  });
}
