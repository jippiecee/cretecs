import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Boxes, CheckCircle2, ChevronRight, Circle, Clock, ExternalLink, Heart, LayoutDashboard, LifeBuoy, LogOut, PackageCheck, Plus, Ruler, Settings, Shirt, ShoppingBag, Sun, Trash2, Truck, X, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { HelpView, SettingsView } from "./SellerViews";

const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const ST = { pending: [Clock, "Menunggu"], approved: [CheckCircle2, "Disetujui"], rejected: [XCircle, "Ditolak"] };
const SALE = { available: [ShoppingBag, "Dijual"], shipping: [Truck, "Dikirim"], sold: [PackageCheck, "Terjual"] };
const CATS = ["Atasan", "Bawahan", "Jaket", "Aksesoris", "Lainnya"];
const CONDS = ["Like new", "Good", "Fair"];
const SHADES = ["#1c1c1c", "#8a8a86", "#c9c7c0"];
const tip = { borderRadius: 12, border: "1px solid #e3e1db", fontSize: 12, boxShadow: "none" };
const TIPS = [
  [Sun, "Foto di cahaya alami", "Hasil lebih jelas dan warnanya sesuai aslinya."],
  [Shirt, "Tunjukkan detail", "Label, jahitan, dan kondisi kain dari dekat."],
  [Ruler, "Tulis ukuran asli", "Cantumkan ukuran sebenarnya dan noda kalau ada."],
];

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

