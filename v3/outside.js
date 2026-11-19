// Después del final: sales del búnker al amanecer y ves lo que quedó, según lo que hiciste.
export default function (G) {
  const { THREE, S, on, scene, room, makePanel, FONT, texGlow, rand } = G;
  const out = new THREE.Group(); out.visible = false; scene.add(out);
  let active = false, t0 = 0, variant = 'clear', shown = false, ash = null, smokes = [], fires = [], wind = null, chirpT = 0, clickT = 0;
  const basic = (c, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); out.add(m); return m; };
  const SKY = { clear: ['#0b1730', '#3a5a8a', '#f2a060', '#ffd9a0'], ash: ['#2e2a24', '#7a6a56', '#c08a58', '#d8a070'], ruin: ['#1e1814', '#5a4436', '#a85c30', '#c87038'] };
  const FOG = { clear: 0xd8a070, ash: 0x9a7a58, ruin: 0x6a4838 };
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function clear() { while (out.children.length) { const c = out.children.pop(); if (c.geometry) c.geometry.dispose(); if (c.material) { if (c.material.map && c.material.map !== texGlow) c.material.map.dispose(); c.material.dispose(); } } ash = null; smokes = []; fires = []; }

  function build(v, famAlive, homeName, lines) {
    clear(); const ruin = v === 'ruin', dark = v !== 'clear';
    // cielo
    const sky = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); const c = SKY[v]; gr.addColorStop(0, c[0]); gr.addColorStop(0.42, c[1]); gr.addColorStop(0.5, c[2]); gr.addColorStop(0.53, c[3]); gr.addColorStop(1, c[3]); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    add(new THREE.SphereGeometry(55, 32, 20), basic(0xffffff, { map: sky, side: THREE.BackSide, fog: false, depthWrite: false }), 0, 0, 0);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow, color: v === 'clear' ? 0xffe0a0 : v === 'ash' ? 0xb05a30 : 0x6a2a18, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    sun.scale.setScalar(v === 'clear' ? 26 : 14); sun.position.set(-14, 3.5, -50); out.add(sun);
    // suelo y cerros
    add(new THREE.CircleGeometry(55, 48), basic(dark ? 0x2e2a26 : 0x1c2a18), 0, 0, 0).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 9; i++) { const a = -1.9 + i * 0.47, r = 50; add(new THREE.ConeGeometry(rand(9, 16), rand(5, 11), 6), basic(dark ? 0x14110f : 0x1a2630), Math.sin(a) * r, 1.5, -Math.cos(a) * r); }
    // entrada del búnker, detrás
    const conc = basic(dark ? 0x3a3632 : 0x5a5e5c);
    add(new THREE.BoxGeometry(7, 3.4, 1.2), conc, 0, 1.7, 3.2); add(new THREE.BoxGeometry(1.6, 2.3, 0.1), basic(0x0a0a0a), 0, 1.15, 2.58);
    for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(3, 0.16, 0.5), conc, 0, 0.08 - i * 0.0, 2.2 - i * 0.5);
    // ciudad
    const win = canvasTex(64, 128, (g, w, h) => { g.fillStyle = dark ? '#161312' : '#1a2230'; g.fillRect(0, 0, w, h); if (ruin) return; for (let y = 6; y < h - 4; y += 10) for (let x = 5; x < w - 4; x += 9) if (Math.random() < (v === 'clear' ? 0.45 : 0.12)) { g.fillStyle = Math.random() < 0.8 ? '#ffd890' : '#bfe0ff'; g.fillRect(x, y, 4, 5); } });
    const bMat = basic(0xffffff, { map: win });
    for (let i = 0; i < 70; i++) { const a = rand(-1.05, 1.05), r = rand(28, 47), w = rand(1.4, 4), full = rand(4, 22) * (1 - Math.abs(a) * 0.4), h = ruin ? full * rand(0.08, 0.45) : full;
      const b = add(new THREE.BoxGeometry(w, h, w), bMat, Math.sin(a) * r, h / 2, -Math.cos(a) * r); b.rotation.y = rand(0, 3); if (ruin) { b.rotation.z = rand(-0.25, 0.25); b.rotation.x = rand(-0.15, 0.15); } }
    if (ruin) {
      for (let i = 0; i < 14; i++) { const a = rand(-1, 1), r = rand(28, 45); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow, color: 0xff6a20, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); f.scale.setScalar(rand(3, 7)); f.position.set(Math.sin(a) * r, rand(0.5, 2.5), -Math.cos(a) * r); out.add(f); fires.push(f); }
      for (let i = 0; i < 10; i++) { const a = rand(-1, 1), r = rand(30, 46); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow, color: 0x1a1614, transparent: true, opacity: 0.75, depthWrite: false })); s.scale.set(rand(4, 8), rand(18, 30), 1); s.position.set(Math.sin(a) * r, 11, -Math.cos(a) * r); out.add(s); smokes.push(s); }
    }
    if (dark) { const n = 700, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = rand(-9, 9); p[i * 3 + 1] = rand(0, 7); p[i * 3 + 2] = rand(-12, 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); ash = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xb8b0a8, size: 0.035, transparent: true, opacity: 0.8, depthWrite: false })); out.add(ash); }
    // la familia (o el lugar vacío donde estarían)
    if (famAlive && !ruin) { const fam = canvasTex(256, 256, (g) => { g.fillStyle = dark ? '#0a0908' : '#141a22'; for (const [x, s] of [[70, 1], [130, 0.95], [178, 0.6], [34, 0.5]]) { g.beginPath(); g.arc(x, 256 - 190 * s - 22, 22 * s, 0, 7); g.fill(); g.fillRect(x - 24 * s, 256 - 176 * s, 48 * s, 176 * s); } });
      const m = add(new THREE.PlaneGeometry(1.9, 1.9), basic(0xffffff, { map: fam, transparent: true, depthWrite: false }), 2.2, 0.95, -4.6); m.rotation.y = -0.4; }
    // texto
    const p = makePanel(2.6, 1.0, 1560, 600, out); p.mesh.position.set(-0.2, 1.6, -2.6); p.mesh.material.fog = false; p.mesh.material.needsUpdate = true;
    const { g, w: W } = p; g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 0, W, 600); g.textAlign = 'center';
    g.font = `60px ${FONT}`; g.fillStyle = '#f2ead8'; g.fillText('AMANECER · 25 DE NOVIEMBRE', W / 2, 90);
    g.font = `40px ${FONT}`; let y = 176; for (const l of lines) { g.fillStyle = l[1] || '#d8d0c0'; for (const part of G.wrap(g, l[0], W - 120)) { g.fillText(part, W / 2, y); y += 50; } y += 10; }
    g.font = `28px ${FONT}`; g.fillStyle = '#8a8478'; g.fillText('Aprieta el gatillo para volver', W / 2, 570); g.textAlign = 'left'; p.tex.needsUpdate = true;
  }
  function startWind(v) {
    const AC = G.AC; if (!AC) return; const s = G.noiseSrc(true), lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = v === 'clear' ? 420 : 260;
    const g = AC.createGain(); g.gain.setValueAtTime(0.0001, AC.currentTime); g.gain.exponentialRampToValueAtTime(v === 'clear' ? 0.05 : 0.16, AC.currentTime + 3);
    const lfo = AC.createOscillator(); lfo.frequency.value = 0.13; const lg = AC.createGain(); lg.gain.value = 120; lfo.connect(lg).connect(lp.frequency);
    s.connect(lp).connect(g).connect(G.master); s.start(); lfo.start(); wind = { s, g, lfo };
  }
  function stopWind() { if (!wind) return; try { wind.g.gain.setTargetAtTime(0, G.AC.currentTime, 0.3); wind.s.stop(G.AC.currentTime + 1.5); wind.lfo.stop(G.AC.currentTime + 1.5); } catch (e) {} wind = null; }
  function chirp() { const AC = G.AC; if (!AC) return; const t = AC.currentTime, n = 2 + Math.floor(Math.random() * 3), f0 = rand(2400, 3800);
    for (let i = 0; i < n; i++) { const o = AC.createOscillator(), g = AC.createGain(), st = t + i * 0.11; o.frequency.setValueAtTime(f0, st); o.frequency.exponentialRampToValueAtTime(f0 * rand(1.15, 1.5), st + 0.06); G.env(g, st, 0.01, 0.018, 0.07); o.connect(g); g.connect(G.revIn); g.connect(G.master); o.start(st); o.stop(st + 0.12); } }

  function enter(force) {
    const save = G.campaign ? G.campaign.save : { history: [] }, home = G.family && G.family.home, famAlive = !G.family || G.family.status !== 'dead';
    const dead = save.history.reduce((a, x) => a + x.dead, 0), peace = save.history.filter(x => x.kind === 'paz').length, firsts = save.history.filter(x => x.first === 'P').length;
    variant = force || (home && home.popRemaining < home.pop * 0.9 ? 'ruin' : dead > 5e8 ? 'ash' : 'clear'); const name = home ? home.name : 'la ciudad';
    const lines = [];
    if (variant === 'clear') { lines.push([`${name} sigue ahí. Las luces se apagan de a una mientras sale el sol.`]); lines.push([dead < 1e6 ? 'Nadie en esas calles sabe lo que no pasó esta semana.' : `Lejos de aquí murieron ${G.fmtM(dead)} de personas.`]); }
    else if (variant === 'ash') { lines.push([`${name} sigue en pie. El sol sale, pero ya no calienta igual.`]); lines.push([`Murieron ${G.fmtM(dead)} de personas. La ceniza de sus ciudades cae ahora sobre la tuya.`]); }
    else { lines.push([`Aquí estaba ${name}.`, '#ffb090']); lines.push([`Murieron ${G.fmtM(dead)} de personas en cuatro noches.`]); }
    lines.push([famAlive ? (variant === 'ruin' ? 'Tu familia está viva, en alguna carretera lejos de aquí.' : 'Te estaban esperando.') : 'Nadie te espera.', '#ffd27a']);
    lines.push([`${peace} noches de paz · ${4 - peace} de guerra${firsts ? ' · diste la primera orden ' + (firsts === 1 ? 'una vez' : firsts + ' veces') : ''}`, '#8a8478']);
    build(variant, famAlive, name, lines);
    active = true; shown = true; t0 = S.time; room.visible = false; out.visible = true;
    scene.background.set(FOG[variant]); scene.fog.color.set(FOG[variant]); scene.fog.near = 18; scene.fog.far = 62;
    startWind(variant); if (famAlive && variant !== 'ruin') S.timers.push({ t: S.time + 5, fn: () => { const AC = G.AC; if (AC && active) G.loadVoice('fam_back').then(b => { const s = AC.createBufferSource(); s.buffer = b; const g = AC.createGain(); g.gain.value = 0.9; s.connect(g); g.connect(G.master); g.connect(G.revIn); s.start(); }).catch(() => {}); } });
  }
  function leave() { active = false; out.visible = false; room.visible = true; scene.background.set(0x010305); scene.fog.color.set(0x010305); scene.fog.near = 7; scene.fog.far = 16; stopWind(); clear(); }
  on('beforeReset', () => {
    if (active) { if (S.time - t0 < 6) return true; leave(); return; }
    if (G.campaign && G.campaign.save.night >= 4 && !shown) { enter(); return true; }
  });
  on('start', () => { shown = false; if (active) leave(); });
  on('frame', (dt, t) => {
    if (!active) return;
    if (ash) { const p = ash.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * (0.25 + (i % 5) * 0.06); if (y < 0) y = 7; p.setY(i, y); p.setX(i, p.getX(i) + dt * 0.12); if (p.getX(i) > 9) p.setX(i, -9); } p.needsUpdate = true; }
    for (let i = 0; i < fires.length; i++) fires[i].material.opacity = 0.55 + 0.35 * Math.sin(t * (2 + i * 0.3) + i);
    for (let i = 0; i < smokes.length; i++) smokes[i].position.x += dt * 0.15;
    if (variant === 'clear') { chirpT -= dt; if (chirpT <= 0) { chirpT = rand(0.6, 2.6); chirp(); } }
    else if (variant === 'ruin') { clickT -= dt; if (clickT <= 0) { clickT = rand(0.05, 0.5); G.beep(3200, 0, 0.004, 'square', 0.02); } }
  });
  G.outside = { enter, leave, get active() { return active; } };
}
