using System.Text.Json;

namespace Bot224;

// 91: una encuesta por semana en Discord, con la encuesta nativa de Discord.
public class Encuesta
{
    private const string Ruta = "encuestas.json";

    public class Estado { public List<int> Hechas { get; set; } = new(); public string Ultima { get; set; } = ""; }

    private readonly Config _config;
    private readonly Discord _discord;
    private readonly Estado _e;

    public Encuesta(Config config, Discord discord)
    {
        _config = config; _discord = discord;
        _e = Archivo.Leer<Estado>(Ruta) ?? new Estado();
    }

    private record Pregunta(string Texto, string[] Opciones);

    private static readonly Pregunta[] Preguntas =
    {
        new("¿Qué jefe les ha costado más hasta ahorita?", new[] { "La Bruja", "El Muñeco", "El Año Viejo", "La Reina Araña", "El Rey Esqueleto" }),
        new("¿Qué prueba del Gulag es la más injusta?", new[] { "Las oleadas", "El parkour", "La lava", "El tiro", "El laberinto" }),
        new("Si pudiéramos agregar UNA cosa al server, ¿cuál?", new[] { "Más jefes", "Más misiones", "Más pruebas de Gulag", "Más eventos sorpresa", "Nada, así está bien" }),
        new("¿Qué les gustaría que soltaran más los jefes?", new[] { "Diamantes y netherita", "Encantamientos buenos", "Cosas raras que no se consiguen", "Más experiencia" }),
        new("¿Las noches están muy difíciles?", new[] { "Sí, mucho", "Está bien así", "No, póngale más", "Ni me he dado cuenta" }),
        new("¿A qué hora juegan más?", new[] { "En la mañana", "Saliendo de la escuela", "En la noche", "De madrugada" }),
        new("¿Qué parte del server usan más?", new[] { "El spawn", "Las misiones", "Los jefes", "Mi base", "El Discord" }),
        new("¿Les late que haya una temporada 2?", new[] { "Sí, obvio", "Sí pero con otro mundo", "Mejor otro juego", "No sé" }),
        new("¿Qué le falta a la página?", new[] { "Más stats", "Más fotos", "Más del Gulag", "Nada, está completa" }),
        new("¿Les gustaría que el Nether fuera más difícil todavía?", new[] { "Sí", "No, ya está pesado", "Que sea difícil pero dé más botín" }),
        new("¿Qué prefieren para el jefe del sábado?", new[] { "Que sea más largo", "Que pegue más fuerte", "Que tenga más fases", "Así está bien" }),
        new("¿Han usado el libro de la 224?", new[] { "Sí, varias veces", "Una vez", "Ni sabía que existía" }),
        new("¿Construyen juntos o cada quien por su lado?", new[] { "Todos juntos", "En equipos chicos", "Cada quien su base", "Depende del día" }),
        new("¿Qué tanto les sirve el tablero del spawn?", new[] { "Mucho", "Más o menos", "No lo he visto" }),
        new("¿Qué opinan de las lunas de sangre?", new[] { "Están chidas", "Muy difíciles", "Que salgan más seguido", "Que salgan menos" }),
        new("¿Qué quieren que tenga el último jefe?", new[] { "Más fases", "Más cinemática", "Más botín", "Que sea más difícil" }),
        new("Para la última semana, ¿qué hacemos?", new[] { "Tour de bases", "Foto de todos", "Un evento especial", "Las tres" }),
        new("¿Les gustó el spawn nuevo?", new[] { "Sí, está chido", "Le falta algo", "Prefería el de antes" }),
        new("¿Qué tan seguido entran?", new[] { "Diario", "Casi diario", "Fines de semana", "De vez en cuando" }),
        new("Del 1 al 5, ¿cómo va la temporada?", new[] { "5, está perfecta", "4, muy bien", "3, bien", "2, le falta", "1, mal" }),
    };

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            try { await PasoAsync(); } catch (Exception ex) { Console.WriteLine($"[Encuesta] {ex.Message}"); }
            try { await Task.Delay(TimeSpan.FromMinutes(30), cancelar); } catch { }
        }
    }

    private async Task PasoAsync()
    {
        var ahora = DateTimeOffset.Now;
        if (ahora.DayOfWeek != DayOfWeek.Sunday || ahora.Hour < 12 || ahora.Hour > 20) return;
        var clave = $"{ahora:yyyy-MM-dd}";
        if (_e.Ultima == clave) return;
        if (string.IsNullOrWhiteSpace(_config.CanalChatId)) return;

        var libres = Enumerable.Range(0, Preguntas.Length).Where(k => !_e.Hechas.Contains(k)).ToList();
        if (libres.Count == 0) { _e.Hechas.Clear(); libres = Enumerable.Range(0, Preguntas.Length).ToList(); }
        var idx = libres[new Random().Next(libres.Count)];
        var p = Preguntas[idx];

        var ok = await _discord.EnviarCanalAsync(_config.CanalChatId, new
        {
            content = "🗳️ **Encuesta de la semana**",
            poll = new
            {
                question = new { text = p.Texto },
                answers = p.Opciones.Select(o => new { poll_media = new { text = o } }).ToArray(),
                duration = 72,
                allow_multiselect = false,
            },
        });
        if (ok == null) return;
        _e.Hechas.Add(idx);
        _e.Ultima = clave;
        Archivo.Guardar(Ruta, _e);
        Console.WriteLine($"[Encuesta] Publicada: {p.Texto}");
    }
}
