/* =========================================================
   MINECRAFT 224 · ajustes y detalles de la página
   - Ajustes: alto contraste, letra grande, partículas, temporadas
   - Partículas de bloques en el fondo del inicio
   - Navidad (nieve y gorritos), Año nuevo (cuenta regresiva y fuegos), aniversario
   - Botón para traer datos nuevos sin recargar a mano
   - Botón de subir con cohete y transiciones entre apartados
   - Capturas: contador total
   ========================================================= */
(function () {
  "use strict";

  const esperar = fn => { const ir = () => window.App.listo.then(() => setTimeout(() => fn(window.App), 0)); if (window.App) ir(); else addEventListener("DOMContentLoaded", ir); };

  // Los ajustes se aplican lo antes posible para que no "brinque" la página
  const leerA = (k, def) => { try { const v = localStorage.getItem("m224-" + k); return v == null ? def : JSON.parse(v); } catch { return def; } };
  const raiz = document.documentElement;
  raiz.classList.toggle("alto-contraste", !!leerA("ajuste-contraste", false));
  raiz.classList.toggle("letra-grande", !!leerA("ajuste-letra", false));

  esperar(App => {
    const { el, icono, num, guardar, leer, D } = App;
    const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hoy = new Date();
    const AJ = {
      contraste: () => leer("ajuste-contraste", false),
      letra: () => leer("ajuste-letra", false),
      particulas: () => leer("ajuste-particulas", !reducido),
      temporada: () => leer("ajuste-temporada", true),
      skins3d: () => leer("ajuste-skins3d", true),
    };

    // ---------- Temporada actual ----------
    const esNavidad = () => AJ.temporada() && (hoy.getMonth() === 11 || (hoy.getMonth() === 0 && hoy.getDate() <= 6));
    const esFinDeAno = () => AJ.temporada() && hoy.getMonth() === 11 && hoy.getDate() >= 26;
    const esAnoNuevo = () => AJ.temporada() && hoy.getMonth() === 0 && hoy.getDate() <= 2;
    const inicioServer = (() => { const f = App.jugadores.map(j => j.primerDia).filter(Boolean).sort()[0]; return f ? new Date(f + "T12:00:00") : null; })();
    const aniversario = (() => {
      if (!inicioServer) return null;
      for (let n = 1; n <= 10; n++) {
        const a = new Date(inicioServer); a.setFullYear(a.getFullYear() + n);
        const dias = (hoy - a) / 864e5;
        if (dias >= -7 && dias <= 7) return { n, fecha: a, dias: Math.round(dias) };
      }
      return null;
    })();
    App.temporada = { esNavidad, esFinDeAno, esAnoNuevo, aniversario };
    if (esNavidad()) raiz.classList.add("navidad");

    // =====================================================
    // AJUSTES
    // =====================================================
    function ajustes() {
      const fila = (id, titulo, texto, valor, alCambiar) => {
        const inp = el("input", { type: "checkbox", id: "aj-" + id, role: "switch" }); inp.checked = !!valor;
        inp.addEventListener("change", () => alCambiar(inp.checked));
        return el("label", { class: "ajuste", for: "aj-" + id }, el("span", {}, el("b", { text: titulo }), el("small", { text: texto })), inp, el("span", { class: "interruptor", "aria-hidden": "true" }));
      };
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
      const cont = el("div", { class: "ajustes" },
        el("h3", { text: "Ajustes" }),
        el("p", { class: "perfil-nota", text: "Se guardan en este celular o compu." }),
        fila("contraste", "Alto contraste", "Colores más fuertes para que se lea mejor.", AJ.contraste(), v => { guardar("ajuste-contraste", v); raiz.classList.toggle("alto-contraste", v); }),
        fila("letra", "Letra más grande", "Agranda todo el texto de la página.", AJ.letra(), v => { guardar("ajuste-letra", v); raiz.classList.toggle("letra-grande", v); }),
        fila("particulas", "Bloques flotando", "Los bloquecitos que flotan en el inicio.", AJ.particulas(), v => { guardar("ajuste-particulas", v); v ? particulas() : pararParticulas(); }),
        fila("skins3d", "Skins en 3D", "Caras y cuerpos con volumen (pelo, gorras, chamarras). Apágalo si tu cel va lento.", AJ.skins3d(), v => { guardar("ajuste-skins3d", v); App.M.avisar("Se aplica al recargar la página"); }),
        fila("temporada", "Adornos de temporada", "Nieve en diciembre, fuegos en año nuevo y aniversarios.", AJ.temporada(), v => { guardar("ajuste-temporada", v); App.M.avisar("Se aplica al recargar la página"); }),
        el("div", { class: "ajustes-acciones" },
          el("button", { class: "btn juego-btn", type: "button", html: icono("actualizar", 16) + "Buscar datos nuevos", onclick: () => recargarDatos(true) }),
          App.instalar ? el("button", { class: "boton-icono", type: "button", html: icono("descargar", 16) + "Instalar como app", onclick: () => App.instalar() }) : null),
        ios ? el("p", { class: "perfil-nota", text: "En iPhone: toca Compartir y luego \"Agregar a inicio\" para tenerla como app." }) : null,
        el("p", { class: "ajustes-version", text: `Datos del ${D.actualizado ? new Date(D.actualizado).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—"}` }));
      App.capa(cont, { ancho: 460, etiqueta: "Ajustes" });
    }
    App.ajustes = ajustes;

    // Botones de ajustes y recargar en el menú "Más" de la compu
    const lista = document.getElementById("mas-lista");
    if (lista) lista.append(
      el("button", { type: "button", text: "Buscar datos nuevos", onclick: () => recargarDatos(true) }),
      el("button", { type: "button", text: "Ajustes", onclick: ajustes }));

    // =====================================================
    // DATOS NUEVOS SIN RECARGAR A MANO
    // =====================================================
    let avisado = false;
    async function recargarDatos(manual = false) {
      try {
        const r = await fetch("data.json?t=" + Date.now(), { cache: "no-store" });
        const nuevo = await r.json();
        if (nuevo.actualizado && nuevo.actualizado !== D.actualizado) {
          if (manual) return aplicar();
          if (!avisado) { avisado = true; avisoNuevos(); }
        } else if (manual) App.M.avisar("Ya tienes lo más nuevo");
      } catch { if (manual) App.M.avisar("No se pudo revisar. ¿Tienes internet?"); }
    }
    function aplicar() {
      try { sessionStorage.setItem("m224-scroll", String(scrollY)); } catch {}
      location.reload();
    }
    function avisoNuevos() {
      const b = el("button", { class: "aviso-nuevos", type: "button", html: icono("actualizar", 16) + "Hay datos nuevos. Toca para verlos", onclick: aplicar });
      document.body.append(b);
      requestAnimationFrame(() => b.classList.add("ver"));
    }
    try { const y = Number(sessionStorage.getItem("m224-scroll")); if (y) { sessionStorage.removeItem("m224-scroll"); setTimeout(() => scrollTo(0, y), 300); } } catch {}
    setInterval(() => { if (!document.hidden) recargarDatos(false); }, 5 * 60 * 1000);
    App.recargarDatos = recargarDatos;

    // =====================================================
    // PARTÍCULAS DE BLOQUES EN EL INICIO
    // =====================================================
    let parti = null;
    function particulas() {
      const inicio = document.getElementById("inicio");
      if (!inicio || parti || reducido) return;
      const c = el("canvas", { class: "particulas", "aria-hidden": "true" });
      inicio.prepend(c);
      const g = c.getContext("2d");
      const COL = esNavidad() ? ["#ffffff", "#e8f1ff", "#d33b2c", "#3f9d4a"] : ["#5fd068", "#7cb342", "#b98a5a", "#7d7d7d", "#5fd0e8", "#f2c94c"];
      let W = 0, H = 0, dpr = Math.min(2, devicePixelRatio || 1), bloques = [], raf = 0, visible = true;
      const medir = () => { const r = inicio.getBoundingClientRect(); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; };
      medir();
      const cuantos = Math.round(Math.min(26, Math.max(10, W / 50)));
      for (let k = 0; k < cuantos; k++) bloques.push({ x: Math.random() * W, y: Math.random() * H, t: 6 + Math.random() * 12, v: .15 + Math.random() * .35, r: Math.random() * 6.28, vr: (Math.random() - .5) * .01, c: COL[k % COL.length], a: .12 + Math.random() * .22 });
      function paso() {
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        bloques.forEach(b => {
          b.y -= b.v; b.r += b.vr; if (b.y < -20) { b.y = H + 20; b.x = Math.random() * W; }
          g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.globalAlpha = b.a; g.fillStyle = b.c; g.fillRect(-b.t / 2, -b.t / 2, b.t, b.t);
          g.fillStyle = "#ffffff55"; g.fillRect(-b.t / 2, -b.t / 2, b.t, b.t * .22); g.restore();
        });
        if (visible) raf = requestAnimationFrame(paso);
      }
      const obs = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(paso); } }, { threshold: 0 });
      obs.observe(inicio);
      addEventListener("resize", medir);
      parti = { c, parar: () => { cancelAnimationFrame(raf); obs.disconnect(); removeEventListener("resize", medir); c.remove(); parti = null; } };
      raf = requestAnimationFrame(paso);
    }
    function pararParticulas() { parti && parti.parar(); }
    if (AJ.particulas()) particulas();

    // =====================================================
    // TEMPORADAS
    // =====================================================
    const inicioEl = document.getElementById("inicio");
    function banner(clase, html, boton) {
      if (!inicioEl) return null;
      const b = el("div", { class: "banner-temporada " + clase }, el("div", { class: "bt-texto", html }), boton || null);
      const destino = inicioEl.querySelector(".envoltura > div") || inicioEl;
      destino.prepend(b);
      return b;
    }
    // Navidad: nieve sobre la página
    if (esNavidad() && !reducido) {
      const nieve = el("div", { class: "nieve-pagina", "aria-hidden": "true" }, Array.from({ length: 36 }, () => el("i", { style: `--x:${Math.random() * 100}%;--t:${8 + Math.random() * 10}s;--d:${-Math.random() * 18}s;--s:${2 + Math.random() * 4}px` })));
      document.body.append(nieve);
    }
    if (esNavidad() && hoy.getMonth() === 11) {
      const wr = window.M224 && window.M224.wrapped;
      banner("navidad", `<b>Feliz Navidad, 224.</b> El Wrapped de diciembre viene con nieve y música navideña.`,
        wr ? el("button", { class: "btn juego-btn", type: "button", html: icono("regalo", 16) + "Wrapped de la 224", onclick: () => wr.abrir224(`${hoy.getFullYear()}-12`) }) : null);
    }
    // Fin de año: cuenta regresiva al año nuevo
    if (esFinDeAno()) {
      const meta = new Date(hoy.getFullYear() + 1, 0, 1, 0, 0, 0);
      const cuenta = el("span", { class: "bt-cuenta" });
      const b = banner("ano-nuevo", `<b>Cuenta regresiva para el ${hoy.getFullYear() + 1}</b>`, cuenta);
      const tic = () => {
        const s = Math.max(0, Math.round((meta - new Date()) / 1000));
        cuenta.textContent = `${Math.floor(s / 86400)} d ${String(Math.floor(s % 86400 / 3600)).padStart(2, "0")}:${String(Math.floor(s % 3600 / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
        if (s <= 0) { clearInterval(rel); fuegos(8000); if (b) b.querySelector(".bt-texto").innerHTML = `<b>¡Feliz ${hoy.getFullYear() + 1}, 224!</b>`; }
      };
      const rel = setInterval(tic, 1000); tic();
    }
    // Año nuevo: fuegos artificiales al abrir la página
    if (esAnoNuevo()) {
      const wr = window.M224 && window.M224.wrapped;
      const anoPasado = hoy.getFullYear() - 1;
      banner("ano-nuevo", `<b>¡Feliz ${hoy.getFullYear()}, 224!</b> Ya está el Wrapped del año ${anoPasado}.`,
        wr && wr.abrirAno ? el("button", { class: "btn juego-btn", type: "button", html: icono("regalo", 16) + "Wrapped del año", onclick: () => wr.abrirAno(String(anoPasado)) }) : null);
      if (!reducido) setTimeout(() => fuegos(6000), 800);
    }
    // Aniversario del server
    if (aniversario && AJ.temporada()) {
      const wr = window.M224 && window.M224.wrapped;
      const txt = aniversario.dias < 0 ? `En ${-aniversario.dias} ${aniversario.dias === -1 ? "día" : "días"} la 224 cumple ${aniversario.n} ${aniversario.n === 1 ? "año" : "años"}.`
        : aniversario.dias === 0 ? `<b>¡Hoy la 224 cumple ${aniversario.n} ${aniversario.n === 1 ? "año" : "años"}!</b> Gracias por jugar.`
        : `La 224 cumplió ${aniversario.n} ${aniversario.n === 1 ? "año" : "años"}. Gracias por jugar.`;
      banner("aniversario", `<b>Aniversario</b> ${txt}`,
        wr && wr.abrirAno ? el("button", { class: "btn juego-btn", type: "button", html: icono("regalo", 16) + "Wrapped del año", onclick: () => wr.abrirAno() }) : null);
      if (aniversario.dias === 0 && !reducido) setTimeout(() => fuegos(6000), 900);
    }

    // Fuegos artificiales en un canvas encima de todo (sin bloquear clics)
    function fuegos(dura = 6000) {
      const c = el("canvas", { class: "fuegos", "aria-hidden": "true" });
      document.body.append(c);
      const g = c.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
      const medir = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
      medir();
      const COL = ["#f5c451", "#5fd068", "#ff6bb5", "#5fd0e8", "#ffffff", "#ff9a3c"];
      let chispas = [], t0 = performance.now(), ultimo = 0;
      function explotar() {
        const x = innerWidth * (.15 + Math.random() * .7), y = innerHeight * (.12 + Math.random() * .4), col = COL[Math.floor(Math.random() * COL.length)];
        for (let k = 0; k < 60; k++) { const a = Math.random() * 6.28, v = 1.5 + Math.random() * 4; chispas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1, col }); }
      }
      (function paso(t) {
        if (t - ultimo > 420 && t - t0 < dura - 1200) { ultimo = t; explotar(); }
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
        chispas.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .05; p.vx *= .985; p.vida -= .012; g.globalAlpha = Math.max(0, p.vida); g.fillStyle = p.col; g.fillRect(p.x, p.y, 3, 3); });
        chispas = chispas.filter(p => p.vida > 0);
        if (t - t0 < dura || chispas.length) requestAnimationFrame(paso); else c.remove();
      })(t0);
    }
    App.fuegos = fuegos;

    // =====================================================
    // BOTÓN DE SUBIR CON COHETE
    // =====================================================
    const subir = document.querySelector(".subir");
    if (subir) {
      subir.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10z"/><circle cx="12" cy="9" r="1.8"/><path d="M9 16l-3 3v-4M15 16l3 3v-4"/></svg><span class="cohete-fuego" aria-hidden="true"></span>`;
      subir.onclick = null;
      subir.addEventListener("click", e => {
        e.stopImmediatePropagation();
        if (reducido) { scrollTo({ top: 0 }); return; }
        subir.classList.add("despega");
        scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => subir.classList.remove("despega"), 1100);
      }, true);
    }

    // =====================================================
    // TRANSICIONES ENTRE APARTADOS
    // =====================================================
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const id = a.getAttribute("href").slice(1);
      const sec = id && document.getElementById(id);
      if (!sec || !sec.matches("section, #inicio")) return;
      e.preventDefault();
      history.pushState(null, "", "#" + id);
      sec.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
      if (!reducido) { sec.classList.remove("llegando"); void sec.offsetWidth; sec.classList.add("llegando"); setTimeout(() => sec.classList.remove("llegando"), 900); }
    });

    // =====================================================
    // CAPTURAS: contador total
    // =====================================================
    const capCaja = document.getElementById("capturas-caja");
    const totalCap = (App.M.capturas || []).filter(c => c && c.archivo).length;
    if (capCaja && totalCap) {
      const autores = new Set((App.M.capturas || []).map(c => c.jugador || c.autor).filter(Boolean)).size;
      capCaja.before(el("div", { class: "capturas-total" },
        el("div", {}, el("b", { "data-contar": totalCap, text: "0" }), el("small", { text: totalCap === 1 ? "captura en total" : "capturas en total" })),
        el("div", {}, el("b", { "data-contar": autores, text: "0" }), el("small", { text: autores === 1 ? "fotógrafo" : "fotógrafos" }))));
      App.contarAlVer(capCaja.parentElement);
    }
  });
})();
