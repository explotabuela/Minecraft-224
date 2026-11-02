using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Bot224;

// Sube, lee y borra archivos del repo de la página (GitHub)
public class GitHub
{
    private readonly Config _config;
    private readonly HttpClient _http = new();
    private readonly Dictionary<string, string> _shas = new(); // última versión conocida de cada archivo
    private readonly SemaphoreSlim _turno = new(1, 1);

    public GitHub(Config config)
    {
        _config = config;
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("Bot224");
        _http.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        _http.Timeout = TimeSpan.FromMinutes(2);
        if (!string.IsNullOrWhiteSpace(config.GithubToken))
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", config.GithubToken);
    }

    public bool Listo => !string.IsNullOrWhiteSpace(_config.GithubToken) && !string.IsNullOrWhiteSpace(_config.GithubRepo);

    private string Url(string ruta) => $"{_config.GithubApi.TrimEnd('/')}/repos/{_config.GithubRepo}/contents/{string.Join('/', ruta.Split('/').Select(Uri.EscapeDataString))}";

    // Regresa (contenido, sha) o (null, null) si no existe
    public async Task<(byte[]? Datos, string? Sha)> LeerAsync(string ruta)
    {
        var r = await _http.GetAsync($"{Url(ruta)}?ref={_config.GithubRama}");
        if (r.StatusCode == HttpStatusCode.NotFound) return (null, null);
        if (!r.IsSuccessStatusCode) throw new Exception($"GitHub respondió {(int)r.StatusCode}: {await r.Content.ReadAsStringAsync()}");
        using var doc = JsonDocument.Parse(await r.Content.ReadAsStringAsync());
        var sha = doc.RootElement.GetProperty("sha").GetString();
        var b64 = doc.RootElement.TryGetProperty("content", out var c) ? (c.GetString() ?? "").Replace("\n", "") : "";
        if (sha != null) _shas[ruta] = sha;
        return (b64.Length > 0 ? Convert.FromBase64String(b64) : Array.Empty<byte>(), sha);
    }

    // Sube o reemplaza un archivo. Si no le pasas el sha, lo busca solo.
    public async Task SubirAsync(string ruta, byte[] datos, string mensaje, string? sha = null)
    {
        await _turno.WaitAsync();
        try
        {
            for (var intento = 0; intento < 2; intento++)
            {
                sha ??= _shas.GetValueOrDefault(ruta) ?? (await LeerShaAsync(ruta));
                var cuerpo = new Dictionary<string, object?>
                {
                    ["message"] = mensaje,
                    ["content"] = Convert.ToBase64String(datos),
                    ["branch"] = _config.GithubRama,
                };
                if (sha != null) cuerpo["sha"] = sha;
                using var contenido = new StringContent(JsonSerializer.Serialize(cuerpo), Encoding.UTF8, "application/json");
                var r = await _http.PutAsync(Url(ruta), contenido);
                var txt = await r.Content.ReadAsStringAsync();
                if (r.IsSuccessStatusCode)
                {
                    try { using var doc = JsonDocument.Parse(txt); _shas[ruta] = doc.RootElement.GetProperty("content").GetProperty("sha").GetString()!; }
                    catch { _shas.Remove(ruta); }
                    return;
                }
                // El sha que teníamos ya no es el último: lo buscamos otra vez
                if ((r.StatusCode == HttpStatusCode.Conflict || (int)r.StatusCode == 422) && intento == 0)
                {
                    _shas.Remove(ruta);
                    sha = await LeerShaAsync(ruta);
                    continue;
                }
                throw new Exception($"GitHub respondió {(int)r.StatusCode}: {txt}");
            }
        }
        finally { _turno.Release(); }
    }

    private async Task<string?> LeerShaAsync(string ruta)
    {
        var r = await _http.GetAsync($"{Url(ruta)}?ref={_config.GithubRama}");
        if (r.StatusCode == HttpStatusCode.NotFound) return null;
        if (!r.IsSuccessStatusCode) throw new Exception($"GitHub respondió {(int)r.StatusCode}: {await r.Content.ReadAsStringAsync()}");
        using var doc = JsonDocument.Parse(await r.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("sha").GetString();
    }

    public async Task BorrarAsync(string ruta, string mensaje)
    {
        var sha = await LeerShaAsync(ruta);
        if (sha == null) return;
        var cuerpo = JsonSerializer.Serialize(new { message = mensaje, sha, branch = _config.GithubRama });
        using var req = new HttpRequestMessage(HttpMethod.Delete, Url(ruta)) { Content = new StringContent(cuerpo, Encoding.UTF8, "application/json") };
        var r = await _http.SendAsync(req);
        _shas.Remove(ruta);
        if (!r.IsSuccessStatusCode) throw new Exception($"GitHub respondió {(int)r.StatusCode}: {await r.Content.ReadAsStringAsync()}");
    }
}
