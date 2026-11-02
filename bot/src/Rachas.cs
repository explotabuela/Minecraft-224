namespace Bot224;

// Racha de días seguidos que cada jugador entra al server
public class Rachas
{
    private const string Ruta = "rachas.json";
    private readonly object _candado = new();
    private readonly Dictionary<string, Datos> _datos;

    public class Datos
    {
        public string UltimoDia { get; set; } = "";
        public int Racha { get; set; }
        public int Mejor { get; set; }
    }

    public Rachas()
    {
        _datos = Archivo.Leer<Dictionary<string, Datos>>(Ruta);
    }

    // Se llama cada que alguien entra. Regresa la racha nueva si subió hoy, o null si ya había entrado hoy.
    public int? Registrar(string jugador, DateTime ahora)
    {
        lock (_candado)
        {
            var hoy = ahora.ToString("yyyy-MM-dd");
            var ayer = ahora.AddDays(-1).ToString("yyyy-MM-dd");
            if (!_datos.TryGetValue(jugador, out var d)) _datos[jugador] = d = new Datos();

            if (d.UltimoDia == hoy) return null;          // ya contó hoy
            d.Racha = d.UltimoDia == ayer ? d.Racha + 1 : 1; // siguió o se rompió
            d.UltimoDia = hoy;
            d.Mejor = Math.Max(d.Mejor, d.Racha);
            Archivo.Guardar(Ruta, _datos);
            return d.Racha;
        }
    }

    // La racha cuenta solo si entró hoy o ayer; si no, ya se rompió
    public Datos? De(string jugador)
    {
        lock (_candado)
        {
            if (!_datos.TryGetValue(jugador, out var d)) return null;
            var vigente = d.UltimoDia == DateTime.Now.ToString("yyyy-MM-dd") || d.UltimoDia == DateTime.Now.AddDays(-1).ToString("yyyy-MM-dd");
            return new Datos { UltimoDia = d.UltimoDia, Racha = vigente ? d.Racha : 0, Mejor = d.Mejor };
        }
    }

    public Dictionary<string, Datos> Todos() { lock (_candado) return _datos.ToDictionary(x => x.Key, x => new Datos { UltimoDia = x.Value.UltimoDia, Racha = x.Value.Racha, Mejor = x.Value.Mejor }); }

    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            if (!_datos.Remove(viejo, out var v)) return;
            if (!_datos.TryGetValue(nuevo, out var n)) _datos[nuevo] = v;
            else
            {
                n.Mejor = Math.Max(n.Mejor, v.Mejor);
                if (string.CompareOrdinal(v.UltimoDia, n.UltimoDia) > 0) { n.UltimoDia = v.UltimoDia; n.Racha = Math.Max(n.Racha, v.Racha); }
            }
            Archivo.Guardar(Ruta, _datos);
        }
    }
}
