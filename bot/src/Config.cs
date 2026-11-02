using System.Text.Json;
using System.Text.Json.Serialization;

namespace Bot224;

// Lo que se lee de config.json
public class Config
{
    [JsonPropertyName("webhook_url")] public string WebhookUrl { get; set; } = "";
    [JsonPropertyName("carpeta_server")] public string CarpetaServer { get; set; } = "";
    [JsonPropertyName("rcon_host")] public string RconHost { get; set; } = "localhost";
    [JsonPropertyName("rcon_puerto")] public int RconPuerto { get; set; } = 25575;
    [JsonPropertyName("rcon_password")] public string RconPassword { get; set; } = "";
    [JsonPropertyName("dia_ranking")] public DayOfWeek DiaRanking { get; set; } = DayOfWeek.Sunday;
    [JsonPropertyName("hora_ranking")] public int HoraRanking { get; set; } = 20;

    // Para actualizar la página web sola (opcional)
    [JsonPropertyName("github_token")] public string GithubToken { get; set; } = "";
    [JsonPropertyName("github_repo")] public string GithubRepo { get; set; } = "";
    [JsonPropertyName("github_rama")] public string GithubRama { get; set; } = "main";
    [JsonPropertyName("github_api")] public string GithubApi { get; set; } = "https://api.github.com";
    [JsonPropertyName("minutos_pagina")] public int MinutosPagina { get; set; } = 10;

    // Bot de Discord de verdad: comandos, chat de dos sentidos y whitelist (opcional)
    [JsonPropertyName("discord_token")] public string DiscordToken { get; set; } = "";
    [JsonPropertyName("canal_chat_id")] public string CanalChatId { get; set; } = "";
    [JsonPropertyName("canal_capturas_id")] public string CanalCapturasId { get; set; } = "";
    [JsonPropertyName("admin_id")] public string AdminId { get; set; } = "";
    [JsonPropertyName("webhook_chat")] public string WebhookChat { get; set; } = "";
    [JsonPropertyName("ip_server")] public string IpServer { get; set; } = "";
    [JsonPropertyName("puerto_bedrock")] public int PuertoBedrock { get; set; } = 19132;
    [JsonPropertyName("version")] public string Version { get; set; } = "26.3";
    // Cuándo abre el server (con la hora de Sinaloa, -07:00). Para la cuenta regresiva en Discord.
    [JsonPropertyName("inauguracion")] public string Inauguracion { get; set; } = "2026-12-15T16:00:00-07:00";
    // Cuándo se abre el Nether solo (el bot lo abre por RCON y avisa en Discord)
    [JsonPropertyName("apertura_nether")] public string AperturaNether { get; set; } = "2026-12-22T16:00:00-07:00";
    [JsonPropertyName("hora_resumen")] public int HoraResumen { get; set; } = 22;
    [JsonPropertyName("discord_api")] public string DiscordApi { get; set; } = "https://discord.com/api/v10";
    [JsonPropertyName("discord_gateway")] public string DiscordGateway { get; set; } = "wss://gateway.discord.gg/?v=10&encoding=json";

    [JsonPropertyName("canal_avisos_id")] public string CanalAvisosId { get; set; } = "";
    [JsonPropertyName("pagina_url")] public string PaginaUrlManual { get; set; } = "";

    // Link de la página: el que pongas, o el de GitHub Pages sacado de github_repo
    public string PaginaUrl
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(PaginaUrlManual)) return PaginaUrlManual.TrimEnd('/') + "/";
            var partes = GithubRepo.Split('/');
            return partes.Length == 2 ? $"https://{partes[0].ToLower()}.github.io/{partes[1]}/" : "https://github.com/";
        }
    }

    public string RutaLog => Path.Combine(CarpetaServer, "logs", "latest.log");
    public string RutaUsercache => Path.Combine(CarpetaServer, "usercache.json");

    public static Config Cargar(string ruta)
    {
        var opciones = new JsonSerializerOptions
        {
            Converters = { new JsonStringEnumConverter() },
            ReadCommentHandling = JsonCommentHandling.Skip,
            AllowTrailingCommas = true,
        };
        var texto = File.ReadAllText(ruta);
        return JsonSerializer.Deserialize<Config>(texto, opciones)
               ?? throw new Exception("No se pudo leer config.json");
    }
}
