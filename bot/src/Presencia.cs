namespace Bot224;

// Quién está jugando ahorita y desde cuándo, quién fue el último,
// y las últimas muertes (para la página y los mini juegos).
public class Presencia
{
    private const string Ruta = "presencia.json";
    private readonly object _candado = new();
    private readonly Datos _d;

    public class Muerte
    {
        public string Jugador { get; set; } = "";
        public string Causa { get; set; } = "";
        public string Fecha { get; set; } = "";
    }

    public class Datos
    {
        public Dictionary<string, string> EnLinea { get; set; } = new();  // jugador -> desde (fecha ISO)
        public string? UltimoJugador { get; set; }
        public string? UltimaSalida { get; set; }
        public int RecordConectados { get; set; }
        public string? FechaRecord { get; set; }
        public List<string> QuienesRecord { get; set; } = new();
        public Dictionary<string, double> MinutosAcompanado { get; set; } = new(); // jugando con alguien más conectado
        public string? UltimoTick { get; set; }
        public List<Muerte> Muertes { get; set; } = new();                  // las más nuevas primero
    }

    public event Action? Cambio;

    public Presencia()
    {
        _d = Archivo.Leer<Datos>(Ruta);
    }

    private static string Ahora() => DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss");
    private void Guardar() => Archivo.Guardar(Ruta, _d);

    public void Entro(string jugador)
    {
        lock (_candado)
        {
            if (!_d.EnLinea.ContainsKey(jugador)) _d.EnLinea[jugador] = Ahora();
            if (_d.EnLinea.Count > _d.RecordConectados) { _d.RecordConectados = _d.EnLinea.Count; _d.FechaRecord = Ahora(); _d.QuienesRecord = _d.EnLinea.Keys.ToList(); }
            Guardar();
        }
        Cambio?.Invoke();
    }

    public void Salio(string jugador)
    {
        lock (_candado)
        {
            _d.EnLinea.Remove(jugador);
            _d.UltimoJugador = jugador;
            _d.UltimaSalida = Ahora();
            Guardar();
        }
        Cambio?.Invoke();
    }

    // El server se reinició: nadie sigue conectado
    public void Reinicio()
    {
        lock (_candado)
        {
            if (_d.EnLinea.Count == 0) return;
            var ultimo = _d.EnLinea.Keys.Last();
            _d.EnLinea.Clear();
            _d.UltimoJugador = ultimo;
            _d.UltimaSalida = Ahora();
            Guardar();
        }
        Cambio?.Invoke();
    }

    // Al prender el bot: los que dice el server que están conectados
    public void Sincronizar(IEnumerable<string> conectados)
    {
        lock (_candado)
        {
            var set = conectados.ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var k in _d.EnLinea.Keys.Where(k => !set.Contains(k)).ToList()) _d.EnLinea.Remove(k);
            foreach (var j in set) if (!_d.EnLinea.ContainsKey(j)) _d.EnLinea[j] = Ahora();
            Guardar();
        }
    }

    public void Murio(string jugador, string causa)
    {
        lock (_candado)
        {
            _d.Muertes.Insert(0, new Muerte { Jugador = jugador, Causa = causa, Fecha = Ahora() });
            if (_d.Muertes.Count > 150) _d.Muertes.RemoveRange(150, _d.Muertes.Count - 150);
            Guardar();
        }
    }

    public List<string> EnLineaNombres() { lock (_candado) return _d.EnLinea.Keys.ToList(); }

    public int Conectados { get { lock (_candado) return _d.EnLinea.Count; } }

    // Se llama seguido: suma el tiempo que cada quien jugó con alguien más conectado
    public void Tick()
    {
        lock (_candado)
        {
            var ahora = DateTime.Now;
            var antes = DateTime.TryParse(_d.UltimoTick, out var t) ? t : ahora;
            var min = (ahora - antes).TotalMinutes;
            _d.UltimoTick = ahora.ToString("s");
            if (min <= 0 || min > 35 || _d.EnLinea.Count < 2) return; // si el bot estuvo apagado no se cuenta
            foreach (var j in _d.EnLinea.Keys) _d.MinutosAcompanado[j] = _d.MinutosAcompanado.GetValueOrDefault(j) + min;
            Guardar();
        }
    }

    public int HorasAcompanado(string jugador) { lock (_candado) return (int)(_d.MinutosAcompanado.GetValueOrDefault(jugador) / 60); }

    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            if (_d.MinutosAcompanado.Remove(viejo, out var m)) _d.MinutosAcompanado[nuevo] = _d.MinutosAcompanado.GetValueOrDefault(nuevo) + m;
            Guardar();
        }
    }

    public object Copia()
    {
        lock (_candado)
        {
            return new
            {
                enLinea = _d.EnLinea.Select(x => new { nombre = x.Key, desde = x.Value }).ToList(),
                ultimo = _d.UltimoJugador == null ? null : new { nombre = _d.UltimoJugador, fecha = _d.UltimaSalida },
                record = new { conectados = _d.RecordConectados, fecha = _d.FechaRecord, quienes = _d.QuienesRecord },
                muertes = _d.Muertes.Take(60).Select(m => new { jugador = m.Jugador, causa = m.Causa, fecha = m.Fecha }).ToList(),
            };
        }
    }
}
