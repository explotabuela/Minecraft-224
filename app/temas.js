/* Temas vivos de la pagina: Navidad, luna de sangre y dia de jefe. Mas sonidos chiquitos. */
(() => {
  const $ = s => document.querySelector(s);

  // ---------- 558: sonidos ----------
  const SON = {
    on: localStorage.getItem("m224-son") === "1",
    ctx: null,
    nota(f, dur = 0.07, vol = 0.06, tipo = "sine") {
      if (!this.on) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === "suspended") this.ctx.resume();
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = tipo; o.frequency.value = f;
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + dur);
      } catch {}
    },
    click() { this.nota(880, 0.05, 0.05, "triangle"); setTimeout(() => this.nota(1320, 0.05, 0.03, "triangle"), 30); },
    hover() { this.nota(660, 0.03, 0.02, "sine"); },
    abrir() { this.nota(523, 0.08, 0.05, "triangle"); setTimeout(() => this.nota(784, 0.1, 0.04, "triangle"), 60); },
  };
  window.Son = SON;

  function botonSonido() {
    const barra = $("#menu-links") || document.querySelector("header");
    if (!barra) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "boton-icono son-boton";
    b.title = "Sonidos de la pagina";
    b.setAttribute("aria-label", "Sonidos de la pagina");
    const pinta = () => { b.textContent = SON.on ? "🔊" : "🔇"; b.setAttribute("aria-pressed", String(SON.on)); };
    pinta();
    b.addEventListener("click", () => {
      SON.on = !SON.on;
      localStorage.setItem("m224-son", SON.on ? "1" : "0");
      pinta();
      if (SON.on) SON.abrir();
    });
    barra.appendChild(b);
  }

  function engancharSonidos() {
    document.addEventListener("click", e => {
      if (e.target.closest("button, .boton, a.boton, .tarjeta-jefe, .chip")) SON.click();
    }, true);
    document.addEventListener("pointerover", e => {
      if (e.target.closest("button, .boton, a.boton")) SON.hover();
    }, true);
  }

  // ---------- 555: nieve de Navidad ----------
  function nieve() {
    if (document.querySelector(".nieve-lienzo")) return;
    const c = document.createElement("canvas");
    c.className = "nieve-lienzo";
    document.body.appendChild(c);
    const g = c.getContext("2d");
    let copos = [], raf = 0;
    const medir = () => {
      c.width = innerWidth; c.height = innerHeight;
      const n = Math.min(90, Math.round(innerWidth / 16));
      copos = Array.from({ length: n }, () => ({
        x: Math.random() * c.width, y: Math.random() * c.height,
        r: 1 + Math.random() * 2.4, v: 0.25 + Math.random() * 0.75,
        o: 0.35 + Math.random() * 0.5, d: Math.random() * Math.PI * 2,
      }));
    };
    medir(); addEventListener("resize", medir);
    const paso = () => {
      g.clearRect(0, 0, c.width, c.height);
      for (const p of copos) {
        p.y += p.v; p.d += 0.01; p.x += Math.sin(p.d) * 0.4;
        if (p.y > c.height + 4) { p.y = -4; p.x = Math.random() * c.width; }
        g.globalAlpha = p.o;
        g.fillStyle = "#ffffff";
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill();
      }
      g.globalAlpha = 1;
      raf = requestAnimationFrame(paso);
    };
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) paso();
    else cancelAnimationFrame(raf);
  }

  // ---------- arranque ----------
  function aplicar(datos) {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1, dia = hoy.getDate();

    // 555: del 16 al 26 de diciembre
    if (mes === 12 && dia >= 16 && dia <= 26) {
      document.body.classList.add("tema-navidad");
      nieve();
    }

    // 556: mientras haya luna de sangre
    if (datos && datos.luna) document.body.classList.add("tema-luna");

    // 557: el dia del jefe, el cartel en la portada
    const jefes = (window.JEFES || []).filter(j => j.f);
    const hoyIso = hoy.toISOString().slice(0, 10);
    const deHoy = jefes.find(j => String(j.f).slice(0, 10) === hoyIso);
    if (deHoy) {
      document.body.classList.add("tema-jefe");
      const cielo = $("#hero-cielo");
      if (cielo) {
        const img = document.createElement("img");
        img.className = "hero-cartel";
        img.src = `img/jefes/${deHoy.id}.png`;
        img.alt = deHoy.n || "Jefe de hoy";
        img.loading = "eager";
        cielo.appendChild(img);
      }
      const aviso = document.createElement("p");
      aviso.className = "aviso-jefe";
      aviso.textContent = `HOY: ${(deHoy.n || "").toUpperCase()} · 5:10 PM`;
      const hero = $("#inicio");
      if (hero) hero.prepend(aviso);
    }
  }

  function arrancar() {
    botonSonido();
    engancharSonidos();
    const datos = (window.App && window.App.D) || window.DATOS || null;
    aplicar(datos);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
