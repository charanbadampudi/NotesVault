import { useNotes } from '../context/NotesContext';
import { fmtDate } from '../utils/crypto';

const TAG_COLORS = {
  personal:'bg-[rgba(255,179,0,0.1)]  text-vault-amber',
  work:    'bg-[rgba(79,138,255,0.1)]  text-vault-accent',
  finance: 'bg-[rgba(0,214,143,0.1)]   text-vault-green',
  legal:   'bg-[rgba(124,77,255,0.1)]  text-purple-400',
  medical: 'bg-[rgba(255,77,109,0.1)]  text-vault-red',
};

const BORDER_ACCENTS = {
  default:'border-t-vault-border',
  blue:   'border-t-vault-accent',
  green:  'border-t-vault-green',
  amber:  'border-t-vault-amber',
  red:    'border-t-vault-red',
  purple: 'border-t-purple-400',
};

export default function NoteCard({ note, onClick, onDelete, onToggleStar, onTogglePin }) {
  return (
    <div
      onClick={onClick}
      className={`bg-vault-surface border border-vault-border border-t-2 ${BORDER_ACCENTS[note.color]||BORDER_ACCENTS.default}
                  rounded-2xl p-4 cursor-pointer transition-all hover:border-vault-dimmed hover:-translate-y-0.5 relative group`}
    >
      {/* Hover actions */}
      <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ActionBtn title={note.pinned?'Unpin':'Pin'}   color="amber" onClick={e=>{e.stopPropagation();onTogglePin(note._id,!note.pinned);}}>📌</ActionBtn>
        <ActionBtn title={note.starred?'Unstar':'Star'} color="amber" onClick={e=>{e.stopPropagation();onToggleStar(note._id,!note.starred);}}>
          {note.starred?'★':'☆'}
        </ActionBtn>
        <ActionBtn title="Delete" color="red" onClick={e=>{e.stopPropagation();onDelete(note);}}>✕</ActionBtn>
      </div>

      {/* Badges */}
      {(note.pinned||note.starred) && (
        <div className="flex gap-1.5 mb-2">
          {note.pinned  && <span className="text-[9px] text-vault-amber font-mono">📌 pinned</span>}
          {note.starred && <span className="text-[9px] text-vault-amber font-mono">★ starred</span>}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-semibold text-vault-text mb-3 pr-16 leading-snug line-clamp-2">
        {note.title}
      </p>

      {/* Content hidden — lock icon instead of preview */}
      <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-vault-card rounded-lg border border-vault-border">
        <span className="text-xs text-vault-muted font-mono">🔒</span>
        <span className="text-xs text-vault-muted font-mono italic">content encrypted</span>
        {note.wordCount > 0 && (
          <span className="ml-auto text-[9px] text-vault-dimmed font-mono">{note.wordCount}w</span>
        )}
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.map(tag => (
            <span key={tag} className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${TAG_COLORS[tag]||''}`}>{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-vault-border pt-2.5">
        <span className="text-[10px] text-vault-muted font-mono">{fmtDate(note.updatedAt)}</span>
        <span className="flex items-center gap-1 text-[10px] text-vault-green font-mono">
          <span className="w-1 h-1 rounded-full bg-vault-green enc-pulse" />enc
        </span>
      </div>
    </div>
  );
}

function ActionBtn({ children, color, title, onClick }) {
  const colors = {
    amber:'bg-[rgba(255,179,0,0.15)] text-vault-amber hover:bg-[rgba(255,179,0,0.3)]',
    red:  'bg-[rgba(255,77,109,0.15)] text-vault-red hover:bg-[rgba(255,77,109,0.3)]',
  };
  return (
    <button title={title} onClick={onClick}
      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-colors border-0 cursor-pointer ${colors[color]}`}>
      {children}
    </button>
  );
}
