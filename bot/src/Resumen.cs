using System.Text.Json;

namespace Bot224;

// Resumen del día: quién jugó, el más viciado, el más tonto, el más minero...
// Compara las stats de ahorita contra las de ayer a la misma hora.
public class Resumen
{
    private readonly Config _config;
    private readonly Stats _stats;
    private readonly Anunciador _webhook;
    private const string Ruta = "resumen.json";

    private class Estado
    {
        public string Dia { get; set; } = "";
        public Dictionary<string, Stats.De> Base { get; set; } = new();
    }

    public Resumen(Config config, Stats stats, Anunciador webhook)
    {
        _config = config;
        _stats = stats;
        _webhook = webhook;
    }

    private static Estado Cargar() =>
        File.Exists(Ruta) ? JsonSerializer.Deserialize<Estado>(File.ReadAllText(Ruta)) ?? new() : new();

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            try
            {
                var ahora = DateTime.Now;
                if (ahora.Hour >= _config.HoraResumen && Cargar().Dia != ahora.ToString("yyyy-MM-dd"))
                    await PublicarAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Resumen] No se pudo hacer (¿server apagado?): {ex.Message}");
            }
            await Task.Delay(TimeSpan.FromMinutes(5), cancelar).ContinueWith(_ => { });
        }
    }

    public async Task PasoAsync()
    {
        var ahora = DateTime.Now;
        if (ahora.Hour >= _config.HoraResumen && Cargar().Dia != ahora.ToString("yyyy-MM-dd"))
            await PublicarAsync();
    }

    public async Task PublicarAsync()
    {
        var estado = Cargar();
        var hoy = await _stats.TodosAsync();
        var primeraVez = estado.Base.Count == 0;

        // Lo de hoy = total de ahorita - total de ayer
        var dia = hoy.Select(s =>
        {
            var b = estado.Base.GetValueOrDefault(s.Nombre) ?? new Stats.De();
            return new Stats.De
            {
                Nombre = s.Nombre,
                Muertes = s.Muertes - b.Muertes,
                Minutos = s.Minutos - b.Minutos,
                Minado = s.Minado - b.Minado,
                Metros = s.Metros - b.Metros,
                Mobs = s.Mobs - b.Mobs,
            };
        }).ToList();

        if (primeraVez)
        {
            Console.WriteLine("[Resumen] Primera vez: guardé las stats de hoy, mañana sale el primer resumen");
        }
        else
        {
            var jugaron = dia.Where(d => d.Minutos > 0).OrderByDescending(d => d.Minutos).ToList();
            if (jugaron.Count == 0)
            {
                await _webhook.AnunciarAsync("📅 **Resumen del día:** hoy nadie jugó en la 224 😴");
            }
            else
            {
                string? Mejor(Func<Stats.De, int> valor, string emoji, string titulo, Func<int, string> fmt)
                {
                    var top = jugaron.OrderByDescending(valor).First();
                    return valor(top) > 0 ? $"{emoji} **{titulo}:** {top.Nombre} ({fmt(valor(top))})" : null;
                }
                var lineas = new[]
                {
                    Mejor(d => d.Minutos, "⏱️", "Más viciado", Stats.Tiempo),
                    Mejor(d => d.Muertes, "💀", "Más tonto", n => $"{n} {(n == 1 ? "muerte" : "muertes")}"),
                    Mejor(d => d.Minado, "⛏️", "Más minero", n => $"{Stats.Num(n)} bloques"),
                    Mejor(d => d.Mobs, "⚔️", "Más asesino", n => $"{Stats.Num(n)} mobs"),
                    Mejor(d => d.Metros, "🚶", "Más caminador", n => $"{Stats.Num(n)} m"),
                }.Where(l => l != null);

                var totales = $"Entre todos: **{Stats.Tiempo(jugaron.Sum(d => d.Minutos))}** jugadas, " +
                              $"**{jugaron.Sum(d => d.Muertes)}** muertes y **{Stats.Num(jugaron.Sum(d => d.Minado))}** bloques minados.";

                var embed = new
                {
                    title = "📅 RESUMEN DEL DÍA",
                    description = $"**Jugaron ({jugaron.Count}):** {string.Join(", ", jugaron.Select(d => d.Nombre))}\n\n" +
                                  string.Join("\n", lineas) + "\n\n" + totales,
                    color = 0x5FD068,
                    thumbnail = new { url = Skins.Cabeza(jugaron[0].Nombre) },
                    footer = new { text = "Minecraft 224 · " + DateTime.Now.ToString("dd/MM/yyyy") },
                };
                await _webhook.AnunciarAsync("", embed, new[] { ("Ver la página", "#inicio") });
            }
            Console.WriteLine("[Resumen] Publicado");
        }

        var nuevo = new Estado { Dia = DateTime.Now.ToString("yyyy-MM-dd"), Base = hoy.ToDictionary(s => s.Nombre) };
        File.WriteAllText(Ruta, JsonSerializer.Serialize(nuevo, new JsonSerializerOptions { WriteIndented = true }));
    }
}
