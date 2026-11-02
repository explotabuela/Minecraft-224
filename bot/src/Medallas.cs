namespace Bot224;

// Medallas: bronce, plata, oro y diamante por categoría, más medallas especiales.
// Se guardan con la fecha en que se ganaron y se anuncian en Discord.
public class Medallas
{
    private const string Ruta = "medallas.json";
    private readonly object _candado = new();
    private readonly Dictionary<string, Dictionary<string, Ganada>> _d; // jugador -> medalla -> nivel y fechas
    private bool _silencio;

    public static readonly string[] Niveles = { "", "Bronce", "Plata", "Oro", "Diamante" };

    public class Ganada
    {
        public int Nivel { get; set; }
        public Dictionary<int, string> Fechas { get; set; } = new(); // nivel -> fecha
    }

    public record Def(string Id, string Nombre, string Icono, string Stat, int[] Metas, string Que, string Unidad);

    // Metas de bronce, plata, oro y diamante
    public static readonly Def[] Categorias =
    {
        new("viciado", "Viciado", "reloj", "horas", new[] { 10, 50, 100, 250 }, "Juega {0} horas", "h"),
        new("minero", "Minero", "pico", "minado", new[] { 1000, 10000, 50000, 150000 }, "Mina {0} bloques", "bloques"),
        new("millonario", "Millonario", "gema", "diamantes", new[] { 10, 64, 200, 500 }, "Saca {0} diamantes", "diamantes"),
        new("cazador", "Cazador", "espada", "mobs", new[] { 100, 500, 2000, 5000 }, "Mata {0} mobs", "mobs"),
        new("explorador", "Explorador", "brujula", "metros", new[] { 10000, 50000, 200000, 500000 }, "Camina {0} metros", "m"),
        new("inmortal", "Inmortal", "escudo", "record", new[] { 60, 300, 600, 1500 }, "Aguanta {0} minutos sin morir", "min"),
        new("fiel", "Fiel", "llama", "mejorRacha", new[] { 3, 7, 14, 30 }, "Entra {0} días seguidos", "días"),
        new("chismoso", "Chismoso", "chat", "mensajes", new[] { 100, 500, 2000, 5000 }, "Manda {0} mensajes en el chat", "mensajes"),
        new("fotografo", "Fotógrafo", "camara", "capturas", new[] { 1, 10, 30, 75 }, "Sube {0} capturas al Discord", "capturas"),
        new("tonto", "Por Tonto", "calavera", "muertes", new[] { 10, 50, 100, 250 }, "Muérete {0} veces", "muertes"),
        // Estas salen de las estadísticas que guarda Minecraft
        new("pescador", "Pescador", "pez", "pescador", new[] { 10, 50, 200, 500 }, "Pesca {0} cosas", "pescados"),
        new("granjero", "Granjero", "trigo", "granjero", new[] { 100, 1000, 5000, 15000 }, "Cosecha {0} cultivos", "cultivos"),
        new("criador", "Criador", "corazon", "criador", new[] { 10, 50, 200, 500 }, "Cría {0} animales", "animales"),
        new("comerciante", "Comerciante", "esmeralda", "comerciante", new[] { 10, 64, 250, 1000 }, "Haz {0} tratos con aldeanos", "tratos"),
        new("encantador", "Encantador", "libro", "encantador", new[] { 5, 25, 100, 300 }, "Encanta {0} cosas", "encantamientos"),
        new("arquitecto", "Arquitecto", "ladrillo", "arquitecto", new[] { 1000, 10000, 50000, 150000 }, "Coloca {0} bloques", "bloques"),
        new("nadador", "Nadador", "ola", "nadador", new[] { 500, 2000, 10000, 30000 }, "Nada {0} metros", "m"),
        new("piloto", "Piloto", "ala", "piloto", new[] { 2000, 20000, 100000, 500000 }, "Vuela {0} metros con elytra", "m"),
        new("jinete", "Jinete", "herradura", "jinete", new[] { 500, 5000, 20000, 100000 }, "Cabalga {0} metros", "m"),
        new("marinero", "Marinero", "barco", "marinero", new[] { 1000, 10000, 50000, 150000 }, "Navega {0} metros en barco", "m"),
        new("dormilon", "Dormilón", "cama", "dormilon", new[] { 10, 50, 150, 365 }, "Duerme {0} veces", "noches"),
        new("chef", "Chef", "olla", "chef", new[] { 20, 100, 500, 2000 }, "Cocina {0} comidas", "comidas"),
        new("netherita", "Netherita", "lingote", "netherita", new[] { 1, 8, 32, 100 }, "Saca {0} ancient debris", "debris"),
        new("saqueador", "Saqueador", "cofre", "saqueador", new[] { 50, 300, 1000, 3000 }, "Abre {0} cofres", "cofres"),
        new("trotamundos", "Trotamundos", "mapa", "biomas", new[] { 5, 15, 30, 50 }, "Visita {0} biomas", "biomas"),
    };

