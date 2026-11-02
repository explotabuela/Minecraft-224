using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// Junta datos para el Wrapped de cada MES:
// stats del mes, qué mató a cada quien, diamantes, Nether/End, mensajes, días que jugó...
public class Wrapped
{
    private const string Ruta = "wrapped.json";
    private readonly object _candado = new();
    public Datos Todo { get; }

    public class Jugador
    {
        public Dictionary<string, int> Muertes { get; set; } = new(); // causa -> veces
        public int Mensajes { get; set; }
        public int Entradas { get; set; }
        public List<int> Dias { get; set; } = new();  // días del mes que entró
        public string? Diamante { get; set; }          // fecha de su primer diamante (si fue este mes)
        public string? Nether { get; set; }
        public string? End { get; set; }
    }

    public class Mes
    {
        public Dictionary<string, Jugador> Jugadores { get; set; } = new();
        public Dictionary<string, Dictionary<string, int>> Base { get; set; } = new();  // totales al empezar el mes
        public Dictionary<string, Dictionary<string, int>> Stats { get; set; } = new(); // lo que hizo cada quien en el mes
    }

    public class Primero
    {
        public string Jugador { get; set; } = "";
        public string Fecha { get; set; } = "";
    }

    public class Datos
    {
        public Dictionary<string, Mes> Meses { get; set; } = new();          // "2026-12" -> mes
        public Dictionary<string, Primero> Primeros { get; set; } = new();   // diamante, nether, end, dragon (de toda la temporada)
        public Dictionary<string, Dictionary<string, string>> Logros { get; set; } = new(); // jugador -> logro -> fecha (para no repetir)
    }

    public Wrapped()
    {
        try
        {
            Todo = File.Exists(Ruta) ? JsonSerializer.Deserialize<Datos>(File.ReadAllText(Ruta)) ?? new() : new();
        }
        catch { Todo = new(); }
    }

    // Copia segura para mandar a la página (por si el log está escribiendo al mismo tiempo)
    public JsonElement Copia() { lock (_candado) return JsonSerializer.SerializeToElement(Todo); }

    // Copia de un mes (para la liga), sin riesgo de que cambie mientras se usa
    public Mes CopiaMes(string mes)
    {
        lock (_candado)
            return Todo.Meses.TryGetValue(mes, out var m) ? JsonSerializer.Deserialize<Mes>(JsonSerializer.Serialize(m))! : new Mes();
    }

    public Dictionary<string, Primero> CopiaPrimeros() { lock (_candado) return new(Todo.Primeros); }
    public List<string> MesesConDatos() { lock (_candado) return Todo.Meses.Keys.OrderBy(k => k).ToList(); }

    // Logros personales con fecha: jugador -> (diamante, nether, end, dragon) -> fecha
    public Dictionary<string, Dictionary<string, string>> CopiaLogros()
    {
        lock (_candado) return Todo.Logros.ToDictionary(x => x.Key, x => new Dictionary<string, string>(x.Value));
    }

    // Totales de toda la temporada sacados de los meses
    public int MensajesTotales(string jugador) { lock (_candado) return Todo.Meses.Values.Sum(m => m.Jugadores.GetValueOrDefault(jugador)?.Mensajes ?? 0); }
    public int DiasJugados(string jugador) { lock (_candado) return Todo.Meses.Values.Sum(m => m.Jugadores.GetValueOrDefault(jugador)?.Dias.Count ?? 0); }
    public string? PrimerDia(string jugador)
    {
        lock (_candado)
        {
            foreach (var (mes, m) in Todo.Meses.OrderBy(x => x.Key))
                if (m.Jugadores.TryGetValue(jugador, out var j) && j.Dias.Count > 0) return $"{mes}-{j.Dias.Min():00}";
            return null;
        }
    }

