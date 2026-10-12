import { useEffect, useMemo, useState } from "react";
import Lenis from "lenis";
import { Asterisk, ArrowRight, ArrowUpRight, LogOut, Plus, Recycle, ShoppingBag, Trash2, User, X } from "lucide-react";
import { supabase } from "./lib/supabase";

const rp = (n) => "Rp" + n.toLocaleString("id-ID");
const DEMO = [
  ["Boxy Denim Jacket", 189000, "Jaket", "L", "Like new"], ["Vintage Band Tee", 129000, "Atasan", "M", "Good"],
  ["Pleated Wool Trousers", 169000, "Bawahan", "32", "Like new"], ["Corduroy Overshirt", 149000, "Jaket", "XL", "Good"],
  ["Washed Carpenter Pants", 175000, "Bawahan", "30", "Good"], ["Striped Knit Sweater", 139000, "Atasan", "M", "Like new"],
  ["Leather Crossbody Bag", 219000, "Aksesoris", "-", "Good"], ["Retro Track Jacket", 199000, "Jaket", "L", "Like new"],
].map(([name, price, category, size, condition], i) => ({ id: "d" + i, name, price, category, size, condition }));
const TONES = ["#d9d6cf", "#c9ccd1", "#cfc8bd", "#bfc4bd", "#d2cbd0", "#c4c9cf"];

export default function App() {
  const [products, setProducts] = useState(DEMO);
  const [filter, setFilter] = useState("Semua");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    let id;
    const raf = (t) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);

  // Supabase: session + produk
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.from("products").select("*").gt("stock", 0).order("created_at", { ascending: false })
      .then(({ data }) => data?.length && setProducts(data));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); } }, [toast]);

  const cats = useMemo(() => ["Semua", ...new Set(products.map((p) => p.category))], [products]);
  const shown = filter === "Semua" ? products : products.filter((p) => p.category === filter);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const add = (p) => { // thrift = barang 1-of-1, jadi qty max 1
    if (cart.some((i) => i.id === p.id)) return setToast("Barang thrift cuma ada satu, sudah ada di tas kamu.");
    setCart([...cart, { id: p.id, name: p.name, price: p.price, qty: 1 }]); setCartOpen(true);
  };
  const remove = (id) => setCart(cart.filter((i) => i.id !== id));

  const checkout = async () => {
    if (!supabase) return setToast("Mode demo: isi .env Supabase dulu untuk checkout.");
    if (!user) { setCartOpen(false); return setAuthOpen(true); }
    const { error } = await supabase.from("orders").insert({ user_id: user.id, items: cart, total, status: "pending" });
    if (error) return setToast("Order gagal: " + error.message);
    setCart([]); setCartOpen(false); setToast("Order dibuat. Lanjut ke pembayaran (lihat README).");
  };

  return (
    <>
      <header className="nav">
        <a className="logo" href="#top"><span className="mark">C</span>Cretecs</a>
        <nav>
          <a href="#shop">Shop</a>
          <button onClick={() => (user ? supabase.auth.signOut() : setAuthOpen(true))}>
            {user ? <><LogOut size={18} />Logout</> : <><User size={18} />Login</>}
          </button>
          <button className="bag" onClick={() => setCartOpen(true)}><ShoppingBag size={18} />Bag ({count})</button>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="tag"><small>Pre-loved</small><i><Asterisk size={14} /></i><small>Curated</small></div>
          <h1>Thrift Smarter<br />Dress <em>Second Hand</em></h1>
          <span className="stars"><Asterisk size={36} strokeWidth={1.6} /><Asterisk size={36} strokeWidth={1.6} /></span>
          <div className="hero-foot">
            <a href="#shop" className="talk"><span className="talk-t">Shop now <ArrowRight size={16} /></span><small>Setiap barang dicek dan dikurasi satu per satu.</small></a>
            <p>Cretecs menjual pakaian bekas pilihan dalam kondisi terbaik. Satu barang, satu pemilik baru, harga yang masuk akal.</p>
          </div>
        </section>

        <section className="stage">
          <aside className="glass"><span className="ico"><Recycle size={20} strokeWidth={1.6} /></span><p><b>Gaya bagus</b> nggak harus baru, cukup dipilih dengan benar.</p></aside>
          <div className="white-card"><h2>Temukan piece favoritmu berikutnya.</h2><a href="#shop" className="btn">Lihat koleksi <ArrowUpRight size={16} /></a></div>
        </section>

        <section id="shop" className="shop">
          <div className="shop-head"><h2>Koleksi <em>terbaru</em></h2>
            <div className="chips">{cats.map((c) => <button key={c} className={c === filter ? "on" : ""} onClick={() => setFilter(c)}>{c}</button>)}</div>
          </div>
          <div className="grid">
            {shown.map((p, i) => (
              <article key={p.id} className="item">
                <div className="img" style={{ background: p.image_url ? `url(${p.image_url}) center/cover` : TONES[i % TONES.length] }}>
                  <span>{p.condition}</span>
                </div>
                <div className="meta"><h3>{p.name}</h3><small>Size {p.size} · {p.category}</small></div>
                <div className="buy"><b>{rp(p.price)}</b><button onClick={() => add(p)}><Plus size={15} />Tambah ke tas</button></div>
              </article>
            ))}
          </div>
        </section>
        <footer><span>© 2026 Cretecs</span><span>Thrift shop · Indonesia</span></footer>
      </main>

      {cartOpen && <div className="scrim" onClick={() => setCartOpen(false)} />}
      <aside className={"drawer" + (cartOpen ? " open" : "")} data-lenis-prevent>
        <div className="d-head"><h3>Tas belanja</h3><button aria-label="Tutup" onClick={() => setCartOpen(false)}><X size={20} /></button></div>
        {cart.length === 0 ? <p className="empty">Tasmu kosong. Pilih barang dari koleksi.</p> : cart.map((i) => (
          <div key={i.id} className="line"><div><b>{i.name}</b><small>{rp(i.price)}</small></div><button aria-label="Hapus" onClick={() => remove(i.id)}><Trash2 size={16} /></button></div>
        ))}
        <div className="d-foot"><div><span>Total</span><b>{rp(total)}</b></div>
          <button className="btn" disabled={!cart.length} onClick={checkout}>{user ? "Checkout" : "Login untuk checkout"}</button></div>
      </aside>

      {authOpen && <Auth onClose={() => setAuthOpen(false)} onDone={(m) => { setAuthOpen(false); setToast(m); }} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function Auth({ onClose, onDone }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!supabase) return setErr("Supabase belum dikonfigurasi (.env).");
    const { error } = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (error) return setErr(error.message);
    onDone(mode === "login" ? "Berhasil login." : "Akun dibuat. Cek email untuk verifikasi.");
  };
  return (
    <div className="scrim center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === "login" ? "Masuk ke Cretecs" : "Buat akun Cretecs"}</h3>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password (min. 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="btn" onClick={submit}>{mode === "login" ? "Masuk" : "Daftar"}</button>
        <button className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}</button>
      </div>
    </div>
  );
}