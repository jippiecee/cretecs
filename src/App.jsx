import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { ShoppingBag, Trash2, User, X } from "lucide-react";
import { supabase } from "./lib/supabase";
import { useAuth } from "./lib/useAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Sell from "./pages/Sell";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import ProfileMenu from "./components/ProfileMenu";

const rp = (n) => "Rp" + n.toLocaleString("id-ID");

export default function App() {
  const { user, profile, isAdmin, isSeller, ready, refreshProfile } = useAuth();
  const loc = useLocation();
  const { pathname, hash } = loc;
  const lenisRef = useRef(null);
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
      lenisRef.current?.scrollTo(el, { duration: 1.2 });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // pindah halaman: ke atas, atau kalau ada #hash scroll halus ke section itu
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const t = setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) lenisRef.current?.scrollTo(el, { duration: 1.2 });
    }, 60);
    return () => clearTimeout(t);
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
        <Link className="logo" to="/"><span className="mark">C</span>Cretecs</Link>
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

      <Routes>
        <Route path="/" element={<Home user={user} onAdd={add} notify={setToast} />} />
        <Route path="/login" element={<Login notify={setToast} />} />
        <Route path="/sell" element={sellPage} />
        <Route path="/community" element={<Community />} />
        <Route path="/dashboard" element={<Dashboard user={user} profile={profile} ready={ready} refreshProfile={refreshProfile} notify={setToast} />} />
        <Route path="/admin" element={<Admin user={user} isAdmin={isAdmin} ready={ready} notify={setToast} />} />
      </Routes>

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