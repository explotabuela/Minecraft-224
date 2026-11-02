using Bot224;
using System.Text.RegularExpressions;

Console.OutputEncoding = System.Text.Encoding.UTF8;
Console.WriteLine("=== BOT 224 ===");

var config = Config.Cargar("config.json");
var webhook = new Webhook(config.WebhookUrl);
// Si hay webhook_chat, el chat del juego va a su propio canal; si no, al mismo de siempre
var webhookChat = string.IsNullOrWhiteSpace(config.WebhookChat) ? webhook : new Webhook(config.WebhookChat);
var rcon = new Rcon(config.RconHost, config.RconPuerto, config.RconPassword);

// Datos que guarda el bot
var alias = new Alias();
var rachas = new Rachas();
var wrapped = new Wrapped();
var historial = new Historial();
var liga = new Liga();
var medallas = new Medallas();
var presencia = new Presencia();
var vinculos = new Vinculos();

var stats = new Stats(config, rcon, alias);
Skins.Fuente = stats;
Skins.UrlBase = config.PaginaUrl;
var github = new GitHub(config);
var avisos = new Anunciador(config, webhook);
var desaparecidos = new Desaparecidos(rachas, avisos);
var lector = new LectorLog(config, webhook, webhookChat, rachas, wrapped, alias, presencia, desaparecidos);
var ranking = new Ranking(config, stats, avisos);
var pagina = new Pagina(config, stats, rachas, wrapped, historial, liga, medallas, presencia, avisos, github, alias);
pagina.SkinsReales = new Skins(stats, github);
pagina.MundoMc = new Mundo(config, alias);
var resumen = new Resumen(config, stats, avisos);
var vigilante = new Vigilante(rcon, webhook);
Discord? discord = null;
Altas? altas = null;
Capturas? capturas = null;

// Juntar dos nombres de la misma persona (Java + Bedrock) en todo
async Task Unir(string principal, string otro)
{
    alias.Unir(principal, otro);
    historial.Renombrar(otro, principal);
    wrapped.Renombrar(otro, principal);
    rachas.Renombrar(otro, principal);
    medallas.Renombrar(otro, principal);
    liga.Renombrar(otro, principal);
    vinculos.Renombrar(otro, principal);
    presencia.Renombrar(otro, principal);
    Console.WriteLine($"[Unir] {otro} ahora cuenta como {principal} ✔");
    // Que la página y los comandos ya lo vean junto
    if (!args.Contains("--una-vez")) _ = Task.Run(async () => { try { await pagina.ActualizarAsync(); } catch (Exception ex) { Console.WriteLine($"[Página] Error: {ex.Message}"); } });
    await Task.CompletedTask;
}

// Cierre del mes: anuncia al campeón y le da su rol "Campeón de Diciembre 2026"
pagina.CampeonNuevo += async (mes, tabla) =>
{
    var nombreMes = Liga.NombreMes(mes);
    var campeon = tabla[0];
    var podio = string.Join("\n", tabla.Take(3).Select((f, k) => $"{new[] { "🥇", "🥈", "🥉" }[k]} **{f.Nombre}** — {f.Puntos:N0} pts"));
    string? notaRol = null;
    if (discord is { Conectado: true } && discord.Servidores.Count > 0)
    {
        var usuario = vinculos.DiscordDe(campeon.Nombre);
        if (usuario == null) notaRol = $"(Dylan: usa `/vincular` con el Discord de {campeon.Nombre} para darle su rol)";
        else
        {
            var rol = await discord.CrearRolAsync(discord.Servidores[0], $"Campeón de {nombreMes}", 0xF5C451);
            if (rol != null && await discord.DarRolAsync(discord.Servidores[0], usuario, rol))
                notaRol = $"<@{usuario}> ganó el rol **Campeón de {nombreMes}** 👑";
            else notaRol = "(No pude dar el rol: el bot necesita el permiso de Gestionar roles)";
        }
    }
    await avisos.AnunciarAsync(notaRol ?? "", new
    {
        title = $"👑 CAMPEÓN DE {nombreMes.ToUpper()}",
        description = $"## {campeon.Nombre}\nGanó la liga con **{campeon.Puntos:N0} puntos**.\n\n{podio}\n\nYa salió el Wrapped de {nombreMes}. ¡Arranca la liga nueva!",
        color = 0xF5C451,
        image = new { url = Skins.CuerpoUrl(campeon.Nombre) },
    }, new[] { ("Ver la liga del mes", $"#mes-{mes}"), ("Wrapped de la 224", $"#wrapped-224~{mes}") });
    Console.WriteLine($"[Liga] Campeón de {nombreMes}: {campeon.Nombre}");
};

