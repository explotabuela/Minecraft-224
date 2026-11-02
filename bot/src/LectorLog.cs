using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// Lee latest.log del server en tiempo real y manda a Discord
// las entradas, salidas, chat, muertes y logros.
public class LectorLog
{
    private readonly Config _config;
    private readonly Webhook _webhook;
    private readonly Webhook _webhookChat; // el chat puede ir a su propio canal
    private readonly Rachas _rachas;
    private readonly Wrapped _wrapped;
    private readonly Alias _alias;
    private readonly Presencia _presencia;
    private readonly Desaparecidos? _desaparecidos;
    private readonly HashSet<string> _jugadores = new(StringComparer.OrdinalIgnoreCase);
    private long _posicion;

    private static readonly Regex RegexLinea = new(@"^\[[^\]]*\] \[[^\]]*\]: (.*)$");
    private static readonly Regex RegexLogin = new(@"^(" + Alias.PatronNombre + @")\[/.*\] logged in with entity id");
    private static readonly Regex RegexSalida = new(@"^(" + Alias.PatronNombre + @") lost connection:");
    private static readonly Regex RegexCabeza = new(@"^\[\w* ?head\] ");
    private static readonly Regex RegexLogro = new(@"^(" + Alias.PatronNombre + @") has (?:made the advancement|completed the challenge|reached the goal) \[(.+)\]");
    private static readonly Regex RegexChat = new(@"^(" + Alias.PatronNombre + @"): (.+)$");

    public LectorLog(Config config, Webhook webhook, Webhook webhookChat, Rachas rachas, Wrapped wrapped,
        Alias alias, Presencia presencia, Desaparecidos? desaparecidos)
    {
        _alias = alias;
        _presencia = presencia;
        _desaparecidos = desaparecidos;
        _config = config;
        _webhook = webhook;
        _webhookChat = webhookChat;
        _rachas = rachas;
        _wrapped = wrapped;
        CargarJugadoresConocidos();
    }

    // Los que ya han entrado alguna vez están en usercache.json
    private void CargarJugadoresConocidos()
    {
        try
        {
            if (!File.Exists(_config.RutaUsercache)) return;
            using var doc = JsonDocument.Parse(File.ReadAllText(_config.RutaUsercache));
            foreach (var e in doc.RootElement.EnumerateArray())
                if (e.TryGetProperty("name", out var n) && n.GetString() is { } nombre)
                    _jugadores.Add(nombre);
            Console.WriteLine($"[Log] {_jugadores.Count} jugadores conocidos");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Log] No se pudo leer usercache.json: {ex.Message}");
        }
    }

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        // Empezar desde el final para no repetir lo viejo
        _posicion = File.Exists(_config.RutaLog) ? new FileInfo(_config.RutaLog).Length : 0;
        Console.WriteLine($"[Log] Leyendo {_config.RutaLog}");

        while (!cancelar.IsCancellationRequested)
        {
            try
            {
                foreach (var linea in LeerNuevas())
                    await ProcesarAsync(linea);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Log] Error: {ex.Message}");
            }
            await Task.Delay(1000, cancelar).ContinueWith(_ => { });
        }
    }

    private List<string> LeerNuevas()
    {
        var lineas = new List<string>();
        if (!File.Exists(_config.RutaLog)) return lineas;

        using var fs = new FileStream(_config.RutaLog, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        // Si el archivo se hizo más chico, el server se reinició y empezó un log nuevo
        if (fs.Length < _posicion) { _posicion = 0; _presencia.Reinicio(); }
        fs.Seek(_posicion, SeekOrigin.Begin);
        using var lector = new StreamReader(fs, Encoding.UTF8);
        var texto = lector.ReadToEnd();

        // Solo procesar hasta el último salto de línea completo
        var ultimo = texto.LastIndexOf('\n');
        if (ultimo < 0) return lineas;
        var completo = texto[..(ultimo + 1)];
        _posicion += Encoding.UTF8.GetByteCount(completo);

        foreach (var l in completo.Split('\n'))
            if (l.Trim().Length > 0) lineas.Add(l.TrimEnd('\r'));
        return lineas;
    }

    private async Task ProcesarAsync(string linea)
    {
        var m = RegexLinea.Match(linea);
        if (!m.Success) return;
        var mensaje = m.Groups[1].Value;

        // Guardar nombres de los que se conectan
        var login = RegexLogin.Match(mensaje);
        if (login.Success)
        {
            var nombre = login.Groups[1].Value;
            _jugadores.Add(nombre);
            var jugador = _alias.Principal(nombre);
            _presencia.Entro(jugador);
            if (_desaparecidos != null) await _desaparecidos.RegresoAsync(jugador);
            _wrapped.Entro(jugador);

            // Racha de días seguidos: se anuncia desde el día 2
            var racha = _rachas.Registrar(jugador, DateTime.Now);
            if (racha >= 2)
                await _webhook.EnviarAsync($"🔥 **{jugador}** lleva **{racha} días seguidos** en la 224", jugador, Webhook.Cara(jugador));
            return;
        }

        var salida = RegexSalida.Match(mensaje);
        if (salida.Success)
        {
            _presencia.Salio(_alias.Principal(salida.Groups[1].Value));
            return;
        }

        const string prefijo = "System chat: ";
        if (!mensaje.StartsWith(prefijo)) return;
        var texto = mensaje[prefijo.Length..];

        // Quitar la cabeza (en el log sale como "[explotabuela head]" o "[ head]")
        var cabeza = RegexCabeza.Match(texto);
        if (cabeza.Success) texto = texto[cabeza.Length..];
        // Ignorar respuestas de comandos y mods, tipo "[explotabuela: ...]" o "[Chunky] ..."
        else if (texto.StartsWith("[")) return;

        // ¿Es chat normal?
        var chat = RegexChat.Match(texto);
        if (chat.Success && _jugadores.Contains(chat.Groups[1].Value))
        {
            var jugador = _alias.Principal(chat.Groups[1].Value);
            _wrapped.Mensaje(jugador);
            await _webhookChat.EnviarAsync(chat.Groups[2].Value, jugador, Webhook.Cara(jugador));
            return;
        }

        // Logros (para el Wrapped: primer diamante, Nether, End...)
        var logro = RegexLogro.Match(texto);
        if (logro.Success && _jugadores.Contains(logro.Groups[1].Value))
            _wrapped.Logro(_alias.Principal(logro.Groups[1].Value), logro.Groups[2].Value);

        // ¿De qué jugador habla el mensaje?
        // Primero el que sale al inicio (el que murió / entró), si no, cualquiera que se mencione
        var quien = _jugadores.FirstOrDefault(j => texto.StartsWith(j + " ", StringComparison.OrdinalIgnoreCase))
                    ?? _jugadores.FirstOrDefault(j => Regex.IsMatch(texto, $@"\b{Regex.Escape(j)}\b", RegexOptions.IgnoreCase));
        if (quien == null) return;

        var muerte = texto.EndsWith("por tonto");
        if (muerte)
        {
            var principal = _alias.Principal(quien);
            _wrapped.Muerte(principal, texto, _jugadores, quien);
            _presencia.Murio(principal, Wrapped.Causa(quien, texto, _jugadores));
        }
        var emoji = muerte ? "💀 " : "";
        // Los de Bedrock: primero se consigue su skin para que no salga Steve
        if (quien.StartsWith('.') && Skins.Instancia != null) await Skins.Instancia.AsegurarAsync(quien, _alias);
        await _webhook.EnviarAsync($"{emoji}**{texto}**", quien, Webhook.Cara(quien));
    }
}