    // Une a un jugador con otro nombre (Java + Bedrock) en todos los meses
    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            foreach (var m in Todo.Meses.Values)
            {
                if (m.Jugadores.Remove(viejo, out var j))
                {
                    if (!m.Jugadores.TryGetValue(nuevo, out var t)) m.Jugadores[nuevo] = j;
                    else
                    {
                        foreach (var (c, v) in j.Muertes) t.Muertes[c] = t.Muertes.GetValueOrDefault(c) + v;
                        t.Mensajes += j.Mensajes; t.Entradas += j.Entradas;
                        t.Dias = t.Dias.Union(j.Dias).OrderBy(x => x).ToList();
                        t.Diamante ??= j.Diamante; t.Nether ??= j.Nether; t.End ??= j.End;
                    }
                }
                foreach (var dic in new[] { m.Base, m.Stats })
                    if (dic.Remove(viejo, out var s))
                    {
                        if (!dic.TryGetValue(nuevo, out var t)) dic[nuevo] = s;
                        else foreach (var (k, v) in s) t[k] = t.GetValueOrDefault(k) + v;
                    }
            }
            if (Todo.Logros.Remove(viejo, out var lg))
            {
                if (!Todo.Logros.TryGetValue(nuevo, out var t)) Todo.Logros[nuevo] = lg;
                else foreach (var (k, v) in lg) if (!t.ContainsKey(k) || string.CompareOrdinal(v, t[k]) < 0) t[k] = v;
            }
            foreach (var p in Todo.Primeros.Values.Where(p => p.Jugador == viejo)) p.Jugador = nuevo;
            Guardar();
        }
    }

    private static string MesActual() => DateTime.Now.ToString("yyyy-MM");
    private static string Hoy() => DateTime.Now.ToString("yyyy-MM-dd");

    private Mes EsteMes()
    {
        var m = MesActual();
        if (!Todo.Meses.TryGetValue(m, out var mes)) Todo.Meses[m] = mes = new Mes();
        return mes;
    }

    private Jugador De(string nombre)
    {
        var mes = EsteMes();
        if (!mes.Jugadores.TryGetValue(nombre, out var j)) mes.Jugadores[nombre] = j = new Jugador();
        return j;
    }

    private void Guardar() =>
        File.WriteAllText(Ruta, JsonSerializer.Serialize(Todo, new JsonSerializerOptions { WriteIndented = true }));

    public void Entro(string jugador)
    {
        lock (_candado)
        {
            var j = De(jugador);
            j.Entradas++;
            if (!j.Dias.Contains(DateTime.Now.Day)) j.Dias.Add(DateTime.Now.Day);
            Guardar();
        }
    }

    public void Mensaje(string jugador) { lock (_candado) { De(jugador).Mensajes++; Guardar(); } }

    // Logros de Minecraft (en el log salen en inglés)
    public void Logro(string jugador, string logro)
    {
        string? clave = logro switch
        {
            "Diamonds!" => "diamante",
            "We Need to Go Deeper" => "nether",
            "The End?" => "end",
            "Free the End" => "dragon",
            _ => null,
        };
        if (clave == null) return;
        lock (_candado)
        {
            if (!Todo.Logros.TryGetValue(jugador, out var suyos)) Todo.Logros[jugador] = suyos = new();
            if (suyos.ContainsKey(clave)) return; // ya lo tenía de otro mes
            suyos[clave] = Hoy();
            var j = De(jugador);
            if (clave == "diamante") j.Diamante = Hoy();
            if (clave == "nether") j.Nether = Hoy();
            if (clave == "end") j.End = Hoy();
            if (!Todo.Primeros.ContainsKey(clave))
                Todo.Primeros[clave] = new Primero { Jugador = jugador, Fecha = Hoy() };
            Guardar();
        }
    }

    // Recibe el mensaje de muerte, ej. "explotabuela was slain by Zombie por tonto"
    public void Muerte(string jugador, string mensaje, ICollection<string> jugadores, string? nombreEnMensaje = null)
    {
        var causa = Causa(nombreEnMensaje ?? jugador, mensaje, jugadores);
        lock (_candado)
        {
            var j = De(jugador);
            j.Muertes[causa] = j.Muertes.GetValueOrDefault(causa) + 1;
            Guardar();
        }
    }

    // La página manda los totales de cada quien; aquí se saca cuánto lleva en el mes
    public void ActualizarMes(Dictionary<string, Dictionary<string, int>> totales)
    {
        lock (_candado)
        {
            var mes = EsteMes();
            foreach (var (nombre, t) in totales)
            {
                // Si es la primera vez que lo vemos este mes, lo de antes no cuenta
                if (!mes.Base.TryGetValue(nombre, out var b))
                {
                    // Viene del mes pasado: su base es lo que tenía al cerrar ese mes
                    var anterior = Todo.Meses.Where(x => string.CompareOrdinal(x.Key, MesActual()) < 0)
                        .OrderByDescending(x => x.Key).FirstOrDefault().Value;
                    if (anterior != null && anterior.Base.TryGetValue(nombre, out var bAnt) && anterior.Stats.TryGetValue(nombre, out var sAnt))
                        b = bAnt.ToDictionary(k => k.Key, k => k.Value + sAnt.GetValueOrDefault(k.Key));
                    else
                        b = new Dictionary<string, int>(t);
                    mes.Base[nombre] = b;
                }
                mes.Stats[nombre] = t.ToDictionary(k => k.Key, k => Math.Max(0, k.Value - b.GetValueOrDefault(k.Key)));
            }
            Guardar();
        }
    }

    private static readonly Regex RegexPor = new(@" by (.+?)(?: using .+| whilst .+| while .+)?$");

    private static readonly Dictionary<string, string> Mobs = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Zombie"] = "Zombi", ["Creeper"] = "Creeper", ["Skeleton"] = "Esqueleto", ["Spider"] = "Araña",
        ["Cave Spider"] = "Araña de cueva", ["Enderman"] = "Enderman", ["Drowned"] = "Ahogado (zombi)",
        ["Witch"] = "Bruja", ["Blaze"] = "Blaze", ["Piglin"] = "Piglin", ["Piglin Brute"] = "Piglin bruto",
        ["Zombified Piglin"] = "Piglin zombificado", ["Hoglin"] = "Hoglin", ["Warden"] = "Warden",
        ["Slime"] = "Slime", ["Magma Cube"] = "Cubo de magma", ["Phantom"] = "Phantom", ["Pillager"] = "Saqueador",
        ["Vindicator"] = "Vindicador", ["Evoker"] = "Invocador", ["Ravager"] = "Devastador", ["Husk"] = "Zombi momificado",
        ["Stray"] = "Esqueleto glacial", ["Bogged"] = "Esqueleto pantanoso", ["Guardian"] = "Guardián",
        ["Elder Guardian"] = "Guardián anciano", ["Ghast"] = "Ghast", ["Wither"] = "Wither",
        ["Wither Skeleton"] = "Esqueleto del Wither", ["Ender Dragon"] = "Ender Dragon", ["Silverfish"] = "Lepisma",
        ["Bee"] = "Abeja", ["Wolf"] = "Lobo", ["Iron Golem"] = "Gólem de hierro", ["Polar Bear"] = "Oso polar",
        ["Llama"] = "Llama", ["Goat"] = "Cabra", ["Shulker"] = "Shulker", ["Vex"] = "Vex", ["Breeze"] = "Breeze",
        ["Creaking"] = "Crujidor", ["Zombie Villager"] = "Aldeano zombi", ["Pufferfish"] = "Pez globo",
        ["magic"] = "Magia", ["Arrow"] = "Flecha", ["Fireball"] = "Bola de fuego", ["TNT"] = "TNT",
    };

    public static string Causa(string jugador, string mensaje, ICollection<string> jugadores)
    {
        var t = mensaje.Replace(" por tonto", "").Trim();
        if (t.StartsWith(jugador)) t = t[jugador.Length..].Trim();

        var por = RegexPor.Match(t);
        if (por.Success)
        {
            var quien = por.Groups[1].Value.Trim();
            if (jugadores.Any(j => j.Equals(quien, StringComparison.OrdinalIgnoreCase))) return "⚔️ " + quien; // otro jugador
            if (t.Contains("fell") || t.Contains("doomed to fall")) return "Caída";
            return Mobs.GetValueOrDefault(quien, quien);
        }

        if (t.Contains("fell") || t.Contains("hit the ground")) return "Caída";
        if (t.Contains("lava")) return "Lava";
        if (t.Contains("drowned")) return "Se ahogó";
        if (t.Contains("burn") || t.Contains("flames") || t.Contains("fire")) return "Fuego";
        if (t.Contains("starved")) return "Hambre";
        if (t.Contains("suffocated") || t.Contains("squished")) return "Asfixia";
        if (t.Contains("blew up") || t.Contains("blown up")) return "Explosión";
        if (t.Contains("froze")) return "Congelado";
        if (t.Contains("out of the world") || t.Contains("didn't want to live")) return "El vacío";
        if (t.Contains("cactus") || t.Contains("pricked")) return "Cactus";
        if (t.Contains("berry") || t.Contains("poked")) return "Arbusto de bayas";
        if (t.Contains("lightning")) return "Rayo";
        if (t.Contains("withered")) return "Wither";
        if (t.Contains("anvil")) return "Yunque";
        if (t.Contains("kinetic")) return "Elytra";
        if (t.Contains("magic")) return "Magia";
        if (t.Contains("stalagmite") || t.Contains("stalactite")) return "Estalactita";
        return "Otra cosa";
    }
}
