import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import PhotoStage from "../components/sell/PhotoStage";
import { Chips, Field, MoneyInput, Segmented, TextInput } from "../components/sell/Fields";
import "../sell.css";

const CATS = ["Atasan", "Bawahan", "Jaket", "Aksesoris", "Lainnya"];
const CONDS = ["Like new", "Good", "Fair"];
const SIZES = ["S", "M", "L", "XL", "All size"];
const MAX = 5;
const DRAFT = "secondlove-sell-draft";
const EMPTY = { name: "", price: "", category: "Atasan", size: "", condition: "Like new", description: "" };

const loadDraft = () => {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT) || "{}") }; } catch { return EMPTY; }
};

export default function Sell({ user, ready, notify }) {
  const nav = useNavigate();
  const [f, setF] = useState(loadDraft);
  const [photos, setPhotos] = useState([]); // [{ file, url }]
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const up = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const onText = (k) => (e) => up(k)(e.target.value);

  useEffect(() => { // simpan draft teks
    try { localStorage.setItem(DRAFT, JSON.stringify(f)); } catch {}
  }, [f]);

  const priceNum = parseInt(f.price || "0", 10);
  const missing = [
    !photos.length && "foto",
    !f.name.trim() && "nama",
    !(priceNum > 0) && "harga",
  ].filter(Boolean);
  const complete = missing.length === 0;

  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;

  const addFiles = (list) => {
    const room = MAX - photos.length;
    const ok = [];
    for (const fl of Array.from(list || [])) {
      if (!fl.type.startsWith("image/")) { notify("File harus berupa gambar."); continue; }
      if (fl.size > 3 * 1024 * 1024) { notify("Ukuran tiap foto maksimal 3 MB."); continue; }
      ok.push({ file: fl, url: URL.createObjectURL(fl) });
    }
    if (ok.length > room) notify(`Maksimal ${MAX} foto.`);
    setPhotos([...photos, ...ok.slice(0, room)]);
  };
  const removePhoto = (i) => {
    URL.revokeObjectURL(photos[i].url);
    setPhotos(photos.filter((_, k) => k !== i));
    setActive(0);
  };
  const makeCover = (i) => { setPhotos([photos[i], ...photos.filter((_, k) => k !== i)]); setActive(0); };

  const submit = async (e) => {
    e.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    const stamp = Date.now();
    const ups = await Promise.all(photos.map(async ({ file }, i) => {
      const path = `${user.id}/${stamp}-${i}-${file.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from("products").upload(path, file);
      return error ? { error } : { url: supabase.storage.from("products").getPublicUrl(path).data.publicUrl };
    }));
    const bad = ups.find((u) => u.error);
    if (bad) { setBusy(false); return notify("Upload foto gagal: " + bad.error.message); }
    const images = ups.map((u) => u.url);
    const { error } = await supabase.from("products").insert({
      name: f.name.trim(), price: priceNum, category: f.category, size: f.size.trim(),
      condition: f.condition, description: f.description.trim(),
      images, image_url: images[0], seller_id: user.id,
    });
    setBusy(false);
    if (error) return notify("Gagal: " + error.message);
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    try { localStorage.removeItem(DRAFT); } catch {}
    notify("Terkirim. Barang tampil setelah disetujui admin.");
    nav("/dashboard");
  };

  return (
    <main className="sx" data-lenis-prevent>
      <form className="sx-card" onSubmit={submit}>
        <PhotoStage photos={photos} active={active} max={MAX}
          onActive={setActive} onAdd={addFiles} onRemove={removePhoto} onCover={makeCover} />

        <section className="sx-form">
          <header className="sx-head">
            <Link to="/dashboard" className="sx-back"><ArrowLeft size={15} />Dashboard</Link>
            <h1>Jual barang</h1>
          </header>

          <div className="sx-fields">
            <Field label="Nama barang" htmlFor="nm" hint={`${f.name.length}/60`}>
              <TextInput id="nm" maxLength={60} placeholder="Contoh: Boxy Denim Jacket" value={f.name} onChange={onText("name")} />
            </Field>

            <Field label="Harga" htmlFor="pr">
              <MoneyInput id="pr" value={f.price} onChange={up("price")} />
            </Field>

            <Field label="Ukuran">
              <Chips options={SIZES} value={f.size} onChange={up("size")} toggle>
                <input className="sx-in sx-size" maxLength={12} placeholder="32, 40..."
                  value={SIZES.includes(f.size) ? "" : f.size} onChange={onText("size")} aria-label="Ukuran lain" />
              </Chips>
            </Field>

            <Field label="Kategori">
              <Chips options={CATS} value={f.category} onChange={up("category")} />
            </Field>

            <Field label="Kondisi">
              <Segmented options={CONDS} value={f.condition} onChange={up("condition")} />
            </Field>

            <Field label="Deskripsi" htmlFor="ds" hint={`opsional · ${f.description.length}/300`} grow>
              <textarea id="ds" className="sx-in" maxLength={300} placeholder="Noda, jahitan, ukuran sebenarnya, atau kekurangan lain"
                value={f.description} onChange={onText("description")} />
            </Field>
          </div>

          <footer className="sx-foot">
            <button className="btn sx-btn" disabled={!complete || busy}>
              {busy ? "Mengirim..." : complete ? "Kirim untuk di-review" : `Lengkapi: ${missing.join(", ")}`}
            </button>
          </footer>
        </section>
      </form>
    </main>
  );
}