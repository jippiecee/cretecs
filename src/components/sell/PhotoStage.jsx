import { useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";

// Area foto besar + thumbnail. Semua state foto ada di halaman induk.
export default function PhotoStage({ photos, active, max, onActive, onAdd, onRemove, onCover }) {
  const [drag, setDrag] = useState(false);
  const shown = photos[active] || photos[0];

  const drop = {
    onDragOver: (e) => { e.preventDefault(); setDrag(true); },
    onDragLeave: () => setDrag(false),
    onDrop: (e) => { e.preventDefault(); setDrag(false); onAdd(e.dataTransfer.files); },
  };
  const pick = (e) => { onAdd(e.target.files); e.target.value = ""; };

  return (
    <div className="sx-left">
      <div className={"sx-stage" + (drag ? " over" : "")} {...drop}>
        {!shown ? (
          <label className="sx-drop">
            <span className="sx-drop-ic"><ImagePlus size={34} strokeWidth={1.4} /></span>
            <b>Tarik foto ke sini</b>
            <small>atau klik untuk pilih dari galeri.<br />Sampai {max} foto, maksimal 3 MB per foto.</small>
            <input type="file" accept="image/*" multiple hidden onChange={pick} />
          </label>
        ) : (
          <>
            <img className="sx-main" src={shown.url} alt="Foto barang" />
            <div className="sx-top">
              {photos[0] === shown
                ? <span className="sx-pill dark">Sampul</span>
                : <button type="button" className="sx-pill" onClick={() => onCover(photos.indexOf(shown))}><Star size={13} />Jadikan sampul</button>}
              <button type="button" className="sx-round" aria-label="Hapus foto" onClick={() => onRemove(photos.indexOf(shown))}><X size={17} /></button>
            </div>
          </>
        )}
      </div>

      <div className="sx-thumbs">
        {photos.map((p, i) => (
          <button type="button" key={p.url} className={"sx-th" + (p === shown ? " on" : "")} onClick={() => onActive(i)} aria-label={`Foto ${i + 1}`}>
            <img src={p.url} alt="" />
          </button>
        ))}
        {photos.length < max && (
          <label className="sx-th add" aria-label="Tambah foto">
            <ImagePlus size={22} strokeWidth={1.5} />
            <input type="file" accept="image/*" multiple hidden onChange={pick} />
          </label>
        )}
        <span className="sx-hint">{photos.length}/{max} foto · foto pertama jadi sampul</span>
      </div>
    </div>
  );
}