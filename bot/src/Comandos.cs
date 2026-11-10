using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Bot224;

// Los comandos de Discord, los botones de la whitelist y el chat de Discord -> Minecraft
public class Comandos
{
    private readonly Config _config;
    private readonly Discord _discord;
    private readonly Rcon _rcon;
    private readonly Stats _stats;
    private readonly Rachas _rachas;
    private readonly Vinculos _vinculos;
    private readonly Alias _alias;
    private readonly Pagina _pagina;
    private readonly Wrapped _wrapped;
    private readonly Func<string, string, Task> _unir;
    private readonly Altas _altas;

    private const int Verde = 0x5FD068;
    private static readonly Regex RegexOnline = new(@"There are (\d+) of a max of (\d+) players online:?\s*(.*)$", RegexOptions.Singleline);
    private static readonly string[] Medallitas = { "🥇", "🥈", "🥉" };

    public Comandos(Config config, Discord discord, Rcon rcon, Stats stats, Rachas rachas, Vinculos vinculos,
                    Alias alias, Pagina pagina, Wrapped wrapped, Func<string, string, Task> unir, Altas altas)
    {
        _config = config; _discord = discord; _rcon = rcon; _stats = stats; _rachas = rachas;
        _vinculos = vinculos; _alias = alias; _pagina = pagina; _wrapped = wrapped; _unir = unir; _altas = altas;

        discord.AlConectar = RegistrarAsync;
        discord.AlComando = ComandoAsync;
        discord.AlBoton = BotonAsync;
        discord.AlMensaje = ChatAsync;
    }

    private string Url(string ancla = "") => _config.PaginaUrl + ancla;
    private static string Perfil(string jugador) => "#j-" + Uri.EscapeDataString(jugador);

    // ---------- Registrar los comandos en el server de Discord ----------
    private static readonly (string Valor, string Nombre)[] Categorias =
    {
        ("liga", "Puntos de liga"), ("horas", "Horas jugadas"), ("diamantes", "Diamantes"), ("netherita", "Netherita"), ("minado", "Bloques minados"),
        ("mobs", "Mobs matados"), ("metros", "Metros caminados"), ("muertes", "Muertes"), ("racha", "Mejor racha"),
        ("nivel", "Nivel"), ("record", "Récord sin morir"),
    };

    private async Task RegistrarAsync(IEnumerable<string> servidores)
    {
        JsonObject Op(string nombre, string desc, bool requerido, JsonArray? opciones = null, int tipo = 3)
        {
            var o = new JsonObject { ["type"] = tipo, ["name"] = nombre, ["description"] = desc, ["required"] = requerido };
            if (opciones != null) o["choices"] = opciones;
            return o;
        }
        JsonObject Cmd(string nombre, string desc, params JsonObject[] ops) =>
            new() { ["name"] = nombre, ["description"] = desc, ["options"] = new JsonArray(ops) };
        JsonArray Opciones(params (string Nombre, string Valor)[] o) =>
            new(o.Select(x => (JsonNode)new JsonObject { ["name"] = x.Nombre, ["value"] = x.Valor }).ToArray());

        var comandos = new JsonArray
        {
            Cmd("ip", "La IP del server para entrar"),
            Cmd("chiste", "Un chiste malo de Minecraft"),
            Cmd("online", "Quién está jugando ahorita"),
            Cmd("stats", "Las stats de un jugador", Op("jugador", "Nombre en Minecraft (si no pones nada, las tuyas)", false)),
            Cmd("carta", "La carta de un jugador: nivel, rango, clase y stats", Op("jugador", "Nombre en Minecraft (si no pones nada, la tuya)", false)),
            Cmd("vs", "Compara a dos jugadores", Op("jugador1", "Primer jugador", true), Op("jugador2", "Segundo jugador", true)),
            Cmd("top", "El top 10 de lo que quieras",
                Op("categoria", "¿De qué?", true, Opciones(Categorias.Select(c => (c.Nombre, c.Valor)).ToArray())),
                Op("periodo", "¿De cuándo? (si no pones nada: siempre)", false, Opciones(("Esta semana", "semana"), ("Este mes", "mes"), ("Desde siempre", "siempre")))),
            Cmd("liga", "Cómo va la liga del mes"),
            Cmd("jefe", "Cuándo y dónde sale el próximo jefe"),
            Cmd("wrapped", "Te mando por privado el link de tu Wrapped del mes", Op("jugador", "Nombre en Minecraft (si no pones nada, el tuyo)", false)),
            Cmd("entrar", "Pide que te metan a la whitelist (si juegas en los dos, pon los dos)",
                Op("java", "Tu usuario de Java (compu)", false),
                Op("bedrock", "Tu gamertag de Bedrock (cel, consola, Windows)", false)),
            Cmd("unir", "(Solo Dylan) Junta dos nombres de la misma persona, ej. Java y Bedrock",
                Op("principal", "El nombre que se va a quedar", true), Op("otro", "El otro nombre (ej. .Pepe de Bedrock)", true)),
            Cmd("vincular", "(Solo Dylan) Dice qué usuario de Discord es qué jugador",
                Op("usuario", "El usuario de Discord", true, tipo: 6), Op("jugador", "Su nombre en Minecraft", true)),
        };
        foreach (var s in servidores)
            await _discord.RegistrarComandosAsync(s, comandos);
        Console.WriteLine("[Discord] Comandos listos: /ip /chiste /online /stats /carta /vs /top /liga /jefe /wrapped /entrar /unir /vincular");
    }