    // Especiales: se tienen o no
    public static readonly (string Id, string Nombre, string Icono, string Que)[] Especiales =
    {
        ("pionero_diamante", "Primer diamante de la 224", "gema", "Ser el primero de todo el server en sacar diamante"),
        ("pionero_nether", "Primero en el Nether", "portal", "Ser el primero de todo el server en entrar al Nether"),
        ("pionero_end", "Primero en el End", "ojo", "Ser el primero de todo el server en llegar al End"),
        ("matadragones", "Matadragones", "dragon", "Matar al Ender Dragon"),
        ("viajero_end", "Viajero del End", "ojo", "Llegar al End"),
        ("campeon", "Campeón", "corona", "Ganar la liga de un mes"),
        ("wither", "Cazador de Wither", "calavera", "Matar al Wither"),
        ("warden", "Valiente", "ojo", "Matar a un Warden"),
        ("ciudad_end", "Ciudad del End", "torre", "Encontrar una ciudad del End"),
        ("elytra", "Alas", "ala", "Conseguir unas elytras"),
        ("tridente", "Poseidón", "tridente", "Conseguir un tridente"),
        ("totem", "De milagro", "totem", "Salvarte de morir con un tótem"),
        ("bastion", "Saqueador de bastiones", "escudo", "Entrar a un bastión del Nether"),
        ("monumento", "Buzo", "ola", "Vencer a un guardián del monumento del océano"),
        ("ciudad_antigua", "Silencio", "torre", "Sacar un tesoro de una ciudad antigua"),
        ("raid", "Héroe del pueblo", "campana", "Ganar una raid de aldeanos"),
        ("ajolote", "Ajolotero", "pez", "Atrapar un ajolote en una cubeta"),
        ("lobo", "Mejor amigo", "pata", "Domesticar un lobo"),
        ("gato", "Michi", "pata", "Domesticar un gato"),
        ("panda", "Panda", "corazon", "Visitar una jungla de bambú, donde viven los pandas"),
        ("abeja", "Mielero", "abeja", "Sacar miel sin que te piquen"),
        ("sniffer", "Arqueólogo", "huevo", "Conseguir un huevo de sniffer"),
        ("noctambulo", "Noctámbulo", "luna", "Pasar 5 días del juego sin dormir"),
        ("companero", "Compañero", "gente", "Jugar 20 horas con alguien más conectado"),
        ("completista", "Completista", "estrella", "Tener todas las medallas al menos de bronce"),
    };

    // Cuál medalla especial sale de qué logro de Minecraft (los m224: los calcula el bot con las estadísticas)
    public static readonly Dictionary<string, string> PorLogro = new()
    {
        ["minecraft:end/find_end_city"] = "ciudad_end",
        ["minecraft:end/elytra"] = "elytra",
        ["m224:tridente"] = "tridente",
        ["minecraft:adventure/totem_of_undying"] = "totem",
        ["minecraft:nether/find_bastion"] = "bastion",
        ["m224:monumento"] = "monumento",
        ["m224:ciudad_antigua"] = "ciudad_antigua",
        ["minecraft:adventure/hero_of_the_village"] = "raid",
        ["minecraft:husbandry/axolotl_in_a_bucket"] = "ajolote",
        ["m224:lobo"] = "lobo",
        ["m224:gato"] = "gato",
        ["m224:panda"] = "panda",
        ["minecraft:husbandry/safely_harvest_honey"] = "abeja",
        ["minecraft:husbandry/obtain_sniffer_egg"] = "sniffer",
    };

