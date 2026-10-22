import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import "../searchbar.css";

// Edit daftar ini sesuka lu (muncul sebagai teks yang diketik otomatis)
const HINTS = [
  "baggy jeans vintage",
  "jaket denim oversize",
  "kemeja flanel kotak-kotak",
  "hoodie y2k size L",
  "kaos band 90an",
  "celana cargo longgar",
  "sneakers second original",
  "tote bag kanvas",
];

const TYPE_MS = 70;
const DELETE_MS = 35;
const HOLD_MS = 1400;
const GAP_MS = 400;

export default function SearchBar({ value, onChange, hints = HINTS }) {
  const [focus, setFocus] = useState(false);
  const [hint, setHint] = useState("");
  const inputRef = useRef(null);
  const idle = !focus && !value;

  // animasi ngetik cuma jalan kalau lagi kosong dan nggak difokus
  useEffect(() => {
    if (!idle) { setHint(""); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHint(hints[0]);
      return;
    }
    let word = 0, len = 0, deleting = false, timer;
    const tick = () => {
      const cur = hints[word];
      if (!deleting) {
        len += 1;
        setHint(cur.slice(0, len));
        if (len === cur.length) { deleting = true; timer = setTimeout(tick, HOLD_MS); return; }
        timer = setTimeout(tick, TYPE_MS);
      } else {
        len -= 1;
        setHint(cur.slice(0, len));
        if (len === 0) { deleting = false; word = (word + 1) % hints.length; timer = setTimeout(tick, GAP_MS); return; }
        timer = setTimeout(tick, DELETE_MS);
      }
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [idle, hints]);

  // tekan "/" di mana saja buat fokus ke search
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clear = () => { onChange(""); inputRef.current?.focus(); };

  return (
    <label className={"sbar" + (focus ? " on" : "") + (value ? " has" : "")}>
      <Search size={18} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { value ? onChange("") : e.currentTarget.blur(); }
        }}
        placeholder={focus ? "Cari nama, kategori, size, toko..." : ""}
        aria-label="Cari barang"
        autoComplete="off"
        spellCheck="false"
      />
      {idle && (
        <span className="sbar-hint" aria-hidden="true">
          {hint}
          <i className="sbar-caret" />
        </span>
      )}
      {value && (
        <button type="button" className="sbar-x" aria-label="Hapus pencarian"
          onMouseDown={(e) => e.preventDefault()} onClick={clear}>
          <X size={14} />
        </button>
      )}
    </label>
  );
}