using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Bot224;

// Baja la skin real de cada jugador (Java: Mojang, Bedrock: GeyserMC) y la sube a la página.
// Así la página no depende de otras páginas de skins que a veces fallan o dan a Steve.
public class Skins
{
    public static Stats? Fuente;

    // Para las imágenes de Discord: usa el UUID si se sabe (sale la skin correcta)
    public static Skins? Instancia;
    public static string UrlBase = ""; // link de la página (para las caras de Discord)

    // Cara y cuerpo para Discord: los que sube el bot a la página; si todavía no hay, mc-heads
    private static Info? InfoDe(string nombre)
    {
        if (Instancia == null) return null;
        var principal = Fuente?.PrincipalDe(nombre) ?? nombre;
        return new[] { nombre, principal }.Select(k => Instancia._datos.GetValueOrDefault(k)).FirstOrDefault(i => i != null && i.Cara != "");
    }
    public static string Cabeza(string nombre)
    {
        var i = InfoDe(nombre);
        return i != null && UrlBase != "" ? $"{UrlBase}{i.Cara}?v={i.Hash}" : $"https://mc-heads.net/avatar/{Id(nombre)}/128";
    }
    public static string CuerpoUrl(string nombre)
    {
        var i = InfoDe(nombre);
        return i != null && i.Cuerpo != "" && UrlBase != "" ? $"{UrlBase}{i.Cuerpo}?v={i.Hash}" : $"https://mc-heads.net/body/{Id(nombre)}/200";
    }
    public static string Id(string nombre)
    {
        try
        {
            // Bedrock: mc-heads no conoce su UUID, pero sí acepta el ID de la textura de su skin
            if (Instancia != null)
            {
                var principal = Fuente?.PrincipalDe(nombre) ?? nombre;
                foreach (var k in new[] { nombre, principal })
                    if (Instancia._datos.TryGetValue(k, out var i) && i.Textura != "" && (k.StartsWith('.') || Fuente == null || !Fuente.Uuids().ContainsKey(k.ToLower())))
                        return i.Textura;
            }
            if (Fuente != null && Fuente.Uuids().TryGetValue(nombre.ToLower(), out var u)) return u;
            // Bedrock unido a una cuenta de Java: se usa la skin de su cuenta de Java
            if (Fuente != null && nombre.StartsWith('.'))
            {
                var principal = Fuente.PrincipalDe(nombre);
                if (Fuente.Uuids().TryGetValue(principal.ToLower(), out var up)) return up;
            }
        }
        catch { }
        return Uri.EscapeDataString(nombre);
    }

    public class Info
    {
        public string Hash { get; set; } = "";
        public bool Slim { get; set; }
        public string Archivo { get; set; } = "";
        public string Revisado { get; set; } = "";
        public string Capa { get; set; } = "";      // archivo de la capa (si tiene)
        public string HashCapa { get; set; } = "";
        public string Textura { get; set; } = "";   // ID de la textura (para la cara en Discord de los de Bedrock)
        public string Cara { get; set; } = "";      // skins/NOMBRE_cara.png (para Discord, ya no depende de otras páginas)
        public string Cuerpo { get; set; } = "";    // skins/NOMBRE_cuerpo.png
    }

