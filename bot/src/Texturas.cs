using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace Bot224;

// "texturas" en la consola: saca las texturas de TU Minecraft (el .jar de la versión que tienes instalada)
// y las sube a la página, para que los juegos se vean como en el juego: caras de mobs, items y bloques.
// Solo se hace una vez (o cuando cambies de versión).
public static class Texturas
{
    // clave en la página -> rutas posibles dentro del .jar (cambian un poco entre versiones)
    private static readonly (string Clave, string[] Rutas)[] Lista =
    {
        // ---- Mobs (para "Adivina el mob", el buscaminas y los reflejos) ----
        ("mob_creeper", new[] { "entity/creeper/creeper.png", "entity/creeper.png" }),
        ("mob_zombie", new[] { "entity/zombie/zombie.png" }),
        ("mob_husk", new[] { "entity/zombie/husk.png" }),
        ("mob_drowned", new[] { "entity/zombie/drowned.png" }),
        ("mob_drowned_capa", new[] { "entity/zombie/drowned_outer_layer.png" }),
        ("mob_skeleton", new[] { "entity/skeleton/skeleton.png" }),
        ("mob_stray", new[] { "entity/skeleton/stray.png" }),
        ("mob_stray_capa", new[] { "entity/skeleton/stray_overlay.png" }),
        ("mob_wither_skeleton", new[] { "entity/skeleton/wither_skeleton.png" }),
        ("mob_enderman", new[] { "entity/enderman/enderman.png" }),
        ("mob_enderman_ojos", new[] { "entity/enderman/enderman_eyes.png" }),
        ("mob_pig", new[] { "entity/pig/pig_temperate.png", "entity/pig/temperate_pig.png", "entity/pig/pig.png" }),
        ("mob_sheep", new[] { "entity/sheep/sheep.png" }),
        ("mob_sheep_lana", new[] { "entity/sheep/sheep_wool.png", "entity/sheep/sheep_fur.png" }),
        ("mob_chicken", new[] { "entity/chicken/chicken_temperate.png", "entity/chicken/temperate_chicken.png", "entity/chicken.png" }),
        ("mob_spider", new[] { "entity/spider/spider.png" }),
        ("mob_spider_ojos", new[] { "entity/spider/spider_eyes.png", "entity/spider_eyes.png" }),
        ("mob_slime", new[] { "entity/slime/slime.png" }),
        ("mob_blaze", new[] { "entity/blaze/blaze.png", "entity/blaze.png" }),
        ("mob_villager", new[] { "entity/villager/villager.png" }),
        ("mob_witch", new[] { "entity/witch/witch.png", "entity/witch.png" }),
        ("mob_ghast", new[] { "entity/ghast/ghast.png" }),
        ("mob_cow", new[] { "entity/cow/cow_temperate.png", "entity/cow/temperate_cow.png", "entity/cow/cow.png" }),
        ("mob_iron_golem", new[] { "entity/iron_golem/iron_golem.png" }),
        ("mob_piglin", new[] { "entity/piglin/piglin.png" }),
        // ---- Ingredientes del crafteo ----
        ("item_stick", new[] { "item/stick.png" }), ("item_coal", new[] { "item/coal.png" }), ("item_iron_ingot", new[] { "item/iron_ingot.png" }),
        ("item_wheat", new[] { "item/wheat.png" }), ("item_redstone", new[] { "item/redstone.png" }), ("item_gold_ingot", new[] { "item/gold_ingot.png" }),
        ("item_gunpowder", new[] { "item/gunpowder.png" }), ("item_book", new[] { "item/book.png" }), ("item_diamond", new[] { "item/diamond.png" }),
        ("item_string", new[] { "item/string.png" }), ("item_nether_star", new[] { "item/nether_star.png" }), ("item_paper", new[] { "item/paper.png" }),
        ("item_leather", new[] { "item/leather.png" }), ("item_sugar_cane", new[] { "item/sugar_cane.png" }), ("item_milk_bucket", new[] { "item/milk_bucket.png" }),
        ("item_sugar", new[] { "item/sugar.png" }), ("item_egg", new[] { "item/egg.png" }), ("item_ender_pearl", new[] { "item/ender_pearl.png" }),
        ("item_blaze_powder", new[] { "item/blaze_powder.png" }), ("item_flint", new[] { "item/flint.png" }), ("item_feather", new[] { "item/feather.png" }),
        ("item_iron_nugget", new[] { "item/iron_nugget.png" }), ("item_copper_ingot", new[] { "item/copper_ingot.png" }), ("item_amethyst_shard", new[] { "item/amethyst_shard.png" }),
        ("bloque_oak_planks", new[] { "block/oak_planks.png" }), ("bloque_cobblestone", new[] { "block/cobblestone.png" }), ("bloque_white_wool", new[] { "block/white_wool.png" }),
        ("bloque_sand", new[] { "block/sand.png" }), ("bloque_obsidian", new[] { "block/obsidian.png" }), ("bloque_iron_block", new[] { "block/iron_block.png" }),
        ("bloque_glass", new[] { "block/glass.png" }), ("bloque_torch", new[] { "block/torch.png" }),
        // ---- Lo que sale de las recetas (se enseña al contestar) ----
        ("item_stone_pickaxe", new[] { "item/stone_pickaxe.png" }), ("item_iron_sword", new[] { "item/iron_sword.png" }), ("item_bucket", new[] { "item/bucket.png" }),
        ("item_bread", new[] { "item/bread.png" }), ("item_oak_boat", new[] { "item/oak_boat.png" }), ("item_bow", new[] { "item/bow.png" }),
        ("item_oak_door", new[] { "item/oak_door.png" }), ("item_diamond_pickaxe", new[] { "item/diamond_pickaxe.png" }), ("item_iron_shovel", new[] { "item/iron_shovel.png" }),
        ("item_stone_axe", new[] { "item/stone_axe.png" }), ("item_iron_hoe", new[] { "item/iron_hoe.png" }), ("item_iron_helmet", new[] { "item/iron_helmet.png" }),
        ("item_iron_chestplate", new[] { "item/iron_chestplate.png" }), ("item_iron_leggings", new[] { "item/iron_leggings.png" }), ("item_iron_boots", new[] { "item/iron_boots.png" }),
        ("item_cake", new[] { "item/cake.png" }), ("item_fishing_rod", new[] { "item/fishing_rod.png" }), ("item_shears", new[] { "item/shears.png" }),
        ("item_minecart", new[] { "item/minecart.png" }), ("item_ender_eye", new[] { "item/ender_eye.png" }), ("item_bowl", new[] { "item/bowl.png" }),
        ("item_arrow", new[] { "item/arrow.png" }), ("item_spyglass", new[] { "item/spyglass.png" }), ("item_golden_apple", new[] { "item/golden_apple.png" }), ("item_apple", new[] { "item/apple.png" }),
        ("item_compass", new[] { "item/compass_00.png", "item/compass.png" }), ("item_clock", new[] { "item/clock_00.png", "item/clock.png" }),
        ("bloque_crafting_table_front", new[] { "block/crafting_table_front.png" }), ("bloque_furnace_front", new[] { "block/furnace_front.png" }),
        ("bloque_ladder", new[] { "block/ladder.png" }), ("bloque_tnt_side", new[] { "block/tnt_side.png" }), ("bloque_enchanting_table_side", new[] { "block/enchanting_table_side.png" }),
        ("bloque_beacon", new[] { "block/beacon.png" }), ("bloque_piston_side", new[] { "block/piston_side.png" }), ("bloque_redstone_torch", new[] { "block/redstone_torch.png" }),
        ("bloque_lever", new[] { "block/lever.png" }), ("bloque_rail", new[] { "block/rail.png" }), ("bloque_diamond_block", new[] { "block/diamond_block.png" }),
        ("bloque_iron_bars", new[] { "block/iron_bars.png" }), ("bloque_bookshelf", new[] { "block/bookshelf.png" }),
        // ---- Bloques del Tetris ----
        ("bloque_gold_block", new[] { "block/gold_block.png" }), ("bloque_redstone_block", new[] { "block/redstone_block.png" }),
        ("bloque_emerald_block", new[] { "block/emerald_block.png" }), ("bloque_lapis_block", new[] { "block/lapis_block.png" }), ("bloque_copper_block", new[] { "block/copper_block.png" }),
        ("bloque_grass_block_side", new[] { "block/grass_block_side.png" }),
        // ---- Snake y Flappy ----
        ("bloque_moss_block", new[] { "block/moss_block.png" }), ("bloque_end_stone", new[] { "block/end_stone.png" }),
        ("bloque_purpur_block", new[] { "block/purpur_block.png" }), ("bloque_crying_obsidian", new[] { "block/crying_obsidian.png" }),
        ("item_tropical_fish", new[] { "item/tropical_fish.png" }), ("item_cod", new[] { "item/cod.png" }), ("item_salmon", new[] { "item/salmon.png" }),
        ("item_elytra", new[] { "item/elytra.png" }), ("item_firework_rocket", new[] { "item/firework_rocket.png" }),
    };

