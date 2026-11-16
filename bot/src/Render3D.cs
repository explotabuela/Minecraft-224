namespace Bot224;

// Render 3D de la skin (sin librerías): arma el muñeco con sus cajas, le pone una pose
// y lo dibuja con perspectiva de lado, con sombras. Lo usan la carta, /stats y la página.
public static class Render3D
{
    private struct V3
    {
        public double X, Y, Z;
        public V3(double x, double y, double z) { X = x; Y = y; Z = z; }
        public static V3 operator +(V3 a, V3 b) => new(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
        public static V3 operator -(V3 a, V3 b) => new(a.X - b.X, a.Y - b.Y, a.Z - b.Z);
        public static V3 operator *(V3 a, double k) => new(a.X * k, a.Y * k, a.Z * k);
        public static V3 Cruz(V3 a, V3 b) => new(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X);
        public double Punto(V3 b) => X * b.X + Y * b.Y + Z * b.Z;
        public V3 Unit() { var l = Math.Sqrt(Punto(this)); return l == 0 ? this : this * (1 / l); }
    }

    // Matriz 3x3 de rotación
    private readonly struct M3
    {
        private readonly double a, b, c, d, e, f, g, h, i;
        public M3(double a, double b, double c, double d, double e, double f, double g, double h, double i)
        { this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f; this.g = g; this.h = h; this.i = i; }
        public static M3 Id => new(1, 0, 0, 0, 1, 0, 0, 0, 1);
        public static M3 RotX(double grados) { var r = grados * Math.PI / 180; double s = Math.Sin(r), co = Math.Cos(r); return new(1, 0, 0, 0, co, -s, 0, s, co); }
        public static M3 RotY(double grados) { var r = grados * Math.PI / 180; double s = Math.Sin(r), co = Math.Cos(r); return new(co, 0, s, 0, 1, 0, -s, 0, co); }
        public static M3 RotZ(double grados) { var r = grados * Math.PI / 180; double s = Math.Sin(r), co = Math.Cos(r); return new(co, -s, 0, s, co, 0, 0, 0, 1); }
        public static M3 operator *(M3 m, M3 n) => new(
            m.a * n.a + m.b * n.d + m.c * n.g, m.a * n.b + m.b * n.e + m.c * n.h, m.a * n.c + m.b * n.f + m.c * n.i,
            m.d * n.a + m.e * n.d + m.f * n.g, m.d * n.b + m.e * n.e + m.f * n.h, m.d * n.c + m.e * n.f + m.f * n.i,
            m.g * n.a + m.h * n.d + m.i * n.g, m.g * n.b + m.h * n.e + m.i * n.h, m.g * n.c + m.h * n.f + m.i * n.i);
        public V3 Por(V3 v) => new(a * v.X + b * v.Y + c * v.Z, d * v.X + e * v.Y + f * v.Z, g * v.X + h * v.Y + i * v.Z);
    }

    // Una cara de una caja: esquina, hacia dónde crece la textura (U a la derecha, V hacia abajo) y su pedazo de la skin
    private record Cara(V3 Origen, V3 U, V3 V, int Tu, int Tv, int Tw, int Th, bool Espejo);

    // Caja de Minecraft (x0,y0,z0 = esquina de abajo, atrás, a la derecha del jugador) con su textura en (u,v)
    private static IEnumerable<Cara> Caja(double x0, double y0, double z0, int w, int h, int d, int u, int v, double crece, bool espejo = false)
    {
        double X0 = x0 - crece, Y0 = y0 - crece, Z0 = z0 - crece;
        double W = w + 2 * crece, H = h + 2 * crece, D = d + 2 * crece;
        var ex = new V3(W, 0, 0); var ey = new V3(0, H, 0); var ez = new V3(0, 0, D);
        var arriba = new V3(X0, Y0 + H, Z0);
        // Frente (+z), atrás (-z), lado derecho del jugador (-x), lado izquierdo (+x), arriba y abajo
        if (!espejo)
        {
            yield return new Cara(arriba + ez, ex * (1.0 / w), ey * (-1.0 / h), u + d, v + d, w, h, false);
            yield return new Cara(arriba + ex, ex * (-1.0 / w), ey * (-1.0 / h), u + 2 * d + w, v + d, w, h, false);
            yield return new Cara(arriba, ez * (1.0 / d), ey * (-1.0 / h), u, v + d, d, h, false);
            yield return new Cara(arriba + ex + ez, ez * (-1.0 / d), ey * (-1.0 / h), u + d + w, v + d, d, h, false);
            yield return new Cara(arriba, ex * (1.0 / w), ez * (1.0 / d), u + d, v, w, d, false);
            yield return new Cara(new V3(X0, Y0, Z0), ex * (1.0 / w), ez * (1.0 / d), u + d + w, v, w, d, false);
        }
        else
        {
            // Skins viejas (64x32): el brazo y la pierna izquierdos son el derecho al revés
            yield return new Cara(arriba + ez + ex, ex * (-1.0 / w), ey * (-1.0 / h), u + d, v + d, w, h, false);
            yield return new Cara(arriba, ex * (1.0 / w), ey * (-1.0 / h), u + 2 * d + w, v + d, w, h, false);
            yield return new Cara(arriba + ex + ez, ez * (-1.0 / d), ey * (-1.0 / h), u, v + d, d, h, false);
            yield return new Cara(arriba, ez * (1.0 / d), ey * (-1.0 / h), u + d + w, v + d, d, h, false);
            yield return new Cara(arriba + ex, ex * (-1.0 / w), ez * (1.0 / d), u + d, v, w, d, false);
            yield return new Cara(new V3(X0 + W, Y0, Z0), ex * (-1.0 / w), ez * (1.0 / d), u + d + w, v, w, d, false);
        }
    }

