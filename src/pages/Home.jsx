import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Heart, Plus, Recycle } from "lucide-react";
import { supabase } from "../lib/supabase";
import PolaroidStack from "../components/PolaroidStack";
import LoveQuote from "../components/LoveQuote";
import SearchBar from "../components/SearchBar";

const rp = (n) => "Rp" + n.toLocaleString("id-ID");

// Skor beranda: love toko paling berat, love barang membantu, barang baru dapat bonus kecil
// (bonus turun habis dalam 14 hari) supaya toko baru tetap punya kesempatan tampil.
const score = (p) => {
  const days = (Date.now() - new Date(p.created_at)) / 864e5;
  return (p.seller_love || 0) + (p.love_count || 0) * 0.5 + Math.max(0, 10 * (1 - days / 14));
};

export default function Home({ user, onAdd, notify }) {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [loved, setLoved] = useState(new Set());
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const dq = useDeferredValue(query);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("shop_products").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setProducts(data ?? []));
  }, []);

  useEffect(() => {
    if (!supabase || !user) return setLoved(new Set());
    supabase.from("loves").select("product_id").then(({ data }) => setLoved(new Set((data ?? []).map((r) => r.product_id))));
  }, [user?.id]);

  const toggleLove = async (p) => {
    if (!user) return nav("/login");
    const on = loved.has(p.id);
    const { error } = on
      ? await supabase.from("loves").delete().eq("product_id", p.id).eq("user_id", user.id)
      : await supabase.from("loves").insert({ product_id: p.id, user_id: user.id });
    if (error) return notify("Gagal: " + error.message);
    const next = new Set(loved); on ? next.delete(p.id) : next.add(p.id); setLoved(next);
    setProducts(products.map((x) => (x.id === p.id ? { ...x, love_count: x.love_count + (on ? -1 : 1) } : x)));
  };

  const cats = useMemo(() => ["Semua", ...new Set(products.map((p) => p.category))], [products]);
  const shown = useMemo(() => {
    const base = filter === "Semua" ? products : products.filter((p) => p.category === filter);
    const terms = dq.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = terms.length
      ? base.filter((p) => {
          const hay = [p.name, p.category, p.size, p.condition, p.store_name].join(" ").toLowerCase();
          return terms.every((t) => hay.includes(t));
        })
      : base;
    return [...hit].sort((a, b) => score(b) - score(a));
  }, [products, filter, dq]);

  return (
    <>
      <main id="top">
        <section className="hero">
          <div className="tag"><small>Pre-loved</small><i>✳</i><small>Curated</small></div>
          <h1>Thrift Smarter<br />Embrace <em>Second love </em></h1>
          <span className="stars">✳ ✳</span>
          <div className="hero-foot">
            <a href="#shop" className="talk">Shop now →<small>Setiap barang dicek dan dikurasi satu per satu.</small></a>
            <p>Secondlove menjual pakaian bekas pilihan dalam kondisi terbaik. Satu barang, satu pemilik baru, harga yang masuk akal.</p>
          </div>
        </section>

        <section className="stage">
          <PolaroidStack />
          <LoveQuote />
          <aside className="glass"><span className="ico"><Recycle size={20} strokeWidth={1.6} /></span><p><b>Gaya bagus</b> nggak harus baru, cukup dipilih dengan benar.</p></aside>
          <div className="white-card"><h2>Temukan piece favoritmu berikutnya.</h2><a href="#shop" className="btn">Lihat koleksi <ArrowUpRight size={16} /></a></div>
        </section>

        <section id="shop" className="shop">
          <div className="shop-head">
            <div className="shop-title">
              <h2>Koleksi <em>terbaru</em></h2>
              <p className="shop-sub">
                {products.length === 0
                  ? "Belum ada barang. Segera hadir."
                  : "Setiap piece dicek dan dikurasi satu per satu."}
              </p>
            </div>
            <div className="chips">{cats.map((c) => <button key={c} className={c === filter ? "on" : ""} onClick={() => setFilter(c)}>{c}</button>)}</div>
          </div>
          <div className="shop-tools">
            <SearchBar value={query} onChange={setQuery} />
            {query.trim() && <span className="sbar-count">{shown.length} barang ditemukan</span>}
          </div>
          {products.length > 0 && shown.length === 0 && (
            <p className="none">{`Tidak ada barang untuk “${query.trim()}”. Coba kata lain.`}</p>
          )}
          <div className="grid">
            {shown.map((p) => (
              <article key={p.id} className="item">
                <div className="img" style={{ background: `#d9d6cf url(${p.image_url}) center/cover` }}>
                  <span>{p.condition}</span>
                  <button className={"heart" + (loved.has(p.id) ? " on" : "")} aria-label="Love" onClick={() => toggleLove(p)}>
                    <Heart size={15} fill={loved.has(p.id) ? "currentColor" : "none"} />{p.love_count}
                  </button>
                </div>
                <div className="meta"><h3>{p.name}</h3><small>Size {p.size || "-"} · {p.category}</small>
                  {p.store_name && <small className="shop-by"><Heart size={11} />{p.store_name} · {p.seller_love}</small>}
                </div>
                <div className="buy"><b>{rp(p.price)}</b><button onClick={() => onAdd(p)}><Plus size={15} />Tambah ke tas</button></div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer><span>© 2026 Secondlove</span><span>Thrift shop · Indonesia</span></footer>
    </>
  );
}