/* =========================================================
   MINECRAFT 224 · inglés
   Si en Ajustes eliges English, este archivo cambia los textos
   de la página y de los juegos al inglés mientras se dibujan.
   (El Wrapped ya traía su propio inglés.)
   ========================================================= */
(function () {
  "use strict";
  let lang = "es";
  try { lang = localStorage.getItem("m224-idioma") === "en" ? "en" : "es"; } catch {}
  window.M224Idioma = { lang };
  document.documentElement.lang = lang === "en" ? "en" : "es-MX";
  if (lang !== "en") return;

  // ---------- Frases exactas ----------
  const D = {
    // Menú y apartados
    "Cargando la 224…": "Loading the 224…", "Inicio": "Home", "Liga": "League", "Ranking": "Ranking", "Jugadores": "Players", "Juegos": "Games",
    "Capturas": "Screenshots", "Más": "More", "Cómo entrar": "How to join", "Reglas": "Rules", "Estadísticas": "Stats", "Meses": "Months",
    "Historia": "History", "Mapa": "Map", "Preguntas": "FAQ", "Modo TV": "TV mode", "App": "App", "Apartados": "Sections", "Menú rápido": "Quick menu",
    "Más apartados": "More sections", "Buscar": "Search", "Buscar (tecla /)": "Search (key /)", "Datos nuevos": "New data", "Ajustes": "Settings",
    "Subir hasta arriba": "Back to top", "Mini juegos": "Mini games", "Instalar la app": "Install the app", "Cambiar a modo claro u oscuro": "Switch light/dark mode",
    // Inicio
    "SALÓN 5 · CBTIS 224": "CLASS 5 · CBTIS 224", "El server chill del salón. Survival vanilla en difícil, Java": "The chill server of our class. Vanilla survival on hard, Java",
    ", prendido 24/7.": ", online 24/7.", "IP DEL SERVER": "SERVER IP", "IP del server": "Server IP", "Copiar": "Copy", "IP copiada": "IP copied",
    "Multijugador → Agregar servidor → pega la IP": "Multiplayer → Add server → paste the IP", "Multijugador → Agregar servidor → pega la IP.": "Multiplayer → Add server → paste the IP.",
    "(cel, consola, Windows): misma IP, puerto": "(phone, console, Windows): same IP, port", "Unirme al Discord": "Join the Discord", "INAUGURACIÓN EN": "OPENING IN",
    "LA 224 LLEVA": "THE 224 HAS BEEN ON FOR", "DÍAS": "DAYS", "HORAS": "HOURS", "MIN": "MIN", "SEG": "SEC", "Fecha por anunciar": "Date to be announced",
    "Sábado 14 de noviembre, 4:00 pm": "Saturday, November 14, 4:00 pm", "Desde el 14 de noviembre": "Since November 14",
    "Revisando server…": "Checking server…", "Server apagado": "Server offline", "Nadie jugando ahorita.": "Nobody playing right now.", "Nadie conectado ahorita": "Nobody online right now",
    "La 224 en números": "The 224 in numbers", "Buscando diamantes…": "Looking for diamonds…", "Contando las muertes por tonto…": "Counting the silly deaths…",
    "Despertando a los creepers…": "Waking up the creepers…", "Revisando quién va primero en la liga…": "Checking who leads the league…", "Acomodando los bloques…": "Placing the blocks…",
    // Cómo entrar
    "CÓMO ENTRAR": "HOW TO JOIN", "Entra a la 224 en 4 pasos": "Join the 224 in 4 steps", "El server tiene whitelist: solo entra la banda del salón.": "The server has a whitelist: only our class can join.",
    "Únete al Discord": "Join the Discord", "Ahí están los avisos, las reglas y el chat del server en vivo.": "That's where the news, the rules and the live server chat are.",
    "Pasa tu usuario": "Send your username", "En el Discord usa": "In the Discord use", "(o mándaselo a": "(or send it to", "): tu usuario de": "): your",
    "Minecraft Java": "Minecraft Java username", ", tu": ", your", "gamertag de Xbox": "Xbox gamertag", "si juegas en Bedrock, o": "if you play Bedrock, or",
    "los dos": "both", "si juegas en los dos. Escríbelo exacto, con mayúsculas y todo.": "if you play both. Type it exactly, capitals and all.",
    "Espera a que te agreguen": "Wait to be added", "Te meten a la whitelist y te avisan en el Discord.": "You get whitelisted and they let you know in the Discord.",
    "Copia la IP y a jugar": "Copy the IP and play", "Servidores → Agregar servidor → pega la IP y en puerto pon": "Servers → Add server → paste the IP and set the port to",
    // Reglas
    "REGLAS": "RULES", "Los mandamientos de la 224": "The commandments of the 224", "Este es un server chill.": "This is a chill server.",
    "Las bromas se valen": "Pranks are allowed", "Bromas chill de cojones, nomás no te pases de lanza.": "Chill pranks only, just don't go too far.",
    "Trata las cosas de los demás como quieres que traten las tuyas": "Treat other people's stuff the way you want yours treated", "Easy.": "Easy.",
    "Juega como quieras": "Play however you want", "Construye, explora, haz granjas, muere tontamente en lava. Es vanilla, disfrútalo.": "Build, explore, make farms, die stupidly in lava. It's vanilla, enjoy it.",
    "¿Hubo pedo?": "Any drama?", "Se arregla en el Discord y gg.": "Sort it out in the Discord and gg.",
    // Liga
    "LIGA DEL MES": "MONTHLY LEAGUE", "La liga de la 224": "The 224 league", "Liga del mes": "Monthly league", "Ver la carrera del mes": "Watch the month's race",
    "Todo lo que haces da puntos: horas, bloques, diamantes, netherita, mobs, caminar y entrar seguido. Morirte quita muchos puntos. El que gane el mes se lleva el rol de campeón.": "Everything you do gives points: hours, blocks, diamonds, netherite, mobs, walking and logging in often. Dying takes away a lot of points. The month's winner gets the champion role.",
    "Días que entró": "Days played", "¿Cómo se ganan puntos?": "How do you earn points?", "Salón de campeones": "Hall of champions", "Puntos del mes": "Points this month",
    "Tabla de la liga": "League table", "Descargar tabla": "Download table", "La liga arranca cuando empiece a jugar la banda. Aquí va a salir la tabla del mes.": "The league starts when the crew starts playing. The month's table shows up here.",
    "Subió": "Up", "Bajó": "Down", "Igual que ayer": "Same as yesterday", "Así va": "Current standings", "Carrera del mes": "Race of the month",
    // Ranking
    "RANKING": "RANKING", "Los mejores de la 224": "The best of the 224", "Escoge la categoría y el periodo. El podio se arma solo.": "Pick the category and the period. The podium builds itself.",
    "Categoría": "Category", "Periodo": "Period", "Podio": "Podium", "Esta semana": "This week", "Este mes": "This month", "Siempre": "All time",
    "Ranking completo": "Full ranking", "Nadie tiene nada en este periodo todavía.": "Nobody has anything in this period yet.", "Todavía no hay datos de este mes": "No data for this month yet",
    // Stats
    "Horas": "Hours", "Horas jugadas": "Hours played", "Diamantes": "Diamonds", "Netherita": "Netherite", "Bloques minados": "Blocks mined", "Bloques": "Blocks", "Mobs": "Mobs",
    "Mobs matados": "Mobs killed", "Metros": "Meters", "Muertes": "Deaths", "Racha": "Streak", "Nivel": "Level", "Minado": "Mined", "Caminado": "Walked", "Caminar": "Walking",
    "Sin morir": "Without dying", "Récord sin morir": "Longest life", "Mejor racha": "Best streak", "Mensajes": "Messages", "Días jugados": "Days played", "Km": "Km",
    "Promedio": "Average", "Como el promedio": "About average", "Menos que el promedio": "Below average",
    // Jugadores / cartas / perfil
    "JUGADORES": "PLAYERS", "La banda de la 224": "The 224 crew", "Cada quien con su carta. Pícale a una para voltearla.": "Everyone gets a card. Tap one to flip it.",
    "Buscar jugador…": "Search player…", "Cuando entre la banda, aquí van a salir sus cartas.": "When the crew joins, their cards show up here.",
    "Herobrine no está en la whitelist… todavía.": "Herobrine isn't on the whitelist… yet.", "Ese jugador no está en la 224": "That player isn't in the 224",
    "Ver perfil": "View profile", "Perfil del jugador": "Player profile", "Modo cine": "Cinema mode", "Compartir": "Share", "Imagen": "Image", "Presentar": "Present",
    "Video": "Video", "Copiar link": "Copy link", "Link copiado": "Link copied", "Resumen": "Summary", "Medallas": "Medals", "Gráficas": "Charts",
    "Novato": "Rookie", "Aventurero": "Adventurer", "Veterano": "Veteran", "Leyenda": "Legend", "Minero": "Miner", "Guerrero": "Warrior", "Explorador": "Explorer", "Viciado": "Addict",
    "Jugando ahorita": "Playing now", "Sin ganar": "Not earned", "Bronce": "Bronze", "Plata": "Silver", "Oro": "Gold", "Diamante": "Diamond", "Especial": "Special",
    "Bloqueada": "Locked", "Única": "Unique", "Pícale a una medalla para ver cómo se gana.": "Tap a medal to see how to earn it.", "Su medalla más rara": "Their rarest medal",
    "Nadie más la tiene": "Nobody else has it", "Todavía no la tiene.": "Doesn't have it yet.", "Nadie la tiene todavía.": "Nobody has it yet.",
    "Las medallas salen cuando el bot junte datos.": "Medals show up when the bot has collected data.", "Su lugar en cada liga": "Their place in each league",
    "Comparar meses": "Compare months", "Va en curso": "In progress", "En curso": "In progress", "Ver otra vez": "Watch again",
    "Todavía no ha jugado en ninguna liga.": "Hasn't played any league yet.", "La gráfica sale cuando el bot tenga unos días de datos.": "The chart shows up after a few days of data.",
    "Su primer Wrapped sale cuando termine su primer mes jugando.": "Their first Wrapped comes out after their first month.", "Entró a la 224": "Joined the 224",
    "Su primer día en el server.": "Their first day on the server.", "Su primer diamante": "Their first diamond", "Su primera netherita": "Their first netherite",
    "Llegó al Nether": "Reached the Nether", "Llegó al End": "Reached the End", "Primer diamante de toda la 224": "First diamond in the whole 224",
    "Primero de la 224 en el Nether": "First in the 224 to reach the Nether", "Primero de la 224 en el End": "First in the 224 to reach the End",
    "Mató al Ender Dragon": "Killed the Ender Dragon", "Nadie lo hizo antes.": "Nobody did it before.", "Ganó la liga del mes.": "Won the monthly league.",
    "Nadie se murió más que él ese mes.": "Nobody died more than them that month.", "Su historia se va llenando conforme juega.": "Their story fills up as they play.",
    "Aguante": "Stamina", "Minería": "Mining", "Combate": "Combat", "Exploración": "Exploration", "Riqueza": "Wealth", "Supervivencia": "Survival",
    "Huele los diamantes desde lejos.": "Can smell diamonds from far away.", "Los mobs cambian de camino cuando lo ven.": "Mobs change their path when they see them.",
    "Conoce el mapa mejor que nadie.": "Knows the map better than anyone.", "Prácticamente vive en la 224.": "Basically lives in the 224.", "Difícil de matar.": "Hard to kill.",
    "Juega a su ritmo y sin broncas.": "Plays at their own pace, no drama.", "Se muere mucho, pero siempre regresa.": "Dies a lot, but always comes back.",
    "Tu perfil en imagen": "Your profile as an image", "Mi carta de la 224": "My 224 card", "Historia de Instagram": "Instagram story", "Cuadrado": "Square",
    "Tu navegador no puede hacer videos. Usa la imagen.": "Your browser can't make videos. Use the image.", "Haciendo tu video… (6 segundos)": "Making your video… (6 seconds)",
    "Listo. Si WhatsApp no lo acepta, súbelo como documento.": "Done. If WhatsApp won't take it, send it as a document.", "Armando la imagen…": "Building the image…",
    "No se pudo armar la imagen": "Couldn't build the image", "Copia el link:": "Copy the link:", "No se pudo copiar": "Couldn't copy",
    // VS
    "VS": "VS", "Escoge a dos y que se den.": "Pick two and let them fight.", "¡Pelea!": "Fight!", "Primer jugador": "First player", "Segundo jugador": "Second player",
    "Escoge a dos diferentes": "Pick two different players", "Revancha": "Rematch", "Resultado final": "Final result",
    // Estadísticas / meses / historia / capturas / mapa / wrapped
    "ESTADÍSTICAS": "STATS", "La 224 en gráficas": "The 224 in charts", "Cómo va el server completo, día con día.": "How the whole server is doing, day by day.",
    "Las gráficas salen cuando el bot junte datos de dos días o más. Los récords ya se ven abajo.": "Charts show up once the bot has two or more days of data. Records are below.",
    "Horas jugadas por día": "Hours played per day", "Entre todos, los últimos 30 días": "Everyone combined, last 30 days", "Jugadores activos por día": "Active players per day",
    "Cuántos entraron cada día": "How many joined each day", "Muertes por semana": "Deaths per week", "¿Qué mata más a la 224?": "What kills the 224 the most?",
    "Más horas en un día": "Most hours in a day", "Más diamantes en un día": "Most diamonds in a day", "Más bloques en un día": "Most blocks in a day",
    "Más muertes en un día": "Most deaths in a day", "Racha más larga": "Longest streak", "Más tiempo sin morir": "Longest time without dying",
    "Más conectados a la vez": "Most online at once", "Récords de la 224": "224 records", "MESES": "MONTHS", "El archivo de la 224": "The 224 archive",
    "Cada mes guardado: su campeón, su podio, sus récords y sus fotos.": "Every month saved: its champion, podium, records and photos.",
    "Cada mes que pase se guarda aquí con su campeón, su podio y sus fotos.": "Every month gets saved here with its champion, podium and photos.",
    "Más viciado": "Most hours", "Más diamantes": "Most diamonds", "Más minero": "Top miner", "Más asesino": "Top killer", "Más tonto": "Clumsiest",
    "Podio del mes": "Podium of the month", "Podio de la liga": "League podium", "Lo mejor del mes": "Best of the month", "Fotos del mes": "Photos of the month",
    "La medalla más rara": "The rarest medal", "solo la tiene él": "only they have it", "HISTORIA": "HISTORY", "Los momentos de la 224": "The 224's moments",
    "Lo que pasó y nadie va a olvidar.": "What happened and nobody will forget.", "Inauguración": "Opening day", "Entramos todos al mismo tiempo.": "We all joined at the same time.",
    "El spawn el día 1": "The spawn on day 1", "CAPTURAS": "SCREENSHOTS", "Lo mejor de la 224": "The best of the 224", "Las mejores capturas de": "The best screenshots from",
    "en el Discord.": "in the Discord.", "Mes de las capturas": "Month of the screenshots", "Todas": "All", "Sin fecha": "No date", "Anterior": "Previous",
    "Siguiente": "Next", "Descargar": "Download", "Zoom": "Zoom", "Pantalla completa": "Full screen", "Gira el cel para verla más grande": "Turn your phone to see it bigger",
    "Captura": "Screenshot", "Captura de la 224": "224 screenshot", "MAPA": "MAP", "El mundo en 3D": "The world in 3D",
    "Recorre la 224 desde el navegador: las bases, las granjas y todo lo que han construido.": "Explore the 224 from your browser: the bases, the farms and everything that's been built.",
    "Disponible al lanzar": "Available at launch", "CADA MES": "EVERY MONTH", "Wrapped 224": "Wrapped 224",
    "Cada mes, tu resumen tipo historias con música: horas jugadas, diamantes, el mob que más te mató, tu mejor racha y tu título del mes. Con tarjeta para presumir.": "Every month, your recap as stories with music: hours played, diamonds, the mob that killed you most, your best streak and your title of the month. With a card to show off.",
    "Disponible cuando empiece el server": "Available when the server starts", "Wrapped de toda la 224": "Wrapped of the whole 224", "Wrapped del año": "Wrapped of the year",
    "Elige tu Wrapped": "Pick your Wrapped", "Ver mi Wrapped": "See my Wrapped", "El Wrapped sale cuando haya datos": "The Wrapped comes out when there's data",
    "Wrapped de la 224": "224 Wrapped",
    // Preguntas
    "PREGUNTAS": "FAQ", "Preguntas frecuentes": "Frequently asked questions", "Lo que todos preguntan. Si no está aquí, pregunta en el Discord.": "What everyone asks. If it's not here, ask in the Discord.",
    "¿Cuánto cuesta y a quién le pago?": "How much is it and who do I pay?", "Son": "It's", "pesos": "pesos", "por dos meses": "for two months", ". Se le pagan a": ". You pay",
    "en la escuela, a más tardar la primera o segunda semana de noviembre. Con eso se paga el server para que esté prendido 24/7. Si quieren seguir después, se puede pagar desde antes o al regresar de vacaciones.": "at school, by the first or second week of November at the latest. That pays for the server to be online 24/7. If you want to keep playing after that, you can pay early or after the holidays.",
    "¿Puedo entrar con Minecraft pirata?": "Can I join with a pirated Minecraft?", "No. Solo cuentas originales: Minecraft Java comprado": "No. Only legit accounts: a bought Minecraft Java",
    ", o Minecraft Bedrock con tu cuenta de Xbox": ", or Minecraft Bedrock with your Xbox account", "¿Puedo jugar en el celular?": "Can I play on my phone?",
    "Sí, con Minecraft Bedrock (celular, consola o Windows). Usa la misma IP y en puerto pon": "Yes, with Minecraft Bedrock (phone, console or Windows). Use the same IP and set the port to",
    ". Tienes que estar en la whitelist con tu gamertag de Xbox.": ". You need to be whitelisted with your Xbox gamertag.",
    "Juego en PlayStation, Nintendo o celular y no tengo cuenta de Xbox": "I play on PlayStation, Nintendo or phone and don't have an Xbox account",
    "Necesitas una": "You need a", "cuenta de Microsoft": "Microsoft account", "(la de Xbox). Es": "(the Xbox one). It's", "gratis": "free",
    ": créala en xbox.com o desde el mismo Minecraft cuando te pida iniciar sesión. Tu gamertag es el nombre que le pasas a": ": create it on xbox.com or from Minecraft itself when it asks you to sign in. Your gamertag is the name you give to",
    "para la whitelist.": "for the whitelist.", "Celular y Windows:": "Phone and Windows:", "entras directo con la IP y el puerto.": "you join directly with the IP and the port.",
    "PlayStation y Nintendo:": "PlayStation and Nintendo:", "Minecraft no deja agregar servers propios en consola, así que hay que hacer un truco con la configuración de internet de la consola. Pregúntale a": "Minecraft doesn't let you add custom servers on consoles, so there's a trick with the console's network settings. Ask",
    "en el Discord y te ayuda.": "in the Discord and they'll help you.", "¿Qué versión necesito?": "Which version do I need?", ". En el launcher elige esa versión antes de entrar.": ". Pick that version in the launcher before joining.",
    "¿Puedo usar mods?": "Can I use mods?", "Los que solo mejoran tu juego sí: minimapa, zoom, shaders, más FPS. Hacks, X-ray o cualquier cosa que te dé ventaja, no.": "Ones that just improve your game, yes: minimap, zoom, shaders, more FPS. Hacks, X-ray or anything that gives you an advantage, no.",
    "¿Se reinicia el mundo?": "Does the world get reset?", "No. Lo que construyas se queda.": "No. What you build stays.", "¿Este mundo será para siempre?": "Will this world last forever?",
    "Esa es la idea. Mientras sigamos jugando y juntando para el server, la 224 sigue viva.": "That's the idea. As long as we keep playing and chipping in for the server, the 224 lives on.",
    "¿Cómo funciona la liga del mes?": "How does the monthly league work?",
    "Cada cosa que haces da puntos: horas jugadas, bloques minados (el netherrack no cuenta), diamantes, netherita, mobs, lo que caminas y los días que entras. Morir quita 20 puntos, así que cuídate. Ser el primero del server en algo (diamante, Nether, End, Dragón) da puntos extra, igual que ganar medallas. El que tenga más puntos al final del mes es el campeón y le toca el rol en Discord. En el apartado": "Everything you do gives points: hours played, blocks mined (netherrack doesn't count), diamonds, netherite, mobs, distance walked and days you log in. Dying takes away 20 points, so be careful. Being the first on the server at something (diamond, Nether, End, Dragon) gives extra points, and so do medals. Whoever has the most points at the end of the month is the champion and gets the Discord role. The section",
    "viene todo el detalle.": "has all the details.", "por cada hora jugada": "per hour played", "por cada diamante": "per diamond", "por cada ancient debris (netherita)": "per ancient debris (netherite)",
    "por cada día que entras": "per day you log in", "por cada muerte. Por tonto.": "per death. Silly.", "Extras:": "Extras:",
    "primer diamante, llegar al Nether o al End, ser el primero del server, matar al dragón y ganar medallas": "first diamond, reaching the Nether or the End, being first on the server, killing the dragon and earning medals",
    "Medallas únicas": "Unique medals", "Solo una persona en toda la 224 puede tenerlas. Si alguien te supera, te la quita.": "Only one person in the whole 224 can have each one. If someone beats you, they take it.",
    "¡Es suya!": "It's theirs!", "Nadie todavía": "Nobody yet", "Su día más viciado": "Their most addicted day", "Su mejor racha entrando seguido.": "Their best login streak.",
    "Nadie más en la 224 la tiene.": "Nobody else in the 224 has it.", "Ya se puede ver en la pestaña Wrapped.": "You can watch it in the Wrapped tab.",
    "Pero casi ni jugaste, así que no cuenta.": "But you barely played, so it doesn't count.", "English": "English", "Juega en Java y Bedrock": "Plays on Java and Bedrock", "Juega en Bedrock": "Plays on Bedrock", "Juega en Java": "Plays on Java", "Cambia la página y los juegos a inglés.": "Switches the page and games to English.", "¿Cómo gano medallas?": "How do I earn medals?",
    "Jugando normal. Hay medallas de bronce, plata, oro y diamante por horas, minería, pesca, granjas, comercio, exploración y más, y medallas especiales por cosas como conseguir elytras o encontrar una ciudad antigua. Abre tu perfil y en la pestaña Medallas ves cuánto te falta para cada una.": "Just by playing. There are bronze, silver, gold and diamond medals for hours, mining, fishing, farming, trading, exploring and more, plus special medals for things like getting elytra or finding an ancient city. Open your profile and the Medals tab shows how much you need for each one.",
    "¿Cada cuánto se actualiza la página?": "How often does the page update?",
    "El bot sube las stats solito cada pocos minutos mientras el server está prendido, y más rápido cuando alguien entra o sale. Si la página tiene datos nuevos, te sale un aviso arriba para verlos. También puedes tocar \"Datos nuevos\" en el menú.": "The bot uploads the stats by itself every few minutes while the server is on, and faster when someone joins or leaves. If there's new data, a notice shows up at the top. You can also tap \"New data\" in the menu.",
    "Juego en Java y en Bedrock, ¿se juntan mis stats?": "I play on Java and Bedrock, do my stats combine?", "Sí. Pon las dos cuando uses": "Yes. Enter both when you use",
    "(o pásale las dos a Dylan) y quedan unidas desde antes de que entres. Todo se suma en tu perfil, la liga y el Wrapped, y en tu perfil salen las dos cuentas.": "(or give both to Dylan) and they get linked before you even join. Everything adds up in your profile, the league and the Wrapped, and your profile shows both accounts.",
    "¿Por qué no sale mi skin?": "Why doesn't my skin show up?",
    "El bot baja tu skin directo de Minecraft y la sube a la página. Si acabas de cambiarla, tarda unas horas en actualizarse. Si juegas solo en Bedrock y nunca has entrado al server, todavía no la tiene.": "The bot downloads your skin straight from Minecraft and uploads it to the page. If you just changed it, it takes a few hours to update. If you only play Bedrock and have never joined, it doesn't have it yet.",
    "¿Qué es el Wrapped?": "What is the Wrapped?",
    "Un resumen de tu mes en historias con música, como el de Spotify: tus horas, lo que minaste, cómo te moriste y tu título del mes. También hay uno de toda la 224 con créditos de película, y uno del año en diciembre. Lo puedes ver en inglés, bajar como imagen o como video.": "A recap of your month as stories with music, like Spotify's: your hours, what you mined, how you died and your title of the month. There's also one for the whole 224 with movie credits, and one for the year in December. You can watch it in English, save it as an image or as a video.",
    "¿Qué comandos tiene el bot de Discord?": "What commands does the Discord bot have?", ". Escribe": ". Type", "en cualquier canal y te salen todos.": "in any channel and they all show up.",
    "¿Cómo subo mis capturas a la página?": "How do I add my screenshots to the page?",
    "Mándalas al canal de capturas del Discord. El bot las sube solas a la página con la fecha y tu nombre, y salen en el apartado": "Post them in the Discord's screenshots channel. The bot uploads them to the page with the date and your name, and they show up in the section",
    "¿Puedo instalar la página como app?": "Can I install the page as an app?",
    "Sí. En Android o compu con Chrome sale el botón \"App\" arriba. En iPhone, abre la página en Safari, toca Compartir y luego \"Agregar a inicio\".": "Yes. On Android or a computer with Chrome there's an \"App\" button at the top. On iPhone, open the page in Safari, tap Share and then \"Add to Home Screen\".",
    "Encontré un error o tengo una idea, ¿a quién le digo?": "I found a bug or have an idea, who do I tell?", "A Dylan, por el Discord. Si es un error, manda captura de lo que ves.": "Dylan, on the Discord. If it's a bug, send a screenshot of what you see.",
    "Minecraft 224 · CBTIS 224 · hecho por explotabuela": "Minecraft 224 · CBTIS 224 · made by explotabuela",
    // Ajustes
    "Alto contraste": "High contrast", "Colores más fuertes para que se lea mejor.": "Stronger colors so it's easier to read.", "Letra más grande": "Bigger text",
    "Agranda todo el texto de la página.": "Makes all the page text bigger.", "Bloques flotando": "Floating blocks", "Los bloquecitos que flotan en el inicio.": "The little blocks floating on the home screen.",
    "Skins en 3D": "3D skins", "Caras y cuerpos con volumen (pelo, gorras, chamarras). Apágalo si tu cel va lento.": "Faces and bodies with depth (hair, hats, jackets). Turn it off if your phone is slow.",
    "Adornos de temporada": "Seasonal decorations", "Nieve en diciembre, fuegos en año nuevo y aniversarios.": "Snow in December, fireworks on New Year and anniversaries.",
    "Se aplica al recargar la página": "Applies when you reload the page", "Buscar datos nuevos": "Check for new data", "Instalar como app": "Install as an app",
    "Ya tienes lo más nuevo": "You already have the latest", "No se pudo revisar. ¿Tienes internet?": "Couldn't check. Are you online?", "Hay datos nuevos. Toca para verlos": "There's new data. Tap to see it",
    "Idioma": "Language", "Cambia la página y los juegos a inglés.": "Switches the page and the games to English.",
    "En Safari: botón Compartir → Agregar a inicio": "In Safari: Share button → Add to Home Screen", "Tu navegador ya la tiene o no deja instalarla. En Chrome: menú ⋮ → Instalar app": "Your browser already has it or doesn't allow installing. In Chrome: menu ⋮ → Install app",
    "¡Listo! Ya tienes la app de la 224": "Done! You now have the 224 app", "hace un momento": "just now", "la última vez": "last time",
    "Busca un jugador, un apartado, un mes…": "Search a player, a section, a month…", "No encontré nada": "Nothing found", "recién entró": "just joined",
    "muertes por tonto": "silly deaths", "días de racha": "day streak", "día de racha": "day streak", "días seguidos": "days in a row", "récord sin morir": "longest life", "Cerrar": "Close", "Mes": "Month", "Apartado": "Section",
    "💥 Te explotó un creeper. Por tonto.": "💥 A creeper blew you up. Silly.", "¿Ya? Deja el logo en paz.": "Done? Leave the logo alone.", "Sssss…": "Sssss…",
    // Juegos (general)
    "JUEGOS": "GAMES", "Mini juegos de la 224": "224 mini games", "Uno nuevo cada día, igual para todos. ¿Qué tanto conoces a la banda?": "A new one every day, the same for everyone. How well do you know the crew?",
    "De la banda": "About the crew", "¿Qué tanto sabes de Minecraft?": "How much do you know about Minecraft?", "Clásicos con estilo Minecraft": "Minecraft-style classics",
    "Récord": "Record", "Otra vez": "Again", "Pausa": "Pause", "Seguir": "Continue", "Jugar": "Play", "Compartir resultado": "Share result", "Ver resultado": "See result",
    "Empezar": "Start", "Resultado": "Result", "RESULTADO": "RESULT", "PUNTOS": "POINTS", "Puntos": "Points", "Tiempo": "Time", "Aciertos": "Correct", "Pregunta": "Question",
    "Ronda": "Round", "Intento": "Try", "Ganados": "Won", "Vidas": "Lives", "Líneas": "Lines", "Sigue": "Next", "Receta": "Recipe", "Creepers": "Creepers",
    "Sin récord todavía": "No record yet", " Nuevo récord.": " New record.", " ¡Nuevo récord!": " New record!", "¡Bien!": "Nice!", "Nop.": "Nope.",
    "Copiado. Pégalo en el grupo": "Copied. Paste it in the group chat", "Juego del día": "Game of the day", "5 preguntas sobre la banda": "5 questions about the crew",
    "Skins, muertes, stats y quién llegó primero. Es el mismo para todos y solo tienes un intento.": "Skins, deaths, stats and who got here first. Same for everyone and you only get one try.",
    "Todavía no hay datos para el juego": "No data for the game yet", "Perfecto. Te sabes todo de la 224.": "Perfect. You know everything about the 224.",
    "Nada mal, sí conoces a la banda.": "Not bad, you do know the crew.", "Te falta juntarte más con la banda.": "You need to hang out with the crew more.",
    "¿Sí juegas en la 224?": "Do you even play in the 224?", "Quién tiene más": "Who has more", "¿Quién tiene más?": "Who has more?", "Pícale al que tenga más": "Tap whoever has more",
    "Adivina el número": "Guess the number", "Adivina la skin": "Guess the skin", "¿De quién es esta skin?": "Whose skin is this?", "Skin misteriosa": "Mystery skin",
    "¿Quién se murió así?": "Who died like this?", "¿Quién de estos entró primero a la 224?": "Which of these joined the 224 first?", "Faltan jugadores con skin de Java": "Not enough players with a Java skin",
    "Encuentra las parejas lo más rápido que puedas.": "Find the pairs as fast as you can.", "Memorama de la 224": "224 memory game", "Memorama": "Memory",
    "Modo difícil": "Hard mode", "10 preguntas, 12 segundos cada una": "10 questions, 12 seconds each", "Todavía no hay datos para el modo difícil": "No data for hard mode yet",
    "Modo difícil del día": "Hard mode of the day", "Leyenda. Conoces la 224 de memoria.": "Legend. You know the 224 by heart.", "Muy bien, contra el reloj no es fácil.": "Very good, beating the clock isn't easy.",
    "El reloj ganó esta vez.": "The clock won this time.", "Todavía no hay preguntas": "No questions yet", "Speedrun de preguntas": "Question speedrun", "Speedrun": "Speedrun",
    "Responde todas las que puedas. Cada acierto suma 1. Cada error te quita 3 segundos.": "Answer as many as you can. Each correct one adds 1. Each mistake costs 3 seconds.",
    "Dos jugadores, un dato. Atínale las que puedas seguidas.": "Two players, one stat. Get as many in a row as you can.", "Sale una skin borrosa. ¿De quién es? Tienes 3 vidas.": "A blurry skin appears. Whose is it? You have 3 lives.",
    "Encuentra las parejas de caras contra el reloj.": "Find the pairs of faces against the clock.", "60 segundos para contestar todas las que puedas.": "60 seconds to answer as many as you can.",
    "El juego del día y los juegos de la banda salen cuando haya al menos 3 jugadores en la 224. Mientras, juega los de abajo.": "The game of the day and the crew games show up when there are at least 3 players in the 224. Meanwhile, play the ones below.",
    "Se acabó el tiempo.": "Time's up.", "Experto total.": "Total expert.", "Sabes bastante.": "You know a lot.", "A repasar.": "Time to study.",
    "Trivia de Minecraft": "Minecraft trivia", "10 preguntas del juego: mobs, crafteos, dimensiones.": "10 questions about the game: mobs, crafting, dimensions.",
    "Trivia de redstone": "Redstone trivia", "Para los que saben de pistones, repetidores y relojes.": "For those who know pistons, repeaters and clocks.", "Trivia": "Trivia", "Redstone": "Redstone",
    "Adivina el mob": "Guess the mob", "La cara se va destapando. Mientras antes adivines, más puntos.": "The face reveals itself bit by bit. The sooner you guess, the more points.",
    "Mientras más rápido adivinas, más puntos.": "The faster you guess, the more points.", "¿Qué mob es? Se va destapando…": "Which mob is it? It's being revealed…", "Vale 100 puntos": "Worth 100 points",
    "Crafteo": "Crafting", "Te enseño la receta y tú dices qué sale.": "I show you the recipe and you say what it makes.", "¿Qué sale de esta receta?": "What does this recipe make?",
    "Te sabes las recetas de memoria.": "You know the recipes by heart.", "Buen crafteador.": "Good crafter.", "A abrir el libro de recetas.": "Time to open the recipe book.",
    "Wordle de Minecraft": "Minecraft Wordle", "Una palabra de 5 letras al día, 6 intentos.": "One 5-letter word a day, 6 tries.", "Wordle del día": "Wordle of the day",
    "Wordle libre": "Free Wordle", "Palabra al azar. Puedes jugar las que quieras.": "Random word. Play as many as you want.", "Una palabra de Minecraft al día, igual para todos.": "One Minecraft word a day (in Spanish), same for everyone.",
    "Jugar una libre": "Play a free one", "Ya jugaste el de hoy. Esta es una libre.": "You already played today's. This one is free.", "Faltan letras.": "Not enough letters.",
    "Enviar": "Enter", "Borrar": "Delete",
    "Snake del ajolote": "Axolotl Snake", "Come y crece sin chocar con las paredes ni contigo.": "Eat and grow without hitting the walls or yourself.",
    "Presiona una flecha para empezar": "Press an arrow to start", "Fin del juego": "Game over", "Flechas, WASD o desliza el dedo.": "Arrows, WASD or swipe.",
    "Flappy elytra": "Flappy elytra", "Vuela entre los pilares de obsidiana.": "Fly between the obsidian pillars.", "Toca o presiona espacio": "Tap or press space", "¡Chocaste!": "You crashed!",
    "Cada toque te impulsa hacia arriba. Esquiva los pilares de obsidiana.": "Each tap pushes you up. Dodge the obsidian pillars.",
    "Tetris de bloques": "Block Tetris", "Con bloques de diamante, oro, redstone y más.": "With diamond, gold, redstone blocks and more.",
    "Flechas para mover, arriba para girar, espacio para soltar.": "Arrows to move, up to rotate, space to drop.", "Girar": "Rotate", "Soltar": "Drop",
    "Buscaminas de creepers": "Creeper Minesweeper", "Destapa todo sin despertar a un creeper.": "Clear everything without waking a creeper.",
    "Destapa todo sin tocar un creeper. En compu, clic derecho pone bandera.": "Clear everything without touching a creeper. On a computer, right-click places a flag.",
    "¡Ssss… BOOM! Le diste a un creeper.": "Ssss… BOOM! You hit a creeper.", "Modo bandera: no": "Flag mode: off", "Modo bandera: sí": "Flag mode: on",
    "Reflejos contra el creeper": "Creeper reflexes", "Pégale antes de que explote. Cada vez más rápido.": "Hit it before it explodes. Faster and faster.",
    "Sale un creeper. Pícale antes de que explote. Si le das a un hoyo vacío, pierdes una vida.": "A creeper pops up. Tap it before it explodes. Tap an empty hole and you lose a life.",
    "¡Atento!": "Get ready!", "¡Explotó!": "It exploded!", "Ese hoyo estaba vacío.": "That hole was empty.",
    // Mobs e items
    "Zombi": "Zombie", "Esqueleto": "Skeleton", "Cerdo": "Pig", "Oveja": "Sheep", "Gallina": "Chicken", "Araña": "Spider", "Aldeano": "Villager", "Vaca": "Cow",
    "Gólem de hierro": "Iron Golem", "Esqueleto del Wither": "Wither Skeleton", "Bruja": "Witch", "Ahogado": "Drowned",
    "Tablas": "Planks", "Palo": "Stick", "Carbón": "Coal", "Roca": "Cobblestone", "Hierro": "Iron", "Trigo": "Wheat", "Lana": "Wool", "Pólvora": "Gunpowder", "Arena": "Sand",
    "Libro": "Book", "Obsidiana": "Obsidian", "Bloque de hierro": "Iron block", "Cuerda": "String", "Vidrio": "Glass", "Estrella del Nether": "Nether star", "Papel": "Paper",
    "Cuero": "Leather", "Caña de azúcar": "Sugar cane", "Cubeta de leche": "Milk bucket", "Azúcar": "Sugar", "Huevo": "Egg", "Perla de ender": "Ender pearl",
    "Polvo de blaze": "Blaze powder", "Pedernal": "Flint", "Pluma": "Feather", "Cobre": "Copper", "Fragmento de amatista": "Amethyst shard", "Antorcha": "Torch", "Manzana": "Apple",
    "Mesa de crafteo": "Crafting table", "Pico de piedra": "Stone pickaxe", "Espada de hierro": "Iron sword", "Horno": "Furnace", "Cofre": "Chest", "Cubeta": "Bucket",
    "Pan": "Bread", "Cama": "Bed", "Escalera de mano": "Ladder", "Barco": "Boat", "Brújula": "Compass", "Reloj": "Clock", "TNT": "TNT", "Mesa de encantamientos": "Enchanting table",
    "Yunque": "Anvil", "Arco": "Bow", "Faro": "Beacon", "Pistón": "Piston", "Puerta de madera": "Wooden door", "Escudo": "Shield", "Pico de diamante": "Diamond pickaxe",
    "Pala de hierro": "Iron shovel", "Hacha de piedra": "Stone axe", "Azada de hierro": "Iron hoe", "Casco de hierro": "Iron helmet", "Peto de hierro": "Iron chestplate",
    "Pantalones de hierro": "Iron leggings", "Botas de hierro": "Iron boots", "Pastel": "Cake", "Antorcha de redstone": "Redstone torch", "Palanca": "Lever",
    "Caña de pescar": "Fishing rod", "Tijeras": "Shears", "Vagoneta": "Minecart", "Rieles": "Rails", "Bloque de diamante": "Diamond block", "Ojo de ender": "Eye of Ender",
    "Bol": "Bowl", "Flecha": "Arrow", "Catalejo": "Spyglass", "Manzana dorada": "Golden apple", "Librero": "Bookshelf", "Barrotes de hierro": "Iron bars",
    "Caída": "Fall", "se cayó": "fell", "Se ahogó": "Drowned", "se ahogó": "drowned", "murió de forma rara": "died in a weird way", "Otras": "Other", "Por tonto, todas": "Silly, all of them",
    "Otra cosa": "Something else",
    // Medallas
    "Viciado": "Addict", "Millonario": "Millionaire", "Cazador": "Hunter", "Inmortal": "Immortal", "Fiel": "Loyal", "Chismoso": "Chatterbox", "Fotógrafo": "Photographer",
    "Por Tonto": "Clumsy", "Pescador": "Fisher", "Granjero": "Farmer", "Criador": "Breeder", "Comerciante": "Trader", "Encantador": "Enchanter", "Arquitecto": "Architect",
    "Nadador": "Swimmer", "Piloto": "Pilot", "Jinete": "Rider", "Marinero": "Sailor", "Dormilón": "Sleepyhead", "Chef": "Chef", "Saqueador": "Looter", "Trotamundos": "Globetrotter",
    "Primer diamante de la 224": "First diamond of the 224", "Primero en el Nether": "First in the Nether", "Primero en el End": "First in the End", "Matadragones": "Dragon Slayer",
    "Viajero del End": "End Traveler", "Campeón": "Champion", "Cazador de Wither": "Wither Hunter", "Valiente": "Brave", "Ciudad del End": "End City", "Alas": "Wings",
    "Poseidón": "Poseidon", "De milagro": "Miracle", "Saqueador de bastiones": "Bastion Raider", "Buzo": "Diver", "Silencio": "Silence", "Héroe del pueblo": "Village Hero",
    "Ajolotero": "Axolotl Catcher", "Mejor amigo": "Best Friend", "Michi": "Kitty", "Mielero": "Beekeeper", "Arqueólogo": "Archaeologist", "Noctámbulo": "Night Owl",
    "Compañero": "Buddy", "Completista": "Completionist", "Rey Minero": "Mining King", "Magnate": "Tycoon", "Señor de la Netherita": "Netherite Lord", "El Más Viciado": "The Biggest Addict",
    "Exterminador": "Exterminator", "Gran Viajero": "Great Traveler", "Intocable": "Untouchable", "NIVEL": "LEVEL",
    "Ser el primero de todo el server en sacar diamante": "Be the first on the whole server to get a diamond", "Ser el primero de todo el server en entrar al Nether": "Be the first on the whole server to enter the Nether",
    "Ser el primero de todo el server en llegar al End": "Be the first on the whole server to reach the End", "Matar al Ender Dragon": "Kill the Ender Dragon", "Llegar al End": "Reach the End",
    "Ganar la liga de un mes": "Win a monthly league", "Matar al Wither": "Kill the Wither", "Matar a un Warden": "Kill a Warden", "Encontrar una ciudad del End": "Find an End city",
    "Conseguir unas elytras": "Get elytra", "Conseguir un tridente": "Get a trident", "Salvarte de morir con un tótem": "Survive death with a totem", "Entrar a un bastión del Nether": "Enter a Nether bastion",
    "Vencer a un guardián del monumento del océano": "Defeat a guardian of an ocean monument", "Sacar un tesoro de una ciudad antigua": "Loot an ancient city", "Ganar una raid de aldeanos": "Win a village raid",
    "Atrapar un ajolote en una cubeta": "Catch an axolotl in a bucket", "Domesticar un lobo": "Tame a wolf", "Domesticar un gato": "Tame a cat", "Visitar una jungla de bambú, donde viven los pandas": "Visit a bamboo jungle, where pandas live",
    "Sacar miel sin que te piquen": "Get honey without getting stung", "Conseguir un huevo de sniffer": "Get a sniffer egg", "Pasar 5 días del juego sin dormir": "Go 5 in-game days without sleeping",
    "Jugar 20 horas con alguien más conectado": "Play 20 hours with someone else online", "Tener todas las medallas al menos de bronce": "Have every medal at least at bronze",
    "Ser el que más bloques ha minado (mínimo 5,000)": "Have mined the most blocks (at least 5,000)", "Ser el que más diamantes ha sacado (mínimo 50)": "Have the most diamonds (at least 50)",
    "Ser el que más ancient debris ha sacado (mínimo 8)": "Have the most ancient debris (at least 8)", "Ser el que más horas ha jugado (mínimo 50)": "Have played the most hours (at least 50)",
    "Ser el que más mobs ha matado (mínimo 1,000)": "Have killed the most mobs (at least 1,000)", "Ser el que más ha caminado (mínimo 100 km)": "Have walked the most (at least 100 km)",
    "Tener el récord sin morir más largo (mínimo 10 horas)": "Have the longest life record (at least 10 hours)",
    "La historia de la 224 empieza el día de la inauguración.": "The 224's story starts on opening day.", "fotógrafos": "photographers", "fotógrafo": "photographer",
    "con unos": "with about", "Si siguen así, gana": "If things stay like this, the winner is", "puntos.": "points.", "su primera muerte": "their first death",

  };

  // ---------- Frases que llevan números o nombres ----------
  const R = [
    [/^Medalla única: (.+)$/, (m, a) => `Unique medal: ${D[a] || a}`],
    [/^(Llegó a|Juntó|Sacó) (.+)$/, (m, v, a) => `${{ "Llegó a": "Reached", "Juntó": "Collected", "Sacó": "Got" }[v]} ${traducir(a)}`],
    [/^Medalla (.+) de (Bronce|Plata|Oro|Diamante)$/, (m, a, b) => `${D[a] || a} medal (${D[b]})`],
    [/^(.+) de (Bronce|Plata|Oro|Diamante)$/, (m, a, b) => `${D[a] || a} (${D[b]})`], [/^(.+) medal \((.+)\)$/, (m, a, b) => `${D[a] || a} medal (${b})`],
    [/^Medalla (.+)$/, (m, a) => `${D[a] || a} medal`], [/^Medalla única: (.+)$/, (m, a) => `Unique medal: ${D[a] || a}`],
    [/^Juega (.+) horas\.?$/, "Play $1 hours"], [/^Mina (.+) bloques\.?$/, "Mine $1 blocks"], [/^Saca (.+) diamantes\.?$/, "Get $1 diamonds"], [/^Mata (.+) mobs\.?$/, "Kill $1 mobs"],
    [/^Camina (.+) metros\.?$/, "Walk $1 meters"], [/^Aguanta (.+) minutos sin morir\.?$/, "Last $1 minutes without dying"], [/^Entra (.+) días seguidos\.?$/, "Log in $1 days in a row"],
    [/^Manda (.+) mensajes en el chat\.?$/, "Send $1 chat messages"], [/^Sube (.+) capturas? al Discord\.?$/, "Post $1 screenshots on Discord"], [/^Muérete (.+) veces\.?$/, "Die $1 times"],
    [/^Pesca (.+) cosas\.?$/, "Fish $1 things"], [/^Cosecha (.+) cultivos\.?$/, "Harvest $1 crops"], [/^Cría (.+) animales\.?$/, "Breed $1 animals"], [/^Haz (.+) tratos con aldeanos\.?$/, "Make $1 villager trades"],
    [/^Encanta (.+) cosas\.?$/, "Enchant $1 items"], [/^Coloca (.+) bloques\.?$/, "Place $1 blocks"], [/^Nada (.+) metros\.?$/, "Swim $1 meters"], [/^Vuela (.+) metros con elytra\.?$/, "Fly $1 meters with elytra"],
    [/^Cabalga (.+) metros\.?$/, "Ride $1 meters"], [/^Navega (.+) metros en barco\.?$/, "Sail $1 meters by boat"], [/^Duerme (.+) veces\.?$/, "Sleep $1 times"], [/^Cocina (.+) comidas\.?$/, "Cook $1 meals"],
    [/^Saca (.+) ancient debris\.?$/, "Get $1 ancient debris"], [/^Abre (.+) cofres\.?$/, "Open $1 chests"], [/^Visita (.+) biomas\.?$/, "Visit $1 biomes"],
    [/^Tuvo su primera muerte$/, "Had their first death"], [/^Tuvo (.+) muertes$/, "Reached $1 deaths"], [/^(.+) horas? jugadas?$/, "$1 hours played"],
    [/^(.+) bloques minados$/, "$1 blocks mined"], [/^(.+) mobs matados$/, "$1 mobs killed"], [/^(.+) km caminados$/, "$1 km walked"], [/^(.+) diamantes$/, "$1 diamonds"],
    [/^(.+) · solo la tiene él$/, "$1 · only they have it"], [/^ ?(\d+) días de racha$/, " $1-day streak"], [/^Wrapped del año (\d+)$/, "Wrapped of the year $1"],
    [/^(Caída|Araña|Zombi|Esqueleto|Creeper|Lava|Fuego|Ahogado|Otras)(: .+)$/, (m, a, b) => (D[a] || a) + b],
    [/^hace (\d+) min$/, "$1 min ago"], [/^hace (\d+) h$/, "$1 h ago"], [/^hace (\d+) días?$/, "$1 days ago"], [/^hace (\d+) meses?$/, "$1 months ago"],
    [/^(\d+) días?$/, "$1 days"], [/^(\d+) días? seguidos$/, "$1 days in a row"], [/^(\d+) días? de racha$/, "$1-day streak"], [/^Día (\d+)$/, "Day $1"],
    [/^Ranking de (.+)$/, "$1 ranking"], [/^Liga de (.+)$/, "$1 league"], [/^Campeón de (.+)$/, "Champion of $1"], [/^Perfil de (.+)$/, "$1's profile"],
    [/^Skin de (.+)$/, "$1's skin"], [/^Wrapped de (.+)$/, "$1 Wrapped"], [/^El más tonto de (.+)$/, "Clumsiest of $1"], [/^Medalla (.+) de (Bronce|Plata|Oro|Diamante)$/, (m, a, b) => `${a} medal (${D[b]})`],
    [/^Medalla (.+)$/, "$1 medal"], [/^Nv (\d+)$/, "Lv $1"], [/^Nivel (\d+)$/, "Level $1"], [/^Top · (.+)$/, "Top · $1"],
    [/^(.+)× el promedio$/, "$1× the average"], [/^(\d+)% del promedio$/, "$1% of average"], [/^#(\d+) de (\d+)$/, "#$1 of $2"],
    [/^(\d+) de (\d+) jugadores?$/, "$1 of $2 players"], [/^Nadie se llama "(.+)" en la 224\.$/, "Nobody called \"$1\" in the 224."],
    [/^(.+) en la 224$/, "$1 in the 224"], [/^En la 224 desde el (.+?)( · racha actual: (\d+) días?)?$/, (m, f, r, n) => `In the 224 since ${f}${r ? ` · current streak: ${n} days` : ""}`],
    [/^Siguiente: (.+?)\. (.+) \(llevas (.+), te faltan (.+)\)\.$/, (m, a, b, c, d) => `Next: ${D[a] || a}. ${b} (you have ${c}, ${d} to go).`],
    [/^La ganó el (.+)\.$/, "Earned on $1."], [/^La ganó antes de que existiera el bot\.$/, "Earned before the bot existed."],
    [/^La tiene 1 de (\d+) jugadores \((\d+)%\)\. ¡Rarísima!$/, "1 of $1 players has it ($2%). Super rare!"], [/^La tienen (\d+) de (\d+) jugadores \((\d+)%\)\.$/, "$1 of $2 players have it ($3%)."],
    [/^completado · (\d+) de (\d+) niveles$/, "complete · $1 of $2 levels"], [/^Solo la tienen (\d+) de (\d+)$/, "Only $1 of $2 have it"],
    [/^ · va para ~(.+)$/, " · on track for ~$1"], [/^Desde el (.+) hasta hoy$/, "From $1 until today"], [/^(.+) acumuladas$/, "$1 (total)"],
    [/^(.+) · en curso$/, "$1 · in progress"], [/^(.+) pts$/, "$1 pts"], [/^Mejor racha: (\d+) días$/, "Best streak: $1 days"],
    [/^(.+) \/ (.+) XP para el nivel (.+)$/, "$1 / $2 XP to level $3"], [/^Récord: (\d+) al mismo tiempo$/, "Record: $1 at the same time"],
    [/^Sin internet · estás viendo los datos de (.+)$/, "Offline · you're seeing data from $1"], [/^Datos del (.+)$/, "Data from $1"],
    [/^¿Quién tiene más (.+)\?$/, "Who has more $1?"], [/^¿Cuántos (.+) tiene (.+)\?$/, "How many $1 does $2 have?"], [/^Es la skin de (.+)\.$/, "It's $1's skin."],
    [/^(.+) llegó el (.+)\.$/, "$1 arrived on $2."], [/^Hoy sacaste (\d+) de (\d+)$/, "Today you got $1 of $2"], [/^El siguiente sale en (.+)\.$/, "The next one comes out in $1."],
    [/^Juego del día #(\d+)$/, "Game of the day #$1"], [/^Racha: (\d+) días? · el siguiente sale en (.+)$/, "Streak: $1 days · next one in $2"],
    [/^Perdiste con (.+) puntos?\.$/, "You lost with $1 points."], [/^¡Listo en (.+) segundos y (\d+) movimientos!( Nuevo récord\.)?$/, (m, s, n, r) => `Done in ${s} seconds and ${n} moves!${r ? " New record." : ""}`],
    [/^Difícil: (.+)$/, "Hard: $1"], [/^Tu récord: (.+)$/, "Your record: $1"], [/^Récord (.+)$/, "Record $1"], [/^Era (.+)\.$/, (m, a) => `It was ${D[a] || a}.`],
    [/^Sale: (.+)\.$/, (m, a) => `It makes: ${D[a] || a}.`], [/^¡Bien! Era (.+)\.$/, "Nice! It was $1."], [/^Comiste (\d+)\.( ¡Nuevo récord!)?$/, (m, n, r) => `You ate ${n}.${r ? " New record!" : ""}`],
    [/^Pasaste (\d+) pilar(es)?\.( ¡Nuevo récord!)?$/, (m, n, p, r) => `You passed ${n} pillar${n === "1" ? "" : "s"}.${r ? " New record!" : ""}`],
    [/^(.+) puntos y (\d+) líneas?\.( ¡Nuevo récord!)?$/, (m, a, n, r) => `${a} points and ${n} line${n === "1" ? "" : "s"}.${r ? " New record!" : ""}`],
    [/^¡Ganaste en (.+) segundos!( Nuevo récord\.)?$/, (m, s, r) => `You won in ${s} seconds!${r ? " New record." : ""}`],
    [/^Le pegaste a (\d+) creepers?\.( ¡Nuevo récord!)?$/, (m, n, r) => `You hit ${n} creeper${n === "1" ? "" : "s"}.${r ? " New record!" : ""}`],
    [/^(\d+) aciertos? y (\d+) errore?s?\.( ¡Nuevo récord!)?$/, (m, a, b, r) => `${a} correct and ${b} wrong.${r ? " New record!" : ""}`],
    [/^Vale (\d+) puntos$/, "Worth $1 points"], [/^por cada (.+) bloques minados \(el netherrack no cuenta\)$/, "per $1 blocks mined (netherrack doesn't count)"],
    [/^por cada (.+) mobs$/, "per $1 mobs"], [/^por cada (.+) metros caminados$/, "per $1 meters walked"], [/^La tiene (.+)$/, "$1 has it"],
    [/^Llegó a (.+)$/, "Reached $1"], [/^Juntó (.+)$/, (m, a) => `Collected ${traducir(a)}`], [/^Sacó (.+)$/, (m, a) => `Got ${traducir(a)}`], [/^Racha de (\d+) días$/, "$1-day streak"],
    [/^Jugó (.+) horas en un solo día\.$/, "Played $1 hours in a single day."], [/^Medalla única: (.+)$/, "Unique medal: $1"], [/^Su Wrapped de (.+)$/, "Their $1 Wrapped"],
    [/^completado · (\d+) de (\d+) niveles · \+(\d+) únicas?$/, "complete · $1 of $2 levels · +$3 unique"], [/^Meta: (.+)$/, "Goal: $1"], [/^Subida por (.+)$/, "Uploaded by $1"], [/^Ronda (.+)$/, "Round $1"],
    [/^Si siguen así, gana (.+) con unos (.+) puntos\.$/, "If things stay like this, $1 wins with about $2 points."],
    [/^Nadie jugando\. La última fue (.+), (.+)\.$/, "Nobody playing. Last one was $1, $2."], [/^El enemigo número 1: (.+)$/, "Enemy number 1: $1"],
    [/^Carta de (.+)\. Pícale para voltearla$/, "$1's card. Tap to flip it"], [/^lo mató (.+)$/, "was killed by $1"], [/^murió por (.+)$/, "died from $1"],
    [/^El (.+) alguien (.+)\. ¿Quién fue\?$/, "On $1 someone $2. Who was it?"],
    [/^En (\d+) días? la 224 cumple (\d+) años?\.$/, "In $1 days the 224 turns $2."], [/^La 224 cumplió (\d+) años?\. Gracias por jugar\.$/, "The 224 turned $1. Thanks for playing."],
    [/^(Visto|Visto hace) (.+)$/, "Seen $2"], [/^Saqué (.+) en (.+) de la 224\.$/, "I got $1 in the 224's $2."], [/^(\d+) \/ (\d+)$/, "$1 / $2"],
  ];

  // Meses y fechas cortas ("14 de oct" -> "Oct 14", "Octubre 2026" -> "October 2026")
  const MESES = { enero: "January", febrero: "February", marzo: "March", abril: "April", mayo: "May", junio: "June", julio: "July", agosto: "August", septiembre: "September", octubre: "October", noviembre: "November", diciembre: "December" };
  const CORTOS = { ene: "Jan", feb: "Feb", mar: "Mar", abr: "Apr", may: "May", jun: "Jun", jul: "Jul", ago: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dic: "Dec" };
  const fechas = t => t
    .replace(/\b(\d{1,2}) de (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b( \d{4})?/gi, (m, d, mes, a) => `${CORTOS[mes.toLowerCase()]} ${d}${a ? "," + a : ""}`)
    .replace(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)( de (\d{4}))?/gi, (m, d, mes, x, a) => `${MESES[mes.toLowerCase()]} ${d}${a ? ", " + a : ""}`)
    .replace(/\b(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\b/g, m => MESES[m.toLowerCase()]);

  function traducir(texto) {
    const core = texto.replace(/\s+/g, " ").trim();
    if (!core || !/[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]/.test(core)) return texto;
    let t = D[core];
    if (t === undefined) {
      for (const [re, rep] of R) if (re.test(core)) { t = core.replace(re, rep); break; }
    }
    if (t === undefined) { const f = fechas(core); if (f !== core) t = f; }
    else t = fechas(t);
    if (t === undefined) return texto;
    const ini = texto.match(/^\s*/)[0], fin = texto.match(/\s*$/)[0];
    return ini + t + fin;
  }
  window.M224Idioma.t = traducir;

  // Los textos que se dibujan en los juegos (canvas)
  const fillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, ...a) { return fillText.call(this, typeof t === "string" ? traducir(t) : t, ...a); };

  const ATRIBUTOS = ["placeholder", "aria-label", "title", "alt"];
  const hecho = new WeakMap();
  function nodo(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement;
      if (!p || p.closest("script,style,.hist,.wr,[data-sin-traducir]")) return;
      if (hecho.get(n) === n.nodeValue) return;
      const nuevo = traducir(n.nodeValue);
      if (nuevo !== n.nodeValue) n.nodeValue = nuevo;
      hecho.set(n, n.nodeValue);
      return;
    }
    if (n.nodeType !== 1 || n.matches("script,style")) return;
    for (const a of ATRIBUTOS) if (n.hasAttribute(a)) { const v = n.getAttribute(a), nv = traducir(v); if (nv !== v) n.setAttribute(a, nv); }
    if (n.tagName === "INPUT" && (n.type === "button" || n.type === "submit") && n.value) n.value = traducir(n.value);
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let x; while ((x = w.nextNode())) {
      if (x.nodeType === 3) nodo(x);
      else for (const a of ATRIBUTOS) if (x.hasAttribute(a)) { const v = x.getAttribute(a), nv = traducir(v); if (nv !== v) x.setAttribute(a, nv); }
    }
  }
  function arrancar() {
    document.title = "Minecraft 224 · CBTIS 224 Minecraft Server";
    nodo(document.body);
    new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === "characterData") nodo(m.target);
        else if (m.type === "attributes") { const v = m.target.getAttribute(m.attributeName); if (v) { const nv = traducir(v); if (nv !== v) m.target.setAttribute(m.attributeName, nv); } }
        else m.addedNodes.forEach(nodo);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
