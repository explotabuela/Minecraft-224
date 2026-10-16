/* =========================================================
   MINECRAFT 224 · base de la app
   Herramientas que usan todos los apartados + cosas de "app":
   pantalla de carga, menú del cel, buscador, en vivo, jalar para actualizar...
   ========================================================= */
(function () {
  "use strict";
  // Nunca escribir "null" en la página: append/prepend/etc. ignoran null, undefined y false
  (function () {
    const limpiar = fn => function (...a) { return fn.apply(this, a.filter(x => x !== null && x !== undefined && x !== false)); };
    for (const P of [Element.prototype, DocumentFragment.prototype])
      for (const m of ["append", "prepend", "replaceChildren", "after", "before"]) if (P[m]) P[m] = limpiar(P[m]);
  })();

  const listo = new Promise(r => {
    if (window.M224) r(window.M224);
    else addEventListener("m224:listo", () => r(window.M224), { once: true });
  });

  // ---------- Herramientas ----------
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = v => Number(v || 0).toLocaleString("es-MX");
  const dec = (v, d = 1) => Number(v || 0).toLocaleString("es-MX", { maximumFractionDigits: d });
  const mesDe = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const nombreMes = m => { const [a, n] = String(m).split("-").map(Number); return `${MESES[n - 1][0].toUpperCase()}${MESES[n - 1].slice(1)} ${a}`; };
  const mesCorto = m => { const [a, n] = String(m).split("-").map(Number); return `${MESES_C[n - 1]} ${String(a).slice(2)}`; };
  const fecha = f => { if (!f) return ""; const [a, m, d] = String(f).slice(0, 10).split("-").map(Number); return `${d} de ${MESES_C[m - 1]}${a !== new Date().getFullYear() ? " " + a : ""}`; };
  function hace(iso) {
    if (!iso) return "";
    const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
    if (s < 60) return "hace un momento";
    if (s < 3600) return `hace ${Math.round(s / 60)} min`;
    if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
    const d = Math.round(s / 86400);
    return d === 1 ? "ayer" : `hace ${d} días`;
  }
  function duracion(iso) {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
  }
  const tiempo = min => { min = Math.round(min || 0); return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} m`; };

  function el(tag, attrs = {}, ...hijos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const h of hijos.flat()) if (h != null && h !== false) e.append(h.nodeType ? h : document.createTextNode(h));
    return e;
  }

  // Íconos (líneas simples, sin emojis)
  const P = {
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pico: '<path d="M14 6c3-2 6-1 8 1-3 0-5 1-7 3"/><path d="M14 6c-2-3-5-4-8-2 2 1 3 3 4 5"/><path d="m12 9-9 12"/>',
    gema: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>',
    espada: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/>',
    brujula: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    escudo: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    llama: '<path d="M12 3c1 3 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4.5 2-7 2 1 3 3 3.5 4C12 8 12 5 12 3z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    camara: '<path d="M4 7h4l2-3h4l2 3h4v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
    calavera: '<path d="M12 3a8 8 0 0 0-5 14.2V21h10v-3.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 21v-3M14 21v-3"/>',
    portal: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 7h6v10H9z"/>',
    ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    dragon: '<path d="M3 20c4-1 6-4 7-8l3 2 2-3 3 1 3-5-5 1-2-3-3 3-4-2c0 4-1 8-4 10"/>',
    corona: '<path d="m3 8 4 4 5-7 5 7 4-4-2 11H5z"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
    compartir: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>',
    descargar: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    pausa: '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>',
    arriba: '<path d="m6 15 6-6 6 6"/>',
    abajo: '<path d="m6 9 6 6 6-6"/>',
    casa: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    trofeo: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M9 19h6M12 14v5"/>',
    podio: '<path d="M3 20V13h6v7M9 20V8h6v12M15 20v-5h6v5"/>',
    gente: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2 5 5"/>',
    mas: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    mando: '<path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3M16 11.5h.01M18 13.5h.01"/>',
    grafica: '<path d="M4 20V4M4 20h16"/><path d="m7 15 4-5 3 3 5-7"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    foto: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>',
    regalo: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9c-1-3-5-5-6-2s4 2 6 2c2 0 7 1 6-2s-5-1-6 2"/>',
    libro: '<path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-6"/><path d="M20 4v13h-6"/>',
    mapa: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    pregunta: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
    entrar: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 4h6v16h-6"/>',
    reglas: '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    actualizar: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    voltear: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
    cine: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5M16 4v5"/>',
    rayo: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    estrella: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    pez: '<path d="M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2z"/><circle cx="8" cy="11" r=".8"/>',
    trigo: '<path d="M12 21V8"/><path d="M12 8c-2-1-3-3-3-5 2 0 3 2 3 5zm0 0c2-1 3-3 3-5-2 0-3 2-3 5zM12 13c-2-1-3.5-2.5-3.5-4.5 2 0 3.5 2 3.5 4.5zm0 0c2-1 3.5-2.5 3.5-4.5-2 0-3.5 2-3.5 4.5zM12 18c-2-1-3.5-2.5-3.5-4.5 2 0 3.5 2 3.5 4.5zm0 0c2-1 3.5-2.5 3.5-4.5-2 0-3.5 2-3.5 4.5z"/>',
    corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    esmeralda: '<path d="M8 3h8l4 6-8 12L4 9z"/><path d="M8 3l4 6 4-6M4 9h16"/>',
    ladrillo: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M3 15h18M9 5v5M15 10v5M9 15v4"/>',
    ola: '<path d="M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M8 9a4 4 0 0 1 8 0"/>',
    ala: '<path d="M3 20c2-8 7-14 18-16-1 6-4 10-9 12l3-4c-3 1-6 4-8 8z"/>',
    herradura: '<path d="M7 20V11a5 5 0 0 1 10 0v9"/><path d="M5 20h4M15 20h4"/>',
    barco: '<path d="M3 15h18l-3 5H6z"/><path d="M12 15V3l6 9h-6"/>',
    cama: '<path d="M3 18V7M3 13h18v5M21 18v-4a3 3 0 0 0-3-3h-7v2"/><circle cx="7" cy="11" r="2"/>',
    olla: '<path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M2 10h20M9 6c0-1 1-2 1-3M14 6c0-1 1-2 1-3"/>',
    lingote: '<path d="M6 9h12l3 8H3z"/><path d="M8 9l1-3h6l1 3"/>',
    cofre: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 11h18M11 10h2v3h-2z"/>',
    torre: '<path d="M8 21V8l4-5 4 5v13M5 21h14M10 12h4"/>',
    tridente: '<path d="M12 22V6M6 4v4a6 6 0 0 0 12 0V4M12 2v4"/>',
    totem: '<rect x="7" y="3" width="10" height="7" rx="1"/><path d="M5 12h14l-2 9H7z"/><path d="M10 6h.01M14 6h.01"/>',
    campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    pata: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15" cy="6.5" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M8 17c0-3 2-6 4.5-6s4.5 3 4.5 6c0 2-2 3-4.5 3S8 19 8 17z"/>',
    abeja: '<ellipse cx="12" cy="13" rx="5" ry="6"/><path d="M7 11h10M7 15h10M9 7 7 4M15 7l2-3"/>',
    huevo: '<path d="M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z"/>',
    luna: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
    copiar: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    java: '<path d="M8 17c3 1 6 1 8 0M7 20c4 1.5 8 1.5 10 0M10 14c-1-2 3-3 1-6s2-4 2-6"/>',
    bedrock: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    historia: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2M3 12h2"/>',
    tarjeta: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h3"/>',
  };
  const icono = (n, tam = 18, extra = "") => `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n] || P.estrella}</svg>`;

  // Skins: cara, cuerpo y poses (con respaldos si una página no carga)
  const POSE_CLASE = { Minero: "lunging", Guerrero: "kicking", Explorador: "marching", Viciado: "relaxing", Novato: "cowering" };
  // Varias páginas de skins: si una no carga (caída, bloqueada o lenta), se usa la siguiente
  // Con el UUID (lo manda el bot) la skin sale siempre la correcta; si no hay, se usa el nombre
  const uuidDe = n => { const j = App.porNombre && App.porNombre.get(String(n).toLowerCase()); return j && j.uuid ? j.uuid : null; };
  const urlCara = (n, t = 128) => `https://mc-heads.net/avatar/${encodeURIComponent(uuidDe(n) || n)}/${t}`;
  const urlCuerpo = (n, t = 220) => `https://mc-heads.net/body/${encodeURIComponent(uuidDe(n) || n)}/${t}`;
  const urlsCara = (n, t = 128) => {
    const u = uuidDe(n), e = encodeURIComponent(u || n);
    return [caraLocal(n), u ? `https://crafatar.com/avatars/${u}?size=${Math.min(t, 512)}&overlay` : null, urlCara(n, t), `https://minotar.net/helm/${e}/${t}.png`, u ? null : `https://mineskin.eu/helm/${e}/${t}.png`].filter(Boolean);
  };
  const urlsCuerpo = (n, t = 220) => {
    const u = uuidDe(n), e = encodeURIComponent(u || n);
    return [cuerpoLocal(n), urlCuerpo(n, t), u ? `https://crafatar.com/renders/body/${u}?scale=10&overlay` : null, `https://minotar.net/armor/body/${e}/${t}.png`, u ? null : `https://mineskin.eu/armor/body/${e}/${t}.png`].filter(Boolean);
  };
  const urlsSkinPng = n => {
    const j = App.porNombre && App.porNombre.get(String(n).toLowerCase());
    const u = uuidDe(n), e = encodeURIComponent(u || n);
    if (j && j.skin) return [j.skin, ...(u ? [`https://crafatar.com/skins/${u}`, `https://mc-heads.net/skin/${e}`] : [`https://minotar.net/skin/${e}`, `https://mc-heads.net/skin/${e}`])];
    return u ? [`https://crafatar.com/skins/${u}`, `https://mc-heads.net/skin/${e}`, `https://minotar.net/skin/${e}`] : [`https://minotar.net/skin/${e}`, `https://mc-heads.net/skin/${e}`, `https://mineskin.eu/skin/${e}`];
  };
  // ---------- Skins guardadas por el bot en la página (skins/NOMBRE.png) ----------
  // Se dibujan aquí mismo la cara y el cuerpo, así no dependemos de otras páginas.
  const skinsLocales = new Map(), carasLocales = new Map(), cuerposLocales = new Map();
  const datosJugador = n => App.porNombre && App.porNombre.get(String(n).toLowerCase());
  function skinLocal(n) {
    const j = datosJugador(n);
    if (!j || !j.skin) return Promise.resolve(null);
    const k = j.nombre.toLowerCase();
    if (!skinsLocales.has(k)) skinsLocales.set(k, new Promise(res => {
      const im = new Image();
      im.onload = () => res(im.naturalWidth === 64 ? im : null);
      im.onerror = () => res(null);
      im.src = j.skin;
      setTimeout(() => res(null), 10000);
    }));
    return skinsLocales.get(k);
  }
  // En diciembre (y hasta reyes) todos traen gorrito navideño
  const gorrito = () => { try { if (localStorage.getItem("m224-ajuste-temporada") === "false") return false; } catch {} const d = new Date(); return d.getMonth() === 11 || (d.getMonth() === 0 && d.getDate() <= 6); };
  function ponerGorrito(g, x0, y0, px) {
    const R = "#c62828", r = "#9e1c1c", W = "#f5f5f5";
    const filas = ["..RRRR.W", ".RRRRrRW", "RRRrRRR.", "WWWWWWWW"];
    filas.forEach((f, y) => [...f].forEach((ch, x) => { if (ch === ".") return; g.fillStyle = ch === "R" ? R : ch === "r" ? r : W; g.fillRect(x0 + x * px, y0 + (y - 1) * px, px, px); }));
  }
  // Skins en 3D (con pelo, gorra y chamarra con volumen); se puede apagar en Ajustes
  const en3D = () => { try { if (localStorage.getItem("m224-ajuste-skins3d") === "false") return false; } catch {} return !!window.Skin3D; };
  function dibujarCara(im, tam = 128) {
    if (en3D()) { try { return Skin3D.cabeza(im, tam, gorrito()).toDataURL(); } catch {} }
    const c = document.createElement("canvas"); c.width = c.height = tam;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    g.drawImage(im, 8, 8, 8, 8, 0, 0, tam, tam);
    g.drawImage(im, 40, 8, 8, 8, 0, 0, tam, tam);
    if (gorrito()) ponerGorrito(g, 0, 0, tam / 8);
    return c.toDataURL();
  }
  function dibujarCuerpo(im, slim, alto = 320) {
    if (en3D()) { try { return Skin3D.cuerpo(im, slim, alto, gorrito()).toDataURL(); } catch {} }
    const e = Math.max(1, Math.round(alto / 32)), aw = slim ? 3 : 4, nueva = im.naturalHeight === 64;
    const c = document.createElement("canvas"); c.width = 16 * e; c.height = 32 * e;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    const p = (sx, sy, w, h, dx, dy, espejo = false) => {
      if (!espejo) { g.drawImage(im, sx, sy, w, h, dx * e, dy * e, w * e, h * e); return; }
      g.save(); g.translate((dx + w) * e, dy * e); g.scale(-1, 1); g.drawImage(im, sx, sy, w, h, 0, 0, w * e, h * e); g.restore();
    };
    // Piernas
    p(4, 20, 4, 12, 4, 20); if (nueva) p(20, 52, 4, 12, 8, 20); else p(4, 20, 4, 12, 8, 20, true);
    // Cuerpo
    p(20, 20, 8, 12, 4, 8);
    // Brazos
    p(44, 20, aw, 12, 4 - aw, 8); if (nueva) p(36, 52, aw, 12, 12, 8); else p(44, 20, aw, 12, 12, 8, true);
    // Cabeza
    p(8, 8, 8, 8, 4, 0);
    // Capas de encima (chamarra, mangas, pantalón, sombrero)
    if (nueva) { p(4, 36, 4, 12, 4, 20); p(4, 52, 4, 12, 8, 20); p(20, 36, 8, 12, 4, 8); p(44, 36, aw, 12, 4 - aw, 8); p(52, 52, aw, 12, 12, 8); }
    p(40, 8, 8, 8, 4, 0);
    if (gorrito()) ponerGorrito(g, 4 * e, 0, e);
    return c.toDataURL();
  }
  // Prepara cara y cuerpo de cada jugador; regresa la imagen lista o null
  async function caraLocalAsync(n) {
    const k = String(n).toLowerCase();
    if (carasLocales.has(k)) return carasLocales.get(k);
    const im = await skinLocal(n); if (!im) return null;
    try { const u = dibujarCara(im, 128); carasLocales.set(k, u); return u; } catch { return null; }
  }
  async function cuerpoLocalAsync(n) {
    const k = String(n).toLowerCase();
    if (cuerposLocales.has(k)) return cuerposLocales.get(k);
    const im = await skinLocal(n); if (!im) return null;
    try { const u = dibujarCuerpo(im, !!(datosJugador(n) || {}).slim, 320); cuerposLocales.set(k, u); return u; } catch { return null; }
  }
  const caraLocal = n => carasLocales.get(String(n).toLowerCase()) || null;
  const cuerpoLocal = n => cuerposLocales.get(String(n).toLowerCase()) || null;

  function imgSkin(nombre, { pose = null, clase = "", tam = 220, tipo = "cuerpo" } = {}) {
    const e = encodeURIComponent(nombre);
    const urls = tipo === "cara" ? urlsCara(nombre, tam)
      : [pose ? `https://starlightskins.lunareclipse.studio/render/${pose}/${e}/full` : null, ...urlsCuerpo(nombre, tam)].filter(Boolean);
    const i = el("img", { class: clase + " pixel", alt: "", decoding: "async" });
    // Si el bot ya subió la skin, se usa esa (es la más confiable)
    const local = tipo === "cara" ? caraLocal(nombre) : cuerpoLocal(nombre);
    if (local) { i.src = local; return i; }
    const j = datosJugador(nombre);
    if (j && j.skin) {
      (tipo === "cara" ? caraLocalAsync(nombre) : cuerpoLocalAsync(nombre)).then(u => { if (u) { i.onerror = null; i.src = u; } else probarFuera(); });
      return i;
    }
    return probarFuera();
    function probarFuera() {
    let k = 0, reloj = null;
    const probar = () => {
      clearTimeout(reloj);
      i.src = urls[k];
      // Si en 7 segundos no cargó, pasa a la siguiente página
      reloj = setTimeout(() => { if (!i.complete || !i.naturalWidth) siguiente(); }, 7000);
    };
    const siguiente = () => {
      clearTimeout(reloj);
      k++;
      if (k < urls.length) probar();
      else {
        const d = el("div", { class: clase + " sin-cara", role: "img", "aria-label": nombre, text: (nombre.replace(/^\./, "")[0] || "?").toUpperCase() });
        i.replaceWith(d);
      }
    };
    i.onload = () => clearTimeout(reloj);
    i.onerror = siguiente;
    probar();
    return i;
    }
  }
  const imgCara = (nombre, clase = "", tam = 64) => imgSkin(nombre, { tipo: "cara", clase, tam });

  // Números que suben al aparecer
  function contar(elemento, fin, { dec: d = 0, dur = 1100, sufijo = "" } = {}) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { elemento.textContent = Number(fin).toLocaleString("es-MX", { maximumFractionDigits: d }) + sufijo; return; }
    const t0 = performance.now();
    (function f(a) {
      const p = Math.min(1, (a - t0) / dur), v = fin * (1 - Math.pow(1 - p, 3));
      elemento.textContent = v.toLocaleString("es-MX", { minimumFractionDigits: p < 1 ? 0 : 0, maximumFractionDigits: d }) + sufijo;
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  // Cuenta solo cuando se ve en pantalla
  const obsContar = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(x => {
    if (!x.isIntersecting) return;
    obsContar.unobserve(x.target);
    contar(x.target, Number(x.target.dataset.contar), { dec: Number(x.target.dataset.dec || 0), sufijo: x.target.dataset.sufijo || "" });
  }), { threshold: .4 }) : null;
  function contarAlVer(raiz) {
    raiz.querySelectorAll("[data-contar]").forEach(e => obsContar ? obsContar.observe(e) : contar(e, Number(e.dataset.contar)));
  }

  // Transición suave al cambiar algo (si el navegador puede)
  const transicion = fn => (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) ? document.startViewTransition(fn) : fn();

  // Ventana encima de la página
  function capa(contenido, { clase = "", ancho = null, alCerrar = null, etiqueta = "Ventana" } = {}) {
    const caja = el("div", { class: "capa-caja " + clase, role: "dialog", "aria-modal": "true", "aria-label": etiqueta });
    if (ancho) caja.style.width = `min(${ancho}px, 100%)`;
    const x = el("button", { class: "capa-x", type: "button", "aria-label": "Cerrar", html: icono("cerrar") });
    caja.append(x, contenido);
    const fondo = el("div", { class: "capa" }, caja);
    const previo = document.activeElement;
    let cerrada = false;
    function cerrar() {
      if (cerrada) return; cerrada = true;
      fondo.classList.remove("abierta");
      fondo.classList.add("cerrando");
      removeEventListener("keydown", tecla);
      setTimeout(() => fondo.remove(), 200);
      // Solo se libera la página si ya no queda ninguna ventana abierta
      if (!document.querySelector(".capa:not(.cerrando), .cine")) document.body.style.overflow = "";
      alCerrar && alCerrar();
      previo && previo.focus && previo.focus();
    }
    // Escape cierra solo la ventana de hasta arriba
    function tecla(e) { if (e.key === "Escape" && [...document.querySelectorAll(".capa:not(.cerrando)")].pop() === fondo && !document.querySelector(".cine")) { e.stopImmediatePropagation(); cerrar(); } }
    // La rueda del mouse sobre lo oscuro también mueve la ventana
    fondo.addEventListener("wheel", e => { if (e.target === fondo) caja.scrollBy({ top: e.deltaY, behavior: "auto" }); }, { passive: true });
    x.addEventListener("click", cerrar);
    fondo.addEventListener("click", e => { if (e.target === fondo) cerrar(); });
    addEventListener("keydown", tecla);
    document.body.append(fondo);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => fondo.classList.add("abierta"));
    setTimeout(() => x.focus(), 50);
    return { fondo, caja, cerrar };
  }

  // Pantalla completa oscura (VS, carrera, perfil en grande, TV)
  function cine(contenido, { alCerrar = null, pantallaCompleta = false } = {}) {
    const x = el("button", { class: "capa-x", type: "button", "aria-label": "Cerrar", html: icono("cerrar") });
    const c = el("div", { class: "cine", role: "dialog", "aria-modal": "true" }, contenido, x);
    function cerrar() {
      removeEventListener("keydown", tecla);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      c.remove(); if (!document.querySelector(".capa:not(.cerrando), .cine")) document.body.style.overflow = "";
      alCerrar && alCerrar();
    }
    function tecla(e) { if (e.key === "Escape") cerrar(); }
    x.addEventListener("click", cerrar);
    addEventListener("keydown", tecla);
    document.body.append(c); document.body.style.overflow = "hidden";
    if (pantallaCompleta && c.requestFullscreen) c.requestFullscreen().catch(() => {});
    x.focus();
    return { el: c, cerrar };
  }

  // ---------- Gráficas en SVG (sin librerías) ----------
  let idGraf = 0;
  function graficaLinea(puntos, { alto = 180, etiquetas = [], formato = num, color = null, ancho = 600 } = {}) {
    const W = ancho, H = alto, m = { l: 34, r: 10, t: 12, b: 24 };
    const max = Math.max(1, ...puntos), n = puntos.length;
    const x = i => m.l + (n <= 1 ? 0 : i * (W - m.l - m.r) / (n - 1));
    const y = v => H - m.b - (v / max) * (H - m.t - m.b);
    const id = "g" + (++idGraf);
    const linea = puntos.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const area = n ? `${linea}L${x(n - 1)},${H - m.b}L${x(0)},${H - m.b}Z` : "";
    const marcas = [0, .5, 1].map(f => `<line class="eje" x1="${m.l}" x2="${W - m.r}" y1="${y(max * f)}" y2="${y(max * f)}" stroke-dasharray="${f ? "3 4" : ""}"/><text x="${m.l - 6}" y="${y(max * f) + 4}" text-anchor="end">${formato(max * f)}</text>`).join("");
    const paso = Math.max(1, Math.ceil(n / 7));
    const ejeX = etiquetas.map((t, i) => {
      const ultimo = i === n - 1, mostrar = ultimo || (i % paso === 0 && (n - 1 - i) >= paso * .7);
      return mostrar ? `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : ultimo && n > 1 ? "end" : "middle"}">${esc(t)}</text>` : "";
    }).join("");
    const svg = el("div", { style: "position:relative", html:
      `<svg class="grafica" viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color || "var(--verde)"}" stop-opacity=".55"/><stop offset="1" stop-color="${color || "var(--verde)"}" stop-opacity="0"/></linearGradient></defs>
      ${marcas}<path d="${area}" fill="url(#${id})" opacity=".55"/><path class="linea" d="${linea}" ${color ? `style="stroke:${color}"` : ""} pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.1s" fill="freeze"/></path>${ejeX}
      <circle class="punto-g" r="4" cx="-20" cy="-20"/></svg>` });
    // Tooltip al pasar el dedo / mouse
    const s = svg.querySelector("svg"), pt = s.querySelector(".punto-g"), tip = el("div", { class: "grafica-tip", hidden: true });
    svg.append(tip);
    s.addEventListener("pointermove", ev => {
      const r = s.getBoundingClientRect(), fx = (ev.clientX - r.left) / r.width * W;
      const i = Math.max(0, Math.min(n - 1, Math.round((fx - m.l) / ((W - m.l - m.r) / Math.max(1, n - 1)))));
      pt.setAttribute("cx", x(i)); pt.setAttribute("cy", y(puntos[i]));
      tip.hidden = false; tip.textContent = `${etiquetas[i] ?? ""} · ${formato(puntos[i])}`;
      tip.style.left = (x(i) / W * r.width) + "px"; tip.style.top = (y(puntos[i]) / H * r.height) + "px";
    });
    s.addEventListener("pointerleave", () => { tip.hidden = true; pt.setAttribute("cx", -20); });
    return svg;
  }

  function graficaBarras(valores, { alto = 170, etiquetas = [], formato = num, resaltar = -1 } = {}) {
    const W = 600, H = alto, m = { l: 34, r: 6, t: 10, b: 24 };
    const max = Math.max(1, ...valores), n = valores.length, ancho = (W - m.l - m.r) / Math.max(1, n);
    const y = v => H - m.b - (v / max) * (H - m.t - m.b);
    const marcas = [.5, 1].map(f => `<line class="eje" x1="${m.l}" x2="${W - m.r}" y1="${y(max * f)}" y2="${y(max * f)}" stroke-dasharray="3 4"/><text x="${m.l - 6}" y="${y(max * f) + 4}" text-anchor="end">${formato(max * f)}</text>`).join("");
    const paso = Math.max(1, Math.ceil(n / 8));
    const barras = valores.map((v, i) => {
      const h = H - m.b - y(v), bx = m.l + i * ancho + ancho * .15;
      return `<rect class="barra ${resaltar >= 0 && i !== resaltar ? "tenue" : ""}" x="${bx.toFixed(1)}" y="${y(v).toFixed(1)}" width="${(ancho * .7).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="3"><title>${esc(etiquetas[i] ?? "")}: ${formato(v)}</title><animate attributeName="height" from="0" to="${Math.max(0, h).toFixed(1)}" dur=".7s" fill="freeze"/><animate attributeName="y" from="${H - m.b}" to="${y(v).toFixed(1)}" dur=".7s" fill="freeze"/></rect>`
        + (i % paso === 0 ? `<text x="${(m.l + i * ancho + ancho / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(etiquetas[i] ?? "")}</text>` : "");
    }).join("");
    return el("div", { html: `<svg class="grafica" viewBox="0 0 ${W} ${H}" role="img"><line class="eje" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>${marcas}${barras}</svg>` });
  }

  const COLORES = ["#5fd068", "#f5c451", "#5fd0e8", "#ff6b57", "#b57bff", "#ff9a3c", "#7dd3a8", "#e879f9"];
  function graficaDona(partes, { tam = 180, centro = "", sub = "" } = {}) {
    const total = partes.reduce((s, p) => s + p.valor, 0) || 1, r = 70, c = 2 * Math.PI * r;
    let acum = 0;
    const arcos = partes.map((p, i) => {
      const largo = p.valor / total * c;
      const a = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${COLORES[i % COLORES.length]}" stroke-width="26" stroke-dasharray="${largo} ${c - largo}" stroke-dashoffset="${-acum}" transform="rotate(-90 90 90)"><title>${esc(p.nombre)}: ${num(p.valor)}</title></circle>`;
      acum += largo; return a;
    }).join("");
    const leyenda = partes.map((p, i) => `<li><i style="background:${COLORES[i % COLORES.length]}"></i><span>${esc(p.nombre)}</span><b>${num(p.valor)}</b></li>`).join("");
    return el("div", { class: "dona", html: `<svg viewBox="0 0 180 180" width="${tam}" height="${tam}" role="img">${arcos}<text x="90" y="88" text-anchor="middle" class="dona-num">${esc(centro)}</text><text x="90" y="108" text-anchor="middle" class="dona-sub">${esc(sub)}</text></svg><ul>${leyenda}</ul>` });
  }

  // Flechita moderna de subir/bajar
  function indicador(cambio) {
    if (!cambio) return `<span class="indicador igual" title="Igual que ayer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M7 12h10"/></svg></span>`;
    const sube = cambio > 0;
    return `<span class="indicador ${sube ? "sube" : "baja"}" title="${sube ? "Subió" : "Bajó"} ${Math.abs(cambio)} ${Math.abs(cambio) === 1 ? "lugar" : "lugares"} desde ayer">${icono(sube ? "arriba" : "abajo", 12)}${Math.abs(cambio)}</span>`;
  }

  // Rutas: #j-NOMBRE, #vs-A-B, #mes-2026-12...
  const rutas = [];
  function ruta(prefijo, fn) { rutas.push([prefijo, fn]); }
  function seguirRuta() {
    const h = decodeURIComponent(location.hash || "");
    for (const [p, fn] of rutas) if (h.startsWith(p)) { fn(h.slice(p.length)); return true; }
    return false;
  }

  // Guardar preferencias chiquitas (si el navegador deja)
  const guardar = (k, v) => { try { localStorage.setItem("m224-" + k, JSON.stringify(v)); } catch {} };
  const leer = (k, def = null) => { try { const v = localStorage.getItem("m224-" + k); return v == null ? def : JSON.parse(v); } catch { return def; } };

  // Semilla del día (para el mini juego: el mismo para todos)
  function aleatorio(semilla) {
    let s = 0; for (const c of String(semilla)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // Si mc-heads no carga una cara o cuerpo en cualquier parte de la página, se pide a minotar
  document.addEventListener("error", e => {
    const i = e.target;
    if (!i || i.tagName !== "IMG" || i.dataset.respaldo) return;
    const m = (i.currentSrc || i.src || "").match(/mc-heads\.net\/(avatar|body)\/([^/?#]+)(?:\/(\d+))?/);
    if (!m) return;
    if (i.onerror && i.closest("[data-sin-respaldo]")) return;
    i.dataset.respaldo = "1";
    e.stopImmediatePropagation();
    const t = m[3] || 128;
    i.src = m[1] === "avatar" ? `https://minotar.net/helm/${m[2]}/${t}.png` : `https://minotar.net/armor/body/${m[2]}/${t}.png`;
  }, true);

  // Lo que usan los demás archivos
  const App = window.App = {
    listo, esc, num, dec, el, icono, mesDe, nombreMes, mesCorto, fecha, hace, duracion, tiempo, POSE_CLASE,
    imgSkin, imgCara, urlCara, urlCuerpo, urlsCara, urlsCuerpo, urlsSkinPng, caraLocal, cuerpoLocal, caraLocalAsync, cuerpoLocalAsync, contar, contarAlVer, transicion, capa, cine, graficaLinea, graficaBarras, graficaDona,
    COLORES, indicador, ruta, seguirRuta, guardar, leer, aleatorio,
  };

  // ---------- Cuando ya hay datos ----------
  listo.then(M => {
    const D = M.datos || {};
    App.M = M;
    App.D = D;
    App.jugadores = (M.CONFIG.jugadores || []).map(j => ({ medallas: [], ...j }));
    App.porNombre = new Map(App.jugadores.map(j => [j.nombre.toLowerCase(), j]));
    App.jugador = n => App.porNombre.get(String(n).toLowerCase());
    App.mesActual = (D.liga && D.liga.mes) || mesDe();
    App.paginaUrl = D.pagina || location.href.split("#")[0];

    // Prepara las caras y cuerpos de las skins que subió el bot
    App.skinsListas = Promise.all(App.jugadores.filter(j => j.skin).map(j => Promise.all([caraLocalAsync(j.nombre), cuerpoLocalAsync(j.nombre)]))).catch(() => {});
    quitarCarga();
    revelar();
    menu();
    barraAbajo();
    botonSubir();
    jalarParaActualizar();
    sinInternet();
    buscador();
    enVivo();
    actualizado();
    // Las rutas se revisan cuando ya cargaron todos los apartados
    setTimeout(() => { seguirRuta(); }, 50);
    addEventListener("hashchange", seguirRuta);
  });

  // ---------- Pantalla de carga ----------
  const DATOS_CURIOSOS = [
    "Cargando la 224…", "Contando las muertes por tonto…", "Buscando diamantes…", "Despertando a los creepers…",
    "Revisando quién va primero en la liga…", "Acomodando los bloques…",
  ];
  (function () {
    const p = document.getElementById("carga-dato");
    if (p) p.textContent = DATOS_CURIOSOS[Math.floor(Math.random() * DATOS_CURIOSOS.length)];
  })();
  const inicioCarga = performance.now();
  function quitarCarga() {
    const c = document.getElementById("carga");
    if (!c) return;
    const espera = Math.max(0, 500 - (performance.now() - inicioCarga));
    setTimeout(() => { c.classList.add("lista"); setTimeout(() => c.remove(), 600); }, espera);
  }

  // ---------- Apartados que aparecen suave al bajar ----------
  function revelar() {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("main section > *").forEach((s, i) => { s.classList.add("revelar"); s.style.transitionDelay = (i % 3) * 60 + "ms"; obs.observe(s); });
  }

  // ---------- Menú de arriba ----------
  function menu() {
    const header = document.querySelector(".menu");
    const mas = document.getElementById("mas-boton"), lista = document.getElementById("mas-lista");
    function cerrarMas() { lista.hidden = true; mas.setAttribute("aria-expanded", "false"); }
    mas.addEventListener("click", e => {
      e.stopPropagation();
      const abrir = lista.hidden;
      lista.hidden = !abrir; mas.setAttribute("aria-expanded", String(abrir));
      if (abrir) { const r = mas.getBoundingClientRect(); lista.style.top = r.bottom + "px"; lista.style.left = Math.min(r.left, innerWidth - 216) + "px"; }
    });
    addEventListener("click", e => { if (!lista.hidden && !lista.contains(e.target)) cerrarMas(); });
    lista.addEventListener("click", e => { if (e.target.closest("a,button")) cerrarMas(); });
    document.querySelectorAll("[data-tv]").forEach(b => b.addEventListener("click", () => App.tv && App.tv()));

    // Se esconde al bajar y aparece al subir
    let ultimo = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      if (Math.abs(y - ultimo) < 6) return;
      header.classList.toggle("escondido", y > ultimo && y > 300 && lista.hidden);
      ultimo = y;
    }, { passive: true });

    // Resalta el apartado donde vas
    const links = [...document.querySelectorAll(".menu nav > a, .mas-lista a, .abajo a")];
    const obs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle("activo", l.getAttribute("href") === "#" + e.target.id));
      App.apartado = e.target.id;
    }), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("#inicio, main section").forEach(s => obs.observe(s));
  }

  // ---------- Barra de abajo en el cel ----------
  function barraAbajo() {
    const items = [["#inicio", "casa", "Inicio"], ["#liga", "trofeo", "Liga"], ["#ranking", "podio", "Ranking"], ["#jugadores", "gente", "Jugadores"]];
    const nav = el("nav", { class: "abajo", "aria-label": "Menú rápido" },
      items.map(([h, i, t]) => el("a", { href: h, html: icono(i, 22) + `<span>${t}</span>` })),
      el("button", { type: "button", html: icono("mas", 22) + "<span>Más</span>", onclick: hojaMas }));
    document.body.append(nav);
  }
  function hojaMas() {
    const items = [["#juegos", "mando", "Juegos"], ["#capturas", "foto", "Capturas"], ["#wrapped", "regalo", "Wrapped"], ["#estadisticas", "grafica", "Estadísticas"],
      ["#meses", "calendario", "Meses"], ["#historia", "libro", "Historia"], ["#mapa", "mapa", "Mapa"], ["#entrar", "entrar", "Cómo entrar"], ["#reglas", "reglas", "Reglas"],
      ["#preguntas", "pregunta", "Preguntas"]];
    const rej = el("div", { class: "hoja-rejilla" },
      items.map(([h, i, t]) => el("a", { href: h, html: icono(i, 22) + t })),
      el("button", { type: "button", html: icono("buscar", 22) + "Buscar", "data-accion": "buscar" }),
      el("button", { type: "button", html: icono("tv", 22) + "Modo TV", "data-accion": "tv" }),
      el("button", { type: "button", html: icono("actualizar", 22) + "Datos nuevos", "data-accion": "recargar" }),
      el("button", { type: "button", html: icono("reglas", 22) + "Ajustes", "data-accion": "ajustes" }));
    const caja = el("div", { class: "hoja-caja", role: "dialog", "aria-label": "Más apartados" }, rej);
    const hoja = el("div", { class: "hoja" }, caja);
    const cerrar = () => { hoja.classList.remove("abierta"); setTimeout(() => hoja.remove(), 280); };
    hoja.addEventListener("click", e => {
      const b = e.target.closest("[data-accion]");
      if (e.target === hoja || e.target.closest("a")) cerrar();
      if (b) {
        cerrar();
        const acc = b.dataset.accion;
        setTimeout(() => acc === "tv" ? App.tv && App.tv() : acc === "ajustes" ? App.ajustes && App.ajustes() : acc === "recargar" ? App.recargarDatos && App.recargarDatos(true) : abrirBuscador(), 200);
      }
    });
    // Deslizar hacia abajo para cerrar
    let y0 = null;
    caja.addEventListener("touchstart", e => { y0 = caja.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    caja.addEventListener("touchmove", e => { if (y0 != null && e.touches[0].clientY - y0 > 70) { y0 = null; cerrar(); } }, { passive: true });
    document.body.append(hoja);
    requestAnimationFrame(() => hoja.classList.add("abierta"));
  }

  // ---------- Botón para subir ----------
  function botonSubir() {
    const b = el("button", { class: "subir", type: "button", "aria-label": "Subir hasta arriba", html: icono("arriba", 20), onclick: () => scrollTo({ top: 0, behavior: "smooth" }) });
    document.body.append(b);
    addEventListener("scroll", () => b.classList.toggle("visible", scrollY > innerHeight * 1.2), { passive: true });
  }

  // ---------- Jalar para actualizar (cel) ----------
  function jalarParaActualizar() {
    if (!("ontouchstart" in window)) return;
    const ind = el("div", { class: "jalar", "aria-hidden": "true", html: icono("actualizar", 20) });
    document.body.append(ind);
    let y0 = null, d = 0;
    addEventListener("touchstart", e => { y0 = scrollY <= 0 && !document.querySelector(".capa,.cine,.hist,.hoja") ? e.touches[0].clientY : null; d = 0; }, { passive: true });
    addEventListener("touchmove", e => {
      if (y0 == null) return;
      d = Math.max(0, e.touches[0].clientY - y0);
      const t = Math.min(90, d * .5);
      ind.style.transform = `translateY(${t - 60 + 20}px)`;
      ind.querySelector("svg").style.transform = `rotate(${d * 2}deg)`;
    }, { passive: true });
    addEventListener("touchend", () => {
      if (y0 == null) return;
      y0 = null;
      if (d > 130) {
        ind.classList.add("girando");
        ind.style.transform = "translateY(30px)";
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(() => location.reload(), 350);
      } else ind.style.transform = "";
    });
  }

  // ---------- Sin internet ----------
  function sinInternet() {
    const banda = el("div", { class: "sin-red", role: "status", hidden: true });
    document.querySelector(".menu").after(banda);
    const pintar = () => {
      banda.hidden = navigator.onLine;
      banda.textContent = `Sin internet · estás viendo los datos de ${App.D.actualizado ? hace(App.D.actualizado) : "la última vez"}`;
    };
    addEventListener("online", pintar); addEventListener("offline", pintar); pintar();
  }

  // ---------- "Actualizado hace X" ----------
  function actualizado() {
    const s = document.getElementById("actualizado");
    if (s && App.D.actualizado) s.textContent = " Actualizado " + hace(App.D.actualizado) + ".";
  }

  // ---------- Buscador universal ----------
  const APARTADOS = [["Inicio", "#inicio", "casa"], ["Liga del mes", "#liga", "trofeo"], ["Ranking", "#ranking", "podio"], ["Jugadores", "#jugadores", "gente"],
    ["VS", "#comparador", "rayo"], ["Mini juegos", "#juegos", "mando"], ["Estadísticas", "#estadisticas", "grafica"], ["Meses", "#meses", "calendario"],
    ["Historia", "#historia", "libro"], ["Capturas", "#capturas", "foto"], ["Mapa", "#mapa", "mapa"], ["Wrapped", "#wrapped", "regalo"],
    ["Cómo entrar", "#entrar", "entrar"], ["Reglas", "#reglas", "reglas"], ["Preguntas", "#preguntas", "pregunta"]];
  const CATEGORIAS = [["Horas", "horas"], ["Diamantes", "diamantes"], ["Netherita", "netherita"], ["Bloques minados", "minado"], ["Mobs", "mobs"], ["Metros", "metros"], ["Muertes", "muertes"], ["Racha", "racha"], ["Nivel", "nivel"], ["Récord sin morir", "record"]];
  function abrirBuscador() {
    const input = el("input", { type: "search", placeholder: "Busca un jugador, un apartado, un mes…", autocomplete: "off", "aria-label": "Buscar" });
    const ul = el("ul", { role: "listbox" });
    const caja = el("div", { class: "buscador-caja" }, el("label", { class: "buscador-campo", html: icono("buscar") }, input, el("kbd", { text: "Esc" })), ul);
    const fondo = el("div", { class: "buscador", role: "dialog", "aria-modal": "true", "aria-label": "Buscar" }, caja);
    let sel = 0, res = [];
    const quitarAcentos = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    function buscar() {
      const q = quitarAcentos(input.value.trim());
      res = [];
      App.jugadores.forEach(j => { if (!q || quitarAcentos(j.nombre).includes(q)) res.push({ tipo: "jugador", texto: j.nombre, sub: `Nivel ${j.nivel || 1}`, ir: () => App.abrirPerfil && App.abrirPerfil(j.nombre) }); });
      APARTADOS.forEach(([t, h, i]) => { if (q && quitarAcentos(t).includes(q)) res.push({ tipo: "apartado", texto: t, sub: "Apartado", icono: i, ir: () => document.querySelector(h)?.scrollIntoView({ behavior: "smooth" }) }); });
      CATEGORIAS.forEach(([t, c]) => { if (q && quitarAcentos(t).includes(q)) res.push({ tipo: "ranking", texto: "Ranking de " + t.toLowerCase(), sub: "Ranking", icono: "podio", ir: () => App.irRanking && App.irRanking(c) }); });
      const meses = Object.keys((App.D.wrapped && App.D.wrapped.Meses) || {});
      meses.forEach(m => { if (q && quitarAcentos(nombreMes(m)).includes(q)) res.push({ tipo: "mes", texto: nombreMes(m), sub: "Mes", icono: "calendario", ir: () => App.abrirMes && App.abrirMes(m) }); });
      if (q && "liga".includes(q)) res.unshift({ texto: "Liga del mes", sub: "Apartado", icono: "trofeo", ir: () => document.querySelector("#liga").scrollIntoView({ behavior: "smooth" }) });
      if (!q) res = res.slice(0, 8);
      res = res.slice(0, 14); sel = 0; pintar();
    }
    function pintar() {
      ul.innerHTML = "";
      if (!res.length) { ul.append(el("li", { class: "nada", text: "No encontré nada" })); return; }
      res.forEach((r, i) => {
        const a = el("a", { href: "#", role: "option", "aria-selected": String(i === sel) });
        a.append(r.tipo === "jugador" ? imgCara(r.texto, "", 64) : el("span", { class: "ico", html: icono(r.icono || "estrella") }), el("span", { text: r.texto }), el("small", { text: r.sub }));
        a.addEventListener("click", e => { e.preventDefault(); elegir(i); });
        ul.append(el("li", {}, a));
      });
    }
    function elegir(i) { const r = res[i]; cerrar(); if (r) setTimeout(r.ir, 60); }
    function cerrar() { fondo.remove(); document.body.style.overflow = ""; removeEventListener("keydown", tecla, true); }
    function tecla(e) {
      if (e.key === "Escape") { e.preventDefault(); cerrar(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); pintar(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); pintar(); }
      else if (e.key === "Enter") { e.preventDefault(); elegir(sel); }
    }
    input.addEventListener("input", buscar);
    fondo.addEventListener("click", e => { if (e.target === fondo) cerrar(); });
    addEventListener("keydown", tecla, true);
    document.body.append(fondo); document.body.style.overflow = "hidden";
    buscar(); input.focus();
  }
  App.abrirBuscador = abrirBuscador;
  function buscador() {
    document.getElementById("buscar-abrir")?.addEventListener("click", abrirBuscador);
    addEventListener("keydown", e => {
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.querySelector(".buscador,.capa,.cine,.hist")) {
        e.preventDefault(); abrirBuscador();
      }
    });
  }

  // ---------- En vivo: quién está jugando y desde cuándo ----------
  function enVivo() {
    const caja = document.getElementById("vivo");
    const estado = document.getElementById("estado"), pastilla = document.getElementById("pastilla"), lista = document.getElementById("lista");
    let presencia = (App.D && App.D.presencia) || null, servidor = null;
    pastilla.addEventListener("click", () => {
      const abrir = lista.hidden; lista.hidden = !abrir; pastilla.setAttribute("aria-expanded", String(abrir));
    });

    function pintar() {
      const enLinea = (presencia && presencia.enLinea) || [];
      // Si la página del estado dice quiénes están, manda esa (más al momento)
      const nombresServer = servidor && servidor.online ? (servidor.players?.list || []).map(p => p.name) : null;
      const quienes = nombresServer ? nombresServer.map(n => ({ nombre: n, desde: (enLinea.find(x => x.nombre.toLowerCase() === n.toLowerCase()) || {}).desde })) : enLinea;
      const prendido = servidor ? servidor.online : enLinea.length > 0 ? true : null;

      caja.className = "vivo" + (quienes.length ? " on" : "");
      caja.innerHTML = "";
      caja.append(el("span", { class: "etq", html: `<span class="punto"></span>${quienes.length ? "EN VIVO" : prendido === false ? "SERVER APAGADO" : "AHORITA"}` }));
      if (quienes.length) {
        const l = el("div", { class: "vivo-lista" });
        quienes.forEach(q => l.append(el("button", { class: "vivo-quien", type: "button", onclick: () => App.abrirPerfil && App.abrirPerfil(q.nombre) },
          imgCara(q.nombre, "", 64), el("span", {}, el("b", { text: q.nombre }), el("small", { text: q.desde ? "jugando desde hace " + duracion(q.desde) : "recién entró" })))));
        caja.append(l);
      } else {
        const u = presencia && presencia.ultimo;
        caja.append(el("p", { class: "nadie", html: u ? `Nadie jugando. La última fue <b>${esc(u.nombre)}</b>, ${hace(u.fecha)}.` : "Nadie jugando ahorita." }));
      }
      const rec = presencia && presencia.record;
      if (rec && rec.conectados > 1) caja.append(el("span", { class: "record", text: `Récord: ${rec.conectados} al mismo tiempo` }));

      // Pastilla de la esquina
      estado.dataset.estado = prendido ? "on" : prendido === false ? "off" : "cargando";
      document.getElementById("estado-texto").textContent = prendido ? `Server activo · ${quienes.length}` : prendido === false ? "Server apagado" : "Server";
      lista.innerHTML = "";
      lista.append(el("p", { text: prendido === false ? "EL SERVER ESTÁ APAGADO" : `${quienes.length} JUGANDO` }));
      const ul = el("ul");
      quienes.forEach(q => ul.append(el("li", {}, imgCara(q.nombre, "foto", 32), el("span", { text: q.nombre + (q.desde ? " · " + duracion(q.desde) : "") }))));
      if (!quienes.length) ul.append(el("li", {}, el("span", { text: "Nadie conectado ahorita" })));
      lista.append(ul);
    }

    async function revisarServer() {
      const ip = App.M.CONFIG.ip;
      if (!ip) return;
      try { servidor = await (await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(ip)}`)).json(); } catch { servidor = null; }
      pintar();
    }
    async function revisarDatos() {
      try {
        const r = await fetch("data.json?v=" + Date.now(), { cache: "no-store" });
        if (r.ok) { const d = await r.json(); presencia = d.presencia || presencia; }
      } catch {}
      pintar();
    }
    pintar();
    revisarServer();
    setInterval(() => { revisarServer(); revisarDatos(); }, 60000);
    setInterval(pintar, 30000); // para que "desde hace X" avance
  }
})();
