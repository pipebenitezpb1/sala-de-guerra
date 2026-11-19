// Consola física: llave de lanzamiento, tapa y botón rojo, teléfono rojo, pantallas táctiles.
export default function (G) {
  const { THREE, S, M, on, room, camera, renderer, controllers, std, basic, beep, pulse, addLog, makePanel, FONT } = G;
  M.physical = true; on('mods', () => { M.physical = true; });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const metal = std(0x2b3136, 0.45, 0.75), dark = std(0x121517, 0.6, 0.5), red = std(0x9a0e0e, 0.35, 0.15);

  // ---------- consola de lanzamiento (inclinada hacia el jugador) ----------
  const con = new THREE.Group(); con.position.set(0.27, 0.79, -0.4); con.rotation.x = 0.6; room.add(con);
  mesh(new THREE.BoxGeometry(0.4, 0.05, 0.2), dark, con);
  mesh(new THREE.BoxGeometry(0.41, 0.012, 0.21), metal, con, 0, -0.03, 0);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.02, 0.012, 0.2), basic(0xc8a800), con, sx * 0.19, 0.027, 0); // franjas de advertencia
  // llave
  const lock = mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.012, 24), metal, con, -0.1, 0.031, 0);
  const key = new THREE.Group(); key.position.set(-0.1, 0.037, 0); con.add(key);
  mesh(new THREE.BoxGeometry(0.008, 0.03, 0.03), std(0xc9b26a, 0.3, 0.9), key, 0, 0.015, 0);
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 20), std(0xc9b26a, 0.3, 0.9), key, 0, 0.036, 0).rotation.z = Math.PI / 2;
  const keyLed = mesh(new THREE.SphereGeometry(0.007, 10, 8), basic(0x103010), con, -0.1, 0.03, -0.06);
  // botón y tapa
  const btnBase = mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.012, 24), metal, con, 0.09, 0.031, 0);
  const btn = mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.022, 24), std(0xd01010, 0.3, 0.1, { emissive: 0x600000, emissiveIntensity: 0.6 }), con, 0.09, 0.046, 0);
  const cover = new THREE.Group(); cover.position.set(0.09, 0.031, -0.05); con.add(cover);
  const coverMesh = mesh(new THREE.BoxGeometry(0.095, 0.05, 0.095), new THREE.MeshStandardMaterial({ color: 0xff3020, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.2, depthWrite: false }), cover, 0, 0.027, 0.05);
  // mini pantalla de estado
  const mini = makePanel(0.15, 0.05, 600, 200, con); mini.mesh.position.set(-0.005, 0.027, 0.065); mini.mesh.rotation.x = -Math.PI / 2;
  // zonas de selección (láser / clic de escritorio)
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hKey = mesh(new THREE.BoxGeometry(0.08, 0.07, 0.08), hitMat, con, -0.1, 0.05, 0); hKey.userData.id = 'key';
  const hBtn = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.1), hitMat, con, 0.09, 0.05, 0); hBtn.userData.id = 'button';

  let keyAngle = 0, armed = false, coverOpen = false, coverA = 0, btnDown = 0, lastTouch = 0, miniKey = '';
  const setArmed = v => { if (v === armed) return; armed = v; beep(v ? 1200 : 500, v ? 1600 : 0, 0.06, 'square', 0.05); pulse(0.6, 80); addLog(v ? 'Llave girada. Sistema de lanzamiento ARMADO.' : 'Llave en reposo. Sistema desarmado.', v ? '#ff6a5a' : '#9fc9ce'); };
  const toggleCover = () => { coverOpen = !coverOpen; beep(coverOpen ? 900 : 400, 0, 0.04, 'square', 0.04); pulse(0.3, 40); };
  function pressButton() {
    if (S.time - lastTouch < 0.8) return; lastTouch = S.time; btnDown = 1; pulse(1, 200);
    if (!coverOpen) return;
    if (!armed) { beep(180, 140, 0.2, 'square', 0.05); addLog('El botón no responde: gire primero la llave.', '#ffb340'); return; }
    if (!S.armed) { beep(180, 140, 0.2, 'square', 0.05); addLog('Sin objetivo fijado. Apunte a un objetivo en el globo.', '#ffb340'); return; }
    if (G.fireArmed()) { beep(90, 60, 0.3, 'sawtooth', 0.12); G.fire('buttonLaunch'); }
  }
  function drawMini() {
    const k = (S.armed ? S.armed.name : '-') + armed + coverOpen + (S.phase >= G.ROJA);
    if (k === miniKey) return; miniKey = k; const { g, w: W, h: H } = mini;
    g.clearRect(0, 0, W, H); g.fillStyle = '#050a0c'; g.fillRect(0, 0, W, H); g.strokeStyle = armed ? '#ff4030' : '#1d6470'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
    g.font = `44px ${FONT}`; g.fillStyle = S.armed ? '#ffb0a0' : '#5f8a90'; g.fillText(S.armed ? 'OBJ: ' + S.armed.name.toUpperCase().slice(0, 16) : 'SIN OBJETIVO', 20, 62);
    g.font = `40px ${FONT}`; g.fillStyle = armed ? '#ff4030' : '#4dff9a'; g.fillText(armed ? 'LLAVE ARMADA' : 'LLAVE EN REPOSO', 20, 118);
    g.fillStyle = S.phase >= G.ROJA ? '#ff4030' : '#5f8a90'; g.font = `34px ${FONT}`; g.fillText(S.phase >= G.ROJA ? (coverOpen ? 'BOTÓN LISTO' : 'LEVANTE LA TAPA') : 'NO AUTORIZADO', 20, 170);
    mini.tex.needsUpdate = true;
  }

  // ---------- teléfono rojo ----------
  const phone = new THREE.Group(); phone.position.set(-0.46, 0.75, -0.36); phone.rotation.y = 0.35; room.add(phone);
  mesh(new THREE.BoxGeometry(0.17, 0.045, 0.21), red, phone, 0, 0.0225, 0);
  const ringLed = mesh(new THREE.SphereGeometry(0.01, 10, 8), basic(0x301010), phone, 0.06, 0.05, 0.07);
  const handset = new THREE.Group(); phone.add(handset);
  const restPos = V(-0.02, 0.07, 0), restQ = new THREE.Quaternion();
  mesh(new THREE.BoxGeometry(0.04, 0.03, 0.2), red, handset);
  mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), red, handset, 0, -0.01, 0.085); mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), red, handset, 0, -0.01, -0.085);
  handset.position.copy(restPos);
  const hPhone = mesh(new THREE.BoxGeometry(0.2, 0.14, 0.25), hitMat, phone, 0, 0.06, 0); hPhone.userData.id = 'phone';
  let ringing = false, ringT = 0, heldBy = null, answered = false, earT = 0;
  function ringTone() {
    const AC = G.AC; if (!AC) return; const t = AC.currentTime;
    for (const f of [440, 480]) { const o = AC.createOscillator(); o.frequency.value = f; const g = AC.createGain(); const tr = AC.createOscillator(); tr.frequency.value = 22; const tg = AC.createGain(); tg.gain.value = 0.03;
      g.gain.setValueAtTime(0.03, t); g.gain.setValueAtTime(0.03, t + 1.3); g.gain.linearRampToValueAtTime(0, t + 1.4); tr.connect(tg).connect(g.gain); o.connect(g).connect(G.master); o.start(t); tr.start(t); o.stop(t + 1.45); tr.stop(t + 1.45); }
  }
  function answer() {
    if (answered) return; answered = true; pulse(0.4, 80);
    if (ringing) { ringing = false; G.fire('phoneAnswer'); }
    else if (G.fire('phoneIdle') !== true) { const a = G.ACTIONS.find(a => a.id === 'dip'); if (a) G.clickAction(a); }
  }
  G.phone = { ring() { ringing = true; ringT = 0; }, stop() { ringing = false; }, get ringing() { return ringing; } };

  // ---------- adornos: foto familiar, taza, carpeta ----------
  const photo = makePanel(0.11, 0.14, 330, 420, room); photo.mesh.position.set(-0.24, 0.83, -0.33); photo.mesh.rotation.set(-0.35, 0.25, 0, 'YXZ');
  { const { g, w: W, h: H } = photo; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f2c98a'); gr.addColorStop(1, '#8a6a4a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3a2a22'; for (const [x, s] of [[105, 1], [185, 0.95], [245, 0.6], [60, 0.5]]) { g.beginPath(); g.arc(x, H - 170 * s - 60, 30 * s, 0, 7); g.fill(); g.fillRect(x - 34 * s, H - 150 * s - 40, 68 * s, 190 * s); }
    g.fillStyle = '#fff8e8'; g.font = `italic 25px Georgia, serif`; g.fillText('Te esperamos en casa', 38, H - 16); g.strokeStyle = '#2a1c14'; g.lineWidth = 14; g.strokeRect(0, 0, W, H); photo.tex.needsUpdate = true; }
  mesh(new THREE.BoxGeometry(0.115, 0.145, 0.008), dark, room, -0.24, 0.83, -0.336).rotation.set(-0.35, 0.25, 0, 'YXZ');
  const mug = mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 20), std(0xe8e4dc, 0.5, 0), room, 0.5, 0.79, -0.3);
  mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.002, 20), basic(0x1a0f08), room, 0.5, 0.829, -0.3);
  mesh(new THREE.BoxGeometry(0.17, 0.006, 0.24), std(0x8a7a50, 0.9, 0), room, -0.04, 0.754, -0.36).rotation.y = -0.2;
  mesh(new THREE.BoxGeometry(0.15, 0.002, 0.21), std(0xe8e2d0, 0.9, 0), room, -0.035, 0.758, -0.355).rotation.y = -0.12;

  // ---------- selección con láser o ratón ----------
  const hits = [hKey, hBtn, hPhone];
  on('pick', rc => { const h = rc.intersectObjects(hits, false)[0]; if (h) return { custom: h.object.userData.id, dist: h.distance }; });
  on('select', hit => {
    if (!hit.custom) return;
    if (hit.custom === 'key') { keyAngle = armed ? 0 : Math.PI / 2; setArmed(!armed); }
    else if (hit.custom === 'button') { if (!coverOpen) toggleCover(); else pressButton(); }
    else if (hit.custom === 'phone') { answered = false; answer(); answered = false; }
    return true;
  });

  // ---------- manos: agarrar y tocar ----------
  const tip = V(0, 0, 0), tmp = V(0, 0, 0), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), nrm = V(0, 0, 0);
  const worldOf = o => o.getWorldPosition(V(0, 0, 0));
  for (const c of controllers) {
    c.userData.h = { key: null, phone: false, pz: {} };
    c.addEventListener('squeezestart', () => {
      const p = V(0, 0, 0).setFromMatrixPosition(c.matrixWorld);
      if (p.distanceTo(worldOf(key)) < 0.1) { c.userData.grab = null; c.getWorldQuaternion(q0); c.userData.h.key = { q: q0.clone(), a: keyAngle }; pulse(0.3, 40); }
      else if (!heldBy && p.distanceTo(worldOf(handset)) < 0.14) { c.userData.grab = null; heldBy = c; answered = false; earT = 0; c.attach(handset); handset.position.set(0, -0.02, 0.02); handset.quaternion.identity(); beep(600, 0, 0.04, 'square', 0.03); pulse(0.4, 60); }
    });
    c.addEventListener('squeezeend', () => {
      if (c.userData.h.key) { c.userData.h.key = null; const a = Math.abs(keyAngle) > 1.15; keyAngle = a ? Math.sign(keyAngle) * Math.PI / 2 : 0; setArmed(a); }
      if (heldBy === c) { heldBy = null; phone.attach(handset); handset.position.copy(restPos); handset.quaternion.copy(restQ); beep(350, 0, 0.05, 'square', 0.03); G.fire('phoneHang'); }
    });
  }
  function poke(c) {
    tip.set(0, 0, -0.03).applyMatrix4(c.matrixWorld);
    const st = c.userData.h.pz;
    for (const m of G.uiMeshes) {
      if (!m.visible) continue; const l = m.worldToLocal(tmp.copy(tip)); const { width: w, height: h } = m.geometry.parameters; const id = m.uuid, inside = Math.abs(l.x) < w / 2 && Math.abs(l.y) < h / 2;
      if (inside && st[id] > 0.012 && l.z <= 0.012 && l.z > -0.06) { pulse(0.5, 40); G.onSelect({ ui: m === G.actionPanel.mesh ? 'action' : 'card', uv: new THREE.Vector2(l.x / w + 0.5, l.y / h + 0.5), dist: 0, n: null, flight: null }); }
      st[id] = inside ? l.z : 1;
    }
    if (tip.distanceTo(worldOf(coverMesh)) < 0.06 && !coverOpen && S.time - lastTouch > 0.6) { lastTouch = S.time; toggleCover(); }
    if (coverOpen && tip.distanceTo(worldOf(btn)) < 0.035) pressButton();
  }

  on('frame', (dt, t) => {
    if (renderer.xr.isPresenting) for (const c of controllers) {
      if (!c.userData.connected) continue;
      const hk = c.userData.h.key;
      if (hk) { c.getWorldQuaternion(q1); q1.multiply(q0.copy(hk.q).invert()); nrm.set(0, 1, 0).applyQuaternion(con.getWorldQuaternion(q0)).normalize();
        let ang = 2 * Math.atan2(q1.x * nrm.x + q1.y * nrm.y + q1.z * nrm.z, q1.w); if (ang > Math.PI) ang -= 2 * Math.PI; if (ang < -Math.PI) ang += 2 * Math.PI;
        const prev = keyAngle; keyAngle = G.clamp(hk.a + ang, -Math.PI / 2, Math.PI / 2); if (Math.floor(prev * 6) !== Math.floor(keyAngle * 6)) pulse(0.15, 15); }
      poke(c);
    }
    key.rotation.y = keyAngle; keyLed.material.color.setHex(armed ? 0xff2010 : 0x20c040);
    coverA += ((coverOpen ? -1.9 : 0) - coverA) * Math.min(1, dt * 10); cover.rotation.x = coverA;
    btnDown = Math.max(0, btnDown - dt * 4); btn.position.y = 0.046 - 0.012 * btnDown;
    btn.material.emissiveIntensity = armed && coverOpen ? 1.2 + 0.8 * Math.sin(t * 8) : 0.5;
    drawMini();
    // teléfono
    if (ringing && !heldBy) { ringT -= dt; if (ringT <= 0) { ringT = 3.2; ringTone(); pulse(0.2, 300); } ringLed.material.color.setHex(Math.sin(t * 14) > 0 ? 0xff3020 : 0x301010); handset.position.y = restPos.y + 0.004 * Math.sin(t * 60); }
    else if (!heldBy) { ringLed.material.color.setHex(0x301010); handset.position.copy(restPos); }
    if (heldBy && !answered) { const head = renderer.xr.isPresenting ? renderer.xr.getCamera().getWorldPosition(V(0, 0, 0)) : camera.getWorldPosition(V(0, 0, 0));
      if (worldOf(handset).distanceTo(head) < 0.3) { earT += dt; if (earT > 0.35) answer(); } else earT = 0; }
  });
  on('reset', () => { keyAngle = 0; armed = false; coverOpen = false; ringing = false; miniKey = ''; });
  on('buttonLaunch', () => { coverOpen = false; });
  G.console = { get armed() { return armed; }, setArmed(v) { keyAngle = v ? Math.PI / 2 : 0; setArmed(v); }, get coverOpen() { return coverOpen; }, toggleCover, pressButton };
}
