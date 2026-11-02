using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// Las fotos que suben al canal de capturas de Discord se van solas a la página.
// Si Dylan le pone ❌ a una, se quita de la página.
public class Capturas
{
    private readonly Config _config;
    private readonly Discord _discord;
    private readonly GitHub _github;
    private readonly Vinculos _vinculos;
    private const string RutaConteo = "capturas_conteo.json";
    private static readonly object CandadoConteo = new();
    private readonly HttpClient _http = new();
    private readonly SemaphoreSlim _turno = new(1, 1);
    private const string RutaLista = "capturas.json";
    private const long MaxBytes = 15 * 1024 * 1024;

    private static readonly string[] Extensiones = { ".png", ".jpg", ".jpeg", ".webp", ".gif" };
    private static readonly Regex RegexMencion = new(@"<@!?(\d+)>|<#\d+>|<@&\d+>");
    private static readonly Regex RegexEmoji = new(@"<a?:(\w+):\d+>");

    public class Captura
    {
        public string Archivo { get; set; } = "";
        public string Texto { get; set; } = "";
        public string Autor { get; set; } = "";
        public string Fecha { get; set; } = "";
        public string Mensaje { get; set; } = "";
        public string? Jugador { get; set; }
    }

    // Cuántas capturas ha subido cada jugador (para la medalla de Fotógrafo)
    public static Dictionary<string, int> Conteo() { lock (CandadoConteo) return Archivo.Leer<Dictionary<string, int>>(RutaConteo); }

    public Capturas(Config config, Discord discord, GitHub github, Vinculos vinculos)
    {
        _vinculos = vinculos;
        _config = config;
        _discord = discord;
        _github = github;
    }

    public async Task MensajeAsync(JsonElement m)
    {
        if (string.IsNullOrEmpty(_config.CanalCapturasId) || m.GetProperty("channel_id").GetString() != _config.CanalCapturasId) return;
        if (m.TryGetProperty("webhook_id", out _)) return;
        var autor = m.GetProperty("author");
        if (autor.TryGetProperty("bot", out var b) && b.GetBoolean()) return;
        if (!m.TryGetProperty("attachments", out var adjuntos) || adjuntos.GetArrayLength() == 0) return;
        if (!_github.Listo) { Console.WriteLine("[Capturas] Falta github_token en config.json"); return; }

        var nombre = NombreDe(m, autor);
        var texto = RegexEmoji.Replace(RegexMencion.Replace(m.GetProperty("content").GetString() ?? "", ""), ":$1:").Trim();
        texto = Regex.Replace(texto, @"\s+", " ");
        if (texto.Length > 140) texto = texto[..140] + "...";
        var idMensaje = m.GetProperty("id").GetString() ?? "";
        var jugador = _vinculos.Jugador(autor.GetProperty("id").GetString() ?? "");

        var nuevas = new List<Captura>();
        foreach (var a in adjuntos.EnumerateArray())
        {
            var archivo = a.GetProperty("filename").GetString() ?? "";
            var ext = Path.GetExtension(archivo).ToLowerInvariant();
            if (!Extensiones.Contains(ext)) continue;
            if (a.TryGetProperty("size", out var tam) && tam.GetInt64() > MaxBytes) continue;
            try
            {
                var datos = await _http.GetByteArrayAsync(a.GetProperty("url").GetString());
                var ruta = $"capturas/{DateTime.Now:yyyyMMdd-HHmmss}-{a.GetProperty("id").GetString()}{(ext == ".jpeg" ? ".jpg" : ext)}";
                await _github.SubirAsync(ruta, datos, $"Captura de {nombre}");
                nuevas.Add(new Captura { Archivo = ruta, Texto = texto, Autor = nombre, Fecha = DateTime.Now.ToString("yyyy-MM-dd"), Mensaje = idMensaje, Jugador = jugador });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Capturas] No se pudo subir {archivo}: {ex.Message}");
            }
        }
        if (nuevas.Count == 0) return;

        await _turno.WaitAsync();
        try
        {
            var (lista, sha) = await LeerListaAsync();
            lista.InsertRange(0, nuevas); // las nuevas primero
            await GuardarListaAsync(lista, sha, $"Nueva captura de {nombre}");
        }
        finally { _turno.Release(); }

