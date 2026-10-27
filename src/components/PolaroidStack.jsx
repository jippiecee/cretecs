import "../polaroid.css";

const photos = [
  { src: "/polaroid/1.jpg", caption: "Burgundy henley", r: -9,  x: -52, y: 10, z: 1 },
  { src: "/polaroid/2.jpg", caption: "Olive shirt",     r: 1.5, x: 0,   y: -6, z: 3 },
  { src: "/polaroid/3.jpg", caption: "Brown corduroy",  r: 9,   x: 52,  y: 10, z: 2 },
];

export default function PolaroidStack() {
  return (
    <div className="polaroids" aria-label="Inspirasi outfit">
      {photos.map((p, i) => (
        <figure
          key={p.src}
          className="polaroid"
          style={{
            "--x": `${p.x}%`,
            "--y": `${p.y}px`,
            "--r": `${p.r}deg`,
            "--z": p.z,
            "--d": `${i * 0.12}s`,
          }}
        >
          <img src={p.src} alt={p.caption} loading="lazy" draggable="false" />
          <figcaption>{p.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}