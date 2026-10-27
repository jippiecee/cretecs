// Logo Secondlove (bubble modern, hitam-putih-abu).
// variant: "solid" (bubble hitam + hati) | "twin" (dua bubble, gelap + kaca) | "glass" (bubble kaca terang + hati hitam)
// Ganti variant di tempat logo dipanggil, contoh: <LogoMark variant="twin" />
const HEART = "M12 20.4s-7.6-4.5-7.6-10.2A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.6 2.6c0 5.7-7.6 10.2-7.6 10.2z";

export function LogoMark({ variant = "solid" }) {
  if (variant === "twin") {
    return (
      <span className="mark bubble v-twin" aria-hidden="true">
        <i className="tw-a">
          <svg className="bubble-heart" viewBox="0 0 24 24"><path d={HEART} /></svg>
        </i>
        <i className="tw-b" />
      </span>
    );
  }
  return (
    <span className={"mark bubble v-" + variant} aria-hidden="true">
      <svg className="bubble-heart" viewBox="0 0 24 24"><path d={HEART} /></svg>
      <i className="bubble-s1" />
      <i className="bubble-s2" />
    </span>
  );
}

export default function Brand({ variant = "solid" }) {
  return (
    <>
      <LogoMark variant={variant} />
      <span className="wordmark">Second<em>love</em></span>
    </>
  );
}