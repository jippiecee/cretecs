import Brand from "../components/Brand";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import TypingSearch from "../components/TypingSearch";

export default function Login({ notify }) {
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!supabase) return setErr("Supabase belum dikonfigurasi (.env).");
    setErr(""); setBusy(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setErr(error.message);
      return nav("/");
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) { notify("Akun dibuat. Selamat datang!"); return nav("/"); }
    notify("Akun dibuat. Cek email untuk verifikasi, lalu login.");
    setMode("login");
  };

  // Opsional: butuh provider Google diaktifkan di Supabase > Authentication > Providers.
  // Kalau nggak mau dipakai, hapus fungsi ini + tombol "auth-social" + blok "auth-or".
  const google = async () => {
    if (!supabase) return setErr("Supabase belum dikonfigurasi (.env).");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setErr(error.message);
  };

  const isLogin = mode === "login";

  return (
    <main className="auth" data-lenis-prevent>
      <section className="auth-left">
        <div className="auth-box">
          <Link className="auth-logo" to="/">
            <Brand />
          </Link>

          <h1>{isLogin ? "Masuk" : "Buat akun"}</h1>

          <button type="button" className="auth-social" onClick={google}>
            <b>G</b> Lanjut dengan Google
          </button>

          <div className="auth-or"><span>ATAU</span></div>

          <form className="auth-form" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min. 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {err && <p className="err">{err}</p>}

            <button className="auth-submit" disabled={busy}>
              {busy ? "Tunggu..." : isLogin ? "Masuk" : "Daftar"}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              type="button"
              onClick={() => { setMode(isLogin ? "signup" : "login"); setErr(""); }}
            >
              {isLogin ? "Buat akun" : "Masuk"}
            </button>
          </p>
        </div>
      </section>

      <section className="auth-right">
        <TypingSearch />
      </section>
    </main>
  );
}