    // ---------- Comandos ----------
    private async Task ComandoAsync(JsonElement i)
    {
        var nombre = i.GetProperty("data").GetProperty("name").GetString();
        var privado = nombre is "wrapped" or "unir" or "vincular";
        await _discord.EsperarAsync(i, privado);
        object respuesta;
        try
        {
            respuesta = nombre switch
            {
                "ip" => Ip(),
                "chiste" => Chiste(),
                "online" => await OnlineAsync(),
                "stats" => await StatsAsync(i),
                "carta" => Carta(i),
                "vs" => await VsAsync(i),
                "top" => Top(i),
                "liga" => LigaCmd(),
                "jefe" => JefeCmd(),
                "wrapped" => await WrappedAsync(i),
                "entrar" => Entrar(i),
                "unir" => await UnirAsync(i),
                "vincular" => Vincular(i),
                _ => Texto("No conozco ese comando 🤨"),
            };
        }
        catch (Exception ex) when (ex is System.Net.Sockets.SocketException || ex.Message.Contains("RCON"))
        {
            respuesta = Texto("🔴 El server está apagado ahorita, intenta más al rato.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Discord] Error en /{nombre}: {ex.Message}");
            respuesta = Texto("😵 Algo salió mal. Dile a Dylan.");
        }
        await _discord.EditarRespuestaAsync(i, respuesta);
    }

    private static object Texto(string t) => new { content = t, allowed_mentions = new { parse = Array.Empty<string>() } };
    private object Embed(object e, params (string Texto, string Ancla)[] botones) => botones.Length == 0
        ? new { embeds = new[] { e }, allowed_mentions = new { parse = Array.Empty<string>() } }
        : new { embeds = new[] { e }, allowed_mentions = new { parse = Array.Empty<string>() }, components = Discord.Botones(botones.Select(b => (b.Texto, Url(b.Ancla))).ToArray()) };

    // ---------- /jefe ----------
    private object JefeCmd()
    {
        var ahora = DateTimeOffset.Now;
        var lista = Jefes.Calendario
            .Select(j => (J: j, F: DateTimeOffset.TryParse(j.Fecha, out var f) ? f : DateTimeOffset.MinValue))
            .Where(x => x.F > ahora.AddHours(-1)).OrderBy(x => x.F).ToList();
        if (lista.Count == 0)
            return Embed(new { title = "Ya pasaron todos los jefes", description = "La temporada ya terminó. Revisen la página para ver quién ganó cada uno.", color = 0xFFC94D }, ("Ver los jefes", "#jefes"));
        var (j, f) = lista[0];
        var unix = f.ToUnixTimeSeconds();
        var num = Array.IndexOf(Jefes.Calendario, j) + 1;
        var texto = f <= ahora
            ? $"**¡Ya está afuera!** Salió {j.Pista}. Vayan todos."
            : $"Sale el **<t:{unix}:F>**\n⏳ <t:{unix}:R>\n\nLo van a ver {j.Pista}. Un día antes aviso las coordenadas.";
        return Embed(new
        {
            title = $"Jefe {num} de {Jefes.Calendario.Length}: {j.Nombre.ToUpper()}",
            description = texto,
            color = j.Id == "profe" ? 0x6B45C4 : 0xFFC94D,
            image = new { url = Url($"img/jefes/{j.Id}.png") },
            footer = new { text = "Todos los que le peguen se llevan botín. El #1 en daño, un premio único." },
        }, ("Ver todos los jefes", "#jefes"));
    }

