namespace Bot224;

// Cuenta regresiva en Discord: un día antes, una hora antes y cuando abre.
// Si el bot estaba apagado en ese momento, no manda avisos viejos (solo el que toca ahorita).
public class Inauguracion
{
    private const string Ruta = "inauguracion_avisos.json";
    private readonly Config _config;
    private readonly Anunciador _avisos;
    private readonly HashSet<string> _mandados;

    public Inauguracion(Config config, Anunciador avisos)
    {
        _config = config; _avisos = avisos;
        _mandados = new(Archivo.Leer<List<string>>(Ruta));
    }

    public DateTimeOffset? Fecha =>
        DateTimeOffset.TryParse(_config.Inauguracion, out var f) ? f : null;

    // Qué aviso toca a esta hora (o null)
    public static string? QueToca(DateTimeOffset ahora, DateTimeOffset fecha)
    {
        var falta = fecha - ahora;
        if (falta <= TimeSpan.Zero) return falta > TimeSpan.FromHours(-3) ? "abierto" : null;
        if (falta <= TimeSpan.FromHours(1)) return "hora";
        if (falta <= TimeSpan.FromHours(24)) return "dia";
        return null;
    }

    public string Mensaje(string cual)
    {
        var ip = string.IsNullOrWhiteSpace(_config.IpServer) ? "" : $"\nIP: `{_config.IpServer}`";
        var bedrock = _config.PuertoBedrock > 0 ? $" (Bedrock: misma IP, puerto `{_config.PuertoBedrock}`)" : "";
        return cual switch
        {
            "dia" => "📅 **¡Mañana abre la 224!** A las 4:00 pm. Si todavía no estás en la whitelist, usa `/entrar` ya.",
            "hora" => "⏰ **¡Falta 1 hora para que abra la 224!** Vayan prendiendo el Minecraft.",
            _ => $"🎉 **¡YA ABRIÓ LA 224!** Entren ya, la temporada empezó.{ip}{(ip == "" ? "" : bedrock)}\nVersión de Java: **{_config.Version}**. Usa `/ip` si no sabes cómo entrar.",
        };
    }

    public async Task PasoAsync()
    {
        if (Fecha is not { } fecha) return;
        var cual = QueToca(DateTimeOffset.Now, fecha);
        if (cual == null || _mandados.Contains(cual)) return;
        await _avisos.AnunciarAsync(Mensaje(cual), botones: new[] { ("Ver la página", "") });
        foreach (var k in new[] { "dia", "hora", "abierto" }) { _mandados.Add(k); if (k == cual) break; }
        Archivo.Guardar(Ruta, _mandados.ToList());
    }

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        if (Fecha is not { } fecha) return;
        while (!cancelar.IsCancellationRequested)
        {
            try
            {
                var cual = QueToca(DateTimeOffset.Now, fecha);
                if (cual != null && !_mandados.Contains(cual))
                {
                    await _avisos.AnunciarAsync(Mensaje(cual), botones: new[] { ("Ver la página", "") });
                    // Los anteriores ya no tienen caso
                    foreach (var k in new[] { "dia", "hora", "abierto" })
                    {
                        _mandados.Add(k);
                        if (k == cual) break;
                    }
                    Archivo.Guardar(Ruta, _mandados.ToList());
                    Console.WriteLine($"[Inauguración] Mandado el aviso: {cual}");
                }
                if (DateTimeOffset.Now > fecha.AddHours(3)) return;
            }
            catch (Exception ex) { Console.WriteLine($"[Inauguración] Error: {ex.Message}"); }
            try { await Task.Delay(TimeSpan.FromSeconds(30), cancelar); } catch { return; }
        }
    }
}
