import { ChevronDown, MessageCircle, Settings } from "lucide-react";

const FAQ = [
  ["Kenapa barang saya belum tampil di toko?", "Setiap barang dicek admin dulu. Selama statusnya Menunggu, barang belum tampil di toko. Status terbaru bisa kamu lihat di tabel Barang diposting."],
  ["Kenapa barang saya ditolak?", "Biasanya karena foto kurang jelas atau deskripsi belum lengkap. Posting ulang dengan foto dan deskripsi yang lebih jelas."],
  ["Berapa foto yang bisa diupload?", "Sampai 5 foto per barang, maksimal 3 MB per foto. Foto pertama jadi sampul."],
  ["Bisa edit barang yang sudah diposting?", "Belum. Untuk sekarang hapus barangnya di halaman Jual, lalu posting ulang."],
  ["Kapan pembayaran dan pencairan dana aktif?", "Fitur pembayaran belum aktif. Kami kabari kalau sudah tersedia."],
];

export function SettingsView() {
  return (
    <>
      <div className="dash-top"><h1>Settings</h1></div>
      <div className="d-card empty-card">
        <span className="ei"><Settings size={22} strokeWidth={1.6} /></span>
        <b>Belum ada pengaturan</b>
        <small>Pengaturan toko akan tersedia di sini nanti.</small>
      </div>
    </>
  );
}

export function HelpView() {
  return (
    <>
      <div className="dash-top"><h1>Help &amp; Support</h1></div>
      <div className="help-grid">
        <div className="d-card">
          <div className="d-h"><span>Pertanyaan yang sering muncul</span></div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}<ChevronDown size={18} /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="d-card help-contact">
          <b>Masih butuh bantuan?</b>
          <small>Kirim pesan langsung ke kami lewat Instagram, ceritakan masalahmu.</small>
          <a href="https://instagram.com/hanifibrrhm_" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={17} />@hanifibrrhm_
          </a>
        </div>
      </div>
    </>
  );
}