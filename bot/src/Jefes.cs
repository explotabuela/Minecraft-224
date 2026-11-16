using System.Text.RegularExpressions;

namespace Bot224;

// Maneja el evento de jefes: aviso un día antes con coordenadas, invocación el sábado
// y la dificultad semanal (+5% por semana desde la inauguración).
public class Jefes
{
    private const string Ruta = "jefes_estado.json";
    private readonly Config _config;
    private readonly Rcon _rcon;
    private readonly Anunciador _avisos;
    private readonly Estado _e;

    public class Estado
    {
        public HashSet<string> Hechos { get; set; } = new();
        public Dictionary<string, string> Lugar { get; set; } = new();
        public int Semana { get; set; } = -1;
    }

    public record Jefe(string Id, string Nombre, string Fecha, string Dimension, string Bioma, string Pista);

    public static readonly Jefe[] Calendario =
    {
        new("bruja",    "La Bruja del Pantano",       "2026-12-19T17:10:00-07:00", "minecraft:overworld", "minecraft:swamp",            "en un pantano"),
        new("muneco",   "El Muñeco de Nieve Maldito", "2026-12-26T17:10:00-07:00", "minecraft:overworld", "minecraft:snowy_plains",     "en la nieve"),
        new("viejo",    "El Año Viejo",               "2027-01-02T17:10:00-07:00", "minecraft:overworld", "minecraft:plains",           "en una planicie"),
        new("reina",    "La Reina Araña",             "2027-01-09T17:10:00-07:00", "minecraft:overworld", "minecraft:lush_caves",       "bajo tierra, en una cueva frondosa"),
        new("rey",      "El Rey Esqueleto",           "2027-01-16T17:10:00-07:00", "minecraft:overworld", "minecraft:desert",           "en el desierto"),
        new("guardian", "El Guardián del Nether",     "2027-01-23T17:10:00-07:00", "minecraft:the_nether", "minecraft:crimson_forest",  "en el Nether, en un bosque carmesí"),
        new("ultimo",   "El Último",                  "2027-01-30T17:10:00-07:00", "minecraft:overworld", "minecraft:deep_dark",        "sobre la oscuridad profunda"),
        new("profe",    "La Profe Cristina",          "2027-02-06T17:10:00-07:00", "minecraft:overworld", "minecraft:meadow",           "en una pradera"),
    };

    public static readonly string[][] Misiones =
    {
        new[] { "Mata 30 zombis", "Junta 32 de hierro crudo", "Consigue 5 diamantes", "Comercia 10 veces con aldeanos" },
        new[] { "Mata 10 blazes", "Consigue 64 de cuarzo", "Mata 15 creepers", "Pesca 15 veces" },
        new[] { "Mata 3 esqueletos wither", "Consigue 2 escombros ancestrales", "Cría 20 animales", "Encanta 5 objetos" },
        new[] { "Mata 15 endermans", "Camina 10 km", "Mata 5 brujas", "Mata 5 piglins brutos" },
        new[] { "Mata 10 esqueletos wither", "Mata 3 ghasts", "Mata 30 arañas", "Consigue 64 lingotes de oro" },
        new[] { "Consigue 4 escombros ancestrales", "Mata 5 ahogados", "Mata 100 mobs", "Mata 10 saqueadores" },
        new[] { "Mata al Wither", "Consigue 20 diamantes", "Mata 40 creepers", "Gana una invasión de aldea" },
        new[] { "Mata 200 mobs", "Mata 20 blazes", "Comercia 30 veces", "Cómete 2 pasteles (14 rebanadas)" }
    };

    public Jefes(Config config, Rcon rcon, Anunciador avisos)
    {
        _config = config; _rcon = rcon; _avisos = avisos;
        _e = Archivo.Leer<Estado>(Ruta);
    }

    private void Guardar() => Archivo.Guardar(Ruta, _e);

