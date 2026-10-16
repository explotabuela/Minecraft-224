/* =========================================================
   MINECRAFT 224 · mini juegos
   - Juego del día (el mismo para todos, una vez al día)
   - ¿Quién tiene más? (sin fin)
   - Adivina la skin (3 vidas)
   - Memorama de caras (contra el reloj)
   ========================================================= */
(function () {
  "use strict";

  const esperar = fn => { const ir = () => window.App.listo.then(() => setTimeout(() => fn(window.App), 0)); if (window.App) ir(); else addEventListener("DOMContentLoaded", ir); };

  esperar(App => {
    const caja = document.getElementById("juegos-caja");
    if (!caja) return;
    const { el, num, dec, icono, imgCara, urlCuerpo, fecha, guardar, leer, aleatorio, D } = App;
    const js = App.jugadores.filter(j => j && j.nombre);

    // Los juegos de la banda necesitan al menos 3 jugadores; los demás funcionan siempre
    const hayBanda = js.length >= 3;

    // ---------- Herramientas ----------
    const hoyClave = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    const diaAnterior = k => { const [a, m, d] = k.split("-").map(Number); const x = new Date(a, m - 1, d - 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
    const barajar = (arr, r = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
    const tomar = (arr, n, r) => barajar(arr, r).slice(0, n);
    const limpioCausa = c => String(c || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
    const primerDiaServer = js.map(j => j.primerDia).filter(Boolean).sort()[0] || "2026-10-01";
    const numeroDia = () => { const [a, m, d] = primerDiaServer.split("-").map(Number); return Math.max(1, Math.round((new Date().setHours(0, 0, 0, 0) - new Date(a, m - 1, d)) / 864e5) + 1); };
    const urlJuegos = () => App.paginaUrl.replace(/#.*$/, "") + "#juegos";

    // Las categorías con las que se juega
    const CATS = [
      ["horas", "horas jugadas", v => dec(v) + " h", "reloj"],
      ["diamantes", "diamantes", num, "gema"],
      ["minado", "bloques minados", num, "pico"],
      ["mobs", "mobs matados", num, "espada"],
      ["metros", "kilómetros caminados", v => dec(v / 1000) + " km", "brujula"],
      ["muertes", "muertes", num, "calavera"],
      ["mejorRacha", "días de mejor racha", num, "llama"],
      ["nivel", "de nivel", num, "estrella"],
      ["record", "minutos de récord sin morir", num, "escudo"],
    ];
    const val = (j, k) => Number(j[k] || 0);

    // Skin sin pistas: si no carga, sale un signo de pregunta (no la inicial)
    function skinMisterio(nombre, clase = "") {
      const i = el("img", { class: "pixel " + clase, alt: "Skin misteriosa", decoding: "async" });
      const urls = App.urlsCuerpo(nombre, 260); let k = 0;
      i.onerror = () => { k++; if (k < urls.length) i.src = urls[k]; else i.replaceWith(el("div", { class: clase + " skin-nada", html: icono("pregunta", 48) })); };
      i.src = urls[0];
      return i;
    }

    // ---------- Generadores de preguntas ----------
    // Cada pregunta: { tipo, titulo, visual(), opciones:[{texto, cara?}], correcta, explicar }
    function pQuienTieneMas(r) {
      for (let intento = 0; intento < 20; intento++) {
        const [k, t, f, ic] = CATS[Math.floor(r() * CATS.length)];
        const grupo = tomar(js, 4, r);
        const vals = grupo.map(j => val(j, k)), max = Math.max(...vals);
        if (max <= 0 || vals.filter(v => v === max).length > 1) continue;
        const gana = grupo[vals.indexOf(max)];
        return { tipo: "Quién tiene más", ic, titulo: `¿Quién tiene más ${t}?`,
          opciones: grupo.map(j => ({ texto: j.nombre, cara: j.nombre })), correcta: gana.nombre,
          explicar: `${gana.nombre} tiene ${f(max)}.` };
      }
      return null;
    }
    function pNumero(r) {
      for (let intento = 0; intento < 20; intento++) {
        const [k, t, f, ic] = CATS[Math.floor(r() * CATS.length)];
        const j = js[Math.floor(r() * js.length)], v = val(j, k);
        if (v < 4) continue;
        const factores = barajar([.5, .7, 1.4, 1.8, 2.3, .35], r).slice(0, 3);
        const redondo = x => k === "horas" ? Math.round(x * 10) / 10 : k === "metros" ? Math.round(x / 100) * 100 : Math.round(x);
        const ops = [v, ...factores.map(x => redondo(v * x))];
        if (new Set(ops.map(f)).size < 4) continue;
        return { tipo: "Adivina el número", ic, titulo: `¿Cuántos ${t} tiene ${j.nombre}?`, cara: j.nombre,
          opciones: barajar(ops, r).map(x => ({ texto: f(x), valor: x })), correcta: f(v), explicar: `${j.nombre} tiene ${f(v)}.` };
      }
      return null;
    }
    function pSkin(r) {
      const grupo = tomar(js.filter(j => !j.nombre.startsWith(".")), 4, r);
      if (grupo.length < 3) return null;
      const quien = grupo[Math.floor(r() * grupo.length)];
      return { tipo: "Adivina la skin", ic: "ojo", titulo: "¿De quién es esta skin?", skin: quien.nombre,
        opciones: grupo.map(j => ({ texto: j.nombre })), correcta: quien.nombre, explicar: `Es la skin de ${quien.nombre}.` };
    }
    function pMuerte(r) {
      const muertes = ((D.presencia && D.presencia.muertes) || []).filter(m => m.jugador && m.causa && App.jugador(m.jugador));
      if (!muertes.length) return null;
      const m = muertes[Math.floor(r() * Math.min(muertes.length, 40))];
      const causa = limpioCausa(m.causa), contraJugador = /^[^\p{L}\p{N}]/u.test(m.causa);
      const mismos = new Set(muertes.filter(x => limpioCausa(x.causa) === causa).map(x => x.jugador.toLowerCase()));
      const otros = tomar(js.filter(j => !mismos.has(j.nombre.toLowerCase())), 3, r);
      if (otros.length < 2) return null;
      const correcto = App.jugador(m.jugador).nombre;
      const como = contraJugador ? `lo mató ${causa}` : causa === "Caída" ? "se cayó" : causa === "Se ahogó" ? "se ahogó" : causa === "Otra cosa" ? "murió de forma rara" : `murió por ${causa}`;
      return { tipo: "¿Quién se murió así?", ic: "calavera", titulo: `El ${fecha(m.fecha)} alguien ${como}. ¿Quién fue?`,
        opciones: barajar([{ texto: correcto, cara: correcto }, ...otros.map(j => ({ texto: j.nombre, cara: j.nombre }))], r), correcta: correcto,
        explicar: `Fue ${correcto}. QEPD.` };
    }
    function pAntiguo(r) {
      const grupo = tomar(js.filter(j => j.primerDia), 4, r);
      if (grupo.length < 3) return null;
      const orden = grupo.slice().sort((a, b) => a.primerDia.localeCompare(b.primerDia));
      if (orden[0].primerDia === orden[1].primerDia) return null;
      return { tipo: "Historia", ic: "calendario", titulo: "¿Quién de estos entró primero a la 224?",
        opciones: grupo.map(j => ({ texto: j.nombre, cara: j.nombre })), correcta: orden[0].nombre, explicar: `${orden[0].nombre} llegó el ${fecha(orden[0].primerDia)}.` };
    }
    const GENERADORES = [pSkin, pMuerte, pQuienTieneMas, pNumero, pAntiguo];

    function preguntasDelDia(cuantas = 5, semilla = "224-") {
      const r = aleatorio(semilla + hoyClave());
      // Rota el orden de los tipos según el día, para que cada día empiece distinto
      const lista = [], usados = new Set();
      const base = barajar(GENERADORES, r);
      for (let i = 0; lista.length < cuantas && i < 80; i++) {
        const q = base[i % base.length](r);
        if (q && !usados.has(q.titulo)) { usados.add(q.titulo); lista.push(q); }
      }
      return lista;
    }

    // ---------- Pantalla de una pregunta ----------
    function pintarPregunta(q, alResponder, { pie = null, tiempo = 0 } = {}) {
      const visual = q.skin ? el("div", { class: "juego-skin" }, skinMisterio(q.skin, "juego-skin-img"))
        : q.cara ? el("div", { class: "juego-cara" }, imgCara(q.cara, "", 96)) : null;
      const botones = q.opciones.map(o => el("button", { class: "juego-op", type: "button" },
        o.cara ? imgCara(o.cara, "juego-op-cara", 48) : null, el("span", { text: o.texto }), o.dato ? el("small", { class: "juego-op-dato", text: o.dato }) : null));
      const nota = el("p", { class: "juego-nota", "aria-live": "polite" });
      const cont = el("div", { class: "juego-pregunta" },
        el("span", { class: "juego-tipo", html: icono(q.ic || "pregunta", 14) + q.tipo }),
        el("h3", { text: q.titulo }), visual,
        el("div", { class: "juego-ops" + (q.opciones.length > 4 ? " muchas" : "") }, botones), nota, pie);
      // Con tiempo: barra que se acaba; si llega a cero, cuenta como error
      let reloj = null;
      if (tiempo) {
        const barra = el("span", { class: "juego-tiempo" }, el("i", { style: `animation-duration:${tiempo}s` }));
        cont.prepend(barra);
        reloj = setTimeout(() => {
          if (cont.classList.contains("respondida") || !cont.isConnected) return;
          cont.classList.add("respondida");
          botones.forEach((x, k) => { x.disabled = true; if (q.opciones[k].texto === q.correcta) x.classList.add("bien"); });
          if (visual && q.skin) visual.classList.add("revelada");
          nota.textContent = "Se acabó el tiempo. " + q.explicar; nota.className = "juego-nota baja";
          alResponder(false);
        }, tiempo * 1000);
      }
      botones.forEach((b, i) => b.addEventListener("click", () => {
        if (cont.classList.contains("respondida")) return;
        clearTimeout(reloj);
        cont.classList.add("respondida");
        const bien = q.opciones[i].texto === q.correcta;
        botones.forEach((x, k) => { x.disabled = true; if (q.opciones[k].texto === q.correcta) x.classList.add("bien"); });
        if (!bien) b.classList.add("mal");
        if (visual && q.skin) visual.classList.add("revelada");
        nota.textContent = (bien ? "¡Bien! " : "Nop. ") + q.explicar;
        nota.className = "juego-nota " + (bien ? "sube" : "baja");
        alResponder(bien);
      }));
      return cont;
    }

    // =====================================================
    // JUEGO DEL DÍA
    // =====================================================
    const estado = () => leer("juego-dia", { dias: {}, racha: 0, ultimo: "" });
    function rachaActual(e) {
      const hoy = hoyClave();
      if (e.ultimo === hoy || e.ultimo === diaAnterior(hoy)) return e.racha || 0;
      return 0;
    }
    function textoCompartir(r) {
      const cuadros = r.marcas.map(b => b ? "■" : "□").join("");
      return `Juego del día de la 224 #${numeroDia()}\n${r.aciertos}/${r.total} ${cuadros}\nRacha: ${rachaActual(estado())} ${rachaActual(estado()) === 1 ? "día" : "días"}\n${urlJuegos()}`;
    }
    async function compartirTexto(t) {
      try { if (navigator.share) { await navigator.share({ text: t }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(t); App.M.avisar("Copiado. Pégalo en el grupo"); } catch { App.M.avisar("No se pudo copiar"); }
    }
    function faltaParaMañana() {
      const a = new Date(), m = new Date(a); m.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.round((m - a) / 1000));
      return `${Math.floor(s / 3600)} h ${String(Math.floor(s % 3600 / 60)).padStart(2, "0")} m`;
    }

    function tarjetaDia() {
      const e = estado(), hoy = hoyClave(), r = e.dias[hoy];
      const racha = rachaActual(e);
      const t = el("article", { class: "juego-dia" },
        el("div", { class: "juego-dia-info" },
          el("span", { class: "etq-mini", text: `JUEGO DEL DÍA #${numeroDia()}` }),
          el("h3", { text: r ? `Hoy sacaste ${r.aciertos} de ${r.total}` : "5 preguntas sobre la banda" }),
          el("p", { text: r ? `El siguiente sale en ${faltaParaMañana()}.` : "Skins, muertes, stats y quién llegó primero. Es el mismo para todos y solo tienes un intento." }),
          r ? el("div", { class: "juego-marcas" }, r.marcas.map(b => el("i", { class: b ? "si" : "no" }))) : null),
        el("div", { class: "juego-dia-lado" },
          el("div", { class: "juego-racha" }, el("span", { html: icono("llama", 22) }), el("b", { text: num(racha) }), el("small", { text: racha === 1 ? "día de racha" : "días de racha" })),
          r ? el("button", { class: "btn juego-btn", type: "button", html: icono("compartir", 16) + "Compartir", onclick: () => compartirTexto(textoCompartir(r)) })
            : el("button", { class: "btn juego-btn", type: "button", html: icono("play", 16) + "Jugar", onclick: jugarDia }),
          botonDificil()));
      return t;
    }

    function jugarDia() {
      const hoy = hoyClave();
      if (estado().dias[hoy]) return;
      const qs = preguntasDelDia();
      if (!qs.length) { App.M.avisar("Todavía no hay datos para el juego"); return; }
      const marcas = [];
      const zona = el("div", { class: "juego-zona" });
      const prog = el("div", { class: "juego-progreso" }, qs.map(() => el("i")));
      const v = App.capa(el("div", { class: "juego-ventana" }, el("div", { class: "juego-cabeza" }, el("b", { text: `Juego del día #${numeroDia()}` }), prog), zona), { ancho: 620, etiqueta: "Juego del día", alCerrar: () => { if (marcas.length && !terminado) terminar(true); pintar(); } });
      let terminado = false;
      function terminar(abandono = false) {
        if (terminado) return; terminado = true;
        while (marcas.length < qs.length) marcas.push(false);
        const e = estado(), aciertos = marcas.filter(Boolean).length;
        e.dias[hoy] = { aciertos, total: qs.length, marcas };
        e.racha = e.ultimo === diaAnterior(hoy) ? (e.racha || 0) + 1 : e.ultimo === hoy ? e.racha : 1;
        e.ultimo = hoy;
        // Solo guarda los últimos 60 días
        const llaves = Object.keys(e.dias).sort(); while (llaves.length > 60) delete e.dias[llaves.shift()];
        guardar("juego-dia", e);
        if (abandono) return;
        const frase = aciertos === qs.length ? "Perfecto. Te sabes todo de la 224." : aciertos >= 3 ? "Nada mal, sí conoces a la banda." : aciertos >= 1 ? "Te falta juntarte más con la banda." : "¿Sí juegas en la 224?";
        zona.replaceChildren(el("div", { class: "juego-final" },
          el("span", { class: "etq-mini", text: "RESULTADO" }),
          el("b", { class: "juego-final-num", text: `${aciertos}/${qs.length}` }),
          el("div", { class: "juego-marcas grande" }, marcas.map(b => el("i", { class: b ? "si" : "no" }))),
          el("p", { text: frase }),
          el("p", { class: "juego-nota", text: `Racha: ${e.racha} ${e.racha === 1 ? "día" : "días"} · el siguiente sale en ${faltaParaMañana()}` }),
          el("div", { class: "juego-acciones" },
            el("button", { class: "btn juego-btn", type: "button", html: icono("compartir", 16) + "Compartir resultado", onclick: () => compartirTexto(textoCompartir(e.dias[hoy])) }),
            el("button", { class: "boton-icono", type: "button", text: "Cerrar", onclick: v.cerrar }))));
      }
      function siguiente(i) {
        prog.children[i] && prog.children[i].classList.add("actual");
        if (i >= qs.length) { terminar(); return; }
        const pie = el("button", { class: "btn juego-btn juego-sig", type: "button", hidden: true, text: i === qs.length - 1 ? "Ver resultado" : "Siguiente", onclick: () => siguiente(i + 1) });
        App.transicion(() => zona.replaceChildren(pintarPregunta(qs[i], bien => {
          marcas.push(bien);
          prog.children[i].className = bien ? "si" : "no";
          pie.hidden = false; pie.focus();
        }, { pie })));
      }
      siguiente(0);
    }

    // =====================================================
    // ¿QUIÉN TIENE MÁS? (sin fin)
    // =====================================================
    function quienEsMejor() {
      let puntos = 0;
      const marcador = el("b", { text: "0" }), mejor = el("b", { text: num(leer("record-mejor", 0)) });
      const zona = el("div", { class: "juego-zona" });
      App.capa(el("div", { class: "juego-ventana" },
        el("div", { class: "juego-cabeza" }, el("b", { text: "¿Quién tiene más?" }),
          el("div", { class: "juego-score" }, el("span", {}, "Puntos ", marcador), el("span", {}, "Récord ", mejor))), zona), { ancho: 680, etiqueta: "Quién tiene más" });
      function ronda() {
        let a, b, cat;
        for (let k = 0; k < 40; k++) {
          [a, b] = tomar(js, 2); cat = CATS[Math.floor(Math.random() * CATS.length)];
          if (val(a, cat[0]) !== val(b, cat[0]) && (val(a, cat[0]) || val(b, cat[0]))) break;
        }
        const [k, t, f, ic] = cat;
        const lado = j => {
          const v = el("b", { class: "mejor-valor", text: "?" });
          const btn = el("button", { class: "mejor-lado", type: "button" }, imgCara(j.nombre, "mejor-cara", 96), el("span", { class: "mejor-nombre", text: j.nombre }), v);
          return { j, btn, v };
        };
        const A = lado(a), B = lado(b);
        const nota = el("p", { class: "juego-nota", "aria-live": "polite" });
        const sig = el("button", { class: "btn juego-btn", type: "button", hidden: true });
        App.transicion(() => zona.replaceChildren(el("div", { class: "juego-pregunta" },
          el("span", { class: "juego-tipo", html: icono(ic, 14) + "Pícale al que tenga más" }),
          el("h3", { text: `¿Quién tiene más ${t}?` }),
          el("div", { class: "mejor-duelo" }, A.btn, el("span", { class: "mejor-vs", text: "VS" }), B.btn), nota, sig)));
        const elegir = (yo, otro) => {
          if (A.btn.disabled) return;
          A.btn.disabled = B.btn.disabled = true;
          App.contar(A.v, val(a, k), { dec: k === "horas" ? 1 : 0, dur: 600 }); App.contar(B.v, val(b, k), { dec: k === "horas" ? 1 : 0, dur: 600 });
          setTimeout(() => { A.v.textContent = f(val(a, k)); B.v.textContent = f(val(b, k)); }, 650);
          const bien = val(yo.j, k) > val(otro.j, k);
          (bien ? yo : otro).btn.classList.add("bien"); if (!bien) yo.btn.classList.add("mal");
          if (bien) {
            puntos++; marcador.textContent = num(puntos);
            if (puntos > leer("record-mejor", 0)) { guardar("record-mejor", puntos); mejor.textContent = num(puntos); }
            nota.textContent = "¡Bien!"; nota.className = "juego-nota sube";
            sig.textContent = "Siguiente"; sig.onclick = ronda;
          } else {
            nota.textContent = `Perdiste con ${num(puntos)} ${puntos === 1 ? "punto" : "puntos"}.`; nota.className = "juego-nota baja";
            sig.textContent = "Otra vez"; sig.onclick = () => { puntos = 0; marcador.textContent = "0"; ronda(); };
          }
          sig.hidden = false; sig.focus();
        };
        A.btn.onclick = () => elegir(A, B); B.btn.onclick = () => elegir(B, A);
      }
      ronda();
    }

    // =====================================================
    // ADIVINA LA SKIN (3 vidas)
    // =====================================================
    function adivinaSkin() {
      const conSkin = js.filter(j => !j.nombre.startsWith("."));
      if (conSkin.length < 3) { App.M.avisar("Faltan jugadores con skin de Java"); return; }
      let puntos = 0, vidas = 3;
      const marcador = el("b", { text: "0" }), mejor = el("b", { text: num(leer("record-skin", 0)) }), corazones = el("span", { class: "juego-vidas" });
      const pintarVidas = () => corazones.replaceChildren(...[0, 1, 2].map(i => el("i", { class: i < vidas ? "si" : "no" })));
      pintarVidas();
      const zona = el("div", { class: "juego-zona" });
      App.capa(el("div", { class: "juego-ventana" },
        el("div", { class: "juego-cabeza" }, el("b", { text: "Adivina la skin" }),
          el("div", { class: "juego-score" }, corazones, el("span", {}, "Puntos ", marcador), el("span", {}, "Récord ", mejor))), zona), { ancho: 620, etiqueta: "Adivina la skin" });
      let ultima = "";
      function ronda() {
        let q; for (let k = 0; k < 10; k++) { q = pSkin(Math.random); if (q && q.skin !== ultima) break; }
        ultima = q.skin;
        const sig = el("button", { class: "btn juego-btn", type: "button", hidden: true });
        App.transicion(() => zona.replaceChildren(pintarPregunta(q, bien => {
          if (bien) {
            puntos++; marcador.textContent = num(puntos);
            if (puntos > leer("record-skin", 0)) { guardar("record-skin", puntos); mejor.textContent = num(puntos); }
          } else { vidas--; pintarVidas(); }
          if (vidas <= 0) { sig.textContent = "Otra vez"; sig.onclick = () => { puntos = 0; vidas = 3; marcador.textContent = "0"; pintarVidas(); ronda(); }; }
          else { sig.textContent = "Siguiente"; sig.onclick = ronda; }
          sig.hidden = false; sig.focus();
        }, { pie: sig })));
      }
      ronda();
    }

    // =====================================================
    // MEMORAMA DE CARAS
    // =====================================================
    function memorama() {
      const pares = Math.min(8, js.length);
      const elegidos = tomar(js, pares);
      const fichas = barajar([...elegidos, ...elegidos]);
      let abiertas = [], encontrados = 0, movs = 0, t0 = 0, reloj = null, bloqueado = false;
      const tiempoEl = el("b", { text: "0.0 s" }), movsEl = el("b", { text: "0" });
      const mejorT = leer("record-memo-" + pares, 0);
      const mejorEl = el("b", { text: mejorT ? dec(mejorT) + " s" : "—" });
      const tablero = el("div", { class: "memo-tablero", style: `--col:${pares * 2 > 12 ? 4 : pares * 2 > 8 ? 4 : 3}` });
      const nota = el("p", { class: "juego-nota", "aria-live": "polite", text: "Encuentra las parejas lo más rápido que puedas." });
      const v = App.capa(el("div", { class: "juego-ventana" },
        el("div", { class: "juego-cabeza" }, el("b", { text: "Memorama de la 224" }),
          el("div", { class: "juego-score" }, el("span", {}, "Tiempo ", tiempoEl), el("span", {}, "Movs ", movsEl), el("span", {}, "Récord ", mejorEl))),
        el("div", { class: "juego-zona" }, tablero, nota)), { ancho: 620, etiqueta: "Memorama", alCerrar: () => clearInterval(reloj) });
      fichas.forEach((j, i) => {
        const f = el("button", { class: "memo-ficha", type: "button", "aria-label": "Ficha " + (i + 1) },
          el("span", { class: "memo-cara memo-atras", html: icono("pregunta", 26) }),
          el("span", { class: "memo-cara memo-frente" }, imgCara(j.nombre, "memo-img", 64), el("small", { text: j.nombre })));
        f.addEventListener("click", () => {
          if (bloqueado || f.classList.contains("abierta")) return;
          if (!t0) { t0 = performance.now(); reloj = setInterval(() => tiempoEl.textContent = dec((performance.now() - t0) / 1000) + " s", 100); }
          f.classList.add("abierta"); abiertas.push([f, j.nombre]);
          if (abiertas.length < 2) return;
          movs++; movsEl.textContent = num(movs);
          const [[f1, n1], [f2, n2]] = abiertas; abiertas = [];
          if (n1 === n2) {
            f1.classList.add("hecha"); f2.classList.add("hecha"); encontrados++;
            if (encontrados === pares) {
              clearInterval(reloj);
              const s = Math.round((performance.now() - t0) / 100) / 10;
              tiempoEl.textContent = dec(s) + " s";
              const anterior = leer("record-memo-" + pares, 0), nuevo = !anterior || s < anterior;
              if (nuevo) { guardar("record-memo-" + pares, s); mejorEl.textContent = dec(s) + " s"; }
              nota.className = "juego-nota sube";
              nota.textContent = `¡Listo en ${dec(s)} segundos y ${movs} movimientos!${nuevo ? " Nuevo récord." : ""}`;
              nota.after(el("div", { class: "juego-acciones" }, el("button", { class: "btn juego-btn", type: "button", text: "Otra vez", onclick: () => { v.cerrar(); setTimeout(memorama, 220); } })));
            }
          } else {
            bloqueado = true;
            setTimeout(() => { f1.classList.remove("abierta"); f2.classList.remove("abierta"); bloqueado = false; }, 750);
          }
        });
        tablero.append(f);
      });
    }

    // =====================================================
    // MODO DIFÍCIL DEL JUEGO DEL DÍA (10 preguntas con tiempo)
    // =====================================================
    const estadoDificil = () => leer("juego-dificil", { dias: {} });
    function botonDificil() {
      const r = estadoDificil().dias[hoyClave()];
      return el("button", { class: "boton-icono juego-dificil-btn", type: "button", html: icono("llama", 16) + (r ? `Difícil: ${r.aciertos}/${r.total}` : "Modo difícil"), disabled: !!r, title: "10 preguntas, 12 segundos cada una", onclick: jugarDificil });
    }
    function jugarDificil() {
      const hoy = hoyClave();
      if (estadoDificil().dias[hoy]) return;
      const qs = preguntasDelDia(10, "224-dificil-");
      if (qs.length < 5) { App.M.avisar("Todavía no hay datos para el modo difícil"); return; }
      const marcas = [];
      const zona = el("div", { class: "juego-zona" });
      const prog = el("div", { class: "juego-progreso" }, qs.map(() => el("i")));
      let terminado = false;
      const v = App.capa(el("div", { class: "juego-ventana" }, el("div", { class: "juego-cabeza" }, el("b", { text: "Modo difícil del día" }), prog), zona), { ancho: 620, etiqueta: "Modo difícil", alCerrar: () => { if (marcas.length && !terminado) terminar(true); pintar(); } });
      function terminar(abandono = false) {
        if (terminado) return; terminado = true;
        while (marcas.length < qs.length) marcas.push(false);
        const e = estadoDificil(), aciertos = marcas.filter(Boolean).length;
        e.dias[hoy] = { aciertos, total: qs.length, marcas };
        const ll = Object.keys(e.dias).sort(); while (ll.length > 60) delete e.dias[ll.shift()];
        guardar("juego-dificil", e);
        if (abandono) return;
        const texto = `Modo difícil de la 224 #${numeroDia()}\n${aciertos}/${qs.length} ${marcas.map(b => b ? "■" : "□").join("")}\n${urlJuegos()}`;
        zona.replaceChildren(el("div", { class: "juego-final" },
          el("span", { class: "etq-mini", text: "MODO DIFÍCIL" }),
          el("b", { class: "juego-final-num", text: `${aciertos}/${qs.length}` }),
          el("div", { class: "juego-marcas grande" }, marcas.map(b => el("i", { class: b ? "si" : "no" }))),
          el("p", { text: aciertos >= 9 ? "Leyenda. Conoces la 224 de memoria." : aciertos >= 6 ? "Muy bien, contra el reloj no es fácil." : "El reloj ganó esta vez." }),
          el("div", { class: "juego-acciones" },
            el("button", { class: "btn juego-btn", type: "button", html: icono("compartir", 16) + "Compartir", onclick: () => compartirTexto(texto) }),
            el("button", { class: "boton-icono", type: "button", text: "Cerrar", onclick: v.cerrar }))));
      }
      function siguiente(i) {
        prog.children[i] && prog.children[i].classList.add("actual");
        if (i >= qs.length) { terminar(); return; }
        const pie = el("button", { class: "btn juego-btn juego-sig", type: "button", hidden: true, text: i === qs.length - 1 ? "Ver resultado" : "Siguiente", onclick: () => siguiente(i + 1) });
        zona.replaceChildren(pintarPregunta(qs[i], bien => {
          marcas.push(bien); prog.children[i].className = bien ? "si" : "no";
          pie.hidden = false; pie.focus();
        }, { pie, tiempo: 12 }));
      }
      siguiente(0);
    }

    // =====================================================
    // SPEEDRUN DE PREGUNTAS (60 segundos)
    // =====================================================
    function speedrun() {
      const banco = () => {
        const opciones = [];
        if (App.trivia && App.trivia.length) opciones.push(() => App.triviaPregunta());
        if (hayBanda) opciones.push(() => GENERADORES[Math.floor(Math.random() * GENERADORES.length)](Math.random));
        for (let k = 0; k < 10; k++) { const q = opciones[Math.floor(Math.random() * opciones.length)](); if (q) return q; }
        return null;
      };
      if (!banco()) { App.M.avisar("Todavía no hay preguntas"); return; }
      let puntos = 0, fallas = 0, fin = 0, reloj = null, jugando = false;
      const marcador = el("b", { text: "0" }), tiempoEl = el("b", { text: "60" }), mejor = el("b", { text: num(leer("record-speedrun", 0)) });
      const zona = el("div", { class: "juego-zona" });
      const v = App.capa(el("div", { class: "juego-ventana" },
        el("div", { class: "juego-cabeza" }, el("b", { text: "Speedrun de preguntas" }),
          el("div", { class: "juego-score" }, el("span", {}, "Tiempo ", tiempoEl), el("span", {}, "Puntos ", marcador), el("span", {}, "Récord ", mejor))), zona),
        { ancho: 620, etiqueta: "Speedrun", alCerrar: () => clearInterval(reloj) });
      function inicio() {
        zona.replaceChildren(el("div", { class: "juego-final" },
          el("span", { class: "etq-mini", text: "60 SEGUNDOS" }), el("p", { text: "Responde todas las que puedas. Cada acierto suma 1. Cada error te quita 3 segundos." }),
          el("button", { class: "btn juego-btn", type: "button", html: icono("play", 16) + "Empezar", onclick: empezar })));
      }
      function empezar() {
        puntos = 0; fallas = 0; marcador.textContent = "0"; jugando = true;
        fin = performance.now() + 60000;
        clearInterval(reloj);
        reloj = setInterval(() => { const r = Math.max(0, Math.ceil((fin - performance.now()) / 1000)); tiempoEl.textContent = r; if (r <= 0) terminar(); }, 200);
        otra();
      }
      function otra() {
        if (!jugando) return;
        const q = banco(); if (!q) { terminar(); return; }
        zona.replaceChildren(pintarPregunta(q, bien => {
          if (!jugando) return;
          if (bien) { puntos++; marcador.textContent = num(puntos); } else { fallas++; fin -= 3000; }
          setTimeout(otra, bien ? 350 : 900);
        }));
      }
      function terminar() {
        if (!jugando) return; jugando = false; clearInterval(reloj); tiempoEl.textContent = "0";
        const nuevo = puntos > leer("record-speedrun", 0);
        if (nuevo) { guardar("record-speedrun", puntos); mejor.textContent = num(puntos); }
        zona.replaceChildren(el("div", { class: "juego-final" },
          el("span", { class: "etq-mini", text: "SE ACABÓ EL TIEMPO" }),
          el("b", { class: "juego-final-num", text: num(puntos) }),
          el("p", { text: `${puntos === 1 ? "acierto" : "aciertos"} y ${fallas} ${fallas === 1 ? "error" : "errores"}.${nuevo ? " ¡Nuevo récord!" : ""}` }),
          el("div", { class: "juego-acciones" },
            el("button", { class: "btn juego-btn", type: "button", html: icono("actualizar", 16) + "Otra vez", onclick: empezar }),
            el("button", { class: "boton-icono", type: "button", html: icono("compartir", 16) + "Compartir", onclick: () => compartirTexto(`Hice ${puntos} en el speedrun de preguntas de la 224. ¿Me ganas?\n${urlJuegos()}`) }))));
      }
      inicio();
    }

    // =====================================================
    // PINTAR EL APARTADO
    // =====================================================
    function arcade(titulo, texto, ic, record, fn) {
      return el("button", { class: "juego-arcade", type: "button", onclick: fn },
        el("span", { class: "juego-arcade-ico", html: icono(ic, 26) }),
        el("b", { text: titulo }), el("small", { text: texto }),
        el("span", { class: "juego-arcade-record", text: record }));
    }
    function pintar() {
      const rMejor = leer("record-mejor", 0), rSkin = leer("record-skin", 0), rMemo = leer("record-memo-" + Math.min(8, js.length), 0), rSpeed = leer("record-speedrun", 0);
      const rec = (v, f = num) => v ? `Tu récord: ${f(v)}` : "Sin récord todavía";
      const grupos = { banda: [], saber: [], clasicos: [] };
      if (hayBanda) grupos.banda.push(
        arcade("¿Quién tiene más?", "Dos jugadores, un dato. Atínale las que puedas seguidas.", "podio", rec(rMejor), quienEsMejor),
        arcade("Adivina la skin", "Sale una skin borrosa. ¿De quién es? Tienes 3 vidas.", "ojo", rec(rSkin), adivinaSkin),
        arcade("Memorama", "Encuentra las parejas de caras contra el reloj.", "mando", rec(rMemo, v => dec(v) + " s"), memorama));
      grupos.saber.push(arcade("Speedrun de preguntas", "60 segundos para contestar todas las que puedas.", "reloj", rec(rSpeed), speedrun));
      (App.juegosExtra || []).forEach(x => (grupos[x.grupo] || grupos.clasicos).push(arcade(x.titulo, x.texto, x.icono, rec(leer(x.record, 0), x.formato || num), x.abrir)));
      const seccion = (t, lista) => lista.length ? [el("h3", { class: "sub-titulo juego-grupo", text: t }), el("div", { class: "juego-arcades" }, lista)] : [];
      caja.replaceChildren(
        hayBanda ? tarjetaDia() : el("p", { class: "vacio", text: "El juego del día y los juegos de la banda salen cuando haya al menos 3 jugadores en la 224. Mientras, juega los de abajo." }),
        ...seccion("De la banda", grupos.banda), ...seccion("¿Qué tanto sabes de Minecraft?", grupos.saber), ...seccion("Clásicos con estilo Minecraft", grupos.clasicos));
    }
    pintar();
    // Si cambia el día con la página abierta, se actualiza solo
    setInterval(() => { if (!document.querySelector(".juego-ventana")) pintar(); }, 60000);

    App.juegos = { jugarDia, jugarDificil, quienEsMejor, adivinaSkin, memorama, speedrun, preguntasDelDia, repintar: pintar, pintarPregunta, compartirTexto, urlJuegos, barajar };
    App.ruta("#juego-dia", () => { document.getElementById("juegos").scrollIntoView(); if (hayBanda && !estado().dias[hoyClave()]) jugarDia(); });
  });
})();
