import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotes } from '../context/NotesContext';
import { wordCount } from '../utils/crypto';

const ALL_TAGS  = ['personal','work','finance','legal','medical'];
const TAG_ICONS = { personal:'👤', work:'💼', finance:'💰', legal:'⚖️', medical:'🏥' };
const COLORS    = [
  {key:'default',cls:'bg-vault-dimmed'},
  {key:'blue',   cls:'bg-vault-accent'},
  {key:'green',  cls:'bg-vault-green'},
  {key:'amber',  cls:'bg-vault-amber'},
  {key:'red',    cls:'bg-vault-red'},
  {key:'purple', cls:'bg-purple-400'},
];

// ── Lightbox ─────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  const current = images[idx];

  return (
    <div
      className="fixed inset-0 bg-black/92 z-[300] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-5 text-white/60 hover:text-white text-3xl
                   bg-transparent border-0 cursor-pointer transition-colors z-10"
      >✕</button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-xs font-mono z-10">
          {idx + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                     bg-white/10 hover:bg-white/25 text-white flex items-center justify-center
                     border-0 cursor-pointer transition-colors text-xl z-10"
        >‹</button>
      )}

      {/* Image */}
      <img
        src={current.base64}
        alt={current.name || 'image'}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl select-none"
        onClick={e => e.stopPropagation()}
        draggable={false}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                     bg-white/10 hover:bg-white/25 text-white flex items-center justify-center
                     border-0 cursor-pointer transition-colors text-xl z-10"
        >›</button>
      )}

      {/* Filename */}
      {current.name && (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/40 text-[11px] font-mono">
          {current.name}
        </p>
      )}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────
