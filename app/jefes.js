/* Jefes y misiones de la Temporada 1 */
(function () {
  const JEFES = [
    { id: "bruja", n: "La Bruja del Pantano", f: "2026-12-19T17:10:00-07:00", vida: 400, donde: "En un pantano",
      d: "Avienta pociones, se vuelve invisible y suelta murciélagos. La cuidan sus aprendices.",
      todos: "4 pociones, libro de Reparación y XP", top: "Tótem y Escoba de la Bruja (Empuje II)" },
    { id: "muneco", n: "El Muñeco de Nieve Maldito", f: "2026-12-26T17:10:00-07:00", vida: 470, donde: "En la nieve",
      d: "Ventisca, bolas de nieve y esqueletos de hielo. El jefe de Navidad.",
      todos: "Caja de regalo (shulker) con comida, XP y manzana dorada", top: "Tótem y Botas de Hielo" },
    { id: "viejo", n: "El Año Viejo", f: "2027-01-02T17:10:00-07:00", vida: 580, donde: "En una planicie",
      d: "Cohetes que explotan por todos lados. Al final se quema.",
      todos: "64 cohetes y manzana dorada encantada", top: "Tótem y Ballesta de Año Nuevo" },
    { id: "reina", n: "La Reina Araña", f: "2027-01-09T17:10:00-07:00", vida: 700, donde: "Bajo tierra, en una cueva frondosa",
      d: "Veneno, saltos y telarañas. Sus crías le hacen escudo.",
      todos: "Plantilla de netherita, 8 diamantes y XP", top: "Tótem y Colmillo de la Reina" },
    { id: "rey", n: "El Rey Esqueleto", f: "2027-01-16T17:10:00-07:00", vida: 800, donde: "En el desierto",
      d: "Lluvia de flechas, rayos y la Guardia Real.",
      todos: "Lingote de netherita, 4 bloques de oro y XP", top: "Arco del Rey y Corona del Rey" },
    { id: "guardian", n: "El Guardián del Nether", f: "2027-01-23T17:10:00-07:00", vida: 900, donde: "En el Nether, en un bosque carmesí",
      d: "Lluvia de fuego y centinelas. Se pelea en el Nether.",
      todos: "Lingote de netherita, plantilla y pociones de resistencia al fuego", top: "Tótem y Peto del Guardián" },
    { id: "ultimo", n: "El Último", f: "2027-01-30T17:10:00-07:00", vida: 1000, donde: "Sobre la oscuridad profunda",
      d: "Un Warden gigante. Si te escucha, corre.",
      todos: "Lingote de netherita, tótem, brújula de recuperación y Sigilo veloz III", top: "Botas de El Último" },
    { id: "profe", n: "La Profe Cristina", f: "2027-02-06T17:10:00-07:00", vida: 1000, donde: "En una pradera", final: true,
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

  function pintarJefes() {
    const caja = document.getElementById("jefes-caja");
    if (!caja) return;
    const ahora = Date.now();
    const idx = JEFES.findIndex(j => new Date(j.f).getTime() + DUR > ahora);
    caja.innerHTML = JEFES.map((j, i) => {
      const t = new Date(j.f);
      const paso = i < idx || idx === -1;
      const prox = i === idx;
      const estado = paso ? `<span class="j-estado paso">Ya pasó · revancha disponible</span>`
        : prox ? `<span class="j-estado prox">Próximo</span>` : `<span class="j-estado">Pronto</span>`;
      return `<article class="jefe${prox ? " proximo" : ""}${paso ? " pasado" : ""}${j.final ? " final" : ""}">
        <div class="j-top"><span class="j-n">${i + 1}</span><div><span class="j-fecha">${fecha(t)} · 5:10 pm</span>${estado}</div></div>
        <h3>${esc(j.n)}</h3>
        <p class="j-desc">${esc(j.d)}</p>
        <div class="j-datos"><span><b>${j.vida}</b> de vida</span><span>${esc(j.donde)}</span></div>
        <dl class="j-premio"><dt>Todos</dt><dd>${esc(j.todos)}</dd><dt>#1 en daño</dt><dd>${esc(j.top)}</dd></dl>
      </article>`;
    }).join("");
    const nom = document.getElementById("jefe-prox-nombre");
    if (nom) nom.textContent = idx === -1 ? "La temporada terminó. Gracias por jugar." : JEFES[idx].n;
    return idx;
  }

  function reloj(idx) {
    const r = document.getElementById("jefe-reloj");
    if (!r) return;
    if (idx === -1) { r.innerHTML = ""; return; }
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