    private const string Ruta = "skins.json";
    // Se pueden cambiar para pruebas
    private static readonly string Mojang = Environment.GetEnvironmentVariable("M224_MOJANG") ?? "https://sessionserver.mojang.com";
    private static readonly string Geyser = Environment.GetEnvironmentVariable("M224_GEYSER") ?? "https://api.geysermc.org";
    private readonly Stats _stats;
    private readonly GitHub _github;
    private readonly Dictionary<string, Info> _datos;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };

    public Skins(Stats stats, GitHub github)
    {
        _stats = stats; _github = github; Instancia = this;
        _datos = new Dictionary<string, Info>(Archivo.Leer<Dictionary<string, Info>>(Ruta), StringComparer.OrdinalIgnoreCase);
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("Bot224/1.0");
    }

    // Cuando alguien de Bedrock entra por primera vez, se baja su skin antes de anunciarlo (máximo unos segundos)
    public async Task AsegurarAsync(string nombre, Alias alias)
    {
        var principal = alias.Principal(nombre);
        if (De(principal) is { Textura.Length: > 0 } || De(nombre) is { Textura.Length: > 0 }) return;
        for (var intento = 0; intento < 3; intento++)
        {
            try { await Task.WhenAny(ActualizarAsync(new[] { principal }, alias), Task.Delay(5000)); } catch { }
            if (De(principal) != null) return;
            await Task.Delay(3000); // Floodgate tarda unos segundos en subir la skin
        }
    }

    public Info? De(string nombre) => _datos.TryGetValue(nombre, out var i) && i.Archivo != "" ? i : null;

    // Revisa las skins (cada jugador máximo cada 6 horas) y sube las que cambiaron
    public async Task<bool> ActualizarAsync(IEnumerable<string> jugadores, Alias alias)
    {
        if (!_github.Listo) return false;
        var hubo = false;
        var uuids = _stats.Uuids(conBedrock: true);
        foreach (var principal in jugadores)
        {
            var previo = De(principal);
            if (previo != null && previo.Textura != "" && previo.Cara != "" && DateTime.TryParse(previo.Revisado, out var r) && DateTime.Now - r < TimeSpan.FromHours(6)) continue;
            // Primero la cuenta de Java; si no hay, la de Bedrock
            var nombres = alias.NombresDe(principal).OrderBy(n => n.StartsWith('.') ? 1 : 0);
            foreach (var n in nombres)
            {
                if (!uuids.TryGetValue(n.ToLower(), out var uuid)) continue;
                try
                {
                    var (png, slim, pngCapa) = await BajarAsync(uuid);
                    if (png == null) continue;
                    var hash = Convert.ToHexString(SHA1.HashData(png))[..10].ToLower();
                    var archivo = $"skins/{Uri.EscapeDataString(principal.ToLower())}.png";
                    if (previo == null || previo.Hash != hash)
                    {
                        await _github.SubirAsync(archivo, png, $"Skin de {principal}");
                        Console.WriteLine($"[Skins] Skin de {principal} subida ✔");
                    }
                    var info = new Info { Hash = hash, Slim = slim, Archivo = archivo, Revisado = DateTime.Now.ToString("s"), Textura = UltimaTextura ?? "" };
                    // Cara y cuerpo ya armados, para que Discord no dependa de otras páginas de skins
                    try
                    {
                        var baseNombre = $"skins/{Uri.EscapeDataString(principal.ToLower())}";
                        info.Cara = baseNombre + "_cara.png"; info.Cuerpo = baseNombre + "_cuerpo.png";
                        if (previo == null || previo.Hash != hash || previo.Cara == "")
                        {
                            await _github.SubirAsync(info.Cara, Png.Cara(png), $"Cara de {principal}");
                            await _github.SubirAsync(info.Cuerpo, Png.Cuerpo(png, slim), $"Cuerpo de {principal}");
                        }
                    }
                    catch (Exception ex) { Console.WriteLine($"[Skins] No pude armar la cara de {principal}: {ex.Message}"); info.Cara = info.Cuerpo = ""; }
                    if (n.StartsWith('.')) _datos[n] = info; // también con su nombre de Bedrock
                    if (pngCapa != null)
                    {
                        info.HashCapa = Convert.ToHexString(SHA1.HashData(pngCapa))[..10].ToLower();
                        info.Capa = $"skins/{Uri.EscapeDataString(principal.ToLower())}_capa.png";
                        if (previo == null || previo.HashCapa != info.HashCapa) await _github.SubirAsync(info.Capa, pngCapa, $"Capa de {principal}");
                    }
                    if (previo == null || previo.Hash != hash || previo.Slim != slim || previo.HashCapa != info.HashCapa) hubo = true;
                    _datos[principal] = info;
                    Archivo.Guardar(Ruta, _datos);
                    break;
                }
                catch (Exception ex) { Console.WriteLine($"[Skins] No pude bajar la skin de {principal}: {ex.Message}"); }
            }
        }
        return hubo;
    }

    private string? UltimaTextura;
    private async Task<(byte[]? Png, bool Slim, byte[]? Capa)> BajarAsync(string uuid)
    {
        UltimaTextura = null;
        var limpio = uuid.Replace("-", "");
        string? url = null, capa = null; var slim = false;
        if (limpio.StartsWith("0000000000000000"))
        {
            // Bedrock (Floodgate): el XUID va en los últimos 16 dígitos
            var xuid = Convert.ToUInt64(limpio[16..], 16);
            using var doc = JsonDocument.Parse(await _http.GetStringAsync($"{Geyser}/v2/skin/{xuid}"));
            if (doc.RootElement.TryGetProperty("texture_id", out var t) && t.GetString() is { Length: > 0 } tex)
                url = $"https://textures.minecraft.net/texture/{tex}";
            if (doc.RootElement.TryGetProperty("is_steve", out var st) && st.ValueKind == JsonValueKind.False) slim = true;
        }
        else
        {
            using var doc = JsonDocument.Parse(await _http.GetStringAsync($"{Mojang}/session/minecraft/profile/{limpio}"));
            foreach (var p in doc.RootElement.GetProperty("properties").EnumerateArray())
            {
                if (p.GetProperty("name").GetString() != "textures") continue;
                var json = Encoding.UTF8.GetString(Convert.FromBase64String(p.GetProperty("value").GetString() ?? ""));
                using var tx = JsonDocument.Parse(json);
                if (tx.RootElement.GetProperty("textures").TryGetProperty("SKIN", out var skin))
                {
                    url = skin.GetProperty("url").GetString();
                    if (skin.TryGetProperty("metadata", out var md) && md.TryGetProperty("model", out var m)) slim = m.GetString() == "slim";
                }
                if (tx.RootElement.GetProperty("textures").TryGetProperty("CAPE", out var cp)) capa = cp.GetProperty("url").GetString();
            }
        }
        if (url == null) return (null, false, null);
        UltimaTextura = url.TrimEnd('/').Split('/').Last();
        static string Seguro(string u) => u.StartsWith("http://textures.minecraft.net") ? "https://" + u[7..] : u;
        byte[]? pngCapa = null;
        if (capa != null) { try { pngCapa = await _http.GetByteArrayAsync(Seguro(capa)); } catch { } }
        return (await _http.GetByteArrayAsync(Seguro(url)), slim, pngCapa);
    }
}
