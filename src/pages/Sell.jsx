import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, Clock, ImagePlus, Star, Trash2, X, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const CATS = ["Atasan", "Bawahan", "Jaket", "Aksesoris", "Lainnya"];
const CONDS = ["Like new", "Good", "Fair"];
const MAX = 5;
const DRAFT = "cretecs-sell-draft";
const STATUS = {
  pending: [Clock, "Menunggu approval"],
  approved: [CheckCircle2, "Disetujui"],
  rejected: [XCircle, "Ditolak"],
};
const EMPTY = { name: "", price: "", category: "Atasan", size: "", condition: "Like new", description: "" };

const loadDraft = () => {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT) || "{}") }; } catch { return EMPTY; }
};

export default function Sell({ user, ready, notify }) {
  const [mine, setMine] = useState([]);
  const [tab, setTab] = useState("all");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(loadDraft);
  const [photos, setPhotos] = useState([]); // [{ file, url }]
  const [drag, setDrag] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const load = () =>
    supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setMine(data ?? []));
  useEffect(() => { if (user) load(); }, [user?.id]);

  useEffect(() => { // simpan draft teks
    try { localStorage.setItem(DRAFT, JSON.stringify(f)); } catch {}
  }, [f]);

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

  const priceNum = parseInt(f.price || "0", 10);
  const checks = [f.name.trim().length > 0, priceNum > 0, photos.length > 0];
  const done = checks.filter(Boolean).length;
  const complete = done === 3;

  const submit = async (e) => {
    e.preventDefault();
    if (!complete) return;
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
    setF(EMPTY); setPhotos([]);
    try { localStorage.removeItem(DRAFT); } catch {}
    notify("Terkirim. Produk tampil setelah disetujui admin.");
    load();
  };

  const del = async (p) => {
    if (!confirm(`Hapus "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return notify("Gagal hapus: " + error.message);
    setMine(mine.filter((x) => x.id !== p.id));
  };

  const count = (s) => mine.filter((p) => p.status === s).length;
  const shown = tab === "all" ? mine : mine.filter((p) => p.status === tab);

  return (
    <main className="page sell">
      <p className="eyebrow">Jual di Cretecs</p>
      <h1>Jual <em>barang</em> kamu</h1>
      <p className="sub">Setiap barang dicek admin dulu sebelum tampil di toko.</p>

      <div className="sell-grid">
        <form className="sell-form" onSubmit={submit}>
          <div className="prog">
            <div className="prog-top"><span>Kelengkapan</span><span>{done} dari 3 terisi</span></div>
            <div className="prog-bar"><i style={{ width: `${(done / 3) * 100}%` }} /></div>
          </div>

          <div className="field">
            <span className="lbl">Foto <small>({photos.length}/{MAX}, foto pertama jadi sampul)</small></span>
            <div className={"photos" + (drag ? " over" : "")}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
              {photos.map((p, i) => (
                <div className="ph" key={p.url}>
                  <img src={p.url} alt={`Foto ${i + 1}`} />
                  {i === 0 ? <span className="ph-cover">Sampul</span>
                    : <button type="button" className="ph-mk" aria-label="Jadikan sampul" onClick={() => makeCover(i)}><Star size={13} />Sampul</button>}
                  <button type="button" className="ph-x" aria-label="Hapus foto" onClick={() => removePhoto(i)}><X size={14} /></button>
                </div>
              ))}
              {photos.length < MAX && (
                <label className="ph add">
                  <ImagePlus size={24} strokeWidth={1.4} />
                  <span>{photos.length ? "Tambah" : "Pilih atau tarik foto"}</span>
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>

          <div className="field">
            <label className="lbl" htmlFor="nm">Nama barang</label>
            <input id="nm" className="in" maxLength={60} placeholder="Contoh: Boxy Denim Jacket" value={f.name} onChange={set("name")} />
          </div>

          <div className="two">
            <div className="field">
              <label className="lbl" htmlFor="pr">Harga</label>
              <div className="money"><span>Rp</span>
                <input id="pr" className="in" inputMode="numeric" placeholder="150.000"
                  value={f.price ? Number(f.price).toLocaleString("id-ID") : ""}
                  onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "").slice(0, 9) })} />
              </div>
            </div>
            <div className="field">
              <label className="lbl" htmlFor="sz">Ukuran</label>
              <input id="sz" className="in" maxLength={12} placeholder="M, L, 32..." value={f.size} onChange={set("size")} />
            </div>
          </div>

          <div className="field">
            <span className="lbl">Kategori</span>
            <div className="seg">{CATS.map((c) => <button type="button" key={c} className={c === f.category ? "on" : ""} onClick={() => setF({ ...f, category: c })}>{c}</button>)}</div>
          </div>

          <div className="field">
            <span className="lbl">Kondisi</span>
            <div className="seg">{CONDS.map((c) => <button type="button" key={c} className={c === f.condition ? "on" : ""} onClick={() => setF({ ...f, condition: c })}>{c}</button>)}</div>
          </div>

          <div className="field">
            <label className="lbl" htmlFor="ds">Deskripsi <small>({f.description.length}/300)</small></label>
            <textarea id="ds" className="in" maxLength={300} placeholder="Noda, jahitan, ukuran sebenarnya, atau kekurangan lain" value={f.description} onChange={set("description")} />
          </div>

          <button className="btn sell-btn" disabled={busy || !complete}>
            {busy ? "Mengirim..." : complete ? "Kirim untuk di-review" : "Lengkapi foto, nama, dan harga"}
          </button>
        </form>

        <aside className="sell-preview">
          <span className="lbl">Preview di toko</span>
          <article className="item">
            <div className="img" style={{ background: photos[0] ? `#d9d6cf url(${photos[0].url}) center/cover` : "#d9d6cf" }}>
              <span>{f.condition}</span>
            </div>
            <div className="meta"><h3>{f.name || "Nama barang"}</h3><small>Size {f.size || "-"} · {f.category}</small></div>
            <div className="buy"><b>{rp(priceNum)}</b></div>
          </article>
        </aside>
      </div>

      <h2 className="sell-h2">Barang <em>kamu</em></h2>
      <div className="stats">
        <div className="stat"><b>{mine.length}</b><small>Total dikirim</small></div>
        <div className="stat"><b>{count("pending")}</b><small>Menunggu</small></div>
        <div className="stat"><b>{count("approved")}</b><small>Disetujui</small></div>
      </div>
      <div className="seg tabs">
        {[["all", "Semua", mine.length], ["pending", "Menunggu", count("pending")], ["approved", "Disetujui", count("approved")], ["rejected", "Ditolak", count("rejected")]]
          .map(([k, l, n]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l} ({n})</button>)}
      </div>

      {shown.length === 0 ? <p className="none">Belum ada barang di sini.</p> : (
        <div className="mine">
          {shown.map((p) => {
            const [Icon, label] = STATUS[p.status];
            return (
              <article key={p.id} className="mine-card">
                <div className="mine-img" style={{ backgroundImage: `url(${p.image_url})` }} />
                <button className="mine-del" aria-label="Hapus barang" onClick={() => del(p)}><Trash2 size={15} /></button>
                <b>{p.name}</b>
                <small>{rp(p.price)}</small>
                <span className={"mine-st " + p.status}><Icon size={14} />{label}</span>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}