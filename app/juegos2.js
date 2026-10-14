/* =========================================================
   MINECRAFT 224 · más juegos
   - Trivia de Minecraft y de redstone
   - Adivina el mob, Crafteo, Wordle de Minecraft
   - Snake del ajolote, Flappy elytra, Tetris de bloques,
     Buscaminas de creepers y Reflejos contra el creeper
   Todo se dibuja aquí mismo (no se carga nada de otras páginas).
   ========================================================= */
(function () {
  "use strict";

  const esperar = fn => { const ir = () => window.App.listo.then(() => setTimeout(() => fn(window.App), 0)); if (window.App) ir(); else addEventListener("DOMContentLoaded", ir); };

  esperar(App => {
    const { el, num, dec, icono, guardar, leer, aleatorio } = App;
    const barajar = (arr, r = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
    const hoyClave = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    const pintarPregunta = (...a) => App.juegos.pintarPregunta(...a);
    const compartir = t => App.juegos.compartirTexto(t);
    const url = () => App.juegos.urlJuegos();
    const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ventana estándar de juego con marcador
    function ventana(titulo, marcadores, { ancho = 620, alCerrar = null } = {}) {
      const vals = {};
      const score = el("div", { class: "juego-score" }, marcadores.map(([k, t, v]) => { vals[k] = el("b", { text: v }); return el("span", {}, t + " ", vals[k]); }));
      const zona = el("div", { class: "juego-zona" });
      const v = App.capa(el("div", { class: "juego-ventana" }, el("div", { class: "juego-cabeza" }, el("b", { text: titulo }), score), zona), { ancho, etiqueta: titulo, alCerrar: () => { alCerrar && alCerrar(); App.juegos.repintar(); } });
      return { zona, vals, cerrar: v.cerrar, caja: v.caja };
    }
    // ---------- Texturas del juego (las sube el bot con el comando "texturas") ----------
    // Si no están, todo se dibuja como antes.
    const TEX = {};
    let texCargando = null;
    function cargarTexturas() {
      if (!texCargando) texCargando = (async () => {
        try {
          const r = await fetch("texturas/texturas.json?v=" + Date.now(), { cache: "no-store" });
          if (!r.ok) return;
          const d = await r.json();
          const v = encodeURIComponent(d.version || "1");
          await Promise.all((d.texturas || []).map(k => new Promise(res => {
            const i = new Image();
            i.onload = () => { TEX[k] = i; res(); }; i.onerror = () => res();
            i.src = `texturas/${k}.png?v=${v}`;
          })));
        } catch {}
      })();
      // Si el internet va lento, el juego abre igual a los 4 segundos
      return Promise.race([texCargando, new Promise(r => setTimeout(r, 4000))]);
    }
    const conTexturas = fn => (...a) => cargarTexturas().then(() => fn(...a));
    const lienzoPixel = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; return [c, g]; };

    const record = (llave, valor, menor = false) => {
      const ant = leer(llave, 0);
      const nuevo = menor ? (!ant || valor < ant) : valor > ant;
      if (nuevo) guardar(llave, valor);
      return { nuevo, mejor: nuevo ? valor : ant };
    };
    const final = (zona, { etiqueta, numero, texto, otra, compartirTxt }) => zona.replaceChildren(el("div", { class: "juego-final" },
      el("span", { class: "etq-mini", text: etiqueta }), el("b", { class: "juego-final-num", text: numero }), el("p", { text: texto }),
      el("div", { class: "juego-acciones" },
        el("button", { class: "btn juego-btn", type: "button", html: icono("actualizar", 16) + "Otra vez", onclick: otra }),
        compartirTxt ? el("button", { class: "boton-icono", type: "button", html: icono("compartir", 16) + "Compartir", onclick: () => compartir(compartirTxt + "\n" + url()) }) : null)));

    // =====================================================
    // TRIVIA (Minecraft Java, versiones recientes)
    // =====================================================
    // [pregunta, correcta, [incorrectas], explicación]
    const TRIVIA = [
      ["¿Cuántos bloques de obsidiana necesitas como mínimo para un portal al Nether?", "10", ["14", "12", "8"], "Sin las esquinas son 10 bloques."],
      ["¿A qué altura es más fácil encontrar diamantes desde la 1.18?", "Cerca de Y -59", ["Cerca de Y 12", "Cerca de Y 64", "Cerca de Y 100"], "Abajo del todo, en la zona de deepslate."],
      ["¿Con qué pico mínimo se puede minar obsidiana?", "Diamante", ["Hierro", "Oro", "Piedra"], "Necesitas pico de diamante o de netherita."],
      ["¿Qué mob se enoja si lo miras directo a los ojos?", "Enderman", ["Zombi", "Creeper", "Aldeano"], "Si lo miras, se teletransporta hacia ti."],
      ["¿Qué necesitas para curar a un aldeano zombi?", "Poción de debilidad y manzana dorada", ["Leche y pan", "Agua y una zanahoria dorada", "Un tótem"], "Primero la poción de debilidad, luego la manzana dorada."],
      ["¿Cuántos ojos de ender necesita el portal al End?", "12", ["8", "10", "16"], "El marco tiene 12 bloques y cada uno lleva un ojo."],
      ["¿Cuál es la armadura más fuerte?", "Netherita", ["Diamante", "Hierro", "Oro"], "La netherita aguanta más y no se quema en lava."],
      ["¿Qué item especial se necesita para hacer un faro?", "Estrella del Nether", ["Ojo de ender", "Esmeralda", "Corazón del mar"], "Además de vidrio y obsidiana."],
      ["¿Qué mob suelta la estrella del Nether?", "El Wither", ["El Ender Dragon", "El Ghast", "El Blaze"], "Se consigue al matar al Wither."],
      ["¿Cuánto dura un día completo de Minecraft en tiempo real?", "20 minutos", ["10 minutos", "1 hora", "24 minutos"], "Día y noche juntos son 20 minutos."],
      ["¿Qué pasa si intentas dormir en el Nether?", "La cama explota", ["Se hace de día", "No pasa nada", "Te teletransporta"], "En el Nether y en el End las camas explotan."],
      ["¿Qué bloque no se puede romper en supervivencia?", "Bedrock", ["Obsidiana", "Netherita", "Deepslate"], "La bedrock (roca madre) es indestructible en supervivencia."],
      ["¿Qué mob aparece si llevas varias noches sin dormir?", "Phantom", ["Murciélago", "Vex", "Ghast"], "Después de 3 días del juego sin dormir."],
      ["¿Qué encantamiento hace que un bloque salga tal cual al minarlo?", "Toque de seda", ["Fortuna", "Eficiencia", "Irrompibilidad"], "Toque de seda (Silk Touch) recoge el bloque intacto."],
      ["¿Qué encantamiento repara las cosas con experiencia?", "Reparación (Mending)", ["Irrompibilidad", "Protección", "Fortuna"], "Con Mending, la XP que agarras arregla el objeto."],
      ["¿Cuántos lingotes de hierro hacen un bloque de hierro?", "9", ["4", "8", "6"], "Llenas toda la mesa de crafteo."],
      ["¿Dónde se encuentran las elytras?", "En los barcos de las ciudades del End", ["En las fortalezas del Nether", "En los templos del desierto", "Se las quitas al dragón"], "Están en el barco, en un marco."],
      ["¿Qué pasa si a un creeper le cae un rayo?", "Se vuelve un creeper cargado", ["Se muere", "Se hace de diamante", "Nada"], "El creeper cargado explota más fuerte."],
      ["¿Qué comen los pandas?", "Bambú", ["Trigo", "Zanahorias", "Bayas"], "Les encanta el bambú."],
      ["¿Con qué se domestica un lobo?", "Huesos", ["Carne cruda", "Pescado", "Trigo"], "Le das huesos hasta que salga el collar."],
      ["¿Con qué se domestica un gato?", "Pescado crudo", ["Leche", "Huesos", "Semillas"], "Bacalao o salmón crudo."],
      ["¿En qué dimensión vive el Ender Dragon?", "El End", ["El Nether", "El mundo normal", "Las ciudades antiguas"], "Está en la isla principal del End."],
      ["Si caminas 1 bloque en el Nether, ¿cuántos equivale en el mundo normal?", "8", ["2", "4", "16"], "Por eso el Nether sirve para viajar rápido."],
      ["¿Qué mob protege las aldeas?", "Gólem de hierro", ["Gólem de nieve", "Aldeano herrero", "Lobo"], "Aparece solo en aldeas con aldeanos."],
      ["¿Qué item te salva de morir si lo traes en la mano?", "Tótem de la inmortalidad", ["Manzana dorada", "Escudo", "Estrella del Nether"], "Lo sueltan los evocadores."],
      ["¿Qué mob puede soltar un tridente?", "Ahogado", ["Guardián", "Bruja", "Pez globo"], "Solo los ahogados (drowned) que traen tridente."],
      ["¿Qué mob es ciego y te encuentra por las vibraciones?", "Warden", ["Enderman", "Wither", "Phantom"], "Por eso hay que caminar agachado cerca de él."],
      ["¿Qué se necesita para hacer un soporte para pociones?", "Vara de blaze", ["Polvo de redstone", "Ojo de araña", "Lingote de oro"], "Una vara de blaze y piedra labrada."],
      ["¿Qué combustible dura más en un horno?", "Cubeta de lava", ["Bloque de carbón", "Carbón", "Tablas"], "Una cubeta de lava cocina 100 cosas."],
      ["¿De qué animal le huyen los creepers?", "Del gato", ["Del lobo", "Del cerdo", "De la oveja"], "Los creepers les tienen miedo a los gatos y ocelotes."],
      ["¿Hasta qué altura se puede construir en el mundo normal desde la 1.18?", "Y 319", ["Y 255", "Y 127", "Y 511"], "El límite subió en la 1.18."],
      ["¿Qué les pasa a zombis y esqueletos con el sol?", "Se queman", ["Se duermen", "Se hacen más fuertes", "Se esconden bajo tierra siempre"], "A menos que tengan casco o estén a la sombra."],
      ["¿Quién creó Minecraft?", "Markus Persson (Notch)", ["Jeb", "Herobrine", "Dinnerbone"], "Notch lo empezó en 2009."],
      ["¿En qué año salió la versión 1.0 de Minecraft?", "2011", ["2009", "2013", "2010"], "Salió en la MineCon de noviembre de 2011."],
      ["¿Qué necesitas para entrar a una fortaleza del Nether sin problemas?", "Protección contra el fuego", ["Respiración acuática", "Visión nocturna", "Lentitud"], "Los blazes y la lava queman mucho."],
      ["¿Qué mob suelta perlas de ender?", "Enderman", ["Esqueleto", "Shulker", "Zombi"], "Las perlas te teletransportan al lanzarlas."],
      ["¿Qué item hace que los piglins no te ataquen?", "Una pieza de armadura de oro", ["Una espada de diamante", "Una esmeralda", "Un casco de hierro"], "Con algo de oro puesto, te dejan en paz."],
      ["¿Qué puede romper el marco del portal del End en supervivencia?", "Nada", ["El Wither", "Un creeper cargado", "Un pico de netherita"], "El marco del portal del End no se puede romper en supervivencia."],
      ["¿Qué pasa si le das trigo a dos vacas?", "Tienen un becerro", ["Te dan leche dorada", "Se van", "Se hacen ovejas"], "Así se crían."],
      ["¿Qué bloque se usa para cambiar el punto donde reapareces en el Nether?", "Ancla de reaparición", ["Cama", "Faro", "Imán"], "Se carga con piedra luminosa."],
    ];
    const REDSTONE = [
      ["¿Cuántos bloques máximo llega la señal de redstone sin ayuda?", "15", ["10", "16", "32"], "La fuerza baja de 15 a 0, un bloque a la vez."],
      ["¿Qué bloque repite y refuerza la señal?", "Repetidor", ["Comparador", "Observador", "Palanca"], "Además puede agregar retraso."],
      ["¿Qué bloque compara o resta señales?", "Comparador", ["Repetidor", "Tolva", "Soltador"], "También mide qué tan lleno está un cofre."],
      ["¿Qué pistón jala el bloque de regreso?", "Pistón pegajoso", ["Pistón normal", "Observador", "Dispensador"], "Al apagarse, regresa el bloque."],
      ["¿Qué se le agrega a un pistón para hacerlo pegajoso?", "Bola de slime", ["Miel", "Cuerda", "Polvo de redstone"], "Bola de slime arriba del pistón."],
      ["¿Qué bloque detecta cuando pasa alguien encima?", "Placa de presión", ["Palanca", "Botón", "Diana"], "Se activa al pisarla."],
      ["¿Qué bloque detecta vibraciones?", "Sensor de sculk", ["Observador", "Sensor de luz", "Bloque de notas"], "Pasos, sonidos y bloques rotos."],
      ["¿Qué bloque detecta cambios en el bloque de enfrente?", "Observador", ["Comparador", "Repetidor", "Tolva"], "Manda un pulso cuando algo cambia."],
      ["¿Qué componente invierte la señal (prende si no hay señal)?", "Antorcha de redstone", ["Repetidor", "Palanca", "Lámpara"], "Si le llega señal, se apaga."],
      ["¿Cuántos ticks de retraso puede tener un repetidor como máximo?", "4", ["2", "8", "1"], "De 1 a 4 ticks de redstone."],
      ["¿Qué bloque da señal según la hora del día?", "Sensor de luz solar", ["Reloj", "Observador", "Faro"], "Se puede invertir para la noche."],
      ["¿Qué bloque pasa items de un contenedor a otro?", "Tolva", ["Soltador", "Dispensador", "Cofre"], "La tolva jala y empuja items."],
      ["¿Qué bloque puede usar items, como poner agua con una cubeta?", "Dispensador", ["Soltador", "Tolva", "Barril"], "El soltador solo los avienta."],
      ["¿Qué rieles impulsan a las vagonetas?", "Rieles propulsores", ["Rieles detectores", "Rieles activadores", "Rieles normales"], "Llevan oro y necesitan señal."],
      ["¿Cuántos bloques puede empujar un pistón como máximo?", "12", ["8", "16", "64"], "Con 13 o más ya no se mueve."],
      ["¿Cuál de estos bloques NO puede empujar un pistón?", "Obsidiana", ["Piedra", "Tierra", "Madera"], "La obsidiana no se mueve con pistones."],
      ["¿Qué bloque hace que otros bloques se muevan pegados con él?", "Bloque de slime", ["Bloque de redstone", "Lana", "Vidrio"], "También funciona el bloque de miel."],
      ["¿Cómo se llama un circuito que prende y apaga solo, una y otra vez?", "Reloj de redstone", ["Puerta lógica", "Memoria", "Repetidor largo"], "Sirve para granjas automáticas."],
      ["¿Qué bloque da más señal mientras más al centro le pegues con una flecha?", "Diana", ["Botón de madera", "Placa de presión", "Observador"], "La diana (target)."],
      ["¿Qué componente se queda prendido hasta que lo vuelves a mover?", "Palanca", ["Botón", "Placa de presión", "Cuerda trampa"], "El botón se apaga solo."],
      ["¿Qué bloque hace sonidos con redstone?", "Bloque de notas", ["Tocadiscos", "Campana", "Altavoz"], "Cambia el sonido según el bloque de abajo."],
      ["¿Cuánto dura la señal de un botón de piedra?", "1 segundo", ["1.5 segundos", "0.5 segundos", "3 segundos"], "El de madera dura 1.5 segundos."],
      ["¿Qué bloque siempre da señal sin necesidad de prenderlo?", "Bloque de redstone", ["Lámpara de redstone", "Antorcha apagada", "Polvo de redstone"], "Es como una fuente de energía fija."],
      ["¿Qué hace un riel detector?", "Da señal cuando pasa una vagoneta", ["Acelera la vagoneta", "Frena la vagoneta", "Cambia de vía"], "Sirve para estaciones automáticas."],
      ["¿Qué se necesita para craftear un comparador?", "Cuarzo del Nether", ["Diamante", "Oro", "Esmeralda"], "Tres antorchas de redstone, cuarzo y piedra."],
    ];
    // Más preguntas (se suman a la trivia normal)
    const TRIVIA_MAS = [
      ["¿Qué ingrediente convierte una botella de agua en poción rara, la base de casi todas?", "Verruga del Nether", ["Polvo de blaze", "Azúcar", "Ojo de araña"], "Casi todas las pociones empiezan con verruga del Nether."],
      ["¿Qué combustible usa el soporte para pociones?", "Polvo de blaze", ["Carbón", "Redstone", "Lava"], "Cada polvo de blaze aguanta 20 tandas."],
      ["¿Con qué ingrediente se hace la poción de visión nocturna?", "Zanahoria dorada", ["Ojo de araña", "Azúcar", "Crema de magma"], "Verruga del Nether + zanahoria dorada."],
      ["¿Qué ingrediente da la poción de respiración acuática?", "Pez globo", ["Bacalao", "Algas", "Corazón del mar"], "Con pez globo puedes respirar bajo el agua."],
      ["¿Qué ingrediente da la poción de resistencia al fuego?", "Crema de magma", ["Polvo de blaze", "Lágrima de ghast", "Carbón"], "Con ella puedes nadar en lava un rato."],
      ["¿Qué ingrediente da la poción de velocidad?", "Azúcar", ["Pluma", "Conejo", "Redstone"], "Verruga del Nether + azúcar."],
      ["¿Qué ingrediente da la poción de curación?", "Rodaja de sandía reluciente", ["Manzana dorada", "Lágrima de ghast", "Pan"], "La sandía reluciente se hace con pepitas de oro."],
      ["¿Qué ingrediente da la poción de caída lenta?", "Membrana de phantom", ["Pluma", "Fragmento de amatista", "Seda"], "La membrana la sueltan los phantoms."],
      ["¿Qué ingrediente da la poción de regeneración?", "Lágrima de ghast", ["Polvo de blaze", "Manzana", "Hueso"], "Las lágrimas las sueltan los ghasts."],
      ["¿Qué ingrediente da la poción de fuerza?", "Polvo de blaze", ["Hueso", "Hierro", "Pólvora"], "El polvo de blaze sirve de combustible y de ingrediente."],
      ["¿Qué ingrediente echa a perder una poción y la vuelve 'mala'?", "Ojo de araña fermentado", ["Carne podrida", "Pólvora", "Tinta"], "Por ejemplo, convierte la velocidad en lentitud."],
      ["¿Qué le agregas a una poción para que se pueda aventar?", "Pólvora", ["Redstone", "Piedra luminosa", "Aliento de dragón"], "Así se hace poción arrojadiza."],
      ["¿Qué le agregas a una poción para que dure más tiempo?", "Redstone", ["Piedra luminosa", "Pólvora", "Azúcar"], "La piedra luminosa la hace más fuerte pero más corta."],
      ["¿Qué hace el aliento de dragón en una poción arrojadiza?", "La vuelve persistente (deja una nube)", ["La hace más fuerte", "La hace durar 1 hora", "La vuelve invisible"], "Se junta con una botella al pegarle al dragón."],
      ["¿Qué mob suelta las varas de blaze?", "El blaze", ["El ghast", "El esqueleto del Wither", "El cubo de magma"], "Viven en las fortalezas del Nether."],
      ["¿Qué suelta el ghast?", "Lágrimas de ghast y pólvora", ["Perlas de ender", "Varas de blaze", "Huesos"], "Las lágrimas sirven para pociones y para el cristal del End."],
      ["¿Qué bloque te deja reaparecer en el Nether?", "Ancla de reaparición", ["Cama", "Faro", "Magnetita"], "Las camas explotan en el Nether."],
      ["¿Con qué se carga el ancla de reaparición?", "Piedra luminosa", ["Redstone", "Lava", "Polvo de blaze"], "Aguanta hasta 4 cargas."],
      ["¿De qué mineral sale la netherita?", "Escombros ancestrales", ["Cuarzo del Nether", "Oro del Nether", "Bloque de magma"], "Se funden y dan fragmentos de netherita."],
      ["¿Cuántos fragmentos de netherita se necesitan para un lingote?", "4", ["2", "8", "9"], "4 fragmentos y 4 lingotes de oro."],
      ["¿Dónde se mejora algo de diamante a netherita?", "En la mesa de herrería", ["En el yunque", "En la mesa de crafteo", "En la mesa de encantamientos"], "Con la plantilla y un lingote de netherita."],
      ["¿Dónde se encuentra la plantilla de mejora de netherita?", "En los bastiones", ["En las fortalezas del Nether", "En las aldeas", "En los templos del desierto"], "Se puede duplicar con diamantes y netherrack."],
      ["¿Cuántos corazones de vida tiene el jugador normalmente?", "10", ["5", "15", "20"], "Son 20 puntos de vida, o sea 10 corazones."],
      ["¿Cuántos bloques mide de ancho un chunk?", "16", ["8", "32", "64"], "Un chunk es de 16 x 16 bloques."],
      ["¿Qué pasa si a un aldeano le cae un rayo?", "Se vuelve bruja", ["Se vuelve zombi", "Se vuelve gólem", "Nada"], "Por eso hay que ponerles pararrayos."],
      ["¿Qué pasa si a un cerdo le cae un rayo?", "Se vuelve piglin zombificado", ["Se vuelve hoglin", "Se hace cerdo cargado", "Se muere y ya"], "El rayo transforma al cerdo."],
      ["¿Qué bloques forman el cuerpo del Wither?", "Arena o tierra de almas", ["Obsidiana", "Bloques de hierro", "Piedra del End"], "4 de arena o tierra de almas y 3 calaveras de esqueleto del Wither."],
      ["¿Cuántos bloques de hierro lleva un gólem de hierro?", "4", ["3", "5", "9"], "En forma de T, con una calabaza de cabeza."],
      ["¿Cuántos bloques de nieve lleva un gólem de nieve?", "2", ["1", "3", "4"], "Dos bloques de nieve y una calabaza arriba."],
      ["¿Con qué se reproducen las gallinas?", "Semillas", ["Pan", "Zanahorias", "Pescado"], "Cualquier tipo de semilla."],
      ["¿Con qué se reproducen los cerdos?", "Zanahorias", ["Trigo", "Semillas", "Manzanas"], "También con papas o betabel."],
      ["¿Dónde se encuentran las élitras?", "En los barcos de las ciudades del End", ["Las suelta el Ender Dragon", "En los bastiones", "En las fortalezas"], "Están en el marco de un barco flotante."],
      ["¿Qué suelta el shulker?", "Su caparazón", ["Una perla", "Una élitra", "Un huevo"], "Dos caparazones y un cofre hacen una caja de shulker."],
      ["¿Qué mob suelta el tótem de la inmortalidad?", "El evocador", ["La bruja", "El vindicador", "El saqueador"], "Salen en las mansiones del bosque y en las invasiones."],
      ["¿Qué invoca el evocador?", "Vexes", ["Phantoms", "Murciélagos", "Zombis"], "Los vexes atraviesan paredes."],
      ["¿Qué mob jefe protege los monumentos oceánicos?", "El guardián anciano", ["El ahogado", "El calamar", "El delfín"], "Hay 3 en cada monumento y te dan fatiga minera."],
      ["¿En qué bioma aparece el warden?", "La oscuridad profunda", ["Las cuevas frondosas", "El pantano", "El desierto"], "Es donde están las ciudades antiguas."],
      ["¿Qué bloque llama al warden si lo activas varias veces?", "El chillador de sculk", ["El sensor de sculk", "El catalizador de sculk", "La vena de sculk"], "Si lo activas varias veces, sale el warden."],
      ["¿Qué desentierra el sniffer?", "Semillas antiguas", ["Diamantes", "Huesos", "Huevos"], "La antorcha flor y la planta jarra salen de ahí."],
      ["¿Con qué se limpia la arena sospechosa?", "Con un pincel", ["Con una pala", "Con tijeras", "Con un pico"], "Así salen los fragmentos de cerámica."],
      ["¿Para qué sirven las escamas de armadillo?", "Para hacer armadura de lobo", ["Para pociones", "Para reparar élitras", "Para encantar"], "Se sacan cepillando al armadillo."],
      ["¿Qué arma salió en la 1.21 con las cámaras de prueba?", "El mazo", ["La lanza", "El hacha doble", "La ballesta"], "Pega más fuerte mientras más alto caes."],
      ["¿Con qué se craftea el mazo?", "Núcleo pesado y vara de breeze", ["Bloque de hierro y palo", "Obsidiana y vara de blaze", "Netherita y diamante"], "El núcleo pesado sale de las bóvedas ominosas."],
      ["¿Qué mob aparece en las cámaras de prueba y avienta ráfagas de viento?", "El breeze", ["El blaze", "El ghast", "El vex"], "Suelta varas de breeze."],
      ["¿Qué se abre con una llave de prueba?", "Una bóveda", ["Un cofre", "Un barril", "Un spawner"], "Cada jugador puede abrir cada bóveda una vez."],
      ["¿Cuántos bloques de lana lleva una cama?", "3", ["2", "4", "6"], "3 de lana y 3 tablas."],
      ["¿Qué maderas no se queman con el fuego?", "Carmesí y distorsionada", ["Roble y abedul", "Jungla y acacia", "Mangle y cerezo"], "Son las maderas del Nether."],
      ["¿Qué se necesita para hacer un conducto?", "Corazón del mar", ["Estrella del Nether", "Perla de ender", "Tridente"], "Y 8 conchas de nautilo."],
      ["¿Dónde se encuentra el corazón del mar?", "En los tesoros enterrados", ["En los barcos hundidos", "En los monumentos", "En las aldeas"], "Se encuentran con un mapa del tesoro."],
      ["¿Cuántos libreros necesitas para encantar al nivel 30?", "15", ["10", "20", "30"], "Con un bloque de aire entre la mesa y los libreros."],
      ["¿Qué necesitas, además de experiencia, para encantar en la mesa?", "Lapislázuli", ["Diamantes", "Redstone", "Esmeraldas"], "De 1 a 3 lapislázulis."],
      ["¿Qué encantamiento de botas congela el agua al caminar?", "Paso helado", ["Agilidad acuática", "Caída de pluma", "Velocidad del alma"], "Frost Walker."],
      ["¿Qué encantamiento te deja aguantar más bajo el agua?", "Respiración", ["Afinidad acuática", "Agilidad acuática", "Protección"], "Va en el casco."],
      ["¿Qué encantamiento NO se puede juntar con Infinidad en un arco?", "Reparación", ["Poder", "Fuego", "Retroceso"], "Infinidad y Mending no son compatibles."],
      ["¿Qué encantamiento de tridente te lanza cuando llueve o estás en el agua?", "Propulsión", ["Lealtad", "Canalización", "Empalamiento"], "Riptide."],
      ["¿Qué encantamiento hace que el tridente regrese solo?", "Lealtad", ["Propulsión", "Canalización", "Reparación"], "Loyalty."],
      ["¿Qué encantamiento invoca rayos con el tridente en tormenta?", "Canalización", ["Lealtad", "Propulsión", "Fuego"], "Channeling."],
      ["¿Cuál es el nivel máximo de Fortuna?", "III", ["II", "IV", "V"], "Fortuna III."],
      ["¿Cuál es el nivel máximo de Filo (Sharpness)?", "V", ["III", "IV", "X"], "Filo V."],
      ["¿Cuál es el nivel máximo de Protección?", "IV", ["III", "V", "II"], "Protección IV."],
      ["¿Cuál es el nivel máximo de Eficiencia?", "V", ["III", "IV", "X"], "Eficiencia V."],
      ["¿Qué encantamiento de pantalón te deja caminar rápido agachado?", "Sigilo veloz", ["Velocidad del alma", "Agilidad acuática", "Paso helado"], "Swift Sneak; solo sale en las ciudades antiguas."],
      ["¿Qué hace la Maldición de ligamiento?", "No te puedes quitar esa armadura", ["La armadura desaparece al morir", "Te hace más lento", "Te quita vida"], "Solo se quita si mueres o se rompe."],
      ["¿Qué hace la Maldición de desaparición?", "El objeto desaparece al morir", ["No te lo puedes quitar", "Se rompe más rápido", "No se puede reparar"], "No lo sueltas al morir: se borra."],
      ["¿A qué mob le tienen miedo los esqueletos?", "Al lobo", ["Al gato", "Al gólem", "A la abeja"], "Los esqueletos huyen de los lobos."],
      ["¿Qué mob no se quema con el sol?", "El husk", ["El zombi", "El esqueleto", "El stray"], "El zombi del desierto aguanta el sol."],
      ["¿Qué mob se divide en otros más chiquitos al morir?", "El slime", ["El creeper", "La lepisma", "El ghast"], "El cubo de magma también."],
      ["¿Qué mob sale de los bloques infestados?", "La lepisma", ["El endermite", "La araña de cueva", "El murciélago"], "Salen en fortalezas y montañas."],
      ["¿Cuántos puntos de vida tiene el Ender Dragon?", "200", ["100", "300", "500"], "Son 100 corazones."],
      ["¿Cuántos puntos de vida tiene el Wither?", "300", ["200", "150", "500"], "En Java son 150 corazones."],
      ["¿Qué le recupera la vida al Ender Dragon en la pelea?", "Los cristales del End", ["Las perlas de ender", "Los endermans", "El huevo de dragón"], "Hay que romper los cristales de las torres."],
      ["¿Qué deja el Ender Dragon la primera vez que lo matas?", "Un huevo de dragón", ["Una élitra", "Un tótem", "Una estrella del Nether"], "Aparece arriba del portal de salida."],
      ["¿Cómo se llega a las islas lejanas del End?", "Con un portal de acceso y una perla de ender", ["Nadando", "Con élitras desde el inicio", "Con un portal del Nether"], "Los portales de acceso salen después de matar al dragón."],
      ["¿Qué fruta te teletransporta al comerla?", "Fruta coral", ["Manzana", "Baya dulce", "Sandía"], "Crece en las islas del End."],
      ["¿Qué comida te da más saturación?", "Zanahoria dorada", ["Filete cocido", "Pan", "Manzana"], "Por eso es la favorita para aguantar más sin hambre."],
      ["¿Qué comida te puede dar el efecto de hambre?", "Carne podrida", ["Pan", "Galleta", "Papa cocida"], "Tiene 80% de probabilidad de darte hambre."],
      ["¿Cómo se consigue la manzana dorada encantada?", "Solo en cofres", ["Con bloques de oro", "En la mesa de encantamientos", "Comerciando con piglins"], "Ya no se puede craftear desde la 1.9."],
      ["¿Cuántos lingotes de oro lleva una manzana dorada?", "8", ["4", "9", "1"], "8 lingotes alrededor de la manzana."],
      ["¿Qué bloque convierte a un aldeano en bibliotecario?", "Atril", ["Librero", "Mesa de encantamientos", "Cofre"], "Los bibliotecarios venden libros encantados."],
      ["¿Qué bloque convierte a un aldeano en granjero?", "Compostador", ["Bloque de heno", "Cultivo de trigo", "Barril"], "Es su mesa de trabajo."],
      ["¿Qué bloque convierte a un aldeano en clérigo?", "Soporte para pociones", ["Atril", "Caldero", "Faro"], "Los clérigos venden perlas de ender."],
      ["¿Qué bloque convierte a un aldeano en pescador?", "Barril", ["Caldero", "Cofre", "Caña de pescar"], "Vende y compra cosas de pesca."],
      ["¿Qué bloque convierte a un aldeano en armero?", "Alto horno", ["Yunque", "Horno", "Mesa de herrería"], "Vende armadura."],
      ["¿Qué usan los aldeanos como dinero?", "Esmeraldas", ["Oro", "Diamantes", "Hierro"], "Comerciar con aldeanos da experiencia."],
      ["¿Qué mob comercia contigo si le das oro?", "El piglin", ["El aldeano", "El piglin bruto", "El hoglin"], "Te avienta algo a cambio del lingote."],
      ["¿Qué necesitas traer puesto para que los piglins no te ataquen?", "Una pieza de armadura de oro", ["Armadura de netherita", "Una calabaza", "Nada"], "Basta con una pieza."],
      ["¿Qué piglin no se deja calmar con oro?", "El piglin bruto", ["El piglin bebé", "El piglin zombificado", "El piglin normal"], "Vive en los bastiones y pega fuerte."],
      ["¿De qué huyen los hoglins?", "De los hongos distorsionados", ["De los hongos carmesí", "Del oro", "Del agua"], "También de los portales y del ancla de reaparición."],
      ["¿Qué mob del Nether puedes montar caminando sobre la lava?", "El strider", ["El hoglin", "El ghast", "El cubo de magma"], "Con silla y un hongo distorsionado en un palo."],
      ["¿Cuál es la altura máxima del mundo desde la 1.18?", "Y 320", ["Y 256", "Y 255", "Y 512"], "Se puede construir hasta ahí."],
      ["¿Cuál es la altura más baja del mundo desde la 1.18?", "Y -64", ["Y 0", "Y -32", "Y -128"], "Abajo está la bedrock."],
      ["¿Cuántos ticks tiene un segundo en Minecraft?", "20", ["10", "30", "60"], "Un tick es 1/20 de segundo."],
      ["¿Qué pasa si echas agua en el Nether?", "Se evapora", ["Se congela", "Se vuelve lava", "Funciona normal"], "No se puede poner agua en el Nether."],
      ["¿Qué se forma cuando el agua le cae a una fuente de lava?", "Obsidiana", ["Roca", "Piedra", "Basalto"], "Si la lava está corriendo, sale roca."],
      ["¿Qué bloque se forma con lava, hielo azul y tierra de almas abajo?", "Basalto", ["Obsidiana", "Piedra negra", "Magma"], "Así se hacen granjas de basalto."],
      ["¿Qué bloque bajo el agua hace burbujas que te suben?", "Arena de almas", ["Bloque de magma", "Hielo", "Esponja"], "El bloque de magma hace lo contrario: te jala hacia abajo."],
      ["¿Qué otro mob, además de la vaca, da leche?", "La cabra", ["La oveja", "El cerdo", "La llama"], "Con una cubeta."],
      ["¿Qué te quita todos los efectos de pociones de golpe?", "Tomar leche", ["Comer pan", "Dormir", "Meterte al agua"], "Quita los buenos y los malos."],
      ["¿Qué herramienta sirve para recoger hojas sin romperlas?", "Tijeras", ["Hacha", "Azada", "Pala"], "O cualquier herramienta con toque de seda."],
      ["¿Qué pico mina más rápido sin encantar?", "El de oro", ["El de diamante", "El de netherita", "El de hierro"], "Es el más rápido, pero se rompe luego luego."],
      ["¿Qué le pasa a una flecha si se la disparas a un enderman?", "No le pega: se teletransporta", ["Le baja el doble", "Lo prende en fuego", "Rebota y te pega a ti"], "Hay que pegarle cuerpo a cuerpo."],
      ["¿Qué mineral salió en la 1.17 y crece en geodas?", "La amatista", ["El cobre", "La esmeralda", "El cuarzo"], "Las geodas tienen capa de calcita y basalto liso."],
      ["¿Qué se necesita para hacer un catalejo?", "Cobre y fragmento de amatista", ["Vidrio y hierro", "Oro y diamante", "Vidrio y cobre"], "Un fragmento de amatista y dos lingotes de cobre."],
      ["¿Qué evita que el cobre se oxide?", "Ponerle cera (panal)", ["Ponerle agua", "Ponerle redstone", "Taparlo con lana"], "El cobre encerado ya no cambia de color."],
      ["¿Con qué se hace un pararrayos?", "Cobre", ["Hierro", "Oro", "Redstone"], "Tres lingotes de cobre en línea."],
      ["¿Con qué se alimenta a un ajolote?", "Cubeta con pez tropical", ["Bacalao cocido", "Algas", "Semillas"], "Así se reproducen."],
      ["¿Cuál es el ajolote más raro?", "El azul", ["El rosa", "El dorado", "El café"], "Sale muy de vez en cuando al criar."],
      ["¿Qué mob te trae los items iguales al que le das?", "El allay", ["El vex", "El zorro", "El loro"], "Y le gusta la música de los bloques de notas."],
      ["¿Qué sale cuando una rana se come un cubo de magma chiquito?", "Una luz de rana", ["Una crema de magma", "Un huevo de rana", "Un bloque de slime"], "El color depende del tipo de rana."],
      ["¿Cuántos jugadores se pueden subir a un camello?", "2", ["1", "3", "4"], "Por eso son buenos para viajar con alguien."],
      ["¿Qué tiene de especial el cofre de ender?", "Es tu mismo inventario en todos los cofres de ender", ["Guarda el doble", "No se puede romper", "Lo comparten todos los jugadores"], "Cada jugador ve sus propias cosas."],
      ["¿Qué suelta un cofre de ender si lo rompes sin toque de seda?", "Obsidiana", ["Nada", "Una perla de ender", "Tablas"], "Suelta 8 de obsidiana."],
      ["¿Qué hace la brújula en el Nether?", "Gira sin sentido", ["Apunta al portal", "Apunta a la fortaleza", "Funciona normal"], "Solo funciona allá si la conectas a una magnetita."],
      ["¿A qué bloque puede apuntar una brújula en cualquier dimensión?", "A la magnetita", ["Al faro", "A la cama", "Al cofre"], "Lodestone."],
      ["Si caminas 1 bloque en el Nether, ¿cuántos avanzas en el mundo normal?", "8", ["2", "4", "16"], "Por eso los portales sirven de atajo."],
      ["¿En qué estructura está el portal al End?", "En la fortaleza", ["En la fortaleza del Nether", "En el bastión", "En la ciudad antigua"], "Se encuentra con ojos de ender."],
      ["¿Qué estructura del Nether tiene generadores de blazes?", "La fortaleza del Nether", ["El bastión", "El portal en ruinas", "El fósil"], "Ahí también salen los esqueletos del Wither."],
      ["¿Qué trampa tiene el templo del desierto?", "TNT debajo de una placa de presión", ["Lava en el techo", "Flechas en las paredes", "Un spawner de arañas"], "No pises la placa del centro."],
      ["¿Qué mob de cueva te asusta con su chillido y vuela?", "El murciélago", ["El phantom", "El vex", "El allay"], "No hace daño."],
      ["¿Qué mob se puede ordeñar con un bol para sacar sopa de hongos?", "La champiñaca", ["La vaca", "La cabra", "La oveja"], "Mooshroom."],
      ["¿Qué item hace que un loro se muera si se lo das?", "Galleta", ["Semillas", "Pan", "Manzana"], "Nunca le des galletas a un loro."],
      ["¿Qué pasa si le das una zanahoria en un palo a un cerdo con silla?", "Lo puedes manejar", ["Se duerme", "Se hace más grande", "Se escapa"], "Así se controla al cerdo."],
      ["¿Qué mob sale de los huevos de tortuga?", "Tortugas bebé", ["Ranas", "Ajolotes", "Peces"], "Los huevos se rompen si los pisas."],
      ["¿Qué suelta una tortuga bebé cuando crece?", "Un caparazón (escama de tortuga)", ["Un huevo", "Algas", "Una perla"], "Con 5 se hace el casco de tortuga."],
      ["¿Qué te da el casco de tortuga?", "Respirar más tiempo bajo el agua", ["Nadar más rápido", "Ver en la oscuridad", "No hundirte"], "Te da respiración acuática unos segundos."],
    ];
    TRIVIA.push(...TRIVIA_MAS);
    const aPregunta = ([p, c, malas, x], tipo = "Trivia", ic = "pregunta") => ({ tipo, ic, titulo: p, opciones: barajar([c, ...malas]).map(t => ({ texto: t })), correcta: c, explicar: x });
    App.trivia = TRIVIA.concat(REDSTONE);
    App.triviaPregunta = () => aPregunta(App.trivia[Math.floor(Math.random() * App.trivia.length)]);

    function trivia(banco, titulo, llave, tipo, ic) {
      const ronda = barajar(banco).slice(0, 10);
      let i = 0, puntos = 0;
      const v = ventana(titulo, [["p", "Pregunta", "1/10"], ["a", "Aciertos", "0"], ["r", "Récord", num(leer(llave, 0))]]);
      function sig() {
        if (i >= ronda.length) {
          const r = record(llave, puntos);
          return final(v.zona, { etiqueta: "RESULTADO", numero: `${puntos}/10`, texto: (puntos >= 9 ? "Experto total." : puntos >= 6 ? "Sabes bastante." : "A repasar.") + (r.nuevo ? " ¡Nuevo récord!" : ""), otra: () => { v.cerrar(); setTimeout(() => trivia(banco, titulo, llave, tipo, ic), 220); }, compartirTxt: `Saqué ${puntos}/10 en ${titulo} de la 224.` });
        }
        v.vals.p.textContent = `${i + 1}/10`;
        const pie = el("button", { class: "btn juego-btn juego-sig", type: "button", hidden: true, text: i === 9 ? "Ver resultado" : "Siguiente", onclick: () => { i++; sig(); } });
        v.zona.replaceChildren(pintarPregunta(aPregunta(ronda[i], tipo, ic), bien => { if (bien) { puntos++; v.vals.a.textContent = puntos; } pie.hidden = false; pie.focus(); }, { pie }));
      }
      sig();
    }

    // =====================================================
    // CARAS DE MOBS EN PIXEL ART (8x8)
    // =====================================================
    const MOBS = {
      Creeper: { c: { G: "#4caf50", g: "#2e7d32", K: "#111" }, p: ["GGgGGGgG", "GgGGGgGG", "GKKGGKKG", "GKKGGKKG", "GGGKKGGG", "GgKKKKgG", "GGKKKKGG", "GGKGGKGG"] },
      Zombi: { c: { Z: "#3c8f3c", z: "#2f6b2f", k: "#1d2b1d" }, p: ["zzzzzzzz", "zZZzZZzz", "ZZZZZZZZ", "ZZZZZZZZ", "ZkkZZkkZ", "ZZZzzZZZ", "ZZzZZzZZ", "ZZZZZZZZ"] },
      Esqueleto: { c: { S: "#c9c9c9", s: "#9e9e9e", K: "#1a1a1a" }, p: ["SSSSSSSS", "SsSSSSsS", "SSSSSSSS", "SKKSSKKS", "SSSssSSS", "SSSKKSSS", "SsKKKKsS", "SSSSSSSS"] },
      Enderman: { c: { E: "#161616", e: "#262626", P: "#e079fa", p: "#cc00fa" }, p: ["EEEEEEEE", "EeEEEEeE", "EEEEEEEE", "EEEEEEEE", "pPpEEpPp", "EEEEEEEE", "EEeEEeEE", "EEEEEEEE"] },
      Cerdo: { c: { P: "#f0a5a2", W: "#fff", K: "#000", N: "#d77b7b", n: "#8a4a4a" }, p: ["PPPPPPPP", "PPPPPPPP", "PPPPPPPP", "WKPPPPKW", "PPNNNNPP", "PPnNNnPP", "PPNNNNPP", "PPPPPPPP"] },
      Oveja: { c: { L: "#e8e8e8", F: "#d9c3a5", W: "#fff", K: "#000", R: "#e8a0a0" }, p: ["LLLLLLLL", "LFFFFFFL", "LFFFFFFL", "LWKFFKWL", "LFFFFFFL", "LFFRRFFL", "LFFFFFFL", "LLLLLLLL"] },
      Gallina: { c: { W: "#f5f5f5", K: "#000", Y: "#f2b632", R: "#d32f2f" }, p: ["WWWWWWWW", "WWWWWWWW", "WKWWWWKW", "WWYYYYWW", "WWYYYYWW", "WWWRRWWW", "WWWRRWWW", "WWWWWWWW"] },
      "Araña": { c: { D: "#3a3330", d: "#2a2420", R: "#c62828", r: "#ff5252" }, p: ["DDDDDDDD", "DdDDDDdD", "DrRDDRrD", "DDRDDRDD", "DDDDDDDD", "DdDDDDdD", "DDdDDdDD", "DDDDDDDD"] },
      Slime: { c: { G: "#7ccf6a", g: "#5aa04a", K: "#2d5a24" }, p: ["GGGGGGGG", "GggggggG", "GKKggKKG", "GKKggKKG", "GggggggG", "GggKgggG", "GggggggG", "GGGGGGGG"] },
      Blaze: { c: { Y: "#f6c142", y: "#e59a2b", K: "#3b2a0a" }, p: ["YYYYYYYY", "YyYYYYyY", "YYYYYYYY", "YKKYYKKY", "YYYyyYYY", "YYKKKKYY", "YyYYYYyY", "YYYYYYYY"] },
      Aldeano: { c: { S: "#bd8b72", s: "#a0705a", H: "#5a3b2a", G: "#2e7d32", W: "#fff", N: "#9c6b55" }, p: ["SSSSSSSS", "SSSSSSSS", "SHHHHHHS", "WGSNNSGW", "SSSNNSSS", "SSSNNSSS", "SsSSSSsS", "SSSSSSSS"] },
      Ghast: { c: { W: "#f1f1f1", w: "#d6d6d6", K: "#555" }, p: ["WWWWWWWW", "WWWWWWWW", "WWWWWWWW", "WKKWWKKW", "WWWWWWWW", "WWKKKKWW", "WWKwwKWW", "WWWWWWWW"] },
      Vaca: { c: { B: "#4b3628", W: "#e6e6e6", K: "#000", N: "#9e9e9e", n: "#555" }, p: ["BBBBBBBB", "BWWBBBBB", "BWWBBBBB", "BKBBBBKB", "BBBBBBBB", "BNNNNNNB", "BNnNNnNB", "BNNNNNNB"] },
      "Gólem de hierro": { c: { I: "#d8d3cb", i: "#bab3a8", R: "#a83a2b", N: "#a8957f" }, p: ["IIIIIIII", "IiiiiiiI", "IIIIIIII", "IRIIIIRI", "IIINNIII", "IIINNIII", "IiIIIIiI", "IIIIIIII"] },
      "Esqueleto del Wither": { c: { D: "#2b2b2b", d: "#3d3d3d", K: "#0b0b0b" }, p: ["DDDDDDDD", "DdDDDDdD", "DDDDDDDD", "DKKDDKKD", "DDDddDDD", "DDDKKDDD", "DdKKKKdD", "DDDDDDDD"] },
    };
    // Caras con la textura del juego: [textura, ancho base, x, y, ancho, alto, x destino, y destino, (ancho destino, alto destino)]
    const MOBS_TEX = {"Creeper": {"w": 8, "h": 8, "capas": [["creeper", 64, 8, 8, 8, 8, 0, 0]]}, "Zombi": {"w": 8, "h": 8, "capas": [["zombie", 64, 8, 8, 8, 8, 0, 0], ["zombie", 64, 40, 8, 8, 8, 0, 0]]}, "Esqueleto": {"w": 8, "h": 8, "capas": [["skeleton", 64, 8, 8, 8, 8, 0, 0]]}, "Enderman": {"w": 8, "h": 8, "capas": [["enderman", 64, 8, 8, 8, 8, 0, 0], ["enderman_ojos", 64, 8, 8, 8, 8, 0, 0]]}, "Cerdo": {"w": 8, "h": 8, "capas": [["pig", 64, 8, 8, 8, 8, 0, 0], ["pig", 64, 17, 17, 4, 3, 2, 4]]}, "Oveja": {"w": 8, "h": 8, "capas": [["sheep_lana", 64, 6, 6, 6, 6, 0, 0, 8, 8], ["sheep", 64, 8, 8, 6, 6, 1, 1]]}, "Gallina": {"w": 4, "h": 6, "capas": [["chicken", 64, 3, 3, 4, 6, 0, 0], ["chicken", 64, 16, 2, 4, 2, 0, 2]]}, "Araña": {"w": 8, "h": 8, "capas": [["spider", 64, 40, 12, 8, 8, 0, 0], ["spider_ojos", 64, 40, 12, 8, 8, 0, 0]]}, "Slime": {"w": 8, "h": 8, "capas": [["slime", 64, 6, 22, 6, 6, 1, 1], ["slime", 64, 34, 2, 2, 2, 0.75, 2], ["slime", 64, 34, 6, 2, 2, 5.25, 2], ["slime", 64, 33, 9, 1, 1, 4, 5], ["slime", 64, 8, 8, 8, 8, 0, 0]]}, "Blaze": {"w": 8, "h": 8, "capas": [["blaze", 64, 8, 8, 8, 8, 0, 0]]}, "Aldeano": {"w": 8, "h": 10, "capas": [["villager", 64, 8, 8, 8, 10, 0, 0], ["villager", 64, 26, 2, 2, 4, 3, 7]]}, "Ghast": {"w": 16, "h": 16, "capas": [["ghast", 64, 16, 16, 16, 16, 0, 0]]}, "Vaca": {"w": 8, "h": 8, "capas": [["cow", 64, 6, 6, 8, 8, 0, 0], ["cow", 64, 2, 34, 4, 3, 2, 5]]}, "Gólem de hierro": {"w": 8, "h": 10, "capas": [["iron_golem", 128, 8, 8, 8, 10, 0, 0], ["iron_golem", 128, 26, 2, 2, 4, 3, 7]]}, "Esqueleto del Wither": {"w": 8, "h": 8, "capas": [["wither_skeleton", 64, 8, 8, 8, 8, 0, 0]]}, "Bruja": {"w": 8, "h": 10, "capas": [["witch", 64, 8, 8, 8, 10, 0, 0], ["witch", 64, 26, 2, 2, 4, 3, 7]]}, "Piglin": {"w": 10, "h": 8, "capas": [["piglin", 64, 8, 8, 10, 8, 0, 0], ["piglin", 64, 32, 2, 4, 4, 3, 4]]}, "Ahogado": {"w": 8, "h": 8, "capas": [["drowned", 64, 8, 8, 8, 8, 0, 0], ["drowned_capa", 64, 8, 8, 8, 8, 0, 0]]}, "Husk": {"w": 8, "h": 8, "capas": [["husk", 64, 8, 8, 8, 8, 0, 0], ["husk", 64, 40, 8, 8, 8, 0, 0]]}, "Stray": {"w": 8, "h": 8, "capas": [["stray", 64, 8, 8, 8, 8, 0, 0], ["stray_capa", 64, 8, 8, 8, 8, 0, 0]]}};
    const mobConTextura = n => MOBS_TEX[n] && MOBS_TEX[n].capas.every(c => TEX["mob_" + c[0]]);
    const mobsDisponibles = () => [...new Set([...Object.keys(MOBS), ...Object.keys(MOBS_TEX)])].filter(n => mobConTextura(n) || MOBS[n]);
    const celdasMob = n => mobConTextura(n) ? MOBS_TEX[n].w * MOBS_TEX[n].h : 64;
    function caraMobTex(nombre, tam, oculto) {
      const m = MOBS_TEX[nombre], px = tam / Math.max(m.w, m.h);
      const [c, g] = lienzoPixel(Math.round(m.w * px), Math.round(m.h * px));
      for (const [t, base, sx, sy, sw, sh, dx, dy, dw = sw, dh = sh] of m.capas) {
        const im = TEX["mob_" + t], k = im.naturalWidth / base;
        g.drawImage(im, sx * k, sy * k, sw * k, sh * k, dx * px, dy * px, dw * px, dh * px);
      }
      if (oculto) for (const n of oculto) {
        const x = n % m.w, y = Math.floor(n / m.w);
        g.fillStyle = "#2a3430"; g.fillRect(x * px, y * px, Math.ceil(px), Math.ceil(px));
        g.fillStyle = "#33403b"; g.fillRect(x * px + 2, y * px + 2, px - 4, px - 4);
      }
      c.className = "pixel mob-cara" + (m.w !== m.h ? " no-cuadrada" : "");
      return c;
    }
    // El creeper del buscaminas y de los reflejos, con la textura del juego si está
    const creeperTex = () => mobConTextura("Creeper") ? `<img class="pixel" alt="" style="width:100%;height:100%;image-rendering:pixelated" src="${caraMobTex("Creeper", 64).toDataURL()}">` : null;
    function caraMob(nombre, tam = 160, oculto = null) {
      if (mobConTextura(nombre)) return caraMobTex(nombre, tam, oculto);
      const m = MOBS[nombre], c = document.createElement("canvas"); c.width = c.height = tam;
      const g = c.getContext("2d"), px = tam / 8;
      m.p.forEach((fila, y) => [...fila].forEach((ch, x) => {
        const tapado = oculto && oculto.has(y * 8 + x);
        g.fillStyle = tapado ? "#2a3430" : m.c[ch];
        g.fillRect(x * px, y * px, Math.ceil(px), Math.ceil(px));
        if (tapado) { g.fillStyle = "#33403b"; g.fillRect(x * px + 2, y * px + 2, px - 4, px - 4); }
      }));
      c.className = "pixel mob-cara";
      return c;
    }

    function adivinaMob() {
      const nombres = mobsDisponibles(), ronda = barajar(nombres).slice(0, 10);
      let i = 0, puntos = 0, reloj = null;
      const v = ventana("Adivina el mob", [["p", "Ronda", "1/10"], ["a", "Puntos", "0"], ["r", "Récord", num(leer("record-mob", 0))]], { alCerrar: () => clearInterval(reloj) });
      function sig() {
        clearInterval(reloj);
        if (i >= ronda.length) {
          const r = record("record-mob", puntos);
          return final(v.zona, { etiqueta: "PUNTOS", numero: num(puntos), texto: "Mientras más rápido adivinas, más puntos." + (r.nuevo ? " ¡Nuevo récord!" : ""), otra: () => { v.cerrar(); setTimeout(adivinaMob, 220); }, compartirTxt: `Hice ${puntos} puntos adivinando mobs en la página de la 224.` });
        }
        v.vals.p.textContent = `${i + 1}/10`;
        const mob = ronda[i];
        const celdas = celdasMob(mob), ocultos = new Set(barajar([...Array(celdas).keys()]).slice(0, Math.round(celdas * 0.85)));
        const porSegundo = Math.max(2, Math.round(celdas / 10));
        const lienzo = el("div", { class: "mob-lienzo" }, caraMob(mob, 200, ocultos));
        const ops = barajar([mob, ...barajar(nombres.filter(n => n !== mob)).slice(0, 3)]);
        let valor = 100;
        const valorEl = el("small", { class: "mob-valor", text: "Vale 100 puntos" });
        const pie = el("button", { class: "btn juego-btn juego-sig", type: "button", hidden: true, text: i === 9 ? "Ver resultado" : "Siguiente", onclick: () => { i++; sig(); } });
        const q = { tipo: "Adivina el mob", ic: "ojo", titulo: "¿Qué mob es? Se va destapando…", opciones: ops.map(t => ({ texto: t })), correcta: mob, explicar: `Era ${({ "Araña": "una araña", "Bruja": "una bruja", "Oveja": "una oveja", "Gallina": "una gallina", "Vaca": "una vaca" })[mob] || mob}.` };
        const vista = pintarPregunta(q, bien => {
          clearInterval(reloj);
          lienzo.replaceChildren(caraMob(mob, 200));
          if (bien) { puntos += valor; v.vals.a.textContent = num(puntos); }
          pie.hidden = false; pie.focus();
        }, { pie });
        vista.querySelector("h3").after(lienzo, valorEl);
        v.zona.replaceChildren(vista);
        reloj = setInterval(() => {
          // Destapa 6 pixeles por segundo; cada vez vale menos
          const lista = [...ocultos]; barajar(lista).slice(0, porSegundo).forEach(k => ocultos.delete(k));
          valor = Math.max(10, valor - 10); valorEl.textContent = `Vale ${valor} puntos`;
          lienzo.replaceChildren(caraMob(mob, 200, ocultos));
          if (!ocultos.size) clearInterval(reloj);
        }, 1000);
      }
      sig();
    }

    // =====================================================
    // CRAFTEO: ¿qué sale de esta receta?
    // =====================================================
    // [nombre, color de respaldo, textura del juego]
    const ING = { T: ["Tablas", "#b8945f", "bloque_oak_planks"], P: ["Palo", "#8a6a3d", "item_stick"], C: ["Carbón", "#2b2b2b", "item_coal"], R: ["Roca", "#7d7d7d", "bloque_cobblestone"],
      H: ["Hierro", "#d8d8d8", "item_iron_ingot"], Tr: ["Trigo", "#d9c34a", "item_wheat"], L: ["Lana", "#efefef", "bloque_white_wool"], Rs: ["Redstone", "#c0241b", "item_redstone"],
      O: ["Oro", "#f2c94c", "item_gold_ingot"], Pv: ["Pólvora", "#5b5b5b", "item_gunpowder"], A: ["Arena", "#e0d3a0", "bloque_sand"], Lb: ["Libro", "#7a4b2a", "item_book"],
      D: ["Diamante", "#5fd0e8", "item_diamond"], Ob: ["Obsidiana", "#2b1b3d", "bloque_obsidian"], BH: ["Bloque de hierro", "#c9c9c9", "bloque_iron_block"], Cu: ["Cuerda", "#f4f4f4", "item_string"],
      V: ["Vidrio", "#bfe6f2", "bloque_glass"], En: ["Estrella del Nether", "#fffbe0", "item_nether_star"], Pa: ["Papel", "#f3f3ea", "item_paper"], Cr: ["Cuero", "#a0613a", "item_leather"],
      Ca: ["Caña de azúcar", "#8fcf5a", "item_sugar_cane"], Le: ["Cubeta de leche", "#f5f5f5", "item_milk_bucket"], Az: ["Azúcar", "#fafafa", "item_sugar"], Hu: ["Huevo", "#e9d7b0", "item_egg"],
      Pe: ["Perla de ender", "#1f6f61", "item_ender_pearl"], Bp: ["Polvo de blaze", "#f2a12c", "item_blaze_powder"], Pd: ["Pedernal", "#4a4a4a", "item_flint"], Pl: ["Pluma", "#f0f0f0", "item_feather"],
      Cb: ["Cobre", "#d9875b", "item_copper_ingot"], Am: ["Fragmento de amatista", "#a77fdc", "item_amethyst_shard"], An: ["Antorcha", "#f2c94c", "bloque_torch"] };
    // [lo que sale, receta 3x3, textura del resultado]
    const RECETAS = [
      ["Mesa de crafteo", ["T", "T", "", "T", "T", "", "", "", ""], "bloque_crafting_table_front"],
      ["Antorcha", ["", "C", "", "", "P", "", "", "", ""], "bloque_torch"],
      ["Pico de piedra", ["R", "R", "R", "", "P", "", "", "P", ""], "item_stone_pickaxe"],
      ["Espada de hierro", ["", "H", "", "", "H", "", "", "P", ""], "item_iron_sword"],
      ["Horno", ["R", "R", "R", "R", "", "R", "R", "R", "R"], "bloque_furnace_front"],
      ["Cofre", ["T", "T", "T", "T", "", "T", "T", "T", "T"], null],
      ["Cubeta", ["H", "", "H", "", "H", "", "", "", ""], "item_bucket"],
      ["Pan", ["", "", "", "Tr", "Tr", "Tr", "", "", ""], "item_bread"],
      ["Cama", ["L", "L", "L", "T", "T", "T", "", "", ""], null],
      ["Escalera de mano", ["P", "", "P", "P", "P", "P", "P", "", "P"], "bloque_ladder"],
      ["Barco", ["T", "", "T", "T", "T", "T", "", "", ""], "item_oak_boat"],
      ["Brújula", ["", "H", "", "H", "Rs", "H", "", "H", ""], null],
      ["Reloj", ["", "O", "", "O", "Rs", "O", "", "O", ""], null],
      ["TNT", ["Pv", "A", "Pv", "A", "Pv", "A", "Pv", "A", "Pv"], "bloque_tnt_side"],
      ["Mesa de encantamientos", ["", "Lb", "", "D", "Ob", "D", "Ob", "Ob", "Ob"], "bloque_enchanting_table_side"],
      ["Yunque", ["BH", "BH", "BH", "", "H", "", "H", "H", "H"], null],
      ["Arco", ["", "P", "Cu", "P", "", "Cu", "", "P", "Cu"], "item_bow"],
      ["Faro", ["V", "V", "V", "V", "En", "V", "Ob", "Ob", "Ob"], "bloque_beacon"],
      ["Pistón", ["T", "T", "T", "R", "H", "R", "R", "Rs", "R"], "bloque_piston_side"],
      ["Puerta de madera", ["T", "T", "", "T", "T", "", "T", "T", ""], "item_oak_door"],
      ["Escudo", ["T", "H", "T", "T", "T", "T", "", "T", ""], null],
      ["Pico de diamante", ["D", "D", "D", "", "P", "", "", "P", ""], "item_diamond_pickaxe"],
      ["Pala de hierro", ["", "H", "", "", "P", "", "", "P", ""], "item_iron_shovel"],
      ["Hacha de piedra", ["R", "R", "", "R", "P", "", "", "P", ""], "item_stone_axe"],
      ["Azada de hierro", ["H", "H", "", "", "P", "", "", "P", ""], "item_iron_hoe"],
      ["Casco de hierro", ["H", "H", "H", "H", "", "H", "", "", ""], "item_iron_helmet"],
      ["Peto de hierro", ["H", "", "H", "H", "H", "H", "H", "H", "H"], "item_iron_chestplate"],
      ["Pantalones de hierro", ["H", "H", "H", "H", "", "H", "H", "", "H"], "item_iron_leggings"],
      ["Botas de hierro", ["", "", "", "H", "", "H", "H", "", "H"], "item_iron_boots"],
      ["Papel", ["", "", "", "Ca", "Ca", "Ca", "", "", ""], "item_paper"],
      ["Libro", ["Pa", "Pa", "", "Pa", "Cr", "", "", "", ""], "item_book"],
      ["Pastel", ["Le", "Le", "Le", "Az", "Hu", "Az", "Tr", "Tr", "Tr"], "item_cake"],
      ["Antorcha de redstone", ["", "Rs", "", "", "P", "", "", "", ""], "bloque_redstone_torch"],
      ["Palanca", ["", "P", "", "", "R", "", "", "", ""], "bloque_lever"],
      ["Caña de pescar", ["", "", "P", "", "P", "Cu", "P", "", "Cu"], "item_fishing_rod"],
      ["Tijeras", ["", "H", "", "H", "", "", "", "", ""], "item_shears"],
      ["Vagoneta", ["", "", "", "H", "", "H", "H", "H", "H"], "item_minecart"],
      ["Rieles", ["H", "", "H", "H", "P", "H", "H", "", "H"], "bloque_rail"],
      ["Bloque de diamante", ["D", "D", "D", "D", "D", "D", "D", "D", "D"], "bloque_diamond_block"],
      ["Ojo de ender", ["", "", "", "Pe", "Bp", "", "", "", ""], "item_ender_eye"],
      ["Bol", ["", "", "", "T", "", "T", "", "T", ""], "item_bowl"],
      ["Flecha", ["", "Pd", "", "", "P", "", "", "Pl", ""], "item_arrow"],
      ["Catalejo", ["", "Am", "", "", "Cb", "", "", "Cb", ""], "item_spyglass"],
      ["Manzana dorada", ["O", "O", "O", "O", "", "O", "O", "O", "O"], null],
      ["Librero", ["T", "T", "T", "Lb", "Lb", "Lb", "T", "T", "T"], "bloque_bookshelf"],
      ["Barrotes de hierro", ["", "", "", "H", "H", "H", "H", "H", "H"], "bloque_iron_bars"],
    ];
    // La manzana dorada lleva una manzana en medio
    RECETAS.find(r => r[0] === "Manzana dorada")[1][4] = "Mz";
    RECETAS.find(r => r[0] === "Manzana dorada")[2] = "item_golden_apple";
    RECETAS.find(r => r[0] === "Brújula")[2] = "item_compass";
    RECETAS.find(r => r[0] === "Reloj")[2] = "item_clock";
    ING.Mz = ["Manzana", "#d32f2f", "item_apple"];
    const iconoTex = (clave, clase) => {
      const im = clave && TEX[clave];
      if (!im) return null;
      // Las texturas animadas (como el fuego) vienen en tira: se toma el primer cuadro
      const lado = Math.min(im.naturalWidth, im.naturalHeight);
      const [c, g] = lienzoPixel(lado, lado);
      g.drawImage(im, 0, 0, lado, lado, 0, 0, lado, lado);
      c.className = "pixel " + clase;
      return c;
    };
    function rejillaReceta(cel) {
      return el("div", { class: "receta" }, cel.map(k => {
        if (!k) return el("span", { class: "receta-cel vacia" });
        const tex = iconoTex(ING[k][2], "receta-tex");
        return el("span", { class: "receta-cel" + (tex ? " con-tex" : ""), style: `--c:${ING[k][1]}`, title: ING[k][0] }, tex || el("i"), el("small", { text: ING[k][0] }));
      }));
    }
    function crafteo() {
      const ronda = barajar(RECETAS).slice(0, 10);
      let i = 0, puntos = 0;
      const v = ventana("Crafteo", [["p", "Receta", "1/10"], ["a", "Aciertos", "0"], ["r", "Récord", num(leer("record-crafteo", 0))]]);
      function sig() {
        if (i >= ronda.length) {
          const r = record("record-crafteo", puntos);
          return final(v.zona, { etiqueta: "RESULTADO", numero: `${puntos}/10`, texto: (puntos >= 9 ? "Te sabes las recetas de memoria." : puntos >= 6 ? "Buen crafteador." : "A abrir el libro de recetas.") + (r.nuevo ? " ¡Nuevo récord!" : ""), otra: () => { v.cerrar(); setTimeout(crafteo, 220); }, compartirTxt: `Saqué ${puntos}/10 en Crafteo de la 224.` });
        }
        v.vals.p.textContent = `${i + 1}/10`;
        const [res, cel, texRes] = ronda[i];
        const ops = barajar([res, ...barajar(RECETAS.map(r => r[0]).filter(n => n !== res)).slice(0, 3)]);
        const pie = el("button", { class: "btn juego-btn juego-sig", type: "button", hidden: true, text: i === 9 ? "Ver resultado" : "Siguiente", onclick: () => { i++; sig(); } });
        // La casilla del resultado: "?" hasta que contestas
        const salida = el("span", { class: "receta-salida", "aria-label": "Resultado" }, el("b", { text: "?" }));
        const vista = pintarPregunta({ tipo: "Crafteo", ic: "estrella", titulo: "¿Qué sale de esta receta?", opciones: ops.map(t => ({ texto: t })), correcta: res, explicar: `Sale: ${res}.` },
          bien => {
            if (bien) { puntos++; v.vals.a.textContent = puntos; }
            salida.replaceChildren(iconoTex(texRes, "receta-tex") || el("small", { text: res }));
            salida.classList.add("revelada");
            pie.hidden = false; pie.focus();
          }, { pie });
        vista.querySelector("h3").after(el("div", { class: "receta-mesa" }, rejillaReceta(cel), el("span", { class: "receta-flecha", "aria-hidden": "true", text: "➜" }), salida));
        v.zona.replaceChildren(vista);
      }
      sig();
    }

    // =====================================================
    // WORDLE DE MINECRAFT (5 letras)
    // =====================================================
    const PALABRAS = ["ZOMBI", "BLAZE", "GHAST", "SLIME", "PANDA", "LLAMA", "CERDO", "OVEJA", "POLLO", "CABRA", "ZORRO", "ABEJA", "HONGO", "TRIGO", "PERLA", "ARENA", "GRAVA", "ARBOL", "LIBRO", "TOTEM",
      "NIEVE", "MELON", "HACHA", "PALAS", "BOTAS", "CASCO", "TABLA", "BARCO", "CAMAS", "HORNO", "COFRE", "MAPAS", "RELOJ", "CARNE", "PECES", "FUEGO", "PASTO", "HIELO", "BAMBU", "COBRE",
      "VACAS", "GATOS", "LOBOS", "HUEVO", "BRUJA", "ALDEA", "GOLEM", "CUEVA", "MINAS", "TAIGA", "LANZA", "ARCOS", "PICOS", "PLUMA", "CUERO", "MUROS", "VALLA", "TORRE", "LIANA", "NUBES"];
    function wordle(libre = false) {
      const hoy = hoyClave();
      const est = leer("wordle", { dias: {} });
      const r = aleatorio("wordle-224-" + hoy);
      const palabra = libre ? PALABRAS[Math.floor(Math.random() * PALABRAS.length)] : PALABRAS[Math.floor(r() * PALABRAS.length)];
      if (!libre && est.dias[hoy]) { libre = true; }
      const intentos = [], N = 6;
      let actual = "", terminado = false;
      const v = ventana(libre ? "Wordle libre" : "Wordle del día", [["i", "Intento", "1/6"], ["r", "Ganados", num(leer("record-wordle", 0))]], { ancho: 520 });
      const tablero = el("div", { class: "wordle" });
      const teclado = el("div", { class: "wordle-teclado" });
      const nota = el("p", { class: "juego-nota", "aria-live": "polite", text: libre ? "Palabra al azar. Puedes jugar las que quieras." : "Una palabra de Minecraft al día, igual para todos." });
      const filas = Array.from({ length: N }, () => el("div", { class: "wordle-fila" }, Array.from({ length: 5 }, () => el("span", { class: "wordle-cel" }))));
      tablero.append(...filas);
      const estadoLetra = {};
      const TECLAS = ["QWERTYUIOP", "ASDFGHJKLÑ", "+ZXCVBNM-"];
      function pintarTeclado() {
        teclado.replaceChildren(...TECLAS.map(f => el("div", { class: "wordle-tfila" }, [...f].map(k => {
          const t = k === "+" ? "Enviar" : k === "-" ? "Borrar" : k;
          return el("button", { type: "button", class: "wordle-tecla " + (estadoLetra[k] || "") + (k === "+" || k === "-" ? " ancha" : ""), text: t, onclick: () => tecla(k === "+" ? "Enter" : k === "-" ? "Backspace" : k) });
        }))));
      }
      function pintarFila(n, letras, colores = []) {
        [...filas[n].children].forEach((c, k) => { c.textContent = letras[k] || ""; c.className = "wordle-cel " + (colores[k] || (letras[k] ? "llena" : "")); });
      }
      function evaluar(g) {
        const res = Array(5).fill("no"), resto = {};
        [...palabra].forEach((ch, k) => { if (g[k] === ch) res[k] = "si"; else resto[ch] = (resto[ch] || 0) + 1; });
        [...g].forEach((ch, k) => { if (res[k] !== "si" && resto[ch]) { res[k] = "casi"; resto[ch]--; } });
        return res;
      }
      function tecla(k) {
        if (terminado) return;
        if (k === "Backspace") { actual = actual.slice(0, -1); pintarFila(intentos.length, actual); return; }
        if (k === "Enter") {
          if (actual.length < 5) { nota.textContent = "Faltan letras."; return; }
          const colores = evaluar(actual);
          pintarFila(intentos.length, actual, colores);
          [...actual].forEach((ch, x) => { const c = colores[x]; if (c === "si" || (c === "casi" && estadoLetra[ch] !== "si") || (c === "no" && !estadoLetra[ch])) estadoLetra[ch] = c; });
          intentos.push(colores);
          const gano = actual === palabra;
          actual = "";
          pintarTeclado();
          if (gano || intentos.length >= N) return terminar(gano);
          v.vals.i.textContent = `${intentos.length + 1}/6`;
          return;
        }
        if (/^[A-ZÑ]$/.test(k) && actual.length < 5) { actual += k; pintarFila(intentos.length, actual); }
      }
      function terminar(gano) {
        terminado = true;
        removeEventListener("keydown", tecladoFisico);
        if (gano) { const g = leer("record-wordle", 0) + 1; guardar("record-wordle", g); v.vals.r.textContent = num(g); }
        const cuadros = intentos.map(f => f.map(c => c === "si" ? "■" : c === "casi" ? "▣" : "□").join("")).join("\n");
        if (!libre) { est.dias[hoy] = { gano, intentos: intentos.length, cuadros }; const ll = Object.keys(est.dias).sort(); while (ll.length > 60) delete est.dias[ll.shift()]; guardar("wordle", est); }
        nota.className = "juego-nota " + (gano ? "sube" : "baja");
        nota.textContent = gano ? `¡Bien! Era ${palabra}.` : `Era ${palabra}.`;
        v.zona.append(el("div", { class: "juego-acciones" },
          el("button", { class: "btn juego-btn", type: "button", html: icono("actualizar", 16) + "Jugar una libre", onclick: () => { v.cerrar(); setTimeout(() => wordle(true), 220); } }),
          el("button", { class: "boton-icono", type: "button", html: icono("compartir", 16) + "Compartir", onclick: () => compartir(`Wordle de la 224 ${gano ? intentos.length : "X"}/6\n${cuadros}\n${url()}`) })));
      }
      const tecladoFisico = e => {
        if (!tablero.isConnected) { removeEventListener("keydown", tecladoFisico); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key === "Enter" || e.key === "Backspace" ? e.key : e.key.toUpperCase();
        if (k === "Enter" || k === "Backspace" || /^[A-ZÑ]$/.test(k)) { e.preventDefault(); tecla(k); }
      };
      addEventListener("keydown", tecladoFisico);
      pintarTeclado();
      v.zona.append(tablero, nota, teclado);
      if (!libre && est.dias[hoy]) nota.textContent = "Ya jugaste el de hoy. Esta es una libre.";
    }

    // =====================================================
    // JUEGOS CON CANVAS: herramientas comunes
    // =====================================================
    function lienzoJuego(ancho, alto, clase = "") {
      const c = document.createElement("canvas"); c.width = ancho; c.height = alto; c.className = "juego-canvas " + clase; c.tabIndex = 0;
      return c;
    }
    // Deslizar en el cel: regresa "arriba", "abajo", "izq" o "der"
    function alDeslizar(elem, fn) {
      let x0 = 0, y0 = 0;
      elem.addEventListener("touchstart", e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
      elem.addEventListener("touchend", e => {
        const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return fn("toque");
        fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : (dy > 0 ? "abajo" : "arriba"));
      });
    }
    const flechas = (fn, extra = []) => el("div", { class: "juego-flechas" },
      [["izq", "M15 6l-6 6 6 6"], ["arriba", "M6 15l6-6 6 6"], ["abajo", "M6 9l6 6 6-6"], ["der", "M9 6l6 6-6 6"], ...extra].map(([k, p, t]) =>
        el("button", { type: "button", "aria-label": t || k, onpointerdown: e => { e.preventDefault(); fn(k); }, html: p ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>` : t })));

    // =====================================================
    // SNAKE DEL AJOLOTE
    // =====================================================
    function snake() {
      const N = 18, T = 20, c = lienzoJuego(N * T, N * T), g = c.getContext("2d");
      let cuerpo, dir, sigDir, comida, puntos, vel, reloj, vivo;
      const v = ventana("Snake del ajolote", [["a", "Puntos", "0"], ["r", "Récord", num(leer("record-snake", 0))]], { ancho: 460, alCerrar: () => { clearTimeout(reloj); removeEventListener("keydown", teclas); } });
      const COMIDAS = [["#d32f2f", "#7b1f1f"], ["#f2994a", "#b35f1c"], ["#5fd0e8", "#2a8aa0"], ["#f2c94c", "#a8841c"]];
      function nuevaComida() { do comida = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N), c: COMIDAS[Math.floor(Math.random() * COMIDAS.length)] }; while (cuerpo.some(p => p.x === comida.x && p.y === comida.y)); }
      function iniciar() { cuerpo = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]; dir = sigDir = { x: 1, y: 0 }; puntos = 0; vel = 150; vivo = true; v.vals.a.textContent = "0"; nuevaComida(); clearTimeout(reloj); bucle(); }
      function dibujar() {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = (x + y) % 2 ? "#3f7a3a" : "#467f40"; g.fillRect(x * T, y * T, T, T); }
        g.fillStyle = comida.c[0]; g.fillRect(comida.x * T + 3, comida.y * T + 3, T - 6, T - 6); g.fillStyle = comida.c[1]; g.fillRect(comida.x * T + T / 2, comida.y * T + 3, T / 2 - 3, T / 2 - 3);
        cuerpo.forEach((p, i) => {
          g.fillStyle = i === 0 ? "#f7a8c4" : i % 2 ? "#ee8fb3" : "#f29cbc"; g.fillRect(p.x * T + 1, p.y * T + 1, T - 2, T - 2);
          if (i === 0) { g.fillStyle = "#3a1d2a"; const ex = dir.x === 0 ? [5, 13] : dir.x > 0 ? [13, 13] : [5, 5], ey = dir.y === 0 ? [5, 13] : dir.y > 0 ? [13, 13] : [5, 5];
            g.fillRect(p.x * T + ex[0] - 1, p.y * T + ey[0] - 1, 3, 3); g.fillRect(p.x * T + ex[1] - 1, p.y * T + ey[1] - 1, 3, 3);
            g.fillStyle = "#e05a8a"; g.fillRect(p.x * T - 2, p.y * T + 2, 3, 4); g.fillRect(p.x * T + T - 1, p.y * T + 2, 3, 4); }
        });
        if (!vivo) { g.fillStyle = "#000a"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#fff"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("Fin del juego", c.width / 2, c.height / 2); }
      }
      function bucle() {
        dir = sigDir;
        const cab = { x: cuerpo[0].x + dir.x, y: cuerpo[0].y + dir.y };
        if (cab.x < 0 || cab.y < 0 || cab.x >= N || cab.y >= N || cuerpo.some(p => p.x === cab.x && p.y === cab.y)) return morir();
        cuerpo.unshift(cab);
        if (cab.x === comida.x && cab.y === comida.y) { puntos++; v.vals.a.textContent = puntos; vel = Math.max(70, vel - 4); nuevaComida(); } else cuerpo.pop();
        dibujar(); reloj = setTimeout(bucle, vel);
      }
      function morir() {
        vivo = false; dibujar();
        const r = record("record-snake", puntos); v.vals.r.textContent = num(r.mejor);
        aviso.textContent = `Comiste ${puntos}.${r.nuevo ? " ¡Nuevo récord!" : ""}`; boton.hidden = false;
      }
      const girar = k => { const d = { arriba: { x: 0, y: -1 }, abajo: { x: 0, y: 1 }, izq: { x: -1, y: 0 }, der: { x: 1, y: 0 } }[k]; if (d && (d.x !== -dir.x || d.y !== -dir.y)) sigDir = d; };
      const teclas = e => { const k = { ArrowUp: "arriba", ArrowDown: "abajo", ArrowLeft: "izq", ArrowRight: "der", w: "arriba", s: "abajo", a: "izq", d: "der" }[e.key]; if (k) { e.preventDefault(); girar(k); } };
      addEventListener("keydown", teclas);
      alDeslizar(c, girar);
      const aviso = el("p", { class: "juego-nota", text: "Flechas, WASD o desliza el dedo." });
      const boton = el("button", { class: "btn juego-btn", type: "button", hidden: true, html: icono("actualizar", 16) + "Otra vez", onclick: () => { boton.hidden = true; aviso.textContent = ""; iniciar(); } });
      v.zona.append(c, aviso, boton, flechas(girar));
      iniciar(); c.focus();
    }

    // =====================================================
    // FLAPPY ELYTRA
    // =====================================================
    function flappy() {
      const W_ = 360, H_ = 540, c = lienzoJuego(W_, H_), g = c.getContext("2d");
      let y, vy, tubos, puntos, vivo, empezado, raf, t0;
      const v = ventana("Flappy elytra", [["a", "Puntos", "0"], ["r", "Récord", num(leer("record-flappy", 0))]], { ancho: 440, alCerrar: () => { cancelAnimationFrame(raf); removeEventListener("keydown", teclas); } });
      const HUECO = 150;
      function iniciar() { y = H_ / 2; vy = 0; tubos = []; puntos = 0; vivo = true; empezado = false; v.vals.a.textContent = "0"; t0 = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle); }
      function aletear() { if (!vivo) return; empezado = true; vy = -6.4; }
      function bucle(t) {
        const dt = t0 ? Math.min(2, (t - t0) / 16.7) : 1; t0 = t;
        if (empezado && vivo) {
          vy += .38 * dt; y += vy * dt;
          if (!tubos.length || tubos[tubos.length - 1].x < W_ - 190) tubos.push({ x: W_ + 20, h: 60 + Math.random() * (H_ - HUECO - 140), paso: false });
          tubos.forEach(p => p.x -= 2.6 * dt);
          tubos = tubos.filter(p => p.x > -70);
          tubos.forEach(p => { if (!p.paso && p.x + 56 < 80) { p.paso = true; puntos++; v.vals.a.textContent = puntos; } });
          const golpe = y < 0 || y > H_ - 40 || tubos.some(p => 80 + 14 > p.x && 80 - 14 < p.x + 56 && (y - 10 < p.h || y + 10 > p.h + HUECO));
          if (golpe) { vivo = false; const r = record("record-flappy", puntos); v.vals.r.textContent = num(r.mejor); aviso.textContent = `Pasaste ${puntos} ${puntos === 1 ? "pilar" : "pilares"}.${r.nuevo ? " ¡Nuevo récord!" : ""}`; boton.hidden = false; }
        }
        dibujar(t);
        raf = requestAnimationFrame(bucle);
      }
      function dibujar(t) {
        const cielo = g.createLinearGradient(0, 0, 0, H_); cielo.addColorStop(0, "#1b0f2e"); cielo.addColorStop(1, "#3b2a5a");
        g.fillStyle = cielo; g.fillRect(0, 0, W_, H_);
        g.fillStyle = "#ffffff55"; for (let k = 0; k < 30; k++) g.fillRect((k * 97 + (t / 30 | 0)) % W_, (k * 61) % (H_ - 60), 2, 2);
        g.fillStyle = "#e9e4b0"; g.fillRect(0, H_ - 40, W_, 40); g.fillStyle = "#d4cf98"; for (let x = 0; x < W_; x += 20) g.fillRect(x, H_ - 40, 10, 6);
        tubos.forEach(p => {
          [[p.x, 0, 56, p.h], [p.x, p.h + HUECO, 56, H_ - 40 - p.h - HUECO]].forEach(([x, yy, w, h]) => {
            g.fillStyle = "#1c1030"; g.fillRect(x, yy, w, h); g.fillStyle = "#3a2363";
            for (let k = 0; k < h; k += 14) g.fillRect(x + ((k / 14) % 2) * 14 + 4, yy + k + 3, 10, 4);
            g.fillStyle = "#4b2e80"; g.fillRect(x - 3, yy === 0 ? h - 12 : yy, w + 6, 12);
          });
        });
        // El jugador con elytra
        g.save(); g.translate(80, y); g.rotate(Math.max(-.5, Math.min(.9, vy / 10)));
        g.fillStyle = "#8a8a8a"; g.beginPath(); g.moveTo(-6, -2); g.lineTo(-30, -14 + Math.sin(t / 90) * 4); g.lineTo(-24, 6); g.closePath(); g.fill();
        g.fillStyle = "#2b6ca3"; g.fillRect(-8, -6, 18, 12); g.fillStyle = "#c69c6d"; g.fillRect(8, -8, 10, 10); g.fillStyle = "#5a3b22"; g.fillRect(8, -8, 10, 3);
        g.restore();
        if (!empezado && vivo) { g.fillStyle = "#fff"; g.font = "bold 20px sans-serif"; g.textAlign = "center"; g.fillText("Toca o presiona espacio", W_ / 2, H_ / 2 - 60); }
        if (!vivo) { g.fillStyle = "#0008"; g.fillRect(0, 0, W_, H_); g.fillStyle = "#fff"; g.font = "bold 24px sans-serif"; g.textAlign = "center"; g.fillText("¡Chocaste!", W_ / 2, H_ / 2); }
      }
      const teclas = e => { if (e.code === "Space" || e.key === "ArrowUp") { e.preventDefault(); aletear(); } };
      addEventListener("keydown", teclas);
      c.addEventListener("pointerdown", e => { e.preventDefault(); aletear(); });
      const aviso = el("p", { class: "juego-nota", text: "Cada toque te impulsa hacia arriba. Esquiva los pilares de obsidiana." });
      const boton = el("button", { class: "btn juego-btn", type: "button", hidden: true, html: icono("actualizar", 16) + "Otra vez", onclick: () => { boton.hidden = true; aviso.textContent = ""; iniciar(); } });
      v.zona.append(c, aviso, boton);
      iniciar(); c.focus();
    }

    // =====================================================
    // TETRIS DE BLOQUES
    // =====================================================
    function tetris() {
      const CW = 10, CH = 20, T = 24, c = lienzoJuego(CW * T, CH * T), g = c.getContext("2d");
      const prox = lienzoJuego(4 * 18, 4 * 18, "tetris-prox"), gp = prox.getContext("2d");
      const PIEZAS = [
        [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]],
      ];
      // Cada pieza con la textura de un bloque: diamante, oro, redstone, esmeralda, lapis, cobre, hierba
      const COLORES = [["#5fd0e8", "#2a8aa0"], ["#f2c94c", "#a8841c"], ["#d33b2c", "#7d1f17"], ["#3fbf5f", "#1f7a35"], ["#3159c9", "#1c3478"], ["#d9875b", "#8a4f2e"], ["#7cb342", "#4b6b28"]];
      let campo, pieza, sig, px, py, puntos, lineas, nivel, caida, t0, raf, vivo, pausa;
      const v = ventana("Tetris de bloques", [["a", "Puntos", "0"], ["l", "Líneas", "0"], ["r", "Récord", num(leer("record-tetris", 0))]], { ancho: 520, alCerrar: () => { cancelAnimationFrame(raf); removeEventListener("keydown", teclas); } });
      const nueva = () => { const k = Math.floor(Math.random() * PIEZAS.length); return { f: PIEZAS[k].map(r => r.slice()), c: k }; };
      function iniciar() { campo = Array.from({ length: CH }, () => Array(CW).fill(-1)); puntos = 0; lineas = 0; nivel = 1; vivo = true; pausa = false; sig = nueva(); entra(); t0 = 0; caida = 0; v.vals.a.textContent = "0"; v.vals.l.textContent = "0"; cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle); }
      function entra() { pieza = sig; sig = nueva(); px = Math.floor((CW - pieza.f[0].length) / 2); py = 0; if (choca(pieza.f, px, py)) fin(); dibujarProx(); }
      const choca = (f, x, y) => f.some((r, j) => r.some((v_, i) => v_ && (x + i < 0 || x + i >= CW || y + j >= CH || (y + j >= 0 && campo[y + j][x + i] >= 0))));
      function fijar() {
        pieza.f.forEach((r, j) => r.forEach((v_, i) => { if (v_ && py + j >= 0) campo[py + j][px + i] = pieza.c; }));
        let hechas = 0;
        for (let y = CH - 1; y >= 0; y--) if (campo[y].every(x => x >= 0)) { campo.splice(y, 1); campo.unshift(Array(CW).fill(-1)); hechas++; y++; }
        if (hechas) { puntos += [0, 100, 300, 500, 800][hechas] * nivel; lineas += hechas; nivel = 1 + Math.floor(lineas / 10); v.vals.a.textContent = num(puntos); v.vals.l.textContent = lineas; }
        entra();
      }
      function mover(dx) { if (!choca(pieza.f, px + dx, py)) px += dx; }
      function bajar() { if (!choca(pieza.f, px, py + 1)) { py++; return true; } fijar(); return false; }
      function soltar() { while (bajar()) puntos += 1; v.vals.a.textContent = num(puntos); }
      function rotar() { const f = pieza.f[0].map((_, i) => pieza.f.map(r => r[i]).reverse()); for (const k of [0, -1, 1, -2, 2]) if (!choca(f, px + k, py)) { pieza.f = f; px += k; return; } }
      function fin() { vivo = false; const r = record("record-tetris", puntos); v.vals.r.textContent = num(r.mejor); aviso.textContent = `${num(puntos)} puntos y ${lineas} ${lineas === 1 ? "línea" : "líneas"}.${r.nuevo ? " ¡Nuevo récord!" : ""}`; boton.hidden = false; }
      const TEX_TETRIS = ["bloque_diamond_block", "bloque_gold_block", "bloque_redstone_block", "bloque_emerald_block", "bloque_lapis_block", "bloque_copper_block", "bloque_grass_block_side"];
      g.imageSmoothingEnabled = false; gp.imageSmoothingEnabled = false;
      function bloque(gg, x, y, t, k) {
        const im = TEX[TEX_TETRIS[k]];
        if (im) { gg.drawImage(im, 0, 0, 16, 16, x, y, t, t); gg.fillStyle = "#0000002a"; gg.fillRect(x, y + t - 2, t, 2); gg.fillRect(x + t - 2, y, 2, t); return; }
        const [a, b] = COLORES[k]; gg.fillStyle = b; gg.fillRect(x, y, t, t); gg.fillStyle = a; gg.fillRect(x + 2, y + 2, t - 4, t - 4);
        gg.fillStyle = "#ffffff55"; gg.fillRect(x + 2, y + 2, t - 4, 3); gg.fillStyle = "#00000033"; gg.fillRect(x + t * .5, y + t * .5, t * .2, t * .2); gg.fillRect(x + t * .2, y + t * .3, t * .15, t * .15);
      }
      function dibujar() {
        g.fillStyle = "#151c1a"; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = "#1d2623"; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) g.fillRect(x * T + 1, y * T + 1, T - 2, T - 2);
        campo.forEach((r, y) => r.forEach((k, x) => { if (k >= 0) bloque(g, x * T, y * T, T, k); }));
        if (vivo) {
          // Sombra de dónde va a caer
          let sy = py; while (!choca(pieza.f, px, sy + 1)) sy++;
          pieza.f.forEach((r, j) => r.forEach((v_, i) => { if (v_) { g.fillStyle = "#ffffff18"; g.fillRect((px + i) * T + 2, (sy + j) * T + 2, T - 4, T - 4); } }));
          pieza.f.forEach((r, j) => r.forEach((v_, i) => { if (v_ && py + j >= 0) bloque(g, (px + i) * T, (py + j) * T, T, pieza.c); }));
        } else { g.fillStyle = "#000a"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#fff"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("Fin del juego", c.width / 2, c.height / 2); }
        if (pausa && vivo) { g.fillStyle = "#000a"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#fff"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("Pausa", c.width / 2, c.height / 2); }
      }
      function dibujarProx() { gp.fillStyle = "#151c1a"; gp.fillRect(0, 0, prox.width, prox.height); sig.f.forEach((r, j) => r.forEach((v_, i) => { if (v_) bloque(gp, i * 18 + 4, j * 18 + 4, 18, sig.c); })); }
      function bucle(t) {
        if (!t0) t0 = t;
        const dt = t - t0; t0 = t;
        if (vivo && !pausa) { caida += dt; const vel = Math.max(90, 800 - (nivel - 1) * 70); if (caida > vel) { caida = 0; bajar(); } }
        dibujar(); raf = requestAnimationFrame(bucle);
      }
      const accion = k => { if (!vivo || pausa) return; ({ izq: () => mover(-1), der: () => mover(1), abajo: () => { bajar(); puntos++; v.vals.a.textContent = num(puntos); }, arriba: rotar, rotar, soltar, toque: rotar })[k]?.(); };
      const teclas = e => {
        const k = { ArrowLeft: "izq", ArrowRight: "der", ArrowDown: "abajo", ArrowUp: "rotar", " ": "soltar", x: "rotar" }[e.key];
        if (e.key === "p") { pausa = !pausa; return; }
        if (k) { e.preventDefault(); accion(k); }
      };
      addEventListener("keydown", teclas);
      alDeslizar(c, k => accion(k === "arriba" ? "soltar" : k));
      const aviso = el("p", { class: "juego-nota", text: "Flechas para mover, arriba para girar, espacio para soltar." });
      const boton = el("button", { class: "btn juego-btn", type: "button", hidden: true, html: icono("actualizar", 16) + "Otra vez", onclick: () => { boton.hidden = true; aviso.textContent = ""; iniciar(); } });
      const lado = el("div", { class: "tetris-lado" }, el("small", { text: "Sigue" }), prox);
      v.zona.append(el("div", { class: "tetris" }, c, lado), aviso, boton,
        flechas(accion, [["rotar", "", "Girar"], ["soltar", "", "Soltar"]]));
      iniciar(); c.focus();
    }

    // =====================================================
    // BUSCAMINAS DE CREEPERS
    // =====================================================
    function buscaminas() {
      const N = 9, MINAS = 10;
      let celdas, abiertas, primer, vivo, t0, reloj, bandera = false;
      const v = ventana("Buscaminas de creepers", [["t", "Tiempo", "0 s"], ["m", "Creepers", String(MINAS)], ["r", "Récord", leer("record-buscaminas", 0) ? dec(leer("record-buscaminas", 0)) + " s" : "—"]], { ancho: 520, alCerrar: () => clearInterval(reloj) });
      const tab = el("div", { class: "busca", style: `--n:${N}` });
      const modo = el("button", { class: "boton-icono", type: "button", html: icono("estrella", 16) + "Modo bandera: no", onclick: () => { bandera = !bandera; modo.innerHTML = icono("estrella", 16) + "Modo bandera: " + (bandera ? "sí" : "no"); modo.classList.toggle("lleno", bandera); } });
      const aviso = el("p", { class: "juego-nota", text: "Destapa todo sin tocar un creeper. En compu, clic derecho pone bandera." });
      const otraB = el("button", { class: "btn juego-btn", type: "button", hidden: true, html: icono("actualizar", 16) + "Otra vez", onclick: iniciar });
      v.zona.append(tab, el("div", { class: "juego-acciones" }, modo, otraB), aviso);
      const creeper = creeperTex() || `<svg viewBox="0 0 8 8" width="100%" height="100%" shape-rendering="crispEdges"><rect width="8" height="8" fill="#4caf50"/><path fill="#111" d="M1 2h2v2H1zM5 2h2v2H5zM3 4h2v1H3zM2 5h4v2H2zM2 7h1v1H2zM5 7h1v1H5z"/></svg>`;
      function iniciar() {
        celdas = Array.from({ length: N * N }, () => ({ mina: false, n: 0, abierta: false, bandera: false }));
        abiertas = 0; primer = true; vivo = true; clearInterval(reloj); v.vals.t.textContent = "0 s"; v.vals.m.textContent = MINAS; otraB.hidden = true;
        aviso.className = "juego-nota"; aviso.textContent = "Destapa todo sin tocar un creeper. En compu, clic derecho pone bandera.";
        tab.replaceChildren(...celdas.map((_, i) => el("button", { type: "button", class: "busca-cel", "data-i": i, "aria-label": "Casilla " + (i + 1) })));
      }
      const vecinos = i => { const x = i % N, y = Math.floor(i / N), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) r.push(ny * N + nx); } return r; };
      function sembrar(seguro) {
        const prohibidas = new Set([seguro, ...vecinos(seguro)]);
        barajar([...Array(N * N).keys()].filter(i => !prohibidas.has(i))).slice(0, MINAS).forEach(i => celdas[i].mina = true);
        celdas.forEach((c_, i) => c_.n = vecinos(i).filter(k => celdas[k].mina).length);
        t0 = performance.now(); reloj = setInterval(() => v.vals.t.textContent = Math.floor((performance.now() - t0) / 1000) + " s", 250);
      }
      function pintarCel(i) {
        const c_ = celdas[i], b = tab.children[i];
        b.className = "busca-cel" + (c_.abierta ? " abierta" : "") + (c_.bandera ? " bandera" : "") + (c_.abierta && c_.mina ? " boom" : "");
        b.innerHTML = c_.abierta ? (c_.mina ? creeper : c_.n ? `<span class="n${c_.n}">${c_.n}</span>` : "") : c_.bandera ? icono("estrella", 16) : "";
      }
      function abrir(i) {
        const c_ = celdas[i]; if (c_.abierta || c_.bandera) return;
        c_.abierta = true; abiertas++; pintarCel(i);
        if (c_.mina) return perder(i);
        if (!c_.n) vecinos(i).forEach(abrir);
      }
      function perder() {
        vivo = false; clearInterval(reloj);
        celdas.forEach((c_, k) => { if (c_.mina) { c_.abierta = true; pintarCel(k); } });
        tab.classList.add("explota"); setTimeout(() => tab.classList.remove("explota"), 500);
        aviso.className = "juego-nota baja"; aviso.textContent = "¡Ssss… BOOM! Le diste a un creeper."; otraB.hidden = false;
      }
      function revisarGano() {
        if (abiertas !== N * N - MINAS || !vivo) return;
        vivo = false; clearInterval(reloj);
        const s = Math.round((performance.now() - t0) / 100) / 10;
        const r = record("record-buscaminas", s, true);
        v.vals.r.textContent = dec(r.mejor) + " s";
        aviso.className = "juego-nota sube"; aviso.textContent = `¡Ganaste en ${dec(s)} segundos!${r.nuevo ? " Nuevo récord." : ""}`; otraB.hidden = false;
      }
      function marcar(i) {
        const c_ = celdas[i]; if (c_.abierta) return;
        c_.bandera = !c_.bandera; pintarCel(i);
        v.vals.m.textContent = MINAS - celdas.filter(x => x.bandera).length;
      }
      tab.addEventListener("click", e => {
        const b = e.target.closest(".busca-cel"); if (!b || !vivo) return;
        const i = Number(b.dataset.i);
        if (bandera) return marcar(i);
        if (primer) { primer = false; sembrar(i); }
        abrir(i); revisarGano();
      });
      tab.addEventListener("contextmenu", e => { const b = e.target.closest(".busca-cel"); if (!b) return; e.preventDefault(); if (vivo && !primer) marcar(Number(b.dataset.i)); });
      iniciar();
    }

    // =====================================================
    // REFLEJOS: pégale al creeper antes de que explote
    // =====================================================
    function reflejos() {
      let puntos, vidas, ventanaMs, activo, quitar, vivo;
      const v = ventana("Reflejos contra el creeper", [["v", "Vidas", "3"], ["a", "Puntos", "0"], ["r", "Récord", num(leer("record-reflejos", 0))]], { ancho: 480, alCerrar: () => { clearTimeout(quitar); vivo = false; } });
      const hoyos = el("div", { class: "hoyos" }, Array.from({ length: 9 }, (_, i) => el("button", { type: "button", class: "hoyo", "data-i": i, "aria-label": "Hoyo " + (i + 1) })));
      const aviso = el("p", { class: "juego-nota", text: "Sale un creeper. Pícale antes de que explote. Si le das a un hoyo vacío, pierdes una vida." });
      const otraB = el("button", { class: "btn juego-btn", type: "button", html: icono("play", 16) + "Empezar", onclick: iniciar });
      v.zona.append(hoyos, aviso, otraB);
      const creeper = creeperTex() || `<svg viewBox="0 0 8 8" width="100%" height="100%" shape-rendering="crispEdges"><rect width="8" height="8" fill="#4caf50"/><path fill="#2e7d32" d="M0 0h1v1H0zM6 1h1v1H6zM3 6h1v1H3z"/><path fill="#111" d="M1 2h2v2H1zM5 2h2v2H5zM3 4h2v1H3zM2 5h4v2H2zM2 7h1v1H2zM5 7h1v1H5z"/></svg>`;
      function iniciar() { puntos = 0; vidas = 3; ventanaMs = 1300; vivo = true; otraB.hidden = true; v.vals.a.textContent = "0"; v.vals.v.textContent = "3"; aviso.className = "juego-nota"; aviso.textContent = "¡Atento!"; setTimeout(sale, 700); }
      function sale() {
        if (!vivo) return;
        [...hoyos.children].forEach(h => { h.className = "hoyo"; h.innerHTML = ""; });
        activo = Math.floor(Math.random() * 9);
        const h = hoyos.children[activo]; h.classList.add("sale"); h.innerHTML = creeper; h.style.setProperty("--t", ventanaMs + "ms");
        clearTimeout(quitar);
        quitar = setTimeout(() => { if (!vivo) return; h.classList.add("boom"); fallo("¡Explotó!"); }, ventanaMs);
      }
      function fallo(msg) {
        vidas--; v.vals.v.textContent = Math.max(0, vidas); aviso.className = "juego-nota baja"; aviso.textContent = msg;
        hoyos.classList.add("explota"); setTimeout(() => hoyos.classList.remove("explota"), 400);
        activo = -1;
        if (vidas <= 0) return terminar();
        setTimeout(sale, 700);
      }
      function terminar() {
        vivo = false; clearTimeout(quitar);
        const r = record("record-reflejos", puntos); v.vals.r.textContent = num(r.mejor);
        aviso.textContent = `Le pegaste a ${puntos} ${puntos === 1 ? "creeper" : "creepers"}.${r.nuevo ? " ¡Nuevo récord!" : ""}`;
        otraB.hidden = false; otraB.innerHTML = icono("actualizar", 16) + "Otra vez";
      }
      hoyos.addEventListener("pointerdown", e => {
        const h = e.target.closest(".hoyo"); if (!h || !vivo || activo < 0) return;
        e.preventDefault();
        if (Number(h.dataset.i) === activo) {
          clearTimeout(quitar); puntos++; v.vals.a.textContent = puntos; ventanaMs = Math.max(420, ventanaMs - 45);
          h.classList.add("pegado"); aviso.className = "juego-nota sube"; aviso.textContent = "¡Bien!"; activo = -1;
          setTimeout(sale, 250 + Math.random() * 500);
        } else { clearTimeout(quitar); fallo("Ese hoyo estaba vacío."); }
      });
    }

    // =====================================================
    // REGISTRO EN EL APARTADO DE JUEGOS
    // =====================================================
    App.juegosExtra = [
      { grupo: "saber", titulo: "Trivia de Minecraft", texto: "10 preguntas del juego: mobs, crafteos, dimensiones.", icono: "pregunta", record: "record-trivia", formato: v => v + "/10", abrir: () => trivia(TRIVIA, "Trivia de Minecraft", "record-trivia", "Trivia", "pregunta") },
      { grupo: "saber", titulo: "Trivia de redstone", texto: "Para los que saben de pistones, repetidores y relojes.", icono: "rayo", record: "record-redstone", formato: v => v + "/10", abrir: () => trivia(REDSTONE, "Trivia de redstone", "record-redstone", "Redstone", "rayo") },
      { grupo: "saber", titulo: "Adivina el mob", texto: "La cara se va destapando. Mientras antes adivines, más puntos.", icono: "ojo", record: "record-mob", abrir: conTexturas(adivinaMob) },
      { grupo: "saber", titulo: "Crafteo", texto: "Te enseño la receta y tú dices qué sale.", icono: "estrella", record: "record-crafteo", formato: v => v + "/10", abrir: conTexturas(crafteo) },
      { grupo: "saber", titulo: "Wordle de Minecraft", texto: "Una palabra de 5 letras al día, 6 intentos.", icono: "libro", record: "record-wordle", formato: v => v + " ganados", abrir: () => wordle(false) },
      { grupo: "clasicos", titulo: "Snake del ajolote", texto: "Come y crece sin chocar con las paredes ni contigo.", icono: "pez", record: "record-snake", abrir: snake },
      { grupo: "clasicos", titulo: "Flappy elytra", texto: "Vuela entre los pilares de obsidiana.", icono: "ala", record: "record-flappy", abrir: flappy },
      { grupo: "clasicos", titulo: "Tetris de bloques", texto: "Con bloques de diamante, oro, redstone y más.", icono: "ladrillo", record: "record-tetris", abrir: conTexturas(tetris) },
      { grupo: "clasicos", titulo: "Buscaminas de creepers", texto: "Destapa todo sin despertar a un creeper.", icono: "calavera", record: "record-buscaminas", formato: v => dec(v) + " s", abrir: conTexturas(buscaminas) },
      { grupo: "clasicos", titulo: "Reflejos contra el creeper", texto: "Pégale antes de que explote. Cada vez más rápido.", icono: "rayo", record: "record-reflejos", abrir: conTexturas(reflejos) },
    ];
    Object.assign(App.juegos || {}, { trivia: () => trivia(TRIVIA, "Trivia de Minecraft", "record-trivia", "Trivia", "pregunta"), adivinaMob: conTexturas(adivinaMob), crafteo: conTexturas(crafteo), wordle, snake, flappy, tetris: conTexturas(tetris), buscaminas: conTexturas(buscaminas), reflejos: conTexturas(reflejos) });
    if (App.juegos && App.juegos.repintar && !document.querySelector(".juego-ventana")) App.juegos.repintar();
  });
})();