    // ---------- /chiste ----------
    private static readonly (string Pregunta, string Respuesta)[] Chistes =
    {
        ("¿Por qué el creeper no tiene amigos?", "Porque cada vez que se acerca a alguien, explota la relación."),
        ("¿Qué le dijo un bloque de tierra a otro?", "Nada, los bloques de tierra no hablan. Pero si hablaran, sería de lo bajo que han caído."),
        ("¿Por qué el esqueleto no fue a la fiesta?", "Porque no tenía cuerpo para eso."),
        ("¿Cuál es el mob más bueno para las matemáticas?", "La araña, porque tiene ocho patas para contar."),
        ("¿Qué hace un zombi en la escuela?", "Repite el año. Todos los años."),
        ("¿Por qué el enderman no juega a las escondidas?", "Porque si lo ves, se enoja y te encuentra él a ti."),
        ("¿Cómo se llama un diamante que cuenta chistes?", "Un diamante en bruto."),
        ("¿Por qué la gallina cruzó la lava?", "No la cruzó. Ahora es pollo asado."),
        ("¿Qué le dijo Steve a la cama a las 3 de la mañana?", "Ahorita voy, nomás mino un bloque más."),
        ("¿Por qué el aldeano siempre dice \"hmm\"?", "Porque está pensando cuánto más te va a cobrar."),
        ("¿Cuál es el colmo de un minero?", "Que se le pierda el pico en la cueva y no lo pueda minar."),
        ("¿Qué le dijo la lava al jugador?", "Te voy a extrañar, y a tus diamantes también."),
        ("¿Por qué el ghast llora tanto?", "Porque lleva toda la vida en el Nether y nadie le pregunta cómo está."),
        ("¿Qué mob es el mejor DJ?", "El slime, porque siempre trae el bajo rebotando."),
        ("¿Por qué el Warden no ve películas?", "Porque es ciego, pero si hablas durante la película, te encuentra."),
        ("¿Qué hace un panda en el gimnasio?", "Bambú-squats."),
        ("¿Por qué Herobrine nunca gana a las escondidas?", "Porque lo quitaron del juego en cada actualización."),
        ("¿Qué le dijo el pico de madera al pico de diamante?", "Algún día voy a ser como tú. El de diamante no contestó, estaba encantado."),
        ("¿Cuál es la comida favorita del creeper?", "La que le da un \"boom\" de sabor."),
        ("¿Por qué el pescador de la 224 nunca pesca nada?", "Porque se la pasa revisando el Discord."),
        ("¿Qué es lo primero que hace un jugador de la 224 al entrar?", "Morirse."),
        ("¿Por qué el dragón del End está de mal humor?", "Porque cada vez que lo matan, lo vuelven a invocar."),
        ("¿Qué le dijo una antorcha a otra?", "Estás que ardes."),
        ("¿Por qué el ajolote siempre está feliz?", "Porque nadie le ha explicado que vive en una cubeta."),
        ("¿Qué hace un cerdo con una silla de montar?", "Pensar seriamente en su vida."),
        ("¿Cuál es el bloque más chismoso?", "El bloque de notas, siempre está sonando."),
        ("¿Por qué la oveja rosa es la más rara?", "Porque sale una de cada mil, como los que entregan la tarea a tiempo."),
        ("¿Qué dijo el jugador después de caer en el vacío?", "Nada, ya no lo volvimos a ver."),
        ("¿Por qué las arañas no usan zapatos?", "Porque se les iría todo el sueldo en tenis."),
        ("¿Cuál es el mob más dramático?", "El ghast: grita, llora y te avienta bolas de fuego."),
        ("¿Qué le dijo el cofre vacío al jugador?", "No vengas a buscar lo que no guardaste."),
        ("¿Por qué el zombi aldeano no consigue trabajo?", "Porque en su currículum dice \"experiencia: comer cerebros\"."),
        ("¿Cuál es el colmo de un constructor?", "Hacer la casa más bonita del server y que un creeper la reseñe."),
        ("¿Por qué el bot de la 224 cuenta chistes malos?", "Porque los buenos están en el Nether y le da miedo ir."),
        ("¿Qué le dijo el sol al zombi?", "Nos vemos al rato, si llegas."),
        ("¿Por qué los phantoms no tienen amigos?", "Porque solo aparecen cuando no has dormido, como los problemas."),
        ("¿Qué hace el admin cuando se cae el server?", "Lo mismo que todos: decir que fue culpa de alguien más."),
        ("¿Por qué el ender pearl nunca llega tarde?", "Porque se teletransporta. Bueno, y luego te quita vida."),
        ("¿Cómo se despide un creeper?", "Ssssss... ya me voy."),
        ("¿Qué le dijo la cama al jugador en el Nether?", "Ni se te ocurra."),
    };
    private int _ultimoChiste = -1;
    private object Chiste()
    {
        int k; do k = Random.Shared.Next(Chistes.Length); while (k == _ultimoChiste && Chistes.Length > 1);
        _ultimoChiste = k;
        var (p, r) = Chistes[k];
        return Embed(new { title = p, description = $"||{r}||", color = Verde, footer = new { text = "Toca el cuadro negro para ver la respuesta" } });
    }

    private object Ip()
    {
        var ip = string.IsNullOrWhiteSpace(_config.IpServer) ? "Todavía no hay IP, Dylan la pone en la inauguración 👀" : $"`{_config.IpServer}`";
        var texto = $"**Java ({_config.Version}):** Multijugador → Agregar servidor → {ip}";
        if (_config.PuertoBedrock > 0)
            texto += $"\n**Bedrock:** Servidores → Agregar servidor → misma IP, puerto `{_config.PuertoBedrock}`";
        return Embed(new { title = "⛏️ Cómo entrar a la 224", description = texto, color = Verde }, ("Ver la página", "#entrar"));
    }

