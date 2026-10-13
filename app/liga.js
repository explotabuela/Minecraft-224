/* =========================================================
   MINECRAFT 224 · liga, rankings, estadísticas, meses y modo TV
   ========================================================= */
(function () {
  "use strict";

  App_esperar(App => {
    const { el, esc, num, dec, icono, imgCara, imgSkin, nombreMes, mesCorto, fecha, D } = App;
    const W = (D.wrapped || { Meses: {} });
    const LIGA = D.liga || null;
    const jugadores = App.jugadores;

    // ---------- Categorías ----------
    const CATS = [
      { id: "horas", nombre: "Horas", icono: "reloj", fmt: v => dec(v) + " h", unidad: "horas jugadas" },
      { id: "diamantes", nombre: "Diamantes", icono: "gema", fmt: num, unidad: "diamantes" },
      { id: "minado", nombre: "Minado", icono: "pico", fmt: num, unidad: "bloques minados" },
      { id: "mobs", nombre: "Mobs", icono: "espada", fmt: num, unidad: "mobs matados" },
      { id: "metros", nombre: "Caminado", icono: "brujula", fmt: v => dec(v / 1000) + " km", unidad: "km caminados" },
      { id: "muertes", nombre: "Muertes", icono: "calavera", fmt: num, unidad: "muertes por tonto" },
      { id: "racha", nombre: "Racha", icono: "llama", fmt: v => num(v) + " días", unidad: "días seguidos", soloSiempre: true },
      { id: "nivel", nombre: "Nivel", icono: "estrella", fmt: v => "Nv " + num(v), unidad: "nivel", soloSiempre: true },
      { id: "record", nombre: "Sin morir", icono: "escudo", fmt: App.tiempo, unidad: "récord sin morir", soloSiempre: true },
    ];
    const PERIODOS = [["semana", "Esta semana"], ["mes", "Este mes"], ["siempre", "Siempre"]];

    // Valores de cada quien según categoría y periodo
    function valores(cat, periodo) {
      const c = CATS.find(x => x.id === cat);
      if (c.soloSiempre) periodo = "siempre";
      let filas = [];
      if (periodo === "siempre") {
        filas = jugadores.map(j => ({ nombre: j.nombre, n: cat === "racha" ? j.mejorRacha : cat === "nivel" ? (j.nivel || 1) + (j.xp || 0) / 1e7 : j[cat] || 0 }));
      } else {
        const fuente = periodo === "semana" ? (D.semana || {}) : ((W.Meses[App.mesActual] || {}).Stats || {});
        filas = Object.entries(fuente).map(([n, s]) => ({ nombre: n, n: cat === "horas" ? (s.minutos || 0) / 60 : s[cat] || 0 }));
      }
      return filas.filter(f => f.n > 0).sort((a, b) => b.n - a.n).map(f => ({ ...f, valor: c.fmt(cat === "nivel" ? Math.floor(f.n) : f.n) }));
    }
    App.valoresRanking = valores;
    App.CATS = CATS;

    // =====================================================
    // LIGA DEL MES
    // =====================================================
    (function liga() {
      const caja = document.getElementById("liga-caja");
      if (!LIGA || !LIGA.tabla || !LIGA.tabla.length) {
        caja.append(el("p", { class: "vacio", text: "La liga arranca cuando empiece a jugar la banda. Aquí va a salir la tabla del mes." }));
        return;
      }
      document.getElementById("liga-titulo").textContent = "Liga de " + nombreMes(LIGA.mes);
      const tabla = LIGA.tabla, max = Math.max(1, tabla[0].puntos);

      // Arriba: cierre, pronóstico y botones
      const [a, m] = LIGA.mes.split("-").map(Number);
      const fin = new Date(a, m, 1), inicio = new Date(a, m - 1, 1);
      const cierre = el("div", { class: "liga-cierre" });
      function pintarCierre() {
        const falta = fin - new Date();
        const p = Math.min(1, Math.max(0, (new Date() - inicio) / (fin - inicio)));
        const d = Math.floor(falta / 864e5), h = Math.floor(falta / 36e5) % 24;
        cierre.innerHTML = falta > 0
          ? `<span class="etq-mini">CIERRA EN</span><b>${d} d ${h} h</b><span class="liga-progreso"><i style="width:${(p * 100).toFixed(1)}%"></i></span>`
          : `<span class="etq-mini">LIGA CERRADA</span><b>Esperando al bot…</b>`;
      }
      pintarCierre(); setInterval(pintarCierre, 60000);

      const pron = tabla.slice().sort((x, y) => y.proyeccion - x.proyeccion)[0];
      const pronostico = el("div", { class: "liga-pronostico" },
        imgCara(pron.nombre, "", 64),
        el("div", {}, el("span", { class: "etq-mini", text: "PRONÓSTICO" }),
          el("p", { html: `Si siguen así, gana <b>${esc(pron.nombre)}</b> con unos <b>${num(pron.proyeccion)}</b> puntos.` })));

      const acciones = el("div", { class: "acciones-fila" },
        el("button", { class: "boton-icono lleno", type: "button", html: icono("play") + "Ver la carrera del mes", onclick: () => carrera(LIGA.mes) }),
        el("button", { class: "boton-icono", type: "button", html: icono("descargar") + "Descargar tabla", onclick: () => descargarLiga(LIGA.mes, tabla) }));
      caja.append(el("div", { class: "liga-top" }, cierre, pronostico), acciones);

      // La tabla
      const ol = el("ol", { class: "liga-tabla" });
      const etiquetas = { horas: "Horas", minado: "Bloques", diamantes: "Diamantes", mobs: "Mobs", metros: "Caminar", dias: "Días que entró", muertes: "Muertes" };
      tabla.forEach((f, i) => {
        const detalle = el("div", { class: "liga-desglose", hidden: true },
          Object.entries(f.desglose || {}).filter(([, v]) => v).map(([k, v]) => el("span", { class: "pts " + (v < 0 ? "menos" : ""), html: `${esc(etiquetas[k] || k)} <b>${v > 0 ? "+" : ""}${num(v)}</b>` })),
          (f.extras || []).map(x => el("span", { class: "pts extra", html: `${esc(x.razon)} <b>+${num(x.puntos)}</b>` })),
          el("button", { class: "boton-icono", type: "button", html: icono("gente") + "Ver perfil", onclick: e => { e.stopPropagation(); App.abrirPerfil && App.abrirPerfil(f.nombre); } }));
        const fila = el("li", { class: "liga-fila" + (i < 3 ? " top" + (i + 1) : ""), tabindex: "0", role: "button", "aria-expanded": "false" },
          el("span", { class: "liga-lugar", text: f.lugar }),
          el("span", { class: "liga-cambio", html: App.indicador(f.cambio) }),
          imgCara(f.nombre, "liga-cara", 64),
          el("span", { class: "liga-nombre" }, el("b", { text: f.nombre }), el("span", { class: "liga-barra" }, el("i", { style: `--p:${(f.puntos / max * 100).toFixed(1)}%` }))),
          el("span", { class: "liga-pts" }, el("b", { "data-contar": f.puntos, text: "0" }), el("small", { text: "pts" })),
          el("span", { class: "liga-mas", html: icono("abajo", 16) }),
          detalle);
        const alternar = () => { const ab = detalle.hidden; detalle.hidden = !ab; fila.setAttribute("aria-expanded", String(ab)); };
        fila.addEventListener("click", alternar);
        fila.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); } });
        ol.append(fila);
      });
      caja.append(ol);
      App.contarAlVer(ol);

      // Cómo se ganan puntos
      const P = LIGA.puntos || {};
      caja.append(el("details", { class: "liga-reglas" }, el("summary", { text: "¿Cómo se ganan puntos?" }),
        el("ul", { html: [
          `<li><b>+${P.porHora || 10}</b> por cada hora jugada</li>`, `<li><b>+1</b> por cada ${P.bloquesPorPunto || 25} bloques minados</li>`,
          `<li><b>+${P.porDiamante || 5}</b> por cada diamante</li>`, `<li><b>+1</b> por cada ${P.mobsPorPunto || 2} mobs</li>`,
          `<li><b>+1</b> por cada ${P.metrosPorPunto || 250} metros caminados</li>`, `<li><b>+${P.porDia || 5}</b> por cada día que entras</li>`,
          `<li><b>Extras:</b> primer diamante, llegar al Nether o al End, ser el primero del server, matar al dragón y ganar medallas</li>`,
          `<li class="menos"><b>−${P.porMuerte || 3}</b> por cada muerte. Por tonto.</li>`].join("") })));

      // Salón de campeones
      const camp = Object.entries(LIGA.campeones || {}).sort((x, y) => y[0].localeCompare(x[0]));
      if (camp.length) {
        caja.append(el("h3", { class: "sub-titulo", text: "Salón de campeones" }),
          el("div", { class: "campeones" }, camp.map(([mes, quien]) => el("a", { class: "campeon-mes", href: "#mes-" + mes },
            el("span", { class: "corona", html: icono("corona", 18) }), imgSkin(quien, { clase: "campeon-skin", tam: 160 }),
            el("b", { text: quien }), el("small", { text: "Campeón de " + nombreMes(mes) })))));
      }
    })();

    function descargarLiga(mes, tabla) {
      Compartir.mostrar(f => Compartir.tabla({ titulo: "Liga de " + nombreMes(mes), sub: "Puntos del mes", filas: tabla.map(t => ({ nombre: t.nombre, n: t.puntos, valor: num(t.puntos) })), formato: f }),
        "liga-" + mes, { formatos: [["historia", "Historia"], ["cuadrado", "Cuadrado"]], titulo: "Tabla de la liga" });
    }

    // =====================================================
    // RANKINGS (pestañas, periodo, podio, lista)
    // =====================================================
    (function rankings() {
      const caja = document.getElementById("ranking-caja");
      let cat = App.leer("rank-cat", "horas"), periodo = App.leer("rank-periodo", "mes");
      if (!CATS.some(c => c.id === cat)) cat = "horas";
      const pestanas = el("div", { class: "pestanas-app", role: "tablist", "aria-label": "Categoría" },
        CATS.map(c => el("button", { role: "tab", type: "button", "data-cat": c.id, html: icono(c.icono, 15) + " " + c.nombre })));
      const chips = el("div", { class: "chips", role: "group", "aria-label": "Periodo" }, PERIODOS.map(([p, t]) => el("button", { class: "chip-btn", type: "button", "data-p": p, text: t })));
      const acciones = el("div", { class: "acciones-fila" },
        el("button", { class: "boton-icono", type: "button", html: icono("descargar") + "Podio", onclick: () => descargar("podio") }),
        el("button", { class: "boton-icono", type: "button", html: icono("descargar") + "Ranking", onclick: () => descargar("tabla") }),
        el("button", { class: "boton-icono", type: "button", html: icono("tv") + "Modo TV", onclick: () => App.tv() }));
      const zona = el("div", { class: "rank-zona" });
      caja.append(pestanas, el("div", { class: "barra-herr" }, chips, acciones), zona);

      function pintar() {
        const c = CATS.find(x => x.id === cat);
        const per = c.soloSiempre ? "siempre" : periodo;
        pestanas.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.cat === cat)));
        chips.querySelectorAll("button").forEach(b => { b.setAttribute("aria-pressed", String(b.dataset.p === per)); b.disabled = c.soloSiempre && b.dataset.p !== "siempre"; });
        const filas = valores(cat, per);
        zona.innerHTML = "";
        if (!filas.length) { zona.append(el("p", { class: "vacio", text: "Nadie tiene nada en este periodo todavía." })); return; }
        // Podio
        const podio = el("div", { class: "podio-app" });
        [1, 0, 2].forEach(i => {
          const f = filas[i];
          if (!f) { podio.append(el("div", { class: "escalon vacio-e" })); return; }
          const j = App.jugador(f.nombre);
          podio.append(el("button", { class: "escalon e" + (i + 1), type: "button", onclick: () => App.abrirPerfil && App.abrirPerfil(f.nombre) },
            imgSkin(f.nombre, { pose: i === 0 ? "cheering" : App.POSE_CLASE[j?.clase] || null, clase: "escalon-skin", tam: 200 }),
            el("b", { class: "escalon-nombre", text: f.nombre }), el("span", { class: "escalon-valor", text: f.valor }),
            el("span", { class: "escalon-bloque" }, el("span", { text: i + 1 }))));
        });
        // Lista del 4 al 10
        const max = filas[0].n;
        const ol = el("ol", { class: "rank-lista", start: 4 });
        filas.slice(3, 10).forEach((f, k) => ol.append(el("li", { onclick: () => App.abrirPerfil && App.abrirPerfil(f.nombre) },
          el("span", { class: "rank-pos", text: k + 4 }), imgCara(f.nombre, "rank-cara", 64),
          el("span", { class: "rank-nombre" }, el("b", { text: f.nombre }), el("span", { class: "rank-barra" }, el("i", { style: `--p:${(f.n / max * 100).toFixed(1)}%;--d:${k * 60}ms` }))),
          el("span", { class: "rank-valor", text: f.valor }))));
        zona.append(el("p", { class: "rank-sub", text: `${c.unidad[0].toUpperCase() + c.unidad.slice(1)} · ${PERIODOS.find(p => p[0] === per)[1].toLowerCase()}` }), podio, ol);
        requestAnimationFrame(() => zona.classList.add("animar"));
      }
      function cambiar(fn) { zona.classList.remove("animar"); App.transicion(() => { fn(); pintar(); }); App.guardar("rank-cat", cat); App.guardar("rank-periodo", periodo); }
      pestanas.addEventListener("click", e => { const b = e.target.closest("button"); if (b) cambiar(() => { cat = b.dataset.cat; }); });
      chips.addEventListener("click", e => { const b = e.target.closest("button"); if (b && !b.disabled) cambiar(() => { periodo = b.dataset.p; }); });
      // Animar cuando se ve por primera vez
      new IntersectionObserver((es, o) => es.forEach(x => { if (x.isIntersecting) { pintar(); o.disconnect(); } }), { threshold: .2 }).observe(caja);

      function descargar(tipo) {
        const c = CATS.find(x => x.id === cat), per = c.soloSiempre ? "siempre" : periodo;
        const filas = valores(cat, per), titulo = "Top · " + c.nombre, sub = PERIODOS.find(p => p[0] === per)[1];
        if (tipo === "podio") Compartir.mostrar(f => Compartir.podio({ titulo, sub, filas, formato: f }), `podio-${cat}-${per}`, { formatos: [["cuadrado", "Cuadrado"], ["historia", "Historia"]], titulo: "Podio" });
        else Compartir.mostrar(f => Compartir.tabla({ titulo, sub, filas, formato: f }), `ranking-${cat}-${per}`, { formatos: [["historia", "Historia"], ["cuadrado", "Cuadrado"]], titulo: "Ranking completo" });
      }
      App.irRanking = c => { cambiar(() => { cat = c; }); document.getElementById("ranking").scrollIntoView({ behavior: "smooth" }); };
    })();

    // =====================================================
    // CARRERA DE BARRAS (modo cine)
    // =====================================================
    function carrera(mes) {
      const datos = (LIGA && LIGA.carrera && LIGA.carrera[mes]) || {};
      const dias = Object.keys(datos).map(Number).filter(d => d < 99).sort((a, b) => a - b);
      if (!dias.length) { App.M.avisar("Todavía no hay datos de este mes"); return; }
      const nombres = [...new Set(dias.flatMap(d => Object.keys(datos[d])))];
      const ALTO = 54, MAX_FILAS = Math.min(10, nombres.length);
      const pista = el("div", { class: "carrera-pista", style: `height:${MAX_FILAS * ALTO}px` });
      const filas = new Map(nombres.map(n => {
        const f = el("div", { class: "carrera-fila" }, imgCara(n, "carrera-cara", 64), el("span", { class: "carrera-barra" }, el("i"), el("b", { class: "carrera-nombre", text: n })), el("span", { class: "carrera-pts", text: "0" }));
        pista.append(f); return [n, f];
      }));
      const etqDia = el("div", { class: "carrera-dia" });
      const play = el("button", { class: "boton-icono lleno", type: "button" });
      const otra = el("button", { class: "boton-icono", type: "button", html: icono("actualizar") + "Otra vez" });
      const cont = el("div", { class: "carrera" },
        el("div", { class: "carrera-cabeza" }, el("span", { class: "etq-mini", text: "LA CARRERA DE LA LIGA" }), el("h2", { text: nombreMes(mes) }), etqDia),
        pista, el("div", { class: "acciones-fila" }, play, otra));
      let t = 0, corriendo = true, raf = 0, ultimo = 0;
      const DUR = 700; // ms por día
      const Mus = window.M224?.wrapped?.Musica;
      const c = App.cine(cont, { alCerrar: () => { cancelAnimationFrame(raf); Mus && Mus.parar(); } });
      if (Mus) { Mus.iniciar(); Mus.cambiar(5); }
      function valor(n, tt) {
        const i = Math.floor(tt), f = tt - i;
        const a = datos[dias[Math.min(i, dias.length - 1)]][n] || 0, b = datos[dias[Math.min(i + 1, dias.length - 1)]][n] || 0;
        return a + (b - a) * f;
      }
      function cuadro() {
        const vals = nombres.map(n => [n, valor(n, t)]).sort((x, y) => y[1] - x[1]);
        const max = Math.max(1, vals[0][1]);
        vals.forEach(([n, v], k) => {
          const f = filas.get(n);
          f.style.transform = `translateY(${k * ALTO}px)`;
          f.style.opacity = k < MAX_FILAS ? 1 : 0;
          f.querySelector("i").style.width = (v / max * 100).toFixed(2) + "%";
          f.querySelector(".carrera-pts").textContent = num(Math.round(v));
          f.classList.toggle("lider", k === 0);
        });
        const d = dias[Math.min(Math.floor(t), dias.length - 1)];
        etqDia.textContent = `Día ${d}`;
      }
      function paso(a) {
        if (corriendo) {
          t += (a - (ultimo || a)) / DUR;
          if (t >= dias.length - 1) { t = dias.length - 1; corriendo = false; pintarPlay(); }
        }
        ultimo = a; cuadro(); raf = requestAnimationFrame(paso);
      }
      function pintarPlay() { play.innerHTML = corriendo ? icono("pausa") + "Pausa" : icono("play") + "Seguir"; }
      play.onclick = () => { if (t >= dias.length - 1) t = 0; corriendo = !corriendo; pintarPlay(); };
      otra.onclick = () => { t = 0; corriendo = true; pintarPlay(); };
      pintarPlay(); raf = requestAnimationFrame(paso);
    }
    App.carrera = carrera;

    // =====================================================
    // ESTADÍSTICAS DEL SERVER
    // =====================================================
    const HIST = App.M.historial || {};
    const DIAS = Object.keys(HIST).sort();
    // Lo que hizo cada quien cada día (diferencia contra el día anterior)
    const porDia = DIAS.map((d, i) => {
      const hoy = HIST[d], ayer = i ? HIST[DIAS[i - 1]] : {};
      const r = {};
      for (const [n, s] of Object.entries(hoy)) {
        const a = ayer[n] || {};
        r[n] = {}; for (const k of ["minutos", "muertes", "minado", "metros", "mobs", "diamantes"]) r[n][k] = Math.max(0, (s[k] || 0) - (i ? a[k] || 0 : s[k] || 0));
      }
      return { dia: d, r };
    }).slice(1);
    App.porDia = porDia;

    (function estadisticas() {
      const caja = document.getElementById("estadisticas-caja");
      if (!porDia.length) { caja.append(el("p", { class: "vacio", text: "Las gráficas salen cuando el bot junte datos de unos días." })); return; }
      const ult = porDia.slice(-30);
      const etq = ult.map(x => fecha(x.dia).replace(/ \d{4}$/, ""));
      const sum = (x, k) => Object.values(x.r).reduce((s, v) => s + (v[k] || 0), 0);
      const activos = ult.map(x => Object.values(x.r).filter(v => v.minutos > 0).length);
      const horas = ult.map(x => sum(x, "minutos") / 60);
      // Muertes por semana (8 semanas)
      const semanas = [];
      for (let k = porDia.length; k > 0 && semanas.length < 8; k -= 7) {
        const tramo = porDia.slice(Math.max(0, k - 7), k);
        semanas.unshift({ etq: fecha(tramo[0].dia).replace(/ \d{4}$/, ""), v: tramo.reduce((s, x) => s + sum(x, "muertes"), 0) });
      }
      // Causas de muerte de todo el server
      const causas = {};
      Object.values(W.Meses || {}).forEach(m => Object.values(m.Jugadores || {}).forEach(j => Object.entries(j.Muertes || {}).forEach(([c, v]) => {
        const k = c.replace(/^[^\p{L}\p{N}]+\s*/u, ""); causas[k] = (causas[k] || 0) + v;
      })));
      const top = Object.entries(causas).sort((a, b) => b[1] - a[1]);
      const partes = top.slice(0, 6).map(([nombre, valor]) => ({ nombre, valor }));
      if (top.length > 6) partes.push({ nombre: "Otras", valor: top.slice(6).reduce((s, x) => s + x[1], 0) });

      const tarjeta = (titulo, sub, cuerpo, clase = "") => el("div", { class: "caja-grafica " + clase }, el("h3", { text: titulo }), el("p", { text: sub }), cuerpo);
      const rejilla = el("div", { class: "graficas" },
        tarjeta("Horas jugadas por día", "Entre todos, los últimos 30 días", App.graficaLinea(horas, { etiquetas: etq, formato: v => dec(v) + " h", ancho: 1000, alto: 220 }), "ancha"),
        tarjeta("Jugadores activos por día", "Cuántos entraron cada día", App.graficaBarras(activos, { etiquetas: etq, formato: v => num(Math.round(v)) })),
        tarjeta("Muertes por semana", "Por tonto, todas", App.graficaBarras(semanas.map(s => s.v), { etiquetas: semanas.map(s => s.etq), formato: v => num(Math.round(v)) })),
        partes.length ? tarjeta("¿Qué mata más a la 224?", top[0] ? `El enemigo número 1: ${top[0][0]}` : "", App.graficaDona(partes, { centro: num(top.reduce((s, x) => s + x[1], 0)), sub: "muertes" })) : null);

      // Récords de todos los tiempos
      const recordDia = k => {
        let mejor = null;
        porDia.forEach(x => Object.entries(x.r).forEach(([n, v]) => { if (!mejor || v[k] > mejor.v) mejor = { n, v: v[k], dia: x.dia }; }));
        return mejor && mejor.v > 0 ? mejor : null;
      };
      const rh = recordDia("minutos"), rd = recordDia("diamantes"), rm = recordDia("muertes"), rb = recordDia("minado");
      const masRacha = jugadores.slice().sort((a, b) => (b.mejorRacha || 0) - (a.mejorRacha || 0))[0];
      const masRecord = jugadores.slice().sort((a, b) => (b.record || 0) - (a.record || 0))[0];
      const rec = D.presencia && D.presencia.record;
      const recs = [
        rh && ["reloj", "Más horas en un día", App.tiempo(rh.v), rh.n, fecha(rh.dia)],
        rd && ["gema", "Más diamantes en un día", num(rd.v), rd.n, fecha(rd.dia)],
        rb && ["pico", "Más bloques en un día", num(rb.v), rb.n, fecha(rb.dia)],
        rm && ["calavera", "Más muertes en un día", num(rm.v), rm.n, fecha(rm.dia)],
        masRacha && masRacha.mejorRacha && ["llama", "Racha más larga", num(masRacha.mejorRacha) + " días", masRacha.nombre, ""],
        masRecord && masRecord.record && ["escudo", "Más tiempo sin morir", App.tiempo(masRecord.record), masRecord.nombre, ""],
        rec && rec.conectados && ["gente", "Más conectados a la vez", num(rec.conectados), "", fecha(rec.fecha)],
      ].filter(Boolean);
      caja.append(rejilla, el("h3", { class: "sub-titulo", text: "Récords de la 224" }),
        el("div", { class: "records" }, recs.map(([ic, t, v, quien, f]) => el("div", { class: "record-t" },
          el("span", { class: "record-ico", html: icono(ic, 20) }), el("small", { text: t }), el("b", { text: v }),
          el("span", { class: "record-quien" }, quien ? imgCara(quien, "", 32) : null, el("span", { text: [quien, f].filter(Boolean).join(" · ") }))))));
    })();

    // =====================================================
    // ARCHIVO DE MESES
    // =====================================================
    (function meses() {
      const caja = document.getElementById("meses-caja");
      const lista = Object.keys(W.Meses || {}).filter(m => Object.keys(W.Meses[m].Stats || {}).length).sort().reverse();
      if (!lista.length) { caja.append(el("p", { class: "vacio", text: "Cada mes que pase se guarda aquí con su campeón, su podio y sus fotos." })); return; }
      const chips = el("div", { class: "pestanas-app", role: "tablist", "aria-label": "Mes" }, lista.map(m => el("button", { role: "tab", type: "button", "data-m": m, text: nombreMes(m) + (m === App.mesActual ? " · en curso" : "") })));
      const zona = el("div", { class: "mes-zona" });
      caja.append(chips, zona);
      let actual = lista[0];

      function pintar() {
        chips.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.m === actual)));
        zona.innerHTML = "";
        const M = W.Meses[actual], enCurso = actual === App.mesActual;
        const tabla = (LIGA && (enCurso ? LIGA.tabla : (LIGA.finales || {})[actual])) || [];
        const campeon = LIGA && (LIGA.campeones || {})[actual];
        const lider = campeon || (tabla[0] && tabla[0].nombre);
        const st = M.Stats || {};
        const suma = k => Object.values(st).reduce((s, v) => s + (v[k] || 0), 0);

        const cab = el("div", { class: "mes-cabeza" },
          lider ? el("div", { class: "mes-campeon" }, el("span", { class: "corona", html: icono("corona", 22) }), imgSkin(lider, { pose: "cheering", clase: "mes-campeon-skin", tam: 240 }),
            el("div", {}, el("span", { class: "etq-mini", text: campeon ? "CAMPEÓN" : "VA GANANDO" }), el("b", { text: lider }),
              tabla[0] ? el("small", { text: num(tabla[0].puntos) + " puntos" }) : null)) : null,
          el("div", { class: "mes-numeros" }, [[Object.keys(st).length, "jugadores"], [suma("minutos") / 60, "horas", 1], [suma("diamantes"), "diamantes"], [suma("minado"), "bloques"], [suma("muertes"), "muertes"]]
            .map(([v, t, d]) => el("div", {}, el("b", { "data-contar": v, "data-dec": d || 0, text: "0" }), el("span", { text: t })))));
        // Podio del mes
        const podio = el("div", { class: "mes-podio" }, tabla.slice(0, 3).map((f, i) => el("button", { class: "mes-puesto p" + (i + 1), type: "button", onclick: () => App.abrirPerfil && App.abrirPerfil(f.nombre) },
          el("span", { class: "mes-lugar", text: i + 1 }), imgCara(f.nombre, "", 64), el("b", { text: f.nombre }), el("small", { text: num(f.puntos) + " pts" }))));
        // Lo mejor del mes por categoría
        const mejores = [["minutos", "Más viciado", v => App.tiempo(v)], ["diamantes", "Más diamantes", num], ["minado", "Más minero", num], ["mobs", "Más asesino", num], ["muertes", "Más tonto", num]]
          .map(([k, t, f]) => { const e = Object.entries(st).sort((a, b) => (b[1][k] || 0) - (a[1][k] || 0))[0]; return e && e[1][k] ? [t, e[0], f(e[1][k])] : null; }).filter(Boolean);
        const lo = el("div", { class: "mes-mejores" }, mejores.map(([t, n, v]) => el("div", {}, el("small", { text: t }), el("span", {}, imgCara(n, "", 32), el("b", { text: n })), el("em", { text: v }))));
        // Fotos del mes
        const fotos = (App.M.capturas || []).filter(c => (c.fecha || "").startsWith(actual)).slice(0, 8);
        const galeria = fotos.length ? el("div", { class: "mes-fotos" }, fotos.map(f => el("button", { type: "button", onclick: () => App.verCaptura && App.verCaptura(f) }, el("img", { src: f.archivo, alt: f.texto || "Captura", loading: "lazy" })))) : null;
        const acciones = el("div", { class: "acciones-fila" },
          el("button", { class: "boton-icono lleno", type: "button", html: icono("regalo") + "Wrapped de la 224", onclick: () => window.M224?.wrapped?.abrir224 ? window.M224.wrapped.abrir224(actual) : App.M.avisar("El Wrapped sale cuando haya datos") }),
          LIGA && LIGA.carrera && LIGA.carrera[actual] ? el("button", { class: "boton-icono", type: "button", html: icono("play") + "Carrera del mes", onclick: () => carrera(actual) }) : null,
          tabla.length ? el("button", { class: "boton-icono", type: "button", html: icono("descargar") + "Podio", onclick: () => Compartir.mostrar(f => Compartir.podio({ titulo: "Liga de " + nombreMes(actual), sub: campeon ? "Resultado final" : "Así va", filas: tabla.map(t => ({ nombre: t.nombre, n: t.puntos, valor: num(t.puntos) + " pts" })), formato: f }), "podio-" + actual, { formatos: [["cuadrado", "Cuadrado"], ["historia", "Historia"]], titulo: "Podio del mes" }) }) : null);
        zona.append(...[cab, tabla.length ? el("h3", { class: "sub-titulo", text: "Podio de la liga" }) : null, tabla.length ? podio : null,
          mejores.length ? el("h3", { class: "sub-titulo", text: "Lo mejor del mes" }) : null, lo,
          galeria ? el("h3", { class: "sub-titulo", text: "Fotos del mes" }) : null, galeria, acciones].filter(Boolean));
        App.contarAlVer(zona);
      }
      chips.addEventListener("click", e => { const b = e.target.closest("button"); if (b) App.transicion(() => { actual = b.dataset.m; pintar(); }); });
      pintar();
      App.abrirMes = m => { if (lista.includes(m)) { actual = m; pintar(); } document.getElementById("meses").scrollIntoView({ behavior: "smooth" }); };
      App.ruta("#mes-", m => App.abrirMes(m));
    })();
    App.ruta("#liga", () => document.getElementById("liga").scrollIntoView());
    App.ruta("#ranking", () => document.getElementById("ranking").scrollIntoView());

    // =====================================================
    // MODO TV (para dejarlo en la tele)
    // =====================================================
    App.tv = function () {
      const pantalla = el("div", { class: "tv-pantalla" });
      const reloj = el("b", { class: "tv-reloj" });
      const puntos = el("div", { class: "tv-puntos" });
      const cont = el("div", { class: "tv" },
        el("div", { class: "tv-cabeza" }, el("img", { src: document.querySelector(".marca img")?.src, alt: "" }), el("b", { text: "MINECRAFT 224" }), reloj), pantalla, puntos);
      const vistas = [vistaLiga, vistaPodio, vistaVivo, vistaNumeros, vistaFoto].filter(v => v.puede());
      let k = 0, intervalo, relojI;
      const { cerrar } = App.cine(cont, { pantallaCompleta: true, alCerrar: () => { clearInterval(intervalo); clearInterval(relojI); } });
      puntos.append(...vistas.map(() => el("i")));
      function mostrar() {
        const v = vistas[k % vistas.length];
        pantalla.classList.remove("entra"); void pantalla.offsetWidth;
        pantalla.innerHTML = ""; pantalla.append(v()); pantalla.classList.add("entra");
        puntos.querySelectorAll("i").forEach((p, i) => p.classList.toggle("activo", i === k % vistas.length));
        App.contarAlVer(pantalla);
        k++;
      }
      const tic = () => { reloj.textContent = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }); };
      tic(); relojI = setInterval(tic, 10000);
      mostrar(); intervalo = setInterval(mostrar, 12000);
      cont.addEventListener("click", e => { if (!e.target.closest(".capa-x")) { clearInterval(intervalo); mostrar(); intervalo = setInterval(mostrar, 12000); } });
      return cerrar;
    };
    function vistaLiga() {
      const t = (LIGA && LIGA.tabla || []).slice(0, 8), max = Math.max(1, t[0]?.puntos || 1);
      return el("div", { class: "tv-vista" }, el("span", { class: "etq-mini", text: "LIGA DE " + nombreMes(LIGA.mes).toUpperCase() }),
        el("ol", { class: "tv-liga" }, t.map(f => el("li", {}, el("span", { class: "tv-lugar", text: f.lugar }), imgCara(f.nombre, "", 64), el("b", { text: f.nombre }),
          el("span", { class: "tv-barra" }, el("i", { style: `width:${f.puntos / max * 100}%` })), el("em", { "data-contar": f.puntos, text: "0" })))));
    }
    vistaLiga.puede = () => LIGA && LIGA.tabla && LIGA.tabla.length;
    function vistaPodio() {
      const cats = ["horas", "diamantes", "minado", "mobs"], cat = cats[Math.floor(Date.now() / 12000) % cats.length];
      const c = CATS.find(x => x.id === cat), f = valores(cat, "mes").slice(0, 3);
      return el("div", { class: "tv-vista" }, el("span", { class: "etq-mini", text: "TOP DEL MES · " + c.nombre.toUpperCase() }),
        el("div", { class: "tv-podio" }, [1, 0, 2].map(i => f[i] ? el("div", { class: "tv-escalon e" + (i + 1) }, imgSkin(f[i].nombre, { pose: i === 0 ? "cheering" : null, clase: "", tam: 300 }), el("b", { text: f[i].nombre }), el("span", { text: f[i].valor }), el("i", { text: i + 1 })) : el("div"))));
    }
    vistaPodio.puede = () => valores("horas", "mes").length > 0;
    function vistaVivo() {
      const en = (D.presencia && D.presencia.enLinea) || [];
      return el("div", { class: "tv-vista" }, el("span", { class: "etq-mini", text: en.length ? "JUGANDO AHORITA" : "LA 224" }),
        en.length ? el("div", { class: "tv-vivo" }, en.map(q => el("div", {}, imgSkin(q.nombre, { clase: "", tam: 260 }), el("b", { text: q.nombre }), el("span", { text: "desde hace " + App.duracion(q.desde) }))))
          : el("p", { class: "tv-grande", text: "Nadie jugando ahorita" }));
    }
    vistaVivo.puede = () => true;
    function vistaNumeros() {
      const st = (W.Meses[App.mesActual] || {}).Stats || {};
      const s = k => Object.values(st).reduce((a, v) => a + (v[k] || 0), 0);
      return el("div", { class: "tv-vista" }, el("span", { class: "etq-mini", text: "ESTE MES EN LA 224" }),
        el("div", { class: "tv-numeros" }, [[s("minutos") / 60, "horas jugadas", 1], [s("diamantes"), "diamantes"], [s("minado"), "bloques minados"], [s("muertes"), "muertes por tonto"]]
          .map(([v, t, d]) => el("div", {}, el("b", { "data-contar": v, "data-dec": d || 0, text: "0" }), el("span", { text: t })))));
    }
    vistaNumeros.puede = () => Object.keys((W.Meses[App.mesActual] || {}).Stats || {}).length > 0;
    function vistaFoto() {
      const fotos = App.M.capturas || [], f = fotos[Math.floor(Math.random() * fotos.length)];
      return el("div", { class: "tv-vista tv-foto", style: `--img:url("${f.archivo}")` }, el("img", { src: f.archivo, alt: f.texto || "" }), el("p", { text: [f.texto, f.autor].filter(Boolean).join(" · ") }));
    }
    vistaFoto.puede = () => (App.M.capturas || []).length > 0;
  });

  // Espera a que base.js tenga todo listo
  function App_esperar(fn) {
    const ir = () => window.App.listo.then(() => setTimeout(() => fn(window.App), 0));
    if (window.App) ir(); else addEventListener("DOMContentLoaded", ir);
  }
})();