    // "El más tonto del mes": se queda para siempre en el perfil (no da puntos)
    private const string RutaTontos = "mas_tontos.json";
    private readonly Dictionary<string, string> _tontos = Archivo.Leer<Dictionary<string, string>>(RutaTontos); // mes -> jugador
    public void MasTontoDelMes(string mes, string jugador) { lock (_candado) { _tontos[mes] = jugador; Archivo.Guardar(RutaTontos, _tontos); } }
    public List<string> MesesDeTonto(string jugador) { lock (_candado) return _tontos.Where(x => x.Value == jugador).Select(x => x.Key).OrderBy(x => x).ToList(); }

    // Ids que ya se conocían: si sale una medalla nueva, lo que ya tenían se guarda sin anunciar
    private const string RutaIds = "medallas_ids.json";
    private readonly HashSet<string> _ids = new(Archivo.Leer<List<string>>(RutaIds));

    public record Nueva(string Jugador, string Id, string Nombre, int Nivel, string Icono);

    public Medallas()
    {
        _silencio = !File.Exists(Ruta);
        _d = Archivo.Leer<Dictionary<string, Dictionary<string, Ganada>>>(Ruta);
        // Si ya había medallas de antes pero no la lista de ids, estas eran las que existían:
        // todo lo demás cuenta como medalla nueva (se guarda sin anunciar ni dar puntos)
        if (!_silencio && _ids.Count == 0)
            foreach (var id in new[] { "viciado", "minero", "millonario", "cazador", "explorador", "inmortal", "fiel", "chismoso", "fotografo", "tonto",
                                       "pionero_diamante", "pionero_nether", "pionero_end", "matadragones", "viajero_end", "campeon" })
                _ids.Add(id);
    }

    // valores: jugador -> stat -> valor. especiales: jugador -> ids que ya cumple (con fecha)
    // Regresa las medallas nuevas (vacío la primera vez, para no llenar Discord de golpe)
    public List<Nueva> Revisar(Dictionary<string, Dictionary<string, int>> valores, Dictionary<string, Dictionary<string, string>> especiales)
    {
        var nuevas = new List<Nueva>();
        // La primera vez, lo que ya tenían queda sin fecha (no cuenta para la liga del mes)
        var hoy = _silencio ? "" : DateTime.Now.ToString("yyyy-MM-dd");
        lock (_candado)
        {
            foreach (var (jug, v) in valores)
            {
                if (!_d.TryGetValue(jug, out var suyas)) _d[jug] = suyas = new();
                foreach (var c in Categorias)
                {
                    var nueva = !_silencio && _ids.Count > 0 && !_ids.Contains(c.Id);
                    var valor = v.GetValueOrDefault(c.Stat);
                    var nivel = c.Metas.Count(m => valor >= m);
                    if (!suyas.TryGetValue(c.Id, out var g)) suyas[c.Id] = g = new Ganada();
                    if (nivel <= g.Nivel) continue;
                    for (var n = g.Nivel + 1; n <= nivel; n++) g.Fechas[n] = nueva ? "" : hoy;
                    g.Nivel = nivel;
                    if (!nueva) nuevas.Add(new Nueva(jug, c.Id, $"{c.Nombre} de {Niveles[nivel]}", nivel, c.Icono));
                }
            }
            foreach (var (jug, ids) in especiales)
            {
                if (!_d.TryGetValue(jug, out var suyas)) _d[jug] = suyas = new();
                foreach (var (id, fecha) in ids)
                {
                    if (suyas.TryGetValue(id, out var g) && g.Nivel > 0) continue;
                    var nueva = !_silencio && _ids.Count > 0 && !_ids.Contains(id);
                    // Lo que ya tenían cuando salió la medalla no cuenta para la liga ni se anuncia
                    suyas[id] = new Ganada { Nivel = 1, Fechas = { [1] = nueva ? "" : fecha } };
                    var e = Especiales.First(x => x.Id == id);
                    if (!nueva) nuevas.Add(new Nueva(jug, id, e.Nombre, 5, e.Icono));
                }
            }
            // Completista: todas las categorías al menos en bronce
            foreach (var (jug, suyas) in _d)
            {
                if (suyas.TryGetValue("completista", out var cg) && cg.Nivel > 0) continue;
                if (!Categorias.All(c => suyas.TryGetValue(c.Id, out var g) && g.Nivel >= 1)) continue;
                suyas["completista"] = new Ganada { Nivel = 1, Fechas = { [1] = hoy } };
                nuevas.Add(new Nueva(jug, "completista", "Completista", 5, "estrella"));
            }
            foreach (var c in Categorias) _ids.Add(c.Id);
            foreach (var e in Especiales) _ids.Add(e.Id);
            Archivo.Guardar(RutaIds, _ids.ToList());
            Archivo.Guardar(Ruta, _d);
        }
        if (_silencio)
        {
            // La primera vez se guardan las que ya tenían sin anunciarlas todas de golpe
            _silencio = false;
            if (nuevas.Count > 0) Console.WriteLine($"[Medallas] Primera vez: {nuevas.Count} medallas guardadas sin anunciar");
            return new();
        }
        return nuevas;
    }

