import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ImagePlus, Star, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import "../sell.css";

const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const CATS = ["Atasan", "Bawahan", "Jaket", "Aksesoris", "Lainnya"];
const CONDS = [
  ["Like new", "Hampir tanpa bekas pakai"],
  ["Good", "Bagus, ada tanda pakai tipis"],
  ["Fair", "Ada kekurangan, jelaskan di deskripsi"],
];
const SIZES = ["S", "M", "L", "XL", "All size"];
const MAX = 5;
const DRAFT = "cretecs-sell-draft";
const EMPTY = { name: "", price: "", category: "Atasan", size: "", condition: "Like new", description: "" };

const loadDraft = () => {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT) || "{}") }; } catch { return EMPTY; }
};

export default function Sell({ user, ready, notify }) {
  const nav = useNavigate();
  const [f, setF] = useState(loadDraft);
  const [photos, setPhotos] = useState([]); // [{ file, url }]
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { // simpan draft teks
    try { localStorage.setItem(DRAFT, JSON.stringify(f)); } catch {}
  }, [f]);

  const priceNum = parseInt(f.price || "0", 10);
  const checks = useMemo(() => [
    ["Foto", photos.length > 0],
    ["Nama barang", f.name.trim().length > 0],
    ["Harga", priceNum > 0],
  ], [photos.length, f.name, priceNum]);
  const done = checks.filter((c) => c[1]).length;
  const complete = done === checks.length;

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
  const removePhoto = (i) => { URL.revokeObjectURL(photos[i].url); setPhotos(photos.filter((_, k) => k !== i)); };
  const makeCover = (i) => setPhotos([photos[i], ...photos.filter((_, k) => k !== i)]);

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

  const [cover, ...rest] = photos;

  return (
    <main className="page sp">
      <Link to="/dashboard" className="sp-back"><ArrowLeft size={16} />Kembali ke dashboard</Link>
      <header className="sp-head">
        <h1>Jual <em>barang</em></h1>
        <p>Isi detailnya, kami cek dulu sebelum tampil di toko.</p>
      </header>

      <form className="sp-grid" onSubmit={submit}>
        <div className="sp-main">
          {/* 1. FOTO */}
          <section className="sp-card">
            <div className="sp-title"><i>1</i><div><h2>Foto barang</h2><small>Sampai {MAX} foto, maksimal 3 MB per foto. Foto pertama jadi sampul.</small></div><span className="sp-count">{photos.length}/{MAX}</span></div>

            {photos.length === 0 ? (
              <label className={"sp-drop" + (drag ? " over" : "")}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
                <span className="sp-drop-ic"><ImagePlus size={26} strokeWidth={1.5} /></span>
                <b>Tarik foto ke sini</b>
                <small>atau klik untuk pilih dari galeri</small>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
            ) : (
              <div className={"sp-photos" + (drag ? " over" : "")}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
                <div className="sp-cover">
                  <img src={cover.url} alt="Foto sampul" />
                  <span className="sp-tag">Sampul</span>
                  <button type="button" className="sp-x" aria-label="Hapus foto" onClick={() => removePhoto(0)}><X size={15} /></button>
                </div>
                <div className="sp-thumbs">
                  {rest.map((p, i) => (
                    <div className="sp-th" key={p.url}>
                      <img src={p.url} alt={`Foto ${i + 2}`} />
                      <button type="button" className="sp-mk" onClick={() => makeCover(i + 1)}><Star size={12} />Sampul</button>
                      <button type="button" className="sp-x sm" aria-label="Hapus foto" onClick={() => removePhoto(i + 1)}><X size={13} /></button>
                    </div>
                  ))}
                  {photos.length < MAX && (
                    <label className="sp-th add">
                      <ImagePlus size={20} strokeWidth={1.5} /><span>Tambah</span>
                      <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 2. DETAIL */}
          <section className="sp-card">
            <div className="sp-title"><i>2</i><div><h2>Detail barang</h2><small>Nama yang jelas dan harga yang pas bikin cepat laku.</small></div></div>

            <div className="sp-field">
              <label htmlFor="nm">Nama barang <small>{f.name.length}/60</small></label>
              <input id="nm" className="sp-in" maxLength={60} placeholder="Contoh: Boxy Denim Jacket" value={f.name} onChange={set("name")} />
            </div>

            <div className="sp-field">
              <label htmlFor="pr">Harga</label>
              <div className="sp-money"><span>Rp</span>
                <input id="pr" className="sp-in" inputMode="numeric" placeholder="150.000"
                  value={f.price ? Number(f.price).toLocaleString("id-ID") : ""}
                  onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "").slice(0, 9) })} />
              </div>
            </div>

            <div className="sp-field">
              <label htmlFor="sz">Ukuran</label>
              <div className="sp-chips">
                {SIZES.map((s) => <button type="button" key={s} className={f.size === s ? "on" : ""} onClick={() => setF({ ...f, size: f.size === s ? "" : s })}>{s}</button>)}
                <input id="sz" className="sp-in sp-size" maxLength={12} placeholder="atau ketik (32, 40...)" value={SIZES.includes(f.size) ? "" : f.size} onChange={set("size")} />
              </div>
            </div>
          </section>

          {/* 3. KATEGORI & KONDISI */}
          <section className="sp-card">
            <div className="sp-title"><i>3</i><div><h2>Kategori dan kondisi</h2><small>Jujur soal kondisi, pembeli lebih percaya.</small></div></div>

            <div className="sp-field">
              <label>Kategori</label>
              <div className="sp-chips">
                {CATS.map((c) => <button type="button" key={c} className={f.category === c ? "on" : ""} onClick={() => setF({ ...f, category: c })}>{c}</button>)}
              </div>
            </div>

            <div className="sp-field">
              <label>Kondisi</label>
              <div className="sp-conds">
                {CONDS.map(([c, d]) => (
                  <button type="button" key={c} className={f.condition === c ? "on" : ""} onClick={() => setF({ ...f, condition: c })}>
                    <b>{c}</b><small>{d}</small>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 4. DESKRIPSI */}
          <section className="sp-card">
            <div className="sp-title"><i>4</i><div><h2>Deskripsi <em>(opsional)</em></h2><small>Noda, jahitan, ukuran sebenarnya, atau kekurangan lain.</small></div></div>
            <div className="sp-field">
              <textarea className="sp-in" maxLength={300} placeholder="Contoh: Lingkar dada 58 cm, panjang 70 cm. Ada noda kecil di lengan kiri." value={f.description} onChange={set("description")} />
              <small className="sp-cnt">{f.description.length}/300</small>
            </div>
          </section>
        </div>

        {/* SIDEBAR: preview + checklist + kirim */}
        <aside className="sp-side">
          <div className="sp-card sp-preview">
            <span className="sp-lbl">Preview di toko</span>
            <article className="item">
              <div className="img" style={{ background: cover ? `#d9d6cf url(${cover.url}) center/cover` : "#d9d6cf" }}>
                <span>{f.condition}</span>
              </div>
              <div className="meta"><h3>{f.name || "Nama barang"}</h3><small>Size {f.size || "-"} · {f.category}</small></div>
              <div className="buy"><b>{rp(priceNum)}</b></div>
            </article>
          </div>

          <div className="sp-card sp-submit">
            <div className="sp-prog"><i style={{ width: `${(done / checks.length) * 100}%` }} /></div>
            <ul className="sp-checks">
              {checks.map(([l, ok]) => (
                <li key={l} className={ok ? "ok" : ""}><span>{ok && <Check size={12} strokeWidth={3} />}</span>{l}</li>
              ))}
            </ul>
            <button className="btn sp-btn" disabled={!complete || busy}>
              {busy ? "Mengirim..." : complete ? "Kirim untuk di-review" : "Lengkapi dulu"}
            </button>
            <small className="sp-note">Setelah terkirim, kelola barangmu dari Dashboard.</small>
          </div>
        </aside>
      </form>
    </main>
  );
}