    private async Task<object> OnlineAsync()
    {
        var r = await _rcon.ComandoAsync("list");
        var m = RegexOnline.Match(r.Trim());
        if (!m.Success) return Texto("🟢 El server está prendido.");
        var cuantos = int.Parse(m.Groups[1].Value);
        if (cuantos == 0) return Texto("🟢 El server está prendido pero **no hay nadie** 🦗");
        var nombres = m.Groups[3].Value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var lista = string.Join("\n", nombres.Select(n => $"▫️ {n}"));
        return Embed(new
        {
            title = $"🟢 {cuantos} jugando ahorita",
            description = lista,
            color = Verde,
            thumbnail = nombres.Length == 1 ? new { url = Skins.Cabeza(nombres[0]) } : null,
        }, ("Ver en la página", "#inicio"));
    }

    // Busca el jugador: el que escribieron, o el que tiene vinculado quien usó el comando
    private (string? Nombre, string? Error) Jugador(JsonElement i, string opcion, string ejemplo = "/stats")
    {
        var escrito = Discord.Opcion(i, opcion);
        if (string.IsNullOrWhiteSpace(escrito))
        {
            var mio = _vinculos.Jugador(Discord.UsuarioId(i));
            if (mio != null) escrito = mio;
            else return (null, $"Pon el nombre del jugador, ejemplo: `{ejemplo} explotabuela`");
        }
        var real = _stats.NombreReal(escrito);
        return real == null ? (null, $"🤔 **{escrito}** nunca ha entrado a la 224.") : (real, null);
    }

