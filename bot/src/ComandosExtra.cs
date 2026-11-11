using System.Text.Json;
using System.Text.RegularExpressions;

namespace Bot224;

// Comandos nuevos: /muertes /medallas /semana /calendario /mision /tumba /reglas /ayuda
// /sugerencia /reporte y /estado (solo para Dylan).
public partial class Comandos
{
    private static readonly Regex RegexScore = new(@"has (-?\d+)");

    private static readonly string[] Causas =
    {
        "no se sabe", "la lava", "ahogado", "el fuego", "una caida", "el vacio",
        "un creeper", "una flecha", "un mob", "la nieve en polvo", "un jefe",
    };

    private async Task<int> ScoreAsync(string jugador, string objetivo)
    {
        var r = await _rcon.ComandoAsync($"scoreboard players get {jugador} {objetivo}");
        var m = RegexScore.Match(r);
        return m.Success ? int.Parse(m.Groups[1].Value) : 0;
    }

    private string? MiJugador(JsonElement i) => _vinculos.Jugador(Discord.UsuarioId(i));

    private static string Dim(int d) => d switch { 1 => " (Nether)", 2 => " (End)", _ => "" };

    // ---------- /muertes ----------
    private async Task<object> MuertesAsync(JsonElement i)
    {
        var yo = MiJugador(i);
        if (yo == null) return Texto("Todavia no se cual eres en Minecraft. Usa `/entrar` o pidele a Dylan que te vincule.");
        var lineas = new List<string>();
        for (var k = 1; k <= 5; k++)
        {
            var c = await ScoreAsync(yo, $"j_m{k}");
            if (c <= 0 && k > 1) break;
            lineas.Add($"**{k}.** te mato {Causas[Math.Clamp(c, 0, Causas.Length - 1)]}");
        }
        if (lineas.Count == 0) lineas.Add("Todavia no te has muerto. Felicidades.");
        return Embed(new
        {
            title = "Tus ultimas muertes",
            description = string.Join("\n", lineas),
            color = 0xB03030,
        });
    }

    // ---------- /tumba ----------
    private async Task<object> TumbaAsync(JsonElement i)
    {
        var yo = MiJugador(i);
        if (yo == null) return Texto("Todavia no se cual eres en Minecraft. Usa `/entrar` o pidele a Dylan que te vincule.");
        var x = await ScoreAsync(yo, "j_tmbx");
        var y = await ScoreAsync(yo, "j_tmby");
        var z = await ScoreAsync(yo, "j_tmbz");
        var d = await ScoreAsync(yo, "j_tmbd");
        if (x == 0 && y == 0 && z == 0) return Texto("No tienes ninguna tumba guardada. O no te has muerto con cosas, o ya la recogiste.");
        return Embed(new
        {
            title = "Tu ultima tumba",
            description = $"**X: {x}   Y: {y}   Z: {z}**{Dim(d)}\n\nDale click a la tumba para recuperar tus cosas.\nSi no es tuya, se abre para todos a las 24 horas.",
            color = 0x8A8A8A,
        });
    }

    // ---------- /mision ----------
    private async Task<object> MisionAsync(JsonElement i)
    {
        var yo = MiJugador(i);
        if (yo == null) return Texto("Todavia no se cual eres en Minecraft. Usa `/entrar` o pidele a Dylan que te vincule.");
        var semana = await ScoreAsync("#semana", "j_var");
        var lista = Jefes.Misiones[Math.Clamp(semana, 0, Jefes.Misiones.Length - 1)];
        var lineas = new List<string>();
        for (var k = 1; k <= 4 && k <= lista.Length; k++)
        {
            var hecho = await ScoreAsync(yo, $"j_ml{k}");
            var meta = await ScoreAsync(yo, $"j_mg{k}");
            if (meta <= 0) meta = 1;
            var listo = hecho >= meta;
            var barra = Barra(hecho, meta);
            lineas.Add($"{(listo ? "✅" : "▫️")} **{lista[k - 1]}**\n{barra} `{Math.Min(hecho, meta)}/{meta}`");
        }
        return Embed(new
        {
            title = $"Tus misiones de la semana {semana + 1}",
            description = string.Join("\n\n", lineas),
            color = 0xFFC94D,
        }, ("Ver en la pagina", "#misiones"));
    }

    private static string Barra(int hecho, int meta)
    {
        var n = meta <= 0 ? 0 : (int)Math.Round(10.0 * Math.Clamp(hecho / (double)meta, 0, 1));
        return new string('█', n) + new string('░', 10 - n);
    }

