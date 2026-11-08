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

    private record Jefe(string Id, string Nombre, string Fecha, string Dimension, string Bioma, string Pista);

    private static readonly Jefe[] Calendario =
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

    public async Task PasoAsync()
    {
        await SemanaAsync();
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
                var p = lugar.Split(' ');
                await _avisos.AnunciarAsync(
                    $"👑 **MAÑANA A LAS 5:10 PM APARECE {j.Nombre.ToUpper()}**\n" +
                    $"Lo vieron {j.Pista}, cerca de **X: {p[0]}  Z: {p[2]}**" +
                    (j.Dimension == "minecraft:the_nether" ? " (en el Nether)" : "") +
                    "\nLleguen preparados. Todos los que le peguen se llevan botín.");
                Console.WriteLine($"[Jefes] Aviso {j.Id} en {lugar}");
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
                await _avisos.AnunciarAsync($"⚔️ **¡{j.Nombre.ToUpper()} HA DESPERTADO!** en X: {p[0]}  Z: {p[2]}. ¡Vayan todos!");
                Console.WriteLine($"[Jefes] Invocado {j.Id}");
            }
        }
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
