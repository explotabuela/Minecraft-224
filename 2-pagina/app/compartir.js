/* =========================================================
   MINECRAFT 224 · imágenes para compartir
   Perfil (cuadrado y tamaño historia), podio y ranking completo.
   Todo con el diseño de la 224 y el link de la página.
   ========================================================= */
(function () {
  "use strict";
  const A = () => window.App;

  const TAM = { cuadrado: [1080, 1080], historia: [1080, 1920], ancho: [1600, 900] };
  const ORO = "#f5c451", PLATA = "#c9d1d9", BRONCE = "#d08a4e", VERDE = "#5fd068";

  async function fuentes() {
    try { await Promise.all(['800 60px "Unbounded"', '600 40px "Figtree"', '700 40px "Figtree"', '30px "Silkscreen"'].map(f => document.fonts.load(f))); } catch {}
  }

  // Imágenes de otras páginas (caras). Si no dejan dibujarlas, se hace sin ellas.
  const cache = new Map();
  // Prueba varias direcciones hasta que una sirva
  async function cargar(url) {
    if (Array.isArray(url)) { for (const u of url) { const im = await cargar(u); if (im) return im; } return null; }
    return cargarUna(url);
  }
  function cargarUna(url) {
    if (cache.has(url)) return cache.get(url);
    const p = new Promise(res => {
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => res(im); im.onerror = () => res(null);
      im.src = url;
      setTimeout(() => res(null), 6000);
    });
    cache.set(url, p); return p;
  }
  const logo = () => cargar(document.querySelector(".marca img")?.src || "");

  function lienzo(formato) {
    const [w, h] = TAM[formato] || TAM.cuadrado;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    return [c, c.getContext("2d"), w, h];
  }

  function fondo(g, w, h, colores = ["#0e1c14", "#14301f", "#0b1310"]) {
    const d = g.createLinearGradient(0, 0, w, h);
    d.addColorStop(0, colores[0]); d.addColorStop(.55, colores[1]); d.addColorStop(1, colores[2]);
    g.fillStyle = d; g.fillRect(0, 0, w, h);
    const brillo = g.createRadialGradient(w * .8, h * .15, 0, w * .8, h * .15, w * .7);
    brillo.addColorStop(0, "#5fd06833"); brillo.addColorStop(1, "#5fd06800");
    g.fillStyle = brillo; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffffff08";
    for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 2, h);
    for (let y = 0; y < h; y += 40) g.fillRect(0, y, w, 2);
  }

  async function marca(g, w, h, conImagenes) {
    const lg = conImagenes ? await logo() : null;
    if (lg) { g.save(); redondo(g, 60, 54, 72, 72, 16); g.clip(); g.drawImage(lg, 60, 54, 72, 72); g.restore(); }
    g.fillStyle = "#fff"; g.font = '800 34px "Unbounded", sans-serif'; g.textBaseline = "middle";
    g.fillText("MINECRAFT 224", lg ? 150 : 60, 91);
    g.textBaseline = "alphabetic";
    g.fillStyle = "#ffffff99"; g.font = '26px "Silkscreen", monospace';
    const url = (A().paginaUrl || location.href.split("#")[0]).replace(/^https?:\/\//, "").replace(/\/$/, "");
    g.fillText(url, 60, h - 54);
  }

  function redondo(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  // Escribe el texto completo: si no cabe, la letra se hace más chiquita (y solo si es enorme se recorta)
  function texto(g, t, x, y, maxAncho) {
    const fuente = g.font, tam = parseFloat((fuente.match(/(\d+(?:\.\d+)?)px/) || [, 40])[1]);
    let t2 = tam;
    while (g.measureText(String(t)).width > maxAncho && t2 > tam * .4) { t2 -= 2; g.font = fuente.replace(/\d+(?:\.\d+)?px/, t2 + "px"); }
    let s = String(t); while (g.measureText(s).width > maxAncho && s.length > 2) s = s.slice(0, -1);
    if (s !== String(t)) s = s.slice(0, -1) + "…";
    g.fillText(s, x, y);
    g.font = fuente;
  }
  async function cara(g, nombre, x, y, t, conImagenes) {
    const im = conImagenes ? await cargar(A().urlsCara(nombre, 256)) : null;
    g.save(); redondo(g, x, y, t, t, t * .16); g.clip();
    if (im) { g.imageSmoothingEnabled = false; g.drawImage(im, x, y, t, t); }
    else { g.fillStyle = "#26322e"; g.fillRect(x, y, t, t); g.fillStyle = VERDE; g.font = `800 ${t * .45}px "Unbounded", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText((nombre.replace(/^\./, "")[0] || "?").toUpperCase(), x + t / 2, y + t / 2); g.textAlign = "left"; g.textBaseline = "alphabetic"; }
    g.restore();
  }

  // ---------- Perfil ----------
  async function perfil(j, formato, conImagenes = true) {
    const [c, g, w, h] = lienzo(formato);
    fondo(g, w, h);
    await marca(g, w, h, conImagenes);
    const alto = formato === "historia";
    const cuerpo = conImagenes ? await cargar(A().urlsCuerpo(j.nombre, 600)) : null;
    if (alto) {
      if (cuerpo) { g.imageSmoothingEnabled = false; const ch = 720, cw = ch * cuerpo.width / cuerpo.height; g.drawImage(cuerpo, (w - cw) / 2, 200, cw, ch); }
      g.textAlign = "center";
      g.fillStyle = "#fff"; g.font = '800 92px "Unbounded", sans-serif'; texto(g, j.nombre, w / 2, 1030, w - 120);
      g.fillStyle = ORO; g.font = '700 44px "Figtree", sans-serif'; g.fillText(`Nivel ${j.nivel || 1} · ${j.rango || "Novato"} · ${j.clase || ""}`, w / 2, 1100);
      barraXp(g, j, 160, 1140, w - 320);
      g.textAlign = "left";
      rejilla(g, statsDe(j), 60, 1240, w - 120, 3, 170);
      g.fillStyle = "#ffffffcc"; g.font = '600 38px "Figtree", sans-serif'; g.textAlign = "center";
      g.fillText(extraDe(j), w / 2, 1640);
      g.textAlign = "left";
    } else {
      if (cuerpo) { g.imageSmoothingEnabled = false; const ch = 640, cw = ch * cuerpo.width / cuerpo.height; g.drawImage(cuerpo, w - cw - 70, 200, cw, ch); }
      g.fillStyle = "#fff"; g.font = '800 76px "Unbounded", sans-serif'; texto(g, j.nombre, 60, 250, 620);
      g.fillStyle = ORO; g.font = '700 38px "Figtree", sans-serif'; g.fillText(`Nivel ${j.nivel || 1} · ${j.rango || "Novato"}`, 60, 310);
      g.fillStyle = "#ffffffaa"; g.font = '600 32px "Figtree", sans-serif'; g.fillText(`Clase: ${j.clase || "—"}`, 60, 360);
      barraXp(g, j, 60, 390, 560);
      rejilla(g, statsDe(j), 60, 470, 600, 2, 150);
      g.fillStyle = "#ffffffcc"; g.font = '600 32px "Figtree", sans-serif'; texto(g, extraDe(j), 60, 960, w - 120);
    }
    return blob(c, () => perfil(j, formato, false), conImagenes);
  }
  function statsDe(j) {
    return [["Horas", A().dec(j.horas)], ["Diamantes", A().num(j.diamantes)], ["Muertes", A().num(j.muertes)],
      ["Bloques", A().num(j.minado)], ["Mobs", A().num(j.mobs)], ["Km", A().dec((j.metros || 0) / 1000)]];
  }
  function extraDe(j) {
    const meds = (j.medallas || []).reduce((s, m) => s + (m.nivel || 0), 0);
    const liga = (A().D.liga?.tabla || []).find(f => f.nombre === j.nombre);
    return [meds ? `${meds} medallas` : null, liga ? `#${liga.lugar} en la liga del mes` : null, j.mejorRacha ? `Mejor racha: ${j.mejorRacha} días` : null].filter(Boolean).join("  ·  ");
  }
  function barraXp(g, j, x, y, ancho) {
    const p = Math.max(0, Math.min(1, ((j.xp || 0) - (j.xpNivel || 0)) / Math.max(1, (j.xpSiguiente || 1) - (j.xpNivel || 0))));
    g.fillStyle = "#ffffff1f"; redondo(g, x, y, ancho, 18, 9); g.fill();
    g.fillStyle = VERDE; redondo(g, x, y, Math.max(18, ancho * p), 18, 9); g.fill();
  }
  function rejilla(g, items, x, y, ancho, cols, alto) {
    const gap = 18, cw = (ancho - gap * (cols - 1)) / cols;
    items.forEach(([etq, val], k) => {
      const cx = x + (k % cols) * (cw + gap), cy = y + Math.floor(k / cols) * (alto + gap);
      g.fillStyle = "#00000040"; redondo(g, cx, cy, cw, alto, 24); g.fill();
      g.strokeStyle = "#ffffff1a"; g.lineWidth = 2; g.stroke();
      g.fillStyle = "#fff"; g.font = '800 54px "Unbounded", sans-serif'; texto(g, val, cx + 28, cy + alto * .52, cw - 50);
      g.fillStyle = "#ffffffaa"; g.font = '600 28px "Figtree", sans-serif'; g.fillText(etq, cx + 28, cy + alto * .52 + 46);
    });
  }

  // ---------- Podio ----------
  async function podio({ titulo, sub = "", filas, formato = "cuadrado" }, conImagenes = true) {
    const [c, g, w, h] = lienzo(formato);
    fondo(g, w, h, ["#1b1406", "#2b2210", "#0b0f0c"]);
    await marca(g, w, h, conImagenes);
    g.textAlign = "center";
    g.fillStyle = "#fff"; g.font = '800 64px "Unbounded", sans-serif'; texto(g, titulo, w / 2, 230, w - 120);
    g.fillStyle = "#ffffffaa"; g.font = '600 34px "Figtree", sans-serif'; g.fillText(sub, w / 2, 285);
    const base = formato === "historia" ? 1500 : h - 150;
    const anchoE = 280, orden = [1, 0, 2], altos = [380, 290, 220], colores = [ORO, PLATA, BRONCE];
    const xs = [w / 2 - anchoE * 1.5 - 20, w / 2 - anchoE / 2, w / 2 + anchoE / 2 + 20];
    for (let k = 0; k < 3; k++) {
      const i = orden[k], f = filas[i]; if (!f) continue;
      const x = xs[k], alto = altos[i], y = base - alto;
      const grad = g.createLinearGradient(0, y, 0, base); grad.addColorStop(0, colores[i]); grad.addColorStop(1, colores[i] + "55");
      g.fillStyle = grad; redondo(g, x, y, anchoE, alto + 40, 22); g.fill();
      g.fillStyle = "#0b0f0c"; g.font = '800 110px "Unbounded", sans-serif'; g.fillText(String(i + 1), x + anchoE / 2, y + 140);
      const tc = i === 0 ? 200 : 170;
      await cara(g, f.nombre, x + (anchoE - tc) / 2, y - tc - 90, tc, conImagenes);
      g.fillStyle = "#fff"; g.font = '800 40px "Unbounded", sans-serif'; texto(g, f.nombre, x + anchoE / 2, y - 50, anchoE + 20);
      g.fillStyle = colores[i]; g.font = '700 34px "Figtree", sans-serif'; g.fillText(f.valor, x + anchoE / 2, y - 12);
    }
    g.textAlign = "left";
    return blob(c, () => podio({ titulo, sub, filas, formato }, false), conImagenes);
  }

  // ---------- Ranking completo ----------
  async function tabla({ titulo, sub = "", filas, formato = "historia" }, conImagenes = true) {
    const [c, g, w, h] = lienzo(formato);
    fondo(g, w, h);
    await marca(g, w, h, conImagenes);
    g.fillStyle = "#fff"; g.font = '800 64px "Unbounded", sans-serif'; texto(g, titulo, 60, 240, w - 120);
    g.fillStyle = "#ffffffaa"; g.font = '600 34px "Figtree", sans-serif'; g.fillText(sub, 60, 295);
    const max = Math.max(1, ...filas.map(f => f.n || 0));
    const top = 350, altoF = Math.min(140, (h - top - 140) / Math.max(1, Math.min(10, filas.length)));
    for (let i = 0; i < Math.min(10, filas.length); i++) {
      const f = filas[i], y = top + i * altoF;
      g.fillStyle = i < 3 ? [ORO, PLATA, BRONCE][i] : "#ffffff66"; g.font = '800 44px "Unbounded", sans-serif'; g.fillText(String(i + 1), 60, y + altoF * .62);
      const t = altoF * .66;
      await cara(g, f.nombre, 140, y + (altoF - t) / 2, t, conImagenes);
      g.fillStyle = "#fff"; g.font = '700 40px "Figtree", sans-serif'; texto(g, f.nombre, 160 + t, y + altoF * .45, 480);
      g.fillStyle = "#ffffff1f"; redondo(g, 160 + t, y + altoF * .58, w - 260 - t - 220, 14, 7); g.fill();
      g.fillStyle = i === 0 ? ORO : VERDE; redondo(g, 160 + t, y + altoF * .58, Math.max(14, (w - 260 - t - 220) * (f.n || 0) / max), 14, 7); g.fill();
      g.textAlign = "right"; g.fillStyle = "#fff"; g.font = '800 40px "Unbounded", sans-serif'; g.fillText(f.valor, w - 60, y + altoF * .62); g.textAlign = "left";
    }
    return blob(c, () => tabla({ titulo, sub, filas, formato }, false), conImagenes);
  }

  async function blob(c, sinImagenes, conImagenes) {
    try {
      return await new Promise((res, rej) => { try { c.toBlob(b => b ? res(b) : rej(new Error("vacío")), "image/png"); } catch (e) { rej(e); } });
    } catch (e) {
      if (conImagenes) return sinImagenes(); // si las caras no se dejan dibujar, sin ellas
      throw e;
    }
  }

  // ---------- Ventana para ver, descargar y compartir ----------
  async function mostrar(generar, nombreArchivo, { formatos = null, titulo = "Compartir", link = null } = {}) {
    const App = A();
    const img = App.el("img", { class: "compartir-img", alt: "Vista previa" });
    const cargando = App.el("div", { class: "compartir-cargando", text: "Armando la imagen…" });
    const vista = App.el("div", { class: "compartir-vista" }, cargando, img);
    const bFormatos = formatos ? App.el("div", { class: "chips" }, formatos.map(([f, t]) => App.el("button", { class: "chip-btn", type: "button", "data-f": f, text: t }))) : null;
    const bajar = App.el("button", { class: "boton-icono lleno", type: "button", html: App.icono("descargar") + "Descargar" });
    const comp = App.el("button", { class: "boton-icono", type: "button", html: App.icono("compartir") + "Compartir", hidden: true });
    const bLink = link ? App.el("button", { class: "boton-icono", type: "button", html: App.icono("link") + "Copiar link" }) : null;
    const cont = App.el("div", { class: "compartir" }, App.el("h3", { text: titulo }), bFormatos, vista, App.el("div", { class: "acciones-fila" }, bajar, comp, bLink));
    App.capa(cont, { ancho: 560, etiqueta: titulo });
    let actual = null, formato = formatos ? formatos[0][0] : null;
    async function hacer() {
      cargando.hidden = false; img.hidden = true;
      bFormatos && bFormatos.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === formato)));
      try { actual = await generar(formato); } catch { cargando.textContent = "No se pudo armar la imagen"; return; }
      if (img.src) URL.revokeObjectURL(img.src);
      img.src = URL.createObjectURL(actual); img.hidden = false; cargando.hidden = true;
      const archivo = new File([actual], nombreArchivo + (formato ? "-" + formato : "") + ".png", { type: "image/png" });
      comp.hidden = !(navigator.canShare && navigator.canShare({ files: [archivo] }));
      comp.onclick = () => navigator.share({ files: [archivo], title: "Minecraft 224" }).catch(() => {});
    }
    bFormatos && bFormatos.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { formato = b.dataset.f; hacer(); } });
    bajar.addEventListener("click", () => {
      if (!actual) return;
      const a = document.createElement("a"); a.href = URL.createObjectURL(actual); a.download = nombreArchivo + (formato ? "-" + formato : "") + ".png"; a.click();
    });
    bLink && bLink.addEventListener("click", () => compartirLink(link, titulo));
    hacer();
  }

  // Compartir un link (WhatsApp, etc.) o copiarlo
  async function compartirLink(url, titulo = "Minecraft 224") {
    if (navigator.share) { try { await navigator.share({ url, title: titulo }); return; } catch (e) { if (e.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(url); A().M.avisar("Link copiado"); } catch { prompt("Copia el link:", url); }
  }

  window.Compartir = { perfil, podio, tabla, mostrar, compartirLink };
})();
