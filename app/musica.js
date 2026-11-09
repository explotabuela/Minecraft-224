/* "Atardecer en la 224": música chill original, hecha con Web Audio (sin archivos).
   48 compases a 76 bpm (~2.5 min) que se repiten en ciclo. */
(function () {
  const BPM = 76, PASO = 60 / BPM / 4;               // dieciseisavos
  const n = m => 440 * Math.pow(2, (m - 69) / 12);  // nota MIDI → Hz

  // Acordes (notas MIDI) por compás
  const A = [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]];          // Dmaj7 Bm7 Gmaj7 A6
  const B = [[52, 55, 59, 62], [54, 57, 61, 64], [55, 59, 62, 66], [57, 62, 64, 69]];          // Em7 F#m7 Gmaj7 Asus
  const C = [[55, 59, 62, 66], [54, 57, 61, 64], [52, 55, 59, 62], [57, 61, 64, 67]];          // Gmaj7 F#m7 Em7 A7
  const forma = [...A, ...A, ...B, ...A, ...C, ...C, ...A, ...B, ...A, ...A, ...C, ...B];      // 48 compases
  const bajos = forma.map(ac => ac[0] - 24);

  // Melodías (por compás, 16 pasos; 0 = silencio)
  const mel1 = [[78, 0, 0, 0, 76, 0, 73, 0, 0, 0, 74, 0, 76, 0, 0, 0], [74, 0, 0, 0, 0, 0, 71, 0, 73, 0, 74, 0, 0, 0, 0, 0],
    [71, 0, 0, 0, 74, 0, 0, 0, 78, 0, 0, 0, 76, 0, 74, 0], [73, 0, 0, 0, 0, 0, 0, 0, 69, 0, 71, 0, 73, 0, 0, 0]];
  const mel2 = [[76, 0, 0, 74, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0, 0, 0], [73, 0, 0, 0, 76, 0, 0, 0, 73, 0, 69, 0, 0, 0, 0, 0],
    [74, 0, 0, 0, 0, 0, 78, 0, 0, 0, 79, 0, 78, 0, 76, 0], [76, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 74, 0, 73, 0]];
  const mel3 = [[79, 0, 0, 0, 78, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0], [73, 0, 0, 0, 0, 0, 76, 0, 0, 0, 73, 0, 0, 0, 0, 0],
    [71, 0, 74, 0, 76, 0, 74, 0, 71, 0, 0, 0, 67, 0, 0, 0], [69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
  // qué melodía va en cada bloque de 4 compases (null = sin melodía, solo ambiente)
  const plan = [null, mel1, mel2, mel1, mel3, mel3, null, mel2, mel1, mel2, mel3, null];

  let ctx, salida, filtroTape, siguiente = 0, paso = 0, timer = null, sonando = false, ruido;

  function iniciarAudio() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    salida = ctx.createGain(); salida.gain.value = 0;
    filtroTape = ctx.createBiquadFilter(); filtroTape.type = "lowpass"; filtroTape.frequency.value = 3800;
    const comp = ctx.createDynamicsCompressor();
    // eco suave
    const eco = ctx.createDelay(); eco.delayTime.value = PASO * 3;
    const ecoGan = ctx.createGain(); ecoGan.gain.value = .28;
    eco.connect(ecoGan); ecoGan.connect(eco); ecoGan.connect(filtroTape);
    salida.connect(filtroTape); salida.connect(eco);
    filtroTape.connect(comp); comp.connect(ctx.destination);
    // ruido para batería y crujido de vinil
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const vinil = ctx.createBufferSource(); vinil.buffer = ruido; vinil.loop = true; vinil.playbackRate.value = .5;
    const vf = ctx.createBiquadFilter(); vf.type = "highpass"; vf.frequency.value = 5000;
    const vg = ctx.createGain(); vg.gain.value = .012;
    vinil.connect(vf); vf.connect(vg); vg.connect(filtroTape); vinil.start();
  }

  function voz(t, f, dur, { tipo = "triangle", vol = .1, ataque = .01, soltar = .2, corte = 2400, vibrato = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = tipo; o.frequency.value = f; o.detune.value = (Math.random() - .5) * 8;
    if (vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5; lg.gain.value = vibrato; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + soltar); }
    fl.type = "lowpass"; fl.frequency.value = corte;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.setValueAtTime(vol, t + dur); g.gain.exponentialRampToValueAtTime(.0001, t + dur + soltar);
    o.connect(fl); fl.connect(g); g.connect(salida); o.start(t); o.stop(t + dur + soltar + .05);
  }
  function golpe(t, { f0 = 120, f1 = 45, vol = .5, dur = .25 }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(salida); o.start(t); o.stop(t + dur + .02);
  }
  function chasquido(t, { vol = .05, corte = 7000, tipo = "highpass", dur = .05 }) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = tipo; f.frequency.value = corte;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(salida); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }

  function tocarPaso(t, i) {
    const total = forma.length * 16, k = i % total, compas = Math.floor(k / 16), s = k % 16;
    const ac = forma[compas], bloque = Math.floor(compas / 4), mel = plan[bloque];
    const swing = s % 2 ? PASO * .18 : 0, tt = t + swing;
    // colchón de acordes al inicio de cada compás
    if (s === 0) ac.forEach((m, j) => voz(t, n(m), PASO * 15, { tipo: j % 2 ? "sine" : "triangle", vol: .035, ataque: .6, soltar: 1.2, corte: 1500 }));
    // arpegio tipo caja de música (se calla en los bloques sin melodía para respirar)
    if (s % 2 === 0) { const m = ac[(s / 2) % 4] + 12; voz(tt, n(m), PASO * 1.6, { tipo: "square", vol: mel ? .018 : .026, ataque: .005, soltar: .35, corte: 1900 }); }
    // bajo
    if (s === 0 || s === 10) voz(t, n(bajos[compas]), PASO * (s ? 5 : 8), { tipo: "triangle", vol: .16, ataque: .02, soltar: .2, corte: 600 });
    if (s === 7 && compas % 2) voz(tt, n(bajos[compas] + 7), PASO * 2, { tipo: "triangle", vol: .1, soltar: .1, corte: 600 });
    // melodía
    if (mel) { const m = mel[compas % 4][s]; if (m) voz(tt, n(m), PASO * 3, { tipo: "square", vol: .03, ataque: .02, soltar: .5, corte: 2200, vibrato: 3 }); }
    // batería lo-fi (entra después del primer bloque)
    if (compas >= 4 && plan[bloque] !== null) {
      if (s === 0 || s === 10) golpe(t, { vol: .42 });
      if (s === 4 || s === 12) chasquido(t, { vol: .09, tipo: "bandpass", corte: 1800, dur: .12 });
      if (s % 2 === 0) chasquido(tt, { vol: s % 4 ? .018 : .03, dur: .04 });
    }
  }

  function programar() {
    while (siguiente < ctx.currentTime + .25) { tocarPaso(siguiente, paso); siguiente += PASO; paso++; }
    timer = setTimeout(programar, 40);
  }

  function prender() {
    if (!ctx) iniciarAudio();
    ctx.resume();
    if (!sonando) { siguiente = ctx.currentTime + .1; sonando = true; programar(); }
    salida.gain.cancelScheduledValues(ctx.currentTime);
    salida.gain.linearRampToValueAtTime(.9, ctx.currentTime + 1.5);
    actualizar(true);
  }
  function apagar() {
    if (!ctx) return;
    salida.gain.cancelScheduledValues(ctx.currentTime);
    salida.gain.linearRampToValueAtTime(0, ctx.currentTime + .6);
    setTimeout(() => { clearTimeout(timer); sonando = false; ctx.suspend(); }, 700);
    actualizar(false);
  }

  let boton;
  function actualizar(on) {
    if (!boton) return;
    boton.setAttribute("aria-pressed", on ? "true" : "false");
    boton.setAttribute("aria-label", on ? "Apagar la música" : "Poner música");
    boton.classList.toggle("sonando", on);
    try { localStorage.setItem("m224-musica", on ? "1" : "0"); } catch {}
  }

  function montar() {
    const tema = document.getElementById("tema");
    if (!tema) return;
    boton = document.createElement("button");
    boton.className = "tema musica-btn"; boton.type = "button"; boton.title = "Música";
    boton.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><span class="ondas" aria-hidden="true"><i></i><i></i><i></i></span>';
    tema.before(boton);
    let quiere = false; try { quiere = localStorage.getItem("m224-musica") === "1"; } catch {}
    boton.setAttribute("aria-pressed", "false"); boton.setAttribute("aria-label", "Poner música");
    boton.addEventListener("click", () => (sonando && salida.gain.value > .01 ? apagar() : prender()));
    // si la dejó prendida la última vez, arranca con el primer toque en la página
    if (quiere) {
      const una = e => { if (e.target.closest && e.target.closest(".musica-btn")) return; prender(); removeEventListener("pointerdown", una, true); };
      addEventListener("pointerdown", una, true);
    }
  }
  window.MusicaFondo = { prender, apagar, sonando: () => sonando };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
