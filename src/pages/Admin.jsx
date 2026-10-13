import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const rp = (n) => "Rp" + n.toLocaleString("id-ID");

export default function Admin({ user, isAdmin, ready, notify }) {
  const [list, setList] = useState([]);
  const load = () => supabase.from("products").select("*").eq("status", "pending").order("created_at").then(({ data }) => setList(data ?? []));
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!ready) return null;
  if (!user || !isAdmin) return <Navigate to="/" />;

  const decide = async (id, status) => {
    const { error } = await supabase.from("products").update({ status }).eq("id", id);
    if (error) return notify("Gagal: " + error.message);
    notify(status === "approved" ? "Produk disetujui." : "Produk ditolak."); load();
  };

  return (
    <main className="page">
      <h1>Menunggu <em>approval</em> ({list.length})</h1>
      <section className="queue">
        {list.length === 0 && <p className="none">Tidak ada antrean.</p>}
        {list.map((p) => (
          <div key={p.id} className="row-item">
            <img src={p.image_url} alt="" />
            <div><b>{p.name}</b><small>{rp(p.price)} · {p.category} · Size {p.size || "-"} · {p.condition}</small>{p.description && <small>{p.description}</small>}</div>
            <div className="acts">
              <button className="ok" onClick={() => decide(p.id, "approved")}>Setujui</button>
              <button onClick={() => decide(p.id, "rejected")}>Tolak</button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}