        if (jugador != null)
            lock (CandadoConteo)
            {
                var c = Archivo.Leer<Dictionary<string, int>>(RutaConteo);
                c[jugador] = c.GetValueOrDefault(jugador) + nuevas.Count;
                Archivo.Guardar(RutaConteo, c);
            }
        Console.WriteLine($"[Capturas] {nuevas.Count} subida(s) de {nombre} ✔");
        await _discord.ReaccionarAsync(_config.CanalCapturasId, idMensaje, "✅");
    }

    // Modo GitHub: no hay conexión en vivo con Discord, así que se revisan los mensajes nuevos del canal en cada ronda
    public async Task RevisarCanalAsync()
    {
        if (string.IsNullOrEmpty(_config.CanalCapturasId)) return;
        const string RutaUltimo = "capturas_ultimo.txt";
        var ultimo = File.Exists(RutaUltimo) ? File.ReadAllText(RutaUltimo).Trim() : "";
        var ruta = $"/channels/{_config.CanalCapturasId}/messages?limit=50" + (ultimo != "" ? $"&after={ultimo}" : "");
        if (await _discord.ApiAsync(HttpMethod.Get, ruta) is not { ValueKind: JsonValueKind.Array } mensajes) return;
        var lista = mensajes.EnumerateArray().OrderBy(m => ulong.Parse(m.GetProperty("id").GetString() ?? "0")).ToList();
        if (lista.Count == 0) return;
        // La primera vez solo se marca dónde vamos (para no subir capturas viejas)
        if (ultimo != "")
            foreach (var m in lista)
            {
                var copia = JsonDocument.Parse(m.GetRawText().TrimEnd('}') + $",\"channel_id\":\"{_config.CanalCapturasId}\"}}").RootElement;
                try { await MensajeAsync(m.TryGetProperty("channel_id", out _) ? m : copia); }
                catch (Exception ex) { Console.WriteLine($"[Capturas] {ex.Message}"); }
            }
        File.WriteAllText(RutaUltimo, lista[^1].GetProperty("id").GetString());
    }

    // Dylan le pone ❌ a un mensaje del canal de capturas -> se quita de la página
    public async Task ReaccionAsync(JsonElement r)
    {
        if (string.IsNullOrEmpty(_config.CanalCapturasId) || r.GetProperty("channel_id").GetString() != _config.CanalCapturasId) return;
        if (r.GetProperty("user_id").GetString() != _config.AdminId) return;
        var emoji = r.GetProperty("emoji").GetProperty("name").GetString();
        if (emoji != "❌") return;
        var idMensaje = r.GetProperty("message_id").GetString();

        await _turno.WaitAsync();
        try
        {
            var (lista, sha) = await LeerListaAsync();
            var quitar = lista.Where(c => c.Mensaje == idMensaje).ToList();
            if (quitar.Count == 0) return;
            lista.RemoveAll(c => c.Mensaje == idMensaje);
            await GuardarListaAsync(lista, sha, "Quitar captura");
            foreach (var c in quitar)
            {
                try { await _github.BorrarAsync(c.Archivo, "Quitar captura"); }
                catch (Exception ex) { Console.WriteLine($"[Capturas] No se pudo borrar {c.Archivo}: {ex.Message}"); }
            }
            Console.WriteLine($"[Capturas] Quitada(s) {quitar.Count} de la página");
        }
        finally { _turno.Release(); }
    }

    // Para "temporada": quita de la página todas las capturas de prueba
    public async Task<int> VaciarAsync()
    {
        if (!_github.Listo) return 0;
        await _turno.WaitAsync();
        try
        {
            var (lista, sha) = await LeerListaAsync();
            if (lista.Count == 0) return 0;
            await GuardarListaAsync(new List<Captura>(), sha, "Temporada nueva: sin capturas");
            foreach (var c in lista)
            {
                try { await _github.BorrarAsync(c.Archivo, "Temporada nueva"); }
                catch (Exception ex) { Console.WriteLine($"[Capturas] No se pudo borrar {c.Archivo}: {ex.Message}"); }
            }
            return lista.Count;
        }
        finally { _turno.Release(); }
    }

    private async Task<(List<Captura> Lista, string? Sha)> LeerListaAsync()
    {
        var (datos, sha) = await _github.LeerAsync(RutaLista);
        var lista = datos is { Length: > 0 }
            ? JsonSerializer.Deserialize<List<Captura>>(datos, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new()
            : new List<Captura>();
        return (lista, sha);
    }

    private Task GuardarListaAsync(List<Captura> lista, string? sha, string mensaje)
    {
        var json = JsonSerializer.Serialize(lista.Select(c => new { archivo = c.Archivo, texto = c.Texto, autor = c.Autor, fecha = c.Fecha, mensaje = c.Mensaje, jugador = c.Jugador }),
            new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
        return _github.SubirAsync(RutaLista, Encoding.UTF8.GetBytes(json), mensaje, sha);
    }

    private static string NombreDe(JsonElement m, JsonElement autor)
    {
        if (m.TryGetProperty("member", out var mi) && mi.TryGetProperty("nick", out var n) && n.ValueKind == JsonValueKind.String) return n.GetString()!;
        if (autor.TryGetProperty("global_name", out var g) && g.ValueKind == JsonValueKind.String) return g.GetString()!;
        return autor.GetProperty("username").GetString() ?? "alguien";
    }
}
