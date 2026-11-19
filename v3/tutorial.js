// Tutorial interactivo: una simulación guiada paso a paso antes de la primera noche.
export default function (G) {
  const { THREE, S, on, EVENTS, room, globe, sprite, texTri, cities, silos, flights } = G;
  const KEY = 'sala-de-guerra-tutorial';
  let done = false; try { done = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const setDone = v => { done = v; try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} };

  // flecha que señala dónde actuar
  const arrow = sprite(texTri, 0xffd84a, 0.07); arrow.material.rotation = Math.PI; arrow.material.depthTest = false; arrow.renderOrder = 20; arrow.visible = false; room.add(arrow);
  const P = { globe: [0, 2.14, -1.5], key: [0.17, 0.96, -0.36], button: [0.36, 0.96, -0.36], phone: [-0.46, 0.95, -0.36], right: [0.76, 1.42, -0.5], enemy: [0, 2.14, -1.5] };

  let step = -1, base = {}, hold = 0, missile = null, pressed = false, answered = false;
  const STEPS = [
    { at: 'globe', t: 'EL GLOBO', b: 'Gire el planeta: mueva el joystick, o agárrelo con el botón lateral (grip) y arrástrelo. En escritorio: arrastre el globo con el ratón.',
      init: () => { base.yaw = globe.rotation.y; base.pitch = globe.rotation.x; }, ok: () => Math.abs(globe.rotation.y - base.yaw) + Math.abs(globe.rotation.x - base.pitch) > 0.5 },
    { at: 'enemy', t: 'FIJAR UN OBJETIVO', b: 'Gire el globo hasta ver el bloque este (rojo). Apunte a una ciudad enemiga y apriete el gatillo. La etiqueta le dirá cuánta gente vive ahí y qué hora es para ellos.',
      init: () => { S.armed = null; }, ok: () => !!S.armed },
    { at: 'key', t: 'LA LLAVE', b: 'Acerque la mano a la llave dorada de la consola, apriete el grip y gire la muñeca un cuarto de vuelta. (También puede apuntarle con el láser y apretar el gatillo.)',
      init: () => { if (G.console) G.console.setArmed(false); }, ok: () => !G.console || G.console.armed },
    { at: 'button', t: 'LA TAPA', b: 'Levante la tapa roja transparente tocándola con la punta del control. (O apúntele con el láser y apriete el gatillo.)',
      ok: () => !G.console || G.console.coverOpen },
    { at: 'button', t: 'EL BOTÓN', b: 'Apriete el botón rojo. Esto es una simulación y el lanzamiento no está autorizado: no saldrá ningún misil. En una noche real, no hay vuelta atrás.',
      init: () => { pressed = false; }, ok: () => !G.console || pressed },
    { at: 'phone', t: 'EL TELÉFONO ROJO', b: 'Está sonando. Agarre el auricular con el grip y llévelo a su oído. Por ahí llegan propuestas de sus generales, del enemigo y de otros países; aceptar o rechazar tiene consecuencias. Si lo descuelga sin que suene, abre la línea directa.',
      init: () => { answered = false; if (G.phone) G.phone.ring(); }, ok: () => !G.phone || answered },
    { at: 'right', t: 'MEJORAS', b: 'Las pantallas laterales se tocan con la mano o con el láser. En la de la derecha, abra la pestaña MEJORAS: ahí gasta Autoridad (◆) en capacidades que duran toda la campaña.',
      init: () => { G.tab = 'act'; }, ok: () => G.tab === 'tree' },
    { at: 'right', t: 'LÍNEA DIRECTA', b: 'Vuelva a la pestaña ACCIONES y pulse LÍNEA DIRECTA. Es la forma más rápida de bajar la TENSIÓN y subir la NEGOCIACIÓN. Ambas barras están en la consola de su escritorio.',
      init: () => { S.authority = Math.max(S.authority, 8); S.cd.dip = 0; base.neg = S.negotiation; }, ok: () => S.negotiation > base.neg + 5 },
    { at: 'globe', t: 'INTERCEPTAR', b: 'Viene un misil de práctica hacia Nueva York. Solo puede interceptarlo cuando entra al anillo verde de un radar: apúntele y apriete el gatillo.',
      init: () => { base.int = S.interceptors; spawnMissile(); }, ok: () => S.interceptors < base.int, tick: () => { if (!missile || !flights.includes(missile)) spawnMissile(); } },
  ];
  function spawnMissile() {
    const s = silos.find(s => s.bloc === 'E' && !s.destroyed && !s.sub), c = cities.find(c => c.name === 'Nueva York'); if (!s || !c) return;
    missile = G.launch('E', s, c); s.missiles++; missile.ghost = true; missile.dur *= 1.5;
  }
  function show(title, body, opts, color = '#ffd84a') { S.event = { def: { title, body, color, opts }, total: 0, left: 0, rects: [] }; G.dirty(); }
  function go(i) {
    step = i; hold = 0; const st = STEPS[i];
    if (st.init) st.init();
    show(`TUTORIAL · ${i + 1} DE ${STEPS.length} · ${st.t}`, st.b, [['SALTAR EL TUTORIAL', finish]]);
    G.say(st.b.split('.')[0] + '.', 'tut_' + (i + 1), 2, '#ffd84a'); G.beep(660, 880, 0.08); G.pulse(0.3, 60);
  }
  function finish() {
    step = -1; arrow.visible = false; setDone(true);
    if (G.phone) G.phone.stop(); if (G.console) { G.console.setArmed(false); if (G.console.coverOpen) G.console.toggleCover(); }
    for (const f of [...flights]) if (f.ghost && f === missile) G.removeFlight(f); missile = null;
    S.armed = null; S.negotiation = 0; S.tension = G.M.startTension; S.authority = G.M.startAuthority; S.interceptors = 10; S.cd = {}; S.log.length = 0; G.tab = 'act';
    S.event = null; G.dirty(); G.say('Simulación terminada. Lo que viene ahora es real, comandante.', 'tut_10', 2, '#ffd84a');
  }
  EVENTS._tutAsk = { title: 'SIMULACIÓN DE ENTRENAMIENTO', color: '#ffd84a', voice: 'tut_0',
    body: 'Antes de su primera guardia puede repasar la consola en una simulación: el globo, la llave y el botón, el teléfono rojo, las pantallas y los interceptores. Dura unos tres minutos y nada de lo que haga es real.',
    opts: [['HACER EL TUTORIAL', () => { S.paused = true; go(0); }], ['SALTARLO', () => { setDone(true); }]] };
  on('start', () => { if (!done) S.evQueue.unshift('_tutAsk'); });
  on('buttonPress', () => { pressed = true; });
  on('phoneAnswer', () => { answered = true; });
  on('select', hit => { if (step >= 0 && hit.custom === 'phone') answered = true; });
  on('frame', (dt, t) => {
    if (step < 0) return;
    if (!S.event) { step = -1; arrow.visible = false; return; }           // el jugador saltó
    const st = STEPS[step], p = P[st.at]; arrow.visible = true; arrow.position.set(p[0], p[1] + 0.03 * Math.sin(t * 4), p[2]);
    if (st.tick) st.tick();
    if (st.ok()) { hold += dt; if (hold > 0.9) { G.beep(880, 1320, 0.09); if (step + 1 < STEPS.length) go(step + 1); else finish(); } } else hold = 0;
  });
  on('reset', () => { step = -1; arrow.visible = false; missile = null; });

  // enlace en la portada para repetirlo
  const card = document.getElementById('card');
  if (card) { const el = document.createElement('div'); el.style.cssText = 'margin-top:8px;font-size:13px'; el.innerHTML = '<a href="#" style="color:#ffd84a">repetir el tutorial en la próxima partida</a>';
    el.firstChild.onclick = e => { e.preventDefault(); e.stopPropagation(); setDone(false); el.firstChild.textContent = 'tutorial activado para la próxima Noche 1'; }; card.insertBefore(el, card.querySelector('.hint')); }
  G.tutorial = { go, finish, get step() { return step; }, STEPS, reset: () => setDone(false) };
}
