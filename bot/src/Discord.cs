using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Bot224;

// Conexión directa con Discord (sin librerías): el "gateway" para recibir
// mensajes y comandos, y la API normal para contestar.
public class Discord
{
    private readonly Config _config;
    private readonly HttpClient _http = new();
    private int? _secuencia;
    private bool _ackRecibido = true;

    public string AppId { get; private set; } = "";
    public string MiId { get; private set; } = "";
    public List<string> Servidores { get; private set; } = new();
    public bool Conectado => AppId != "";

    // Lo que hace el bot con cada evento (lo conecta Comandos.cs)
    public Func<JsonElement, Task>? AlMensaje;
    public Func<JsonElement, Task>? AlComando;
    public Func<JsonElement, Task>? AlBoton;
    public Func<JsonElement, Task>? AlReaccion;
    public Func<IEnumerable<string>, Task>? AlConectar;

    public Discord(Config config)
    {
        _config = config;
        _http.DefaultRequestHeaders.Authorization = new("Bot", config.DiscordToken);
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("DiscordBot (https://github.com, 1) Bot224");
    }

    // ---------- Gateway: se queda conectado y se reconecta solo ----------
    public async Task CorrerAsync(CancellationToken cancelar)
    {
        var espera = 5;
        while (!cancelar.IsCancellationRequested)
        {
            try
            {
                await SesionAsync(cancelar);
                espera = 5;
            }
            catch (OperationCanceledException) when (cancelar.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                Console.WriteLine($"[Discord] Desconectado: {ex.Message}");
            }
            if (cancelar.IsCancellationRequested) break;
            Console.WriteLine($"[Discord] Reconectando en {espera}s...");
            await Task.Delay(TimeSpan.FromSeconds(espera), cancelar).ContinueWith(_ => { });
            espera = Math.Min(espera * 2, 120);
        }
    }

    private async Task SesionAsync(CancellationToken cancelar)
    {
        using var ws = new ClientWebSocket();
        using var fin = CancellationTokenSource.CreateLinkedTokenSource(cancelar);
        await ws.ConnectAsync(new Uri(_config.DiscordGateway), fin.Token);
        _secuencia = null;

        // 1. Discord dice "hola" y cada cuánto quiere el latido
        var hola = await RecibirAsync(ws, fin.Token) ?? throw new Exception("Discord no saludó");
        var intervalo = hola.GetProperty("d").GetProperty("heartbeat_interval").GetInt32();
        _ackRecibido = true;
        var latido = LatirAsync(ws, intervalo, fin);

        // 2. Identificarse. Intents: servidores (1) + mensajes (512) + reacciones (1024) + contenido de mensajes (32768)
        await EnviarGatewayAsync(ws, new
        {
            op = 2,
            d = new
            {
                token = _config.DiscordToken,
                intents = 1 | 512 | 1024 | 32768,
                properties = new Dictionary<string, string> { ["os"] = "windows", ["browser"] = "Bot224", ["device"] = "Bot224" },
            },
        }, fin.Token);

        try
        {
            // 3. Escuchar eventos
            while (ws.State == WebSocketState.Open && !fin.IsCancellationRequested)
            {
                var msg = await RecibirAsync(ws, fin.Token);
                if (msg is not { } m) break;
                var op = m.GetProperty("op").GetInt32();
                if (m.TryGetProperty("s", out var s) && s.ValueKind == JsonValueKind.Number) _secuencia = s.GetInt32();

                switch (op)
                {
                    case 0: // evento
                        var tipo = m.GetProperty("t").GetString();
                        var d = m.GetProperty("d").Clone();
                        _ = Task.Run(() => DespacharAsync(tipo, d));
                        break;
                    case 1: // Discord pide latido ya
                        await EnviarGatewayAsync(ws, new { op = 1, d = _secuencia }, fin.Token);
                        break;
                    case 7: // "reconéctate"
                        throw new Exception("Discord pidió reconectar");
                    case 9: // sesión inválida
                        await Task.Delay(Random.Shared.Next(1000, 5000), fin.Token);
                        throw new Exception("Sesión inválida");
                    case 11: // ack del latido
                        _ackRecibido = true;
                        break;
                }
            }

            if (ws.CloseStatus is { } cierre)
            {
                var codigo = (int)cierre;
                if (codigo == 4004) throw new Exception("El discord_token está mal. Revísalo en config.json");
                if (codigo == 4014) throw new Exception("Falta prender 'Message Content Intent' en el portal de Discord");
                throw new Exception($"Discord cerró la conexión ({codigo} {ws.CloseStatusDescription})");
            }
        }
        finally
        {
            fin.Cancel();
            await latido.ContinueWith(_ => { });
        }
    }

