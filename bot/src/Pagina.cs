using System.Text;
using System.Text.Json;

namespace Bot224;

// El "cerebro" de la página: junta stats, liga, medallas, niveles, presencia e historial,
// arma data.json y lo sube a GitHub. Lo demás del bot (comandos) usa la última foto.
public class Pagina
{
    private readonly Config _config;
    private readonly Stats _stats;
    private readonly Rachas _rachas;
    private readonly Wrapped _wrapped;
    private readonly Historial _historial;
    private readonly Liga _liga;
    private readonly Medallas _medallas;
    private readonly Presencia _presencia;
    private readonly Anunciador _avisos;
    private readonly GitHub _github;
    private readonly Alias _alias;

    private DateTime _ultima = DateTime.MinValue;
    private DateTime _ultimoHistorial = DateTime.MinValue;
    private volatile bool _pedido;
    private readonly SemaphoreSlim _turno = new(1, 1);

    public Foto? Ultima { get; private set; }
    private bool _subidoApagado;
    public Skins? SkinsReales { get; set; }
    public Task? TareaSkins { get; private set; }
    public Mundo? MundoMc { get; set; }
    public Func<string, Task>? AvisarAdmin { get; set; }
    private const string RutaXray = "xray_avisos.json";
    private readonly Dictionary<string, string> _xray = Archivo.Leer<Dictionary<string, string>>(RutaXray);
    private int _revisandoSkins;
    public event Func<string, List<Liga.Fila>, Task>? CampeonNuevo;

    public class Jugador
    {
        public string Nombre { get; set; } = "";
        public Stats.De S { get; set; } = new();
        public int Racha { get; set; }
        public int MejorRacha { get; set; }
        public int Mensajes { get; set; }
        public int Dias { get; set; }
        public int Xp { get; set; }
        public int Nivel { get; set; }
        public int XpNivel { get; set; }
        public int XpSiguiente { get; set; }
        public string Rango { get; set; } = "";
        public string Clase { get; set; } = "";
        public int Medallas { get; set; }
        public double Horas => Math.Round(S.Minutos / 60.0, 1);
    }

    public class Foto
    {
        public DateTime Fecha { get; set; }
        public List<Jugador> Jugadores { get; set; } = new();
        public string Mes { get; set; } = "";
        public List<Liga.Fila> Liga { get; set; } = new();
        public Dictionary<string, Dictionary<string, int>> Semana { get; set; } = new(); // lo que hizo cada quien en 7 días
        public Dictionary<string, Dictionary<string, int>> DelMes { get; set; } = new();
    }

    public Pagina(Config config, Stats stats, Rachas rachas, Wrapped wrapped, Historial historial, Liga liga,
                  Medallas medallas, Presencia presencia, Anunciador avisos, GitHub github, Alias alias)
    {
        _config = config; _stats = stats; _rachas = rachas; _wrapped = wrapped; _historial = historial;
        _liga = liga; _medallas = medallas; _presencia = presencia; _avisos = avisos; _github = github; _alias = alias;
        // Cuando alguien entra o sale, la página se actualiza pronto (máximo cada 2 minutos)
        presencia.Cambio += () => _pedido = true;
    }