function ManageModal({ item, onClose, onSaved, onDeleted, notify }) {
  const [f, setF] = useState({
    name: item.name, price: String(item.price), category: item.category, size: item.size || "",
    condition: item.condition || "Good", description: item.description || "", sale_status: item.sale_status || "available",
  });
  const [busy, setBusy] = useState(false);
  const approved = item.status === "approved";
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const price = parseInt(f.price || "0", 10);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("seller_update_product", {
      pid: item.id, p_name: f.name, p_price: price, p_category: f.category, p_size: f.size,
      p_condition: f.condition, p_description: f.description, p_sale_status: f.sale_status,
    });
    setBusy(false);
    if (error) return notify(error.message);
    notify("Barang diperbarui.");
    onSaved();
  };

  const del = async () => {
    if (!confirm(`Hapus "${item.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", item.id);
    if (error) return notify("Gagal hapus: " + error.message);
    onDeleted();
  };

  return (
    <div className="scrim center" onClick={onClose} data-lenis-prevent>
      <form className="manage" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="manage-top">
          <span className="pn"><i style={{ backgroundImage: `url(${item.image_url})` }} /><b>Kelola barang</b></span>
          <button type="button" aria-label="Tutup" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="field">
          <span className="lbl">Status penjualan</span>
          <div className="seg">
            {Object.entries(SALE).map(([k, [Icon, label]]) => (
              <button type="button" key={k} disabled={!approved && k !== "available"}
                className={f.sale_status === k ? "on" : ""} onClick={() => setF({ ...f, sale_status: k })}>
                <Icon size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{label}
              </button>
            ))}
          </div>
          {!approved && <small className="mute">Dikirim/Terjual bisa dipilih setelah barang disetujui admin.</small>}
        </div>

        <div className="field">
          <label className="lbl" htmlFor="m-nm">Nama barang</label>
          <input id="m-nm" className="in" maxLength={60} value={f.name} onChange={set("name")} required />
        </div>

        <div className="two">
          <div className="field">
            <label className="lbl" htmlFor="m-pr">Harga</label>
            <div className="money"><span>Rp</span>
              <input id="m-pr" className="in" inputMode="numeric"
                value={f.price ? Number(f.price).toLocaleString("id-ID") : ""}
                onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "").slice(0, 9) })} />
            </div>
          </div>
          <div className="field">
            <label className="lbl" htmlFor="m-sz">Ukuran</label>
            <input id="m-sz" className="in" maxLength={12} value={f.size} onChange={set("size")} />
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
          <label className="lbl" htmlFor="m-ds">Deskripsi <small>({f.description.length}/300)</small></label>
          <textarea id="m-ds" className="in" maxLength={300} value={f.description} onChange={set("description")} />
        </div>

        <div className="manage-foot">
          <button type="button" className="manage-del" onClick={del}><Trash2 size={15} />Hapus</button>
          <button className="btn" disabled={busy || !f.name.trim() || price <= 0}>{busy ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    </div>
  );
}

export default function SellerDashboard({ user, profile, notify = () => {} }) {
  const nav = useNavigate();
  const root = useRef(null);
  const [view, setView] = useState("dash"); // dash | settings | help
  const [list, setList] = useState(null);
  const [sellerLove, setSellerLove] = useState(null);
  const [sel, setSel] = useState(null); // barang yang sedang dikelola

  const go = (v) => { setView(v); root.current?.scrollTo({ top: 0 }); };

  const load = () => {
    supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setList(data ?? []));
    supabase.from("profiles").select("love_count").eq("id", user.id).single()
      .then(({ data }) => setSellerLove(data?.love_count ?? null));
  };
  useEffect(load, [user.id]);

  const d = useMemo(() => {
    const L = list ?? [];
    const n = (s) => L.filter((p) => p.status === s).length;
    const midnight = (v) => { const c = new Date(v); c.setHours(0, 0, 0, 0); return +c; };
    const today = midnight(Date.now());
    const sold = L.filter((p) => p.sale_status === "sold");
    const soldAt = (p) => midnight(p.sold_at || p.created_at);
    let run = sold.filter((p) => soldAt(p) < today - 29 * 864e5).length;
    const series = [...Array(30)].map((_, i) => {
      const t = today - (29 - i) * 864e5;
      run += sold.filter((p) => soldAt(p) === t).length;
      return { label: new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short" }), total: run };
    });
    const week = DAYS.map((l, i) => ({ l, n: L.filter((p) => new Date(p.created_at).getDay() === i).length }));
    const peak = Math.max(...week.map((w) => w.n));
    const byCat = {};
    sold.forEach((p) => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const table = [...L].sort((a, b) => b.love_count - a.love_count || new Date(b.created_at) - new Date(a.created_at));
    return {
      total: L.length, approved: n("approved"), pending: n("pending"),
      sold: sold.length, shipping: L.filter((p) => p.sale_status === "shipping").length,
      loves: L.reduce((a, p) => a + p.love_count, 0),
      pct: L.length ? Math.round((n("approved") / L.length) * 100) : 0,
      series, week, peak, cats, table,
    };
  }, [list]);

  const out = async () => { await supabase.auth.signOut(); nav("/"); };
  const stats = [
    [Boxes, "Total produk", d.total, "barang diposting"],
    [Truck, "Sedang dikirim", d.shipping, "menuju pembeli"],
    [Clock, "Menunggu", d.pending, "dicek admin"],
    [Heart, "Total love", sellerLove ?? d.loves, "dari pembeli"],
  ];
  const steps = [
    ["Posting barang pertama", "Kirim satu barang lewat Jual barang.", d.total > 0],
    ["Disetujui admin", "Barang tampil di toko setelah dicek.", d.approved > 0],
    ["Dapat love pertama", "Pembeli menyimpan barangmu.", d.loves > 0],
  ];
  const doneN = steps.filter((s) => s[2]).length;

  return (
    <div className="dash" ref={root} data-lenis-prevent>
      <aside className="dash-side">
        <Link className="logo" to="/"><span className="mark">C</span>Cretecs</Link>
        <button className={"dl" + (view === "dash" ? " on" : "")} onClick={() => go("dash")}><LayoutDashboard size={18} />Dashboard</button>
        <Link className="dl" to="/sell"><Plus size={18} />Jual barang</Link>
        <Link className="dl" to="/"><ExternalLink size={18} />Lihat toko</Link>

        <div className="side-bottom">
          <button className={"dl" + (view === "settings" ? " on" : "")} onClick={() => go("settings")}><Settings size={18} />Settings</button>
          <button className={"dl" + (view === "help" ? " on" : "")} onClick={() => go("help")}><LifeBuoy size={18} />Help &amp; Support</button>
          <div className="store-card">
            <small>Toko kamu</small><b>{profile.store_name}</b>
            <button onClick={out}><LogOut size={15} />Logout</button>
          </div>
        </div>
      </aside>

      <section className="dash-main">
        {view === "settings" && <SettingsView />}
        {view === "help" && <HelpView />}
        {view === "dash" && (
          <>
            <div className="dash-top">
              <h1>Dashboard</h1>
              <Link className="btn" to="/sell"><Plus size={16} />Jual barang</Link>
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
                  <div className="d-h"><span>Barang terjual</span><small>30 hari terakhir</small></div>
                  <b className="big xl">{d.sold}</b><small>total barang terjual</small>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height={190}>
                      <AreaChart data={d.series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                        <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1c1c1c" stopOpacity=".18" /><stop offset="100%" stopColor="#1c1c1c" stopOpacity="0" />
                        </linearGradient></defs>
                        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={6} tick={{ fontSize: 11, fill: "#8a8a86" }} />
                        <YAxis hide allowDecimals={false} domain={[0, "dataMax + 1"]} />
                        <Tooltip contentStyle={tip} formatter={(v) => [v, "Barang terjual"]} />
                        <Area type="monotone" dataKey="total" stroke="#1c1c1c" strokeWidth={2} fill="url(#ga)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="cats">
                    {d.cats.length === 0 && <small>Belum ada barang terjual.</small>}
                    {d.cats.map(([c, v], i) => (
                      <div className="cat" key={c} style={{ "--c": SHADES[i] }}><small>{c}</small><b>{v}</b></div>
                    ))}
                  </div>
                </div>

                <div className="d-card grow">
                  <div className="d-h"><span>Barang diposting</span><small>{d.total} barang · klik untuk kelola</small></div>
                  {list === null ? <p className="none">Memuat...</p> : d.table.length === 0 ? (
                    <div className="empty-box">
                      <p>Belum ada barang yang diposting.</p>
                      <p>Mulai dengan <Link to="/sell">posting barang pertamamu</Link>.</p>
                    </div>
                  ) : (
                    <div className="tbl">
                      <div className="tbl-row tbl-head"><span className="hide-s">ID</span><span>Nama</span><span className="hide-s">Harga</span><span>Love</span><span className="hide-s">Approval</span><span>Penjualan</span></div>
                      {d.table.map((p) => {
                        const [Icon, label] = ST[p.status];
                        const [SIcon, slabel] = SALE[p.sale_status || "available"];
                        return (
                          <button className="tbl-row tbl-btn" key={p.id} onClick={() => setSel(p)} aria-label={`Kelola ${p.name}`}>
                            <span className="hide-s mute">#{p.id.slice(0, 5)}</span>
                            <span className="pn"><i style={{ backgroundImage: `url(${p.image_url})` }} /><b>{p.name}</b></span>
                            <span className="hide-s">{rp(p.price)}</span>
                            <span className="lv"><Heart size={13} />{p.love_count}</span>
                            <span className={"mine-st hide-s " + p.status}><Icon size={13} />{label}</span>
                            <span className={"mine-st sale-" + (p.sale_status || "available")}><SIcon size={13} />{slabel}<ChevronRight size={13} className="chev" /></span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-col">
                <div className="d-card">
                  <div className="d-h"><span>Hari paling aktif</span></div>
                  <ResponsiveContainer width="100%" height={170}>
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

                <div className="d-card center">
                  <div className="d-h"><span>Tingkat approval</span></div>
                  <Gauge pct={d.pct} />
                  <small>{d.approved} dari {d.total} barang disetujui</small>
                </div>

                <div className="d-card d-cta">
                  <b>Punya barang lain?</b>
                  <small>Tambah barang baru dan kirim untuk di-review admin.</small>
                  <Link className="cta-plus" to="/sell" aria-label="Jual barang"><Plus size={20} /></Link>
                </div>
              </div>
            </div>

            <div className="d-bottom">
              <div className="d-card">
                <div className="d-h"><span>Mulai berjualan</span><small>{doneN} dari 3 selesai</small></div>
                <div className="steps">
                  {steps.map(([t, s, ok]) => (
                    <div className={"step" + (ok ? " ok" : "")} key={t}>
                      {ok ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      <div><b>{t}</b><small>{s}</small></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-card">
                <div className="d-h"><span>Tips foto produk</span></div>
                <div className="tips">
                  {TIPS.map(([Icon, t, s]) => (
                    <div className="tipi" key={t}>
                      <i><Icon size={17} strokeWidth={1.7} /></i>
                      <div><b>{t}</b><small>{s}</small></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
      {sel && <ManageModal item={sel} notify={notify} onClose={() => setSel(null)}
        onSaved={() => { setSel(null); load(); }} onDeleted={() => { setSel(null); load(); }} />}
    </div>
  );
}