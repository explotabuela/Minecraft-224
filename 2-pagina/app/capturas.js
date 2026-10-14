/* =========================================================
   MINECRAFT 224 · capturas
   - Pestañas por mes, con fecha y autor en cada foto
   - Visor en pantalla completa: zoom, deslizar, flechas y fondo borroso
   ========================================================= */
(function () {
  "use strict";

  const esperar = fn => { const ir = () => window.App.listo.then(() => setTimeout(() => fn(window.App), 0)); if (window.App) ir(); else addEventListener("DOMContentLoaded", ir); };

  esperar(App => {
    const caja = document.getElementById("capturas-caja");
    const { el, icono, nombreMes, fecha, guardar, leer } = App;
    const MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const fechaLarga = f => { if (!f) return ""; const [a, m, d] = String(f).slice(0, 10).split("-").map(Number); return m ? `${d} ${MESES_C[m - 1]} ${a}` : ""; };

    const todas = ((App.M && App.M.capturas) || []).filter(c => c && c.archivo)
      .map((c, i) => ({ ...c, _i: i }))
      .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")) || a._i - b._i);

    // ---------- Visor ----------
    function verCaptura(c, lista = todas) {
      if (!lista.length) return;
      let i = Math.max(0, lista.findIndex(x => x.archivo === (c && c.archivo)));
      let zoom = 1, px = 0, py = 0;

      const fondo = el("div", { class: "visor-fondo" });
      const img = el("img", { class: "visor-img", alt: "", draggable: "false" });
      const marco = el("div", { class: "visor-marco" }, img);
      const texto = el("p", { class: "visor-texto" });
      const meta = el("p", { class: "visor-meta" });
      const cuenta = el("span", { class: "visor-cuenta" });
      const descargar = el("a", { class: "boton-icono", html: icono("descargar", 16) + "Descargar", download: "" });
      const ant = el("button", { class: "visor-flecha izq", type: "button", "aria-label": "Anterior", html: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>` });
      const sig = el("button", { class: "visor-flecha der", type: "button", "aria-label": "Siguiente", html: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>` });
      const zoomBtn = el("button", { class: "boton-icono", type: "button", html: icono("buscar", 16) + "Zoom" });
      // Pantalla completa: en el cel, al girarlo se ve la foto a todo lo ancho
      const completaBtn = el("button", { class: "boton-icono", type: "button", "aria-label": "Pantalla completa", html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>` });
      const cont = el("div", { class: "visor" }, fondo, marco, ant, sig,
        el("div", { class: "visor-pie" }, el("div", { class: "visor-info" }, texto, meta), el("div", { class: "visor-botones" }, cuenta, zoomBtn, completaBtn, descargar)));

      const aplicar = () => { img.style.transform = `translate(${px}px, ${py}px) scale(${zoom})`; cont.classList.toggle("con-zoom", zoom > 1); };
      const sinZoom = () => { zoom = 1; px = py = 0; aplicar(); };
      function mostrar(n, dir = 0) {
        i = (n + lista.length) % lista.length;
        const f = lista[i];
        sinZoom();
        img.classList.remove("entra-izq", "entra-der"); void img.offsetWidth;
        if (dir) img.classList.add(dir > 0 ? "entra-der" : "entra-izq");
        img.src = f.archivo; img.alt = f.texto || "Captura de la 224";
        fondo.style.backgroundImage = `url("${String(f.archivo).replace(/"/g, "%22")}")`;
        texto.textContent = f.texto || "";
        texto.hidden = !f.texto;
        const autor = f.jugador || f.autor;
        meta.textContent = [fechaLarga(f.fecha), autor ? `Subida por ${autor}` : ""].filter(Boolean).join(" · ");
        cuenta.textContent = `${i + 1} / ${lista.length}`;
        descargar.href = f.archivo;
        ant.hidden = sig.hidden = lista.length < 2;
        // Precarga las de al lado
        [i - 1, i + 1].forEach(k => { const x = lista[(k + lista.length) % lista.length]; if (x) new Image().src = x.archivo; });
      }
      const v = App.cine(cont, { alCerrar: () => { removeEventListener("keydown", teclas); removeEventListener("resize", girado); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } });
      function teclas(e) {
        if (e.key === "ArrowRight") mostrar(i + 1, 1);
        else if (e.key === "ArrowLeft") mostrar(i - 1, -1);
        else if (e.key === "+" || e.key === "=") { zoom = Math.min(4, zoom + .5); aplicar(); }
        else if (e.key === "-") { zoom = Math.max(1, zoom - .5); if (zoom === 1) px = py = 0; aplicar(); }
      }
      addEventListener("keydown", teclas);
      ant.onclick = () => mostrar(i - 1, -1);
      sig.onclick = () => mostrar(i + 1, 1);
      zoomBtn.onclick = () => { if (zoom > 1) sinZoom(); else { zoom = 2.2; aplicar(); } };
      completaBtn.onclick = async () => {
        try {
          if (document.fullscreenElement) { await document.exitFullscreen(); return; }
          await cont.requestFullscreen();
          if (screen.orientation && screen.orientation.lock && matchMedia("(pointer:coarse)").matches) screen.orientation.lock("landscape").catch(() => {});
        } catch { App.M.avisar("Gira el cel para verla más grande"); }
      };
      // Al girar el cel, se esconden los botones para que la foto use toda la pantalla
      const girado = () => cont.classList.toggle("apaisado", matchMedia("(orientation: landscape) and (max-height: 520px)").matches);
      girado(); addEventListener("resize", girado);
      let ocultar = null;
      const mostrarPie = () => { cont.classList.add("pie-visible"); clearTimeout(ocultar); ocultar = setTimeout(() => cont.classList.remove("pie-visible"), 2500); };
      cont.addEventListener("pointerdown", () => { if (cont.classList.contains("apaisado")) mostrarPie(); });

      // Doble clic / doble toque: zoom donde tocaste
      let ultimoToque = 0;
      function zoomEn(x, y) {
        if (zoom > 1) { sinZoom(); return; }
        const r = marco.getBoundingClientRect();
        zoom = 2.4; px = (r.left + r.width / 2 - x) * (zoom - 1); py = (r.top + r.height / 2 - y) * (zoom - 1);
        aplicar();
      }
      marco.addEventListener("dblclick", e => zoomEn(e.clientX, e.clientY));

      // Rueda del mouse: zoom
      marco.addEventListener("wheel", e => {
        e.preventDefault();
        zoom = Math.max(1, Math.min(4, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
        if (zoom === 1) px = py = 0;
        aplicar();
      }, { passive: false });

      // Deslizar para cambiar, arrastrar para mover con zoom, pellizcar para zoom
      const dedos = new Map();
      let inicio = null, distInicial = 0, zoomInicial = 1;
      marco.addEventListener("pointerdown", e => {
        marco.setPointerCapture(e.pointerId);
        dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (dedos.size === 1) {
          const ahora = Date.now();
          if (e.pointerType !== "mouse" && ahora - ultimoToque < 300) { zoomEn(e.clientX, e.clientY); ultimoToque = 0; inicio = null; return; }
          ultimoToque = ahora;
          inicio = { x: e.clientX, y: e.clientY, px, py, t: ahora };
          img.style.transition = "none";
        } else if (dedos.size === 2) {
          const [a, b] = [...dedos.values()];
          distInicial = Math.hypot(a.x - b.x, a.y - b.y); zoomInicial = zoom; inicio = null;
        }
      });
      marco.addEventListener("pointermove", e => {
        if (!dedos.has(e.pointerId)) return;
        dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (dedos.size === 2 && distInicial) {
          const [a, b] = [...dedos.values()];
          zoom = Math.max(1, Math.min(4, zoomInicial * Math.hypot(a.x - b.x, a.y - b.y) / distInicial));
          if (zoom === 1) px = py = 0;
          aplicar(); return;
        }
        if (!inicio) return;
        const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
        if (zoom > 1) { px = inicio.px + dx; py = inicio.py + dy; aplicar(); }
        else img.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`;
      });
      const soltar = e => {
        dedos.delete(e.pointerId);
        if (dedos.size < 2) distInicial = 0;
        img.style.transition = "";
        if (!inicio) return;
        const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y, rapido = Date.now() - inicio.t < 350;
        inicio = null;
        if (zoom > 1) return;
        if (Math.abs(dx) > 70 || (rapido && Math.abs(dx) > 30)) mostrar(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        else if (dy > 120 && Math.abs(dx) < 60) v.cerrar();
        else aplicar();
      };
      marco.addEventListener("pointerup", soltar);
      marco.addEventListener("pointercancel", soltar);

      mostrar(i);
    }
    App.verCaptura = verCaptura;

    if (!caja) return;

    // ---------- Galería por mes ----------
    if (!todas.length) {
      caja.append(el("p", { class: "vacio", text: "Todavía no hay capturas. Súbelas al canal #capturas del Discord y aparecen aquí solitas." }));
      return;
    }
    const mesDeFoto = c => /^\d{4}-\d{2}/.test(c.fecha || "") ? c.fecha.slice(0, 7) : "otras";
    const meses = [...new Set(todas.map(mesDeFoto))].sort((a, b) => a === "otras" ? 1 : b === "otras" ? -1 : b.localeCompare(a));
    let actual = leer("capturas-mes", "todas");
    if (actual !== "todas" && !meses.includes(actual)) actual = "todas";

    const chips = el("div", { class: "chips capturas-chips", role: "tablist", "aria-label": "Mes de las capturas" });
    const rejilla = el("div", { class: "capturas-rejilla" });
    const conteo = el("p", { class: "capturas-conteo" });
    caja.append(chips, conteo, rejilla);

    function pintarChips() {
      chips.replaceChildren(...[["todas", "Todas"], ...meses.map(m => [m, m === "otras" ? "Sin fecha" : nombreMes(m)])].map(([k, t]) => {
        const n = k === "todas" ? todas.length : todas.filter(c => mesDeFoto(c) === k).length;
        return el("button", { class: "chip-btn", type: "button", role: "tab", "aria-pressed": String(k === actual), "aria-selected": String(k === actual),
          onclick: () => { actual = k; guardar("capturas-mes", k); App.transicion(pintar); } }, `${t} `, el("small", { class: "chip-num", text: String(n) }));
      }));
    }
    function pintar() {
      pintarChips();
      const lista = actual === "todas" ? todas : todas.filter(c => mesDeFoto(c) === actual);
      conteo.textContent = `${lista.length} ${lista.length === 1 ? "captura" : "capturas"}${actual !== "todas" && actual !== "otras" ? " en " + nombreMes(actual).toLowerCase() : ""}`;
      rejilla.replaceChildren(...lista.map((c, k) => {
        const img = el("img", { src: c.archivo, alt: c.texto || "Captura de la 224", loading: "lazy", decoding: "async" });
        img.onerror = () => b.remove();
        const b = el("button", { class: "captura", type: "button", style: `--k:${Math.min(k, 12)}`, onclick: () => verCaptura(c, lista) },
          img,
          c.fecha ? el("span", { class: "captura-fecha", text: fechaLarga(c.fecha) }) : null,
          (c.texto || c.autor) ? el("span", { class: "captura-pie" }, c.texto ? el("b", { text: c.texto }) : null, (c.jugador || c.autor) ? el("small", { text: c.jugador || c.autor }) : null) : null);
        return b;
      }));
    }
    pintar();

    App.ruta("#captura-", n => { const c = todas[Number(n)]; if (c) verCaptura(c); });
  });
})();
