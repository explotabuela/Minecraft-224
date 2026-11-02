using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// Lee las stats de los jugadores desde el scoreboard del datapack (por RCON).
// Si alguien tiene varios nombres (Java y Bedrock), se suman en uno.
public class Stats
{
    private readonly Config _config;
    private readonly Rcon _rcon;
    private readonly Alias _alias;

    public static readonly string[] Objetivos = { "muertes", "horas", "minutos", "minado", "metros", "kills", "record_min", "diamantes", "netherita" };
    private static readonly Regex RegexValor = new(@"has (-?\d+)");
    private static readonly Regex RegexLista = new(@"tracked entit[^:]*: (.+)$");

    // Últimas stats que se leyeron bien. Si el server está apagado, se usan estas
    // para que /stats, /carta, /top y la página sigan funcionando.
    private const string RutaCache = "stats_cache.json";
    private readonly Dictionary<string, De> _cache;
    private readonly object _candado = new();

    // true cuando la última lectura salió de lo guardado (server apagado o sin RCON)
    public string PrincipalDe(string nombre) => _alias.Principal(nombre);

    public bool Apagado { get; private set; }

    public Stats(Config config, Rcon rcon, Alias alias)
    {
        _config = config;
        _rcon = rcon;
        _alias = alias;
        _cache = new Dictionary<string, De>(Archivo.Leer<Dictionary<string, De>>(RutaCache), StringComparer.OrdinalIgnoreCase);
    }

    private void Recordar(IEnumerable<De> lista)
    {
        lock (_candado)
        {
            foreach (var d in lista) _cache[d.Nombre] = d;
            try { Archivo.Guardar(RutaCache, _cache); } catch { }
        }
    }

    private void AvisarApagado(Exception ex)
    {
        if (!Apagado) Console.WriteLine($"[Stats] No pude leer el server ({ex.Message}). Uso las últimas stats guardadas.");
        Apagado = true;
    }

    public class De
    {
        public string Nombre { get; set; } = "";
        public int Muertes { get; set; }
        public int Minutos { get; set; }      // tiempo jugado total, en minutos
        public int Minado { get; set; }
        public int Metros { get; set; }
        public int Mobs { get; set; }
        public int Record { get; set; }       // récord sin morir, en minutos
        public int Diamantes { get; set; }
        public int Netherita { get; set; }    // ancient debris minado

        public void Sumar(De o)
        {
            Muertes += o.Muertes; Minutos += o.Minutos; Minado += o.Minado; Metros += o.Metros;
            Mobs += o.Mobs; Diamantes += o.Diamantes; Netherita += o.Netherita; Record = Math.Max(Record, o.Record);
        }

        public Dictionary<string, int> ComoDiccionario() => new()
        {
            ["muertes"] = Muertes, ["minutos"] = Minutos, ["minado"] = Minado, ["metros"] = Metros,
            ["mobs"] = Mobs, ["diamantes"] = Diamantes, ["netherita"] = Netherita, ["record"] = Record,
        };
    }

    // Jugadores vistos por RCON (para cuando el bot no puede leer usercache.json, como en GitHub)
    private const string RutaConocidos = "jugadores_conocidos.json";
    private static readonly Regex RegexUuid = new(@"(\.?[A-Za-z0-9_]{2,16}) \(([0-9a-fA-F-]{32,36})\)");

    public async Task RegistrarConectadosAsync()
    {
        var r = await _rcon.ComandoAsync("list uuids");
        var conocidos = Archivo.Leer<Dictionary<string, string>>(RutaConocidos);
        var cambio = false;
        foreach (Match m in RegexUuid.Matches(r))
            if (conocidos.GetValueOrDefault(m.Groups[1].Value) != m.Groups[2].Value) { conocidos[m.Groups[1].Value] = m.Groups[2].Value; cambio = true; }
        if (cambio) Archivo.Guardar(RutaConocidos, conocidos);
    }

    // Nombre y UUID de todos los que han entrado: de usercache.json si se puede leer, si no de lo visto por RCON
    private List<(string Nombre, string Id)> Entradas()
    {
        var lista = new List<(string, string)>();
        try
        {
            if (File.Exists(_config.RutaUsercache))
            {
                using var doc = JsonDocument.Parse(File.ReadAllText(_config.RutaUsercache));
                foreach (var e in doc.RootElement.EnumerateArray())
                    if (e.TryGetProperty("name", out var n) && n.GetString() is { } nombre && e.TryGetProperty("uuid", out var u) && u.GetString() is { } id)
                        lista.Add((nombre, id));
                return lista;
            }
        }
        catch { }
        foreach (var kv in Archivo.Leer<Dictionary<string, string>>(RutaConocidos)) lista.Add((kv.Key, kv.Value));
        return lista;
    }

    // Todos los que han entrado alguna vez. Llave = nombre en minúsculas.
    public Dictionary<string, string> Reales()
    {
        var dic = new Dictionary<string, string>();
        foreach (var (nombre, _) in Entradas()) dic[nombre.ToLower()] = nombre;
        return dic;
    }