    public void Pedir() => _pedido = true;

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            _presencia.Tick();
            var desde = DateTime.Now - _ultima;
            if (desde >= TimeSpan.FromMinutes(Math.Max(1, _config.MinutosPagina)) || (_pedido && desde >= TimeSpan.FromMinutes(2)))
            {
                try { await ActualizarAsync(); }
                catch (Exception ex) { Console.WriteLine($"[Página] Error: {ex.Message}"); _ultima = DateTime.Now; }
            }
            await Task.Delay(TimeSpan.FromSeconds(30), cancelar).ContinueWith(_ => { });
        }
    }

    // ---------- Niveles y clases ----------
    public static int XpDe(Stats.De s, int dias, int medallas) =>
        s.Minutos * global::Bot224.Liga.PorHora / 60 + s.Minado / global::Bot224.Liga.BloquesPorPunto + s.Diamantes * global::Bot224.Liga.PorDiamante + s.Netherita * global::Bot224.Liga.PorNetherita
        + s.Mobs / global::Bot224.Liga.MobsPorPunto + s.Metros / global::Bot224.Liga.MetrosPorPunto + dias * global::Bot224.Liga.PorDia + medallas * 20;

    // Nivel n necesita 50·n·(n-1) de XP: 2→100, 5→1000, 10→4500, 25→30000
    public static int NivelDe(int xp) => (int)Math.Floor((1 + Math.Sqrt(1 + 4 * xp / 50.0)) / 2);
    public static int XpPara(int nivel) => 50 * nivel * (nivel - 1);
    public static string RangoDe(int nivel) => nivel >= 50 ? "Leyenda" : nivel >= 25 ? "Veterano" : nivel >= 10 ? "Aventurero" : "Novato";

    private static string ClaseDe(Stats.De s, List<Stats.De> todos)
    {
        double Prom(Func<Stats.De, double> f) => Math.Max(1, todos.Average(f));
        var opciones = new (string Clase, double Valor)[]
        {
            ("Minero", (s.Minado / 100.0 + s.Diamantes * 5 + s.Netherita * 25) / Prom(x => x.Minado / 100.0 + x.Diamantes * 5 + x.Netherita * 25)),
            ("Guerrero", s.Mobs / Prom(x => x.Mobs)),
            ("Explorador", s.Metros / Prom(x => x.Metros)),
            ("Viciado", s.Minutos / Prom(x => x.Minutos)),
        };
        var mejor = opciones.OrderByDescending(o => o.Valor).First();
        return mejor.Valor <= 0 ? "Novato" : mejor.Clase;
    }

    // ---------- Armar todo ----------
    public async Task ActualizarAsync()
    {
        await _turno.WaitAsync();
        try { await ActualizarInternoAsync(); }
        finally { _turno.Release(); }
    }

    private async Task ActualizarInternoAsync()
    {
        _pedido = false;
        _ultima = DateTime.Now;
        var mes = DateTime.Now.ToString("yyyy-MM");

        // 1. Stats de todos (ya juntando Java + Bedrock)
        var todos = await _stats.TodosAsync();
        var totales = todos.ToDictionary(s => s.Nombre, s =>
        {
            var d = s.ComoDiccionario();
            d.Remove("record");
            return d;
        });
        _wrapped.ActualizarMes(totales);
        _historial.Anotar(todos.ToDictionary(s => s.Nombre, s => s.ComoDiccionario()));

        // 2. Medallas
        var conteoCapturas = Capturas.Conteo();
        var primeros = _wrapped.CopiaPrimeros();
        var logros = _wrapped.CopiaLogros();
        var campeones = _liga.Campeones();
        var valores = new Dictionary<string, Dictionary<string, int>>();
        var especiales = new Dictionary<string, Dictionary<string, string>>();
        foreach (var s in todos)
        {
            var r = _rachas.De(s.Nombre);
            valores[s.Nombre] = new()
            {
                ["horas"] = s.Minutos / 60, ["minado"] = s.Minado, ["diamantes"] = s.Diamantes, ["netherita"] = s.Netherita, ["mobs"] = s.Mobs,
                ["metros"] = s.Metros, ["record"] = s.Record, ["mejorRacha"] = r?.Mejor ?? 0, ["muertes"] = s.Muertes,
                ["mensajes"] = _wrapped.MensajesTotales(s.Nombre), ["capturas"] = conteoCapturas.GetValueOrDefault(s.Nombre),
            };
            var e = new Dictionary<string, string>();
            foreach (var (clave, id) in new[] { ("diamante", "pionero_diamante"), ("nether", "pionero_nether"), ("end", "pionero_end"), ("dragon", "matadragones") })
                if (primeros.TryGetValue(clave, out var p) && p.Jugador == s.Nombre) e[id] = p.Fecha;
            if (logros.TryGetValue(s.Nombre, out var lg) && lg.TryGetValue("end", out var fEnd)) e["viajero_end"] = fEnd;
            var campeonDe = campeones.FirstOrDefault(c => c.Value == s.Nombre).Key;
            if (campeonDe != null) e["campeon"] = campeonDe + "-01";

            // Lo que guarda Minecraft en la carpeta del mundo (peces, elytra, biomas...)
            var hoyF = DateTime.Now.ToString("yyyy-MM-dd");
            if (MundoMc != null)
            {
                var x = MundoMc.Leer(s.Nombre);
                foreach (var (k, v) in x.Valores) valores[s.Nombre][k] = (int)Math.Min(int.MaxValue, v);
                valores[s.Nombre]["biomas"] = x.Biomas;
                foreach (var (logro, id) in Medallas.PorLogro)
                    if (x.Logros.TryGetValue(logro, out var f)) e[id] = f == "" ? hoyF : f;
                if (x.Valores.GetValueOrDefault("wither") > 0) e["wither"] = hoyF;
                if (x.Valores.GetValueOrDefault("warden") > 0) e["warden"] = hoyF;
                if (x.Valores.GetValueOrDefault("sinDormir") >= 5 * 24000) e["noctambulo"] = hoyF; // 5 días del juego en ticks
                await RevisarXrayAsync(s.Nombre, x);
            }
            if (_presencia.HorasAcompanado(s.Nombre) >= 20) e["companero"] = hoyF;
            especiales[s.Nombre] = e;
        }
        foreach (var cu in _medallas.RevisarUnicas(valores))
        {
            var texto = cu.Anterior != null
                ? $"👑 **{cu.Nuevo}** le quitó la medalla única **{cu.Nombre}** a **{cu.Anterior}**"
                : $"👑 **{cu.Nuevo}** ganó la medalla única **{cu.Nombre}**. Nadie más la puede tener… hasta que alguien lo supere.";
            await _avisos.AnunciarAsync(texto, botones: new[] { ("Ver sus medallas", "#j-" + Uri.EscapeDataString(cu.Nuevo)) }, nombre: cu.Nuevo, avatar: Webhook.Cara(cu.Nuevo));
        }
        foreach (var n in _medallas.Revisar(valores, especiales))
        {
            var titulo = n.Nivel == 5 ? $"🏅 **{n.Jugador}** ganó la medalla especial **{n.Nombre}**" : $"🏅 **{n.Jugador}** ganó la medalla **{n.Nombre}**";
            await _avisos.AnunciarAsync(titulo, botones: new[] { ("Ver sus medallas", "#j-" + Uri.EscapeDataString(n.Jugador)) },
                nombre: n.Jugador, avatar: Webhook.Cara(n.Jugador));
        }

        // 3. Liga del mes (y cierre del mes pasado si ya cambió)
        List<Liga.Fila> Tabla(string m) => _liga.Calcular(m, _wrapped.CopiaMes(m), primeros, _medallas.PuntosDelMes(m));
        var cierre = _liga.CerrarSiToca(mes, Tabla);
        var tabla = Tabla(mes);
        _liga.Anotar(mes, tabla);
        if (cierre is { } c)
        {
            if (CampeonNuevo != null) await CampeonNuevo(c.Mes, c.Tabla);
            // El más tonto del mes se queda en su perfil para siempre
            var stMes = _wrapped.CopiaMes(c.Mes).Stats;
            var tonto = stMes.Where(x => x.Value.GetValueOrDefault("muertes") > 0).OrderByDescending(x => x.Value.GetValueOrDefault("muertes")).FirstOrDefault();
            if (tonto.Key != null) _medallas.MasTontoDelMes(c.Mes, tonto.Key);
            // Aviso de que ya salió el Wrapped del mes
            await _avisos.AnunciarAsync($"🎁 **Ya salió el Wrapped de {Liga.NombreMes(c.Mes)}.** Ve tu mes en historias con música, y el de toda la 224 con créditos.",
                botones: new[] { ("Ver mi Wrapped", "#wrapped"), ("Wrapped de la 224", "#wrapped-224~" + c.Mes) });
        }

        // 4. Nivel, rango y clase de cada quien
        var jugadores = todos.Select(s =>
        {
            var r = _rachas.De(s.Nombre);
            var dias = _wrapped.DiasJugados(s.Nombre);
            var meds = _medallas.Total(s.Nombre);
            var xp = XpDe(s, dias, meds);
            var nivel = NivelDe(xp);
            return new Jugador
            {
                Nombre = s.Nombre, S = s, Racha = r?.Racha ?? 0, MejorRacha = r?.Mejor ?? 0,
                Mensajes = _wrapped.MensajesTotales(s.Nombre), Dias = dias, Xp = xp, Nivel = nivel,
                XpNivel = XpPara(nivel), XpSiguiente = XpPara(nivel + 1), Rango = RangoDe(nivel),
                Clase = ClaseDe(s, todos), Medallas = meds,
            };
        }).OrderByDescending(j => j.Xp).ToList();

        // Lo de la semana (para /top semana)
        var hace7 = _historial.Hace(7) ?? new();
        var semana = todos.ToDictionary(s => s.Nombre, s =>
        {
            var antes = hace7.GetValueOrDefault(s.Nombre) ?? new();
            return s.ComoDiccionario().ToDictionary(k => k.Key, k => Math.Max(0, k.Value - antes.GetValueOrDefault(k.Key)));
        });
        var delMes = _wrapped.CopiaMes(mes).Stats;
        Ultima = new Foto { Fecha = DateTime.Now, Jugadores = jugadores, Mes = mes, Liga = tabla, Semana = semana, DelMes = delMes };

        // 5. data.json
        var uuids = _stats.Uuids();
        // Las skins se revisan aparte para no atrasar la página
        if (SkinsReales != null && Interlocked.Exchange(ref _revisandoSkins, 1) == 0)
        {
            var nombresSkins = jugadores.Select(j => j.Nombre).ToList();
            TareaSkins = Task.Run(async () =>
            {
                try { if (await SkinsReales.ActualizarAsync(nombresSkins, _alias)) Pedir(); }
                catch (Exception ex) { Console.WriteLine($"[Skins] Error: {ex.Message}"); }
                finally { Interlocked.Exchange(ref _revisandoSkins, 0); }
            });
        }
        var datos = new
        {
            actualizado = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss"),
            pagina = _config.PaginaUrl,
            jugadores = jugadores.Select(j => new
            {
                nombre = j.Nombre,
                uuid = _alias.NombresDe(j.Nombre).Select(n => uuids.GetValueOrDefault(n.ToLower())).FirstOrDefault(u => u != null),
                skin = SkinsReales?.De(j.Nombre) is { } sk ? $"{sk.Archivo}?v={sk.Hash}" : null,
                slim = SkinsReales?.De(j.Nombre)?.Slim ?? false,
                capa = SkinsReales?.De(j.Nombre) is { Capa.Length: > 0 } sc ? $"{sc.Capa}?v={sc.HashCapa}" : null,
                cuentas = _alias.NombresDe(j.Nombre).Select(n => new { nombre = n, plataforma = n.StartsWith('.') ? "bedrock" : "java" }).ToList(),
                masTonto = _medallas.MesesDeTonto(j.Nombre),
                horasAcompanado = _presencia.HorasAcompanado(j.Nombre),
                muertes = j.S.Muertes, horas = j.Horas, minutos = j.S.Minutos, minado = j.S.Minado, metros = j.S.Metros,
                mobs = j.S.Mobs, record = j.S.Record, diamantes = j.S.Diamantes, netherita = j.S.Netherita, racha = j.Racha, mejorRacha = j.MejorRacha,
                mensajes = j.Mensajes, dias = j.Dias, primerDia = _wrapped.PrimerDia(j.Nombre),
                xp = j.Xp, nivel = j.Nivel, xpNivel = j.XpNivel, xpSiguiente = j.XpSiguiente, rango = j.Rango, clase = j.Clase,
                capturas = conteoCapturas.GetValueOrDefault(j.Nombre),
                otrosNombres = _alias.NombresDe(j.Nombre).Skip(1).ToList(),
                medallas = _medallas.ParaPagina(j.Nombre, valores.GetValueOrDefault(j.Nombre) ?? new()),
            }).ToList(),
            semana,
            liga = new
            {
                mes,
                tabla,
                pronostico = tabla.Count > 0 ? tabla.OrderByDescending(f => f.Proyeccion).First().Nombre : null,
                campeones = _liga.Campeones(),
                finales = _liga.Finales(),
                carrera = _liga.Carrera(),
                puntos = new { porHora = global::Bot224.Liga.PorHora, bloquesPorPunto = global::Bot224.Liga.BloquesPorPunto, porDiamante = global::Bot224.Liga.PorDiamante, porNetherita = global::Bot224.Liga.PorNetherita,
                               mobsPorPunto = global::Bot224.Liga.MobsPorPunto, metrosPorPunto = global::Bot224.Liga.MetrosPorPunto, porDia = global::Bot224.Liga.PorDia, porMuerte = global::Bot224.Liga.PorMuerte },
            },
            presencia = _presencia.Copia(),
            wrapped = _wrapped.Copia(),
        };
        var json = JsonSerializer.Serialize(datos, Archivo.ParaPagina);
        File.WriteAllText("data.json", json);

        if (!_github.Listo)
        {
            Console.WriteLine($"[Página] data.json listo ({jugadores.Count} jugadores). Falta github_token para subirlo.");
            return;
        }
        // Con el server apagado los números no cambian: se sube una vez y ya
        if (_stats.Apagado && _subidoApagado) return;
        await _github.SubirAsync("data.json", Encoding.UTF8.GetBytes(json), "Stats de la 224");
        _subidoApagado = _stats.Apagado;

        // El historial (para gráficas) pesa más: se sube cada hora
        if (_ultimoHistorial == DateTime.MinValue && File.Exists("ultimo_historial.txt") && DateTime.TryParse(File.ReadAllText("ultimo_historial.txt"), out var uh)) _ultimoHistorial = uh;
        if (DateTime.Now - _ultimoHistorial >= TimeSpan.FromHours(1))
        {
            var hist = JsonSerializer.Serialize(_historial.Copia());
            await _github.SubirAsync("historial.json", Encoding.UTF8.GetBytes(hist), "Historial de la 224");
            _ultimoHistorial = DateTime.Now;
            File.WriteAllText("ultimo_historial.txt", _ultimoHistorial.ToString("s"));
        }

        await SubirPerfilesAsync(jugadores);
        Console.WriteLine($"[Página] Stats subidas ({jugadores.Count} jugadores){(_stats.Apagado ? " (server apagado, con las últimas guardadas)" : "")} ✔");
    }

    // Si alguien saca demasiados diamantes para la piedra que mina, le avisa a Dylan por DM (no se publica)
    private async Task RevisarXrayAsync(string jugador, Mundo.Extra x)
    {
        if (x.Piedra < 3000 || AvisarAdmin == null) return;
        var porMil = x.Diamantes * 1000.0 / x.Piedra;
        if (porMil < 15) return;
        var clave = jugador.ToLower();
        if (_xray.TryGetValue(clave, out var f) && DateTime.TryParse(f, out var d) && DateTime.Now - d < TimeSpan.FromDays(7)) return;
        _xray[clave] = DateTime.Now.ToString("s");
        Archivo.Guardar(RutaXray, _xray);
        Console.WriteLine($"[X-ray] {jugador}: {x.Diamantes} diamantes por {x.Piedra} de piedra ({porMil:0.0} por cada 1,000)");
        try
        {
            await AvisarAdmin($"🔎 **Revisa a {jugador}**: lleva {x.Diamantes} menas de diamante por {x.Piedra:N0} bloques de piedra ({porMil:0.0} por cada 1,000). " +
                              "Lo normal es de 1 a 5. Puede ser suerte o puede ser X-ray. Esto solo te llega a ti.");
        }
        catch { }
    }

    // Una mini página por jugador para que al mandar su link por WhatsApp salga con su skin
    private async Task SubirPerfilesAsync(List<Jugador> jugadores)
    {
        const string ruta = "perfiles.json";
        var hechos = Archivo.Leer<Dictionary<string, string>>(ruta);
        var hoy = DateTime.Now.ToString("yyyy-MM-dd");
        foreach (var j in jugadores)
        {
            if (hechos.GetValueOrDefault(j.Nombre) == hoy) continue;
            var nombreHtml = System.Net.WebUtility.HtmlEncode(j.Nombre);
            var url = _config.PaginaUrl + "#j-" + Uri.EscapeDataString(j.Nombre);
            var desc = $"Nivel {j.Nivel} · {j.Rango} · {j.Horas:0.#} h jugadas · {j.S.Diamantes} diamantes · {j.S.Muertes} muertes";
            var html = $"""
                <!doctype html>
                <html lang="es"><head><meta charset="utf-8">
                <title>{nombreHtml} en la 224</title>
                <meta property="og:title" content="{nombreHtml} · Minecraft 224">
                <meta property="og:description" content="{desc}">
                <meta property="og:image" content="{Skins.CuerpoUrl(j.Nombre)}">
                <meta property="og:type" content="profile">
                <meta name="twitter:card" content="summary">
                <meta name="theme-color" content="#5fd068">
                <meta http-equiv="refresh" content="0; url={url}">
                </head><body><script>location.replace({JsonSerializer.Serialize(url)})</script>
                <a href="{url}">Ver el perfil de {nombreHtml}</a></body></html>
                """;
            try
            {
                await _github.SubirAsync($"jugador/{j.Nombre}.html", Encoding.UTF8.GetBytes(html), $"Perfil de {j.Nombre}");
                hechos[j.Nombre] = hoy;
            }
            catch (Exception ex) { Console.WriteLine($"[Página] No se pudo subir el perfil de {j.Nombre}: {ex.Message}"); }
        }
        Archivo.Guardar(ruta, hechos);
    }
}