    // Corre solo cuando el bot está prendido todo el tiempo (Cybrancee): revisa cada minuto
    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            try { await PasoAsync(); } catch (Exception ex) { Console.WriteLine($"[Jefes] {ex.Message}"); }
            try { await Task.Delay(TimeSpan.FromMinutes(1), cancelar); } catch { }
        }
    }

    // Cartel del jefe (la misma imagen de la página)
    private object Cartel(Jefe j, string texto) => new
    {
        title = j.Nombre.ToUpper(),
        description = texto,
        color = j.Id == "profe" ? 0x6B45C4 : 0xFFC94D,
        image = new { url = _avisos.Url($"img/jefes/{j.Id}.png") },
    };

    // Mensajes "hackeados" antes de la jefa final
    private record Hackeo(string Id, string Fecha, string Juego, string Discord);
    private static readonly Hackeo[] Hackeos =
    {
        new("hack1", "2027-02-03T19:24:00-07:00",
            "Se detectó un archivo desconocido en el servidor: cristina.exe",
            "Se detectó un archivo desconocido en el servidor: `cristina.exe`"),
        new("hack2", "2027-02-04T21:10:00-07:00",
            "¿De verdad creen que la Profe es solo una profe? Revisen su código.",
            "¿De verdad creen que la Profe es solo una profe? Revisen su código."),
        new("hack3", "2027-02-05T20:24:00-07:00",
            "Instalando... 87%. Nos vemos el sábado.",
            "Instalando... **87%**. Nos vemos el sábado."),
        new("hack4", "2027-02-06T16:10:00-07:00",
            "Instalación al 100%. Hoy no hay extraordinario.",
            "Instalación al **100%**. Hoy no hay extraordinario."),
    };

    private async Task HackeosAsync()
    {
        foreach (var h in Hackeos)
        {
            if (!DateTimeOffset.TryParse(h.Fecha, out var fecha)) continue;
            var falta = fecha - DateTimeOffset.Now;
            if (falta > TimeSpan.Zero || falta < TimeSpan.FromHours(-2) || _e.Hechos.Contains(h.Id)) continue;
            _e.Hechos.Add(h.Id); Guardar();
            var juego = h.Juego.Replace("\\", "\\\\").Replace("\"", "\\\"");
            await _rcon.ComandoAsync("tellraw @a [\"\",{\"text\":\"[\",\"color\":\"dark_red\"},{\"text\":\"xxxxxx\",\"color\":\"red\",\"obfuscated\":true},{\"text\":\"] \",\"color\":\"dark_red\"},{\"text\":\"" + juego + "\",\"color\":\"red\"}]");
            await _rcon.ComandoAsync("execute as @a at @s run playsound minecraft:block.beacon.deactivate master @s ~ ~ ~ 1 0.5");
            await _avisos.AnunciarAsync("", new
            {
                title = "⚠️ [ERROR DEL SISTEMA]",
                description = $"```\n> ...\n```\n{h.Discord}",
                color = 0x8B0000,
            });
            Console.WriteLine($"[Jefes] Mensaje hackeado {h.Id}");
        }
    }

    public async Task PasoAsync()
    {
        await SemanaAsync();
        await HackeosAsync();
        await CaosAsync();
        await CronoAsync();
        foreach (var j in Calendario)
        {
            if (!DateTimeOffset.TryParse(j.Fecha, out var fecha)) continue;
            var falta = fecha - DateTimeOffset.Now;

            // Aviso un día antes, con coordenadas
            if (falta > TimeSpan.Zero && falta <= TimeSpan.FromHours(24) && !_e.Hechos.Contains(j.Id + ":aviso"))
            {
                var lugar = await BuscarAsync(j);
                if (lugar == null) continue;
                _e.Lugar[j.Id] = lugar;
                _e.Hechos.Add(j.Id + ":aviso"); Guardar();
                await MandarLugarAsync(j, lugar, (int)falta.TotalMinutes);
                var p = lugar.Split(' ');
                await _avisos.AnunciarAsync(
                    $"👑 **MAÑANA A LAS 5:10 PM APARECE {j.Nombre.ToUpper()}**",
                    Cartel(j, $"Lo vieron {j.Pista}, cerca de **X: {p[0]}  Z: {p[2]}**" +
                    (j.Dimension == "minecraft:the_nether" ? " (en el Nether)" : "") +
                    "\nLleguen preparados. Todos los que le peguen se llevan botín."),
                    new[] { ("Ver todos los jefes", "#jefes") });
                Console.WriteLine($"[Jefes] Aviso {j.Id} en {lugar}");
            }

            // Avisos a los 60, 30, 15 y 5 minutos (campana en el juego y aviso en Discord); a los 15 se abre el portal del spawn
            foreach (var min in new[] { 60, 30, 15, 5 })
            {
                var clave = $"{j.Id}:campana{min}";
                if (falta <= TimeSpan.Zero || falta > TimeSpan.FromMinutes(min) || _e.Hechos.Contains(clave)) continue;
                if (!_e.Lugar.TryGetValue(j.Id, out var donde))
                {
                    donde = await BuscarAsync(j);
                    if (donde == null) continue;
                    _e.Lugar[j.Id] = donde;
                }
                _e.Hechos.Add(clave); Guardar();
                await MandarLugarAsync(j, donde, min);
                await _rcon.ComandoAsync("function jefes224:jefe/campana");
                if (min == 15) await _rcon.ComandoAsync("function jefes224:jefe/portal_abrir");
                if (falta > TimeSpan.FromMinutes(min - 3)) await AvisoDiscordAsync(j, donde, min);
                Console.WriteLine($"[Jefes] Campana de {min} min para {j.Id}");
            }

            // Hora y media después de la pelea se cierra el portal
            if (falta < TimeSpan.FromMinutes(-90) && _e.Hechos.Contains(j.Id + ":invocado") && !_e.Hechos.Contains(j.Id + ":portalcerrado"))
            {
                _e.Hechos.Add(j.Id + ":portalcerrado"); Guardar();
                await _rcon.ComandoAsync("function jefes224:jefe/portal_cerrar");
                Console.WriteLine($"[Jefes] Portal cerrado para {j.Id}");
            }

            // Invocación el sábado (hasta 1 hora de tolerancia)
            if (falta <= TimeSpan.Zero && falta > TimeSpan.FromHours(-1) && !_e.Hechos.Contains(j.Id + ":invocado"))
            {
                if (!_e.Lugar.TryGetValue(j.Id, out var lugar))
                {
                    lugar = await BuscarAsync(j);
                    if (lugar == null) continue;
                    _e.Lugar[j.Id] = lugar;
                }
                await _rcon.ComandoAsync($"execute in {j.Dimension} positioned {lugar} rotated 0 0 run function jefes224:{j.Id}/invocar");
                _e.Hechos.Add(j.Id + ":invocado"); Guardar();
                var p = lugar.Split(' ');
                await _avisos.AnunciarAsync($"⚔️ **¡{j.Nombre.ToUpper()} HA DESPERTADO!**",
                    Cartel(j, $"Está en **X: {p[0]}  Z: {p[2]}**. ¡Vayan todos!"));
                Diario.Instancia?.Temporada("jefe", $"Apareció {j.Nombre}");
                Console.WriteLine($"[Jefes] Invocado {j.Id}");
            }
        }
    }

    // Aviso en Discord antes del jefe: a la hora solo la hora, desde los 30 min con coordenadas
    private async Task AvisoDiscordAsync(Jefe j, string lugar, int min)
    {
        var p = lugar.Split(' ');
        var nether = j.Dimension == "minecraft:the_nether" ? " (en el Nether)" : "";
        if (min >= 60)
        {
            await _avisos.AnunciarAsync($"⏰ **En 1 hora aparece {j.Nombre}.** Hoy a las 5:10 pm. Vayan preparando sus cosas.");
            return;
        }
        var cuando = min == 5 ? "**¡En 5 minutos!**" : $"En **{min} minutos**";
        await _avisos.AnunciarAsync($"⏰ {cuando} aparece **{j.Nombre}** en **X: {p[0]}  Z: {p[2]}**{nether}.");
    }

    // Le pasa al datapack dónde es la pelea y cuántos minutos faltan (campanas, portal y brújula)
    private async Task MandarLugarAsync(Jefe j, string lugar, int min)
    {
        var p = lugar.Split(' ');
        if (p.Length < 3) return;
        await _rcon.ComandoAsync($"scoreboard players set #jx j_var {p[0]}");
        await _rcon.ComandoAsync($"scoreboard players set #jy j_var {p[1]}");
        await _rcon.ComandoAsync($"scoreboard players set #jz j_var {p[2]}");
        await _rcon.ComandoAsync($"scoreboard players set #jefe_dim j_var {(j.Dimension == "minecraft:the_nether" ? 1 : 0)}");
        await _rcon.ComandoAsync($"scoreboard players set #jefe_id j_var {Array.IndexOf(Calendario, j) + 1}");
        await _rcon.ComandoAsync($"scoreboard players set #jefe_min j_var {min}");
        await _rcon.ComandoAsync("scoreboard players set #jefe_hay j_var 1");
    }

    // Busca el bioma del jefe cerca de un punto random alrededor del spawn y regresa "x y z"
    private async Task<string?> BuscarAsync(Jefe j)
    {
        var r = new Random();
        int ox = r.Next(-1200, 1201), oz = r.Next(-1200, 1201);
        var resp = await _rcon.ComandoAsync($"execute in {j.Dimension} positioned {ox} 64 {oz} run locate biome {j.Bioma}");
        var m = Regex.Match(resp, @"\[(-?\d+),\s*(~|-?\d+),\s*(-?\d+)\]");
        if (!m.Success) { Console.WriteLine($"[Jefes] No encontré {j.Bioma}: {resp}"); return null; }
        var y = m.Groups[2].Value == "~" ? "100" : m.Groups[2].Value;
        if (j.Id is "bruja" or "muneco" or "viejo" or "rey" or "ultimo" or "profe") y = "100";
        return $"{m.Groups[1].Value} {y} {m.Groups[3].Value}";
    }

    // Día del caos: dos veces al mes, en días al azar (siempre los mismos para ese mes), de 12 pm a 12 pm
    public IEnumerable<DateTimeOffset> DiasCaos()
    {
        if (!DateTimeOffset.TryParse(_config.Inauguracion, out var ini)) yield break;
        if (!DateTimeOffset.TryParse(Calendario[^1].Fecha, out var fin)) yield break;
        for (var m = new DateTime(ini.Year, ini.Month, 1); m <= fin.Date; m = m.AddMonths(1))
        {
            var r = new Random(m.Year * 100 + m.Month);
            foreach (var (a, b) in new[] { (3, 13), (17, 27) })
            {
                var d = new DateTimeOffset(m.Year, m.Month, r.Next(a, b + 1), 12, 0, 0, ini.Offset);
                if (d.DayOfWeek == DayOfWeek.Saturday) d = d.AddDays(1); // el sábado es del jefe
                if (d < ini.AddDays(2) || d.AddDays(1) > fin) continue;
                yield return d;
            }
        }
    }

    // Cronómetro del sótano: minutos que faltan para el próximo jefe
    private static readonly string[] MesesCortos = { "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic" };
    private async Task CronoAsync()
    {
        var ahora = DateTimeOffset.Now;
        var prox = Calendario.Select(j => DateTimeOffset.TryParse(j.Fecha, out var f) ? f : DateTimeOffset.MinValue).Where(f => f > ahora).DefaultIfEmpty(DateTimeOffset.MinValue).Min();
        var min = prox == DateTimeOffset.MinValue ? 0 : (int)Math.Ceiling((prox - ahora).TotalMinutes);
        await _rcon.ComandoAsync($"scoreboard players set #crono j_var {min}");

    }

    private async Task CaosAsync()
    {
        var ahora = DateTimeOffset.Now;
        foreach (var d in DiasCaos())
        {
            var k = $"caos:{d:yyyy-MM-dd}";
            if (ahora >= d && ahora < d.AddHours(24) && !_e.Hechos.Contains(k + ":ini"))
            {
                _e.Hechos.Add(k + ":ini"); Guardar();
                await _rcon.ComandoAsync("function jefes224:caos/empezar");
                await _avisos.AnunciarAsync("🌀 **¡DÍA DEL CAOS!** Por 24 horas cada mob que aparezca sale de un tipo al azar: un zombi puede ser creeper y una araña puede ser bruja. Los jefes no cambian. Cuídense.");
                Diario.Instancia?.Temporada("caos", "Día del caos: los mobs salieron cambiados");
                Console.WriteLine($"[Jefes] Empezó el día del caos {d:yyyy-MM-dd}");
            }
            if (ahora >= d.AddHours(24) && _e.Hechos.Contains(k + ":ini") && !_e.Hechos.Contains(k + ":fin"))
            {
                _e.Hechos.Add(k + ":fin"); Guardar();
                var resp = await _rcon.ComandoAsync("scoreboard players get #caos_n j_var");
                var m = Regex.Match(resp, @"has (\d+)");
                await _rcon.ComandoAsync("function jefes224:caos/terminar");
                await _avisos.AnunciarAsync("🌀 Se acabó el Día del caos." + (m.Success ? $" Se cambiaron **{m.Groups[1].Value}** mobs." : "") + " Todo vuelve a la normalidad.");
                Console.WriteLine($"[Jefes] Terminó el día del caos {d:yyyy-MM-dd}");
            }
        }
    }

    // +5% por semana: semana 0 la primera, 1 la segunda, etc.
    private async Task SemanaAsync()
    {
        if (!DateTimeOffset.TryParse(_config.Inauguracion, out var ini)) return;
        var dias = (DateTimeOffset.Now - ini).TotalDays;
        if (dias < 0) return;
        var semana = (int)(dias / 7);
        if (semana == _e.Semana) return;
        await _rcon.ComandoAsync($"scoreboard players set #semana j_var {semana}");
        await _rcon.ComandoAsync("function jefes224:mundo/semana");
        _e.Semana = semana; Guardar();
        Console.WriteLine($"[Jefes] Semana de dificultad: {semana}");
        var lista = Misiones[Math.Min(semana, Misiones.Length - 1)];
        await _avisos.AnunciarAsync("📜 **MISIONES DE LA SEMANA**\n" +
            string.Join("\n", lista.Select((t, i) => $"**{i + 1}.** {t}")) +
            "\nEn el juego escribe `/trigger misiones` para ver tu avance. Cada una tiene premio.");
    }
}
