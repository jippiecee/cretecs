import fs from "node:fs";

const files = ["src/index.css", "src/polaroid.css", "src/quote.css"];

for (const f of files) {
  if (!fs.existsSync(f)) { console.log("skip (tidak ada):", f); continue; }
  let s = fs.readFileSync(f, "utf8");
  const keep = [];
  const hold = (m) => { keep.push(m); return `@@K${keep.length - 1}@@`; };

  s = s.replace(/@media[^{]*\{/g, hold);
  s = s.replace(/\.badge\{[^}]*\}/g, hold);

  let n = 0;
  s = s.replace(/(-?\d*\.?\d+)px/g, (m, num) => {
    const v = parseFloat(num);
    if (Math.abs(v) <= 2) return m;
    n++;
    return `${+(v / 16).toFixed(4)}rem`;
  });

  s = s.replace(/@@K(\d+)@@/g, (_, i) => keep[i]);
  fs.writeFileSync(f, s);
  console.log(`${f}: ${n} nilai px diubah ke rem`);
}