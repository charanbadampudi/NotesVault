import { useNotes } from '../context/NotesContext';

export default function StatsBar() {
  const { notes } = useNotes();
  const total      = notes.length;
  const totalWords = notes.reduce((a,n) => a+(n.wordCount||0), 0);
  const categories = new Set(notes.flatMap(n => n.tags)).size;

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <Stat label="Total notes"  value={total}                      color="text-vault-accent" />
      <Stat label="Encrypted"    value={total}                      color="text-vault-green" />
      <Stat label="Total words"  value={totalWords.toLocaleString()} />
      <Stat label="Categories"   value={categories}                  color="text-vault-amber" />
    </div>
  );
}

function Stat({ label, value, color='text-vault-text' }) {
  return (
    <div className="bg-vault-surface border border-vault-border rounded-2xl px-4 py-4">
      <p className="text-[10px] text-vault-muted font-mono uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}
