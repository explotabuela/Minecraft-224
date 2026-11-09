/* Arte original de los jefes de la 224 (pixel art 32x32 dibujado con código) */
(function () {
  function lienzo(cv) {
    const x = cv.getContext("2d");
    const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    const P = (a, b, c) => R(a, b, 1, 1, c);
    const L = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) P(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };
    const C = (cx, cy, r, c) => { for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy)); R(cx - w, cy + yy, w * 2 + 1, 1, c); } };
    const M = (a, b, filas, pal) => filas.forEach((f, j) => [...f].forEach((ch, i) => { if (pal[ch]) P(a + i, b + j, pal[ch]); }));
    return { x, R, P, L, C, M };
  }

  const ARTE = {
    bruja(d, g) {
      const { R, P, L, M } = d;
      // túnica
      R(5, 26, 22, 6, "#2d1846"); R(5, 26, 22, 1, "#4a2a6b"); L(12, 26, 16, 30, "#1b0e2c"); L(20, 26, 16, 30, "#1b0e2c");
      // pelo
      R(7, 12, 3, 13, "#14121a"); R(22, 12, 3, 13, "#14121a"); P(7, 25, "#14121a"); P(24, 25, "#14121a"); P(8, 26, "#14121a"); P(23, 26, "#14121a");
      // cara
      R(10, 13, 12, 12, "#95b77c"); R(21, 13, 1, 12, "#7a9c64"); R(10, 24, 12, 1, "#7a9c64"); R(13, 25, 6, 1, "#7a9c64"); R(14, 26, 4, 1, "#6a8a56");
      // ojos y cejas
      R(11, 17, 4, 2, "#121212"); R(17, 17, 4, 2, "#121212");
      [[11, 15], [12, 15], [13, 16], [14, 16], [17, 16], [18, 16], [19, 15], [20, 15]].forEach(([a, b]) => P(a, b, "#1d2a14"));
      // nariz ganchuda y verruga
      R(15, 18, 2, 4, "#86a96f"); P(17, 21, "#86a96f"); P(17, 22, "#86a96f"); P(18, 22, "#7a9c64"); P(14, 20, "#5d7a48");
      // boca
      R(12, 23, 7, 1, "#2a1414"); P(13, 23, "#d8d0b0"); P(17, 23, "#d8d0b0");
      // sombrero
      R(4, 12, 24, 1, "#1d0f30"); R(5, 11, 22, 1, "#2b1640");
      const cono = [[8, 23, 10], [9, 22, 9], [10, 21, 8], [11, 20, 7], [12, 19, 6], [13, 18, 5], [14, 18, 4], [16, 19, 3], [18, 20, 2], [20, 21, 1]];
      cono.forEach(([a, b, y]) => R(a, y, b - a + 1, 1, "#2b1640"));
      cono.forEach(([a, , y]) => P(a, y, "#4a2a6b"));
      R(9, 10, 14, 1, "#3f7d3a"); R(10, 9, 12, 1, "#2f5e2b"); R(15, 9, 3, 2, "#d9a520"); P(16, 9, "#2b1640"); P(16, 10, "#2b1640");
      // brillo de ojos
      g.R(12, 17, 2, 1, "#d8ff4a"); g.R(18, 17, 2, 1, "#d8ff4a");
    },
    muneco(d, g) {
      const { R, P, C, L } = d;
      R(4, 27, 24, 5, "#dfe9f2"); R(4, 27, 24, 1, "#b9cfe0");
      C(16, 18, 9, "#e8f0f7"); C(18, 20, 7, "#d3e1ee"); C(16, 18, 7, "#eef4fa");
      L(9, 13, 12, 16, "#9fb6c9"); L(24, 21, 21, 24, "#9fb6c9");
      // sombrero de copa
      R(6, 9, 20, 2, "#121216"); R(10, 2, 12, 7, "#16161b"); R(10, 2, 1, 7, "#2a2a32"); R(10, 7, 12, 1, "#7a1420");
      // ojos de carbón con brasa
      R(11, 14, 3, 3, "#141414"); R(18, 14, 3, 3, "#141414");
      L(10, 12, 14, 13, "#141414"); L(17, 13, 21, 12, "#141414");
      // zanahoria podrida
      R(16, 18, 2, 2, "#b85a1c"); R(18, 18, 3, 2, "#a4501a"); R(21, 19, 2, 1, "#8c4416"); P(23, 19, "#5e3510");
      // sonrisa de carbón
      [[10, 22], [12, 23], [14, 23], [16, 24], [18, 23], [20, 23], [22, 22]].forEach(([a, b]) => R(a, b, 2, 1, "#141414"));
      [[11, 23], [15, 24], [19, 24]].forEach(([a, b]) => P(a, b, "#141414"));
      // bufanda
      R(6, 26, 21, 2, "#9b1d24"); R(6, 26, 21, 1, "#c42c35"); R(20, 28, 3, 4, "#9b1d24"); P(21, 31, "#c42c35");
      // copos
      [[2, 4], [28, 6], [3, 16], [29, 15], [26, 2], [5, 23]].forEach(([a, b]) => { P(a, b, "#ffffffcc"); });
      g.P(12, 15, "#ff3020"); g.P(19, 15, "#ff3020");
    },
    viejo(d, g) {
      const { R, P, L } = d;
      // fuego abajo
      for (let a = 0; a < 32; a += 2) { const h = 5 + ((a * 7) % 6); R(a, 32 - h, 2, h, a % 4 ? "#d92b1a" : "#ff7a1a"); }
      for (let a = 3; a < 32; a += 6) R(a, 28, 2, 4, "#ffd166");
      // cuerpo de trapo con camisa
      R(8, 24, 16, 6, "#4a5a8a"); R(8, 24, 16, 1, "#6a7aaa"); R(15, 24, 2, 6, "#2a3a6a");
      // paja saliendo
      [[6, 13], [5, 16], [6, 19], [7, 22], [25, 13], [26, 16], [25, 19], [24, 22]].forEach(([a, b]) => L(a, b, a + (a < 16 ? 3 : -3), b, "#e8c860"));
      // cabeza de costal
      R(9, 11, 14, 13, "#c49a62"); R(22, 11, 1, 13, "#a07a46"); R(9, 23, 14, 1, "#a07a46");
      for (let i = 0; i < 14; i++) P(10 + (i * 5) % 12, 12 + (i * 3) % 11, "#b08a52");
      // ojos en X grandes y cosidos
      R(10, 14, 5, 5, "#7a5a32"); R(17, 14, 5, 5, "#7a5a32");
      L(10, 14, 14, 18, "#1a0e04"); L(14, 14, 10, 18, "#1a0e04"); L(17, 14, 21, 18, "#1a0e04"); L(21, 14, 17, 18, "#1a0e04");
      L(11, 14, 14, 17, "#1a0e04"); L(18, 14, 21, 17, "#1a0e04");
      // sonrisa cosida enorme
      L(11, 20, 13, 21, "#1a0e04"); R(13, 21, 6, 1, "#1a0e04"); L(19, 21, 21, 20, "#1a0e04"); [13, 15, 17].forEach(a => { P(a, 20, "#1a0e04"); P(a, 22, "#1a0e04"); });
      // sombrero de paja con listón
      R(4, 9, 24, 2, "#d4ad52"); R(4, 10, 24, 1, "#a8853a"); R(10, 4, 12, 5, "#dcb55a"); R(10, 4, 12, 1, "#f0d070"); R(10, 8, 12, 1, "#8a1a1a");
      // "2026" escrito en el listón
      [11, 13, 16, 18].forEach(a => P(a, 8, "#f4ecdf"));
      g.P(12, 16, "#ff9a2a"); g.P(19, 16, "#ff9a2a"); g.R(4, 31, 24, 1, "#ff9a00");
    },
    reina(d, g) {
      const { R, P, L, C } = d;
      const pata = (pts, c1, c2) => { for (let i = 0; i < pts.length - 1; i++) { L(...pts[i], ...pts[i + 1], c1); L(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, c2); } };
      // 8 patas largas y peludas, bien visibles
      const izq = [[[10, 13], [5, 6], [2, 9]], [[9, 16], [3, 13], [0, 18]], [[9, 19], [3, 21], [1, 27]], [[11, 21], [6, 26], [5, 31]]];
      izq.forEach(p => { pata(p, "#7a4a52", "#3a1a20"); pata(p.map(([a, b]) => [31 - a, b]), "#7a4a52", "#3a1a20"); });
      [[2, 9], [0, 18], [1, 27], [5, 31]].forEach(([a, b]) => { P(a, b, "#c9a0a8"); P(31 - a, b, "#c9a0a8"); });
      // abdomen y cabeza
      C(16, 22, 6, "#2a1418"); C(16, 22, 4, "#3a1c22"); R(14, 19, 4, 1, "#8a1a2a"); R(15, 21, 2, 3, "#8a1a2a"); P(13, 24, "#8a1a2a"); P(18, 24, "#8a1a2a");
      C(16, 13, 6, "#341a1f"); C(15, 12, 4, "#45232a");
      for (let i = 0; i < 10; i++) P(11 + (i * 5) % 10, 9 + (i * 3) % 8, "#5a2a34");
      // colmillos
      R(12, 17, 3, 3, "#1a0c0e"); R(17, 17, 3, 3, "#1a0c0e"); P(13, 20, "#efe6cf"); P(18, 20, "#efe6cf"); P(13, 21, "#c9bfae"); P(18, 21, "#c9bfae");
      // corona
      R(11, 5, 10, 2, "#e0b030"); [[11, 2], [14, 3], [17, 3], [20, 2]].forEach(([a, b]) => R(a, b, 1, 3, "#f0c040")); R(15, 1, 2, 4, "#f0c040");
      P(15, 5, "#c4182a"); P(18, 5, "#2a6ac4"); P(12, 5, "#2a6ac4");
      // ocho ojos
      [[12, 11, 2], [18, 11, 2], [10, 9, 1], [21, 9, 1], [14, 8, 1], [17, 8, 1], [11, 14, 1], [20, 14, 1]].forEach(([a, b, t]) => { R(a, b, t, t, "#5a0a10"); g.R(a, b, t, t, "#ff2a3a"); });
    },
    rey(d, g) {
      const { R, P, L } = d;
      // capa y armiño
      R(4, 27, 24, 5, "#7a1420"); R(6, 26, 20, 3, "#efeae0"); [8, 12, 16, 20, 24].forEach(a => P(a, 27, "#141414"));
      // cráneo
      R(9, 8, 14, 15, "#e9e4d4"); R(10, 7, 12, 1, "#e9e4d4"); R(22, 8, 1, 15, "#c6bfa8"); R(9, 22, 14, 1, "#c6bfa8");
      L(20, 9, 18, 12, "#a69f88"); P(17, 12, "#a69f88");
      // cuencas
      R(11, 13, 4, 4, "#120d08"); R(17, 13, 4, 4, "#120d08"); P(11, 13, "#e9e4d4"); P(20, 13, "#e9e4d4");
      // nariz
      R(15, 18, 2, 2, "#120d08"); P(15, 17, "#120d08");
      // mandíbula y dientes
      R(10, 23, 12, 3, "#ddd6c2"); R(11, 21, 10, 3, "#efeae0"); [12, 14, 16, 18, 20].forEach(a => L(a, 21, a, 24, "#3a3226"));
      R(11, 26, 10, 1, "#c6bfa8");
      // corona
      R(8, 5, 16, 3, "#e6b422"); R(8, 7, 16, 1, "#b8881a");
      [[8, 2], [12, 3], [16, 1], [20, 3], [23, 2]].forEach(([a, b]) => R(a, b, 1, 4, "#f2c94c"));
      P(12, 6, "#c4182a"); P(16, 6, "#2a8a4a"); P(20, 6, "#c4182a"); P(16, 2, "#fff3b0");
      g.P(13, 15, "#ffd84a"); g.P(18, 15, "#ffd84a");
    },
    guardian(d, g) {
      const { R, P, L, C } = d;
      // humo y brasas
      [[3, 3], [28, 6], [5, 14], [27, 18]].forEach(([a, b]) => g.P(a, b, "#ff8a1a"));
      // cuernos enormes
      L(7, 9, 2, 5, "#e8dcc0"); L(2, 5, 1, 0, "#e8dcc0"); L(7, 10, 3, 6, "#c4b48e"); L(3, 6, 2, 1, "#c4b48e"); L(8, 11, 4, 8, "#a8986e");
      L(24, 9, 29, 5, "#e8dcc0"); L(29, 5, 30, 0, "#e8dcc0"); L(24, 10, 28, 6, "#c4b48e"); L(28, 6, 29, 1, "#c4b48e"); L(23, 11, 27, 8, "#a8986e");
      // yelmo negro con remaches
      R(6, 6, 20, 9, "#1a1a1f"); R(7, 5, 18, 1, "#2a2a32"); R(9, 4, 14, 1, "#2a2a32"); R(6, 6, 1, 9, "#2a2a32");
      [[8, 7], [12, 6], [16, 6], [20, 6], [24, 7]].forEach(([a, b]) => P(a, b, "#6a6a78"));
      L(10, 7, 13, 12, "#ff6a00"); L(22, 7, 19, 11, "#ff6a00"); P(16, 8, "#ff6a00");
      // cara de bruto, piel oscura y quemada
      R(7, 14, 18, 11, "#5a1e16"); R(24, 14, 1, 11, "#3a120c"); R(7, 24, 18, 1, "#3a120c");
      // ceño
      R(8, 14, 16, 2, "#1a1a1f"); P(15, 16, "#3a120c"); P(16, 16, "#3a120c");
      // ojos grandes de lava
      R(9, 16, 5, 3, "#120604"); R(18, 16, 5, 3, "#120604");
      // nariz chata y quijada abierta
      R(14, 18, 4, 2, "#3a120c"); P(14, 19, "#120604"); P(17, 19, "#120604");
      R(10, 21, 12, 4, "#120604"); R(11, 21, 10, 1, "#ff4a00");
      [[11, 22], [13, 22], [19, 22], [21, 22]].forEach(([a, b]) => P(a - (a > 16 ? 1 : 0), b, "#efe6cf"));
      R(10, 20, 2, 4, "#efe6cf"); R(20, 20, 2, 4, "#efe6cf"); P(10, 19, "#efe6cf"); P(21, 19, "#efe6cf");
      // cicatriz
      L(20, 14, 23, 22, "#b4402a");
      // hombreras gigantes con picos
      R(0, 24, 9, 8, "#24242c"); R(23, 24, 9, 8, "#24242c"); R(0, 24, 9, 1, "#44444f"); R(23, 24, 9, 1, "#44444f");
      [[1, 21], [4, 20], [7, 21], [24, 21], [27, 20], [30, 21]].forEach(([a, b]) => R(a, b, 1, 3, "#c9b48a"));
      R(9, 25, 14, 7, "#1a1a1f"); R(9, 28, 14, 2, "#4a1e10"); R(14, 28, 4, 2, "#d9a520");
      g.R(10, 17, 3, 1, "#ff9a00"); g.R(19, 17, 3, 1, "#ff9a00"); g.R(11, 21, 10, 1, "#ff6a00"); g.L(10, 7, 13, 12, "#ff6a00"); g.L(22, 7, 19, 11, "#ff6a00");
    },
    ultimo(d, g) {
      const { R, P, L, C } = d;
      // ondas
      [[16, 17, 15], [16, 17, 13]].forEach(([cx, cy, r], k) => { for (let t = 0; t < 360; t += 8) { const a = t * Math.PI / 180; if (t > 200 && t < 340) continue; P(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), k ? "#1f6b6f" : "#164c50"); } });
      // capucha
      R(7, 6, 18, 26, "#0b1a1f"); R(9, 4, 14, 2, "#0b1a1f"); R(11, 3, 10, 1, "#0b1a1f"); R(7, 6, 1, 26, "#14303a"); R(9, 4, 1, 2, "#14303a");
      // vacío
      R(10, 9, 12, 16, "#02080a"); R(11, 8, 10, 1, "#02080a"); R(11, 25, 10, 1, "#02080a");
      // goteo
      [[12, 26, 3], [15, 26, 5], [19, 26, 2]].forEach(([a, b, h]) => R(a, b, 1, h, "#02080a"));
      // muchos ojos
      [[13, 12], [19, 11], [11, 17], [21, 18], [17, 21], [13, 22]].forEach(([a, b]) => { P(a, b, "#0f3a3a"); g.P(a, b, "#4ff0e0"); });
      R(15, 15, 2, 2, "#0f3a3a"); g.R(15, 15, 2, 2, "#9ffff5");
    },
    profe(d, g) {
      const { R, P, L, C } = d;
      // blusa roja con perlitas
      R(5, 26, 22, 6, "#c4182a"); R(5, 26, 22, 1, "#e0303f"); R(13, 26, 6, 2, "#e8c0a0"); L(13, 27, 16, 30, "#9a0f1f"); L(19, 27, 16, 30, "#9a0f1f");
      [[7, 28], [9, 30], [11, 28], [21, 28], [23, 30], [25, 28], [8, 31], [24, 31]].forEach(([a, b]) => P(a, b, "#f4ecdf"));
      P(16, 29, "#d8d0c0"); P(15, 28, "#d8d0c0"); P(17, 28, "#d8d0c0");
      // regla
      L(27, 31, 30, 15, "#c49a3a"); L(28, 31, 31, 15, "#a87f2a"); [19, 23, 27].forEach(b => P(29, b, "#5a3a10"));
      // pelo blanco a los hombros
      R(7, 6, 18, 20, "#e9e6ee"); R(8, 5, 16, 1, "#e9e6ee"); R(10, 4, 12, 1, "#e9e6ee"); R(6, 10, 1, 15, "#d7d3df"); R(25, 10, 1, 15, "#d7d3df");
      R(7, 22, 3, 4, "#d7d3df"); R(22, 22, 3, 4, "#d7d3df"); [[8, 7], [12, 5], [20, 6], [23, 9]].forEach(([a, b]) => P(a, b, "#ffffff"));
      // cara
      R(10, 10, 12, 14, "#e2b48f"); R(21, 10, 1, 14, "#c9966f"); R(10, 23, 12, 1, "#c9966f"); R(12, 24, 8, 1, "#c9966f");
      // fleco
      R(10, 9, 12, 3, "#e9e6ee"); P(11, 12, "#e9e6ee"); P(14, 12, "#e9e6ee"); P(20, 12, "#e9e6ee"); R(10, 12, 1, 3, "#e9e6ee"); R(21, 12, 1, 3, "#e9e6ee");
      // cejas arqueadas (de "a ver, ¿quién no hizo la tarea?")
      L(11, 14, 14, 13, "#6a5a5a"); L(17, 13, 20, 14, "#6a5a5a");
      // ojos que brillan
      R(11, 16, 4, 2, "#2a1a2a"); R(17, 16, 4, 2, "#2a1a2a");
      g.R(12, 16, 2, 1, "#ff3b4a"); g.R(18, 16, 2, 1, "#ff3b4a");
      // nariz y sonrisa de villana
      P(16, 18, "#c9966f"); P(16, 19, "#c9966f"); R(13, 21, 6, 1, "#b0182a"); P(12, 20, "#b0182a"); P(19, 20, "#b0182a"); R(14, 22, 4, 1, "#8a1020"); R(14, 21, 4, 1, "#f4ecdf");
      // aretes de perla
      P(9, 19, "#f4ecdf"); P(22, 19, "#f4ecdf"); P(9, 20, "#d8d0c0"); P(22, 20, "#d8d0c0");
    },
  };


  // ===== Escenarios de fondo (48x72) para cada póster =====
  const FONDOS = {
    bruja(d) {
      const { R, P, L, C, x } = d;
      degradado(x, ["#07150b", "#0d2414", "#14341c", "#1c4426"]);
      C(34, 14, 7, "#d9e8c4"); C(36, 12, 6, "#c4d8ac"); C(32, 13, 2, "#b8cca0");
      estrellas(d, 30, 34, "#cfe8c0");
      // árboles secos
      [[4, 36], [42, 40]].forEach(([a, b]) => { R(a, b, 3, 36, "#050c07"); L(a, b + 6, a - 4, b - 2, "#050c07"); L(a + 2, b + 10, a + 7, b + 2, "#050c07"); L(a - 4, b - 2, a - 6, b - 5, "#050c07"); });
      // pantano
      R(0, 60, 48, 12, "#0a1f12"); for (let i = 0; i < 48; i += 3) P(i, 61 + (i % 2), "#2a5a34");
      [[10, 58], [30, 56], [40, 59], [20, 54], [6, 50]].forEach(([a, b]) => P(a, b, "#d8ff6a"));
    },
    muneco(d) {
      const { R, P, x } = d;
      degradado(x, ["#0a1a33", "#123056", "#1d4a7a", "#2a6098"]);
      { let r = 5; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 70; i++) P(Math.floor(rnd() * 48), Math.floor(rnd() * 70), i % 3 ? "#ffffffaa" : "#ffffff"); }
      // pinos nevados
      [[3, 40, 9], [40, 36, 11], [12, 48, 7], [33, 50, 7]].forEach(([a, b, h]) => { for (let k = 0; k < h; k++) { R(a + 4 - Math.floor(k / 1.5), b + k * 2, 1 + Math.floor(k / 1.5) * 2, 2, "#0b2238"); P(a + 4 - Math.floor(k / 1.5), b + k * 2, "#e8f0f7"); } });
      R(0, 62, 48, 10, "#dfe9f2"); R(0, 62, 48, 1, "#ffffff");
    },
    viejo(d) {
      const { R, P, x } = d;
      degradado(x, ["#0a0a24", "#1a1440", "#3a1f4a", "#6a2a3a"]);
      [[10, 12, "#ff5a5a"], [37, 9, "#ffd166"], [24, 22, "#6af0ff"], [41, 30, "#b56aff"], [6, 30, "#7aff8a"]].forEach(([cx, cy, c]) => {
        for (let t = 0; t < 12; t++) { const a = t * Math.PI / 6; for (let r = 2; r < 6; r++) P(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), r > 4 ? c + "88" : c); } P(cx, cy, "#fff"); });
      // techos de pueblo
      [[0, 58, 10], [9, 54, 8], [16, 60, 9], [25, 55, 10], [35, 57, 13]].forEach(([a, b, w]) => { R(a, b, w, 72 - b, "#120a1a"); P(a + 2, b + 4, "#ffcf6a"); P(a + w - 3, b + 6, "#ffcf6a"); });
    },
    reina(d) {
      const { R, P, L, x } = d;
      degradado(x, ["#0d0508", "#1a0a10", "#2a0e18", "#160609"]);
      // estalactitas y estalagmitas
      for (let a = 0; a < 48; a += 4) { const h = 4 + (a * 7) % 9; for (let k = 0; k < h; k++) R(a + Math.floor(k / 3), k, 4 - Math.floor(k / 1.6) > 0 ? 4 - Math.floor(k / 1.6) : 1, 1, "#2e1418"); }
      for (let a = 2; a < 48; a += 5) { const h = 3 + (a * 5) % 8; for (let k = 0; k < h; k++) R(a + Math.floor(k / 3), 71 - k, Math.max(1, 4 - Math.floor(k / 1.6)), 1, "#2e1418"); }
      // telarañas en esquinas
      [[0, 0, 1], [47, 0, -1]].forEach(([a, b, s]) => { for (let k = 0; k < 4; k++) L(a, b + k * 4, a + s * (14 - k * 3), b, "#ffffff22"); L(a, b, a + s * 12, b + 12, "#ffffff22"); });
      [[6, 40], [40, 46], [10, 56], [36, 30]].forEach(([a, b]) => { P(a, b, "#ff2a3a"); P(a + 2, b, "#ff2a3a"); });
    },
    rey(d) {
      const { R, P, C, x } = d;
      degradado(x, ["#120d24", "#2a1f3a", "#6a4a3a", "#b88a4a"]);
      C(11, 16, 6, "#f4e6c0"); estrellas(d, 25, 24, "#fff3d0");
      // pirámide
      for (let k = 0; k < 18; k++) R(30 - k, 40 + k, 2 + k * 2, 1, k % 3 ? "#5a3e1a" : "#4a3212");
      // dunas
      for (let i = 0; i < 48; i++) { const h = 58 + Math.round(Math.sin(i / 6) * 3); R(i, h, 1, 72 - h, "#c8964a"); P(i, h, "#e0b468"); }
    },
    guardian(d) {
      const { R, P, x } = d;
      degradado(x, ["#1a0402", "#3a0a04", "#6a1406", "#a02a0a"]);
      // cascadas de lava
      [[6, 4], [38, 6], [22, 2]].forEach(([a, w]) => { R(a, 0, w, 72, "#ff6a0055"); R(a + 1, 0, Math.max(1, w - 2), 72, "#ff8a1a66"); });
      // acantilados de piedra infernal
      for (let i = 0; i < 48; i++) { const h = 54 + Math.round(Math.sin(i / 4) * 3 + Math.cos(i / 7) * 2); R(i, h, 1, 72 - h, "#3a0c0c"); P(i, h, "#5a1a14"); }
      { let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 40; i++) P(Math.floor(rnd() * 48), Math.floor(rnd() * 60), i % 2 ? "#ffb04a" : "#ff6a00aa"); }
    },
    ultimo(d) {
      const { R, P, x } = d;
      degradado(x, ["#000203", "#02090c", "#041318", "#020a0d"]);
      // agujas oscuras
      [[3, 20], [10, 34], [36, 26], [43, 14], [26, 44]].forEach(([a, b]) => { for (let k = 0; k < 72 - b; k++) R(a + Math.floor(Math.sin(k / 6)), b + k, 2 + Math.floor(k / 16), 1, "#06161b"); });
      // venas que brillan
      for (let i = 0; i < 48; i++) if (i % 5 < 3) P(i, 66 + Math.round(Math.sin(i / 3) * 2), "#0f4a50");
      { let r = 9; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 26; i++) P(Math.floor(rnd() * 48), Math.floor(rnd() * 70), "#4ff0e055"); }
    },
    profe(d) {
      const { R, P, L, x } = d;
      degradado(x, ["#120a24", "#1c1036", "#24144a", "#170c30"]);
      // pizarrón
      R(3, 8, 42, 30, "#4a3018"); R(5, 10, 38, 26, "#1f3a2a");
      // garabatos de gis
      const gis = "#e8efe2bb";
      [[8, 14, 16, 14], [8, 17, 13, 17], [26, 13, 36, 13], [26, 16, 33, 16], [26, 19, 38, 19], [8, 26, 14, 30], [14, 26, 8, 30]].forEach(([a, b, c, e]) => L(a, b, c, e, gis));
      // "10" en rojo
      R(30, 25, 1, 7, "#ff5a5a"); R(33, 25, 4, 1, "#ff5a5a"); R(33, 31, 4, 1, "#ff5a5a"); R(33, 25, 1, 7, "#ff5a5a"); R(36, 25, 1, 7, "#ff5a5a");
      // reloj
      for (let t = 0; t < 360; t += 30) { const a = t * Math.PI / 180; P(Math.round(41 + Math.cos(a) * 3), Math.round(44 + Math.sin(a) * 3), "#d8d0c0"); } L(41, 44, 41, 42, "#d8d0c0"); L(41, 44, 43, 44, "#d8d0c0");
      // pupitres
      R(0, 62, 48, 10, "#2a1a10"); R(0, 62, 48, 1, "#4a3018");
    },
  };
  function degradado(x, cols) { for (let y = 0; y < 72; y++) { x.fillStyle = cols[Math.min(cols.length - 1, Math.floor(y / 72 * cols.length))]; x.fillRect(0, y, 48, 1); } }
  function estrellas(d, n, alto, c) { let r = 11; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < n; i++) d.P(Math.floor(rnd() * 48), Math.floor(rnd() * alto), c); }

  window.dibujarFondo = function (id, cv) {
    const d = lienzo(cv);
    d.x.clearRect(0, 0, 48, 72);
    (FONDOS[id] || FONDOS.bruja)(d);
  };

  // Dibuja el jefe en dos lienzos: el cuerpo y el brillo (ojos que brillan)
  window.dibujarJefe = function (id, cuerpo, brillo) {
    const d = lienzo(cuerpo), g = lienzo(brillo);
    d.x.clearRect(0, 0, 32, 32); g.x.clearRect(0, 0, 32, 32);
    (ARTE[id] || ARTE.bruja)(d, g);
    // el brillo también se dibuja encima del cuerpo para que se vea nítido
    d.x.drawImage(brillo, 0, 0);
  };
})();

