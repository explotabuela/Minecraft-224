using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// 21/29/98: la ficha de cada pelea. Cuando el datapack marca #ficha, el bot lee la duración
// y el daño de cada quien, lo publica en Discord y lo guarda para la página.
public class Ficha
{
    private const string Ruta = "fichas.json";
    private static readonly Regex RegexScore = new(@"has (-?\d+)");
    private static readonly Regex RegexLista = new(@"online:?\s*(.*)$", RegexOptions.Singleline);

    private readonly Config _config;
    private readonly Rcon _rcon;
    private readonly Anunciador _avisos;
    private readonly GitHub _github;
    private readonly Alias _alias;

    public record Linea(string Jugador, int Dano);
    public record Una(string Jefe, string Nombre, string Fecha, int Minutos, int Segundos, List<Linea> Dano);

    private List<Una> _fichas;

    public Ficha(Config config, Rcon rcon, Anunciador avisos, GitHub github, Alias alias)
    {
        _config = config; _rcon = rcon; _avisos = avisos; _github = github; _alias = alias;
        _fichas = Archivo.Leer<List<Una>>(Ruta) ?? new List<Una>();
    }

    private async Task<int> ScoreAsync(string quien, string obj)
    {
        try
        {
            var r = await _rcon.ComandoAsync($"scoreboard players get {quien} {obj}");
            var m = RegexScore.Match(r);
            return m.Success ? int.Parse(m.Groups[1].Value) : 0;
        }
        catch { return 0; }
    }

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            try { await PasoAsync(); } catch (Exception ex) { Console.WriteLine($"[Ficha] {ex.Message}"); }
            try { await Task.Delay(TimeSpan.FromMinutes(1), cancelar); } catch { }
        }
    }

    private async Task PasoAsync()
    {
        var n = await ScoreAsync("#ficha", "j_var");
        if (n <= 0 || n > Jefes.Calendario.Length) return;
        await _rcon.ComandoAsync("scoreboard players set #ficha j_var 0");

        var jefe = Jefes.Calendario[n - 1];
        var min = await ScoreAsync("#ficha_min", "j_var");
        var sg = await ScoreAsync("#ficha_sg", "j_var");

        var lista = await _rcon.ComandoAsync("list");
        var m = RegexLista.Match(lista);
        var nombres = m.Success
            ? m.Groups[1].Value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : Array.Empty<string>();

        var dano = new List<Linea>();
        foreach (var jug in nombres)
        {
            if (jug.Length == 0) continue;
            var d = await ScoreAsync(jug, "j_dano");
            if (d > 0) dano.Add(new Linea(_alias.Principal(jug), d));
        }
        dano = dano.OrderByDescending(x => x.Dano).ToList();

        var una = new Una(jefe.Id, jefe.Nombre, DateTimeOffset.Now.ToString("o"), min, sg, dano);
        _fichas.RemoveAll(f => f.Jefe == jefe.Id);
        _fichas.Add(una);
        Archivo.Guardar(Ruta, _fichas);
        try { await _github.SubirAsync("fichas.json", System.Text.Encoding.UTF8.GetBytes(JsonSerializer.Serialize(_fichas, new JsonSerializerOptions { WriteIndented = true })), "Ficha de " + jefe.Nombre); }
        catch (Exception ex) { Console.WriteLine($"[Ficha] No se pudo subir: {ex.Message}"); }

        var total = dano.Sum(x => x.Dano);
        var barra = new System.Text.StringBuilder();
        foreach (var l in dano.Take(10))
        {
            var pct = total > 0 ? l.Dano * 100 / total : 0;
            var n2 = Math.Max(1, pct / 5);
            barra.AppendLine($"`{new string('█', Math.Min(n2, 20)),-20}` **{l.Jugador}** · {l.Dano} ({pct}%)");
        }
        if (dano.Count == 0) barra.AppendLine("Nadie le alcanzó a pegar. Raro.");

        await _avisos.AnunciarAsync($"📋 **FICHA DE LA PELEA: {jefe.Nombre.ToUpper()}**", new
        {
            title = jefe.Nombre,
            description = $"**Duró {min} min {sg} s** · pelearon **{dano.Count}**\n\n**Daño de cada quien**\n{barra}",
            color = jefe.Id == "profe" ? 0x6B45C4 : 0xFFC94D,
            image = new { url = _avisos.Url($"img/jefes/{jefe.Id}.png") },
        }, new[] { ("Ver la ficha completa", "#jefes") });
        Console.WriteLine($"[Ficha] Publicada la de {jefe.Id}");
    }
}
