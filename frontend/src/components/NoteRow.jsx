import { fmtDate } from '../utils/crypto';

const TAG_COLORS = {
  personal:'bg-[rgba(255,179,0,0.08)]  text-vault-amber',
  work:    'bg-[rgba(79,138,255,0.08)]  text-vault-accent',
  finance: 'bg-[rgba(0,214,143,0.08)]   text-vault-green',
  legal:   'bg-[rgba(124,77,255,0.08)]  text-purple-400',
  medical: 'bg-[rgba(255,77,109,0.08)]  text-vault-red',
};

export default function NoteRow({ note, onClick, onDelete, onToggleStar, onTogglePin }) {
  return (
    <div onClick={onClick}
      className="flex items-center gap-4 bg-vault-surface border border-vault-border rounded-xl
                 px-4 py-3 cursor-pointer hover:border-vault-dimmed transition-colors group">

      <div className="text-xl shrink-0">📓</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium truncate">{note.title}</p>
          {note.pinned  && <span className="text-[9px] text-vault-amber font-mono shrink-0">📌</span>}
          {note.starred && <span className="text-[9px] text-vault-amber shrink-0">★</span>}
        </div>
        {/* Content hidden in list view too */}
        <p className="text-[11px] text-vault-muted font-mono flex items-center gap-1">
          <span>🔒</span>
          <span className="italic">encrypted · {note.wordCount||0} words</span>
        </p>
      </div>

      <div className="flex gap-1 shrink-0">
        {note.tags.map(tag => (
          <span key={tag} className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${TAG_COLORS[tag]||''}`}>{tag}</span>
        ))}
      </div>

      <span className="text-[10px] text-vault-muted font-mono shrink-0">{fmtDate(note.updatedAt)}</span>

      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <RowBtn title={note.starred?'Unstar':'Star'} color="amber"
          onClick={e=>{e.stopPropagation();onToggleStar(note._id,!note.starred);}}>
          {note.starred?'★':'☆'}
        </RowBtn>
        <RowBtn title="Delete" color="red"
          onClick={e=>{e.stopPropagation();onDelete(note);}}>✕</RowBtn>
      </div>
    </div>
  );
}

function RowBtn({ children, color, title, onClick }) {
  const colors = {
    amber:'bg-[rgba(255,179,0,0.12)] text-vault-amber hover:bg-[rgba(255,179,0,0.25)]',
    red:  'bg-[rgba(255,77,109,0.12)] text-vault-red hover:bg-[rgba(255,77,109,0.25)]',
  };
  return (
    <button title={title} onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors border-0 cursor-pointer ${colors[color]}`}>
      {children}
    </button>
  );
}
