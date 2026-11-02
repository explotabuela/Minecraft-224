using System.Text.Json;

namespace Bot224;

// Lee lo que Minecraft ya guarda de cada jugador en la carpeta del mundo:
//  - world/stats/UUID.json        (peces, animales criados, distancia en elytra, etc.)
//  - world/advancements/UUID.json (logros: elytra, bastión, biomas visitados, etc.)
// Así las medallas nuevas no necesitan nada extra en el datapack.
public class Mundo
{
    private readonly Config _config;
    private readonly Alias _alias;

    public Mundo(Config config, Alias alias) { _config = config; _alias = alias; }

    public class Extra
    {
        public Dictionary<string, long> Valores { get; } = new();
        public Dictionary<string, string> Logros { get; } = new(); // id del logro -> fecha (yyyy-MM-dd)
        public int Biomas { get; set; }
        public long Diamantes { get; set; }      // mineral de diamante minado (para revisar X-ray)
        public long Piedra { get; set; }         // piedra, deepslate, tuff, etc. minado
    }

    private string CarpetaMundo()
    {
        var nombre = "world";
        try
        {
            var props = Path.Combine(_config.CarpetaServer, "server.properties");
            if (File.Exists(props))
                foreach (var l in File.ReadLines(props))
                    if (l.StartsWith("level-name=")) { var v = l[11..].Trim(); if (v != "") nombre = v; }
        }
        catch { }
        return Path.Combine(_config.CarpetaServer, nombre);
    }

    // nombre en minúsculas -> UUID con guiones (como se llaman los archivos)
    private Dictionary<string, string> Uuids()
    {
        var dic = new Dictionary<string, string>();
        try
        {
            if (!File.Exists(_config.RutaUsercache)) return dic;
            using var doc = JsonDocument.Parse(File.ReadAllText(_config.RutaUsercache));
            foreach (var e in doc.RootElement.EnumerateArray())
                if (e.TryGetProperty("name", out var n) && n.GetString() is { } nombre && e.TryGetProperty("uuid", out var u) && u.GetString() is { } id)
                    dic[nombre.ToLower()] = id;
        }
        catch { }
        return dic;
    }

    // Cosas que se "usan" pero no son bloques (para contar bloques colocados)
    private static readonly string[] NoBloques =
    {
        "_sword", "_pickaxe", "_axe", "_shovel", "_hoe", "bow", "trident", "shield", "fishing_rod", "flint_and_steel", "shears",
        "elytra", "bucket", "potion", "_on_a_stick", "firework", "ender_pearl", "ender_eye", "egg", "snowball", "totem", "bottle",
        "spyglass", "brush", "mace", "compass", "clock", "map", "book", "boat", "raft", "minecart", "bone_meal", "wind_charge",
        "name_tag", "lead", "saddle", "horn", "bundle", "helmet", "chestplate", "leggings", "boots", "experience",
        "apple", "bread", "cooked_", "beef", "porkchop", "chicken", "mutton", "rabbit", "cod", "salmon", "tropical_fish", "pufferfish",
        "potato", "carrot", "beetroot", "stew", "soup", "cookie", "melon_slice", "pumpkin_pie", "glow_berries", "dried_kelp",
        "chorus_fruit", "rotten_flesh", "spider_eye", "honey_bottle", "charge", "arrow", "dye", "_seeds",
    };
    private static readonly string[] Cultivos = { "wheat", "carrots", "potatoes", "beetroots", "nether_wart", "melon", "pumpkin", "cocoa", "sugar_cane", "cactus", "bamboo", "sweet_berry_bush" };
    private static readonly string[] Comida = { "cooked_beef", "cooked_porkchop", "cooked_chicken", "cooked_mutton", "cooked_rabbit", "cooked_cod", "cooked_salmon", "baked_potato", "dried_kelp", "bread", "cake", "cookie", "pumpkin_pie", "mushroom_stew", "rabbit_stew", "beetroot_soup" };
    private static readonly string[] Piedras = { "stone", "deepslate", "tuff", "andesite", "diorite", "granite", "netherrack", "cobbled_deepslate" };

    // Lee y suma todo lo de una persona (todas sus cuentas: Java y Bedrock)
    public Extra Leer(string principal)
    {
        var x = new Extra();
        var carpeta = CarpetaMundo();
        var uuids = Uuids();
        foreach (var nombre in _alias.NombresDe(principal))
        {
            if (!uuids.TryGetValue(nombre.ToLower(), out var uuid)) continue;
            LeerStats(Path.Combine(carpeta, "stats", uuid + ".json"), x);
            LeerLogros(Path.Combine(carpeta, "advancements", uuid + ".json"), x);
        }
        return x;
    }

    private static long Suma(JsonElement stats, string tipo, Func<string, bool> filtro)
    {
        if (!stats.TryGetProperty(tipo, out var t)) return 0;
        long total = 0;
        foreach (var p in t.EnumerateObject())
            if (filtro(p.Name.Replace("minecraft:", "")) && p.Value.TryGetInt64(out var v)) total += v;
        return total;
    }

