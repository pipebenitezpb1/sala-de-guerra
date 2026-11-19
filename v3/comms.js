// Comunicaciones: llamadas de tus comandantes, del enemigo y de líderes neutrales. Suena el teléfono rojo; aceptar o rechazar tiene consecuencias.
export default function (G) {
  const { S, M, on, EVENTS, adj, addLog, pushNews, silos, cities, rand } = G;
  const W = () => G.world, bloc = id => W() && W().BLOCS.find(b => b.id === id);
  const sh = (id, d, why) => { const b = id ? bloc(id) : null; if (W()) W().shift(b, d, why); };
  const C = [
    { id: 1, who: 'PREMIER VOLKOV · BLOQUE ESTE', pre: true, text: 'Comandante. Retiren su submarino de nuestras costas y nosotros sacamos los nuestros del Atlántico. Los dos sabemos que ninguno quiere apretar el botón esta noche.',
      yes: ['Aceptar el retiro mutuo', () => { adj(-14, 10); for (const s of [...silos]) if (s.sub) { s.missiles = 0; s.destroyed = true; s.mk.visible = false; } addLog('Ambos bandos retiran sus submarinos.', '#9dffb0'); }],
      no: ['Rechazar', () => { adj(6, -4); }] },
    { id: 2, who: 'GENERAL ENEMIGO · CANAL NO OFICIAL', pre: true, text: 'No tengo mucho tiempo. Les doy las coordenadas de todos nuestros silos a cambio de asilo para mi familia. Decida ahora.',
      yes: ['Darle asilo', () => { if (Math.random() < (M.informants ? 0.1 : 0.35)) { adj(15, -8); addLog('Era una trampa: las coordenadas eran falsas y el enemigo grabó la llamada.', '#ff6a5a'); pushNews('El bloque este acusa al oeste de comprar traidores.'); }
        else { for (const s of silos) if (s.bloc === 'E') G.reveal(s, false); adj(4, 0); addLog('El desertor decía la verdad: silos enemigos localizados.', '#9dffb0'); } }],
      no: ['Colgar', () => { addLog('La línea quedó muda. Nunca sabremos si era verdad.', '#9fc9ce'); }] },
    { id: 3, who: 'GENERAL RIVAS · ESTADO MAYOR', pre: true, text: 'Comandante, un solo misil contra el silo Gobi. Quirúrgico. Les mostramos que vamos en serio y se sientan a negociar. Le doy mi palabra de que no escalará.',
      yes: ['Autorizar el golpe', () => { const t = silos.find(s => s.name === 'Silo Gobi' && !s.destroyed), p = G.launchers('P')[0]; if (t && p) { G.reveal(t, false); G.launch('P', p, t); G.sndLaunch(); S.lastPlayerLaunch = S.time; G.startWar('P'); S.limited = S.time; } }],
      no: ['Negarse', () => { S.authority = Math.max(0, S.authority - 2); addLog('Rivas cuelga sin despedirse. Pierdes respaldo militar.', '#ffb340'); }] },
    { id: 4, who: 'CANCILLER DE EUROPA', pre: true, text: 'Europa puede mediar. Pero necesitamos un gesto: retire tres interceptores de la frontera. Si usted baja la guardia primero, ellos nos escucharán.',
      yes: ['Retirar interceptores', () => { S.interceptors = Math.max(0, S.interceptors - 3); adj(-6, 18); sh('eur', 15, 'Europa media entre los bloques.'); }],
      no: ['No bajar la guardia', () => { sh('eur', -10, 'Europa se distancia: "no quieren la paz".'); }] },
    { id: 5, who: 'PRIMERA MINISTRA DE LA INDIA', pre: true, text: 'Le ofrezco una alianza defensiva: radares en nuestro territorio. A cambio quiero su palabra, ante el mundo, de que ustedes no dispararán primero.',
      yes: ['Dar la palabra', () => { S.pledge = true; const b = bloc('ind'); if (b) W().shift(b, 60 - b.stance, 'India confía en nuestra palabra.'); }],
      no: ['No comprometerse', () => { sh('ind', -8, 'India toma nota de nuestra negativa.'); }] },
    { id: 6, who: 'PREMIER VOLKOV · BLOQUE ESTE', pre: true, text: 'Propongo un gesto verificable. Cada bando desactiva un silo ahora mismo. Usted primero, y en diez segundos yo hago lo mismo.',
      yes: ['Desactivar un silo', () => { const p = silos.find(s => s.bloc === 'P' && !s.sub && !s.destroyed && s.missiles > 0); if (p) p.missiles = 0;
        const cheat = Math.random() < 0.3; if (cheat) { addLog(M.informants ? 'Informantes: Volkov NO desactivó su silo. Nos engañó.' : 'Volkov dice haber cumplido. No hay forma de verificarlo.', M.informants ? '#ff6a5a' : '#9fc9ce'); adj(-4, 6); }
        else { const e = silos.find(s => s.bloc === 'E' && !s.sub && !s.destroyed && s.missiles > 0); if (e) e.missiles = 0; adj(-12, 14); addLog('Ambos silos desactivados. Hay un poco menos de muerte en el mundo.', '#9dffb0'); } }],
      no: ['Rechazar', () => { adj(5, -4); }] },
    { id: 7, who: 'DRA. VEGA · ASESORA CIENTÍFICA', pre: true, text: 'Comandante, corrí los modelos climáticos. Con más de cuarenta detonaciones habrá hambruna en todo el planeta, gane quien gane. Déjeme transmitir los datos al enemigo.',
      yes: ['Transmitir los datos', () => { S.authority = Math.max(0, S.authority - 2); adj(-6, 9); sh(null, 4, 'El informe climático se filtra a la prensa mundial.'); }],
      no: ['Guardar el secreto', () => { addLog('El informe queda archivado.', '#9fc9ce'); }] },
    { id: 8, who: 'ALMIRANTE SOTO · FLOTA DEL ATLÁNTICO', pre: true, text: 'Tengo una flota enemiga a cuarenta millas. Pido permiso para seguirla de cerca. Si nos ven, se van a poner nerviosos. Si no los seguimos, estamos ciegos.',
      yes: ['Seguir a la flota', () => { adj(8, -2); S.interceptors += 2; const e = silos.find(s => s.bloc === 'E' && s.sub); if (e) G.reveal(e, false); addLog('La flota vigila de cerca. Dos interceptores navales disponibles.', '#9fe0ff'); }],
      no: ['Mantener distancia', () => { S.authority = Math.max(0, S.authority - 1); }] },
    { id: 9, who: 'MENSAJE SIN VERIFICAR', pre: true, text: 'Interceptamos esto en una frecuencia militar enemiga. Dice: lanzamiento general al amanecer. No sabemos quién lo envía ni si es real.',
      yes: ['Creerlo: alerta máxima', () => { adj(15, -5); S.interceptors += 3; addLog('Alerta máxima. El enemigo ve nuestros preparativos.', '#ffb340'); }],
      no: ['Ignorarlo', () => { if (Math.random() < 0.3) S.timers.push({ t: S.time + 25 * Math.max(G.TS, 0.5), fn: () => { if (S.phase < G.GUERRA) { adj(22, -8); addLog('El mensaje era real: el enemigo acelera sus preparativos.', '#ff6a5a'); } } }); else addLog(M.informants ? 'Informantes: el mensaje era una provocación falsa.' : 'No pasó nada. Tal vez era falso.', '#9fc9ce'); }] },
    { id: 10, who: 'PREMIER VOLKOV · BLOQUE ESTE', war: true, text: 'Basta. Ya murió demasiada gente. Si usted no lanza un misil más, yo tampoco. Tiene mi palabra, por lo que valga ahora.',
      yes: ['Aceptar el alto el fuego', () => { S.ceasefire = true; S.enemyActive = false; G.say('El enemigo acepta el alto el fuego.', 'alto_ok', 2, '#9dffb0'); }],
      no: ['Seguir', () => { addLog('Volkov cuelga. La guerra sigue.', '#ff6a5a'); }] },
    { id: 11, who: 'GENERAL RIVAS · ESTADO MAYOR', war: true, text: 'Vamos a perder los silos, comandante. Lance todo lo que queda contra sus ciudades ahora, o no lanzará nunca.',
      yes: ['Lanzar todo', () => { const tg = cities.filter(c => c.bloc === 'E').sort((a, b) => b.popRemaining - a.popRemaining); let i = 0; for (const p of G.launchers('P')) while (p.missiles > 0) G.launch('P', p, tg[i++ % tg.length]); G.sndLaunch(); S.lastPlayerLaunch = S.time; if (S.ceasefire) { S.ceasefire = false; S.enemyActive = true; } }],
      no: ['Negarse', () => { S.authority = Math.max(0, S.authority - 2); }] },
    { id: 12, who: 'CONSEJO DEL PACÍFICO', pre: true, text: 'Nuestras ciudades están entre ustedes dos. Pedimos tres de sus interceptores para protegerlas. Si nos ayudan ahora, no lo olvidaremos.',
      yes: ['Enviar interceptores', () => { S.interceptors = Math.max(0, S.interceptors - 3); sh('pac', 25, 'El Pacífico agradece la protección.'); }],
      no: ['No podemos', () => { sh('pac', -10, 'El Pacífico queda a su suerte.'); }] },
  ];
  let bag = [], nextT = 30, cur = null, ringLeft = 0, src = null;
  const draw = war => { const ok = C.filter(c => (war ? c.war : c.pre) && !S.commsDone[c.id]); if (!ok.length) return null; return ok[Math.floor(Math.random() * ok.length)]; };
  function open() {
    const c = cur; if (!c) return; S.commsDone[c.id] = true;
    EVENTS._comm = { title: 'LLAMADA: ' + c.who, color: '#ff9a40', time: 30, def: 1, body: '«' + c.text + '»', opts: [c.yes, c.no] };
    G.showEvent('_comm');
    const AC = G.AC; if (AC) G.loadVoice('comm_' + c.id).then(b => { if (src) try { src.stop(); } catch (e) {} src = AC.createBufferSource(); src.buffer = b; src.connect(G.civIn); src.start(AC.currentTime + 0.4); }).catch(() => {});
  }
  on('start', () => { S.commsDone = {}; nextT = S.time + rand(24, 34) * Math.max(G.TS, 0.5); cur = null; });
  on('phoneAnswer', () => { if (cur && ringLeft > 0) { ringLeft = 0; open(); } });
  on('update', dt => {
    if (S.ended || S.paused || !S.commsDone) return;
    if (S.limited && S.time - S.limited > 25 && S.time - S.lastPlayerLaunch > 20 && !S.ceasefire && S.phase === G.GUERRA) { S.limited = 0; if (Math.random() < 0.5) { S.ceasefire = true; S.enemyActive = false; addLog('El enemigo detiene su respuesta: el intercambio fue limitado.', '#9dffb0'); } else addLog('Rivas se equivocó: el enemigo escala.', '#ff6a5a'); }
    if (ringLeft > 0) { ringLeft -= dt; if (ringLeft <= 0) { if (G.phone) G.phone.stop(); addLog(`Llamada perdida de ${cur.who}.`, '#ffb340'); if (cur.pre) adj(3, -2); cur = null; } return; }
    if (S.event || S.time < nextT) return;
    cur = draw(S.phase === G.GUERRA); nextT = S.time + rand(30, 46) * Math.max(G.TS, 0.5); if (!cur) return;
    ringLeft = 16 * Math.max(G.TS, 0.6); addLog('Suena el teléfono rojo. Descuélguelo para contestar.', '#ff9a40');
    if (G.phone) G.phone.ring(); else { ringLeft = 0; open(); }
  });
  on('end', () => { if (G.phone) G.phone.stop(); ringLeft = 0; cur = null; if (src) try { src.stop(); } catch (e) {} });
  G.comms = { C, force(id) { cur = C.find(c => c.id === id); ringLeft = 0; open(); } };
}
