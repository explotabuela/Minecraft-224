using System.Text.Encodings.Web;
using System.Text.Json;

namespace Bot224;

// Leer y guardar los .json del bot sin que se corrompan si se apaga a medias
public static class Archivo
{
    public static readonly JsonSerializerOptions Opciones = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNameCaseInsensitive = true,
    };

    // Para data.json: nombres en camelCase (como los usa la página)
    public static readonly JsonSerializerOptions ParaPagina = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static T Leer<T>(string ruta) where T : new()
    {
        try
        {
            if (File.Exists(ruta)) return JsonSerializer.Deserialize<T>(File.ReadAllText(ruta), Opciones) ?? new T();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Archivo] No se pudo leer {ruta}: {ex.Message}");
        }
        return new T();
    }

    public static void Guardar(string ruta, object datos)
    {
        var tmp = ruta + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(datos, Opciones));
        File.Move(tmp, ruta, true);
    }
}
