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

    private static readonly string[][] Misiones =
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

            // Campanas a los 60, 30 y 10 minutos; a los 10 se abre el portal del spawn
            foreach (var min in new[] { 60, 30, 10 })
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
                if (min == 10) await _rcon.ComandoAsync("function jefes224:jefe/portal_abrir");
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
                Console.WriteLine($"[Jefes] Invocado {j.Id}");
            }
        }
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