/* Atardecer pixelado de la portada */
(function () {
  function cielo() {
    const c = document.getElementById("hero-cielo");
    if (!c) return;
    const x = c.getContext("2d"), caja = c.parentElement.getBoundingClientRect();
    const P = 5, W = Math.ceil(caja.width / P), H = Math.ceil(caja.height / P);
    c.width = W; c.height = H;
    const banda = ["#1d1036", "#2c1850", "#3f1f60", "#5b2466", "#7d2d6c", "#a33a6c", "#c2456c", "#e2595f", "#ff7a3d", "#ff9a48", "#ffb85c"];
    for (let y = 0; y < H; y++) { x.fillStyle = banda[Math.min(banda.length - 1, Math.floor(Math.pow(y / H, 1.1) * banda.length * 1.12))]; x.fillRect(0, y, W, 1); }
    let r = 3; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < W * H / 260; i++) { x.fillStyle = rnd() > .7 ? "#ffffff" : "#ffffff88"; x.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * .33), 1, 1); }
    const sx = Math.floor(W / 2), sy = Math.floor(H * .64), R = Math.floor(Math.min(W * .14, H * .17));
    x.fillStyle = "#ffd166";
    for (let yy = -R; yy <= R; yy++) { const w = Math.floor(Math.sqrt(R * R - yy * yy)); if (yy % 6 === 3 && yy > 0) continue; x.fillRect(sx - w, sy + yy, w * 2, 1); }
    [[.7, "#6b2a5e", 9], [.77, "#4a1f55", 7], [.85, "#2f1645", 6], [.93, "#160d2a", 4]].forEach(([base, col, a], k) => {
      x.fillStyle = col;
      for (let i = 0; i < W; i += 2) {
        const h = Math.floor(H * base + Math.sin(i / (14 + k * 5) + k * 2) * a + Math.sin(i / 5 + k) * a * .25);
        x.fillRect(i, h, 2, H - h);
        if (k === 2 && (i * 31 + 7) % 29 === 0) { x.fillRect(i, h - 7, 2, 7); x.fillRect(i - 3, h - 12, 8, 6); }
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cielo); else cielo();
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(cielo, 150); });
})();
