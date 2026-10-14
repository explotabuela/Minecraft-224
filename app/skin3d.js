/* =========================================================
   MINECRAFT 224 · skins en 3D (sin librerías)
   Dibuja la cabeza y el cuerpo como en el juego: cubos con la
   capa de encima (pelo, gorra, chamarra, mangas, pantalón) un
   poquito más grande, para que se vea con volumen.
   ========================================================= */
(function () {
  "use strict";

  // ---- La skin lista para dibujar: 64x64, capa de abajo sin hoyos y en 3 tonos de luz ----
  const cache = new WeakMap();
  function preparar(im) {
    if (cache.has(im)) return cache.get(im);
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    g.drawImage(im, 0, 0);
    if (im.naturalHeight === 32 || im.height === 32) convertirVieja(g);
    // La capa de abajo en Minecraft nunca es transparente
    const datos = g.getImageData(0, 0, 64, 64), d = datos.data;
    const base = [[0, 0, 32, 16], [0, 16, 56, 16], [16, 48, 32, 16]];
    for (const [x0, y0, w, h] of base)
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++) { const k = (y * 64 + x) * 4 + 3; if (d[k] < 255) { if (d[k] === 0) { d[k - 3] = d[k - 2] = d[k - 1] = 0; } d[k] = 255; } }
    g.putImageData(datos, 0, 0);
    const tonos = [1, 0.86, 0.68].map(f => {
      if (f === 1) return c;
      const t = document.createElement("canvas"); t.width = t.height = 64;
      const tg = t.getContext("2d"), td = g.getImageData(0, 0, 64, 64);
      for (let k = 0; k < td.data.length; k += 4) { td.data[k] *= f; td.data[k + 1] *= f; td.data[k + 2] *= f; }
      tg.putImageData(td, 0, 0);
      return t;
    });
    cache.set(im, tonos);
    return tonos;
  }

  // Skins viejas (64x32): el brazo y la pierna izquierdos son el espejo de los derechos
  function convertirVieja(g) {
    const espejo = (sx, sy, w, h, dx, dy) => {
      const tmp = g.getImageData(sx, sy, w, h), out = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        for (let k = 0; k < 4; k++) out.data[(y * w + x) * 4 + k] = tmp.data[(y * w + (w - 1 - x)) * 4 + k];
      g.putImageData(out, dx, dy);
    };
    // [origen x, origen y] del brazo/pierna derechos y del izquierdo nuevo
    for (const [ox, oy, nx, ny] of [[0, 16, 16, 48], [40, 16, 32, 48]]) {
      espejo(ox + 4, oy, 4, 4, nx + 4, ny);      // arriba
      espejo(ox + 8, oy, 4, 4, nx + 8, ny);      // abajo
      espejo(ox + 0, oy + 4, 4, 12, nx + 8, ny + 4); // lado de afuera -> lado de adentro
      espejo(ox + 4, oy + 4, 4, 12, nx + 4, ny + 4); // frente
      espejo(ox + 8, oy + 4, 4, 12, nx + 0, ny + 4); // lado de adentro -> lado de afuera
      espejo(ox + 12, oy + 4, 4, 12, nx + 12, ny + 4); // atrás
    }
  }

  // ---- Cámara: un poco desde arriba y de lado ----
  function camara(giro, inclinacion) {
    const a = giro * Math.PI / 180, b = inclinacion * Math.PI / 180;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    return ([x, y, z]) => {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      const y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
      return [x1, -y2, z2];
    };
  }

  // Las caras de una caja: [normal, origen, dirección u, largo u, dirección v, largo v, rectángulo de textura]
  function caras(caja) {
    const { x0, x1, y0, y1, z0, z1, tex } = caja;
    const W = x1 - x0, H = y1 - y0, D = z1 - z0;
    const L = [];
    const t = tex; // [u, v, w, h, d] en la textura
    const r = t ? (k => ({
      top: [t[0] + t[4], t[1], t[2], t[4]],
      front: [t[0] + t[4], t[1] + t[4], t[2], t[3]],
      right: [t[0], t[1] + t[4], t[4], t[3]],
      left: [t[0] + t[4] + t[2], t[1] + t[4], t[4], t[3]],
      back: [t[0] + 2 * t[4] + t[2], t[1] + t[4], t[2], t[3]],
      bottom: [t[0] + t[4] + t[2], t[1], t[2], t[4]],
    })[k]) : () => null;
    L.push({ n: [0, 0, 1], o: [x0, y1, z1], u: [1, 0, 0], lu: W, v: [0, -1, 0], lv: H, rect: r("front"), tono: 1 });
    L.push({ n: [0, 0, -1], o: [x1, y1, z0], u: [-1, 0, 0], lu: W, v: [0, -1, 0], lv: H, rect: r("back"), tono: 1 });
    L.push({ n: [-1, 0, 0], o: [x0, y1, z0], u: [0, 0, 1], lu: D, v: [0, -1, 0], lv: H, rect: r("right"), tono: 2 });
    L.push({ n: [1, 0, 0], o: [x1, y1, z1], u: [0, 0, -1], lu: D, v: [0, -1, 0], lv: H, rect: r("left"), tono: 2 });
    L.push({ n: [0, 1, 0], o: [x0, y1, z0], u: [1, 0, 0], lu: W, v: [0, 0, 1], lv: D, rect: r("top"), tono: 0 });
    L.push({ n: [0, -1, 0], o: [x0, y0, z1], u: [1, 0, 0], lu: W, v: [0, 0, -1], lv: D, rect: r("bottom"), tono: 2 });
    return L;
  }

  // Una parte del cuerpo: caja de adentro + caja de encima un poquito más grande
  function parte(x0, y0, z0, w, h, d, texBase, texCapa, crecer, color) {
    const caja = (e, tex, extra) => Object.assign({ x0: x0 - e, x1: x0 + w + e, y0: y0 - e, y1: y0 + h + e, z0: z0 - e, z1: z0 + d + e, tex: tex ? [...tex, w, h, d] : null }, extra);
    const cajas = [caja(0, texBase, { color })];
    if (texCapa) cajas.push(caja(crecer, texCapa, { capa: true }));
    return { centro: [x0 + w / 2, y0 + h / 2, z0 + d / 2], cajas };
  }

  // Gorrito navideño hecho de cubitos (para diciembre)
  function gorrito(yBase, x0 = -4.6, ancho = 9.2) {
    const blanco = "#f2f2f2", rojo = "#c62828";
    const p = (x, y, z, w, h, d, color) => ({ x0: x, x1: x + w, y0: y, y1: y + h, z0: z, z1: z + d, tex: null, color });
    return { centro: [0, yBase + 3, 12], cajas: [
      p(x0, yBase, x0, ancho, 1.6, ancho, blanco),
      p(-3.6, yBase + 1.6, -3.6, 7.2, 2.4, 7.2, rojo),
      p(-2.4, yBase + 4, -2.6, 4.8, 2, 4.8, rojo),
      p(-1.2, yBase + 6, -2.2, 2.4, 1.6, 2.4, rojo),
      p(-1.3, yBase + 6.4, -3.8, 2.2, 2.2, 2.2, blanco),
    ] };
  }

  // Dibuja las partes en un canvas, ajustando el tamaño para que quepa todo
  function render(tonos, partes, { giro, inclinacion, ancho, alto, margen = 0.04 }) {
    const P = camara(giro, inclinacion);
    // Medir
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pt of partes) for (const b of pt.cajas) for (const x of [b.x0, b.x1]) for (const y of [b.y0, b.y1]) for (const z of [b.z0, b.z1]) {
      const [sx, sy] = P([x, y, z]); minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
    }
    const c = document.createElement("canvas");
    const escala = Math.min(ancho * (1 - 2 * margen) / (maxX - minX), alto * (1 - 2 * margen) / (maxY - minY));
    c.width = ancho; c.height = alto;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    const offX = (ancho - (maxX - minX) * escala) / 2 - minX * escala, offY = (alto - (maxY - minY) * escala) / 2 - minY * escala;
    const pant = p => { const [x, y] = P(p); return [x * escala + offX, y * escala + offY]; };
    const prof = p => P(p)[2];
    const vis = n => P(n)[2] - P([0, 0, 0])[2];
    // Lejos -> cerca
    const orden = partes.slice().sort((a, b) => prof(a.centro) - prof(b.centro));
    const dibujar = (b, f) => {
      const o = pant(f.o);
      const pu = pant([f.o[0] + f.u[0] * f.lu, f.o[1] + f.u[1] * f.lu, f.o[2] + f.u[2] * f.lu]);
      const pv = pant([f.o[0] + f.v[0] * f.lv, f.o[1] + f.v[1] * f.lv, f.o[2] + f.v[2] * f.lv]);
      if (f.rect) {
        const [sx, sy, sw, sh] = f.rect;
        // Un pelito más grande para que no se vean rayitas entre caras
        const k = b.capa ? 1 : 1 + 0.6 / Math.max(1, Math.hypot(pu[0] - o[0], pu[1] - o[1]));
        g.setTransform((pu[0] - o[0]) / sw * k, (pu[1] - o[1]) / sw * k, (pv[0] - o[0]) / sh * k, (pv[1] - o[1]) / sh * k, o[0], o[1]);
        g.drawImage(tonos[f.tono], sx, sy, sw, sh, 0, 0, sw, sh);
        g.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        g.fillStyle = b.color; g.beginPath();
        g.moveTo(o[0], o[1]); g.lineTo(pu[0], pu[1]); g.lineTo(pu[0] + pv[0] - o[0], pu[1] + pv[1] - o[1]); g.lineTo(pv[0], pv[1]); g.closePath(); g.fill();
        if (f.tono) { g.fillStyle = `rgba(0,0,0,${f.tono === 2 ? 0.28 : 0.12})`; g.fill(); }
        g.strokeStyle = g.fillStyle; g.lineWidth = 0.6; g.stroke();
      }
    };
    for (const pt of orden) {
      const capas = pt.cajas.filter(b => b.capa), base = pt.cajas.filter(b => !b.capa);
      // Por dentro de la capa de encima (se ve por los huecos del pelo o la gorra)
      for (const b of capas) caras(b).filter(f => vis(f.n) < 0).sort((a, b2) => prof(a.o) - prof(b2.o)).forEach(f => dibujar(b, f));
      for (const b of base) caras(b).filter(f => vis(f.n) > 0).forEach(f => dibujar(b, f));
      for (const b of capas) caras(b).filter(f => vis(f.n) > 0).forEach(f => dibujar(b, f));
    }
    return c;
  }

  // ---- Lo que usa la página ----
  function cabeza(im, tam = 128, conGorrito = false) {
    const tonos = preparar(im);
    const partes = [parte(-4, 0, -4, 8, 8, 8, [0, 0], [32, 0], 0.5)];
    if (conGorrito) partes.push(gorrito(8.5));
    return render(tonos, partes, { giro: -30, inclinacion: 17, ancho: tam, alto: tam, margen: 0.03 });
  }

  function cuerpo(im, slim, alto = 320, conGorrito = false) {
    const tonos = preparar(im), aw = slim ? 3 : 4;
    const partes = [
      parte(-4, 0, -2, 4, 12, 4, [0, 16], [0, 32], 0.25),          // pierna derecha
      parte(0, 0, -2, 4, 12, 4, [16, 48], [0, 48], 0.25),          // pierna izquierda
      parte(-4, 12, -2, 8, 12, 4, [16, 16], [16, 32], 0.25),       // cuerpo
      parte(-4 - aw, 12, -2, aw, 12, 4, [40, 16], [40, 32], 0.25), // brazo derecho
      parte(4, 12, -2, aw, 12, 4, [32, 48], [48, 48], 0.25),       // brazo izquierdo
      parte(-4, 24, -4, 8, 8, 8, [0, 0], [32, 0], 0.5),            // cabeza
    ];
    if (conGorrito) partes.push(gorrito(32.5));
    // La cabeza siempre va hasta adelante (si no, el cuello se encima mal)
    partes[5].centro = [0, 28, 3];
    return render(tonos, partes, { giro: -28, inclinacion: 12, ancho: Math.round(alto * 0.62), alto, margen: 0.02 });
  }

  window.Skin3D = { cabeza, cuerpo, preparar };
})();
