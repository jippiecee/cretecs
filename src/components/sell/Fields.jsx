// Komponen form kecil yang dipakai halaman jual.

export function Field({ label, htmlFor, hint, grow, children }) {
  return (
    <div className={"sx-field" + (grow ? " grow" : "")}>
      <label htmlFor={htmlFor}>{label}{hint && <small>{hint}</small>}</label>
      {children}
    </div>
  );
}

export function TextInput({ id, ...rest }) {
  return <input id={id} className="sx-in" {...rest} />;
}

export function MoneyInput({ id, value, onChange }) {
  return (
    <div className="sx-money">
      <span>Rp</span>
      <input id={id} className="sx-in" inputMode="numeric" placeholder="150.000"
        value={value ? Number(value).toLocaleString("id-ID") : ""}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))} />
    </div>
  );
}

// pilihan berbentuk chip; toggle = klik lagi untuk batal; children = input tambahan di baris yang sama
export function Chips({ options, value, onChange, toggle, children }) {
  return (
    <div className="sx-chips">
      {options.map((o) => (
        <button type="button" key={o} className={value === o ? "on" : ""}
          onClick={() => onChange(toggle && value === o ? "" : o)}>{o}</button>
      ))}
      {children}
    </div>
  );
}

// pilihan sama lebar (kondisi)
export function Segmented({ options, value, onChange }) {
  return (
    <div className="sx-seg" role="radiogroup">
      {options.map((o) => (
        <button type="button" role="radio" aria-checked={value === o} key={o}
          className={value === o ? "on" : ""} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}