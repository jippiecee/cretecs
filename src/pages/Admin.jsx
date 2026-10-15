import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, CheckCircle2, ClipboardCheck, Clock, ExternalLink, LayoutDashboard, LogOut, Receipt, Store, Users, X, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const ST = { pending: [Clock, "Menunggu"], approved: [CheckCircle2, "Disetujui"], rejected: [XCircle, "Ditolak"] };
const OST = { pending: "Menunggu bayar", paid: "Dibayar", shipped: "Dikirim", completed: "Selesai", cancelled: "Dibatalkan" };
const SHADES = ["#1c1c1c", "#8a8a86", "#c9c7c0"];
const tip = { borderRadius: 12, border: "1px solid #e3e1db", fontSize: 12, boxShadow: "none" };

const ago = (v) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(v)) / 6e4));
  if (m < 60) return m + " mnt lalu";
  const h = Math.round(m / 60);
  return h < 24 ? h + " jam lalu" : Math.round(h / 24) + " hari lalu";
};

function Gauge({ pct }) {
  const len = Math.PI * 70;
  return (
    <svg viewBox="0 0 180 100" className="gauge" role="img" aria-label={`${pct} persen`}>
      <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="#ece9e2" strokeWidth="14" strokeLinecap="round" />
      <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="#1c1c1c" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${(len * pct) / 100} ${len}`} style={{ transition: "stroke-dasharray .8s cubic-bezier(.22,1,.36,1)" }} />
      <text x="90" y="82" textAnchor="middle" className="g-t">{pct}%</text>
    </svg>
  );
}

export default function Admin({ user, ready, notify }) {
  const nav = useNavigate();
  const root = useRef(null);
  const [role, setRole] = useState(null); // null = memuat
  const [view, setView] = useState("dash"); // dash | review | sellers
  const [tab, setTab] = useState("pending");
  const [products, setProducts] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("id", user.id).single()
      .then(({ data }) => setRole(data?.role ?? "user"));
  }, [user?.id]);

  useEffect(() => {
    if (role !== "admin") return;
    Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("orders").select("id,items,total,status,created_at").order("created_at", { ascending: false }).limit(200),
    ]).then(([p, pr, o]) => { setProducts(p.data ?? []); setProfiles(pr.data ?? []); setOrders(o.data ?? []); });
  }, [role]);

  const d = useMemo(() => {
    const L = products ?? [];
    const store = Object.fromEntries(profiles.map((p) => [p.id, p.store_name || "Tanpa nama"]));
    const n = (s) => L.filter((p) => p.status === s).length;
    const midnight = (v) => { const c = new Date(v); c.setHours(0, 0, 0, 0); return +c; };
    const today = midnight(Date.now());
    let run = L.filter((p) => midnight(p.created_at) < today - 29 * 864e5).length;
    const series = [...Array(30)].map((_, i) => {
      const t = today - (29 - i) * 864e5;
      run += L.filter((p) => midnight(p.created_at) === t).length;
      return { label: new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short" }), total: run };
    });
    const week = DAYS.map((l, i) => ({ l, n: L.filter((p) => new Date(p.created_at).getDay() === i).length }));
    const byCat = {};
    L.forEach((p) => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    const pending = L.filter((p) => p.status === "pending").sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const approved = n("approved"), rejected = n("rejected");
    const sellers = profiles.filter((p) => p.is_seller).map((s) => {
      const mine = L.filter((p) => p.seller_id === s.id);
      return {
        id: s.id, name: s.store_name || "Tanpa nama", total: mine.length,
        approved: mine.filter((p) => p.status === "approved").length,
        pending: mine.filter((p) => p.status === "pending").length, love: s.love_count || 0,
      };
    }).sort((a, b) => b.approved - a.approved || b.total - a.total);
    return {
      store, total: L.length, approved, rejected, pending, pendingN: pending.length,
      pct: approved + rejected ? Math.round((approved / (approved + rejected)) * 100) : 0,
      series, week, peak: Math.max(...week.map((w) => w.n)),
      cats: Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3),
      sellers, ordersN: orders.length,
      gmv: orders.filter((o) => o.status !== "cancelled").reduce((a, o) => a + (o.total || 0), 0),
    };
  }, [products, profiles, orders]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;
  if (role === null) return null;
  if (role !== "admin") return <Navigate to="/" />;

  const go = (v) => { setView(v); root.current?.scrollTo({ top: 0 }); };
  const out = async () => { await supabase.auth.signOut(); nav("/"); };
  const who = (p) => d.store[p.seller_id] || "Penjual";

  const decide = async (p, status) => {
    setBusy(p.id);
    const { error } = await supabase.from("products").update({ status }).eq("id", p.id);
    setBusy("");
    if (error) return notify("Gagal: " + error.message);
    setProducts((L) => L.map((x) => (x.id === p.id ? { ...x, status } : x)));
    notify(status === "approved" ? `"${p.name}" disetujui.` : `"${p.name}" ditolak.`);
  };

  const stats = [
    [Clock, "Menunggu review", d.pendingN, "perlu dicek"],
    [CheckCircle2, "Barang tayang", d.approved, "di toko sekarang"],
    [Store, "Penjual", d.sellers.length, "akun toko"],
    [Receipt, "Pesanan", d.ordersN, rp(d.gmv) + " nilai transaksi"],
  ];

  const Actions = ({ p, cls }) => (
    <div className={cls}>
      {p.status !== "approved" && <button className="ok" disabled={busy === p.id} onClick={() => decide(p, "approved")}><Check size={16} />Setujui</button>}
      {p.status !== "rejected" && <button className="no" disabled={busy === p.id} onClick={() => decide(p, "rejected")}><X size={16} />{p.status === "approved" ? "Tarik" : "Tolak"}</button>}
    </div>
  );

  const all = products ?? [];
  const shown = (tab === "all" ? all : all.filter((p) => p.status === tab))
    .slice().sort((a, b) => (tab === "pending" ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at)));

  return (
    <div className="dash" ref={root} data-lenis-prevent>
      <aside className="dash-side">
        <Link className="logo" to="/"><span className="mark">C</span>Cretecs</Link>
        <button className={"dl" + (view === "dash" ? " on" : "")} onClick={() => go("dash")}><LayoutDashboard size={18} />Dashboard</button>
        <button className={"dl" + (view === "review" ? " on" : "")} onClick={() => go("review")}>
          <ClipboardCheck size={18} />Review barang{d.pendingN > 0 && <span className="dl-n">{d.pendingN}</span>}
        </button>
        <button className={"dl" + (view === "sellers" ? " on" : "")} onClick={() => go("sellers")}><Users size={18} />Penjual</button>
        <Link className="dl" to="/"><ExternalLink size={18} />Lihat toko</Link>
        <div className="side-bottom">
          <div className="store-card">
            <small>Masuk sebagai admin</small><b>{user.email}</b>
            <button onClick={out}><LogOut size={15} />Logout</button>
          </div>
        </div>
      </aside>

      <section className="dash-main">
        {view === "dash" && (
          <>
            <div className="dash-top">
              <h1>Admin</h1>
              <button className="btn" onClick={() => go("review")}><ClipboardCheck size={16} />Review antrean{d.pendingN > 0 ? ` (${d.pendingN})` : ""}</button>
            </div>

            <div className="d-stats">
              {stats.map(([Icon, label, val, sub]) => (
                <div className="d-card" key={label}>
                  <div className="d-h"><span>{label}</span><Icon size={17} strokeWidth={1.7} /></div>
                  <b className="big">{val}</b><small>{sub}</small>
                </div>
              ))}
            </div>

            <div className="d-grid">
              <div className="d-col">
                <div className="d-card">
                  <div className="d-h"><span>Antrean review</span><small>{d.pendingN} menunggu</small></div>
                  {products === null ? <p className="none">Memuat...</p> : d.pendingN === 0 ? (
                    <div className="empty-box"><p>Antrean kosong.</p><p>Semua barang sudah direview.</p></div>
                  ) : (
                    <>
                      {d.pending.slice(0, 5).map((p) => (
                        <div className="q-row" key={p.id}>
                          <i className="q-img" style={{ backgroundImage: `url(${p.image_url})` }} />
                          <div className="q-info"><b>{p.name}</b><small>{rp(p.price)} · {p.category} · {who(p)}</small><small>{ago(p.created_at)}</small></div>
                          <Actions p={p} cls="q-act" />
                        </div>
                      ))}
                      {d.pendingN > 5 && <button className="q-more" onClick={() => go("review")}>Lihat {d.pendingN - 5} lainnya</button>}
                    </>
                  )}
                </div>

                <div className="d-card grow">
                  <div className="d-h"><span>Posting barang</span><small>30 hari terakhir</small></div>
                  <b className="big xl">{d.total}</b><small>total barang diposting</small>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height={190}>
                      <AreaChart data={d.series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                        <defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1c1c1c" stopOpacity=".18" /><stop offset="100%" stopColor="#1c1c1c" stopOpacity="0" />
                        </linearGradient></defs>
                        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={6} tick={{ fontSize: 11, fill: "#8a8a86" }} />
                        <YAxis hide allowDecimals={false} domain={[0, "dataMax + 1"]} />
                        <Tooltip contentStyle={tip} formatter={(v) => [v, "Total barang"]} />
                        <Area type="monotone" dataKey="total" stroke="#1c1c1c" strokeWidth={2} fill="url(#gb)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="cats">
                    {d.cats.length === 0 && <small>Belum ada kategori.</small>}
                    {d.cats.map(([c, v], i) => <div className="cat" key={c} style={{ "--c": SHADES[i] }}><small>{c}</small><b>{v}</b></div>)}
                  </div>
                </div>
              </div>

              <div className="d-col">
                <div className="d-card">
                  <div className="d-h"><span>Status barang</span></div>
                  <div className="seg-bar">
                    {d.total === 0 && <i style={{ flex: 1, background: "#ece9e2" }} />}
                    {[["approved", d.approved, "#1c1c1c"], ["pending", d.pendingN, "#8a8a86"], ["rejected", d.rejected, "#d9d6cf"]]
                      .map(([k, v, c]) => v > 0 && <i key={k} style={{ flex: v, background: c }} />)}
                  </div>
                  <div className="legend">
                    {[["Disetujui", d.approved, "#1c1c1c"], ["Menunggu", d.pendingN, "#8a8a86"], ["Ditolak", d.rejected, "#d9d6cf"]]
                      .map(([l, v, c]) => <div className="lg" key={l}><i style={{ background: c }} /><span>{l}</span><b>{v}</b></div>)}
                  </div>
                </div>

                <div className="d-card">
                  <div className="d-h"><span>Hari paling aktif</span></div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={d.week} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="l" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a8a86" }} />
                      <YAxis hide allowDecimals={false} domain={[0, "dataMax + 1"]} />
                      <Tooltip cursor={false} contentStyle={tip} formatter={(v) => [v, "Barang"]} />
                      <Bar dataKey="n" radius={8}>
                        {d.week.map((w) => <Cell key={w.l} fill={d.peak > 0 && w.n === d.peak ? "#1c1c1c" : "#ece9e2"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="d-card center grow">
                  <div className="d-h"><span>Rasio approval</span></div>
                  <Gauge pct={d.pct} />
                  <small>{d.approved} disetujui, {d.rejected} ditolak</small>
                </div>
              </div>
            </div>

            <div className="d-bottom">
              <div className="d-card">
                <div className="d-h"><span>Pesanan terbaru</span><small>{d.ordersN} total</small></div>
                {orders.length === 0 ? <div className="empty-box"><p>Belum ada pesanan.</p></div> : orders.slice(0, 5).map((o) => (
                  <div className="ord" key={o.id}>
                    <small>#{o.id.slice(0, 6)}</small>
                    <div><b>{Array.isArray(o.items) ? o.items.map((i) => i.name).join(", ") : "-"}</b><small className="blk">{ago(o.created_at)}</small></div>
                    <div className="ord-r"><b>{rp(o.total)}</b><small className="blk">{OST[o.status] ?? o.status}</small></div>
                  </div>
                ))}
              </div>

              <div className="d-card">
                <div className="d-h"><span>Penjual teratas</span><button className="q-link" onClick={() => go("sellers")}>Semua</button></div>
                {d.sellers.length === 0 ? <div className="empty-box"><p>Belum ada penjual.</p></div> : d.sellers.slice(0, 4).map((s) => (
                  <div className="mini" key={s.id}><b>{s.name}</b><small>{s.approved} tayang · {s.love} love</small></div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "review" && (
          <>
            <div className="dash-top"><h1>Review barang</h1></div>
            <div className="seg rv-tabs">
              {[["pending", "Menunggu", d.pendingN], ["approved", "Disetujui", d.approved], ["rejected", "Ditolak", d.rejected], ["all", "Semua", d.total]]
                .map(([k, l, c]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l} ({c})</button>)}
            </div>
            {products === null ? <p className="none">Memuat...</p> : shown.length === 0 ? (
              <div className="d-card"><div className="empty-box"><p>Tidak ada barang di sini.</p></div></div>
            ) : (
              <div className="rv-grid">
                {shown.map((p) => {
                  const [Icon, label] = ST[p.status];
                  return (
                    <article className="rv" key={p.id}>
                      <div className="rv-img" style={{ backgroundImage: `url(${p.image_url})` }}>
                        <span className={"mine-st rv-tag " + p.status}><Icon size={13} />{label}</span>
                      </div>
                      <div className="rv-body">
                        <b>{p.name}</b>
                        <span className="rv-price">{rp(p.price)}</span>
                        <small>{p.category} · Size {p.size || "-"} · {p.condition}</small>
                        <small>Oleh {who(p)} · {ago(p.created_at)}</small>
                        {p.description && <p>{p.description}</p>}
                      </div>
                      <Actions p={p} cls="rv-act" />
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === "sellers" && (
          <>
            <div className="dash-top"><h1>Penjual</h1></div>
            <div className="d-card">
              {d.sellers.length === 0 ? <div className="empty-box"><p>Belum ada akun toko.</p></div> : (
                <div className="tbl">
                  <div className="sl-row sl-head"><span>Toko</span><span className="hide-s">Total</span><span>Tayang</span><span className="hide-s">Menunggu</span><span>Love</span></div>
                  {d.sellers.map((s) => (
                    <div className="sl-row" key={s.id}>
                      <b>{s.name}</b><span className="hide-s">{s.total}</span><span>{s.approved}</span><span className="hide-s">{s.pending}</span><span>{s.love}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}