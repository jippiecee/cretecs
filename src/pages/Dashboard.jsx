import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BadgeCheck, Heart, MailWarning, PackageCheck, Store } from "lucide-react";
import { supabase } from "../lib/supabase";
import SellerDashboard from "../components/SellerDashboard";

const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const OST = { pending: "Menunggu bayar", paid: "Dibayar", shipped: "Dikirim", completed: "Selesai", cancelled: "Dibatalkan" };

export default function Dashboard({ user, profile, ready, refreshProfile, notify }) {
  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return null;
  return profile.is_seller
    ? <SellerDashboard user={user} profile={profile} notify={notify} />
    : <Account user={user} refreshProfile={refreshProfile} notify={notify} />;
}

function Account({ user, refreshProfile, notify }) {
  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState("");
  const [busy, setBusy] = useState(false);
  const [sellers, setSellers] = useState({}); // order_id -> [{ seller_id, store_name, loved }]
  const verified = !!user.email_confirmed_at;

  const loadOrders = async () => {
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    const list = data ?? [];
    setOrders(list);
    const done = list.filter((o) => o.status === "completed");
    const res = await Promise.all(done.map((o) => supabase.rpc("order_sellers", { oid: o.id }).then(({ data }) => [o.id, data ?? []])));
    setSellers(Object.fromEntries(res));
  };
  useEffect(() => { loadOrders(); }, [user.id]);

  const finish = async (o) => {
    const { error } = await supabase.rpc("complete_order", { oid: o.id });
    if (error) return notify(error.message);
    notify("Pesanan selesai. Kasih love ke penjualnya?");
    loadOrders();
  };

  const giveLove = async (o, s) => {
    const { error } = await supabase.rpc("give_seller_love", { oid: o.id, sid: s.seller_id });
    if (error) return notify(error.message);
    notify(`Love terkirim ke ${s.store_name}. Makasih!`);
    loadOrders();
  };

  const open = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("become_seller", { store });
    setBusy(false);
    if (error) return notify(error.message);
    await refreshProfile();
    notify("Akun toko aktif. Selamat berjualan!");
  };

  return (
    <main className="page acct">
      <p className="eyebrow">Dashboard</p>
      <h1>Akun <em>saya</em></h1>

      <div className="a-grid">
        <section className="a-card">
          <h3>Akun</h3>
          <p>{user.email}</p>
          <span className={"vf" + (verified ? "" : " no")}>
            {verified ? <><BadgeCheck size={14} />Email terverifikasi</> : <><MailWarning size={14} />Email belum terverifikasi</>}
          </span>
        </section>

        <section className="a-card a-dark">
          <h3><Store size={18} style={{ verticalAlign: "-3px", marginRight: 8 }} />Ubah ke akun toko</h3>
          <p>{verified ? "Punya barang thrift untuk dijual? Buka tokomu dan dapatkan dashboard penjual. Setiap barang dicek admin sebelum tampil." : "Verifikasi email dulu sebelum bisa membuka toko."}</p>
          <form onSubmit={open} className="a-form">
            <input className="a-in" required minLength={3} maxLength={30} placeholder="Nama toko" value={store} onChange={(e) => setStore(e.target.value)} disabled={!verified} />
            <button className="a-btn" disabled={!verified || busy}>{busy ? "Memproses..." : "Buka toko"}</button>
          </form>
        </section>
      </div>

      <h2 className="sell-h2" style={{ marginTop: 0 }}>Pesanan <em>saya</em></h2>
      {orders.length === 0 ? <p className="none">Belum ada pesanan.</p> : orders.map((o) => (
        <div key={o.id} className="ord">
          <small>#{o.id.slice(0, 6)}</small>
          <div><b>{o.items.map((i) => i.name).join(", ")}</b><small className="blk">{new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</small></div>
          <div className="ord-r"><b>{rp(o.total)}</b><small className="blk">{OST[o.status] ?? o.status}</small></div>
          {(o.status === "paid" || o.status === "shipped") && (
            <div className="ord-act"><button className="love-btn" onClick={() => finish(o)}><PackageCheck size={15} />Pesanan diterima</button></div>
          )}
          {o.status === "completed" && (sellers[o.id] ?? []).length > 0 && (
            <div className="ord-act">
              {sellers[o.id].map((s) => (
                <button key={s.seller_id} className={"love-btn" + (s.loved ? " done" : "")} disabled={s.loved} onClick={() => giveLove(o, s)}>
                  <Heart size={15} fill={s.loved ? "currentColor" : "none"} />{s.loved ? `Love terkirim ke ${s.store_name}` : `Beri ${s.store_name} love`}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}