    private async Task LatirAsync(ClientWebSocket ws, int intervalo, CancellationTokenSource fin)
    {
        try
        {
            await Task.Delay((int)(intervalo * Random.Shared.NextDouble()), fin.Token);
            while (!fin.IsCancellationRequested && ws.State == WebSocketState.Open)
            {
                if (!_ackRecibido) { ws.Abort(); return; } // Discord no contestó: conexión muerta
                _ackRecibido = false;
                await EnviarGatewayAsync(ws, new { op = 1, d = _secuencia }, fin.Token);
                await Task.Delay(intervalo, fin.Token);
            }
        }
        catch { }
    }

    private async Task DespacharAsync(string? tipo, JsonElement d)
    {
        try
        {
            switch (tipo)
            {
                case "READY":
                    AppId = d.GetProperty("application").GetProperty("id").GetString() ?? "";
                    MiId = d.GetProperty("user").GetProperty("id").GetString() ?? "";
                    var servidores = d.GetProperty("guilds").EnumerateArray()
                        .Select(g => g.GetProperty("id").GetString() ?? "").ToList();
                    Servidores = servidores;
                    Console.WriteLine($"[Discord] Conectado como {d.GetProperty("user").GetProperty("username").GetString()} ✔");
                    if (AlConectar != null) await AlConectar(servidores);
                    break;
                case "MESSAGE_CREATE":
                    if (AlMensaje != null) await AlMensaje(d);
                    break;
                case "MESSAGE_REACTION_ADD":
                    if (AlReaccion != null) await AlReaccion(d);
                    break;
                case "INTERACTION_CREATE":
                    var t = d.GetProperty("type").GetInt32();
                    if (t == 2 && AlComando != null) await AlComando(d);
                    if (t == 3 && AlBoton != null) await AlBoton(d);
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Discord] Error en {tipo}: {ex.Message}");
        }
    }

    private static async Task<JsonElement?> RecibirAsync(ClientWebSocket ws, CancellationToken cancelar)
    {
        var buffer = new byte[16 * 1024];
        using var ms = new MemoryStream();
        while (true)
        {
            var r = await ws.ReceiveAsync(buffer, cancelar);
            if (r.MessageType == WebSocketMessageType.Close) return null;
            ms.Write(buffer, 0, r.Count);
            if (r.EndOfMessage) break;
        }
        using var doc = JsonDocument.Parse(ms.ToArray());
        return doc.RootElement.Clone();
    }

