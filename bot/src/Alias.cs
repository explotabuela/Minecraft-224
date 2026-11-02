using System.Text.RegularExpressions;

namespace Bot224;

// Una misma persona con varios nombres (Java y Bedrock, o si se cambió el nombre).
// Todo se suma en el nombre principal. Se arma con /unir.
public class Alias
{
    private const string Ruta = "alias.json";
    private readonly object _candado = new();
    private readonly Dictionary<string, string> _mapa; // otro nombre (tal cual) -> nombre principal

    // Nombres válidos de Java (3-16) y de Bedrock con Floodgate (empiezan con ".")
    public static readonly Regex RegexNombre = new(@"^\.?[A-Za-z0-9_]{2,16}$");
    public const string PatronNombre = @"\.?[A-Za-z0-9_]{2,16}";

    public Alias()
    {
        _mapa = new(Archivo.Leer<Dictionary<string, string>>(Ruta), StringComparer.OrdinalIgnoreCase);
    }

    public string Principal(string nombre)
    {
        lock (_candado) return _mapa.GetValueOrDefault(nombre, nombre);
    }

    // Todos los nombres que son de esta persona (incluido el principal)
    public List<string> NombresDe(string principal)
    {
        lock (_candado)
        {
            var lista = new List<string> { principal };
            lista.AddRange(_mapa.Where(x => x.Value.Equals(principal, StringComparison.OrdinalIgnoreCase) && !x.Key.Equals(principal, StringComparison.OrdinalIgnoreCase))
                .Select(x => x.Key));
            return lista;
        }
    }

    public void Unir(string principal, string otro)
    {
        lock (_candado)
        {
            principal = _mapa.GetValueOrDefault(principal, principal);
            _mapa.Remove(otro);
            _mapa[otro] = principal;
            // Si "otro" era principal de alguien más, ahora todos apuntan al nuevo
            foreach (var k in _mapa.Where(x => x.Value.Equals(otro, StringComparison.OrdinalIgnoreCase)).Select(x => x.Key).ToList())
                _mapa[k] = principal;
            Archivo.Guardar(Ruta, _mapa);
        }
    }

    public bool Separar(string otro)
    {
        lock (_candado)
        {
            if (!_mapa.Remove(otro)) return false;
            Archivo.Guardar(Ruta, _mapa);
            return true;
        }
    }

    public Dictionary<string, string> Todos() { lock (_candado) return new(_mapa); }
}
