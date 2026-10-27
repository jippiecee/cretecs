import { LogoMark } from "./components/Brand";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { ShoppingBag, Trash2, User, X } from "lucide-react";
import { supabase } from "./lib/supabase";
import { useAuth } from "./lib/useAuth";
import Home from "./pages/Home";
import ProfileMenu from "./components/ProfileMenu";

// page selain Home dimuat saat dibutuhin (recharts nggak ikut kebawa di awal)
const Login = lazy(() => import("./pages/Login"));
const Sell = lazy(() => import("./pages/Sell"));
const Admin = lazy(() => import("./pages/Admin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Community = lazy(() => import("./pages/Community"));

const rp = (n) => "Rp" + n.toLocaleString("id-ID");

// easeInOutCubic: mulai pelan, ngebut di tengah, berhenti halus
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function App() {
  const { user, profile, isAdmin, isSeller, ready, refreshProfile } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const { pathname, hash } = loc;
  const lenisRef = useRef(null);
  const firstLoad = useRef(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    lenisRef.current = lenis;
    let id;
    const raf = (t) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); lenisRef.current = null; };
  }, []);

  // scroll halus ke element; durasi ngikutin jarak (min 1 dtk, max 2.2 dtk)
  const goTo = (el) => {
    const lenis = lenisRef.current;
    if (!lenis || !el) return;
    const dist = Math.abs(el.getBoundingClientRect().top);
    lenis.scrollTo(el, {
      duration: Math.min(2.2, Math.max(1, dist / 1400)),
      easing: ease,
    });
  };

  // klik anchor "#xxx" di halaman yang sama -> scroll pakai Lenis
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.("a[href^='#']");
      if (!a) return;
      const sel = a.getAttribute("href");
      if (sel.length < 2) return;
      const el = document.querySelector(sel);
      if (!el) return;
      e.preventDefault();
      goTo(el);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // pindah halaman: ke atas, atau kalau ada #hash (dari klik link) scroll halus ke section itu
  useEffect(() => {
    // buka/reload pertama kali: JANGAN auto-scroll, buang hash, mulai dari atas
    if (firstLoad.current) {
      firstLoad.current = false;
      if (hash) {
        navigate({ pathname, search: loc.search }, { replace: true });
        window.scrollTo(0, 0);
        return;
      }
    }
    if (!hash) { window.scrollTo(0, 0); return; }
    let r1, r2;
    // tunggu halaman selesai render dulu (2 frame) biar scroll nggak patah di awal
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => goTo(document.querySelector(hash)));
    });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [loc.key]);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); } }, [toast]);

  const total = cart.reduce((s, i) => s + i.price, 0);

  const add = (p) => { // barang thrift cuma satu
    if (cart.some((i) => i.id === p.id)) return setToast("Barang thrift cuma ada satu, sudah ada di tas kamu.");
    setCart([...cart, { id: p.id, name: p.name, price: p.price }]); setCartOpen(true);
  };

  const checkout = async () => {
    if (!user) { setCartOpen(false); return setToast("Login dulu untuk checkout."); }
    const { error } = await supabase.rpc("create_order", { ids: cart.map((i) => i.id) });
    if (error) return setToast(error.message);
    setCart([]); setCartOpen(false); setToast("Order dibuat. Pembayaran menyusul.");
  };

  // /sell: hanya akun toko
  const sellPage = !ready || (user && !profile) ? null
    : isSeller ? <Sell user={user} ready={ready} notify={setToast} />
    : <Navigate to={user ? "/dashboard" : "/login"} />;

  return (
    <>
      <header className="nav">
      <Link className="logo" to="/" aria-label="Secondlove"><LogoMark variant="solid" /></Link>
        <nav>
          <Link to="/#shop">Shop</Link>
          <Link to="/community">Community</Link>
          {!user && <Link to="/login"><User size={18} />Login</Link>}
          <button className="bag" onClick={() => setCartOpen(true)}><ShoppingBag size={18} />Bag ({cart.length})</button>
          {user && (
            <ProfileMenu
              user={user}
              profile={profile}
              isAdmin={isAdmin}
              isSeller={isSeller}
              onLogout={() => supabase.auth.signOut()}
            />
          )}
        </nav>
      </header>

      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home user={user} onAdd={add} notify={setToast} />} />
          <Route path="/login" element={<Login notify={setToast} />} />
          <Route path="/sell" element={sellPage} />
          <Route path="/community" element={<Community />} />
          <Route path="/dashboard" element={<Dashboard user={user} profile={profile} ready={ready} refreshProfile={refreshProfile} notify={setToast} />} />
          <Route path="/admin" element={<Admin user={user} isAdmin={isAdmin} ready={ready} notify={setToast} />} />
        </Routes>
      </Suspense>

      {cartOpen && <div className="scrim" onClick={() => setCartOpen(false)} />}
      <aside className={"drawer" + (cartOpen ? " open" : "")} data-lenis-prevent>
        <div className="d-head"><h3>Tas belanja</h3><button aria-label="Tutup" onClick={() => setCartOpen(false)}><X size={20} /></button></div>
        {cart.length === 0 ? <p className="empty">Tasmu kosong. Pilih barang dari koleksi.</p> : cart.map((i) => (
          <div key={i.id} className="line"><div><b>{i.name}</b><small>{rp(i.price)}</small></div><button aria-label="Hapus" onClick={() => setCart(cart.filter((x) => x.id !== i.id))}><Trash2 size={16} /></button></div>
        ))}
        <div className="d-foot"><div><span>Total</span><b>{rp(total)}</b></div>
          <button className="btn" disabled={!cart.length} onClick={checkout}>{user ? "Checkout" : "Login untuk checkout"}</button></div>
      </aside>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}