    private readonly SemaphoreSlim _envio = new(1, 1);
    private async Task EnviarGatewayAsync(ClientWebSocket ws, object datos, CancellationToken cancelar)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(datos);
        await _envio.WaitAsync(cancelar);
        try { await ws.SendAsync(bytes, WebSocketMessageType.Text, true, cancelar); }
        finally { _envio.Release(); }
    }

    private bool _ultimoOk;

    // ---------- API normal (contestar, registrar comandos) ----------
    public async Task<JsonElement?> ApiAsync(HttpMethod metodo, string ruta, object? cuerpo = null)
    {
        for (var intento = 0; intento < 3; intento++)
        {
            using var req = new HttpRequestMessage(metodo, _config.DiscordApi.TrimEnd('/') + ruta);
            if (cuerpo != null)
                req.Content = new StringContent(JsonSerializer.Serialize(cuerpo), Encoding.UTF8, "application/json");
            using var resp = await _http.SendAsync(req);
            var texto = await resp.Content.ReadAsStringAsync();

            if (resp.StatusCode == HttpStatusCode.TooManyRequests)
            {
                var seg = 1.0;
                try { seg = JsonDocument.Parse(texto).RootElement.GetProperty("retry_after").GetDouble(); } catch { }
                await Task.Delay(TimeSpan.FromSeconds(seg + 0.2));
                continue;
            }
            _ultimoOk = resp.IsSuccessStatusCode;
            if (!resp.IsSuccessStatusCode)
            {
                Console.WriteLine($"[Discord] {metodo} {ruta} -> {(int)resp.StatusCode}: {texto}");
                return null;
            }
            if (string.IsNullOrWhiteSpace(texto)) return null;
            return JsonDocument.Parse(texto).RootElement.Clone();
        }
        return null;
    }

    // "Pensando..." (Discord da solo 3 segundos para contestar; así nos da 15 minutos)
    public Task EsperarAsync(JsonElement i, bool privado = false) =>
        ApiAsync(HttpMethod.Post, $"/interactions/{i.GetProperty("id").GetString()}/{i.GetProperty("token").GetString()}/callback",
            new { type = 5, data = new { flags = privado ? 64 : 0 } });

    // Para botones: "ya lo vi" sin mandar mensaje nuevo
    public Task EsperarBotonAsync(JsonElement i) =>
        ApiAsync(HttpMethod.Post, $"/interactions/{i.GetProperty("id").GetString()}/{i.GetProperty("token").GetString()}/callback",
            new { type = 6 });

    // Cambia la respuesta (después de EsperarAsync / EsperarBotonAsync)
    public Task EditarRespuestaAsync(JsonElement i, object datos) =>
        ApiAsync(HttpMethod.Patch, $"/webhooks/{AppId}/{i.GetProperty("token").GetString()}/messages/@original", datos);

    // Mensaje extra privado (solo lo ve quien picó)
    public Task MensajePrivadoAsync(JsonElement i, string texto) =>
        ApiAsync(HttpMethod.Post, $"/webhooks/{AppId}/{i.GetProperty("token").GetString()}",
            new { content = texto, flags = 64 });

    public Task ReaccionarAsync(string canal, string mensaje, string emoji) =>
        ApiAsync(HttpMethod.Put, $"/channels/{canal}/messages/{mensaje}/reactions/{Uri.EscapeDataString(emoji)}/@me");

    // Mensaje normal del bot en un canal (con botones si se quiere)
    public Task<JsonElement?> EnviarCanalAsync(string canal, object mensaje) =>
        ApiAsync(HttpMethod.Post, $"/channels/{canal}/messages", mensaje);

    // Mensaje privado (DM) a un usuario
    public async Task<bool> MandarDmAsync(string usuario, object mensaje)
    {
        var dm = await ApiAsync(HttpMethod.Post, "/users/@me/channels", new { recipient_id = usuario });
        if (dm is not { } d || !d.TryGetProperty("id", out var id)) return false;
        return await EnviarCanalAsync(id.GetString()!, mensaje) != null;
    }

    // Roles (para "Campeón de Diciembre 2026")
    public async Task<string?> CrearRolAsync(string servidor, string nombre, int color)
    {
        var r = await ApiAsync(HttpMethod.Post, $"/guilds/{servidor}/roles", new { name = nombre, color, hoist = false, mentionable = false });
        return r is { } x && x.TryGetProperty("id", out var id) ? id.GetString() : null;
    }

    public async Task<bool> DarRolAsync(string servidor, string usuario, string rol) =>
        await ApiAsync(HttpMethod.Put, $"/guilds/{servidor}/members/{usuario}/roles/{rol}") != null || _ultimoOk;

    // De qué canal es un webhook (para mandar avisos con botones en el mismo canal)
    public async Task<string?> CanalDeWebhookAsync(string urlWebhook)
    {
        try
        {
            using var h = new HttpClient();
            var txt = await h.GetStringAsync(urlWebhook);
            using var doc = JsonDocument.Parse(txt);
            return doc.RootElement.GetProperty("channel_id").GetString();
        }
        catch { return null; }
    }

    // Botón que lleva a la página
    public static object Botones(params (string Texto, string Url)[] links) => new[]
    {
        new { type = 1, components = links.Select(l => (object)new { type = 2, style = 5, label = l.Texto, url = l.Url }).ToArray() },
    };

    public Task RegistrarComandosAsync(string servidor, JsonArray comandos) =>
        ApiAsync(HttpMethod.Put, $"/applications/{AppId}/guilds/{servidor}/commands", comandos);

    // ---------- Ayudas para leer interacciones ----------
    public static string UsuarioId(JsonElement i) =>
        (i.TryGetProperty("member", out var m) ? m.GetProperty("user") : i.GetProperty("user")).GetProperty("id").GetString() ?? "";

    public static string? Opcion(JsonElement i, string nombre)
    {
        if (!i.GetProperty("data").TryGetProperty("options", out var ops)) return null;
        foreach (var o in ops.EnumerateArray())
            if (o.GetProperty("name").GetString() == nombre) return o.GetProperty("value").ToString();
        return null;
    }
}
