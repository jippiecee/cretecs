import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const rp = (n) => "Rp" + n.toLocaleString("id-ID");
const STATUS = { pending: "Menunggu approval", approved: "Disetujui", rejected: "Ditolak" };

export default function Sell({ user, ready, notify }) {
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", price: "", category: "Atasan", size: "", condition: "Like new", description: "" });
  const [file, setFile] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const load = () => supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setMine(data ?? []));
  useEffect(() => { if (user) load(); }, [user?.id]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return notify("Pilih foto produk dulu.");
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) return notify("Foto harus gambar dan maksimal 3 MB.");
    setBusy(true);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
    const up = await supabase.storage.from("products").upload(path, file);
    if (up.error) { setBusy(false); return notify("Upload foto gagal: " + up.error.message); }
    const image_url = supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("products").insert({ ...f, price: parseInt(f.price, 10), image_url, seller_id: user.id });
    setBusy(false);
    if (error) return notify("Gagal: " + error.message);
    setF({ ...f, name: "", price: "", size: "", description: "" }); setFile(null); e.target.reset();
    notify("Terkirim. Produk tampil setelah disetujui admin."); load();
  };

  return (
    <main className="page">
      <h1>Jual <em>barang</em></h1>
      <form className="form" onSubmit={submit}>
        <input required placeholder="Nama barang" value={f.name} onChange={set("name")} />
        <div className="row">
          <input required type="number" min="1" placeholder="Harga (Rp)" value={f.price} onChange={set("price")} />
          <input placeholder="Ukuran (M, L, 32...)" value={f.size} onChange={set("size")} />
        </div>
        <div className="row">
          <label>Kategori<select value={f.category} onChange={set("category")}>{["Atasan", "Bawahan", "Jaket", "Aksesoris", "Lainnya"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Kondisi<select value={f.condition} onChange={set("condition")}>{["Like new", "Good", "Fair"].map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        <textarea placeholder="Deskripsi, noda, atau kekurangan" value={f.description} onChange={set("description")} />
        <label>Foto<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></label>
        <button className="btn" disabled={busy}>{busy ? "Mengirim..." : "Kirim untuk di-review"}</button>
      </form>

      <section className="queue">
        {mine.map((p) => (
          <div key={p.id} className="row-item">
            <img src={p.image_url} alt="" />
            <div><b>{p.name}</b><small>{rp(p.price)}</small></div>
            <span className={"st " + p.status}>{STATUS[p.status]}</span>
          </div>
        ))}
      </section>
    </main>
  );
}