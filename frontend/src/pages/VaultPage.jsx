import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import StatsBar from '../components/StatsBar';
import NoteCard from '../components/NoteCard';
import NoteRow from '../components/NoteRow';
import NoteEditor from '../components/NoteEditor';
import SetPasscodeScreen from '../components/SetPasscodeScreen';
import PasscodePrompt from '../components/PasscodePrompt';
import TrashPage from './TrashPage';
import ToastContainer from '../components/ToastContainer';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../hooks/useSearch';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';

const FILTER_TITLES = {
  all:'All notes', recent:'Recent', pinned:'Pinned', starred:'Starred',
  personal:'Personal', work:'Work', finance:'Finance', legal:'Legal', medical:'Medical',
};

export default function VaultPage() {
  const { user, verifyPasscode } = useAuth();
  const { notes, loading, fetchNotes, deleteNote, toggleStar, togglePin, isUnlocked, markUnlocked } = useNotes();
  const { query, setQuery, debounced } = useSearch(300);
  const { toasts, addToast, removeToast } = useToast();

  const [filter,          setFilter]          = useState('all');
  const [view,            setView]            = useState('grid');
  const [editorOpen,      setEditorOpen]      = useState(false);
  const [editingId,       setEditingId]       = useState(null);
  const [showSetPasscode, setShowSetPasscode] = useState(!user?.passcodeSet);
  const [prompt,          setPrompt]          = useState(null);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => {
    if (filter !== 'trash') fetchNotes(debounced ? { search: debounced } : {});
  }, [debounced, fetchNotes, filter]);

  const filtered = useMemo(() => {
    let r = [...notes];
    if (filter==='starred')     r = r.filter(n=>n.starred);
    else if (filter==='pinned') r = r.filter(n=>n.pinned);
    else if (filter==='recent') r = r.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,12);
    else if (filter!=='all')    r = r.filter(n=>n.tags.includes(filter));
    if (debounced) {
      const q = debounced.toLowerCase();
      r = r.filter(n=>n.title.toLowerCase().includes(q)||n.tags.some(t=>t.includes(q)));
    }
    r.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
    return r;
  }, [notes, filter, debounced]);

  const needsPasscode = (note) => {
    if (!user?.passcodeSet && note.passcodeType==='default') return false;
    if (note.lockMode==='everyOpen') return true;
    return !isUnlocked(note._id);
  };

  const getBoxCount = (note) => note.passcodeLength || user?.passcodeLength || 4;

  const verifyNotePasscode = async (note, passcode) => {
    try {
      if (note.passcodeType === 'custom') {
        const { data } = await api.post(`/notes/${note._id}/verify-passcode`, { passcode });
        return !!data.success;
      }
      return await verifyPasscode(passcode);
    } catch { return false; }
  };

  const handleOpenNote = (note) => {
    if (needsPasscode(note)) setPrompt({ note, mode: 'open' });
    else openEditor(note._id);
  };

  const handleDelete = (note) => {
    const hasPasscode = note.passcodeType==='custom' || (note.passcodeType==='default' && user?.passcodeSet);
    if (hasPasscode) setPrompt({ note, mode: 'delete' });
    else {
      if (!window.confirm('Move this note to trash?')) return;
      doDelete(note._id);
    }
  };

  const doDelete = async (id) => {
    try { await deleteNote(id); addToast('🗑️ Moved to trash'); }
    catch { addToast('❌ Delete failed'); }
  };

  const handleVerify = async (passcode) => {
    if (!prompt) return false;
    const { note, mode } = prompt;
    const ok = await verifyNotePasscode(note, passcode);
    if (!ok) return false;
    if (mode === 'open') {
      if (note.lockMode==='oncePerSession') markUnlocked(note._id);
      setPrompt(null);
      openEditor(note._id);
    } else if (mode === 'delete') {
      setPrompt(null);
      doDelete(note._id);
    }
    return true;
  };

  const openEditor  = (id) => { setEditingId(id);   setEditorOpen(true); };
  const openNew     = ()   => { setEditingId(null);  setEditorOpen(true); };
  const closeEditor = ()   => { setEditorOpen(false); setEditingId(null); };

  const handleToggleStar = async (id, starred) => {
    try { await toggleStar(id, starred); addToast(starred?'⭐ Starred':'☆ Unstarred'); }
    catch { addToast('❌ Update failed'); }
  };
  const handleTogglePin = async (id, pinned) => {
    try { await togglePin(id, pinned); addToast(pinned?'📌 Pinned':'Unpinned'); }
    catch { addToast('❌ Update failed'); }
  };

  if (showSetPasscode) return <SetPasscodeScreen onDone={() => setShowSetPasscode(false)} />;

  return (
    <div className="flex h-screen overflow-hidden bg-vault-bg">
      <Sidebar activeFilter={filter} onFilterChange={setFilter} />

      {/* Trash view */}
      {filter === 'trash' ? (
        <TrashPage onToast={addToast} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center gap-4 px-7 py-5 border-b border-vault-border bg-vault-surface shrink-0">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted text-sm pointer-events-none">🔍</span>
              <input className="vault-input pl-9" type="text"
                placeholder="Search notes by title or tag…"
                value={query} onChange={e=>setQuery(e.target.value)} />
            </div>
            <div className="flex gap-1 bg-vault-card border border-vault-border rounded-xl p-1">
              <ViewBtn active={view==='grid'} onClick={()=>setView('grid')}>⊞ Grid</ViewBtn>
              <ViewBtn active={view==='list'} onClick={()=>setView('list')}>≡ List</ViewBtn>
            </div>
            <button onClick={openNew} className="btn-primary flex items-center gap-2">＋ New note</button>
          </header>

          <main className="flex-1 overflow-y-auto px-7 py-6">
            <StatsBar />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold tracking-tight">
                {FILTER_TITLES[filter] || filter}
                <span className="ml-2 text-sm text-vault-muted font-normal font-mono">({filtered.length})</span>
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-vault-muted font-mono text-sm">Decrypting vault…</div>
            ) : filtered.length === 0 ? (
              <EmptyState hasSearch={!!debounced} filter={filter} onNew={openNew} />
            ) : view==='grid' ? (
              <div className="grid gap-3" style={{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))'}}>
                {filtered.map(note => (
                  <NoteCard key={note._id} note={note}
                    onClick={()=>handleOpenNote(note)}
                    onDelete={()=>handleDelete(note)}
                    onToggleStar={handleToggleStar}
                    onTogglePin={handleTogglePin} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map(note => (
                  <NoteRow key={note._id} note={note}
                    onClick={()=>handleOpenNote(note)}
                    onDelete={()=>handleDelete(note)}
                    onToggleStar={handleToggleStar}
                    onTogglePin={handleTogglePin} />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {editorOpen && (
        <NoteEditor noteId={editingId} onClose={closeEditor}
          onSaved={msg=>{addToast(msg);fetchNotes();}} />
      )}

      {prompt && (
        <PasscodePrompt
          noteTitle={prompt.note.title}
          boxCount={getBoxCount(prompt.note)}
          mode={prompt.mode}
          onVerify={handleVerify}
          onCancel={() => setPrompt(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function ViewBtn({ children, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border-0 text-xs font-medium cursor-pointer transition-all
        ${active ? 'bg-vault-dimmed text-vault-text' : 'bg-transparent text-vault-muted hover:text-vault-text'}`}>
      {children}
    </button>
  );
}

function EmptyState({ hasSearch, filter, onNew }) {
  const special = { starred:'No starred notes yet.', pinned:'No pinned notes yet.' };
  return (
    <div className="text-center py-24 text-vault-muted">
      <div className="text-5xl mb-4">📓</div>
      <p className="text-base font-semibold text-vault-text mb-2">
        {special[filter]||(hasSearch?'No notes match your search':'Your vault is empty')}
      </p>
      <p className="text-sm mb-6">
        {!special[filter]&&(hasSearch?'Try a different keyword.':'Create your first encrypted note.')}
      </p>
      {!hasSearch&&!special[filter]&&(
        <button onClick={onNew} className="btn-primary inline-flex items-center gap-2">＋ New note</button>
      )}
    </div>
  );
}