    private static void LeerStats(string ruta, Extra x)
    {
        try
        {
            if (!File.Exists(ruta)) return;
            using var doc = JsonDocument.Parse(File.ReadAllText(ruta));
            if (!doc.RootElement.TryGetProperty("stats", out var st)) return;
            long C(string k) => Suma(st, "minecraft:custom", n => n == k);
            void Sumar(string k, long v) => x.Valores[k] = x.Valores.GetValueOrDefault(k) + v;

            Sumar("pescador", C("fish_caught"));
            Sumar("granjero", Suma(st, "minecraft:mined", n => Cultivos.Contains(n)));
            Sumar("criador", C("animals_bred"));
            Sumar("comerciante", C("traded_with_villager"));
            Sumar("encantador", C("enchant_item"));
            Sumar("arquitecto", Suma(st, "minecraft:used", n => !NoBloques.Any(n.Contains)));
            Sumar("nadador", (C("swim_one_cm") + C("walk_under_water_one_cm")) / 100);
            Sumar("piloto", C("aviate_one_cm") / 100);
            Sumar("jinete", C("horse_one_cm") / 100);
            Sumar("marinero", C("boat_one_cm") / 100);
            Sumar("dormilon", C("sleep_in_bed"));
            Sumar("chef", Suma(st, "minecraft:crafted", n => Comida.Contains(n)));
            Sumar("netherita", Suma(st, "minecraft:mined", n => n == "ancient_debris"));
            Sumar("saqueador", C("open_chest") + C("open_barrel"));
            Sumar("wither", Suma(st, "minecraft:killed", n => n == "wither"));
            Sumar("warden", Suma(st, "minecraft:killed", n => n == "warden"));
            x.Valores["sinDormir"] = Math.Max(x.Valores.GetValueOrDefault("sinDormir"), C("time_since_rest"));
            // Medallas que salen de las estadísticas (sin necesitar nada en el datapack)
            void Logro(string id, bool cumple) { if (cumple && !x.Logros.ContainsKey(id)) x.Logros[id] = ""; }
            Logro("m224:tridente", Suma(st, "minecraft:picked_up", n => n == "trident") > 0);
            Logro("m224:monumento", Suma(st, "minecraft:killed", n => n is "guardian" or "elder_guardian") > 0);
            Logro("m224:ciudad_antigua", Suma(st, "minecraft:picked_up", n => n is "echo_shard" or "disc_fragment_5" or "ward_armor_trim_smithing_template" or "silence_armor_trim_smithing_template") > 0);
            x.Diamantes += Suma(st, "minecraft:mined", n => n is "diamond_ore" or "deepslate_diamond_ore");
            x.Piedra += Suma(st, "minecraft:mined", n => Piedras.Contains(n));
        }
        catch (Exception ex) { Console.WriteLine($"[Mundo] No pude leer {Path.GetFileName(ruta)}: {ex.Message}"); }
    }

    private static void LeerLogros(string ruta, Extra x)
    {
        try
        {
            if (!File.Exists(ruta)) return;
            using var doc = JsonDocument.Parse(File.ReadAllText(ruta));
            foreach (var a in doc.RootElement.EnumerateObject())
            {
                if (a.Value.ValueKind != JsonValueKind.Object) continue;
                if (a.Name == "minecraft:adventure/adventuring_time" && a.Value.TryGetProperty("criteria", out var cr))
                {
                    x.Biomas = Math.Max(x.Biomas, cr.EnumerateObject().Count());
                    if (cr.TryGetProperty("minecraft:bamboo_jungle", out _) && !x.Logros.ContainsKey("m224:panda")) x.Logros["m224:panda"] = "";
                }
                // Lobo y gato: cualquier variante domesticada cuenta
                if (a.Name == "minecraft:husbandry/whole_pack" && a.Value.TryGetProperty("criteria", out var lb) && lb.EnumerateObject().Any() && !x.Logros.ContainsKey("m224:lobo")) x.Logros["m224:lobo"] = "";
                if (a.Name == "minecraft:husbandry/complete_catalogue" && a.Value.TryGetProperty("criteria", out var gt) && gt.EnumerateObject().Any() && !x.Logros.ContainsKey("m224:gato")) x.Logros["m224:gato"] = "";
                if (!a.Value.TryGetProperty("done", out var d) || d.ValueKind != JsonValueKind.True) continue;
                // La fecha es la más reciente de sus criterios
                var fecha = "";
                if (a.Value.TryGetProperty("criteria", out var c))
                    foreach (var f in c.EnumerateObject())
                        if (f.Value.GetString() is { Length: >= 10 } s && string.CompareOrdinal(s[..10], fecha) > 0) fecha = s[..10];
                if (!x.Logros.TryGetValue(a.Name, out var previa) || string.CompareOrdinal(fecha, previa) < 0) x.Logros[a.Name] = fecha;
            }
        }
        catch (Exception ex) { Console.WriteLine($"[Mundo] No pude leer {Path.GetFileName(ruta)}: {ex.Message}"); }
    }
}
