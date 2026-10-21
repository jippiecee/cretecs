import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import "../profile.css";

const USER_RE = /^[a-z0-9_]{3,20}$/;
const pathOf = (u) => {
  const m = (u || "").split("/avatars/")[1];
  return m ? decodeURIComponent(m.split("?")[0]) : null;
};

// potong tengah jadi persegi 480x480, simpan sebagai JPEG
function toSquare(file, size = 480) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error("Gagal memproses foto."))), "image/jpeg", 0.88);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("File bukan gambar yang valid.")); };
    img.src = url;
  });
}

export default function ProfileEditor({ user, profile, refreshProfile, notify, seller = false }) {
  const base = (user.email || "").split("@")[0];
  const [name, setName] = useState(profile.display_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatar, setAvatar] = useState(profile.avatar_url || null);
  const [file, setFile] = useState(null); // { blob, url } foto baru, belum diupload
  const [uname, setUname] = useState("idle"); // idle | checking | ok | taken | invalid
  const [busy, setBusy] = useState(false);
  const pick = useRef(null);

  const shown = file?.url || avatar;
  const initial = ((name || (seller ? profile.store_name : "") || username || base)[0] || "?").toUpperCase();
  const uClean = username.trim().toLowerCase();

  useEffect(() => {
    if (!uClean) return setUname("invalid");
    if (!USER_RE.test(uClean)) return setUname("invalid");
    if (uClean === (profile.username || "")) return setUname("ok");
    setUname("checking");
    let live = true;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("username_available", { u: uClean });
      if (live) setUname(error || data ? "ok" : "taken"); // kalau error, server yang memutuskan saat simpan
    }, 400);
    return () => { live = false; clearTimeout(t); };
  }, [uClean]);

  const dirty = !!file
    || avatar !== (profile.avatar_url || null)
    || name.trim() !== (profile.display_name || "")
    || uClean !== (profile.username || "")
    || bio.trim() !== (profile.bio || "");
  const canSave = dirty && !busy && !["invalid", "taken", "checking"].includes(uname);

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return notify("File harus berupa gambar.");
    if (f.size > 5 * 1024 * 1024) return notify("Ukuran foto maksimal 5 MB.");
    try {
      const blob = await toSquare(f);
      if (file) URL.revokeObjectURL(file.url);
      setFile({ blob, url: URL.createObjectURL(blob) });
    } catch (er) { notify(er.message); }
  };

  const removeAvatar = () => {
    if (file) URL.revokeObjectURL(file.url);
    setFile(null);
    setAvatar(null);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    let url = avatar;
    let newPath = null;
    if (file) {
      newPath = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(newPath, file.blob, { contentType: "image/jpeg", cacheControl: "3600" });
      if (error) { setBusy(false); return notify("Upload foto gagal: " + error.message); }
      url = supabase.storage.from("avatars").getPublicUrl(newPath).data.publicUrl;
    }
    const { error } = await supabase.rpc("update_profile", { p_name: name, p_username: uClean, p_bio: bio, p_avatar: url });
    if (error) {
      if (newPath) supabase.storage.from("avatars").remove([newPath]);
      setBusy(false);
      return notify(error.message);
    }
    const old = pathOf(profile.avatar_url);
    if (old && url !== profile.avatar_url) supabase.storage.from("avatars").remove([old]);
    if (file) URL.revokeObjectURL(file.url);
    setFile(null);
    setAvatar(url);
    await refreshProfile?.();
    setBusy(false);
    notify("Profil disimpan.");
  };

  const hint = {
    idle: "3-20 karakter: huruf kecil, angka, atau _",
    checking: "Memeriksa...",
    ok: uClean === (profile.username || "") ? "Username kamu saat ini" : "Username tersedia",
    taken: "Username sudah dipakai",
    invalid: "Username wajib diisi, 3-20 karakter: huruf kecil, angka, atau _",
  }[uname];

  return (
    <form className="pf" onSubmit={save}>
      <div className="pf-card">
        <div className="pf-ava-row">
          <button type="button" className="pf-ava" onClick={() => pick.current?.click()} aria-label="Ganti foto profil">
            {shown ? <img src={shown} alt="" /> : initial}
            <i><Camera size={16} /></i>
          </button>
          <div className="pf-ava-t">
            <b>{seller ? "Foto toko" : "Foto profil"}</b>
            <small>JPG atau PNG, maksimal 5 MB. Otomatis dipotong persegi.</small>
            <div className="pf-ava-act">
              <button type="button" className="pf-sm" onClick={() => pick.current?.click()}>Unggah foto</button>
              {shown && <button type="button" className="pf-sm ghost" onClick={removeAvatar}><Trash2 size={14} />Hapus</button>}
            </div>
          </div>
          <input ref={pick} type="file" accept="image/*" hidden onChange={onPick} />
        </div>
      </div>

      <div className="pf-card pf-fields">
        {seller && profile.store_name && (
          <div className="pf-field">
            <label htmlFor="pf-store">Nama toko</label>
            <input id="pf-store" className="pf-in" value={profile.store_name} readOnly />
          </div>
        )}

        <div className="pf-field">
          <label htmlFor="pf-name">Nama{seller ? " tampilan" : ""}<small>{name.length}/40</small></label>
          <input id="pf-name" className="pf-in" maxLength={40} placeholder="Opsional, kosongkan untuk pakai username" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="pf-field">
          <label htmlFor="pf-user">Username</label>
          <div className="pf-at">
            <span>@</span>
            <input id="pf-user" className="pf-in" maxLength={20} placeholder="username" autoComplete="off" spellCheck={false}
              value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())} />
          </div>
          <small className={"pf-hint" + (uname === "ok" ? " ok" : uname === "taken" || uname === "invalid" ? " bad" : "")}>{hint}</small>
        </div>

        <div className="pf-field">
          <label htmlFor="pf-bio">{seller ? "Deskripsi toko" : "Deskripsi"}<small>opsional · {bio.length}/160</small></label>
          <textarea id="pf-bio" className="pf-in" maxLength={160}
            placeholder={seller ? "Ceritakan tokomu: gaya, jenis barang, atau pengiriman" : "Ceritakan sedikit tentang dirimu"}
            value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
      </div>

      <div className="pf-save">
        <button className="pf-btn" disabled={!canSave}>{busy ? "Menyimpan..." : "Simpan perubahan"}</button>
      </div>
    </form>
  );
}   