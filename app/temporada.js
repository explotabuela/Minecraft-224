/* =========================================================
   MINECRAFT 224 · fin de temporada (#temporada)
   - Totales de toda la 224, campeón y los mejores de cada cosa
   - Línea del tiempo semana por semana y día por día (bitácora del bot)
   - El diario de cada jugador
   - La película: capturas con música, la temporada en resumen y créditos
   ========================================================= */
(function () {
  "use strict";

  const esperar = fn => { const ir = () => window.App.listo.then(() => setTimeout(() => fn(window.App), 0)); if (window.App) ir(); else addEventListener("DOMContentLoaded", ir); };

  const INICIO = new Date("2026-12-15T16:00:00-07:00");
  const FIN = new Date("2027-02-06T23:59:00-07:00");
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const MC = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  esperar(App => {
    const { el, esc, num, icono, D } = App;
    let DIARIO = null;
    const traerDiario = () => DIARIO ? Promise.resolve(DIARIO) :
      fetch("diario.json?v=" + Date.now(), { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null)
        .then(d => (DIARIO = d || { jugadores: {}, temporada: [] }));

    const jugadores = () => (App.jugadores || []).filter(j => (j.minutos || 0) > 0 || (j.muertes || 0) > 0);
    const suma = k => jugadores().reduce((a, j) => a + (Number(j[k]) || 0), 0);
    const fechaDe = s => new Date(String(s).replace(" ", "T"));
    const diaCorto = d => `${d.getDate()} ${MC[d.getMonth()]}`;
    const semanaDe = d => Math.floor((d - INICIO) / (7 * 864e5)) + 1;
    const terminada = () => new Date() > FIN;

    function tops(k, n = 3, asc = false) {
      return jugadores().filter(j => (j[k] || 0) > 0).sort((a, b) => asc ? a[k] - b[k] : b[k] - a[k]).slice(0, n);
    }
    function campeon() {
      const c = tops("xp", 1)[0];
      return c || null;
    }

    // Todo lo que pasó: la bitácora del bot + campeones del mes + capturas
    function eventos(dia) {
      const lista = [];
      (dia.temporada || []).forEach(l => lista.push({ f: fechaDe(l.fecha), texto: l.texto, tipo: l.tipo }));
      (App.M.capturas || []).forEach(c => { if (c.fecha) lista.push({ f: fechaDe(c.fecha + " 12:00"), texto: `${c.autor || "Alguien"} subió una captura${c.texto ? ": " + c.texto : ""}`, tipo: "captura", captura: c }); });
      return lista.filter(e => !isNaN(e.f) && e.f >= new Date(INICIO.getTime() - 864e5)).sort((a, b) => a.f - b.f);
    }

    const ICONO_TIPO = { jefe: "espada", nether: "fuego", caos: "rayo", campeon: "trofeo", captura: "foto", inicio: "casa" };

    // ---------- La página ----------
    function abrir() {
      traerDiario().then(dia => {
        const c = campeon();
        const enCurso = !terminada();
        const faltan = Math.max(0, Math.ceil((FIN - new Date()) / 864e5));
        const cab = el("header", { class: "tp-cab" },
          el("span", { class: "etq-mini", text: "MINECRAFT 224" }),
          el("h2", { class: "tp-titulo", text: "Temporada 1" }),
          el("p", { class: "tp-fechas", text: `15 de diciembre de 2026 al 6 de febrero de 2027 · ${enCurso ? (new Date() < INICIO ? "todavía no empieza" : `faltan ${faltan} ${faltan === 1 ? "día" : "días"}`) : "terminada"}` }),
          el("button", { class: "boton-icono lleno", type: "button", html: icono("play") + "Ver la película", onclick: () => pelicula(dia) }));

        const tot = [["Horas jugadas", Math.round(suma("minutos") / 60)], ["Muertes", suma("muertes")], ["Bloques minados", suma("minado")], ["Mobs", suma("mobs")],
          ["Kilómetros", Math.round(suma("metros") / 1000)], ["Diamantes", suma("diamantes")], ["Netherita", suma("netherita")], ["Jugadores", jugadores().length]];
        const totales = el("div", { class: "tp-sec" }, el("h3", { class: "sub-titulo", text: "Toda la 224 junta" }),
          el("div", { class: "tp-totales" }, tot.map(([t, v]) => el("div", { class: "tp-total" }, el("b", { text: num(v) }), el("span", { text: t })))));

        const CATS = [["Más horas", "minutos", v => v < 60 ? `${v} min` : `${Math.round(v / 60)} h`], ["Más mobs", "mobs", num], ["Más minado", "minado", num], ["Más diamantes", "diamantes", num],
          ["Más caminado", "metros", v => `${(v / 1000).toFixed(1)} km`], ["Más muertes", "muertes", num], ["Récord sin morir", "record", v => v < 60 ? `${v} min` : `${Math.floor(v / 60)} h ${v % 60} min`], ["Mejor racha", "mejorRacha", v => v === 1 ? "1 día" : `${v} días`]];
        const mejores = el("div", { class: "tp-sec" }, el("h3", { class: "sub-titulo", text: "Los mejores de la temporada" }),
          c ? el("a", { class: "tp-campeon", href: "#j-" + encodeURIComponent(c.nombre) },
            el("img", { src: App.urlCuerpo(c.nombre), alt: "", loading: "lazy" }),
            el("div", {}, el("span", { class: "etq-mini", text: "CAMPEÓN DE LA TEMPORADA" }), el("b", { text: c.nombre }), el("small", { text: `Nivel ${c.nivel} · ${c.rango}` }))) : null,
          el("div", { class: "tp-tops" }, CATS.map(([t, k, f]) => {
            const ls = tops(k);
            return el("div", { class: "tp-top" }, el("h4", { text: t }),
              ls.length ? el("ol", {}, ls.map(j => el("li", {}, el("img", { src: App.urlCara(j.nombre), alt: "", loading: "lazy" }), el("span", { text: j.nombre }), el("b", { text: f(j[k]) }))))
                : el("p", { class: "vacio", text: "Nadie todavía" }));
          })));

        // Línea del tiempo por semana y día
        const ev = eventos(dia);
        const porSemana = new Map();
        ev.forEach(e => { const s = Math.max(0, semanaDe(e.f)); if (!porSemana.has(s)) porSemana.set(s, []); porSemana.get(s).push(e); });
        const linea = el("div", { class: "tp-sec" }, el("h3", { class: "sub-titulo", text: "Lo que pasó, semana por semana" }),
          porSemana.size ? el("div", { class: "tp-linea" }, [...porSemana.entries()].map(([s, es]) => {
            const ini = new Date(INICIO.getTime() + (s - 1) * 7 * 864e5), fin = new Date(ini.getTime() + 6 * 864e5);
            const porDia = new Map();
            es.forEach(e => { const k = diaCorto(e.f); if (!porDia.has(k)) porDia.set(k, []); porDia.get(k).push(e); });
            return el("div", { class: "tp-semana" },
              el("h4", {}, s <= 0 ? "Antes de empezar" : `Semana ${s}`, el("small", { text: s <= 0 ? "" : ` · ${diaCorto(ini)} al ${diaCorto(fin)}` })),
              [...porDia.entries()].map(([d, xs]) => el("div", { class: "tp-dia" }, el("span", { class: "tp-fecha", text: d }),
                el("ul", {}, xs.map(x => el("li", { html: icono(ICONO_TIPO[x.tipo] || "estrella", 15) + esc(x.texto) }))))));
          })) : el("p", { class: "vacio", text: "La línea del tiempo se va llenando conforme pasan cosas en el server." }));

        // Diario de cada quien
        const nombres = Object.keys(dia.jugadores || {}).sort((a, b) => a.localeCompare(b));
        const sel = el("select", { "aria-label": "Jugador" }, nombres.map(n => el("option", { value: n, text: n })));
        const caja = el("div", { class: "tp-diario" });
        const pintarDiario = () => {
          const ls = (dia.jugadores[sel.value] || []).slice().reverse();
          caja.replaceChildren(...ls.map(l => { const f = fechaDe(l.fecha); return el("div", { class: "tp-renglon" }, el("span", { class: "tp-fecha", text: isNaN(f) ? "" : diaCorto(f) }), el("span", { text: l.texto })); }));
        };
        sel.addEventListener("change", pintarDiario);
        const diarios = el("div", { class: "tp-sec" }, el("h3", { class: "sub-titulo", text: "El diario de cada quien" }),
          nombres.length ? el("div", {}, sel, caja) : el("p", { class: "vacio", text: "Los diarios se llenan solos mientras juegan." }));
        if (nombres.length) pintarDiario();

        App.capa(el("div", { class: "tp" }, cab, totales, mejores, linea, diarios), { ancho: 980, etiqueta: "Temporada 1" });
      });
    }

    // ---------- La película ----------
    function pelicula(dia) {
      const caps = (App.M.capturas || []).filter(c => c.archivo).slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
      const ev = eventos(dia).filter(e => e.tipo !== "captura");
      const c = campeon();
      const L = [];
      const fondo = i => caps.length ? caps[i % caps.length].archivo : null;
      L.push({ dur: 6000, musica: "intro", html: `<div class="pe-centro"><span class="pe-mini">Minecraft 224 presenta</span><h1 class="pe-grande">Temporada 1</h1><p>15 de diciembre · 6 de febrero</p></div>`, img: fondo(0) });
      // Semana por semana
      const semanas = new Map();
      ev.forEach(e => { const s = Math.max(1, semanaDe(e.f)); if (!semanas.has(s)) semanas.set(s, []); semanas.get(s).push(e); });
      [...semanas.entries()].forEach(([s, es], k) => {
        const cap = caps.find(x => Math.max(1, semanaDe(fechaDe(x.fecha + " 12:00"))) === s);
        L.push({ dur: 5000 + es.length * 900, musica: k % 2 ? "aventura" : "todos", img: cap ? cap.archivo : fondo(k + 1),
          html: `<div class="pe-semana"><span class="pe-mini">Semana ${s}</span><ul>${es.slice(0, 6).map(e => `<li>${esc(e.texto)}</li>`).join("")}</ul></div>` });
      });
      // Las capturas
      caps.forEach((cap, i) => L.push({ dur: 3800, musica: i === 0 ? "racha" : null, img: cap.archivo, solo: true,
        html: `<div class="pe-pie"><b>${esc(cap.texto || "")}</b><span>${esc(cap.autor || "")}${cap.fecha ? " · " + esc(diaCorto(fechaDe(cap.fecha + " 12:00"))) : ""}</span></div>` }));
      // Totales
      L.push({ dur: 7000, musica: "tiempo", html: `<div class="pe-numeros"><span class="pe-mini">En toda la temporada</span>
        <div><b>${num(Math.round(suma("minutos") / 60))}</b> horas jugadas</div><div><b>${num(suma("muertes"))}</b> muertes</div>
        <div><b>${num(suma("minado"))}</b> bloques minados</div><div><b>${num(suma("mobs"))}</b> mobs</div></div>` });
      if (c) L.push({ dur: 7000, musica: "titulo", html: `<div class="pe-centro"><span class="pe-mini">Campeón de la temporada</span><img class="pe-cuerpo" src="${esc(App.urlCuerpo(c.nombre))}" alt=""><h1 class="pe-grande">${esc(c.nombre)}</h1><p>Nivel ${c.nivel}</p></div>` });
      // Créditos
      const reparto = jugadores().slice().sort((a, b) => (b.minutos || 0) - (a.minutos || 0));
      const filas = [`<div class="cr-seccion">Protagonizada por</div>`, ...reparto.map(j => `<div class="cr-nota">${esc(j.nombre)}</div>`),
        `<div class="cr-seccion">Organizada por</div><div class="cr-nota">Dylan</div>`,
        `<div class="cr-seccion">Durante el rodaje</div><div class="cr-nota">${num(suma("mobs"))} mobs fueron lastimados</div><div class="cr-nota">Ningún aldeano fue lastimado. Bueno, a lo mejor sí.</div>`,
        `<div class="cr-fin">Gracias por jugar</div><div class="cr-sub">Nos vemos en la temporada 2</div>`];
      const durC = Math.max(16000, filas.length * 1400);
      L.push({ dur: durC + 1500, musica: "intro", html: `<div class="creditos" style="--dur:${durC}ms"><div class="creditos-rollo">${filas.join("")}</div></div>` });

      const Mus = window.M224?.wrapped?.Musica;
      const pantalla = el("div", { class: "pe" });
      const fondoEl = el("div", { class: "pe-fondo" });
      const capaEl = el("div", { class: "pe-texto" });
      const barra = el("div", { class: "pe-barra" });
      pantalla.append(fondoEl, capaEl, barra);
      let i = 0, timer = 0, pausa = false;
      const cine = App.cine(pantalla, { alCerrar: () => { clearTimeout(timer); Mus && Mus.parar(); } });
      if (Mus) Mus.iniciar();
      function mostrar() {
        const l = L[i];
        if (!l) { cine.cerrar(); return; }
        if (Mus && l.musica) Mus.cambiar(l.musica);
        fondoEl.className = "pe-fondo" + (l.img ? " con-foto" : "") + (l.solo ? " solo" : "");
        fondoEl.style.backgroundImage = l.img ? `url("${l.img}")` : "";
        fondoEl.style.animation = "none"; void fondoEl.offsetWidth; fondoEl.style.animation = "";
        capaEl.innerHTML = l.html;
        barra.style.setProperty("--p", ((i + 1) / L.length * 100).toFixed(1) + "%");
        clearTimeout(timer);
        if (!pausa) timer = setTimeout(() => { i++; mostrar(); }, l.dur);
      }
      pantalla.addEventListener("click", e => {
        if (e.target.closest(".capa-x")) return;
        const izq = e.clientX < innerWidth / 3;
        i = Math.max(0, i + (izq ? -1 : 1)); mostrar();
      });
      addEventListener("keydown", function tecla(e) {
        if (!document.body.contains(pantalla)) { removeEventListener("keydown", tecla); return; }
        if (e.key === "ArrowRight") { i++; mostrar(); }
        if (e.key === "ArrowLeft") { i = Math.max(0, i - 1); mostrar(); }
        if (e.key === " ") { e.preventDefault(); pausa = !pausa; if (!pausa) mostrar(); else clearTimeout(timer); }
      });
      mostrar();
    }

    // Sale hasta que se acaba la temporada; #temporada-prueba la abre antes para revisarla
    if (terminada()) document.querySelectorAll("[data-temporada]").forEach(a => { a.hidden = false; });
    App.ruta("#temporada-prueba", () => abrir());
    App.ruta("#temporada", () => terminada() ? abrir() : App.M.avisar("La página de la temporada sale cuando se acabe, el 6 de febrero"));
    App.temporadaAbrir = abrir;
  });
})();
