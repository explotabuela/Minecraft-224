namespace Bot224;

// "temporada" en la consola: deja el bot en ceros para la inauguración.
// No borra nada: lo mueve todo a respaldos/temporada_FECHA por si acaso.
public static class Temporada
{
    // Lo que se queda: llaves, quién es quién, skins y los avisos pendientes
    public static readonly string[] SeQuedan =
    {
        "config.json", "alias.json", "vinculos.json", "skins.json", "medallas_ids.json", "pendientes_bedrock.json", "inauguracion_avisos.json",
    };

    // Solo se mueven los datos de la temporada (nunca los archivos del programa, como Bot224.deps.json)
    public static readonly string[] SeVan =
    {
        "data.json", "desaparecidos.json", "estado.json", "historial.json", "liga.json", "medallas.json", "mas_tontos.json",
        "perfiles.json", "presencia.json", "rachas.json", "resumen.json", "stats_cache.json", "wrapped.json", "xray_avisos.json",
        "capturas.json", "capturas_conteo.json", "unicas.json", "nether_avisos.json",
    };

    public static List<string> LoQueSeVa() => SeVan.Where(File.Exists).ToList();

    // Regresa la carpeta donde quedó el respaldo
    public static string Reiniciar(DateTime ahora)
    {
        var carpeta = Path.Combine("respaldos", "temporada_" + ahora.ToString("yyyy-MM-dd_HHmm"));
        Directory.CreateDirectory(carpeta);
        foreach (var f in LoQueSeVa())
            File.Move(f, Path.Combine(carpeta, f), true);
        foreach (var f in Directory.GetFiles(".", "*.json.tmp"))
            File.Delete(f);
        return carpeta;
    }
}
