using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// Meter gente a la whitelist: Java, Bedrock o las dos (y si son las dos, se unen solas).
// Lo usan el botón de /entrar y el comando "alta" de la consola.
public class Altas
{
    public static readonly Regex RegexJava = new(@"^[A-Za-z0-9_]{3,16}$");
    public static readonly Regex RegexBedrock = new(@"^[A-Za-z0-9 ]{3,16}$");

    private const string RutaPendientes = "pendientes_bedrock.json";
    private static readonly string Geyser = Environment.GetEnvironmentVariable("M224_GEYSER") ?? "https://api.geysermc.org";

    private readonly Config _config;
    private readonly Rcon _rcon;
    private readonly Alias _alias;
    private readonly Func<string, string, Task> _unir;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(10) };
    private readonly object _candado = new();

    public Altas(Config config, Rcon rcon, Alias alias, Func<string, string, Task> unir)
    {
        _config = config; _rcon = rcon; _alias = alias; _unir = unir;
    }

    // Cómo sale un gamertag dentro del server con Floodgate: con punto y sin espacios
    public static string NombreBedrock(string gamertag) => "." + gamertag.Trim().Replace(' ', '_');

    // Lineas: lo que ve todos; NotaAdmin: lo técnico, solo para Dylan
    public record Resultado(bool JavaOk, bool BedrockOk, bool BedrockPendiente, string? Principal, List<string> Lineas, string? NotaAdmin);

    public async Task<Resultado> DarDeAltaAsync(string? java, string? bedrock)
    {
        java = string.IsNullOrWhiteSpace(java) ? null : java.Trim();
        bedrock = string.IsNullOrWhiteSpace(bedrock) ? null : Regex.Replace(bedrock.Trim(), " +", " ");
        var lineas = new List<string>();
        string? notaAdmin = null;
        bool javaOk = false, bedrockOk = false, pendiente = false;

        if (java != null)
        {
            var r = (await _rcon.ComandoAsync($"whitelist add {java}")).Trim();
            Console.WriteLine($"[Whitelist] Java {java}: {r}");
            if (r.Contains("does not exist", StringComparison.OrdinalIgnoreCase) || EsError(r))
                lineas.Add($"⚠️ Java **{java}**: el server dijo `{r}`. Revisa que esté bien escrito.");
            else
            {
                javaOk = true;
                lineas.Add($"✅ Java: **{java}**");
            }
        }

        if (bedrock != null)
        {
            var (ok, texto) = await WhitelistBedrockAsync(bedrock);
            if (ok)
            {
                bedrockOk = true;
                lineas.Add($"✅ Bedrock: **{bedrock}** (en el server sale como `{NombreBedrock(bedrock)}`)");
                QuitarPendiente(bedrock);
            }
            else
            {
                // Lo más seguro es que Geyser/Floodgate todavía no esté puesto: se guarda para después
                pendiente = true;
                AgregarPendiente(bedrock);
                lineas.Add($"⏳ Bedrock: **{bedrock}** queda apuntado; entra en cuanto el server tenga lo de Bedrock.");
                notaAdmin = $"Bedrock **{bedrock}** no se pudo meter todavía (`{texto}`). Quedó guardado: cuando ya esté Geyser + Floodgate escribe `bedrock` en la consola del bot y se meten todos los pendientes.";
            }
        }

        // La cuenta "principal" es la de Java si tiene; si no, la de Bedrock
        var principal = javaOk ? java : (bedrock != null ? NombreBedrock(bedrock) : null);
        if (java != null && javaOk && bedrock != null)
        {
            var otro = NombreBedrock(bedrock);
            if (!_alias.Principal(otro).Equals(java, StringComparison.OrdinalIgnoreCase))
                await _unir(java, otro);
            lineas.Add($"🔗 **{java}** y **{otro}** quedaron unidos: todo lo que haga en cualquiera de las dos cuenta junto.");
        }
        return new Resultado(javaOk, bedrockOk, pendiente, principal, lineas, notaAdmin);
    }

    // Mete a un jugador de Bedrock a la whitelist. Plan A: fwhitelist de Floodgate.
    // Plan B (si el server no reconoce fwhitelist): escribe directo en whitelist.json y hace "whitelist reload".
    // El UUID sale de la API de GeyserMC o, si está caída, del log del server (cuando el jugador ya intentó entrar).
    private async Task<(bool, string)> WhitelistBedrockAsync(string gamertag)
    {
        var nombreServer = NombreBedrock(gamertag);
        string? uuid = null;
        try
        {
            using var doc = JsonDocument.Parse(await _http.GetStringAsync($"{Geyser}/v2/xbox/xuid/{Uri.EscapeDataString(gamertag)}"));
            if (doc.RootElement.TryGetProperty("xuid", out var x))
            {
                var xuid = x.ValueKind == JsonValueKind.Number ? x.GetUInt64() : ulong.Parse(x.GetString() ?? "0");
                if (xuid > 0) uuid = UuidFloodgate(xuid);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Whitelist] La API de GeyserMC no me dio el ID de {gamertag} ({ex.Message}). Lo busco en el log del server.");
        }
        uuid ??= BuscarEnLog(nombreServer);

        string r;
        try { r = (await _rcon.ComandoAsync($"fwhitelist add {uuid ?? gamertag.Replace(' ', '_')}")).Trim(); }
        catch { return (false, "server apagado"); }
        Console.WriteLine($"[Whitelist] Bedrock {gamertag} ({uuid ?? "sin UUID"}): {r}");
        if (!EsError(r)) return (true, r);

        // Plan B
        if (uuid == null)
            return (false, "no sé su ID todavía: que intente entrar una vez al server y luego escribe bedrock en el bot");
        try
        {
            if (!AgregarAWhitelistJson(uuid, nombreServer)) return (false, "no encontré whitelist.json (revisa carpeta_server en config.json)");
            var rr = (await _rcon.ComandoAsync("whitelist reload")).Trim();
            Console.WriteLine($"[Whitelist] {nombreServer} agregado directo a whitelist.json ({uuid}). {rr}");
            return (true, "agregado a whitelist.json");
        }
        catch (Exception ex) { return (false, ex.Message); }
    }

    private static readonly Regex RegexUuidFloodgate = new(@"00000000-0000-0000-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    private static readonly Regex RegexXuid = new(@"xuid\D{0,3}(\d{10,20})", RegexOptions.IgnoreCase);

    // Busca en logs/latest.log una línea con el nombre del jugador y su UUID de Floodgate (o su xuid)
    private string? BuscarEnLog(string nombreServer)
    {
        try
        {
            var ruta = _config.RutaLog;
            if (!File.Exists(ruta)) return null;
            using var fs = new FileStream(ruta, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            using var sr = new StreamReader(fs);
            var lineas = sr.ReadToEnd().Split('\n');
            var sinPunto = nombreServer.TrimStart('.');
            for (var i = lineas.Length - 1; i >= 0; i--)
            {
                var l = lineas[i];
                if (l.IndexOf(sinPunto, StringComparison.OrdinalIgnoreCase) < 0 && l.IndexOf(sinPunto.Replace('_', ' '), StringComparison.OrdinalIgnoreCase) < 0) continue;
                var m = RegexUuidFloodgate.Match(l);
                if (m.Success) return m.Value.ToLower();
                var x = RegexXuid.Match(l);
                if (x.Success && ulong.TryParse(x.Groups[1].Value, out var xuid)) return UuidFloodgate(xuid);
            }
        }
        catch (Exception ex) { Console.WriteLine($"[Whitelist] No pude leer el log: {ex.Message}"); }
        return null;
    }

    // Agrega {uuid, name} a whitelist.json del server (si no estaba)
    private bool AgregarAWhitelistJson(string uuid, string nombre)
    {
        var ruta = Path.Combine(_config.CarpetaServer, "whitelist.json");
        if (!File.Exists(ruta)) return false;
        var lista = System.Text.Json.Nodes.JsonNode.Parse(File.ReadAllText(ruta)) as System.Text.Json.Nodes.JsonArray ?? new();
        if (lista.Any(e => string.Equals((string?)e?["uuid"], uuid, StringComparison.OrdinalIgnoreCase))) return true;
        lista.Add(new System.Text.Json.Nodes.JsonObject { ["uuid"] = uuid, ["name"] = nombre });
        File.WriteAllText(ruta, lista.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        return true;
    }

    // Floodgate arma el UUID así: 00000000-0000-0000-XXXX-XXXXXXXXXXXX con el xuid en hexadecimal
    public static string UuidFloodgate(ulong xuid)
    {
        var h = xuid.ToString("x16");
        return $"00000000-0000-0000-{h[..4]}-{h[4..]}";
    }

    private static bool EsError(string r) =>
        r.StartsWith("Unknown", StringComparison.OrdinalIgnoreCase)
        || r.Contains("<--[HERE]")
        || r.Contains("Incorrect argument", StringComparison.OrdinalIgnoreCase)
        || r.Contains("couldn't", StringComparison.OrdinalIgnoreCase)
        || r.Contains("could not", StringComparison.OrdinalIgnoreCase)
        || r.Contains("not found", StringComparison.OrdinalIgnoreCase)
        || r.Contains("error", StringComparison.OrdinalIgnoreCase);

    // ---------- Los de Bedrock que faltan (cuando todavía no hay Floodgate) ----------
    public List<string> Pendientes() { lock (_candado) return Archivo.Leer<List<string>>(RutaPendientes); }

    private void AgregarPendiente(string gamertag)
    {
        lock (_candado)
        {
            var l = Archivo.Leer<List<string>>(RutaPendientes);
            if (!l.Any(x => x.Equals(gamertag, StringComparison.OrdinalIgnoreCase))) l.Add(gamertag);
            Archivo.Guardar(RutaPendientes, l);
        }
    }

    private void QuitarPendiente(string gamertag)
    {
        lock (_candado)
        {
            var l = Archivo.Leer<List<string>>(RutaPendientes);
            if (l.RemoveAll(x => x.Equals(gamertag, StringComparison.OrdinalIgnoreCase)) > 0) Archivo.Guardar(RutaPendientes, l);
        }
    }

    // Consola: "bedrock" -> vuelve a intentar con todos los pendientes
    public async Task ReintentarAsync()
    {
        var l = Pendientes();
        if (l.Count == 0) { Console.WriteLine("No hay nadie de Bedrock pendiente 👍"); return; }
        foreach (var g in l)
        {
            var (ok, texto) = await WhitelistBedrockAsync(g);
            if (ok) QuitarPendiente(g);
            Console.WriteLine(ok ? $"  ✅ {g}" : $"  ⏳ {g}: {texto}");
        }
        var quedan = Pendientes().Count;
        Console.WriteLine(quedan == 0 ? "Listo, ya están todos los de Bedrock." : $"Faltan {quedan}. ¿Ya está puesto Floodgate y el server prendido?");
    }
}
