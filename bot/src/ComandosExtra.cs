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

    // ---------- /medallas ----------
    private object MedallasCmd(JsonElement i)
    {
        var yo = MiJugador(i);
        if (yo == null) return Texto("Todavia no se cual eres en Minecraft. Usa `/entrar` o pidele a Dylan que te vincule.");
        var principal = _alias.Principal(yo);
        var mias = _pagina.Meds.De(principal);
        var lineas = mias.Take(15).Select(m => $"**{m.Nombre}** — {Medallas.Niveles[Math.Clamp(m.Nivel, 0, 4)]}").ToList();
        if (lineas.Count == 0) lineas.Add("Todavia no tienes ninguna. La primera cae rapido.");
        if (mias.Count > 15) lineas.Add($"...y {mias.Count - 15} mas.");
        // La que le queda mas cerca, con las stats que el bot ya tiene
        var j = _pagina.Ultima?.Jugadores.FirstOrDefault(x => x.Nombre.Equals(principal, StringComparison.OrdinalIgnoreCase));
        if (j != null)
        {
            var v = new Dictionary<string, double>
            {
                ["horas"] = j.Horas, ["minado"] = j.S.Minado, ["diamantes"] = j.S.Diamantes, ["mobs"] = j.S.Mobs,
                ["metros"] = j.S.Metros, ["record"] = j.S.Record, ["muertes"] = j.S.Muertes, ["netherita"] = j.S.Netherita,
            };
            var cerca = Medallas.Categorias.Where(c => v.ContainsKey(c.Stat))
                .Select(c => (C: c, Meta: c.Metas.FirstOrDefault(m => m > v[c.Stat]), Valor: v[c.Stat]))
                .Where(x => x.Meta > 0).OrderByDescending(x => x.Valor / x.Meta).FirstOrDefault();
            if (cerca.C != null)
                lineas.Add($"\nLa que te queda mas cerca: **{cerca.C.Nombre}** ({Stats.Num((int)cerca.Valor)} de {Stats.Num(cerca.Meta)} {cerca.C.Unidad})");
        }
        return Embed(new { title = $"Medallas de {principal}", description = string.Join("\n", lineas), color = 0xF5C451 }, ("Ver todas", Perfil(principal)));
    }

    // ---------- /semana ----------
    private object SemanaCmd(JsonElement i)
    {
        var yo = MiJugador(i);
        if (yo == null) return Texto("Todavia no se cual eres en Minecraft. Usa `/entrar` o pidele a Dylan que te vincule.");
        var foto = _pagina.Ultima;
        if (foto == null) return Texto("Todavia estoy juntando los datos, intenta en un minuto.");
        var principal = _alias.Principal(yo);
        var mia = foto.Semana.FirstOrDefault(x => x.Key.Equals(principal, StringComparison.OrdinalIgnoreCase)).Value;
        if (mia == null || mia.Values.All(x => x == 0)) return Texto("Esta semana no has jugado nada. Entra, que te estan ganando.");
        int V(string k) => mia.GetValueOrDefault(k);
        var orden = foto.Semana.OrderByDescending(x => x.Value.GetValueOrDefault("minutos")).Select(x => x.Key).ToList();
        var lugar = orden.FindIndex(n => n.Equals(principal, StringComparison.OrdinalIgnoreCase)) + 1;
        return Embed(new
        {
            title = $"La semana de {principal}",
            description =
                $"Tiempo jugado: **{Stats.Tiempo(V("minutos"))}**\n" +
                $"Bloques minados: **{Stats.Num(V("minado"))}**\n" +
                $"Mobs matados: **{Stats.Num(V("mobs"))}**\n" +
                $"Diamantes: **{Stats.Num(V("diamantes"))}**\n" +
                $"Metros caminados: **{Stats.Num(V("metros"))}**\n" +
                $"Muertes: **{Stats.Num(V("muertes"))}**\n\n" +
                $"Vas #{lugar} de {orden.Count} en horas jugadas esta semana.",
            color = 0x5FD068,
        }, ("Ver el ranking", "#ranking"));
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

}
