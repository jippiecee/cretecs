import { useEffect, useState } from "react";
import { Search } from "lucide-react";

// Edit daftar ini sesuka lu
const QUERIES = [
  "baggy jeans vintage",
  "jaket denim oversize",
  "kemeja flanel kotak-kotak",
  "hoodie y2k size L",
  "kaos band 90an",
  "celana cargo longgar",
  "sneakers second original",
  "tote bag kanvas",
];

const TYPE_MS = 70;   // kecepatan ngetik per huruf
const DELETE_MS = 35; // kecepatan ngapus per huruf
const HOLD_MS = 1400; // jeda setelah selesai ngetik, sebelum mulai ngapus
const GAP_MS = 400;   // jeda setelah kosong, sebelum kata berikutnya

export default function TypingSearch() {
  const [text, setText] = useState("");

  useEffect(() => {
    let word = 0;
    let len = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const current = QUERIES[word];

      if (!deleting) {
        len += 1;
        setText(current.slice(0, len));
        if (len === current.length) {
          deleting = true;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
      } else {
        len -= 1;
        setText(current.slice(0, len));
        if (len === 0) {
          deleting = false;
          word = (word + 1) % QUERIES.length;
          timer = setTimeout(tick, GAP_MS);
          return;
        }
        timer = setTimeout(tick, DELETE_MS);
      }
    };

    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="tsearch" aria-hidden="true">
      <Search size={18} />
      <span className="ts-text">
        {text}
        <i className="ts-caret" />
      </span>
    </div>
  );
}   