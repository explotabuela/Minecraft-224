namespace Bot224;

// Idea 44: tablón de la semana en el sótano del spawn. Cada lunes se arma con lo de los 7 días
// anteriores (más horas, más mobs, más minado, más muertes y la mejor racha) y se pone en carteles.
public class Tablon
{
    private const string Ruta = "tablon.json";
    private static readonly string[] Meses = { "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic" };
    private readonly Rcon _rcon;
    private readonly Pagina _pagina;
    private readonly Estado _e;

    public class Estado
    {
        public string Lunes { get; set; } = "";
        public Dictionary<string, string> Datos { get; set; } = new();
    }

    public Tablon(Rcon rcon, Pagina pagina)
    {
        _rcon = rcon; _pagina = pagina;
        _e = Archivo.Leer<Estado>(Ruta);
    }

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        await Task.Delay(TimeSpan.FromMinutes(2), cancelar).ContinueWith(_ => { });
        while (!cancelar.IsCancellationRequested)
        {
            try { await PasoAsync(); } catch (Exception ex) { Console.WriteLine($"[Tablón] {ex.Message}"); }
            try { await Task.Delay(TimeSpan.FromMinutes(30), cancelar); } catch { }
        }
    }

    public async Task PasoAsync()
    {
        var hoy = DateTime.Now.Date;
        var lunes = hoy.AddDays(-(((int)hoy.DayOfWeek + 6) % 7));
        var clave = lunes.ToString("yyyy-MM-dd");
        var foto = _pagina.Ultima;
        if (_e.Lunes != clave && foto != null)
        {
            var semana = foto.Semana;
            (string, string) Mejor(string stat, Func<int, string> texto)
            {
                var top = semana.Select(x => (Nombre: x.Key, V: x.Value.GetValueOrDefault(stat))).OrderByDescending(x => x.V).FirstOrDefault();
                return top.V > 0 ? (Corto(top.Nombre), texto(top.V)) : ("nadie", "");
            }
            var (hn, hv) = Mejor("minutos", v => $"{v / 60}h {v % 60}m");
            var (mn, mv) = Mejor("mobs", v => $"{v} mobs");
            var (bn, bv) = Mejor("minado", v => $"{v} bloques");
            var (dn, dv) = Mejor("muertes", v => v == 1 ? "1 muerte" : $"{v} muertes");
            var racha = foto.Jugadores.OrderByDescending(j => j.Racha).FirstOrDefault();
            var ini = lunes.AddDays(-7); var fin = lunes.AddDays(-1);
            _e.Datos = new()
            {
                ["del"] = $"del {ini.Day} {Meses[ini.Month - 1]}", ["al"] = $"al {fin.Day} {Meses[fin.Month - 1]}",
                ["h_n"] = hn, ["h_v"] = hv, ["m_n"] = mn, ["m_v"] = mv, ["b_n"] = bn, ["b_v"] = bv, ["d_n"] = dn, ["d_v"] = dv,
                ["r_n"] = racha is { Racha: > 0 } ? Corto(racha.Nombre) : "nadie",
                ["r_v"] = racha is { Racha: > 0 } ? (racha.Racha == 1 ? "1 dia" : $"{racha.Racha} dias") : "",
            };
            _e.Lunes = clave;
            Archivo.Guardar(Ruta, _e);
            Console.WriteLine("[Tablón] Tablón de la semana armado");
        }
        if (_e.Datos.Count == 0) return;
        var snbt = "{" + string.Join(",", _e.Datos.Select(x => $"{x.Key}:\"{x.Value.Replace("\\", "").Replace("\"", "")}\"")) + "}";
        await _rcon.ComandoAsync($"data modify storage jefes224:tablon set value {snbt}");
        await _rcon.ComandoAsync("execute at @e[type=marker,tag=j_spawn_c,limit=1] run function jefes224:spawn/tablon_poner with storage jefes224:tablon");
    }

    // Los carteles solo caben ~15 letras por renglón
    private static string Corto(string n) => n.Length > 15 ? n[..15] : n;
}