// Modo GitHub: hace una sola ronda y se apaga (lo corre GitHub Actions cada 10 minutos)
var unaVez = args.Contains("--una-vez");
if (unaVez)
{
    await RondaAsync(Environment.GetEnvironmentVariable("M224_COMANDO")?.Trim() ?? "");
    return;
}

// Probar RCON al arrancar (y ver quién está conectado)
try
{
    var r = await rcon.ComandoAsync("list");
    Console.WriteLine($"[RCON] Conectado ✔ ({r.Trim()})");
    var m = Regex.Match(r, @"online:\s*(.*)$", RegexOptions.Singleline);
    var conectados = m.Success ? m.Groups[1].Value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries) : Array.Empty<string>();
    presencia.Sincronizar(conectados.Select(alias.Principal));
}
catch (Exception ex)
{
    Console.WriteLine($"[RCON] No se pudo conectar: {ex.Message}");
    Console.WriteLine("        Revisa que el server esté prendido y los datos de RCON en config.json");
}

altas = new Altas(config, rcon, alias, Unir);
var cancelar = new CancellationTokenSource();
_ = lector.CorrerAsync(cancelar.Token);
_ = ranking.CorrerAsync(cancelar.Token);
_ = pagina.CorrerAsync(cancelar.Token);
_ = resumen.CorrerAsync(cancelar.Token);
_ = vigilante.CorrerAsync(cancelar.Token);
_ = desaparecidos.CorrerAsync(cancelar.Token);
_ = new Inauguracion(config, avisos).CorrerAsync(cancelar.Token);
_ = new AperturaNether(config, rcon, avisos).CorrerAsync(cancelar.Token);

// Bot de Discord (comandos, chat de dos sentidos, whitelist, capturas)
if (string.IsNullOrWhiteSpace(config.DiscordToken))
{
    Console.WriteLine("[Discord] Sin discord_token: no hay /comandos ni chat desde Discord (lo demás sí funciona)");
}
else
{
    discord = new Discord(config);
    pagina.AvisarAdmin = async texto => { if (discord != null && config.AdminId != "") await discord.MandarDmAsync(config.AdminId, new { content = texto }); };
    _ = new Comandos(config, discord, rcon, stats, rachas, vinculos, alias, pagina, wrapped, Unir, altas!);
    // Capturas: las fotos del canal de capturas se suben solas a la página
    capturas = new Capturas(config, discord, github, vinculos);
    var chat = discord.AlMensaje;
    discord.AlMensaje = async m =>
    {
        if (chat != null) await chat(m);
        await capturas.MensajeAsync(m);
    };
    discord.AlReaccion = capturas.ReaccionAsync;
    var registrar = discord.AlConectar;
    var d = discord;
    discord.AlConectar = async servidores =>
    {
        if (registrar != null) await registrar(servidores);
        await avisos.ConectarAsync(d);
    };
    _ = discord.CorrerAsync(cancelar.Token);
}

Console.WriteLine();
Console.WriteLine("Comandos:");
Console.WriteLine("  prueba        -> manda un mensaje de prueba a Discord");
Console.WriteLine("  tonto         -> publica el ranking del más tonto ahorita");
Console.WriteLine("  resumen       -> publica el resumen del día ahorita");
Console.WriteLine("  pagina        -> actualiza las stats de la página web ahorita");
Console.WriteLine("  unir A B      -> junta al jugador B dentro de A (ej. unir Pepe .Pepe)");
Console.WriteLine("  alta J B      -> mete a la whitelist: J = usuario de Java (o - si no tiene), B = gamertag de Bedrock (opcional)");
Console.WriteLine("  bedrock       -> vuelve a intentar meter a los de Bedrock que quedaron pendientes");
Console.WriteLine("  temporada     -> deja todo en ceros para la inauguración (guarda un respaldo)");
Console.WriteLine("  texturas      -> sube las texturas de tu Minecraft para que los juegos de la página se vean como el juego");
Console.WriteLine("  mantenimiento -> vas a apagar el server: no avisa que se cayó");
Console.WriteLine("  salir         -> apaga el bot");
Console.WriteLine();

