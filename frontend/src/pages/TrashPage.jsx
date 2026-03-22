import { useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { fmtDate } from '../utils/crypto';

export default function TrashPage({ onToast }) {
  const { trashNotes, loading, fetchTrash, restoreNote, hardDeleteNote, emptyTrash } = useNotes();

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  const handleRestore = async (id) => {
    try { await restoreNote(id); onToast('↩️ Note restored'); }
    catch { onToast('❌ Restore failed'); }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('Permanently delete this note? It cannot be recovered.')) return;
    try { await hardDeleteNote(id); onToast('🗑️ Permanently deleted'); }
    catch { onToast('❌ Delete failed'); }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm(`Permanently delete all ${trashNotes.length} notes in trash? This cannot be undone.`)) return;
    try { await emptyTrash(); onToast('🗑️ Trash emptied'); }
    catch { onToast('❌ Failed to empty trash'); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-7 py-5 border-b border-vault-border bg-vault-surface shrink-0">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-vault-text flex items-center gap-2">
            🗑️ Trash
            <span className="text-sm text-vault-muted font-normal font-mono">({trashNotes.length})</span>
          </h1>
          <p className="text-[10px] text-vault-muted font-mono mt-0.5">
            Notes here can be restored or permanently deleted
          </p>
        </div>
        {trashNotes.length > 0 && (
          <button onClick={handleEmptyTrash}
            className="flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-xl
                       bg-[rgba(255,77,109,0.1)] text-vault-red border border-[rgba(255,77,109,0.2)]
                       hover:bg-[rgba(255,77,109,0.2)] transition-colors cursor-pointer">
            🗑️ Empty trash
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-7 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-vault-muted font-mono text-sm">
            Loading trash…
          </div>
        ) : trashNotes.length === 0 ? (
          <div className="text-center py-24 text-vault-muted">
            <div className="text-5xl mb-4">🗑️</div>
            <p className="text-base font-semibold text-vault-text mb-2">Trash is empty</p>
            <p className="text-sm">Deleted notes will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {trashNotes.map(note => (
              <div key={note._id}
                className="flex items-center gap-4 bg-vault-surface border border-vault-border
                           rounded-xl px-5 py-4 transition-colors hover:border-vault-dimmed">

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-vault-text truncate">{note.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-vault-muted font-mono">
                      Deleted {fmtDate(note.deletedAt)}
                    </span>
                    {note.tags?.length > 0 && (
                      <div className="flex gap-1">
                        {note.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-vault-dimmed text-vault-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-vault-muted font-mono flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-vault-green enc-pulse" />enc
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleRestore(note._id)}
                    className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl
                               bg-[rgba(79,138,255,0.1)] text-vault-accent border border-[rgba(79,138,255,0.2)]
                               hover:bg-[rgba(79,138,255,0.2)] transition-colors cursor-pointer">
                    ↩️ Restore
                  </button>
                  <button onClick={() => handleHardDelete(note._id)}
                    className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl
                               bg-[rgba(255,77,109,0.1)] text-vault-red border border-[rgba(255,77,109,0.2)]
                               hover:bg-[rgba(255,77,109,0.2)] transition-colors cursor-pointer">
                    ✕ Delete forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
