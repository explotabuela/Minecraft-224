namespace Bot224;

// La liga del mes: puntos por todo lo que haces, menos puntos por morirte.
// Guarda los puntos de cada día (para la carrera de barras y las flechitas de subir/bajar),
// y al cerrar el mes saca al campeón.
public class Liga
{
    private const string Ruta = "liga.json";
    private readonly object _candado = new();
    private readonly Datos _d;

    public class Datos
    {
        // mes -> día del mes -> jugador -> puntos (como iba al final de ese día)
        public Dictionary<string, SortedDictionary<int, Dictionary<string, int>>> Puntos { get; set; } = new();
        public SortedDictionary<string, string> Campeones { get; set; } = new();      // mes -> campeón
        public Dictionary<string, List<Fila>> Finales { get; set; } = new();          // mes -> tabla final
        public string UltimoMes { get; set; } = "";
    }

    public class Fila
    {
        public string Nombre { get; set; } = "";
        public int Puntos { get; set; }
        public int Lugar { get; set; }
        public int Cambio { get; set; }     // + subió, - bajó (contra ayer)
        public int Proyeccion { get; set; } // con cuántos puntos terminaría el mes a este ritmo
        public Dictionary<string, int> Desglose { get; set; } = new();
        public List<Extra> Extras { get; set; } = new();
    }

    public class Extra
    {
        public string Razon { get; set; } = "";
        public int Puntos { get; set; }
    }

    // Cuánto vale cada cosa
    // Balance: cuesta más subir. Morirse duele de verdad y el netherrack no cuenta como bloque minado (lo resta el datapack).
    public const int PorHora = 6, BloquesPorPunto = 100, PorDiamante = 5, PorNetherita = 25, MobsPorPunto = 5, MetrosPorPunto = 500, PorDia = 5, PorMuerte = 20;

    public Liga()
    {
        _d = Archivo.Leer<Datos>(Ruta);
    }

    public static Dictionary<string, int> PuntosBase(Dictionary<string, int> s, int dias) => new()
    {
        ["horas"] = s.GetValueOrDefault("minutos") * PorHora / 60,
        ["minado"] = s.GetValueOrDefault("minado") / BloquesPorPunto,
        ["diamantes"] = s.GetValueOrDefault("diamantes") * PorDiamante,
        ["netherita"] = s.GetValueOrDefault("netherita") * PorNetherita,
        ["mobs"] = s.GetValueOrDefault("mobs") / MobsPorPunto,
        ["metros"] = s.GetValueOrDefault("metros") / MetrosPorPunto,
        ["dias"] = dias * PorDia,
        ["muertes"] = -s.GetValueOrDefault("muertes") * PorMuerte,
    };

    // Tabla del mes a partir de los datos del Wrapped de ese mes
    public List<Fila> Calcular(string mes, Wrapped.Mes datos, Dictionary<string, Wrapped.Primero> primeros, Dictionary<string, List<(string Razon, int Puntos)>> medallas)
    {
        var nombres = datos.Stats.Keys.Union(datos.Jugadores.Keys).ToList();
        var filas = new List<Fila>();
        foreach (var n in nombres)
        {
            var s = datos.Stats.GetValueOrDefault(n) ?? new();
            var w = datos.Jugadores.GetValueOrDefault(n) ?? new Wrapped.Jugador();
            var f = new Fila { Nombre = n, Desglose = PuntosBase(s, w.Dias.Count) };
            void Extra(string r, int p) => f.Extras.Add(new Extra { Razon = r, Puntos = p });
            if (w.Diamante != null) Extra("Su primer diamante", 20);
            if (w.Nether != null) Extra("Llegó al Nether", 20);
            if (w.End != null) Extra("Llegó al End", 30);
            foreach (var (clave, razon, pts) in new[] { ("diamante", "Primer diamante de la 224", 50), ("nether", "Primero en el Nether", 50), ("end", "Primero en el End", 75), ("dragon", "Mató al Ender Dragon", 150) })
                if (primeros.TryGetValue(clave, out var p) && p.Jugador == n && p.Fecha.StartsWith(mes)) Extra(razon, pts);
            foreach (var (razon, pts) in medallas.GetValueOrDefault(n) ?? new()) Extra(razon, pts);
            f.Puntos = Math.Max(0, f.Desglose.Values.Sum() + f.Extras.Sum(e => e.Puntos));
            filas.Add(f);
        }
        filas = filas.OrderByDescending(f => f.Puntos).ThenBy(f => f.Nombre).ToList();
        for (var i = 0; i < filas.Count; i++) filas[i].Lugar = i + 1;

        // Flechitas: contra cómo iban al final de ayer. Pronóstico: a este ritmo.
        var hoy = DateTime.Now;
        var esteMes = hoy.ToString("yyyy-MM") == mes;
        var dia = esteMes ? hoy.Day : DateTime.DaysInMonth(int.Parse(mes[..4]), int.Parse(mes[5..]));
        var diasMes = DateTime.DaysInMonth(int.Parse(mes[..4]), int.Parse(mes[5..]));
        lock (_candado)
        {
            if (_d.Puntos.TryGetValue(mes, out var porDia))
            {
                var ayer = porDia.Keys.Where(k => k < dia).DefaultIfEmpty(0).Max();
                if (ayer > 0)
                {
                    var antes = porDia[ayer].OrderByDescending(x => x.Value).ThenBy(x => x.Key).Select(x => x.Key).ToList();
                    foreach (var f in filas)
                    {
                        var lugarAntes = antes.IndexOf(f.Nombre) + 1;
                        f.Cambio = lugarAntes == 0 ? 0 : lugarAntes - f.Lugar;
                    }
                }
            }
        }
        foreach (var f in filas) f.Proyeccion = esteMes && dia >= 3 ? (int)Math.Round(f.Puntos / (double)dia * diasMes) : f.Puntos;
        return filas;
    }

