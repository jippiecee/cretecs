import { useId } from "react";

// Logo Secondlove: hati pecah dilakban, lakbannya berbentuk huruf S.
const HEART = "M50 92C16 69 5 48 5 32 5 17 17 8 30 8c9 0 16 5 20 13 4-8 11-13 20-13 13 0 25 9 25 24 0 16-11 37-45 60z";
const CRACK = "50,21 44,38 55,50 45,64 54,76 50,92";
const RIBBON = "M70 26C34 22 30 46 50 50C70 54 66 70 32 66";

export function LogoMark({ className = "" }) {
  // id unik per instance biar gradient/clip nggak bentrok kalau logo tampil lebih dari sekali
  const id = useId().replace(/:/g, "");
  const u = (n) => `${n}-${id}`;
  const ref = (n) => `url(#${u(n)})`;

  return (
    <svg className={"sl-mark " + className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={u("dk")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a5a58" />
          <stop offset=".5" stopColor="#1c1c1c" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <linearGradient id={u("gl")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#c9c8c2" stopOpacity=".75" />
        </linearGradient>
        <radialGradient id={u("hl")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={u("sh")} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000" floodOpacity=".25" />
        </filter>
        <clipPath id={u("zl")}><polygon points={`-10,-10 50,-10 ${CRACK} 50,110 -10,110`} /></clipPath>
        <clipPath id={u("zr")}><polygon points={`110,-10 50,-10 ${CRACK} 50,110 110,110`} /></clipPath>
      </defs>

      {/* dua belahan hati */}
      <g filter={ref("sh")}>
        <g transform="translate(-2 2) rotate(-3 30 60)">
          <g clipPath={ref("zl")}>
            <path d={HEART} fill={ref("dk")} />
            <ellipse cx="27" cy="26" rx="12" ry="7" transform="rotate(-32 27 26)" fill={ref("hl")} />
            <path d="M50 92C30 80 14 62 8 44" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        </g>
        <g transform="translate(2 -2) rotate(3 70 50)">
          <g clipPath={ref("zr")}>
            <path d={HEART} fill={ref("dk")} />
            <ellipse cx="74" cy="22" rx="6.5" ry="3.6" transform="rotate(-25 74 22)" fill={ref("hl")} fillOpacity=".7" />
            <path d="M50 92C68 80 84 66 91 50" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* lakban berbentuk S */}
      <path d={RIBBON} fill="none" stroke="#000" strokeOpacity=".25" strokeWidth="14" transform="translate(0 1.8)" />
      <path d={RIBBON} fill="none" stroke="#1c1c1c" strokeOpacity=".45" strokeWidth="14" />
      <path d={RIBBON} fill="none" stroke="#f4f3ee" strokeWidth="11.6" />
      <path d={RIBBON} fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2" transform="translate(-1.5 -2.2)" />

      {/* bubble kecil */}
      <circle cx="90" cy="10" r="7.5" fill={ref("gl")} stroke="#1c1c1c" strokeOpacity=".55" strokeWidth="1.5" />
      <ellipse cx="87.5" cy="7.5" rx="3" ry="1.9" fill="#fff" transform="rotate(-35 87.5 7.5)" />
      <circle cx="99" cy="27" r="3.4" fill={ref("gl")} stroke="#1c1c1c" strokeOpacity=".55" strokeWidth="1.2" />
    </svg>
  );
}

export default function Brand() {
  return (
    <>
      <LogoMark />
      <span className="wordmark">secondlove</span>
    </>
  );
}