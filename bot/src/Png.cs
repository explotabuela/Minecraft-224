using System.IO.Compression;

namespace Bot224;

// PNG sencillo (sin librerías): leer las skins y armar la cara y el cuerpo para Discord.
public static class Png
{
    public record Imagen(int Ancho, int Alto, byte[] Rgba);

    public static Imagen Leer(byte[] png)
    {
        int ancho = 0, alto = 0, bits = 0, tipo = 0;
        byte[]? paleta = null, alfaPaleta = null;
        using var idat = new MemoryStream();
        var p = 8;
        while (p + 8 <= png.Length)
        {
            var largo = (png[p] << 24) | (png[p + 1] << 16) | (png[p + 2] << 8) | png[p + 3];
            var nombre = System.Text.Encoding.ASCII.GetString(png, p + 4, 4);
            var datos = p + 8;
            if (nombre == "IHDR")
            {
                ancho = (png[datos] << 24) | (png[datos + 1] << 16) | (png[datos + 2] << 8) | png[datos + 3];
                alto = (png[datos + 4] << 24) | (png[datos + 5] << 16) | (png[datos + 6] << 8) | png[datos + 7];
                bits = png[datos + 8]; tipo = png[datos + 9];
                if (png[datos + 12] != 0) throw new NotSupportedException("PNG entrelazado");
            }
            else if (nombre == "PLTE") paleta = png[datos..(datos + largo)];
            else if (nombre == "tRNS") alfaPaleta = png[datos..(datos + largo)];
            else if (nombre == "IDAT") idat.Write(png, datos, largo);
            else if (nombre == "IEND") break;
            p = datos + largo + 4;
        }
        if (bits != 8) throw new NotSupportedException("Solo PNG de 8 bits");
        var canales = tipo switch { 6 => 4, 2 => 3, 3 => 1, 0 => 1, 4 => 2, _ => throw new NotSupportedException("Tipo de PNG raro") };
        idat.Position = 0;
        using var z = new ZLibStream(idat, CompressionMode.Decompress);
        using var crudo = new MemoryStream();
        z.CopyTo(crudo);
        var d = crudo.ToArray();
        var fila = ancho * canales;
        var img = new byte[alto * fila];
        for (int y = 0; y < alto; y++)
        {
            var f = d[y * (fila + 1)];
            var o = y * (fila + 1) + 1;
            for (int x = 0; x < fila; x++)
            {
                int a = x >= canales ? img[y * fila + x - canales] : 0;
                int b = y > 0 ? img[(y - 1) * fila + x] : 0;
                int c = x >= canales && y > 0 ? img[(y - 1) * fila + x - canales] : 0;
                int v = d[o + x];
                v += f switch { 1 => a, 2 => b, 3 => (a + b) / 2, 4 => Paeth(a, b, c), _ => 0 };
                img[y * fila + x] = (byte)v;
            }
        }
        var rgba = new byte[ancho * alto * 4];
        for (int i = 0; i < ancho * alto; i++)
        {
            switch (tipo)
            {
                case 6: Array.Copy(img, i * 4, rgba, i * 4, 4); break;
                case 2: rgba[i * 4] = img[i * 3]; rgba[i * 4 + 1] = img[i * 3 + 1]; rgba[i * 4 + 2] = img[i * 3 + 2]; rgba[i * 4 + 3] = 255; break;
                case 0: rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = img[i]; rgba[i * 4 + 3] = 255; break;
                case 4: rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = img[i * 2]; rgba[i * 4 + 3] = img[i * 2 + 1]; break;
                case 3:
                    var k = img[i];
                    rgba[i * 4] = paleta![k * 3]; rgba[i * 4 + 1] = paleta[k * 3 + 1]; rgba[i * 4 + 2] = paleta[k * 3 + 2];
                    rgba[i * 4 + 3] = alfaPaleta != null && k < alfaPaleta.Length ? alfaPaleta[k] : (byte)255;
                    break;
            }
        }
        return new Imagen(ancho, alto, rgba);
    }

    private static int Paeth(int a, int b, int c)
    {
        int p = a + b - c, pa = Math.Abs(p - a), pb = Math.Abs(p - b), pc = Math.Abs(p - c);
        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    }

