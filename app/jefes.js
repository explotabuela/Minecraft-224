/* Jefes y misiones de la Temporada 1 */
(function () {
  const JEFES = [
    { id: "bruja", lema: "Sus pociones no fallan.", c1: "#3d7a3a", c2: "#0e2412", n: "La Bruja del Pantano", f: "2026-12-19T17:10:00-07:00", vida: 400, donde: "En un pantano",
      d: "Avienta pociones, se vuelve invisible y suelta murciélagos. La cuidan sus aprendices.",
      todos: "4 pociones, libro de Reparación y XP", top: "Tótem y Escoba de la Bruja (Empuje II)" },
    { id: "muneco", lema: "Esta Navidad nadie se salva del frío.", c1: "#5d9bcc", c2: "#0f2440", n: "El Muñeco de Nieve Maldito", f: "2026-12-26T17:10:00-07:00", vida: 470, donde: "En la nieve",
      d: "Ventisca, bolas de nieve y esqueletos de hielo. El jefe de Navidad.",
      todos: "Caja de regalo (shulker) con comida, XP y manzana dorada", top: "Tótem y Botas de Hielo" },
    { id: "viejo", lema: "Se va con todo, y con cohetes.", c1: "#d9922f", c2: "#3f1a07", n: "El Año Viejo", f: "2027-01-02T17:10:00-07:00", vida: 580, donde: "En una planicie",
      d: "Cohetes que explotan por todos lados. Al final se quema.",
      todos: "64 cohetes y manzana dorada encantada", top: "Tótem y Ballesta de Año Nuevo" },
    { id: "reina", lema: "Bajo tierra, nadie te oye gritar.", c1: "#7d2b3c", c2: "#160a10", n: "La Reina Araña", f: "2027-01-09T17:10:00-07:00", vida: 700, donde: "Bajo tierra, en una cueva frondosa",
      d: "Veneno, saltos y telarañas. Sus crías le hacen escudo.",
      todos: "Plantilla de netherita, 8 diamantes y XP", top: "Tótem y Colmillo de la Reina" },
    { id: "rey", lema: "El desierto tiene dueño.", c1: "#c9ad5e", c2: "#3a2a0c", n: "El Rey Esqueleto", f: "2027-01-16T17:10:00-07:00", vida: 800, donde: "En el desierto",
      d: "Lluvia de flechas, rayos y la Guardia Real.",
      todos: "Lingote de netherita, 4 bloques de oro y XP", top: "Arco del Rey y Corona del Rey" },
    { id: "guardian", lema: "Bienvenidos al fuego.", c1: "#d4542b", c2: "#2e0b06", n: "El Guardián del Nether", f: "2027-01-23T17:10:00-07:00", vida: 1500, donde: "En el Nether, en un bosque carmesí",
      d: "Un bruto acorazado con un hacha enorme. Lluvia de fuego, centinelas y 1500 de vida.",
      todos: "Lingote de netherita, plantilla y pociones de resistencia al fuego", top: "Tótem y Peto del Guardián" },
    { id: "ultimo", lema: "Si te escucha, ya valiste.", c1: "#1f5560", c2: "#030d10", n: "El Último", f: "2027-01-30T17:10:00-07:00", vida: 1000, donde: "Sobre la oscuridad profunda",
      d: "Un Warden gigante. Si te escucha, corre.",
      todos: "Lingote de netherita, tótem, brújula de recuperación y Sigilo veloz III", top: "Botas de El Último" },
    { id: "profe", lema: "El examen final.", c1: "#6b45c4", c2: "#160c30", n: "La Profe Cristina", f: "2027-02-06T17:10:00-07:00", vida: 1000, donde: "En una pradera", final: true,
      d: "La jefa final. Monitores, exámenes sorpresa y errores de compilación.",
      todos: "Élitros, 64 cohetes y Diploma de la 224", top: "Regla de la Profe (maza) y Diploma con 10" },
  ];
  const MISIONES = [
    [["Mata 30 zombis", "32 de XP"], ["Junta 32 de hierro crudo", "Libro de Irrompibilidad III"], ["Consigue 5 diamantes", "3 diamantes"], ["Comercia 10 veces con aldeanos", "16 esmeraldas"], "Manzana dorada encantada"],
    [["Mata 10 blazes", "8 varas de blaze"], ["Consigue 64 de cuarzo", "32 de XP"], ["Mata 15 creepers", "Libro de Protección contra explosiones IV"], ["Pesca 15 veces", "Caña encantada"], "Shulker box"],
    [["Mata 3 esqueletos wither", "3 diamantes"], ["Consigue 2 escombros ancestrales", "1 fragmento de netherita"], ["Cría 20 animales", "16 zanahorias doradas"], ["Encanta 5 objetos", "32 de lapislázuli y 32 de XP"], "Manzana dorada encantada"],
    [["Mata 15 endermans", "8 perlas de ender"], ["Camina 10 km", "Silla y armadura de caballo de diamante"], ["Mata 5 brujas", "4 pociones de Curación II"], ["Mata 5 piglins brutos", "4 bloques de oro"], "Tótem"],
    [["Mata 10 esqueletos wither", "8 diamantes"], ["Mata 3 ghasts", "2 manzanas doradas"], ["Mata 30 arañas", "64 flechas"], ["Consigue 64 lingotes de oro", "Manzana dorada encantada"], "Shulker box"],
    [["Consigue 4 escombros ancestrales", "2 fragmentos de netherita"], ["Mata 5 ahogados", "Tridente con Lealtad III"], ["Mata 100 mobs", "64 de XP"], ["Mata 10 saqueadores", "32 esmeraldas"], "Manzana dorada encantada"],
    [["Mata al Wither", "1 lingote de netherita"], ["Consigue 20 diamantes", "2 bloques de diamante"], ["Mata 40 creepers", "Cabeza de creeper y 32 de XP"], ["Gana una invasión de aldea", "4 bloques de esmeralda"], "Shulker box"],
    [["Mata 200 mobs", "64 de XP"], ["Mata 20 blazes", "16 pociones de Fuerza II"], ["Comercia 30 veces", "32 esmeraldas"], ["Cómete 2 pasteles (14 rebanadas)", "64 cohetes"], "Tótem"],
  ];
  const INICIO = new Date("2026-12-15T16:00:00-07:00");
  const SEMANA = 7 * 864e5;
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const fecha = d => `Sáb ${d.getDate()} ${MESES[d.getMonth()]}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DUR = 25 * 60 * 1000; // ventana en la que el jefe "está despierto"

  function arte(j, tam) {
    const caja = document.createElement("div");
    caja.className = "j-arte";
    caja.style.setProperty("--tam", tam + "px");
    const cuerpo = document.createElement("canvas"), brillo = document.createElement("canvas");
    cuerpo.width = cuerpo.height = brillo.width = brillo.height = 32;
    brillo.className = "j-brillo";
    caja.append(cuerpo, brillo);
    if (window.dibujarJefe) window.dibujarJefe(j.id, cuerpo, brillo);
    return caja;
  }
  const fondo = j => `radial-gradient(circle at 50% 34%, ${j.c1}, ${j.c2} 72%)`;
  function escena(j, tam) {
    const e = document.createElement("div");
    e.className = "j-escena";
    const f = document.createElement("canvas");
    f.width = 48; f.height = 72; f.className = "j-fondo";
    e.append(f);
    if (window.dibujarFondo) window.dibujarFondo(j.id, f);
    e.append(arte(j, tam));
    return e;
  }

  function pintarJefes() {
    const caja = document.getElementById("jefes-caja"), dest = document.getElementById("jefe-destacado");
    if (!caja) return -1;
    const ahora = Date.now();
    const idx = JEFES.findIndex(j => new Date(j.f).getTime() + DUR > ahora);
    caja.innerHTML = "";
    JEFES.forEach((j, i) => {
      const t = new Date(j.f), paso = idx === -1 || i < idx, prox = i === idx;
      const a = document.createElement("article");
      a.className = "poster" + (prox ? " proximo" : "") + (paso ? " pasado" : "") + (j.final ? " final" : "");
      a.style.background = fondo(j);
      a.innerHTML = `<span class="p-num">${String(i + 1).padStart(2, "0")}/08</span>
        ${prox ? '<span class="sello">PRÓXIMO</span>' : paso ? '<span class="sello gris">YA PASÓ</span>' : j.final ? '<span class="sello oro">FINAL</span>' : ""}
        <div class="p-txt"><p class="lema">${esc(j.lema)}</p><h3>${esc(j.n)}</h3>
        <div class="p-pie"><span>${fecha(t).toUpperCase()}</span><span>${j.vida} DE VIDA</span></div>
        <dl class="p-premio"><dt>Todos</dt><dd>${esc(j.todos)}</dd><dt>#1</dt><dd>${esc(j.top)}</dd></dl></div>`;
      a.prepend(escena(j, 176));
      caja.append(a);
    });
    if (dest) {
      dest.innerHTML = "";
      if (idx === -1) { dest.innerHTML = `<div class="d-fin"><h3>Fin de temporada</h3><p>Gracias por jugar la 224.</p></div>`; return idx; }
      const j = JEFES[idx], t = new Date(j.f);
      const cartel = document.createElement("div");
      cartel.className = "d-cartel"; cartel.style.background = fondo(j);
      cartel.append(escena(j, 280));
      const info = document.createElement("div");
      info.className = "d-info";
      info.innerHTML = `<span class="d-etq">PRÓXIMO ESTRENO</span><h3>${esc(j.n)}</h3><p class="d-lema">${esc(j.lema)}</p>
        <p class="d-desc">${esc(j.d)} ${esc(j.donde)}.</p>
        <div class="reloj d-reloj" id="jefe-reloj"></div>
        <p class="d-cuando">${fecha(t)} a las 5:10 pm, ${j.vida} de vida</p>
        <dl class="p-premio grande"><dt>Para todos</dt><dd>${esc(j.todos)}</dd><dt>Para el #1</dt><dd>${esc(j.top)}</dd></dl>`;
      dest.append(cartel, info);
    }
    return idx;
  }

  function reloj(idx) {
    const r = document.getElementById("jefe-reloj");
    if (!r || idx === -1) return;
    const meta = new Date(JEFES[idx].f).getTime();
    const tick = () => {
      let s = Math.floor((meta - Date.now()) / 1000);
      if (s <= 0) { r.innerHTML = `<span class="pendiente">¡Está despierto ahorita!</span>`; return; }
      const d = Math.floor(s / 86400); s %= 86400;
      const h = Math.floor(s / 3600); s %= 3600;
      const m = Math.floor(s / 60); s %= 60;
      r.innerHTML = [[d, "DÍAS"], [h, "HRS"], [m, "MIN"], [s, "SEG"]].map(([v, l]) => `<div><b>${String(v).padStart(2, "0")}</b><small>${l}</small></div>`).join("");
    };
    tick(); setInterval(tick, 1000);
  }

  let vista = null;
  function semanaActual() {
    const n = Math.floor((Date.now() - INICIO.getTime()) / SEMANA);
    return Math.max(0, Math.min(MISIONES.length - 1, n));
  }
  function pintarMisiones() {
    const caja = document.getElementById("misiones-caja");
    if (!caja) return;
    const actual = semanaActual();
    const empezo = Date.now() >= INICIO.getTime();
    if (vista === null) vista = actual;
    const bloqueada = vista > actual;
    const ini = new Date(INICIO.getTime() + vista * SEMANA);
    const fin = new Date(ini.getTime() + SEMANA - 864e5);
    const rango = `${ini.getDate()} ${MESES[ini.getMonth()]} al ${fin.getDate()} ${MESES[fin.getMonth()]}`;
    const w = MISIONES[vista];
    const lista = bloqueada
      ? `<p class="m-bloq">Estas misiones se revelan el martes ${ini.getDate()} de ${MESES[ini.getMonth()]}.</p>`
      : `<ol class="m-lista">${w.slice(0, 4).map(([t, p]) => `<li><b>${esc(t)}</b><span>${esc(p)}</span></li>`).join("")}</ol>
         <p class="m-bonus"><b>Bonus 4/4:</b> ${esc(w[4])}</p>`;
    caja.innerHTML = `<div class="m-nav">
        <button type="button" class="btn secundario" data-m="-1" ${vista === 0 ? "disabled" : ""} aria-label="Semana anterior">‹</button>
        <div><b>Semana ${vista + 1}</b><small>${rango}${vista === actual && empezo ? " · esta semana" : ""}</small></div>
        <button type="button" class="btn secundario" data-m="1" ${vista === MISIONES.length - 1 ? "disabled" : ""} aria-label="Semana siguiente">›</button>
      </div>${lista}`;
    caja.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { vista += Number(b.dataset.m); pintarMisiones(); });
  }

  function iniciar() { reloj(pintarJefes()); pintarMisiones(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
