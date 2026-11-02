namespace Bot224;

// El Nether se cierra con la gamerule allow_entering_nether_using_portals=false.
// A la hora de apertura_nether el bot la prende por RCON y avisa en Discord (y un día antes).
public class AperturaNether
{
    private const string Ruta = "nether_avisos.json";
    private readonly Config _config;
    private readonly Rcon _rcon;
    private readonly Anunciador _avisos;
    private readonly HashSet<string> _hechos;

    public AperturaNether(Config config, Rcon rcon, Anunciador avisos)
    {
        _config = config; _rcon = rcon; _avisos = avisos;
        _hechos = new(Archivo.Leer<List<string>>(Ruta));
    }

    private void Marcar(string k) { _hechos.Add(k); Archivo.Guardar(Ruta, _hechos.ToList()); }

    public async Task PasoAsync()
    {
        if (_hechos.Contains("abierto") || !DateTimeOffset.TryParse(_config.AperturaNether, out var fecha)) return;
        var falta = fecha - DateTimeOffset.Now;
        if (falta > TimeSpan.Zero && falta <= TimeSpan.FromHours(24) && !_hechos.Contains("dia"))
        {
            await _avisos.AnunciarAsync("🔥 **Mañana a las 4:00 pm se abre el Nether.** Vayan preparando su portal.");
            Marcar("dia");
        }
        if (falta > TimeSpan.Zero) return;
        await _rcon.ComandoAsync("gamerule allow_entering_nether_using_portals true");
        await _rcon.ComandoAsync("gamerule allowEnteringNetherUsingPortals true");
        Marcar("abierto");
        if (falta > TimeSpan.FromHours(-3))
            await _avisos.AnunciarAsync("🔥 **¡YA SE ABRIÓ EL NETHER!** Prendan sus portales, la 224 entra al infierno.");
        Console.WriteLine("[Nether] Abierto");
    }

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        if (!DateTimeOffset.TryParse(_config.AperturaNether, out var fecha)) return;
        while (!cancelar.IsCancellationRequested && !_hechos.Contains("abierto"))
        {
            try
            {
                var falta = fecha - DateTimeOffset.Now;
                if (falta > TimeSpan.Zero && falta <= TimeSpan.FromHours(24) && !_hechos.Contains("dia"))
                {
                    await _avisos.AnunciarAsync("🔥 **Mañana a las 4:00 pm se abre el Nether.** Vayan preparando su portal.");
                    Marcar("dia");
                }
                if (falta <= TimeSpan.Zero)
                {
                    await _rcon.ComandoAsync("gamerule allow_entering_nether_using_portals true");
                    await _rcon.ComandoAsync("gamerule allowEnteringNetherUsingPortals true");
                    Marcar("abierto");
                    if (falta > TimeSpan.FromHours(-3))
                        await _avisos.AnunciarAsync("🔥 **¡YA SE ABRIÓ EL NETHER!** Prendan sus portales, la 224 entra al infierno.");
                    Console.WriteLine("[Nether] Abierto");
                }
            }
            catch (Exception ex) { Console.WriteLine($"[Nether] Todavía no pude abrirlo ({ex.Message}). Reintento en un rato."); }
            try { await Task.Delay(TimeSpan.FromSeconds(30), cancelar); } catch { return; }
        }
    }
}
