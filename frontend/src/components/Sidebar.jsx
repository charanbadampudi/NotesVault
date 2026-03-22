import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';

const CATEGORIES = [
  { key:'personal', label:'Personal', icon:'👤' },
  { key:'work',     label:'Work',     icon:'💼' },
  { key:'finance',  label:'Finance',  icon:'💰' },
  { key:'legal',    label:'Legal',    icon:'⚖️'  },
  { key:'medical',  label:'Medical',  icon:'🏥' },
];

export default function Sidebar({ activeFilter, onFilterChange }) {
  const { user, logout } = useAuth();
  const { notes, trashNotes } = useNotes();
  const countByTag = (tag) => notes.filter(n => n.tags.includes(tag)).length;

  return (
    <aside className="w-60 bg-vault-surface border-r border-vault-border flex flex-col h-full shrink-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-vault-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vault-accent to-vault-accent2 flex items-center justify-center text-sm">🔐</div>
        <div>
          <p className="text-sm font-bold">VaultNotes</p>
          <p className="text-[9px] text-vault-muted font-mono uppercase tracking-widest">encrypted</p>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-5 mb-2 text-[10px] text-vault-muted font-mono uppercase tracking-widest">Library</p>
        <NavItem icon="📓" label="All notes"  count={notes.length}                      active={activeFilter==='all'}     onClick={()=>onFilterChange('all')} />
        <NavItem icon="🕒" label="Recent"                                                active={activeFilter==='recent'}  onClick={()=>onFilterChange('recent')} />
        <NavItem icon="📌" label="Pinned"     count={notes.filter(n=>n.pinned).length}   active={activeFilter==='pinned'}  onClick={()=>onFilterChange('pinned')} />
        <NavItem icon="⭐" label="Starred"    count={notes.filter(n=>n.starred).length}  active={activeFilter==='starred'} onClick={()=>onFilterChange('starred')} />

        <p className="px-5 mt-4 mb-2 text-[10px] text-vault-muted font-mono uppercase tracking-widest">Categories</p>
        {CATEGORIES.map(({key,label,icon}) => (
          <NavItem key={key} icon={icon} label={label} count={countByTag(key)} active={activeFilter===key} onClick={()=>onFilterChange(key)} />
        ))}

        <div className="mx-5 my-3 border-t border-vault-border" />

        <NavItem
          icon="🗑️"
          label="Trash"
          count={trashNotes.length}
          active={activeFilter==='trash'}
          onClick={()=>onFilterChange('trash')}
          danger
        />

        <div className="mx-5 mt-4 flex items-center gap-2 text-vault-green text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-vault-green enc-pulse" />
          AES-256 encrypted
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-vault-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vault-accent to-vault-accent2 flex items-center justify-center text-xs font-bold shrink-0">
          {user?.username?.slice(0,2).toUpperCase()||'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.username}</p>
          <p className="text-[10px] text-vault-muted font-mono truncate">{user?.email}</p>
        </div>
        <button onClick={logout} title="Logout"
          className="text-vault-muted hover:text-vault-red transition-colors bg-transparent border-0 cursor-pointer text-base">⏻</button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, count, active, onClick, danger }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm font-medium transition-all relative text-left border-0 cursor-pointer
        ${active
          ? danger
            ? 'bg-[rgba(255,77,109,0.1)] text-vault-red before:absolute before:left-0 before:inset-y-0 before:w-0.5 before:bg-vault-red'
            : 'bg-[rgba(79,138,255,0.1)] text-vault-accent before:absolute before:left-0 before:inset-y-0 before:w-0.5 before:bg-vault-accent'
          : danger
            ? 'bg-transparent text-vault-muted hover:bg-vault-card hover:text-vault-red'
            : 'bg-transparent text-vault-muted hover:bg-vault-card hover:text-vault-text'
        }`}>
      <span className="w-4 text-center text-sm">{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${danger ? 'bg-[rgba(255,77,109,0.15)] text-vault-red' : 'bg-vault-dimmed'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
