using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Bot224;

// Manda mensajes a Discord por medio de un webhook.
// Cada mensaje puede salir con el nombre y la cara del jugador.
public class Webhook
{
    private readonly HttpClient _http = new();
    private readonly string _url;
    private readonly SemaphoreSlim _turno = new(1, 1);

    public Webhook(string url) => _url = url;

    public static string Cara(string jugador) => Skins.Cabeza(jugador);

    public async Task EnviarAsync(string texto, string? nombre = null, string? avatar = null, object? embed = null)
    {
        var datos = new Dictionary<string, object?>
        {
            ["content"] = texto,
            ["username"] = nombre ?? "Minecraft 224",
            ["avatar_url"] = avatar,
            ["allowed_mentions"] = new { parse = Array.Empty<string>() }
        };
        if (embed != null) datos["embeds"] = new[] { embed };

        // Uno por uno, para no saturar a Discord
        await _turno.WaitAsync();
        try
        {
            for (var intento = 0; intento < 3; intento++)
            {
                using var cuerpo = new StringContent(JsonSerializer.Serialize(datos), System.Text.Encoding.UTF8, "application/json");
                var resp = await _http.PostAsync(_url, cuerpo);
                if (resp.StatusCode != HttpStatusCode.TooManyRequests)
                {
                    if (!resp.IsSuccessStatusCode)
                        Console.WriteLine($"[Discord] Error {(int)resp.StatusCode}: {await resp.Content.ReadAsStringAsync()}");
                    break;
                }
                // Discord pidió esperar
                var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
                var segundos = json.TryGetProperty("retry_after", out var r) ? r.GetDouble() : 1;
                await Task.Delay(TimeSpan.FromSeconds(segundos + 0.2));
            }
            await Task.Delay(300);
        }
        finally
        {
            _turno.Release();
        }
    }
}
