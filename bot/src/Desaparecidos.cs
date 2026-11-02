namespace Bot224;

// Si alguien deja de entrar: a los 7 días "¿alguien sabe si sigue vivo?",
// a los 14 un cartel de SE BUSCA, a los 30 Q.E.P.D. Y cuando regresa, se celebra.
public class Desaparecidos
{
    private const string Ruta = "desaparecidos.json";
    private readonly Rachas _rachas;
    private readonly Anunciador _avisos;
    private readonly Dictionary<string, int> _nivel; // jugador -> 0,1,2,3 (ya avisado)
    private bool _primeraVez;

    public Desaparecidos(Rachas rachas, Anunciador avisos)
    {
        _rachas = rachas;
        _avisos = avisos;
        _primeraVez = !File.Exists(Ruta);
        _nivel = Archivo.Leer<Dictionary<string, int>>(Ruta);
    }

    private static readonly string[] Frases =
    {
        "Se fue a comprar leche y nunca volvió.",
        "Lo último que dijo fue \"ahorita vengo\".",
        "Dicen que sigue minando en algún lugar.",
        "Se lo llevó un Enderman.",
    };

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        // Esperar a que Discord se conecte para que los avisos salgan con botón
        await Task.Delay(TimeSpan.FromMinutes(1), cancelar).ContinueWith(_ => { });
        while (!cancelar.IsCancellationRequested)
        {
            try { await RevisarAsync(); }
            catch (Exception ex) { Console.WriteLine($"[Desaparecidos] Error: {ex.Message}"); }
            await Task.Delay(TimeSpan.FromHours(1), cancelar).ContinueWith(_ => { });
        }
    }

    public async Task RevisarAsync()
    {
        // Solo de día, para no avisar a las 3 am
        if (DateTime.Now.Hour < 12 && !_primeraVez) return;
        var hoy = DateTime.Today;
        foreach (var (jug, d) in _rachas.Todos())
        {
            if (!DateTime.TryParse(d.UltimoDia, out var ultimo)) continue;
            var dias = (hoy - ultimo).Days;
            var toca = dias >= 30 ? 3 : dias >= 14 ? 2 : dias >= 7 ? 1 : 0;
            var ya = _nivel.GetValueOrDefault(jug);
            if (toca <= ya) continue;
            _nivel[jug] = toca;
            if (_primeraVez) continue; // la primera vez solo se apunta, sin avisar
            var visto = ultimo.ToString("d 'de' MMMM", new System.Globalization.CultureInfo("es-MX"));
            var boton = new[] { ("Ver su perfil", "#j-" + Uri.EscapeDataString(jug)) };
            if (toca == 1)
                await _avisos.AnunciarAsync($"👀 ¿Alguien sabe algo de **{jug}**? Lleva **{dias} días** sin entrar a la 224.", botones: boton, nombre: jug, avatar: Webhook.Cara(jug));
            else if (toca == 2)
                await _avisos.AnunciarAsync("", new
                {
                    title = "🔎 SE BUSCA",
                    description = $"## {jug}\nVisto por última vez: **{visto}**\nLleva **{dias} días** desaparecido.\n\nRecompensa: 1 pan y 3 semillas.\nSi lo ven, díganle que la 224 lo extraña.",
                    color = 0xB5651D,
                    image = new { url = Skins.CuerpoUrl(jug) },
                }, boton);
            else
                await _avisos.AnunciarAsync("", new
                {
                    title = $"🪦 Q.E.P.D. {jug}",
                    description = $"Su última vez en la 224 fue el **{visto}**.\n*{Frases[Math.Abs(jug.GetHashCode()) % Frases.Length]}*\n\nSi regresa, lo recibimos como si nada.",
                    color = 0x2C2F33,
                    thumbnail = new { url = Skins.Cabeza(jug) },
                }, boton);
        }
        _primeraVez = false;
        Archivo.Guardar(Ruta, _nivel);
    }

    // Llamar ANTES de registrar la racha del día: si llevaba 7+ días sin entrar, se celebra
    public async Task RegresoAsync(string jugador)
    {
        var d = _rachas.Todos().GetValueOrDefault(jugador);
        if (d == null || !DateTime.TryParse(d.UltimoDia, out var ultimo)) return;
        var dias = (DateTime.Today - ultimo).Days;
        _nivel.Remove(jugador);
        Archivo.Guardar(Ruta, _nivel);
        if (dias < 7) return;
        var texto = dias >= 30 ? $"⚡ **¡{jugador} RESUCITÓ!** Volvió de entre los muertos después de **{dias} días**."
                  : $"🎉 **¡{jugador} volvió!** Llevaba **{dias} días** sin entrar a la 224.";
        await _avisos.AnunciarAsync(texto, nombre: jugador, avatar: Webhook.Cara(jugador));
    }
}