while (true)
{
    var linea = Console.ReadLine()?.Trim();
    var cmd = linea?.ToLower();
    if (cmd is null or "salir") break;
    try
    {
        if (cmd == "texturas" || cmd.StartsWith("texturas "))
        {
            await Texturas.SubirAsync(github, config, linea!.Length > 9 ? linea[9..] : null);
            continue;
        }
        if (cmd.StartsWith("alta "))
        {
            // alta Pepe            -> solo Java
            // alta Pepe Pepe Gamer -> Java + Bedrock (el gamertag puede tener espacios)
            // alta - Pepe Gamer    -> solo Bedrock
            var partes = linea!.Split(' ', 3, StringSplitOptions.RemoveEmptyEntries);
            var java = partes.Length > 1 && partes[1] != "-" ? partes[1] : null;
            var bedrock = partes.Length > 2 ? partes[2].Trim() : null;
            if (java == null && bedrock == null) Console.WriteLine("Así: alta UsuarioJava GamertagBedrock   (o: alta - Gamertag)");
            else if (java != null && !Altas.RegexJava.IsMatch(java)) Console.WriteLine("Ese usuario de Java no se ve bien (3 a 16 letras, números o _)");
            else if (bedrock != null && !Altas.RegexBedrock.IsMatch(bedrock)) Console.WriteLine("Ese gamertag no se ve bien (3 a 16 letras, números o espacios)");
            else
            {
                var r = await altas.DarDeAltaAsync(java, bedrock);
                foreach (var l in r.Lineas.Append(r.NotaAdmin).OfType<string>()) Console.WriteLine("  " + l.Replace("**", "").Replace("`", ""));
            }
            continue;
        }
        if (cmd.StartsWith("unir "))
        {
            var partes = linea!.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (partes.Length != 3) Console.WriteLine("Así: unir NombrePrincipal OtroNombre");
            else await Unir(partes[1], partes[2]);
            continue;
        }
        switch (cmd)
        {
            case "prueba":
                await webhook.EnviarAsync("✅ **El bot de la 224 está vivo**");
                Console.WriteLine("Mandado, revisa Discord");
                break;
            case "pagina":
                await pagina.ActualizarAsync();
                break;
            case "tonto":
                await ranking.PublicarAsync();
                break;
            case "resumen":
                await resumen.PublicarAsync();
                break;
            case "bedrock":
                await altas.ReintentarAsync();
                break;
            case "temporada":
            {
                var seVan = Temporada.LoQueSeVa();
                Console.WriteLine("Esto deja el bot en ceros para empezar la temporada (liga, medallas, rachas, historial, Wrapped, capturas...).");
                Console.WriteLine("Se quedan: " + string.Join(", ", Temporada.SeQuedan));
                Console.WriteLine("Se mueven a respaldos/: " + (seVan.Count == 0 ? "(nada)" : string.Join(", ", seVan)));
                Console.WriteLine("OJO: las stats de Minecraft viven en el mundo. Para que todos empiecen en 0 el server tiene que usar un mundo nuevo.");
                Console.Write("Escribe SI (en mayúsculas) para hacerlo: ");
                if (Console.ReadLine()?.Trim() != "SI") { Console.WriteLine("Cancelado, no se movió nada."); break; }
                if (capturas != null)
                {
                    Console.Write("¿Quito también las capturas de prueba de la página? (SI/no): ");
                    if (Console.ReadLine()?.Trim() == "SI")
                    {
                        try { Console.WriteLine($"Quitadas {await capturas.VaciarAsync()} capturas."); }
                        catch (Exception ex) { Console.WriteLine($"No se pudieron quitar las capturas: {ex.Message}"); }
                    }
                }
                cancelar.Cancel();
                await Task.Delay(3000); // que terminen de guardar lo que estaban guardando
                var carpeta = Temporada.Reiniciar(DateTime.Now);
                Console.WriteLine($"Listo ✔ Respaldo en {carpeta}");
                Console.WriteLine("El bot se va a cerrar. Vuelve a abrirlo (ya con el mundo nuevo) y todo empieza de cero.");
                Environment.Exit(0);
                break;
            }
            case "mantenimiento":
                vigilante.Silencio = true;
                Console.WriteLine("Listo: si apagas el server no se avisa. Cuando vuelva a prender se quita solo.");
                break;
            case "":
                break;
            default:
                Console.WriteLine("No conozco ese comando");
                break;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}

cancelar.Cancel();


async Task RondaAsync(string comando)
{
    var inauguracion = new Inauguracion(config, avisos);
    var nether = new AperturaNether(config, rcon, avisos);

    if (comando != "")
    {
        Console.WriteLine($"[Comando] {comando}");
        var partes = comando.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        try {
        switch (partes[0].ToLower())
        {
            case "prueba": await webhook.EnviarAsync("✅ **El bot de la 224 está vivo** (desde GitHub)"); break;
            case "tonto": await ranking.PublicarAsync(); break;
            case "resumen": await resumen.PublicarAsync(); break;
            case "mantenimiento": Vigilante.Mantenimiento(); Console.WriteLine("Listo: si el server se apaga no se avisa."); break;
            case "unir" when partes.Length == 3: await Unir(partes[1], partes[2]); break;
            case "temporada":
                Console.WriteLine($"Listo ✔ Respaldo en {Temporada.Reiniciar(DateTime.Now)}");
                return;
            case "pagina": break;
            default: Console.WriteLine("No conozco ese comando"); break;
        }
        } catch (Exception ex) { Console.WriteLine($"[Comando] Error: {ex.Message}"); }
    }

    var conectados = new List<string>();
    var vivo = true;
    try
    {
        var r = await rcon.ComandoAsync("list");
        var m = Regex.Match(r, @"online:\s*(.*)$", RegexOptions.Singleline);
        if (m.Success)
            conectados = m.Groups[1].Value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Select(alias.Principal).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }
    catch (Exception ex) { vivo = false; Console.WriteLine($"[RCON] No contesta: {ex.Message}"); }

    try { await vigilante.PasoAsync(vivo); } catch (Exception ex) { Console.WriteLine($"[Vigilante] {ex.Message}"); }

    if (vivo)
    {
        try { await stats.RegistrarConectadosAsync(); } catch { }
        var antes = presencia.EnLineaNombres();
        foreach (var j in conectados.Where(j => !antes.Contains(j, StringComparer.OrdinalIgnoreCase)))
        {
            presencia.Entro(j);
            try { await desaparecidos.RegresoAsync(j); } catch { }
            wrapped.Entro(j);
            var racha = rachas.Registrar(j, DateTime.Now);
            if (racha >= 2)
                try { await webhook.EnviarAsync($"🔥 **{j}** lleva **{racha} días seguidos** en la 224", j, Webhook.Cara(j)); } catch { }
        }
        foreach (var j in antes.Where(j => !conectados.Contains(j, StringComparer.OrdinalIgnoreCase))) presencia.Salio(j);
        presencia.Tick();
    }

    var muertesAntes = stats.MuertesGuardadas();
    try { await pagina.ActualizarAsync(); } catch (Exception ex) { Console.WriteLine($"[Página] Error: {ex.Message}"); }

    if (vivo)
    {
        var reales = stats.Reales().Values.ToList();
        foreach (var (nombre, total) in stats.MuertesGuardadas())
        {
            if (!muertesAntes.TryGetValue(nombre, out var previas)) continue;
            var nuevas = total - previas;
            if (nuevas <= 0 || nuevas > 20) continue;
            var principal = alias.Principal(nombre);
            for (var k = 0; k < nuevas; k++)
            {
                presencia.Murio(principal, "murió");
                wrapped.Muerte(principal, $"{nombre} died", reales, nombre);
            }
            try { await webhook.EnviarAsync(nuevas == 1 ? $"💀 **{principal}** se murió" : $"💀 **{principal}** se murió {nuevas} veces", principal, Webhook.Cara(principal)); } catch { }
        }
    }

    async Task Paso(string nombre, Func<Task> f)
    {
        try { await f(); } catch (Exception ex) { Console.WriteLine($"[{nombre}] {ex.Message}"); }
    }
    await Paso("Ranking", ranking.PasoAsync);
    await Paso("Resumen", resumen.PasoAsync);
    await Paso("Desaparecidos", desaparecidos.RevisarAsync);
    await Paso("Inauguración", inauguracion.PasoAsync);
    if (vivo) await Paso("Nether", nether.PasoAsync);
    if (pagina.TareaSkins != null) await Paso("Skins", () => pagina.TareaSkins);
    Console.WriteLine("[Ronda] Lista ✔");
}
