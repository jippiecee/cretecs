import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, ShieldCheck, Store } from "lucide-react";
import "../profilemenu.css";

export default function ProfileMenu({ user, profile, isAdmin, isSeller, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  const email = user?.email || "";
  const name = profile?.display_name || profile?.username || email.split("@")[0] || "Akun";
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  // tutup kalau pindah halaman
  useEffect(() => { setOpen(false); }, [pathname]);

  // tutup kalau klik di luar / tekan Esc
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const Ava = ({ big }) => (
    <span className={"pm-ava" + (big ? " big" : "")}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
    </span>
  );

  return (
    <div className="pm" ref={ref}>
      <button
        className="pm-btn"
        aria-label="Menu profil"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Ava />
      </button>

      {open && (
        <div className="pm-pop" role="menu">
          <div className="pm-me">
            <Ava big />
            <div>
              <b>{name}</b>
              {profile?.username && <small>@{profile.username}</small>}
              <small>{email}</small>
            </div>
          </div>

          <Link className="pm-item" to="/dashboard" role="menuitem"><LayoutDashboard size={17} />Dashboard</Link>
          {isSeller && <Link className="pm-item" to="/sell" role="menuitem"><Store size={17} />Jual barang</Link>}
          {isAdmin && <Link className="pm-item" to="/admin" role="menuitem"><ShieldCheck size={17} />Admin</Link>}

          <div className="pm-sep" />
          <button className="pm-item out" role="menuitem" onClick={() => { setOpen(false); onLogout(); }}>
            <LogOut size={17} />Logout
          </button>
        </div>
      )}
    </div>
  );
}