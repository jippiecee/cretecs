import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BadgeCheck, CalendarDays, Heart, Mail, MailWarning, PackageCheck, ShieldCheck, ShoppingBag, Store, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";
import SellerDashboard from "../components/SellerDashboard";

const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const OST = { pending: "Menunggu bayar", paid: "Dibayar", shipped: "Dikirim", completed: "Selesai", cancelled: "Dibatalkan" };
const OCLS = { pending: "", paid: "approved", shipped: "sale-shipping", completed: "sale-sold", cancelled: "rejected" };
const fmt = (v) => new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function Dashboard({ user, profile, ready, refreshProfile, notify }) {
  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return null;
  return profile.is_seller
    ? <SellerDashboard user={user} profile={profile} notify={notify} />
    : <Account user={user} profile={profile} refreshProfile={refreshProfile} notify={notify} />;
}

function Account({ user, profile, refreshProfile, notify }) {
  const [tab, setTab] = useState("info"); // info | orders
  const [orders, setOrders] = useState([]);
  const [loves, setLoves] = useState(0);
  const [store, setStore] = useState("");
  const [busy, setBusy] = useState(false);
  const [sellers, setSellers] = useState({}); // order_id -> [{ seller_id, store_name, loved }]
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [cool, setCool] = useState(0);
  const [vbusy, setVbusy] = useState(false);

  const verified = !!profile.email_verified_at;
  const name = (user.email || "").split("@")[0];
  const spent = orders.filter((o) => o.status !== "cancelled").reduce((a, o) => a + (o.total || 0), 0);

  const loadOrders = async () => {
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    const list = data ?? [];
    setOrders(list);
    const done = list.filter((o) => o.status === "completed");
    const res = await Promise.all(done.map((o) => supabase.rpc("order_sellers", { oid: o.id }).then(({ data }) => [o.id, data ?? []])));
    setSellers(Object.fromEntries(res));
  };
  useEffect(() => {
    loadOrders();
    supabase.from("loves").select("product_id", { count: "exact", head: true }).then(({ count }) => setLoves(count ?? 0));
  }, [user.id]);

  useEffect(() => {
    if (cool <= 0) return;
    const t = setTimeout(() => setCool(cool - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);

  const sendCode = async () => {
    setVbusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: user.email, options: { shouldCreateUser: false } });
    setVbusy(false);
    if (error) return notify(error.message);
    setSent(true); setCool(60);
    notify("Kode dikirim ke " + user.email);
  };

  const verify = async (e) => {
    e.preventDefault();
    setVbusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: user.email, token: code.trim(), type: "email" });
    if (error) { setVbusy(false); return notify("Kode salah atau sudah kedaluwarsa."); }
    const { error: e2 } = await supabase.rpc("confirm_email_verified");
    setVbusy(false);
    if (e2) return notify(e2.message);
    await refreshProfile();
    setSent(false); setCode("");
    notify("Email terverifikasi. Sekarang kamu bisa membuka toko.");
  };

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

  const cards = [
    [Mail, "Email", user.email, ""],
    [verified ? BadgeCheck : MailWarning, "Verifikasi", verified ? "Terverifikasi" : "Belum terverifikasi", verified ? "ok" : "warn"],
    [CalendarDays, "Bergabung", user.created_at ? fmt(user.created_at) : "-", ""],
    [ShoppingBag, "Total pesanan", orders.length, ""],
    [Wallet, "Total belanja", rp(spent), ""],
    [Heart, "Barang di-love", loves, ""],
  ];

  return (
    <main className="ac">
      <div className="ac-head">
        <b>Cretecs Account</b>
        <span className={"vf" + (verified ? "" : " no")}>
          {verified ? <><BadgeCheck size={14} />Email terverifikasi</> : <><MailWarning size={14} />Belum terverifikasi</>}
        </span>
      </div>

      <div className="ac-body">
        {/* static: tidak ikut turun saat di-scroll */}
        <aside className="ac-side" style={{ position: "static" }}>
          <div className="ac-ava">{(name[0] || "?").toUpperCase()}</div>
          <b className="ac-name">{name}</b>
          <small className="ac-mail">{user.email}</small>
          <nav className="ac-menu">
            <button className={tab === "info" ? "on" : ""} onClick={() => setTab("info")}>Informasi akun</button>
            <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>
              Pesanan saya{orders.length > 0 && <span className="ac-n">{orders.length}</span>}
            </button>
          </nav>
        </aside>

        <section className="ac-main">
          {tab === "info" && (
            <>
              <h2>Informasi akun</h2>
              <p className="ac-desc">Kelola akunmu di Cretecs, lihat ringkasan belanja, dan buka toko kalau kamu mau mulai berjualan.</p>

              <div className="ac-grid">
                {cards.map(([Icon, label, value, cls]) => (
                  <div className={"ac-card " + cls} key={label}>
                    <div className="ac-top"><span>{label}</span><i className="ac-ico"><Icon size={17} strokeWidth={1.7} /></i></div>
                    <b>{value}</b>
                  </div>
                ))}

                {!verified && (
                  <section className="ac-verify">
                    <div>
                      <i className="ac-ico"><ShieldCheck size={18} strokeWidth={1.7} /></i>
                      <h3>Verifikasi email</h3>
                      <p>Untuk membuka toko, kami perlu memastikan email ini milikmu. Kami kirim kode 6 digit ke <b>{user.email}</b>.</p>
                    </div>
                    {!sent ? (
                      <div className="v-form">
                        <button className="v-btn" onClick={sendCode} disabled={vbusy}>{vbusy ? "Mengirim..." : "Kirim kode ke email"}</button>
                      </div>
                    ) : (
                      <form className="v-form" onSubmit={verify}>
                        <input className="v-in" inputMode="numeric" autoComplete="one-time-code" maxLength={10} minLength={6} required
                          placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                        <button className="v-btn" disabled={vbusy || code.length < 6}>{vbusy ? "Memeriksa..." : "Verifikasi"}</button>
                        <button type="button" className="v-link" disabled={cool > 0 || vbusy} onClick={sendCode}>
                          {cool > 0 ? `Kirim ulang kode (${cool}s)` : "Kirim ulang kode"}
                        </button>
                      </form>
                    )}
                  </section>
                )}

                <section className="ac-wide">
                  <div className="ac-wide-t">
                    <i className="ac-ico inv"><Store size={18} strokeWidth={1.7} /></i>
                    <h3>Ubah ke akun toko</h3>
                    <p>{verified ? "Punya barang thrift untuk dijual? Buka tokomu dan dapatkan dashboard penjual. Setiap barang dicek admin sebelum tampil." : "Verifikasi email dulu sebelum bisa membuka toko."}</p>
                  </div>
                  <form onSubmit={open} className="a-form">
                    <input className="a-in" required minLength={3} maxLength={30} placeholder="Nama toko" value={store} onChange={(e) => setStore(e.target.value)} disabled={!verified} />
                    <button className="a-btn" disabled={!verified || busy}>{busy ? "Memproses..." : "Buka toko"}</button>
                  </form>
                </section>
              </div>
            </>
          )}

          {tab === "orders" && (
            <>
              <h2>Pesanan saya</h2>
              <p className="ac-desc">Pantau pesananmu. Setelah barang diterima, kamu bisa memberi love ke penjualnya.</p>

              {orders.length === 0 ? (
                <div className="empty-box"><p>Belum ada pesanan.</p><p>Pilih barang dari koleksi untuk mulai belanja.</p></div>
              ) : orders.map((o) => (
                <article key={o.id} className="ac-ord">
                  <div className="ac-ord-top">
                    <div className="ac-ord-l">
                      <small>#{o.id.slice(0, 6)} · {fmt(o.created_at)}</small>
                      <b>{o.items.map((i) => i.name).join(", ")}</b>
                    </div>
                    <div className="ac-ord-r">
                      <b>{rp(o.total)}</b>
                      <span className={"mine-st " + (OCLS[o.status] ?? "")}>{OST[o.status] ?? o.status}</span>
                    </div>
                  </div>

                  {(o.status === "paid" || o.status === "shipped") && (
                    <div className="ac-act">
                      <button className="love-btn" onClick={() => finish(o)}><PackageCheck size={15} />Pesanan diterima</button>
                    </div>
                  )}
                  {o.status === "completed" && (sellers[o.id] ?? []).length > 0 && (
                    <div className="ac-act">
                      {sellers[o.id].map((s) => (
                        <button key={s.seller_id} className={"love-btn" + (s.loved ? " done" : "")} disabled={s.loved} onClick={() => giveLove(o, s)}>
                          <Heart size={15} fill={s.loved ? "currentColor" : "none"} />{s.loved ? `Love terkirim ke ${s.store_name}` : `Beri ${s.store_name} love`}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  );
}