    // ---------- /calendario ----------
    private object Calendario()
    {
        var lineas = Jefes.Calendario.Select(j =>
        {
            var hubo = DateTimeOffset.TryParse(j.Fecha, out var f);
            var paso = hubo && f < DateTimeOffset.Now;
            var cuando = hubo ? $"<t:{f.ToUnixTimeSeconds()}:D>" : j.Fecha;
            return $"{(paso ? "✅" : "🗓️")} **{j.Nombre}** — {cuando}{(paso ? "" : $" · {j.Pista}")}";
        });
        return Embed(new
        {
            title = "Calendario de la 224",
            description = string.Join("\n", lineas) + "\n\nTodos los sabados a las **5:10 pm**.",
            color = 0xFFC94D,
        }, ("Ver los jefes", "#jefes"));
    }

    // ---------- /reglas ----------
    private object Reglas() => Embed(new
    {
        title = "Reglas de la 224",
        description =
            "**1.** Nada de robar ni grifear.\n" +
            "**2.** No se destruye lo de nadie.\n" +
            "**3.** Sin trampas ni x-ray.\n" +
            "**4.** Respeto en el chat y en la llamada.\n\n" +
            "El que le haga a la maña se va. Sin avisos.",
        color = 0xFFC94D,
    }, ("Ver en la pagina", "#reglas"));

    // ---------- /ayuda ----------
    private object Ayuda() => Embed(new
    {
        title = "Todos los comandos",
        description =
            "`/ip` — la IP para entrar\n" +
            "`/entrar` — pide que te metan a la whitelist\n" +
            "`/online` — quien esta jugando ahorita\n" +
            "`/jefe` — cuando y donde sale el proximo jefe\n" +
            "`/calendario` — los 8 jefes con fecha\n" +
            "`/stats` — las stats de alguien\n" +
            "`/carta` — tu carta: nivel, rango y clase\n" +
            "`/vs` — compara dos jugadores\n" +
            "`/top` — el top 10 de lo que quieras\n" +
            "`/liga` — como va la liga del mes\n" +
            "`/mision` — tus misiones y tu avance\n" +
            "`/muertes` — tus ultimas muertes y que te mato\n" +
            "`/tumba` — donde quedo tu ultima tumba\n" +
            "`/medallas` — las que llevas\n" +
            "`/semana` — tu resumen de la semana\n" +
            "`/wrapped` — tu Wrapped del mes, por privado\n" +
            "`/reglas` — las reglas\n" +
            "`/sugerencia` — mandale una idea a Dylan\n" +
            "`/reporte` — avisa de un problema, en privado\n" +
            "`/chiste` — un chiste malo",
        color = 0x5FD068,
    }, ("Ver la pagina", ""));

    // ---------- /sugerencia y /reporte ----------
    private async Task<object> BuzonAsync(JsonElement i, bool reporte)
    {
        var texto = Discord.Opcion(i, "texto") ?? "";
        if (texto.Trim().Length < 4) return Texto("Escribe un poquito mas.");
        var quien = Discord.UsuarioId(i);
        var yo = MiJugador(i);
        await _discord.MandarDmAsync(_config.AdminId, new
        {
            embeds = new[]
            {
                new
                {
                    title = reporte ? "🚨 Reporte" : "💡 Sugerencia",
                    description = $"De <@{quien}>{(yo != null ? $" ({yo})" : "")}\n\n{texto}",
                    color = reporte ? 0xB03030 : 0xFFC94D,
                },
            },
        });
        return Texto(reporte
            ? "Listo, ya le llego a Dylan en privado. Gracias por avisar."
            : "Listo, ya le llego tu idea a Dylan. Gracias.");
    }

    // ---------- /estado (solo Dylan) ----------
    private async Task<object> EstadoAsync(JsonElement i)
    {
        if (Discord.UsuarioId(i) != _config.AdminId) return Texto("Ese comando es solo para Dylan.");
        var lista = await _rcon.ComandoAsync("list");
        var tps = await Admin.TpsAsync(_rcon);
        var semana = await ScoreAsync("#semana", "j_var");
        var muertes = await ScoreAsync("#muertes", "j_var");
        var lunas = await ScoreAsync("#lunas", "j_var");
        return Embed(new
        {
            title = "Estado del server",
            description =
                $"**TPS:** {(tps > 0 ? tps.ToString("0.0") : "?")} {(tps >= 18 ? "🟢" : tps >= 14 ? "🟡" : "🔴")}\n" +
                $"**Jugadores:** {lista.Trim()}\n" +
                $"**Semana de dificultad:** {semana}\n" +
                $"**Muertes en total:** {muertes}\n" +
                $"**Lunas de sangre:** {lunas}",
            color = 0x5FD068,
        });
    }
}