    private record Parte(List<Cara> Caras, M3 Rot, V3 Pivote, bool Encima);

    // Pose "con onda": un brazo arriba saludando, una pierna adelante, la cabeza ladeada
    public static byte[] Cuerpo(byte[] skinPng, bool slim, int alto = 420)
    {
        var s = Png.Leer(skinPng);
        var nueva = s.Alto >= 64;
        var aw = slim ? 3 : 4;
        var partes = new List<Parte>();
        void Agregar(IEnumerable<Cara> c, M3 rot, V3 piv, bool encima) => partes.Add(new Parte(c.ToList(), rot, piv, encima));

        // Pivotes: cuello (0,24,0), hombros (±5,22,0), caderas (±2,12,0)
        var cabeza = M3.RotY(-12) * M3.RotX(-8) * M3.RotZ(6);
        var brazoDer = M3.RotZ(-148) * M3.RotX(-12);   // brazo derecho arriba, saludando
        var brazoIzq = M3.RotX(28) * M3.RotZ(6);        // brazo izquierdo hacia atrás
        var piernaDer = M3.RotX(-24);                   // pierna derecha adelante
        var piernaIzq = M3.RotX(20);                    // pierna izquierda atrás
        var torso = M3.RotY(-6);

        Agregar(Caja(-4, 24, -4, 8, 8, 8, 0, 0, 0), cabeza, new V3(0, 24, 0), false);
        Agregar(Caja(-4, 24, -4, 8, 8, 8, 32, 0, 0.5), cabeza, new V3(0, 24, 0), true);
        Agregar(Caja(-4, 12, -2, 8, 12, 4, 16, 16, 0), torso, new V3(0, 12, 0), false);
        Agregar(Caja(-4 - aw, 12, -2, aw, 12, 4, 40, 16, 0), torso * brazoDer, new V3(-4 - aw / 2.0, 22, 0), false);
        Agregar(Caja(-4, 0, -2, 4, 12, 4, 0, 16, 0), piernaDer, new V3(-2, 12, 0), false);
        if (nueva)
        {
            Agregar(Caja(4, 12, -2, aw, 12, 4, 32, 48, 0), torso * brazoIzq, new V3(4 + aw / 2.0, 22, 0), false);
            Agregar(Caja(0, 0, -2, 4, 12, 4, 16, 48, 0), piernaIzq, new V3(2, 12, 0), false);
            Agregar(Caja(-4, 12, -2, 8, 12, 4, 16, 32, 0.25), torso, new V3(0, 12, 0), true);
            Agregar(Caja(-4 - aw, 12, -2, aw, 12, 4, 40, 32, 0.25), torso * brazoDer, new V3(-4 - aw / 2.0, 22, 0), true);
            Agregar(Caja(4, 12, -2, aw, 12, 4, 48, 48, 0.25), torso * brazoIzq, new V3(4 + aw / 2.0, 22, 0), true);
            Agregar(Caja(-4, 0, -2, 4, 12, 4, 0, 32, 0.25), piernaDer, new V3(-2, 12, 0), true);
            Agregar(Caja(0, 0, -2, 4, 12, 4, 0, 48, 0.25), piernaIzq, new V3(2, 12, 0), true);
        }
        else
        {
            Agregar(Caja(4, 12, -2, aw, 12, 4, 40, 16, 0, true), torso * brazoIzq, new V3(4 + aw / 2.0, 22, 0), false);
            Agregar(Caja(0, 0, -2, 4, 12, 4, 0, 16, 0, true), piernaIzq, new V3(2, 12, 0), false);
        }

        // Cámara: girada a un lado y viendo un poco desde arriba
        var camara = M3.RotX(10) * M3.RotY(28);
        var luz = new V3(-0.5, 0.8, 0.6).Unit();

        // Todas las caras ya acomodadas en el espacio de la cámara
        var listas = new List<(V3 o, V3 u, V3 v, Cara c, double brillo, bool encima)>();
        double minX = double.MaxValue, maxX = double.MinValue, minY = double.MaxValue, maxY = double.MinValue;
        foreach (var p in partes)
            foreach (var c in p.Caras)
            {
                V3 T(V3 q) => camara.Por(p.Rot.Por(q - p.Pivote) + p.Pivote);
                var o = T(c.Origen);
                var u = T(c.Origen + c.U) - o;
                var v = T(c.Origen + c.V) - o;
                var n = V3.Cruz(u, v).Unit() * -1; // V va hacia abajo, por eso se voltea
                if (n.Z <= 0.0001) continue;       // no se ve
                var brillo = 0.62 + 0.38 * Math.Max(0, n.Punto(camara.Por(luz).Unit()));
                listas.Add((o, u, v, c, brillo, p.Encima));
                foreach (var q in new[] { o, o + u * c.Tw, o + v * c.Th, o + u * c.Tw + v * c.Th })
                { minX = Math.Min(minX, q.X); maxX = Math.Max(maxX, q.X); minY = Math.Min(minY, q.Y); maxY = Math.Max(maxY, q.Y); }
            }

        // Se dibuja al doble de tamaño y luego se reduce, para que no se vea serruchado
        const int ss = 2;
        var margen = 0.06;
        var esc = alto * ss * (1 - 2 * margen) / (maxY - minY);
        var H = alto * ss;
        var W = (int)Math.Ceiling((maxX - minX) * esc + H * 2 * margen);
        W += W % 2;
        var color = new byte[W * H * 4];
        var prof = new double[W * H];
        Array.Fill(prof, double.MinValue);
        double ox = W / 2.0 - (minX + maxX) / 2 * esc, oy = H / 2.0 + (minY + maxY) / 2 * esc;

        foreach (var (o, u, v, c, brillo, encima) in listas)
            for (int ty = 0; ty < c.Th; ty++)
                for (int tx = 0; tx < c.Tw; tx++)
                {
                    int sx = c.Tu + tx, sy = c.Tv + ty;
                    if (sx >= s.Ancho || sy >= s.Alto) continue;
                    var k = (sy * s.Ancho + sx) * 4;
                    var a = s.Rgba[k + 3];
                    if (encima && a < 128) continue;
                    var p0 = o + u * tx + v * ty;
                    Cuadro(p0, p0 + u, p0 + u + v, p0 + v);
                    void Cuadro(V3 a0, V3 a1, V3 a2, V3 a3)
                    {
                        Tri(a0, a1, a2); Tri(a0, a2, a3);
                    }
                    void Tri(V3 p1, V3 p2, V3 p3)
                    {
                        double x1 = ox + p1.X * esc, y1 = oy - p1.Y * esc, x2 = ox + p2.X * esc, y2 = oy - p2.Y * esc, x3 = ox + p3.X * esc, y3 = oy - p3.Y * esc;
                        var area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
                        if (Math.Abs(area) < 1e-9) return;
                        int bx0 = Math.Max(0, (int)Math.Floor(Math.Min(x1, Math.Min(x2, x3)))), bx1 = Math.Min(W - 1, (int)Math.Ceiling(Math.Max(x1, Math.Max(x2, x3))));
                        int by0 = Math.Max(0, (int)Math.Floor(Math.Min(y1, Math.Min(y2, y3)))), by1 = Math.Min(H - 1, (int)Math.Ceiling(Math.Max(y1, Math.Max(y2, y3))));
                        for (int py = by0; py <= by1; py++)
                            for (int px = bx0; px <= bx1; px++)
                            {
                                double cx = px + 0.5, cy = py + 0.5;
                                var w1 = ((x2 - cx) * (y3 - cy) - (x3 - cx) * (y2 - cy)) / area;
                                var w2 = ((x3 - cx) * (y1 - cy) - (x1 - cx) * (y3 - cy)) / area;
                                var w3 = 1 - w1 - w2;
                                if (w1 < -1e-6 || w2 < -1e-6 || w3 < -1e-6) continue;
                                var z = w1 * p1.Z + w2 * p2.Z + w3 * p3.Z + (encima ? 0.01 : 0);
                                var i = py * W + px;
                                if (z <= prof[i]) continue;
                                prof[i] = z;
                                color[i * 4] = (byte)Math.Min(255, s.Rgba[k] * brillo);
                                color[i * 4 + 1] = (byte)Math.Min(255, s.Rgba[k + 1] * brillo);
                                color[i * 4 + 2] = (byte)Math.Min(255, s.Rgba[k + 2] * brillo);
                                color[i * 4 + 3] = 255;
                            }
                    }
                }

        // Reducir a la mitad promediando (con el alfa bien hecho)
        int w2 = W / ss, h2 = H / ss;
        var final = new byte[w2 * h2 * 4];
        for (int y = 0; y < h2; y++)
            for (int x = 0; x < w2; x++)
            {
                double r = 0, g = 0, b = 0, al = 0;
                for (int yy = 0; yy < ss; yy++)
                    for (int xx = 0; xx < ss; xx++)
                    {
                        var i = ((y * ss + yy) * W + x * ss + xx) * 4;
                        var aa = color[i + 3] / 255.0;
                        r += color[i] * aa; g += color[i + 1] * aa; b += color[i + 2] * aa; al += aa;
                    }
                var j = (y * w2 + x) * 4;
                if (al > 0) { final[j] = (byte)(r / al); final[j + 1] = (byte)(g / al); final[j + 2] = (byte)(b / al); }
                final[j + 3] = (byte)(al / (ss * ss) * 255);
            }
        return Png.Escribir(new Png.Imagen(w2, h2, final));
    }
}