    // Dónde suele estar Minecraft instalado
    public static string? BuscarJar(string? ruta, string version)
    {
        if (!string.IsNullOrWhiteSpace(ruta))
        {
            ruta = ruta.Trim().Trim('"');
            if (File.Exists(ruta)) return ruta;
            if (Directory.Exists(ruta)) return Directory.GetFiles(ruta, "*.jar", SearchOption.AllDirectories).OrderByDescending(File.GetLastWriteTime).FirstOrDefault();
            return null;
        }
        var casa = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var carpetas = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), ".minecraft", "versions"),
            Path.Combine(casa, ".minecraft", "versions"),
            Path.Combine(casa, "Library", "Application Support", "minecraft", "versions"),
        };
        foreach (var c in carpetas.Where(Directory.Exists))
        {
            // Primero la misma versión del server, luego la más nueva que haya
            var exacta = Path.Combine(c, version, version + ".jar");
            if (File.Exists(exacta)) return exacta;
            var jar = Directory.GetDirectories(c)
                .Select(d => Path.Combine(d, Path.GetFileName(d) + ".jar"))
                .Where(File.Exists)
                .Where(f => !Path.GetFileName(f).Contains("fabric", StringComparison.OrdinalIgnoreCase) && !Path.GetFileName(f).Contains("forge", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(File.GetLastWriteTime)
                .FirstOrDefault();
            if (jar != null) return jar;
        }
        return null;
    }

    // Saca las texturas del .jar: clave -> png
    public static Dictionary<string, byte[]> Sacar(string jar, List<string> faltan)
    {
        var res = new Dictionary<string, byte[]>();
        using var zip = ZipFile.OpenRead(jar);
        var porRuta = zip.Entries.ToDictionary(e => e.FullName, StringComparer.OrdinalIgnoreCase);
        foreach (var (clave, rutas) in Lista)
        {
            var entrada = rutas.Select(r => porRuta.GetValueOrDefault("assets/minecraft/textures/" + r)).FirstOrDefault(e => e != null);
            if (entrada == null) { faltan.Add(clave); continue; }
            using var s = entrada.Open();
            using var ms = new MemoryStream();
            s.CopyTo(ms);
            res[clave] = ms.ToArray();
        }
        return res;
    }

    public static async Task SubirAsync(GitHub github, Config config, string? ruta)
    {
        if (!github.Listo) { Console.WriteLine("Falta github_token / github_repo en config.json"); return; }
        var jar = BuscarJar(ruta, config.Version);
        if (jar == null)
        {
            Console.WriteLine("No encontré tu Minecraft. Abre el launcher, juega una vez la versión del server y vuelve a intentar,");
            Console.WriteLine("o dime dónde está el .jar, ej:  texturas C:\\Users\\TU_USUARIO\\AppData\\Roaming\\.minecraft\\versions\\26.3\\26.3.jar");
            return;
        }
        Console.WriteLine($"Usando {jar}");
        var faltan = new List<string>();
        Dictionary<string, byte[]> texturas;
        try { texturas = Sacar(jar, faltan); }
        catch (Exception ex) { Console.WriteLine($"No pude abrir el .jar: {ex.Message}"); return; }
        if (texturas.Count == 0) { Console.WriteLine("Ese .jar no trae texturas (¿es el del server?). Usa el de tu Minecraft, el de la carpeta .minecraft\\versions."); return; }

        Console.WriteLine($"Subiendo {texturas.Count} texturas a la página (tarda un par de minutos)...");
        var subidas = new List<string>();
        foreach (var (clave, png) in texturas)
        {
            try { await github.SubirAsync($"texturas/{clave}.png", png, "Texturas para los juegos"); subidas.Add(clave); }
            catch (Exception ex) { Console.WriteLine($"  No se pudo subir {clave}: {ex.Message}"); }
        }
        // La lista la lee la página para saber qué hay
        var lista = new { version = Path.GetFileNameWithoutExtension(jar), texturas = subidas.OrderBy(x => x).ToList() };
        await github.SubirAsync("texturas/texturas.json", Encoding.UTF8.GetBytes(JsonSerializer.Serialize(lista)), "Lista de texturas");
        Console.WriteLine($"Listo ✔ {subidas.Count} texturas subidas." + (faltan.Count > 0 ? $" (No venían en esta versión: {string.Join(", ", faltan)}; se usan dibujos en su lugar.)" : ""));
        Console.WriteLine("En unos minutos los juegos de la página ya se ven con las texturas del juego.");
    }
}
