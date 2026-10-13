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
          (j.otrosNombres || []).length ? el("p", { class: "perfil-otros", text: "También juega como " + j.otrosNombres.join(", ") }) : null,
          el("div", { class: "perfil-nivel" },
            el("div", { class: "perfil-nivel-num", html: `<small>NIVEL</small><b>${num(j.nivel || 1)}</b>` }),
            el("div", { class: "perfil-xp" },
              el("span", { class: "perfil-xp-barra" }, el("i", { style: `--p:${(p * 100).toFixed(1)}%` })),
              el("small", { text: `${num((j.xp || 0) - (j.xpNivel || 0))} / ${num((j.xpSiguiente || 0) - (j.xpNivel || 0))} XP para el nivel ${num((j.nivel || 1) + 1)}` }))),
          el("div", { class: "acciones-fila" },
            el("button", { class: "boton-icono", type: "button", html: icono("cine") + "Modo cine", onclick: () => modoCine(j) }),
            el("button", { class: "boton-icono", type: "button", html: icono("compartir") + "Compartir", onclick: () => Compartir.compartirLink(urlPerfil(j.nombre), `${j.nombre} en la 224`) }),
            el("button", { class: "boton-icono", type: "button", html: icono("descargar") + "Imagen", onclick: () => imagenPerfil(j) }),
            el("button", { class: "boton-icono", type: "button", html: icono("rayo") + "VS", onclick: () => { cerrar(); prepararVs(j.nombre); } }))));

      const PEST = [["resumen", "Resumen"], ["medallas", "Medallas"], ["liga", "Liga"], ["graficas", "Gráficas"], ["wrapped", "Wrapped"]];
      const pestanas = el("div", { class: "pestanas-app perfil-pestanas", role: "tablist" }, PEST.map(([k, t]) => el("button", { role: "tab", type: "button", "data-k": k, text: t })));
      const panel = el("div", { class: "perfil-panel", role: "tabpanel" });
      const cont = el("div", { class: "perfil" }, cabeza, pestanas, panel);
      const { cerrar } = App.capa(cont, { clase: "perfil-capa", ancho: 880, etiqueta: "Perfil de " + j.nombre, alCerrar: () => {
        if (visor) { visor.dispose(); visor = null; }
        if (location.hash.startsWith("#j-")) history.replaceState(null, "", location.pathname + location.search);
      } });
      skin3d(escena, j.nombre, { ancho: 240, alto: 300 }).then(v => { visor = v; });

      const vistas = { resumen, medallas, liga, graficas, wrapped };
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
      return el("div", {}, el("p", { class: "perfil-nota", text: `${total} ${total === 1 ? "medalla" : "medallas"} ganadas. Pícale a una para ver cómo se gana.` }), rej, detalle);
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
      return el("div", { class: "lista-wrapped" }, meses.map(m => el("button", { class: "wr-mes", type: "button", onclick: () => window.M224.wrapped.abrir(j.nombre, m) },
        el("span", { html: icono("regalo", 22) }), el("b", { text: "Wrapped de " + nombreMes(m) }), el("small", { text: m === App.mesActual ? "Va en curso" : "Ver otra vez" }), el("span", { class: "wr-ir", html: icono("flecha", 18) }))));
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
