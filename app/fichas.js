/* 98: la ficha de cada pelea. El bot sube fichas.json despues de cada jefe. */
(() => {
  const $ = s => document.querySelector(s);
  const el = (t, p = {}, ...h) => {
    const n = document.createElement(t);
    for (const [k, v] of Object.entries(p)) {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    h.flat().filter(Boolean).forEach(x => n.append(x));
    return n;
  };
  const cara = n => (window.App && App.caraLocal && App.caraLocal(n)) || `https://mc-heads.net/avatar/${encodeURIComponent(n)}/64`;

  async function traer() {
    try {
      const r = await fetch("fichas.json?v=" + Date.now(), { cache: "no-store" });
      return r.ok ? await r.json() : [];
    } catch { return []; }
  }

  function tarjeta(f, jefe) {
    const total = (f.Dano || f.dano || []).reduce((a, b) => a + (b.Dano || b.dano || 0), 0);
    const filas = (f.Dano || f.dano || []).slice(0, 12).map((l, i) => {
      const nombre = l.Jugador || l.jugador;
      const d = l.Dano || l.dano || 0;
      const pct = total > 0 ? Math.round(d * 100 / total) : 0;
      return el("div", { class: "ficha-fila" },
        el("span", { class: "ficha-pos", text: String(i + 1) }),
        el("img", { class: "ficha-cara", src: cara(nombre), alt: "", loading: "lazy", width: "24", height: "24" }),
        el("b", { class: "ficha-nombre", text: nombre }),
        el("span", { class: "ficha-barra" }, el("i", { style: `width:${Math.max(pct, 2)}%` })),
        el("span", { class: "ficha-dano", text: `${d} (${pct}%)` }));
    });
    const fecha = f.Fecha || f.fecha;
    const min = f.Minutos ?? f.minutos ?? 0, sg = f.Segundos ?? f.segundos ?? 0;
    return el("article", { class: "ficha" },
      el("header", { class: "ficha-cabeza" },
        el("img", { class: "ficha-cartel", src: `img/jefes/${f.Jefe || f.jefe}.png`, alt: "", loading: "lazy" }),
        el("div", {},
          el("h3", { text: f.Nombre || f.nombre || (jefe && jefe.n) || "" }),
          el("p", { class: "ficha-sub", text: `Duró ${min} min ${sg} s · pelearon ${(f.Dano || f.dano || []).length}` }),
          fecha ? el("p", { class: "ficha-fecha", text: new Date(fecha).toLocaleDateString("es-MX", { day: "numeric", month: "long" }) }) : null)),
      el("div", { class: "ficha-tabla" }, filas.length ? filas : el("p", { class: "ficha-vacia", text: "Nadie le alcanzó a pegar." })));
  }

  async function pintar() {
    const fichas = await traer();
    if (!Array.isArray(fichas) || fichas.length === 0) return;
    const caja = $("#fichas-caja");
    if (!caja) return;
    const orden = (window.JEFES || []).map(j => j.id);
    fichas.sort((a, b) => orden.indexOf(a.Jefe || a.jefe) - orden.indexOf(b.Jefe || b.jefe));
    caja.innerHTML = "";
    fichas.forEach(f => caja.append(tarjeta(f, (window.JEFES || []).find(j => j.id === (f.Jefe || f.jefe)))));
    const sec = $("#fichas");
    if (sec) sec.hidden = false;
  }

  if (document.readyState === "loading") addEventListener("DOMContentLoaded", pintar);
  else pintar();
})();
