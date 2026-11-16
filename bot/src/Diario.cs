namespace Bot224;

// Diario de cada jugador (una línea con fecha por cada cosa que hace) y bitácora de la temporada
// (jefes, Nether, campeones, días del caos). Se ve con /diario y en la página de fin de temporada.
public class Diario
{
    public static Diario? Instancia;
    private const string Ruta = "diario.json";
    private const int MuertesPorDia = 3;
    private readonly object _candado = new();
    private readonly Datos _d;

    public class Linea
    {
        public string Fecha { get; set; } = "";
        public string Tipo { get; set; } = "";
        public string Texto { get; set; } = "";
    }

    public class Datos
    {
        public Dictionary<string, List<Linea>> Jugadores { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public List<Linea> Temporada { get; set; } = new();
    }

    public Diario()
    {
        _d = Archivo.Leer<Datos>(Ruta);
        _d.Jugadores = new Dictionary<string, List<Linea>>(_d.Jugadores, StringComparer.OrdinalIgnoreCase);
        Instancia = this;
    }

    private static string Hoy => DateTime.Now.ToString("yyyy-MM-dd HH:mm");

    public bool Tiene(string jugador)
    {
        lock (_candado) return _d.Jugadores.TryGetValue(jugador, out var l) && l.Count > 0;
    }

    public void Jugador(string jugador, string tipo, string texto)
    {
        lock (_candado)
        {
            if (!_d.Jugadores.TryGetValue(jugador, out var lista)) _d.Jugadores[jugador] = lista = new();
            var dia = DateTime.Now.ToString("yyyy-MM-dd");
            var delDia = lista.Where(l => l.Fecha.StartsWith(dia)).ToList();
            if (tipo == "muerte" && delDia.Count(l => l.Tipo == "muerte") >= MuertesPorDia) return;
            if (delDia.Any(l => l.Texto == texto)) return;
            lista.Add(new Linea { Fecha = Hoy, Tipo = tipo, Texto = texto });
            Archivo.Guardar(Ruta, _d);
        }
    }

    public void Temporada(string tipo, string texto)
    {
        lock (_candado)
        {
            var dia = DateTime.Now.ToString("yyyy-MM-dd");
            if (_d.Temporada.Any(l => l.Fecha.StartsWith(dia) && l.Texto == texto)) return;
            _d.Temporada.Add(new Linea { Fecha = Hoy, Tipo = tipo, Texto = texto });
            Archivo.Guardar(Ruta, _d);
        }
    }

    public List<Linea> De(string jugador)
    {
        lock (_candado) return _d.Jugadores.TryGetValue(jugador, out var l) ? l.ToList() : new();
    }

    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            if (!_d.Jugadores.Remove(viejo, out var l)) return;
            if (_d.Jugadores.TryGetValue(nuevo, out var t)) { t.AddRange(l); t.Sort((a, b) => string.CompareOrdinal(a.Fecha, b.Fecha)); }
            else _d.Jugadores[nuevo] = l;
            Archivo.Guardar(Ruta, _d);
        }
    }

    public Datos Copia()
    {
        lock (_candado) return new Datos
        {
            Jugadores = _d.Jugadores.ToDictionary(x => x.Key, x => x.Value.ToList()),
            Temporada = _d.Temporada.ToList(),
        };
    }
}
