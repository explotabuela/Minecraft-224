using System.Text.RegularExpressions;

namespace Bot224;

// Cosas de admin: aviso de lag, alerta de trampas y reinicio programado.
public class Admin
{
    private static readonly Regex RegexMspt = new(@"Average time per tick:\s*([\d.]+)\s*ms", RegexOptions.IgnoreCase);
    private static readonly Regex RegexScore = new(@"has (-?\d+)");
    private static readonly Regex RegexLista = new(@"online:?\s*(.*)$", RegexOptions.Singleline);

    private readonly Config _config;
    private readonly Rcon _rcon;
    private readonly Discord _discord;
    public static bool Luna;
    public static int Semana;
    private int _lagSeguidos;
    private bool _aviseLag;
    private DateTime _ultimoReinicio = DateTime.MinValue;
    private readonly Dictionary<string, (int Diam, int Neth)> _ultimo = new();

    public Admin(Config config, Rcon rcon, Discord discord)
    {
        _config = config; _rcon = rcon; _discord = discord;
    }

    // Lee los TPS con /tick query (vanilla desde 1.20.3). Regresa 0 si no se pudo.
    public static async Task<double> TpsAsync(Rcon rcon)
    {
        try
        {
            var r = await rcon.ComandoAsync("tick query");
            var m = RegexMspt.Match(r);
            if (!m.Success) return 0;
            var mspt = double.Parse(m.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture);
            return mspt <= 50 ? 20.0 : Math.Round(1000.0 / mspt, 1);
        }
        catch { return 0; }
    }

    private Task AvisarAsync(string titulo, string texto, int color) =>
        _discord.MandarDmAsync(_config.AdminId, new
        {
            embeds = new[] { new { title = titulo, description = texto, color } },
        });

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            try
            {
                Luna = await ScoreAsync("#luna", "j_var") == 1;
                Semana = await ScoreAsync("#semana", "j_var");
                await LagAsync();
                await TrampasAsync();
                await ReinicioAsync();
            }
            catch (Exception ex) { Console.WriteLine($"[Admin] {ex.Message}"); }
            try { await Task.Delay(TimeSpan.FromMinutes(2), cancelar); } catch { }
        }
    }

    // 587: si baja de 15 TPS tres veces seguidas, aviso por privado
    private async Task LagAsync()
    {
        var tps = await TpsAsync(_rcon);
        if (tps <= 0) return;
        if (tps < 15)
        {
            _lagSeguidos++;
            if (_lagSeguidos >= 3 && !_aviseLag)
            {
                _aviseLag = true;
                var quienes = await _rcon.ComandoAsync("list");
                await AvisarAsync("🐌 El server va lento",
                    $"**TPS: {tps:0.0}** (lo normal es 20).\n\n{quienes.Trim()}\n\nSi sigue asi, conviene reiniciarlo.", 0xE8A33D);
            }
        }
        else
        {
            if (_aviseLag && tps >= 19)
            {
                _aviseLag = false;
                await AvisarAsync("🟢 Ya se compuso", $"El server volvio a **{tps:0.0} TPS**.", 0x5FD068);
            }
            _lagSeguidos = 0;
        }
    }

    // 595: si alguien junta diamantes o netherita demasiado rapido, aviso
    private async Task TrampasAsync()
    {
        var r = await _rcon.ComandoAsync("list");
        var m = RegexLista.Match(r);
        if (!m.Success) return;
        var nombres = m.Groups[1].Value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var n in nombres)
        {
            if (n.Length == 0) continue;
            var diam = await ScoreAsync(n, "diamantes");
            var neth = await ScoreAsync(n, "netherita");
            if (_ultimo.TryGetValue(n, out var antes))
            {
                var dd = diam - antes.Diam;
                var dn = neth - antes.Neth;
                if (dd >= 40 || dn >= 10)
                    await AvisarAsync("👀 Ojo con esto",
                        $"**{n}** junto **{dd} diamantes** y **{dn} de netherita** en 2 minutos.\n\n" +
                        "Puede ser una veta buena o puede ser x-ray. Tu decides si le echas un ojo.", 0xB03030);
            }
            _ultimo[n] = (diam, neth);
        }
    }

    private async Task<int> ScoreAsync(string jugador, string objetivo)
    {
        try
        {
            var r = await _rcon.ComandoAsync($"scoreboard players get {jugador} {objetivo}");
            var m = RegexScore.Match(r);
            return m.Success ? int.Parse(m.Groups[1].Value) : 0;
        }
        catch { return 0; }
    }

    // 597: reinicio diario a las 5 de la manana, con aviso de 5 minutos
    private async Task ReinicioAsync()
    {
        var ahora = DateTimeOffset.Now;
        if (ahora.Hour != 4 || ahora.Minute < 54 || ahora.Minute > 58) return;
        if (_ultimoReinicio.Date == DateTime.Now.Date) return;
        _ultimoReinicio = DateTime.Now;
        await _rcon.ComandoAsync("tellraw @a [\"\",{\"text\":\"[224] \",\"color\":\"gold\",\"bold\":true},{\"text\":\"El server se reinicia en 5 minutos. Guarden donde esten parados.\",\"color\":\"yellow\"}]");
        await Task.Delay(TimeSpan.FromMinutes(4));
        await _rcon.ComandoAsync("tellraw @a [\"\",{\"text\":\"[224] \",\"color\":\"gold\",\"bold\":true},{\"text\":\"Reinicio en 1 minuto.\",\"color\":\"red\"}]");
        await Task.Delay(TimeSpan.FromSeconds(50));
        await _rcon.ComandoAsync("say Reiniciando. Ahorita volvemos.");
        await _rcon.ComandoAsync("save-all");
        await Task.Delay(TimeSpan.FromSeconds(5));
        await _rcon.ComandoAsync("stop");
        Console.WriteLine("[Admin] Reinicio programado de las 5 am");
        await AvisarAsync("🔁 Reinicio de las 5 am", "El server se reinicio solo, como todos los dias.", 0x5865F2);
    }
}
