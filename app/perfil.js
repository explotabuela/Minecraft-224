/* =========================================================
   MINECRAFT 224 · cartas, perfil, skin 3D y VS
   ========================================================= */
(function () {
  "use strict";

  const esperar = fn => { const ir = () => window.App.listo.then(() => setTimeout(() => fn(window.App), 0)); if (window.App) ir(); else addEventListener("DOMContentLoaded", ir); };

  esperar(App => {
    const { el, esc, num, dec, icono, imgCara, imgSkin, nombreMes, fecha, hace, D } = App;
    const W = D.wrapped || { Meses: {} };
    const LIGA = D.liga || {};
    const js = App.jugadores;
    const top3 = (LIGA.tabla || []).slice(0, 3).map(f => f.nombre);
    const ordenLlegada = js.slice().sort((a, b) => (a.primerDia || "9999").localeCompare(b.primerDia || "9999") || a.nombre.localeCompare(b.nombre)).map(j => j.nombre);
    const numeroCarta = n => String(ordenLlegada.indexOf(n) + 1).padStart(3, "0");
    const enLinea = () => new Map(((D.presencia && D.presencia.enLinea) || []).map(x => [x.nombre.toLowerCase(), x.desde]));
    const promedio = k => js.reduce((s, j) => s + (Number(j[k]) || 0), 0) / Math.max(1, js.length);
    const lugarEn = (n, k, menos = false) => 1 + js.filter(j => menos ? (j[k] || 0) < (App.jugador(n)[k] || 0) : (j[k] || 0) > (App.jugador(n)[k] || 0)).length;
    const COLOR_RANGO = { Leyenda: "#f5c451", Veterano: "#c9d1d9", Aventurero: "#5fd068", Novato: "#8a8f98" };
    const medallasDe = j => (j.medallas || []).reduce((s, m) => s + (m.nivel || 0), 0);

    const STATS = [
      ["horas", "Horas jugadas", "reloj", v => dec(v) + " h"], ["diamantes", "Diamantes", "gema", num], ["minado", "Bloques minados", "pico", num],
      ["mobs", "Mobs matados", "espada", num], ["metros", "Caminado", "brujula", v => dec(v / 1000) + " km"], ["muertes", "Muertes", "calavera", num, true],
      ["record", "Récord sin morir", "escudo", App.tiempo], ["mejorRacha", "Mejor racha", "llama", v => num(v) + " días"],
      ["mensajes", "Mensajes", "chat", num], ["dias", "Días jugados", "calendario", num],
    ];

    // =====================================================
    // CARTAS
    // =====================================================
    (function cartas() {
      const caja = document.getElementById("cartas");
      if (!js.length) { caja.append(el("p", { class: "vacio", text: "Cuando entre la banda, aquí van a salir sus cartas." })); return; }
      const tarjetas = [];
      js.forEach(j => {
        const holo = top3.includes(j.nombre);
        const rango = j.rango || "Novato";
        const frente = el("div", { class: "carta-cara carta-frente" },
          el("div", { class: "carta-arriba" }, el("span", { class: "carta-num", text: "#" + numeroCarta(j.nombre) }), el("span", { class: "carta-nivel", html: `<small>NV</small>${num(j.nivel || 1)}` })),
          el("div", { class: "carta-escena" }, imgSkin(j.nombre, { pose: App.POSE_CLASE[j.clase] || null, clase: "carta-skin", tam: 220 })),
          el("div", { class: "carta-info" },
            el("b", { class: "carta-nombre", text: j.nombre }),
            el("span", { class: "carta-sub", text: `${rango} · ${j.clase || "Novato"}` }),
            el("div", { class: "carta-mini" }, [["reloj", dec(j.horas) + "h"], ["gema", num(j.diamantes)], ["calavera", num(j.muertes)]]
              .map(([i, v]) => el("span", { html: icono(i, 14) + v })))),
          holo ? el("span", { class: "carta-top", text: "TOP " + (top3.indexOf(j.nombre) + 1) }) : null);
        const atras = el("div", { class: "carta-cara carta-atras" },
          el("b", { class: "carta-nombre", text: j.nombre }),
          el("dl", {}, [["horas", "Horas", "reloj", v => dec(v) + " h"], ["diamantes", "Diamantes", "gema", num], ["minado", "Bloques", "pico", num],
            ["mobs", "Mobs", "espada", num], ["muertes", "Muertes", "calavera", num], ["mejorRacha", "Mejor racha", "llama", v => num(v) + (v === 1 ? " día" : " días")]]
            .map(([k, t, ic, f]) => el("div", {}, el("dt", { html: icono(ic, 14) + t }), el("dd", { text: f(j[k] || 0) })))),
          el("div", { class: "carta-botones" },
            el("button", { class: "btn", type: "button", text: "Ver perfil", onclick: e => { e.stopPropagation(); abrirPerfil(j.nombre); } }),
            el("button", { class: "btn secundario", type: "button", text: "VS", onclick: e => { e.stopPropagation(); prepararVs(j.nombre); } })));
        const carta = el("article", { class: `carta r-${rango.toLowerCase()}${holo ? " holo" : ""}`, tabindex: "0", role: "button", "aria-label": `Carta de ${j.nombre}. Pícale para voltearla`, style: `--rango:${COLOR_RANGO[rango] || "#8a8f98"}` },
          el("div", { class: "carta-int" }, frente, atras));
        const voltear = () => { carta.classList.toggle("volteada"); carta.classList.add("rebota"); setTimeout(() => carta.classList.remove("rebota"), 350); };
        carta.addEventListener("click", voltear);
        carta.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); voltear(); } });
        // Brillo holográfico e inclinación que sigue al mouse
        carta.addEventListener("pointermove", e => {
          if (e.pointerType !== "mouse") return;
          const r = carta.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          carta.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); carta.style.setProperty("--my", (y * 100).toFixed(1) + "%");
          carta.style.setProperty("--rx", ((.5 - y) * 10).toFixed(2) + "deg"); carta.style.setProperty("--ry", ((x - .5) * 12).toFixed(2) + "deg");
        });
        carta.addEventListener("pointerleave", () => { carta.style.setProperty("--rx", "0deg"); carta.style.setProperty("--ry", "0deg"); });
        caja.append(carta);
        tarjetas.push({ nombre: j.nombre.toLowerCase(), el: carta });
      });
      const vacio = el("p", { class: "vacio", hidden: true }); caja.after(vacio);
      const buscar = document.getElementById("buscar"), conteo = document.getElementById("conteo");
      function filtrar() {
        const q = buscar.value.trim().toLowerCase(); let n = 0;
        tarjetas.forEach(t => { const ok = t.nombre.includes(q); t.el.hidden = !ok; if (ok) n++; });
        conteo.textContent = `${n} de ${tarjetas.length} ${tarjetas.length === 1 ? "jugador" : "jugadores"}`;
        vacio.hidden = n > 0;
        vacio.textContent = q === "herobrine" ? "Herobrine no está en la whitelist… todavía." : `Nadie se llama "${buscar.value}" en la 224.`;
      }
      buscar.addEventListener("input", filtrar); filtrar();
    })();

    // =====================================================
    // SKIN 3D (skinview3d, se carga solo cuando hace falta)
    // =====================================================
    let cargaSV = null;
    function skinview() {
      if (window.skinview3d) return Promise.resolve(window.skinview3d);
      if (!cargaSV) cargaSV = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/bundles/skinview3d.bundle.js";
        s.onload = () => res(window.skinview3d); s.onerror = rej;
        document.head.append(s);
      });
      return cargaSV;
    }
    // Pone la skin en 3D dentro de "caja"; si algo falla, deja la imagen normal
    async function skin3d(caja, nombre, { ancho = 240, alto = 320, animacion = "idle", rotar = true, zoom = .9 } = {}) {
      try {
        const sv = await skinview();
        const urls = App.urlsSkinPng(nombre);
        const canvas = el("canvas", { class: "skin3d", "aria-label": "Skin de " + nombre + " en 3D", role: "img" });
        const v = new sv.SkinViewer({ canvas, width: ancho, height: alto });
        let ok = false;
        for (const u of urls) { try { await Promise.race([v.loadSkin(u), new Promise((_, no) => setTimeout(() => no(new Error("lento")), 7000))]); ok = true; break; } catch {} }
        if (!ok) { v.dispose(); return null; }
        const jj = App.jugador(nombre);
        if (jj && jj.capa) { try { await v.loadCape(jj.capa); } catch {} }
        v.autoRotate = rotar && !matchMedia("(prefers-reduced-motion: reduce)").matches;
        v.autoRotateSpeed = .6;
        v.zoom = zoom;
        v.controls.enableZoom = false;
        v.animation = animacion === "caminar" ? new sv.WalkingAnimation() : animacion === "saludar" ? new sv.WaveAnimation() : new sv.IdleAnimation();
        caja.innerHTML = ""; caja.append(canvas);
        return v;
      } catch { return null; }
    }

    // =====================================================
    // PERFIL
    // =====================================================
    let visor = null;
    function abrirPerfil(nombre) {
      const j = App.jugador(nombre);
      if (!j) { App.M.avisar("Ese jugador no está en la 224"); return; }
      if (location.hash !== "#j-" + encodeURIComponent(j.nombre)) history.replaceState(null, "", "#j-" + encodeURIComponent(j.nombre));
      const rango = j.rango || "Novato", clase = (j.clase || "Novato").toLowerCase();
      const desde = enLinea().get(j.nombre.toLowerCase());
      const ultimaVez = (D.presencia && D.presencia.ultimo && D.presencia.ultimo.nombre === j.nombre) ? D.presencia.ultimo.fecha : null;
      const p = Math.max(0, Math.min(1, ((j.xp || 0) - (j.xpNivel || 0)) / Math.max(1, (j.xpSiguiente || 1) - (j.xpNivel || 0))));

      const escena = el("div", { class: "perfil-skin" }, imgSkin(j.nombre, { pose: App.POSE_CLASE[j.clase] || null, clase: "perfil-skin-img", tam: 300 }));
      const cabeza = el("div", { class: `perfil-banner banner-${clase}` },
        escena,
        el("div", { class: "perfil-datos" },
          el("div", { class: "perfil-chips" },
            el("span", { class: "chip-rango", style: `--rango:${COLOR_RANGO[rango]}`, text: rango }),
            el("span", { class: "chip-clase", text: j.clase || "Novato" }),
            desde ? el("span", { class: "chip-vivo", html: `<span class="punto"></span>Jugando ahorita` }) : ultimaVez ? el("span", { class: "chip-visto", text: "Visto " + hace(ultimaVez) }) : null),
          el("h2", { class: "perfil-nombre", text: j.nombre }),
          cuentasDe(j),
          el("div", { class: "perfil-nivel" },
            el("div", { class: "perfil-nivel-num", html: `<small>NIVEL</small><b>${num(j.nivel || 1)}</b>` }),
            el("div", { class: "perfil-xp" },
              el("span", { class: "perfil-xp-barra" }, el("i", { style: `--p:${(p * 100).toFixed(1)}%` })),
              el("small", { text: `${num((j.xp || 0) - (j.xpNivel || 0))} / ${num((j.xpSiguiente || 0) - (j.xpNivel || 0))} XP para el nivel ${num((j.nivel || 1) + 1)}` }))),
          el("div", { class: "acciones-fila" },
            el("button", { class: "boton-icono", type: "button", html: icono("cine") + "Modo cine", onclick: () => modoCine(j) }),
            el("button", { class: "boton-icono", type: "button", html: icono("compartir") + "Compartir", onclick: () => Compartir.compartirLink(urlPerfil(j.nombre), `${j.nombre} en la 224`) }),
            el("button", { class: "boton-icono", type: "button", html: icono("descargar") + "Imagen", onclick: () => imagenPerfil(j) }),
            el("button", { class: "boton-icono", type: "button", html: icono("rayo") + "VS", onclick: () => { cerrar(); prepararVs(j.nombre); } }),
            el("button", { class: "boton-icono", type: "button", html: icono("tarjeta") + "Presentar", onclick: () => presentacion(j.nombre) }),
            el("button", { class: "boton-icono", type: "button", html: icono("video") + "Video", onclick: () => videoCarta(j) }),
            el("button", { class: "boton-icono", type: "button", html: icono("copiar") + "Copiar link", onclick: () => copiarLink(urlPerfil(j.nombre)) }))));

      const PEST = [["resumen", "Resumen"], ["medallas", "Medallas"], ["historia", "Historia"], ["liga", "Liga"], ["graficas", "Gráficas"], ["wrapped", "Wrapped"]];
      const pestanas = el("div", { class: "pestanas-app perfil-pestanas", role: "tablist" }, PEST.map(([k, t]) => el("button", { role: "tab", type: "button", "data-k": k, text: t })));
      const panel = el("div", { class: "perfil-panel", role: "tabpanel" });
      const cont = el("div", { class: "perfil" }, cabeza, pestanas, panel);
      const { cerrar } = App.capa(cont, { clase: "perfil-capa", ancho: 880, etiqueta: "Perfil de " + j.nombre, alCerrar: () => {
        if (visor) { visor.dispose(); visor = null; }
        if (location.hash.startsWith("#j-")) history.replaceState(null, "", location.pathname + location.search);
      } });
      skin3d(escena, j.nombre, { ancho: 240, alto: 300 }).then(v => { visor = v; });

      const vistas = { resumen, medallas, historia, liga, graficas, wrapped };
      function ir(k) {
        pestanas.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.k === k)));
        App.transicion(() => { panel.innerHTML = ""; panel.append(vistas[k](j)); App.contarAlVer(panel); });
      }
      pestanas.addEventListener("click", e => { const b = e.target.closest("button"); if (b) ir(b.dataset.k); });
      ir("resumen");
    }
    App.abrirPerfil = abrirPerfil;
    App.ruta("#j-", n => abrirPerfil(n));

    const urlPerfil = n => (App.paginaUrl.replace(/#.*$/, "").replace(/\/?$/, "/")) + "jugador/" + encodeURIComponent(n) + ".html";

    // ---------- Pestaña: Resumen (con comparación contra el promedio) ----------
    function resumen(j) {
      const n = js.length;
      return el("div", { class: "perfil-stats" }, STATS.map(([k, t, ic, f, menos]) => {
        const v = Number(j[k] || 0), prom = promedio(k), veces = prom > 0 ? v / prom : 0;
        let comp = "";
        if (n > 1 && prom > 0) {
          if (menos) comp = v < prom ? `Menos que el promedio` : veces >= 1.5 ? `${dec(veces)}× el promedio` : "Como el promedio";
          else comp = veces >= 1.15 ? `${dec(veces)}× el promedio` : veces <= .85 ? `${Math.round(veces * 100)}% del promedio` : "Como el promedio";
        }
        const bueno = menos ? v <= prom : v >= prom;
        return el("div", { class: "pstat" },
          el("span", { class: "pstat-ico", html: icono(ic, 16) }),
          el("small", { text: t }),
          el("b", { text: f(v) }),
          n > 1 ? el("span", { class: "pstat-comp " + (comp === "Como el promedio" ? "neutro" : bueno ? "sube" : "baja"), text: comp }) : null,
          n > 1 ? el("span", { class: "pstat-lugar", text: `#${lugarEn(j.nombre, k, menos)} de ${n}` }) : null,
          n > 1 && prom > 0 ? el("span", { class: "pstat-barra" }, el("i", { style: `--p:${Math.min(100, v / Math.max(v, prom * 2) * 100).toFixed(1)}%` }), el("em", { style: `left:${Math.min(100, prom / Math.max(v, prom * 2) * 100).toFixed(1)}%`, title: "Promedio" })) : null);
      }), j.primerDia ? el("p", { class: "perfil-primer", text: `En la 224 desde el ${fecha(j.primerDia)}${j.racha ? ` · racha actual: ${j.racha} ${j.racha === 1 ? "día" : "días"}` : ""}` }) : null);
    }

    // ---------- Pestaña: Medallas ----------
    const NIV = ["Sin ganar", "Bronce", "Plata", "Oro", "Diamante"];
    function medallas(j) {
      const lista = j.medallas || [];
      if (!lista.length) return el("p", { class: "vacio", text: "Las medallas salen cuando el bot junte datos." });
      const cuantos = id => js.filter(x => (x.medallas || []).some(m => m.id === id && m.nivel > 0)).length;
      const detalle = el("div", { class: "medalla-detalle", hidden: true });
      const rej = el("div", { class: "medallas" }, lista.map(m => {
        const b = el("button", { class: `medalla n${m.especial ? (m.nivel ? "e" : 0) : m.nivel}`, type: "button", "aria-label": `${m.nombre}: ${m.especial ? (m.nivel ? "ganada" : "sin ganar") : NIV[m.nivel]}` },
          el("span", { class: "medalla-ico", html: icono(m.icono, 26) }),
          el("b", { text: m.nombre }),
          el("small", { text: m.especial ? (m.nivel ? "Especial" : "Bloqueada") : NIV[m.nivel] }),
          !m.especial && m.nivel < 4 && m.meta ? el("span", { class: "medalla-prog" }, el("i", { style: `width:${Math.min(100, (m.valor || 0) / m.meta * 100).toFixed(1)}%` })) : null);
        b.addEventListener("click", () => {
          rej.querySelectorAll(".medalla").forEach(x => x.classList.toggle("sel", x === b));
          const tienen = cuantos(m.id), pct = Math.round(tienen / Math.max(1, js.length) * 100);
          const fechaGanada = m.especial ? m.fecha : (m.fechas || {})[String(m.nivel)];
          const siguiente = !m.especial && m.nivel < 4 ? `Siguiente: ${NIV[m.nivel + 1]}. ${m.que.replace("{0}", num(m.meta))} (llevas ${num(m.valor)}, te faltan ${num(Math.max(0, m.meta - m.valor))}).` : "";
          detalle.innerHTML = "";
          const estado = m.nivel
            ? `La ganó ${fechaGanada ? "el " + fecha(fechaGanada) : "antes de que existiera el bot"}.`
            : "Todavía no la tiene.";
          detalle.append(el("b", { text: m.nombre + (m.especial ? "" : " · " + NIV[m.nivel]) }),
            el("p", { text: (m.especial ? m.que + ". " : "") + estado }),
            siguiente ? el("p", { text: siguiente }) : null,
            el("p", { class: "medalla-rareza", text: tienen ? `La ${tienen === 1 ? "tiene 1" : `tienen ${tienen}`} de ${js.length} jugadores (${pct}%)${tienen === 1 ? ". ¡Rarísima!" : "."}` : "Nadie la tiene todavía." }));
          detalle.hidden = false;
        });
        return b;
      }));
      const total = medallasDe(j);
      // Porcentaje: cada categoría vale 4 niveles y cada especial 1
      const posibles = lista.reduce((t, m) => t + (m.especial ? 1 : 4), 0);
      const pct = Math.round(total / Math.max(1, posibles) * 100);
      const ganadas = lista.filter(m => m.nivel > 0);
      const rara = ganadas.map(m => ({ m, n: cuantos(m.id) })).sort((a, b) => a.n - b.n || (b.m.nivel - a.m.nivel))[0];
      const resumenMed = el("div", { class: "med-resumen" },
        el("div", { class: "med-pct" }, el("b", { text: pct + "%" }), el("small", { text: `completado · ${total} de ${posibles} niveles` }),
          el("span", { class: "med-barra" }, el("i", { style: `width:${pct}%` }))),
        rara ? el("div", { class: "med-rara" }, el("span", { class: "medalla-ico mini", html: icono(rara.m.icono, 18) }),
          el("span", {}, el("small", { text: "Su medalla más rara" }), el("b", { text: rara.m.nombre }), el("em", { text: rara.n <= 1 ? "Nadie más la tiene" : `Solo la tienen ${rara.n} de ${js.length}` }))) : null);
      const tontos = (j.masTonto || []).length ? el("div", { class: "trofeos" }, j.masTonto.map(m => el("span", { class: "trofeo tonto", html: icono("calavera", 18) + "El más tonto de " + nombreMes(m) }))) : null;
      return el("div", {}, resumenMed, tontos, el("p", { class: "perfil-nota", text: `Pícale a una medalla para ver cómo se gana.` }), rej, detalle);
    }

    // ---------- Pestaña: Liga (historial y comparar meses) ----------
    function liga(j) {
      const caja = el("div", { class: "perfil-liga" });
      const filas = [];
      Object.entries(LIGA.finales || {}).forEach(([m, t]) => { const f = t.find(x => x.nombre === j.nombre); if (f) filas.push({ mes: m, lugar: f.lugar, puntos: f.puntos, final: true, de: t.length }); });
      const act = (LIGA.tabla || []).find(x => x.nombre === j.nombre);
      if (act) filas.push({ mes: LIGA.mes, lugar: act.lugar, puntos: act.puntos, final: false, de: LIGA.tabla.length, cambio: act.cambio, proyeccion: act.proyeccion });
      filas.sort((a, b) => a.mes.localeCompare(b.mes));
      if (!filas.length) caja.append(el("p", { class: "vacio", text: "Todavía no ha jugado en ninguna liga." }));
      else {
        const campeonDe = Object.entries(LIGA.campeones || {}).filter(([, n]) => n === j.nombre).map(([m]) => m);
        if (campeonDe.length) caja.append(el("div", { class: "trofeos" }, campeonDe.map(m => el("span", { class: "trofeo", html: icono("corona", 18) + "Campeón de " + nombreMes(m) }))));
        caja.append(el("h3", { class: "sub-titulo", text: "Su lugar en cada liga" }),
          el("ol", { class: "historial-liga" }, filas.slice().reverse().map(f => el("li", {},
            el("span", { class: "hl-mes", text: nombreMes(f.mes) + (f.final ? "" : " · en curso") }),
            el("b", { class: "hl-lugar l" + Math.min(4, f.lugar), text: "#" + f.lugar }),
            el("span", { class: "hl-pts", text: num(f.puntos) + " pts" + (f.final ? "" : f.proyeccion ? ` · va para ~${num(f.proyeccion)}` : "") }),
            !f.final && f.cambio != null ? el("span", { html: App.indicador(f.cambio) }) : null))),
          filas.length > 1 ? App.graficaBarras(filas.map(f => f.puntos), { etiquetas: filas.map(f => App.mesCorto(f.mes)), alto: 140 }) : null);
      }
      // Comparar meses
      const meses = Object.keys(W.Meses || {}).filter(m => (W.Meses[m].Stats || {})[j.nombre]).sort();
      if (meses.length >= 2) {
        const sa = el("select", { "aria-label": "Mes A" }, meses.map(m => el("option", { value: m, text: nombreMes(m) })));
        const sb = el("select", { "aria-label": "Mes B" }, meses.map(m => el("option", { value: m, text: nombreMes(m) })));
        sa.value = meses[meses.length - 2]; sb.value = meses[meses.length - 1];
        const zona = el("div", { class: "comparar-meses" });
        const CAMPOS = [["minutos", "Horas", v => dec(v / 60) + " h"], ["diamantes", "Diamantes", num], ["minado", "Bloques", num], ["mobs", "Mobs", num], ["metros", "Km", v => dec(v / 1000)], ["muertes", "Muertes", num, true]];
        function pintar() {
          const A = W.Meses[sa.value].Stats[j.nombre] || {}, B = W.Meses[sb.value].Stats[j.nombre] || {};
          zona.innerHTML = "";
          CAMPOS.forEach(([k, t, f, menos]) => {
            const a = A[k] || 0, b = B[k] || 0, max = Math.max(1, a, b), dif = b - a;
            const mejoro = menos ? dif < 0 : dif > 0;
            zona.append(el("div", { class: "cm-fila" }, el("small", { text: t }),
              el("span", { class: "cm-barras" }, el("i", { class: "a", style: `width:${a / max * 100}%` }), el("i", { class: "b", style: `width:${b / max * 100}%` })),
              el("span", { class: "cm-valores", html: `${f(a)} → <b>${f(b)}</b>` }),
              el("span", { class: "cm-dif " + (dif === 0 ? "" : mejoro ? "sube" : "baja"), text: dif === 0 ? "igual" : (dif > 0 ? "+" : "−") + f(Math.abs(dif)) })));
          });
        }
        sa.onchange = sb.onchange = pintar; pintar();
        caja.append(el("h3", { class: "sub-titulo", text: "Comparar meses" }), el("div", { class: "cm-elegir" }, sa, el("span", { text: "vs" }), sb), zona);
      }
      return caja;
    }

    // ---------- Pestaña: Gráficas de progreso ----------
    function graficas(j) {
      const HIST = App.M.historial || {}, dias = Object.keys(HIST).sort().filter(d => HIST[d][j.nombre]);
      if (dias.length < 2) return el("p", { class: "vacio", text: "La gráfica sale cuando el bot tenga unos días de datos." });
      const OPC = [["minutos", "Horas", v => dec(v / 60) + " h"], ["diamantes", "Diamantes", num], ["minado", "Bloques", num], ["mobs", "Mobs", num], ["muertes", "Muertes", num], ["metros", "Km", v => dec(v / 1000) + " km"]];
      let k = "minutos";
      const chips = el("div", { class: "chips" }, OPC.map(([id, t]) => el("button", { class: "chip-btn", type: "button", "data-k": id, text: t })));
      const zona = el("div", { class: "caja-grafica" });
      function pintar() {
        chips.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === k)));
        const o = OPC.find(x => x[0] === k);
        const vals = dias.map(d => HIST[d][j.nombre][k] || 0);
        zona.innerHTML = "";
        zona.append(el("h3", { text: o[1] + " acumuladas" }), el("p", { text: `Desde el ${fecha(dias[0])} hasta hoy` }),
          App.graficaLinea(vals, { etiquetas: dias.map(d => fecha(d).replace(/ \d{4}$/, "")), formato: o[2], color: k === "muertes" ? "#ff6b57" : k === "diamantes" ? "#5fd0e8" : null }));
      }
      chips.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { k = b.dataset.k; pintar(); } });
      pintar();
      return el("div", { class: "perfil-graficas" }, chips, zona);
    }

    // ---------- Pestaña: sus Wrapped ----------
    function wrapped(j) {
      const meses = Object.keys(W.Meses || {}).filter(m => (W.Meses[m].Stats || {})[j.nombre] || (W.Meses[m].Jugadores || {})[j.nombre]).sort().reverse();
      if (!meses.length || !window.M224?.wrapped) return el("p", { class: "vacio", text: "Su primer Wrapped sale cuando termine su primer mes jugando." });
      const WR = window.M224.wrapped;
      return el("div", { class: "lista-wrapped" }, meses.map((m, i) => {
        // Vista previa: su título de ese mes y tres números
        let d = null, t = null;
        try { d = WR.datos(j.nombre, m); t = d && WR.titulo(d); } catch {}
        return el("button", { class: "wr-mes", type: "button", style: `--g:${WR.GRADS[i % WR.GRADS.length]}`, onclick: () => WR.abrir(j.nombre, m) },
          el("span", { class: "wr-mes-ico", html: icono("regalo", 22) }),
          el("span", { class: "wr-mes-txt" },
            el("b", { text: "Wrapped de " + nombreMes(m) }),
            t ? el("span", { class: "wr-mes-titulo", text: t.t }) : null,
            d ? el("small", { text: `${dec(d.j.horas)} h · ${num(d.j.diamantes)} diamantes · ${num(d.j.muertes)} muertes` }) : el("small", { text: m === App.mesActual ? "Va en curso" : "Ver otra vez" })),
          el("span", { class: "wr-mes-estado", text: m === App.mesActual ? "En curso" : "" }),
          el("span", { class: "wr-ir", html: icono("flecha", 18) }));
      }));
    }

    // ---------- Cuentas de Java y Bedrock unidas ----------
    function cuentasDe(j) {
      const c = j.cuentas && j.cuentas.length ? j.cuentas : [{ nombre: j.nombre, plataforma: j.nombre.startsWith(".") ? "bedrock" : "java" }, ...(j.otrosNombres || []).map(n => ({ nombre: n, plataforma: n.startsWith(".") ? "bedrock" : "java" }))];
      if (c.length < 2 && c[0].plataforma === "java") return null;
      return el("div", { class: "perfil-cuentas" }, c.map(x => el("span", { class: "cuenta-chip " + x.plataforma, title: x.plataforma === "java" ? "Minecraft Java (compu)" : "Minecraft Bedrock (cel, consola o Windows)" },
        el("span", { html: icono(x.plataforma, 14) }), el("b", { text: x.nombre }), el("small", { text: x.plataforma === "java" ? "Java" : "Bedrock" }))));
    }

    async function copiarLink(url) {
      try { await navigator.clipboard.writeText(url); App.M.avisar("Link copiado"); }
      catch { App.M.avisar(url); }
    }

    // ---------- Pestaña: Historia (su línea de tiempo) ----------
    function historia(j) {
      const ev = [];
      const add = (f, ic, t, x) => { if (f) ev.push({ f: String(f).slice(0, 10), ic, t, x }); };
      add(j.primerDia, "entrar", "Entró a la 224", "Su primer día en el server.");
      const lg = (W.Logros || {})[j.nombre] || {};
      add(lg.diamante, "gema", "Su primer diamante", "");
      add(lg.nether, "llama", "Llegó al Nether", "");
      add(lg.end, "portal", "Llegó al End", "");
      const P = W.Primeros || {};
      [["diamante", "Primer diamante de toda la 224"], ["nether", "Primero de la 224 en el Nether"], ["end", "Primero de la 224 en el End"], ["dragon", "Mató al Ender Dragon"]]
        .forEach(([k, t]) => { if (P[k] && P[k].Jugador === j.nombre) add(P[k].Fecha, k === "dragon" ? "dragon" : "estrella", t, "Nadie lo hizo antes."); });
      (j.medallas || []).forEach(m => {
        if (m.especial) { if (m.nivel && m.fecha) add(m.fecha, m.icono, "Medalla " + m.nombre, m.que + "."); }
        else Object.entries(m.fechas || {}).forEach(([n, f]) => { if (f) add(f, m.icono, `Medalla ${m.nombre} de ${NIV[n]}`, m.que.replace("{0}", num(m.metas[n - 1])) + "."); });
      });
      Object.entries(LIGA.campeones || {}).forEach(([m, n]) => { if (n === j.nombre) add(m + "-28", "corona", "Campeón de " + nombreMes(m), "Ganó la liga del mes."); });
      (j.masTonto || []).forEach(m => add(m + "-28", "calavera", "El más tonto de " + nombreMes(m), "Nadie se murió más que él ese mes."));
      if (!ev.length) return el("p", { class: "vacio", text: "Su historia se va llenando conforme juega." });
      ev.sort((a, b) => a.f.localeCompare(b.f));
      return el("ol", { class: "linea-personal" }, ev.map(e => el("li", {},
        el("span", { class: "lp-ico", html: icono(e.ic, 18) }),
        el("div", {}, el("small", { text: fecha(e.f) }), el("b", { text: e.t }), e.x ? el("p", { text: e.x }) : null))));
    }

    // ---------- Pantalla de presentación (como selección de personaje) ----------
    function presentacion(nombre) {
      let actual = App.jugador(nombre) || js[0];
      if (!actual) return;
      const BARRAS = [["horas", "Aguante", "reloj"], ["minado", "Minería", "pico"], ["mobs", "Combate", "espada"], ["metros", "Exploración", "brujula"], ["diamantes", "Riqueza", "gema"], ["record", "Supervivencia", "escudo"]];
      const max = k => Math.max(1, ...js.map(x => Number(x[k] || 0)));
      const escena = el("div", { class: "pres-skin" });
      const info = el("div", { class: "pres-info" });
      const rejilla = el("div", { class: "pres-rejilla", role: "listbox", "aria-label": "Jugadores" });
      let v3 = null;
      function pintar(j) {
        actual = j;
        history.replaceState(null, "", "#pres-" + encodeURIComponent(j.nombre));
        if (v3) { v3.dispose(); v3 = null; }
        escena.replaceChildren(imgSkin(j.nombre, { pose: App.POSE_CLASE[j.clase] || null, clase: "pres-skin-img", tam: 400 }));
        const lado = Math.min(innerHeight * .55, 460);
        skin3d(escena, j.nombre, { ancho: lado * .7, alto: lado, animacion: "saludar", zoom: .9 }).then(x => { if (actual === j) v3 = x; else x && x.dispose(); });
        info.replaceChildren(
          el("span", { class: "pres-num", text: "JUGADOR " + numeroCarta(j.nombre) }),
          el("h2", { class: "pres-nombre", text: j.nombre }),
          el("p", { class: "pres-sub", text: `${(j.clase || "Novato").toUpperCase()} · NIVEL ${num(j.nivel || 1)} · ${(j.rango || "Novato").toUpperCase()}` }),
          el("div", { class: "pres-barras" }, BARRAS.map(([k, t, ic], i) => {
            const pct = Math.round(Number(j[k] || 0) / max(k) * 100);
            return el("div", { class: "pres-barra", style: `--i:${i}` }, el("span", { html: icono(ic, 16) + t }),
              el("span", { class: "pres-pista" }, Array.from({ length: 10 }, (_, n) => el("i", { class: n < Math.ceil(pct / 10) ? "on" : "" }))));
          })),
          el("p", { class: "pres-frase", text: fraseDe(j) }));
        rejilla.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.n === j.nombre)));
      }
      js.forEach(j => rejilla.append(el("button", { type: "button", role: "option", "data-n": j.nombre, title: j.nombre, onclick: () => pintar(j) }, imgCara(j.nombre, "", 64))));
      const cont = el("div", { class: "presentacion" },
        el("div", { class: "pres-arriba" }, el("span", { class: "etq-mini", text: "ESCOGE A TU JUGADOR" })),
        el("div", { class: "pres-centro" }, escena, info), rejilla);
      function teclas(e) {
        const i = js.indexOf(actual);
        if (e.key === "ArrowRight") pintar(js[(i + 1) % js.length]);
        if (e.key === "ArrowLeft") pintar(js[(i - 1 + js.length) % js.length]);
      }
      addEventListener("keydown", teclas);
      App.cine(cont, { alCerrar: () => { removeEventListener("keydown", teclas); if (v3) v3.dispose(); if (location.hash.startsWith("#pres-")) history.replaceState(null, "", location.pathname + location.search); } });
      pintar(actual);
    }
    // Una frase según cómo juega
    function fraseDe(j) {
      const prom = k => js.reduce((t, x) => t + Number(x[k] || 0), 0) / Math.max(1, js.length);
      if ((j.muertes || 0) > prom("muertes") * 1.5) return "Se muere mucho, pero siempre regresa.";
      if ((j.diamantes || 0) > prom("diamantes") * 1.5) return "Huele los diamantes desde lejos.";
      if ((j.mobs || 0) > prom("mobs") * 1.5) return "Los mobs cambian de camino cuando lo ven.";
      if ((j.metros || 0) > prom("metros") * 1.5) return "Conoce el mapa mejor que nadie.";
      if ((j.horas || 0) > prom("horas") * 1.5) return "Prácticamente vive en la 224.";
      if ((j.record || 0) > prom("record") * 1.5) return "Difícil de matar.";
      return "Juega a su ritmo y sin broncas.";
    }
    App.presentacion = presentacion;
    App.ruta("#pres-", n => presentacion(n));

    // ---------- Video corto de la carta girando ----------
    async function videoCarta(j) {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { App.M.avisar("Tu navegador no puede hacer videos. Usa la imagen."); return; }
      const W_ = 720, H_ = 1280, c = document.createElement("canvas"); c.width = W_; c.height = H_;
      const g = c.getContext("2d");
      const estado = el("p", { class: "video-estado", text: "Haciendo tu video… (6 segundos)" });
      const vista = el("div", { class: "video-vista" }, c);
      const caja = el("div", { class: "video-caja" }, el("h3", { text: "Video de tu carta" }), vista, estado);
      const capa = App.capa(caja, { ancho: 460, etiqueta: "Video de la carta" });
      try { await document.fonts.ready; } catch {}
      const cuerpo = await new Promise(res => {
        const urls = App.urlsCuerpo(j.nombre, 400); let k = 0;
        const im = new Image(); im.crossOrigin = "anonymous";
        im.onload = () => res(im); im.onerror = () => { k++; if (k < urls.length) im.src = urls[k]; else res(null); };
        im.src = urls[0]; setTimeout(() => res(null), 8000);
      });
      const rangoColor = COLOR_RANGO[j.rango || "Novato"] || "#8a8f98";
      const datos = [["Horas", dec(j.horas)], ["Diamantes", num(j.diamantes)], ["Bloques", num(j.minado)], ["Mobs", num(j.mobs)], ["Muertes", num(j.muertes)], ["Racha", num(j.mejorRacha) + " d"]];
      const redondo = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
      const CW = 460, CH = 644;
      function frente() {
        const f = g.createLinearGradient(0, 0, 0, CH); f.addColorStop(0, "#1d2a25"); f.addColorStop(1, "#101714");
        g.fillStyle = f; redondo(-CW / 2, -CH / 2, CW, CH, 30); g.fill();
        g.lineWidth = 6; g.strokeStyle = rangoColor; g.stroke();
        g.fillStyle = "#93a39b"; g.font = '24px "Silkscreen", monospace'; g.textAlign = "left"; g.fillText("#" + numeroCarta(j.nombre), -CW / 2 + 28, -CH / 2 + 50);
        g.fillStyle = rangoColor; redondo(CW / 2 - 98, -CH / 2 + 22, 72, 72, 16); g.fill();
        g.fillStyle = "#0b0f0c"; g.textAlign = "center"; g.font = '700 16px "Figtree", sans-serif'; g.fillText("NV", CW / 2 - 62, -CH / 2 + 46);
        g.font = '800 34px "Unbounded", sans-serif'; g.fillText(num(j.nivel || 1), CW / 2 - 62, -CH / 2 + 84);
        if (cuerpo) { g.imageSmoothingEnabled = false; const ch = 330, cw = ch * cuerpo.width / cuerpo.height; g.drawImage(cuerpo, -cw / 2, -CH / 2 + 110, cw, ch); }
        g.fillStyle = "#fff"; g.textAlign = "left"; let t = 46; g.font = `800 ${t}px "Unbounded", sans-serif`;
        while (g.measureText(j.nombre).width > CW - 60 && t > 20) { t -= 2; g.font = `800 ${t}px "Unbounded", sans-serif`; }
        g.fillText(j.nombre, -CW / 2 + 28, CH / 2 - 120);
        g.fillStyle = "#93a39b"; g.font = '600 24px "Figtree", sans-serif'; g.fillText(`${j.rango || "Novato"} · ${j.clase || "Novato"}`, -CW / 2 + 28, CH / 2 - 80);
        g.fillStyle = "#e9f0ec"; g.font = '700 24px "Figtree", sans-serif'; g.fillText(`${dec(j.horas)} h   ${num(j.diamantes)} diamantes   ${num(j.muertes)} muertes`, -CW / 2 + 28, CH / 2 - 40);
      }
      function atras() {
        g.fillStyle = "#141b19"; redondo(-CW / 2, -CH / 2, CW, CH, 30); g.fill(); g.lineWidth = 6; g.strokeStyle = rangoColor; g.stroke();
        g.fillStyle = "#fff"; g.textAlign = "left"; g.font = '800 34px "Unbounded", sans-serif'; g.fillText("Stats", -CW / 2 + 28, -CH / 2 + 70);
        datos.forEach(([t, v], i) => {
          const y = -CH / 2 + 110 + i * 82;
          g.fillStyle = "#1b2421"; redondo(-CW / 2 + 24, y, CW - 48, 68, 14); g.fill();
          g.fillStyle = "#93a39b"; g.font = '700 24px "Figtree", sans-serif'; g.textAlign = "left"; g.fillText(t, -CW / 2 + 44, y + 43);
          g.fillStyle = "#fff"; g.font = '800 30px "Unbounded", sans-serif'; g.textAlign = "right"; g.fillText(v, CW / 2 - 44, y + 45);
        });
      }
      function cuadro(tms) {
        const p = tms / 6000;
        const fondo = g.createLinearGradient(0, 0, W_, H_); fondo.addColorStop(0, "#0f3d2e"); fondo.addColorStop(1, "#0b0f0d");
        g.fillStyle = fondo; g.fillRect(0, 0, W_, H_);
        g.fillStyle = "#ffffff10"; for (let x = 0; x < W_; x += 36) g.fillRect(x, 0, 2, H_); for (let y = 0; y < H_; y += 36) g.fillRect(0, y, W_, 2);
        g.fillStyle = "#5fd068"; g.font = '30px "Silkscreen", monospace'; g.textAlign = "center"; g.fillText("MINECRAFT 224", W_ / 2, 110);
        // Gira 1 vuelta y media y regresa al frente
        const ang = p < .15 ? 0 : p > .85 ? Math.PI * 2 : (p - .15) / .7 * Math.PI * 2;
        const esc = Math.cos(ang), flota = Math.sin(tms / 400) * 10;
        g.save(); g.translate(W_ / 2, H_ / 2 + 20 + flota); g.scale(Math.max(.02, Math.abs(esc)), 1);
        if (esc >= 0) frente(); else atras();
        g.restore();
        g.fillStyle = "#ffffffaa"; g.font = '24px "Silkscreen", monospace'; g.fillText(App.paginaUrl.replace(/^https?:\/\//, "").replace(/\/?#.*$/, "").replace(/\/$/, ""), W_ / 2, H_ - 70);
      }
      const tipo = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(t => MediaRecorder.isTypeSupported(t)) || "";
      const flujo = c.captureStream(30);
      const rec = new MediaRecorder(flujo, tipo ? { mimeType: tipo, videoBitsPerSecond: 4e6 } : undefined);
      const partes = []; rec.ondataavailable = e => e.data.size && partes.push(e.data);
      const listo = new Promise(r => rec.onstop = r);
      rec.start();
      const t0 = performance.now();
      await new Promise(fin => { (function paso(a) { const t = a - t0; cuadro(Math.min(6000, t)); if (t < 6000) requestAnimationFrame(paso); else fin(); })(t0); });
      rec.stop(); await listo;
      const ext = (rec.mimeType || tipo).includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(partes, { type: rec.mimeType || "video/" + ext });
      const url = URL.createObjectURL(blob), archivo = `carta-${j.nombre}.${ext}`;
      const video = el("video", { src: url, controls: true, loop: true, playsinline: true, muted: true, autoplay: true });
      vista.replaceChildren(video);
      estado.textContent = ext === "webm" ? "Listo. Si WhatsApp no lo acepta, súbelo como documento." : "Listo.";
      const archivoF = new File([blob], archivo, { type: blob.type });
      caja.append(el("div", { class: "acciones-fila" },
        el("a", { class: "boton-icono lleno", href: url, download: archivo, html: icono("descargar") + "Descargar" }),
        navigator.canShare && navigator.canShare({ files: [archivoF] }) ? el("button", { class: "boton-icono", type: "button", html: icono("compartir") + "Compartir", onclick: () => navigator.share({ files: [archivoF], title: "Mi carta de la 224" }).catch(() => {}) }) : null));
    }

    function imagenPerfil(j) {
      Compartir.mostrar(f => Compartir.perfil(j, f), "perfil-" + j.nombre, { formatos: [["cuadrado", "Cuadrado"], ["historia", "Historia de Instagram"]], titulo: "Tu perfil en imagen", link: urlPerfil(j.nombre) });
    }

    // =====================================================
    // MODO CINE DEL PERFIL
    // =====================================================
    function modoCine(j) {
      const escena = el("div", { class: "cine-skin" }, imgSkin(j.nombre, { pose: "cheering", clase: "cine-skin-img", tam: 400 }));
      const datos = [["Nivel", num(j.nivel || 1)], ["Horas", dec(j.horas)], ["Diamantes", num(j.diamantes)], ["Bloques", num(j.minado)], ["Mobs", num(j.mobs)], ["Muertes", num(j.muertes)], ["Medallas", num(medallasDe(j))], ["Mejor racha", num(j.mejorRacha) + " días"]];
      const cont = el("div", { class: `cine-perfil banner-${(j.clase || "novato").toLowerCase()}` },
        el("div", { class: "cine-fondo-nombre", text: j.nombre }),
        el("div", { class: "cine-centro" }, escena),
        el("div", { class: "cine-titulo" }, el("span", { class: "etq-mini", text: `${j.rango || "Novato"} · ${j.clase || ""}`.toUpperCase() }), el("h2", { text: j.nombre })),
        el("div", { class: "cine-orbita" }, datos.map(([t, v], i) => {
          // Reparte los datos en un arco que deja libre la parte de abajo (ahí va el nombre)
          const a = (-135 + 270 * i / (datos.length - 1)) * Math.PI / 180;
          return el("div", { class: "cine-dato", style: `--i:${i};--x:${Math.sin(a).toFixed(3)};--y:${(-Math.cos(a)).toFixed(3)}` }, el("b", { text: v }), el("small", { text: t }));
        })));
      let v = null;
      App.cine(cont, { alCerrar: () => v && v.dispose() });
      const lado = Math.min(innerWidth * .8, innerHeight * .62, 520);
      skin3d(escena, j.nombre, { ancho: lado * .75, alto: lado, animacion: "caminar", zoom: .85 }).then(x => { v = x; });
    }

    // =====================================================
    // VS DE PELEA
    // =====================================================
    const sa = document.getElementById("vs-a"), sb = document.getElementById("vs-b"), pelea = document.getElementById("vs-pelea");
    if (js.length < 2) {
      document.getElementById("comparador").innerHTML = `<p class="vacio">Se necesitan al menos 2 jugadores para pelear.</p>`;
    } else {
      js.forEach(j => { sa.add(new Option(j.nombre, j.nombre)); sb.add(new Option(j.nombre, j.nombre)); });
      sa.selectedIndex = 0; sb.selectedIndex = 1;
      pelea.addEventListener("click", () => { if (sa.value === sb.value) { App.M.avisar("Escoge a dos diferentes"); return; } vs(sa.value, sb.value); });
    }
    function prepararVs(nombre) {
      if (!sa.options.length) return;
      sa.value = nombre; if (sb.value === nombre) sb.selectedIndex = sa.selectedIndex === 0 ? 1 : 0;
      document.getElementById("comparador").scrollIntoView({ behavior: "smooth", block: "center" });
      sb.focus();
    }
    App.prepararVs = prepararVs;

    function vs(an, bn) {
      const A = App.jugador(an), B = App.jugador(bn);
      if (!A || !B) return;
      history.replaceState(null, "", `#vs-${encodeURIComponent(A.nombre)}-${encodeURIComponent(B.nombre)}`);
      const CAMPOS = [["nivel", "Nivel", num], ["horas", "Horas", v => dec(v)], ["diamantes", "Diamantes", num], ["minado", "Bloques", num], ["mobs", "Mobs", num],
        ["metros", "Km", v => dec(v / 1000)], ["record", "Sin morir", App.tiempo], ["mejorRacha", "Racha", num], ["muertes", "Muertes (menos gana)", num, true]];
      let pa = 0, pb = 0;
      const filas = CAMPOS.map(([k, t, f, menos]) => {
        const va = Number(k === "medallas" ? medallasDe(A) : A[k] || 0), vb = Number(k === "medallas" ? medallasDe(B) : B[k] || 0), max = Math.max(1, va, vb);
        const ga = menos ? va < vb : va > vb, gb = menos ? vb < va : vb > va;
        if (ga) pa++; if (gb) pb++;
        return el("div", { class: "vs-fila" },
          el("span", { class: "vs-lado a" + (ga ? " gana" : "") }, el("b", { text: f(va) }), el("span", { class: "vs-barra" }, el("i", { style: `--p:${va / max * 100}%` }))),
          el("small", { text: t }),
          el("span", { class: "vs-lado b" + (gb ? " gana" : "") }, el("span", { class: "vs-barra" }, el("i", { style: `--p:${vb / max * 100}%` })), el("b", { text: f(vb) })));
      });
      const ganador = pa === pb ? null : pa > pb ? A : B;
      const final = el("div", { class: "vs-final" }, ganador
        ? el("p", { html: `<span class="etq-mini">GANADOR</span><b>${esc(ganador.nombre)}</b><small>${Math.max(pa, pb)} a ${Math.min(pa, pb)}</small>` })
        : el("p", { html: `<span class="etq-mini">RESULTADO</span><b>¡Empate!</b><small>${pa} a ${pb}</small>` }),
        el("div", { class: "acciones-fila" },
          el("button", { class: "boton-icono lleno", type: "button", html: icono("actualizar") + "Revancha", onclick: () => { c.cerrar(); setTimeout(() => vs(bn, an), 150); } }),
          el("button", { class: "boton-icono", type: "button", html: icono("compartir") + "Compartir", onclick: () => Compartir.compartirLink(App.paginaUrl.replace(/#.*$/, "") + `#vs-${encodeURIComponent(A.nombre)}-${encodeURIComponent(B.nombre)}`, `${A.nombre} vs ${B.nombre}`) })));
      const lado = (j, cl) => el("div", { class: "vs-peleador " + cl },
        imgSkin(j.nombre, { pose: cl === "izq" ? "kicking" : "archer", clase: "vs-skin", tam: 300 }),
        el("b", { class: "vs-nombre", text: j.nombre }), el("small", { text: `Nivel ${num(j.nivel || 1)} · ${j.clase || ""}` }));
      const cont = el("div", { class: "vs-pelea" },
        el("div", { class: "vs-arriba" }, lado(A, "izq"), el("div", { class: "vs-rayo", html: icono("rayo", 64) + "<b>VS</b>" }), lado(B, "der")),
        el("div", { class: "vs-filas" }, filas), final);
      const c = App.cine(cont, { alCerrar: () => { if (location.hash.startsWith("#vs-")) history.replaceState(null, "", location.pathname + location.search); } });
      // Las stats van saliendo una por una
      filas.forEach((f, i) => setTimeout(() => f.classList.add("ver"), 1300 + i * 380));
      setTimeout(() => final.classList.add("ver"), 1300 + filas.length * 380 + 200);
    }
    App.vs = vs;
    App.ruta("#vs-", r => { const [a, b] = r.split("-").map(decodeURIComponent); if (a && b) vs(a, b); });
  });
})();