    public static byte[] Escribir(Imagen im)
    {
        using var datos = new MemoryStream();
        using (var z = new ZLibStream(datos, CompressionLevel.Optimal, true))
            for (int y = 0; y < im.Alto; y++) { z.WriteByte(0); z.Write(im.Rgba, y * im.Ancho * 4, im.Ancho * 4); }
        using var ms = new MemoryStream();
        ms.Write(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 });
        var ihdr = new byte[13];
        Be(ihdr, 0, im.Ancho); Be(ihdr, 4, im.Alto); ihdr[8] = 8; ihdr[9] = 6;
        Pedazo(ms, "IHDR", ihdr); Pedazo(ms, "IDAT", datos.ToArray()); Pedazo(ms, "IEND", Array.Empty<byte>());
        return ms.ToArray();
    }

    private static void Be(byte[] b, int o, int v) { b[o] = (byte)(v >> 24); b[o + 1] = (byte)(v >> 16); b[o + 2] = (byte)(v >> 8); b[o + 3] = (byte)v; }
    private static void Pedazo(Stream s, string nombre, byte[] datos)
    {
        var len = new byte[4]; Be(len, 0, datos.Length); s.Write(len);
        var tipo = System.Text.Encoding.ASCII.GetBytes(nombre);
        s.Write(tipo); s.Write(datos);
        var crc = Crc(tipo, datos); var c = new byte[4]; Be(c, 0, (int)crc); s.Write(c);
    }
    private static uint[]? _tabla;
    private static uint Crc(byte[] a, byte[] b)
    {
        if (_tabla == null)
        {
            _tabla = new uint[256];
            for (uint n = 0; n < 256; n++) { var c = n; for (int k = 0; k < 8; k++) c = (c & 1) != 0 ? 0xEDB88320 ^ (c >> 1) : c >> 1; _tabla[n] = c; }
        }
        uint crc = 0xFFFFFFFF;
        foreach (var x in a) crc = _tabla[(crc ^ x) & 0xFF] ^ (crc >> 8);
        foreach (var x in b) crc = _tabla[(crc ^ x) & 0xFF] ^ (crc >> 8);
        return crc ^ 0xFFFFFFFF;
    }

    // Copia un pedazo de la skin (x,y,w,h) a (dx,dy) escalado; con "encima" respeta lo transparente
    private static void Pegar(Imagen skin, Imagen dst, int sx, int sy, int w, int h, int dx, int dy, int esc, bool encima, bool espejo = false)
    {
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
            {
                var srcX = sx + (espejo ? w - 1 - x : x);
                if (srcX >= skin.Ancho || sy + y >= skin.Alto) continue;
                var s = ((sy + y) * skin.Ancho + srcX) * 4;
                var a = skin.Rgba[s + 3];
                if (encima && a < 128) continue;
                for (int yy = 0; yy < esc; yy++)
                    for (int xx = 0; xx < esc; xx++)
                    {
                        var d = (((dy + y) * esc + yy) * dst.Ancho + (dx + x) * esc + xx) * 4;
                        dst.Rgba[d] = skin.Rgba[s]; dst.Rgba[d + 1] = skin.Rgba[s + 1]; dst.Rgba[d + 2] = skin.Rgba[s + 2]; dst.Rgba[d + 3] = 255;
                    }
            }
    }

    // Cara de 8x8 (con pelo/gorra) agrandada
    public static byte[] Cara(byte[] skinPng, int esc = 16)
    {
        var s = Leer(skinPng);
        var c = new Imagen(8 * esc, 8 * esc, new byte[64 * esc * esc * 4]);
        Pegar(s, c, 8, 8, 8, 8, 0, 0, esc, false);
        Pegar(s, c, 40, 8, 8, 8, 0, 0, esc, true);
        return Escribir(c);
    }

    // Cuerpo de frente (16x32) agrandado, con la capa de encima
    public static byte[] Cuerpo(byte[] skinPng, bool slim, int esc = 8)
    {
        var s = Leer(skinPng);
        var nueva = s.Alto >= 64;
        var aw = slim ? 3 : 4;
        var c = new Imagen(16 * esc, 32 * esc, new byte[16 * 32 * esc * esc * 4]);
        Pegar(s, c, 4, 20, 4, 12, 4, 20, esc, false);                                   // pierna derecha
        if (nueva) Pegar(s, c, 20, 52, 4, 12, 8, 20, esc, false); else Pegar(s, c, 4, 20, 4, 12, 8, 20, esc, false, true);
        Pegar(s, c, 20, 20, 8, 12, 4, 8, esc, false);                                   // cuerpo
        Pegar(s, c, 44, 20, aw, 12, 4 - aw, 8, esc, false);                             // brazo derecho
        if (nueva) Pegar(s, c, 36, 52, aw, 12, 12, 8, esc, false); else Pegar(s, c, 44, 20, aw, 12, 12, 8, esc, false, true);
        Pegar(s, c, 8, 8, 8, 8, 4, 0, esc, false);                                      // cabeza
        if (nueva)
        {
            Pegar(s, c, 4, 36, 4, 12, 4, 20, esc, true); Pegar(s, c, 4, 52, 4, 12, 8, 20, esc, true);
            Pegar(s, c, 20, 36, 8, 12, 4, 8, esc, true); Pegar(s, c, 44, 36, aw, 12, 4 - aw, 8, esc, true); Pegar(s, c, 52, 52, aw, 12, 12, 8, esc, true);
        }
        Pegar(s, c, 40, 8, 8, 8, 4, 0, esc, true);
        return Escribir(c);
    }
}
