namespace Bot224;

// Foto diaria de los totales de cada jugador. Sirve para las gráficas,
// el ranking de la semana, la carrera de barras y comparar meses.
public class Historial
{
    private const string Ruta = "historial.json";
    private readonly object _candado = new();
    // "2026-12-05" -> jugador -> stat -> valor (totales acumulados de ese día)
    private readonly SortedDictionary<string, Dictionary<string, Dictionary<string, int>>> _dias;

    public Historial()
    {
        _dias = Archivo.Leer<SortedDictionary<string, Dictionary<string, Dictionary<string, int>>>>(Ruta);
    }

    public void Anotar(Dictionary<string, Dictionary<string, int>> totales)
    {
        lock (_candado)
        {
            _dias[DateTime.Now.ToString("yyyy-MM-dd")] = totales.ToDictionary(x => x.Key, x => new Dictionary<string, int>(x.Value));
            Archivo.Guardar(Ruta, _dias);
        }
    }

    // Totales de hace N días (o el día guardado más cercano antes de esa fecha)
    public Dictionary<string, Dictionary<string, int>>? Hace(int dias)
    {
        lock (_candado)
        {
            var limite = DateTime.Now.AddDays(-dias).ToString("yyyy-MM-dd");
            var dia = _dias.Keys.LastOrDefault(k => string.CompareOrdinal(k, limite) <= 0);
            return dia == null ? null : _dias[dia];
        }
    }

    // Pasa un jugador renombrado/unido al nombre principal en todo el historial
    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            foreach (var dia in _dias.Values)
            {
                if (!dia.Remove(viejo, out var s)) continue;
                if (dia.TryGetValue(nuevo, out var t))
                    foreach (var (k, v) in s) t[k] = k == "record" ? Math.Max(t.GetValueOrDefault(k), v) : t.GetValueOrDefault(k) + v;
                else dia[nuevo] = s;
            }
            Archivo.Guardar(Ruta, _dias);
        }
    }

    public SortedDictionary<string, Dictionary<string, Dictionary<string, int>>> Copia()
    {
        lock (_candado) return new(_dias.ToDictionary(x => x.Key, x => x.Value.ToDictionary(y => y.Key, y => new Dictionary<string, int>(y.Value))));
    }
}
