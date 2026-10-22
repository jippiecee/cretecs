import { Camera, MessageCircle, Shirt } from "lucide-react";
import "../community.css";

const items = [
  { icon: Camera, title: "OOTD Wall", text: "Pamerin outfit thrift kamu dan lihat gimana orang lain mix and match piece pre-loved." },
  { icon: MessageCircle, title: "Tips & Diskusi", text: "Tanya cara rawat, cek ukuran, sampai trik nemuin piece langka bareng sesama thrifter." },
  { icon: Shirt, title: "Thrift Swap", text: "Tukar pakaian yang udah nggak kepake dengan temuan baru dari komunitas." },
];

export default function Community() {
  return (
    <section id="community" className="comm">
      <div className="comm-head">
        <h2>Cretecs <em>Community</em></h2>
        <p>Tempat para pecinta thrift ngumpul, berbagi gaya, dan saling kasih rekomendasi.</p>
      </div>
      <div className="comm-grid">
        {items.map(({ icon: Icon, title, text }) => (
          <article key={title} className="comm-card">
            <span className="comm-ico"><Icon size={20} strokeWidth={1.6} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="comm-soon">Segera hadir</span>
          </article>
        ))}
      </div>
    </section>
  );
}