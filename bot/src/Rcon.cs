using System.Net.Sockets;
using System.Text;

namespace Bot224;

// Cliente RCON: la "puerta" para mandarle comandos al server de Minecraft
public class Rcon
{
    private readonly string _host;
    private readonly int _puerto;
    private readonly string _password;

    public Rcon(string host, int puerto, string password)
    {
        _host = host;
        _puerto = puerto;
        _password = password;
    }

    // Se conecta, se identifica, manda el comando y regresa la respuesta
    public async Task<string> ComandoAsync(string comando)
    {
        using var tcp = new TcpClient();
        await tcp.ConnectAsync(_host, _puerto);
        using var stream = tcp.GetStream();

        // Tipo 3 = login
        await EnviarAsync(stream, 1, 3, _password);
        var (idLogin, _, _) = await LeerAsync(stream);
        if (idLogin == -1)
            throw new Exception("Contraseña de RCON incorrecta");

        // Tipo 2 = comando
        await EnviarAsync(stream, 2, 2, comando);
        var (_, _, respuesta) = await LeerAsync(stream);
        return respuesta;
    }

    // Varios comandos con una sola conexión (más rápido y no llena la consola)
    public async Task<List<string>> VariosAsync(IEnumerable<string> comandos)
    {
        using var tcp = new TcpClient();
        await tcp.ConnectAsync(_host, _puerto);
        using var stream = tcp.GetStream();
        await EnviarAsync(stream, 1, 3, _password);
        var (idLogin, _, _) = await LeerAsync(stream);
        if (idLogin == -1) throw new Exception("Contraseña de RCON incorrecta");

        var respuestas = new List<string>();
        var id = 10;
        foreach (var c in comandos)
        {
            await EnviarAsync(stream, id++, 2, c);
            var (_, _, r) = await LeerAsync(stream);
            respuestas.Add(r);
        }
        return respuestas;
    }

    // Formato del paquete: [largo][id][tipo][texto\0][\0], todo en little-endian
    private static async Task EnviarAsync(NetworkStream stream, int id, int tipo, string texto)
    {
        var cuerpo = Encoding.UTF8.GetBytes(texto);
        var largo = 4 + 4 + cuerpo.Length + 2;
        var paquete = new byte[4 + largo];
        BitConverter.GetBytes(largo).CopyTo(paquete, 0);
        BitConverter.GetBytes(id).CopyTo(paquete, 4);
        BitConverter.GetBytes(tipo).CopyTo(paquete, 8);
        cuerpo.CopyTo(paquete, 12);
        await stream.WriteAsync(paquete);
    }

    private static async Task<(int id, int tipo, string texto)> LeerAsync(NetworkStream stream)
    {
        var largo = BitConverter.ToInt32(await LeerExactoAsync(stream, 4));
        var datos = await LeerExactoAsync(stream, largo);
        var id = BitConverter.ToInt32(datos, 0);
        var tipo = BitConverter.ToInt32(datos, 4);
        var texto = Encoding.UTF8.GetString(datos, 8, Math.Max(0, largo - 10));
        return (id, tipo, texto);
    }

    private static async Task<byte[]> LeerExactoAsync(NetworkStream stream, int cantidad)
    {
        var buffer = new byte[cantidad];
        var leidos = 0;
        while (leidos < cantidad)
        {
            var n = await stream.ReadAsync(buffer.AsMemory(leidos, cantidad - leidos));
            if (n == 0) throw new Exception("El server cerró la conexión RCON");
            leidos += n;
        }
        return buffer;
    }
}
