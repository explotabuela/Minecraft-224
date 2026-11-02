using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// "El más tonto de la semana": cuenta las muertes de la semana y las publica en Discord
public class Ranking
{
    private readonly Config _config;
    private readonly Stats _stats;
    private readonly Anunciador _webhook;
    private const string RutaEstado = "estado.json";

    public Ranking(Config config, Stats stats, Anunciador webhook)
    {
        _config = config;
        _stats = stats;
        _webhook = webhook;
    }

    private class Estado
    {
        public string UltimoRanking { get; set; } = "";
        public Dictionary<string, int> Muertes { get; set; } = new();
        public Dictionary<string, int> Minutos { get; set; } = new();
    }

    private static Estado CargarEstado() =>
        File.Exists(RutaEstado)
            ? JsonSerializer.Deserialize<Estado>(File.ReadAllText(RutaEstado)) ?? new Estado()
            : new Estado();

    private static void GuardarEstado(Estado e) =>
        File.WriteAllText(RutaEstado, JsonSerializer.Serialize(e, new JsonSerializerOptions { WriteIndented = true }));

    // Revisa cada minuto si ya toca publicar
    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            try
            {
                var ahora = DateTime.Now;
                var hoy = ahora.ToString("yyyy-MM-dd");
                if (ahora.DayOfWeek == _config.DiaRanking && ahora.Hour >= _config.HoraRanking
                    && CargarEstado().UltimoRanking != hoy)
                {
                    await PublicarAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ranking] Error: {ex.Message}");
            }
            await Task.Delay(TimeSpan.FromMinutes(1), cancelar).ContinueWith(_ => { });
        }
    }

    // Muertes totales de cada jugador (Java y Bedrock juntos)
    public async Task<Dictionary<string, int>> MuertesTotalesAsync() =>
        (await _stats.TodosAsync()).ToDictionary(s => s.Nombre, s => s.Muertes);

    public async Task PasoAsync()
    {
        var ahora = DateTime.Now;
        if (ahora.DayOfWeek == _config.DiaRanking && ahora.Hour >= _config.HoraRanking
            && CargarEstado().UltimoRanking != ahora.ToString("yyyy-MM-dd"))
            await PublicarAsync();
    }

    public async Task PublicarAsync()
    {
        var estado = CargarEstado();
        var todos = await _stats.TodosAsync();
        var totales = todos.ToDictionary(s => s.Nombre, s => s.Muertes);
        var minutos = todos.ToDictionary(s => s.Nombre, s => s.Minutos);
        // Cuánto jugó cada quien esta semana (para no felicitar a nadie por "no morir" si ni jugó)
        var jugadoSemana = minutos.Sum(t => Math.Max(0, t.Value - estado.Minutos.GetValueOrDefault(t.Key, estado.Minutos.Count == 0 ? t.Value : 0)));

        // Muertes de esta semana = total de hoy - total de la semana pasada
        var semana = totales
            .Select(t => (Jugador: t.Key, Muertes: t.Value - estado.Muertes.GetValueOrDefault(t.Key, 0)))
            .Where(x => x.Muertes > 0)
            .OrderByDescending(x => x.Muertes)
            .ToList();

        if (semana.Count == 0 && jugadoSemana < 180)
        {
            // Casi nadie jugó: no hay nada que presumir
            Console.WriteLine($"[Ranking] Casi nadie jugó esta semana ({jugadoSemana} min), no se publica");
        }
        else if (semana.Count == 0)
        {
            await _webhook.AnunciarAsync($"😇 **Nadie murió esta semana**, y eso que jugaron {jugadoSemana / 60} horas entre todos. ¿Quiénes son ustedes y qué hicieron con la 224?");
        }
        else
        {
            var medallas = new[] { "🥇", "🥈", "🥉" };
            var lineas = semana.Take(5).Select((x, i) =>
                $"{(i < 3 ? medallas[i] : "▫️")} **{x.Jugador}** — {x.Muertes} {(x.Muertes == 1 ? "muerte" : "muertes")}");
            var tonto = semana[0];

            var embed = new
            {
                title = "💀 EL MÁS TONTO DE LA SEMANA 💀",
                description = $"## {tonto.Jugador}\ncon **{tonto.Muertes}** muertes por tonto\n\n" + string.Join("\n", lineas),
                color = 0xE74C3C,
                thumbnail = new { url = Skins.Cabeza(tonto.Jugador) },
                footer = new { text = "Minecraft 224 · ranking semanal" }
            };
            await _webhook.AnunciarAsync("", embed, new[] { ("Ver el ranking", "#ranking") });
        }

        estado.UltimoRanking = DateTime.Now.ToString("yyyy-MM-dd");
        estado.Muertes = totales;
        estado.Minutos = minutos;
        GuardarEstado(estado);
        Console.WriteLine("[Ranking] Publicado");
    }
}
