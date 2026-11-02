namespace Bot224;

// Revisa cada minuto si el server sigue vivo. Si se cae, avisa en Discord; si vuelve, también.
public class Vigilante
{
    private readonly Rcon _rcon;
    private readonly Webhook _webhook;
    private bool? _prendido;      // null = todavía no sabemos
    private int _fallos;
    public bool Silencio { get; set; } // para cuando Dylan lo apaga a propósito

    public Vigilante(Rcon rcon, Webhook webhook)
    {
        _rcon = rcon;
        _webhook = webhook;
    }

    public async Task CorrerAsync(CancellationToken cancelar)
    {
        while (!cancelar.IsCancellationRequested)
        {
            var vivo = await RevisarAsync();
            if (vivo)
            {
                _fallos = 0;
                if (_prendido == false)
                {
                    Console.WriteLine("[Vigilante] El server volvió");
                    if (!Silencio) await _webhook.EnviarAsync("🟢 **El server ya volvió.** ¡A jugar!");
                    Silencio = false;
                }
                _prendido = true;
            }
            else if (++_fallos >= 3 && _prendido != false) // 3 minutos seguidos sin contestar
            {
                Console.WriteLine("[Vigilante] El server no contesta");
                if (_prendido == true && !Silencio)
                    await _webhook.EnviarAsync("🔴 **Se cayó el server.** Ya le avisamos a Dylan, no desesperen.");
                _prendido = false;
            }
            await Task.Delay(TimeSpan.FromMinutes(1), cancelar).ContinueWith(_ => { });
        }
    }

    private class EstadoGuardado { public bool? Prendido { get; set; } public int Fallos { get; set; } public bool Silencio { get; set; } }
    private const string RutaEstado = "vigilante.json";

    // Una sola revisión (modo GitHub): el estado se guarda entre corridas
    public async Task PasoAsync(bool vivo)
    {
        var e = Archivo.Leer<EstadoGuardado>(RutaEstado);
        if (vivo)
        {
            if (e.Prendido == false && !e.Silencio) await _webhook.EnviarAsync("🟢 **El server ya volvió.** ¡A jugar!");
            if (e.Prendido == false) e.Silencio = false;
            e.Prendido = true; e.Fallos = 0;
        }
        else if (++e.Fallos >= 2 && e.Prendido != false)
        {
            if (e.Prendido == true && !e.Silencio) await _webhook.EnviarAsync("🔴 **Se cayó el server.** Ya le avisamos a Dylan, no desesperen.");
            e.Prendido = false;
        }
        Archivo.Guardar(RutaEstado, e);
    }

    public static void Mantenimiento()
    {
        var e = Archivo.Leer<EstadoGuardado>(RutaEstado);
        e.Silencio = true;
        Archivo.Guardar(RutaEstado, e);
    }

    private async Task<bool> RevisarAsync()
    {
        try
        {
            var intento = _rcon.ComandoAsync("list");
            var gano = await Task.WhenAny(intento, Task.Delay(TimeSpan.FromSeconds(10)));
            if (gano != intento) { _ = intento.ContinueWith(_ => { }); return false; }
            await intento;
            return true;
        }
        catch
        {
            return false;
        }
    }
}
