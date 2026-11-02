namespace Bot224;

// Manda los avisos importantes (medallas, campeón, desaparecidos, resumen...).
// Si el bot de Discord está conectado, salen con botón a la página.
// Si no, salen por el webhook de siempre (sin botón).
public class Anunciador
{
    private readonly Config _config;
    private readonly Webhook _webhook;
    private Discord? _discord;
    private string? _canal;

    public Anunciador(Config config, Webhook webhook)
    {
        _config = config;
        _webhook = webhook;
    }

    public async Task ConectarAsync(Discord discord)
    {
        _discord = discord;
        _canal = string.IsNullOrWhiteSpace(_config.CanalAvisosId) ? await discord.CanalDeWebhookAsync(_config.WebhookUrl) : _config.CanalAvisosId;
        if (_canal != null) Console.WriteLine("[Avisos] Los avisos van a salir con botón a la página ✔");
    }

    public string Url(string ancla = "") => _config.PaginaUrl + ancla;

    public async Task AnunciarAsync(string texto, object? embed = null, (string Texto, string Ancla)[]? botones = null, string? nombre = null, string? avatar = null)
    {
        if (_discord is { Conectado: true } && _canal != null)
        {
            var msg = new Dictionary<string, object?>
            {
                ["content"] = texto,
                ["allowed_mentions"] = new { parse = Array.Empty<string>() },
            };
            if (embed != null) msg["embeds"] = new[] { embed };
            if (botones is { Length: > 0 }) msg["components"] = Discord.Botones(botones.Select(b => (b.Texto, Url(b.Ancla))).ToArray());
            if (await _discord.EnviarCanalAsync(_canal, msg) != null) return;
        }
        await _webhook.EnviarAsync(texto, nombre, avatar, embed);
    }
}