    // UUID de cada jugador de Java (para que la página pida la skin correcta). Llave = nombre en minúsculas.
    public Dictionary<string, string> Uuids(bool conBedrock = false)
    {
        var dic = new Dictionary<string, string>();
        foreach (var (nombre, id) in Entradas())
            if (conBedrock || (!nombre.StartsWith('.') && !id.StartsWith("00000000-0000-0000-")))
                dic[nombre.ToLower()] = id.Replace("-", "");
        return dic;
    }

    // Muertes guardadas de cada nombre (para ver quién murió entre una corrida y otra)
    public Dictionary<string, int> MuertesGuardadas()
    {
        lock (_candado) return _cache.ToDictionary(x => x.Key, x => x.Value.Muertes, StringComparer.OrdinalIgnoreCase);
    }

    // Regresa el nombre principal bien escrito, o null si nunca ha entrado
    public string? NombreReal(string nombre)
    {
        var real = Reales().GetValueOrDefault(nombre.Trim().ToLower());
        if (real != null) return _alias.Principal(real);
        // Puede que escribieron el principal de un alias
        var principal = _alias.Principal(nombre.Trim());
        return Reales().ContainsKey(principal.ToLower()) || _alias.NombresDe(principal).Count > 1 ? principal : null;
    }

    // Stats de una persona (suma todos sus nombres)
    public async Task<De> LeerAsync(string principal)
    {
        var nombres = _alias.NombresDe(principal);
        var lista = await LeerCrudoAsync(nombres);
        var total = new De { Nombre = principal };
        foreach (var s in lista) total.Sumar(s);
        return total;
    }

    public async Task<List<De>> LeerVariosAsync(IList<string> principales)
    {
        var res = new List<De>();
        foreach (var p in principales) res.Add(await LeerAsync(p));
        return res;
    }

    private async Task<List<De>> LeerCrudoAsync(IList<string> nombres)
    {
        var comandos = nombres.SelectMany(n => Objetivos.Select(o => $"scoreboard players get {n} {o}")).ToList();
        List<string> resp;
        try
        {
            resp = comandos.Count > 0 ? await _rcon.VariosAsync(comandos) : new List<string>();
        }
        catch (Exception ex)
        {
            lock (_candado)
                if (_cache.Count == 0) throw;
            AvisarApagado(ex);
            lock (_candado)
                return nombres.Select(n => _cache.TryGetValue(n, out var c) ? Copiar(c) : new De { Nombre = n }).ToList();
        }
        var lista = new List<De>();
        for (var i = 0; i < nombres.Count; i++)
        {
            int V(int k)
            {
                var m = RegexValor.Match(resp[i * Objetivos.Length + k]);
                return m.Success ? int.Parse(m.Groups[1].Value) : 0;
            }
            lista.Add(new De
            {
                Nombre = nombres[i], Muertes = V(0), Minutos = V(1) * 60 + V(2), Minado = V(3),
                Metros = V(4), Mobs = V(5), Record = V(6), Diamantes = V(7), Netherita = V(8),
            });
        }
        Recordar(lista);
        Apagado = false;
        return lista;
    }

    private static De Copiar(De c) => new()
    {
        Nombre = c.Nombre, Muertes = c.Muertes, Minutos = c.Minutos, Minado = c.Minado, Metros = c.Metros,
        Mobs = c.Mobs, Record = c.Record, Diamantes = c.Diamantes, Netherita = c.Netherita,
    };

    // Stats de todos los jugadores reales, ya juntando sus nombres
    public async Task<List<De>> TodosAsync()
    {
        // Sin usercache.json (bot en GitHub) no se filtra: cualquiera con stats en el scoreboard cuenta
        var reales = File.Exists(_config.RutaUsercache) ? Reales() : new Dictionary<string, string>();
        List<string> nombres;
        try
        {
            var lista = (await _rcon.VariosAsync(new[] { "scoreboard players list" }))[0];
            var m = RegexLista.Match(lista);
            if (!m.Success) return new List<De>();
            nombres = m.Groups[1].Value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Where(n => Alias.RegexNombre.IsMatch(n) && (reales.Count == 0 || reales.ContainsKey(n.ToLower())))
                .ToList();
        }
        catch (Exception ex)
        {
            lock (_candado)
            {
                if (_cache.Count == 0) throw;
                nombres = _cache.Keys.Where(n => reales.Count == 0 || reales.ContainsKey(n.ToLower())).ToList();
            }
            AvisarApagado(ex);
        }
        var crudo = await LeerCrudoAsync(nombres);
        var juntos = new Dictionary<string, De>(StringComparer.OrdinalIgnoreCase);
        foreach (var s in crudo)
        {
            var p = _alias.Principal(s.Nombre);
            if (!juntos.TryGetValue(p, out var t)) juntos[p] = t = new De { Nombre = p };
            t.Sumar(s);
        }
        return juntos.Values.ToList();
    }

    public static string Tiempo(int minutos) =>
        minutos < 60 ? $"{minutos}m" : $"{minutos / 60}h {minutos % 60:00}m";

    public static string Num(int n) => n.ToString("N0", System.Globalization.CultureInfo.GetCultureInfo("es-MX"));
}
