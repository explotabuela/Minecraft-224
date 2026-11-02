namespace Bot224;

// Qué usuario de Discord es qué jugador de Minecraft (se arma con /entrar o /vincular)
public class Vinculos
{
    private const string Ruta = "vinculos.json";
    private readonly object _candado = new();
    private readonly Dictionary<string, string> _d; // id de Discord -> jugador

    public Vinculos() { _d = Archivo.Leer<Dictionary<string, string>>(Ruta); }

    public string? Jugador(string discordId) { lock (_candado) return _d.GetValueOrDefault(discordId); }

    public string? DiscordDe(string jugador)
    {
        lock (_candado) return _d.FirstOrDefault(x => x.Value.Equals(jugador, StringComparison.OrdinalIgnoreCase)).Key;
    }

    public void Poner(string discordId, string jugador)
    {
        lock (_candado) { _d[discordId] = jugador; Archivo.Guardar(Ruta, _d); }
    }

    public void Renombrar(string viejo, string nuevo)
    {
        lock (_candado)
        {
            foreach (var k in _d.Where(x => x.Value.Equals(viejo, StringComparison.OrdinalIgnoreCase)).Select(x => x.Key).ToList()) _d[k] = nuevo;
            Archivo.Guardar(Ruta, _d);
        }
    }
}
