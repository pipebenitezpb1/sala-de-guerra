// Manos reales: seguimiento de manos del visor. Pellizco corto = gatillo; pellizco y arrastre = agarrar (globo, llave, teléfono); dedo índice = tocar.
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
export default function (G) {
  const { THREE, renderer, scene, controllers, on } = G;
  const factory = new XRHandModelFactory(), tmp = new THREE.Vector3();
  const isHand = c => !!(c.userData.src && c.userData.src.hand);
  const posOf = c => (c.userData.fingerPos && c.userData.fingerPos()) || new THREE.Vector3().setFromMatrixPosition(c.matrixWorld);
  controllers.forEach((c, i) => {
    const hand = renderer.xr.getHand(i);
    try { hand.add(factory.createHandModel(hand, 'mesh')); } catch (e) { console.warn('modelo de mano', e); }
    scene.add(hand); c.userData.handObj = hand;
    c.userData.fingerPos = () => { const j = hand.joints && hand.joints['index-finger-tip']; return j && j.visible !== false ? j.getWorldPosition(new THREE.Vector3()) : null; };
    c.addEventListener('selectend', () => {
      const st = c.userData.pinch; if (!st) return; c.userData.pinch = null;
      if (st.mode === 'pending') G.onSelect(st.hit); else c.dispatchEvent({ type: 'squeezeend' });
    });
  });
  on('ctlSelect', c => {
    if (!isHand(c)) return;
    const p = posOf(c), st = c.userData.pinch = { p0: new THREE.Vector3().setFromMatrixPosition(c.matrixWorld), hit: c.userData.hit, mode: 'pending' };
    if (G.physNear && G.physNear(p)) { st.mode = 'grab'; c.dispatchEvent({ type: 'squeezestart' }); }
    return true;
  });
  on('frame', () => {
    if (!renderer.xr.isPresenting) return;
    for (const c of controllers) { const st = c.userData.pinch; if (!st || st.mode !== 'pending') continue;
      if (tmp.setFromMatrixPosition(c.matrixWorld).distanceTo(st.p0) > 0.035) { st.mode = 'drag'; c.dispatchEvent({ type: 'squeezestart' }); } }
  });
  G.handtrack = { isHand };
}