export default function NoteEditor({ noteId, onClose, onSaved }) {
  const { createNote, openNote, saveNote } = useNotes();
  const isEdit = Boolean(noteId);

  const [title,          setTitle]         = useState('');
  const [content,        setContent]       = useState('');
  const [tags,           setTags]          = useState([]);
  const [color,          setColor]         = useState('default');
  const [saving,         setSaving]        = useState(false);
  const [loading,        setLoading]       = useState(isEdit);
  const [error,          setError]         = useState('');
  const [wc,             setWc]            = useState(0);
  const [passcodeType,   setPasscodeType]  = useState('default');
  const [customPasscode, setCustomPasscode]= useState('');
  const [lockMode,       setLockMode]      = useState('oncePerSession');
  const [showPassSec,    setShowPassSec]   = useState(false);
  const [images,         setImages]        = useState([]);
  const [lightbox,       setLightbox]      = useState(null); // { index }

  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const fileRef  = useRef(null);

  useEffect(() => {
    if (!isEdit) { setTimeout(() => titleRef.current?.focus(), 50); return; }
    (async () => {
      try {
        const note = await openNote(noteId);
        setTitle(note.title); setContent(note.content); setTags(note.tags);
        setColor(note.color||'default'); setPasscodeType(note.passcodeType||'default');
        setLockMode(note.lockMode||'oncePerSession'); setWc(wordCount(note.content));
        setImages((note.decryptedImages||[]).map(img => ({
          base64:        img.base64,
          mimeType:      img.mimeType,
          name:          img.name,
          encryptedData: img.encryptedData,
          iv:            img.iv,
        })));
      } catch { setError('Failed to decrypt note.'); }
      finally { setLoading(false); setTimeout(()=>contentRef.current?.focus(),50); }
    })();
  }, [noteId, isEdit, openNote]);

  const toggleTag = (tag) => setTags(p => p.includes(tag)?p.filter(t=>t!==tag):[...p,tag]);

  const handleImageFiles = useCallback((files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) { setError('Images must be under 5 MB each.'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, { base64: e.target.result, mimeType: file.type, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleImageFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_,i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim())                           { setError('Please add a title.'); return; }
    if (!content.trim() && images.length === 0) { setError('Note is empty.'); return; }
    if (passcodeType==='custom' && customPasscode && !/^\d{4,6}$/.test(customPasscode))
      { setError('Custom passcode must be 4–6 digits.'); return; }
    setSaving(true); setError('');
    try {
      const pass = passcodeType==='custom' ? (customPasscode||undefined) : undefined;
      if (isEdit) {
        await saveNote(noteId, title.trim(), content, tags, color, passcodeType, pass, lockMode, images);
        onSaved('✅ Note saved & re-encrypted');
      } else {
        await createNote(title.trim(), content, tags, color, passcodeType, pass, lockMode, images);
        onSaved('✅ Note encrypted & created');
      }
      onClose();
    } catch (err) { setError(err.message||'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleKeyDown = (e) => { if ((e.metaKey||e.ctrlKey)&&e.key==='Enter') handleSave(); };

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-vault-surface border border-vault-border rounded-2xl w-full max-w-2xl
                        flex flex-col max-h-[92vh] animate-slideUp">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-vault-border shrink-0">
            <div>
              <h2 className="text-base font-bold">{isEdit ? 'Edit note' : 'New note'}</h2>
              <p className="text-[10px] text-vault-green font-mono mt-0.5 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-vault-green enc-pulse" />
                AES-256 encrypted before saving
              </p>
            </div>
            <button onClick={onClose}
              className="text-vault-muted hover:text-vault-text text-xl bg-transparent border-0 cursor-pointer transition-colors">✕</button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-vault-muted font-mono text-sm">Decrypting…</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">

                {/* Title */}
                <div className="px-6 pt-5">
                  <input ref={titleRef}
                    className="w-full bg-transparent font-bold text-xl text-vault-text placeholder:text-vault-dimmed
                               border-0 border-b border-vault-border pb-3 mb-4 focus:border-vault-accent
                               transition-colors outline-none"
                    type="text" placeholder="Note title…"
                    value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={handleKeyDown} />
                </div>

                {/* Content */}
                <div className="px-6" onDrop={handleDrop} onDragOver={e=>e.preventDefault()}>
                  <textarea ref={contentRef}
                    className="w-full min-h-[160px] bg-transparent text-sm text-vault-text
                               placeholder:text-vault-dimmed border-0 resize-none outline-none leading-relaxed font-mono"
                    placeholder="Write your note here…  (Ctrl+Enter to save, or drag & drop images)"
                    value={content}
                    onChange={e=>{setContent(e.target.value);setWc(wordCount(e.target.value));}}
                    onKeyDown={handleKeyDown} />
                </div>

                {/* Image grid */}
                {images.length > 0 && (
                  <div className="px-6 pb-3">
                    <div className="flex flex-wrap gap-3 mt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          {/* Thumbnail — click to open lightbox */}
                          <button
                            onClick={() => setLightbox({ index: idx })}
                            className="block border-0 p-0 cursor-zoom-in bg-transparent"
                            title="Click to view full size"
                          >
                            <img
                              src={img.base64}
                              alt={img.name}
                              className="w-24 h-24 object-cover rounded-xl border border-vault-border
                                         hover:border-vault-accent transition-colors"
                            />
                          </button>

                          {/* Remove button */}
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-vault-red text-white
                                       text-xs flex items-center justify-center border-0 cursor-pointer
                                       opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Remove image"
                          >✕</button>

                          {/* Enc badge */}
                          <div className="absolute bottom-1 left-0 right-0 flex justify-center pointer-events-none">
                            <span className="text-[8px] bg-black/60 text-vault-green px-1.5 py-0.5 rounded font-mono">
                              🔒 enc
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Add more */}
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-vault-dimmed
                                   flex flex-col items-center justify-center gap-1 cursor-pointer
                                   hover:border-vault-accent transition-colors bg-transparent"
                      >
                        <span className="text-vault-muted text-xl">+</span>
                        <span className="text-[9px] text-vault-muted font-mono">add image</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Toolbar */}
                <div className="px-6 py-2 border-t border-vault-border flex items-center gap-2">
                  <span className="text-[10px] text-vault-muted font-mono uppercase tracking-wider mr-1">Insert:</span>
                  <button
                    onClick={() => fileRef.current?.click()}
                    title="Insert image (max 5 MB each)"
                    className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg
                               bg-vault-card border border-vault-border text-vault-muted
                               hover:text-vault-text hover:border-vault-dimmed transition-all cursor-pointer"
                  >🖼️ Image</button>

                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e=>{ handleImageFiles(e.target.files); e.target.value=''; }} />

                  <span className="ml-auto text-[10px] text-vault-muted font-mono">
                    {wc} words · {images.length} image{images.length!==1?'s':''}
                  </span>
                </div>

                {/* Tags */}
                <div className="px-6 py-3 border-t border-vault-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-vault-muted font-mono uppercase tracking-wider mr-1">Tags:</span>
                    {ALL_TAGS.map(tag => (
                      <button key={tag} onClick={()=>toggleTag(tag)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer
                          ${tags.includes(tag)
                            ? 'bg-[rgba(79,138,255,0.15)] text-vault-accent border-vault-accent/30'
                            : 'bg-vault-card text-vault-muted border-vault-border hover:text-vault-text'}`}>
                        {TAG_ICONS[tag]} {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="px-6 py-3 border-t border-vault-border">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-vault-muted font-mono uppercase tracking-wider">Color:</span>
                    <div className="flex gap-2">
                      {COLORS.map(({key,cls}) => (
                        <button key={key} onClick={()=>setColor(key)}
                          className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${cls}
                            ${color===key ? 'border-vault-text scale-125' : 'border-transparent'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Passcode */}
                <div className="border-t border-vault-border">
                  <button onClick={()=>setShowPassSec(p=>!p)}
                    className="w-full flex items-center justify-between px-6 py-3 text-left
                               bg-transparent border-0 cursor-pointer hover:bg-vault-card/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-vault-text font-semibold">🔑 Passcode protection</span>
                      <span className="text-[9px] font-mono text-vault-muted bg-vault-card px-2 py-0.5 rounded-full border border-vault-border">
                        {passcodeType==='custom'?'custom PIN':'vault PIN'} · {lockMode==='everyOpen'?'every open':'once/session'}
                      </span>
                    </div>
                    <span className="text-vault-muted text-xs">{showPassSec?'▲':'▼'}</span>
                  </button>

                  {showPassSec && (
                    <div className="px-6 pb-5 space-y-5">
                      <div>
                        <p className="text-[10px] text-vault-muted font-mono uppercase tracking-wider mb-3">Which passcode protects this note</p>
                        <div className="flex flex-col gap-2">
                          <OptionRow selected={passcodeType==='default'} onClick={()=>{setPasscodeType('default');setCustomPasscode('');}}
                            label="Use my vault passcode" sub="The PIN you set for your entire vault" />
                          <OptionRow selected={passcodeType==='custom'} onClick={()=>setPasscodeType('custom')}
                            label="Separate passcode for this note" sub="A unique 4–6 digit PIN just for this note" />
                        </div>
                        {passcodeType==='custom' && (
                          <div className="mt-3">
                            <input className="vault-input font-mono tracking-[0.5em] text-center text-base w-40"
                              type="password" inputMode="numeric" maxLength={6} placeholder="· · · ·"
                              value={customPasscode}
                              onChange={e=>{ if(/^\d{0,6}$/.test(e.target.value)) setCustomPasscode(e.target.value); }} />
                            {isEdit && <p className="text-[10px] text-vault-muted font-mono mt-1.5">Leave blank to keep existing PIN</p>}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-vault-muted font-mono uppercase tracking-wider mb-3">When to ask for passcode</p>
                        <div className="flex flex-col gap-2">
                          <OptionRow selected={lockMode==='oncePerSession'} onClick={()=>setLockMode('oncePerSession')}
                            label="Once after I log in" sub="Stays unlocked until you sign out or close the tab" />
                          <OptionRow selected={lockMode==='everyOpen'} onClick={()=>setLockMode('everyOpen')}
                            label="Every time I open this note" sub="Always prompt, even if entered already this session" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {error && (
                <div className="mx-6 my-2 bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.2)]
                                rounded-xl px-4 py-2.5 text-xs text-vault-red shrink-0">{error}</div>
              )}

              <div className="flex items-center justify-between px-6 py-4 border-t border-vault-border shrink-0">
                <p className="text-[10px] text-vault-muted font-mono">Ctrl+Enter to save</p>
                <div className="flex gap-3">
                  <button onClick={onClose} className="btn-secondary">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                    {saving ? 'Encrypting…' : isEdit ? 'Save changes →' : 'Encrypt & save →'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox — rendered outside the modal so it sits above everything */}
      {lightbox !== null && (
        <Lightbox
          images={images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function OptionRow({ selected, onClick, label, sub }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left cursor-pointer transition-all
                  ${selected ? 'border-vault-accent bg-[rgba(79,138,255,0.08)]' : 'border-vault-border bg-vault-card hover:border-vault-dimmed'}`}>
      <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all
                       ${selected ? 'border-vault-accent bg-vault-accent' : 'border-vault-dimmed'}`} />
      <div>
        <p className="text-sm font-medium text-vault-text">{label}</p>
        <p className="text-[10px] text-vault-muted font-mono mt-0.5">{sub}</p>
      </div>
    </button>
  );
}