    // Guarda cómo va hoy (se llama en cada actualización)
    public void Anotar(string mes, List<Fila> tabla)
    {
        lock (_candado)
        {
            if (!_d.Puntos.TryGetValue(mes, out var porDia)) _d.Puntos[mes] = porDia = new();
            porDia[DateTime.Now.ToString("yyyy-MM") == mes ? DateTime.Now.Day : 99] = tabla.ToDictionary(f => f.Nombre, f => f.Puntos);
            Archivo.Guardar(Ruta, _d);
        }
    }

    // Si ya cambió el mes, cierra el anterior y regresa (mes, tabla final) para anunciar al campeón
    public (string Mes, List<Fila> Tabla)? CerrarSiToca(string mesActual, Func<string, List<Fila>> tablaDe)
    {
        lock (_candado)
        {
            if (_d.UltimoMes == "") { _d.UltimoMes = mesActual; Archivo.Guardar(Ruta, _d); return null; }
            if (_d.UltimoMes == mesActual) return null;
            var anterior = _d.UltimoMes;
            _d.UltimoMes = mesActual;
            var tabla = tablaDe(anterior);
            _d.Finales[anterior] = tabla;
            if (tabla.Count > 0 && tabla[0].Puntos > 0) _d.Campeones[anterior] = tabla[0].Nombre;
            Archivo.Guardar(Ruta, _d);
            return tabla.Count > 0 && tabla[0].Puntos > 0 ? (anterior, tabla) : null;
        }
    }

    public SortedDictionary<string, string> Campeones() { lock (_candado) return new(_d.Campeones); }
    public Dictionary<string, List<Fila>> Finales() { lock (_candado) return new(_d.Finales); }

    // Para la carrera de barras: cómo iba cada día del mes
    public Dictionary<string, SortedDictionary<int, Dictionary<string, int>>> Carrera()
    {
        lock (_candado) return _d.Puntos.ToDictionary(x => x.Key, x => new SortedDictionary<int, Dictionary<string, int>>(x.Value.ToDictionary(y => y.Key, y => new Dictionary<string, int>(y.Value))));
    }

    public static string NombreMes(string mes)
    {
        string[] n = { "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };
        return $"{n[int.Parse(mes[5..]) - 1]} {mes[..4]}";
    }

    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            foreach (var mes in _d.Puntos.Values)
                foreach (var dia in mes.Values)
                    if (dia.Remove(viejo, out var p)) dia[nuevo] = dia.GetValueOrDefault(nuevo) + p;
            foreach (var k in _d.Campeones.Where(x => x.Value == viejo).Select(x => x.Key).ToList()) _d.Campeones[k] = nuevo;
            foreach (var t in _d.Finales.Values) foreach (var f in t.Where(f => f.Nombre == viejo)) f.Nombre = nuevo;
            Archivo.Guardar(Ruta, _d);
        }
    }
}