    // Lo que se manda a la página: todas las medallas de cada quien con su progreso
    public object ParaPagina(string jug, Dictionary<string, int> v)
    {
        Dictionary<string, Ganada> suyas;
        lock (_candado) suyas = _d.TryGetValue(jug, out var s) ? s.ToDictionary(x => x.Key, x => x.Value) : new();
        var lista = new List<object>();
        foreach (var c in Categorias)
        {
            var g = suyas.GetValueOrDefault(c.Id) ?? new Ganada();
            var valor = v.GetValueOrDefault(c.Stat);
            int? meta = g.Nivel < 4 ? c.Metas[g.Nivel] : null;
            lista.Add(new
            {
                id = c.Id, nombre = c.Nombre, icono = c.Icono, nivel = g.Nivel, valor, meta,
                metas = c.Metas, que = c.Que, unidad = c.Unidad,
                fechas = g.Fechas.ToDictionary(x => x.Key.ToString(), x => x.Value),
            });
        }
        foreach (var e in Especiales)
        {
            var g = suyas.GetValueOrDefault(e.Id);
            lista.Add(new { id = e.Id, nombre = e.Nombre, icono = e.Icono, nivel = g?.Nivel ?? 0, especial = true, que = e.Que, fecha = g?.Fechas.GetValueOrDefault(1) });
        }
        lista.AddRange(UnicasParaPagina(jug));
        return lista;
    }

    // Puntos de liga por medallas ganadas en un mes
    public Dictionary<string, List<(string Razon, int Puntos)>> PuntosDelMes(string mes)
    {
        var res = new Dictionary<string, List<(string, int)>>();
        int[] valor = { 0, 10, 20, 40, 80 };
        lock (_candado)
        {
            foreach (var (jug, suyas) in _d)
                foreach (var (id, g) in suyas)
                    foreach (var (nivel, fecha) in g.Fechas)
                    {
                        if (fecha == "" || !fecha.StartsWith(mes)) continue;
                        var c = Categorias.FirstOrDefault(x => x.Id == id);
                        var nombre = c != null ? $"Medalla {c.Nombre} de {Niveles[nivel]}" : $"Medalla {Especiales.First(x => x.Id == id).Nombre}";
                        var pts = c != null ? valor[nivel] : 50;
                        if (!res.TryGetValue(jug, out var l)) res[jug] = l = new();
                        l.Add((nombre, pts));
                    }
        }
        return res;
    }