    private Pagina.Jugador? DeFoto(string nombre) =>
        _pagina.Ultima?.Jugadores.FirstOrDefault(j => j.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase));

    private async Task<object> StatsAsync(JsonElement i)
    {
        var (nombre, error) = Jugador(i, "jugador");
        if (nombre == null) return Texto(error!);
        var s = await _stats.LeerAsync(nombre);
        var racha = _rachas.De(nombre);
        var f = DeFoto(nombre);
        object Campo(string n, string v) => new { name = n, value = v, inline = true };
        return Embed(new
        {
            title = $"📊 Stats de {nombre}",
            description = f == null ? null : $"Nivel **{f.Nivel}** · {f.Rango} · {f.Clase}",
            color = Verde,
            thumbnail = new { url = Skins.CuerpoUrl(nombre) },
            fields = new[]
            {
                Campo("💀 Muertes", Stats.Num(s.Muertes)),
                Campo("⏱️ Tiempo jugado", Stats.Tiempo(s.Minutos)),
                Campo("⛏️ Bloques minados", Stats.Num(s.Minado)),
                Campo("🚶 Metros", Stats.Num(s.Metros)),
                Campo("⚔️ Mobs", Stats.Num(s.Mobs)),
                Campo("💎 Diamantes", Stats.Num(s.Diamantes)),
                Campo("🟫 Netherita", Stats.Num(s.Netherita)),
                Campo("🛡️ Récord sin morir", Stats.Tiempo(s.Record)),
                Campo("🔥 Racha", racha == null ? "0 días" : $"{racha.Racha} días (mejor: {racha.Mejor})"),
                Campo("🏅 Medallas", f == null ? "—" : Stats.Num(f.Medallas)),
            },
            footer = new { text = "Minecraft 224" },
        }, ("Ver su perfil", Perfil(nombre)));
    }

    private static string Barra(double p, int largo = 10)
    {
        var llenos = (int)Math.Round(Math.Clamp(p, 0, 1) * largo);
        return new string('▰', llenos) + new string('▱', largo - llenos);
    }

    private static int ColorRango(string rango) => rango switch
    {
        "Leyenda" => 0xF5C451, "Veterano" => 0xC0C8D0, "Aventurero" => 0x5FD068, _ => 0x8A8F98,
    };

    // ---------- /carta ----------
    private object Carta(JsonElement i)
    {
        var (nombre, error) = Jugador(i, "jugador", "/carta");
        if (nombre == null) return Texto(error!);
        var foto = _pagina.Ultima;
        var j = DeFoto(nombre);
        if (foto == null || j == null) return Texto("⏳ Todavía estoy juntando los datos, intenta en un minuto.");
        var numero = foto.Jugadores.OrderBy(x => _wrapped.PrimerDia(x.Nombre) ?? "9999").ThenBy(x => x.Nombre).ToList().FindIndex(x => x.Nombre == j.Nombre) + 1;
        var lugarLiga = foto.Liga.FirstOrDefault(f => f.Nombre == j.Nombre)?.Lugar;
        var progreso = (j.Xp - j.XpNivel) / (double)Math.Max(1, j.XpSiguiente - j.XpNivel);
        object Campo(string n, string v) => new { name = n, value = v, inline = true };
        return Embed(new
        {
            author = new { name = $"Carta #{numero:000} de {foto.Jugadores.Count} · Minecraft 224" },
            title = j.Nombre,
            description = $"### Nivel {j.Nivel} · {j.Rango}\nClase: **{j.Clase}**\n`{Barra(progreso, 14)}` {Stats.Num(j.Xp - j.XpNivel)}/{Stats.Num(j.XpSiguiente - j.XpNivel)} XP",
            color = ColorRango(j.Rango),
            image = new { url = Skins.CuerpoUrl(j.Nombre) },
            fields = new[]
            {
                Campo("Horas", Stats.Num((int)j.Horas)),
                Campo("Diamantes", Stats.Num(j.S.Diamantes)),
                Campo("Muertes", Stats.Num(j.S.Muertes)),
                Campo("Mobs", Stats.Num(j.S.Mobs)),
                Campo("Medallas", Stats.Num(j.Medallas)),
                Campo("Liga", lugarLiga == null ? "—" : $"#{lugarLiga}"),
            },
        }, ("Ver carta en 3D", Perfil(j.Nombre)));
    }

    private async Task<object> VsAsync(JsonElement i)
    {
        var (a, errA) = Jugador(i, "jugador1");
        if (a == null) return Texto(errA!);
        var (b, errB) = Jugador(i, "jugador2");
        if (b == null) return Texto(errB!);
        if (a == b) return Texto("¿Contra él mismo? 🤨");

        var s = await _stats.LeerVariosAsync(new[] { a, b });
        var (x, y) = (s[0], s[1]);
        int puntosA = 0, puntosB = 0;

        string Linea(string titulo, int va, int vb, Func<int, string> fmt, bool menosGana = false)
        {
            var ganaA = menosGana ? va < vb : va > vb;
            var ganaB = menosGana ? vb < va : vb > va;
            if (ganaA) puntosA++;
            if (ganaB) puntosB++;
            return $"{titulo}\n{(ganaA ? "🏆 " : "")}**{fmt(va)}** vs **{fmt(vb)}**{(ganaB ? " 🏆" : "")}";
        }

        var lineas = new[]
        {
            Linea("💀 Muertes (menos es mejor)", x.Muertes, y.Muertes, Stats.Num, menosGana: true),
            Linea("⏱️ Tiempo jugado", x.Minutos, y.Minutos, Stats.Tiempo),
            Linea("⛏️ Bloques minados", x.Minado, y.Minado, Stats.Num),
            Linea("🚶 Metros", x.Metros, y.Metros, Stats.Num),
            Linea("⚔️ Mobs", x.Mobs, y.Mobs, Stats.Num),
            Linea("💎 Diamantes", x.Diamantes, y.Diamantes, Stats.Num),
            Linea("🟫 Netherita", x.Netherita, y.Netherita, Stats.Num),
            Linea("🛡️ Récord sin morir", x.Record, y.Record, Stats.Tiempo),
        };
        var ganador = puntosA == puntosB ? "🤝 **¡Empate!**"
            : $"👑 Gana **{(puntosA > puntosB ? a : b)}** ({Math.Max(puntosA, puntosB)} a {Math.Min(puntosA, puntosB)})";

        return Embed(new
        {
            title = $"⚔️ {a} vs {b}",
            description = string.Join("\n\n", lineas) + "\n\n" + ganador,
            color = 0xE67E22,
            thumbnail = new { url = Skins.Cabeza(puntosA >= puntosB ? a : b) },
        }, ("Ver el VS en la página", $"#vs-{Uri.EscapeDataString(a)}-{Uri.EscapeDataString(b)}"));
    }

    // ---------- /top ----------
    private object Top(JsonElement i)
    {
        var foto = _pagina.Ultima;
        if (foto == null) return Texto("⏳ Todavía estoy juntando los datos, intenta en un minuto.");
        var cat = Discord.Opcion(i, "categoria") ?? "liga";
        var periodo = cat is "liga" or "nivel" or "racha" or "record" ? (cat == "liga" ? "mes" : "siempre") : Discord.Opcion(i, "periodo") ?? "siempre";
        var nombreCat = Categorias.First(c => c.Valor == cat).Nombre;

        List<(string Nombre, double Valor)> filas;
        if (cat == "liga") filas = foto.Liga.Select(f => (f.Nombre, (double)f.Puntos)).ToList();
        else if (periodo == "siempre")
            filas = foto.Jugadores.Select(j => (j.Nombre, cat switch
            {
                "horas" => j.Horas, "diamantes" => j.S.Diamantes, "netherita" => j.S.Netherita, "minado" => j.S.Minado, "mobs" => j.S.Mobs, "metros" => j.S.Metros,
                "muertes" => j.S.Muertes, "racha" => j.MejorRacha, "nivel" => j.Nivel, "record" => j.S.Record, _ => 0.0,
            })).ToList();
        else
        {
            var fuente = periodo == "semana" ? foto.Semana : foto.DelMes;
            filas = fuente.Select(x => (x.Key, cat == "horas" ? Math.Round(x.Value.GetValueOrDefault("minutos") / 60.0, 1) : (double)x.Value.GetValueOrDefault(cat))).ToList();
        }
        filas = filas.Where(f => f.Valor > 0).OrderByDescending(f => f.Valor).ToList();
        string Fmt(double v) => cat switch { "horas" => $"{v:0.#} h", "metros" => $"{Stats.Num((int)v)} m", "record" => Stats.Tiempo((int)v), "racha" => $"{v} días", "liga" => $"{Stats.Num((int)v)} pts", _ => Stats.Num((int)v) };
        var titulo = $"🏆 TOP · {nombreCat} · " + (periodo switch { "semana" => "esta semana", "mes" => "este mes", _ => "desde siempre" });
        if (filas.Count == 0) return Embed(new { title = titulo, description = "Nadie tiene nada todavía 🦗", color = Verde });
        var max = filas[0].Valor;
        var lineas = filas.Take(10).Select((f, k) =>
            $"{(k < 3 ? Medallitas[k] : $"`{k + 1,2}.`")} **{f.Nombre}** — {Fmt(f.Valor)}\n`{Barra(f.Valor / max, 12)}`");
        var mio = _vinculos.Jugador(Discord.UsuarioId(i));
        int? tuLugar = mio == null ? null : filas.FindIndex(f => f.Nombre.Equals(_alias.Principal(mio), StringComparison.OrdinalIgnoreCase));
        return Embed(new
        {
            title = titulo,
            description = string.Join("\n", lineas),
            color = 0xF5C451,
            thumbnail = new { url = Skins.Cabeza(filas[0].Nombre) },
            footer = new { text = tuLugar is >= 0 ? $"Tú vas #{tuLugar + 1} con {Fmt(filas[tuLugar.Value].Valor)}" : "Minecraft 224" },
        }, ("Ver todos los rankings", "#ranking"));
    }

    // ---------- /liga ----------
    private object LigaCmd()
    {
        var foto = _pagina.Ultima;
        if (foto == null) return Texto("⏳ Todavía estoy juntando los datos, intenta en un minuto.");
        var mes = Liga.NombreMes(foto.Mes);
        var quedan = DateTime.DaysInMonth(DateTime.Now.Year, DateTime.Now.Month) - DateTime.Now.Day;
        if (foto.Liga.Count == 0) return Embed(new { title = $"🏆 Liga de {mes}", description = "Todavía nadie tiene puntos este mes.", color = 0xF5C451 });
        string Flecha(int c) => c > 0 ? $"▲{c}" : c < 0 ? $"▼{-c}" : "—";
        var lineas = foto.Liga.Take(10).Select((f, k) =>
            $"{(k < 3 ? Medallitas[k] : $"`{k + 1,2}.`")} **{f.Nombre}** — {Stats.Num(f.Puntos)} pts  `{Flecha(f.Cambio)}`");
        var pron = foto.Liga.OrderByDescending(f => f.Proyeccion).First();
        return Embed(new
        {
            title = $"🏆 Liga de {mes}",
            description = string.Join("\n", lineas) + $"\n\n🔮 **Pronóstico:** si siguen así, gana **{pron.Nombre}** con ~{Stats.Num(pron.Proyeccion)} pts.",
            color = 0xF5C451,
            thumbnail = new { url = Skins.Cabeza(foto.Liga[0].Nombre) },
            footer = new { text = quedan == 0 ? "¡Hoy se cierra la liga!" : $"Faltan {quedan} días para cerrar el mes" },
        }, ("Ver la liga", "#liga"));
    }

    // ---------- /wrapped ----------
    private async Task<object> WrappedAsync(JsonElement i)
    {
        var (nombre, error) = Jugador(i, "jugador", "/wrapped");
        if (nombre == null) return Texto(error!);
        var meses = _wrapped.MesesConDatos();
        if (meses.Count == 0) return Texto("Todavía no hay Wrapped, espera a que se junten datos del mes 😉");
        var mes = meses[^1];
        var link = Url($"#wrapped-{Uri.EscapeDataString(nombre)}~{mes}");
        var ok = await _discord.MandarDmAsync(Discord.UsuarioId(i), new
        {
            embeds = new[] { new { title = $"🎁 Tu Wrapped de {Liga.NombreMes(mes)}", description = $"El resumen de **{nombre}** en la 224, con música y tarjeta para presumir.", color = 0xA33ED6, thumbnail = new { url = Skins.Cabeza(nombre) } } },
            components = Discord.Botones(("Ver mi Wrapped", link)),
        });
        return Texto(ok ? "📬 Te lo mandé por privado." : $"No te pude mandar DM (¿los tienes cerrados?). Aquí está: {link}");
    }

    // ---------- /unir y /vincular (solo admin) ----------
    private async Task<object> UnirAsync(JsonElement i)
    {
        if (Discord.UsuarioId(i) != _config.AdminId) return Texto("Solo Dylan puede usar esto 😅");
        var reales = _stats.Reales();
        // Si alguien ya entró se usa su nombre tal cual; si no, se acepta igual (se unen desde antes)
        string? Normalizar(string escrito)
        {
            escrito = escrito.Trim();
            if (escrito.StartsWith('.')) escrito = Altas.NombreBedrock(escrito[1..]);
            if (reales.TryGetValue(escrito.ToLower(), out var real)) return real;
            return Alias.RegexNombre.IsMatch(escrito) ? escrito : null;
        }
        var pEscrito = Discord.Opcion(i, "principal") ?? "";
        var oEscrito = Discord.Opcion(i, "otro") ?? "";
        var p = Normalizar(pEscrito);
        var otro = Normalizar(oEscrito);
        if (p == null) return Texto($"🤔 **{pEscrito.Trim()}** no parece un nombre de Minecraft.");
        if (otro == null) return Texto($"🤔 **{oEscrito.Trim()}** no parece un nombre. (Los de Bedrock empiezan con punto, ej. `.Pepe`)");
        if (p.Equals(otro, StringComparison.OrdinalIgnoreCase)) return Texto("Es el mismo nombre 😅");
        if (_alias.Principal(otro).Equals(_alias.Principal(p), StringComparison.OrdinalIgnoreCase)) return Texto("Ya estaban unidos 👍");
        await _unir(p, otro);
        var nuevos = new[] { p, otro }.Where(n => !reales.ContainsKey(n.ToLower())).ToList();
        var nota = nuevos.Count switch
        {
            0 => "",
            1 => $"\n(**{nuevos[0]}** todavía no entra al server, pero ya queda unido para cuando entre.)",
            _ => $"\n(Ninguno de los dos ha entrado todavía, pero ya quedan unidos para cuando entren.)",
        };
        return Texto($"✅ Listo: **{otro}** ahora cuenta como **{p}**. Sus stats, liga, medallas y Wrapped se juntaron. La página se actualiza en un ratito.{nota}");
    }

    private object Vincular(JsonElement i)
    {
        if (Discord.UsuarioId(i) != _config.AdminId) return Texto("Solo Dylan puede usar esto 😅");
        var usuario = Discord.Opcion(i, "usuario") ?? "";
        var jugador = _stats.NombreReal(Discord.Opcion(i, "jugador") ?? "");
        if (jugador == null) return Texto("🤔 Ese jugador nunca ha entrado al server.");
        _vinculos.Poner(usuario, jugador);
        return Texto($"✅ <@{usuario}> es **{jugador}**. Ahora puede usar `/stats`, `/carta` y `/wrapped` sin poner su nombre, y si gana la liga le llega su rol.");
    }

    // ---------- Whitelist: el jugador pide, Dylan acepta con un botón ----------
    // Si juega en Java y en Bedrock pone los dos, y al aceptar se meten los dos y se unen solos.
    private object Entrar(JsonElement i)
    {
        var java = (Discord.Opcion(i, "java") ?? "").Trim();
        var bedrock = System.Text.RegularExpressions.Regex.Replace((Discord.Opcion(i, "bedrock") ?? "").Trim(), " +", " ");
        if (java == "" && bedrock == "")
            return Texto("Pon tu usuario de **Java**, tu gamertag de **Bedrock**, o los dos si juegas en los dos 🙂");
        if (java != "" && !Altas.RegexJava.IsMatch(java))
            return Texto("Ese usuario de Java no se ve bien 🤔 (de 3 a 16 letras, números o guion bajo, sin espacios)");
        if (bedrock != "" && !Altas.RegexBedrock.IsMatch(bedrock))
            return Texto("Ese gamertag de Bedrock no se ve bien 🤔 (de 3 a 16 letras, números o espacios)");

        var quien = Discord.UsuarioId(i);
        var datos = $"{quien}|{java}|{bedrock}"; // cabe de sobra en los 100 caracteres de Discord
        var cuentas = new List<string>();
        if (java != "") cuentas.Add($"Java: **{java}**");
        if (bedrock != "") cuentas.Add($"Bedrock: **{bedrock}**");
        var nota = java != "" && bedrock != "" ? "\n🔗 Juega en los dos: al aceptar se unen solas." : "";
        return new
        {
            content = $"🧱 <@{quien}> quiere entrar.\n{string.Join("\n", cuentas)}{nota}\n<@{_config.AdminId}>, ¿lo dejas pasar?",
            allowed_mentions = new { users = new[] { _config.AdminId } },
            components = new[]
            {
                new
                {
                    type = 1,
                    components = new object[]
                    {
                        new { type = 2, style = 3, label = "Aceptar", emoji = new { name = "✅" }, custom_id = "wl_si|" + datos },
                        new { type = 2, style = 4, label = "Rechazar", emoji = new { name = "✖️" }, custom_id = "wl_no|" + datos },
                    },
                },
            },
        };
    }

    private async Task BotonAsync(JsonElement i)
    {
        var id = i.GetProperty("data").GetProperty("custom_id").GetString() ?? "";
        var partes = id.Split('|', 4);
        if (partes.Length != 4 || !partes[0].StartsWith("wl_")) return;

        await _discord.EsperarBotonAsync(i);
        if (Discord.UsuarioId(i) != _config.AdminId)
        {
            await _discord.MensajePrivadoAsync(i, "Solo Dylan puede aceptar o rechazar 😅");
            return;
        }

        var (accion, quien, java, bedrock) = (partes[0], partes[1], partes[2], partes[3]);
        // Botones viejos (antes de poder poner los dos): wl_si|quien|java o bedrock|usuario
        if (java is "java" or "bedrock") (java, bedrock) = java == "java" ? (bedrock, "") : ("", bedrock);
        var nombres = string.Join(" / ", new[] { java, bedrock }.Where(x => x != ""));

        string texto;
        if (accion == "wl_no")
        {
            texto = $"✖️ Rechazado: **{nombres}** (<@{quien}>).";
        }
        else
        {
            Altas.Resultado r;
            try
            {
                r = await _altas.DarDeAltaAsync(java, bedrock);
            }
            catch
            {
                await _discord.MensajePrivadoAsync(i, "🔴 El server está apagado, préndelo y vuelve a picarle.");
                return;
            }
            if (!r.JavaOk && !r.BedrockOk && !r.BedrockPendiente)
            {
                // No quedó nada: se deja el botón para que lo vuelva a intentar o lo rechace
                await _discord.MensajePrivadoAsync(i, string.Join("\n", r.Lineas));
                return;
            }
            if (r.Principal != null) _vinculos.Poner(quien, r.Principal);
            if (r.NotaAdmin != null) await _discord.MensajePrivadoAsync(i, r.NotaAdmin);
            texto = $"✅ <@{quien}> ya está en la whitelist. ¡Bienvenido a la 224! Usa `/ip` para ver cómo entrar.\n{string.Join("\n", r.Lineas)}";
        }
        await _discord.EditarRespuestaAsync(i, new
        {
            content = texto,
            components = Array.Empty<object>(),
            allowed_mentions = new { users = new[] { quien } },
        });
    }

    // ---------- Chat: lo que escriben en Discord sale en Minecraft ----------
    private static readonly Regex RegexMencion = new(@"<@!?(\d+)>");
    private static readonly Regex RegexEmoji = new(@"<a?(:\w+:)\d+>");

    private async Task ChatAsync(JsonElement m)
    {
        if (string.IsNullOrEmpty(_config.CanalChatId) || m.GetProperty("channel_id").GetString() != _config.CanalChatId) return;
        if (m.TryGetProperty("webhook_id", out _)) return; // son los mensajes que vienen de Minecraft
        var autor = m.GetProperty("author");
        if (autor.TryGetProperty("bot", out var esBot) && esBot.GetBoolean()) return;

        // Nombre: apodo del server > nombre global > usuario
        string? nombre = null;
        if (m.TryGetProperty("member", out var miembro) && miembro.TryGetProperty("nick", out var nick) && nick.ValueKind == JsonValueKind.String)
            nombre = nick.GetString();
        if (nombre == null && autor.TryGetProperty("global_name", out var g) && g.ValueKind == JsonValueKind.String)
            nombre = g.GetString();
        nombre ??= autor.GetProperty("username").GetString() ?? "alguien";

        var texto = m.GetProperty("content").GetString() ?? "";
        var menciones = new Dictionary<string, string>();
        if (m.TryGetProperty("mentions", out var ms))
            foreach (var u in ms.EnumerateArray())
                menciones[u.GetProperty("id").GetString() ?? ""] =
                    u.TryGetProperty("global_name", out var gn) && gn.ValueKind == JsonValueKind.String ? gn.GetString()! : u.GetProperty("username").GetString() ?? "";
        texto = RegexMencion.Replace(texto, x => "@" + menciones.GetValueOrDefault(x.Groups[1].Value, "alguien"));
        texto = RegexEmoji.Replace(texto, "$1");
        texto = texto.Replace('\n', ' ').Trim();
        if (m.TryGetProperty("attachments", out var adj) && adj.GetArrayLength() > 0)
            texto = (texto + " [mandó una imagen]").Trim();
        if (texto.Length == 0) return;
        if (texto.Length > 256) texto = texto[..256] + "...";

        var json = JsonSerializer.Serialize(new object[]
        {
            new { text = "[Discord] ", color = "#5865F2" },
            new { text = nombre, color = "#FFFFFF", bold = true },
            new { text = ": " + texto, color = "#FFFFFF" },
        }, new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
        try
        {
            await _rcon.ComandoAsync($"tellraw @a {json}");
        }
        catch
        {
            await _discord.ReaccionarAsync(_config.CanalChatId, m.GetProperty("id").GetString() ?? "", "🔴");
        }
    }
}