    public int Total(string jug) { lock (_candado) return _d.TryGetValue(jug, out var s) ? s.Values.Sum(g => g.Nivel) : 0; }

    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            if (!_d.Remove(viejo, out var s)) return;
            if (!_d.TryGetValue(nuevo, out var t)) { _d[nuevo] = s; }
            else foreach (var (id, g) in s) if (!t.TryGetValue(id, out var gt) || gt.Nivel < g.Nivel) t[id] = g;
            Archivo.Guardar(Ruta, _d);
            foreach (var d in U.Values) if (d.Jugador.Equals(viejo, StringComparison.OrdinalIgnoreCase)) d.Jugador = nuevo;
            Archivo.Guardar(RutaUnicas, U);
        }
    }

    // ---------- Medallas únicas: solo una persona la tiene ----------
    // La tiene quien vaya primero en esa stat (con un mínimo). Si alguien lo supera, se la quita.
    // No cuentan para el total de niveles: son extra.
    public record DefUnica(string Id, string Nombre, string Icono, string Stat, int Minimo, string Que);
    public static readonly DefUnica[] Unicas =
    {
        new("u_rey_minero", "Rey Minero", "pico", "minado", 5000, "Ser el que más bloques ha minado (mínimo 5,000)"),
        new("u_magnate", "Magnate", "gema", "diamantes", 50, "Ser el que más diamantes ha sacado (mínimo 50)"),
        new("u_netherita", "Señor de la Netherita", "lingote", "netherita", 8, "Ser el que más ancient debris ha sacado (mínimo 8)"),
        new("u_viciado", "El Más Viciado", "reloj", "horas", 50, "Ser el que más horas ha jugado (mínimo 50)"),
        new("u_exterminador", "Exterminador", "espada", "mobs", 1000, "Ser el que más mobs ha matado (mínimo 1,000)"),
        new("u_viajero", "Gran Viajero", "brujula", "metros", 100000, "Ser el que más ha caminado (mínimo 100 km)"),
        new("u_intocable", "Intocable", "escudo", "record", 600, "Tener el récord sin morir más largo (mínimo 10 horas)"),
    };
    public class Duena { public string Jugador { get; set; } = ""; public int Valor { get; set; } public string Fecha { get; set; } = ""; }
    private const string RutaUnicas = "unicas.json";
    private Dictionary<string, Duena>? _unicas;
    private Dictionary<string, Duena> U => _unicas ??= Archivo.Leer<Dictionary<string, Duena>>(RutaUnicas);

    public record CambioUnica(string Id, string Nombre, string Nuevo, string? Anterior);

    public List<CambioUnica> RevisarUnicas(Dictionary<string, Dictionary<string, int>> valores)
    {
        var cambios = new List<CambioUnica>();
        var primeraVez = !File.Exists(RutaUnicas);
        lock (_candado)
        {
            foreach (var u in Unicas)
            {
                var mejor = valores.Select(x => (Jug: x.Key, V: x.Value.GetValueOrDefault(u.Stat))).OrderByDescending(x => x.V).FirstOrDefault();
                if (mejor.Jug == null || mejor.V < u.Minimo) continue;
                U.TryGetValue(u.Id, out var actual);
                var valorActual = actual != null && valores.TryGetValue(actual.Jugador, out var va) ? va.GetValueOrDefault(u.Stat) : -1;
                // Se queda con el que la tiene si nadie lo supera (en empate no se la quitan)
                if (actual != null && (actual.Jugador == mejor.Jug || mejor.V <= valorActual))
                {
                    if (actual.Jugador == mejor.Jug) actual.Valor = mejor.V;
                    continue;
                }
                U[u.Id] = new Duena { Jugador = mejor.Jug, Valor = mejor.V, Fecha = DateTime.Now.ToString("yyyy-MM-dd") };
                if (!primeraVez) cambios.Add(new CambioUnica(u.Id, u.Nombre, mejor.Jug, actual?.Jugador));
            }
            Archivo.Guardar(RutaUnicas, U);
        }
        return cambios;
    }

    public IEnumerable<object> UnicasParaPagina(string jug)
    {
        lock (_candado)
            return Unicas.Select(u =>
            {
                U.TryGetValue(u.Id, out var d);
                return (object)new { id = u.Id, nombre = u.Nombre, icono = u.Icono, unica = true, nivel = d?.Jugador == jug ? 1 : 0, que = u.Que, duena = d?.Jugador, fecha = d?.Jugador == jug ? d.Fecha : null };
            }).ToList();
    }
}
