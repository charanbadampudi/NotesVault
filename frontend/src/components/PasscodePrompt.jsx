import { useState, useRef, useEffect } from 'react';

/**
 * PasscodePrompt
 * 
 * boxCount = exact number of boxes to show = exact digits of the passcode set for this note.
 * Comes from note.passcodeLength stored in MongoDB when the passcode was created.
 */
export default function PasscodePrompt({ noteTitle, boxCount = 4, onVerify, onCancel, mode = 'open' }) {
  const MAX = boxCount; // user must enter exactly this many digits
  const [value,   setValue]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, MAX);
    setValue(v);
    setError('');
    // Auto-submit when all boxes filled
    if (v.length === MAX) {
      setTimeout(() => handleSubmit(v), 120);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') onCancel();
  };

  const handleSubmit = async (val) => {
    const code = val ?? value;
    if (code.length < MAX) { setError(`Enter all ${MAX} digits.`); return; }
    setLoading(true);
    try {
      const ok = await onVerify(code);
      if (!ok) {
        setError('Incorrect passcode. Try again.');
        setValue('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch {
      setError('Incorrect passcode. Try again.');
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const modeLabel = mode === 'delete' ? 'Confirm to delete' : 'Passcode required';
  const modeSubLabel = mode === 'delete'
    ? 'Enter the passcode for this note to confirm deletion'
    : 'Enter your passcode to open this note';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
      <div className="bg-vault-surface border border-vault-border rounded-2xl p-8 w-80 text-center animate-slideUp">

        <div className="text-4xl mb-4">{mode === 'delete' ? '🗑️' : '🔒'}</div>
        <h2 className="text-base font-bold mb-1">{modeLabel}</h2>
        <p className="text-xs text-vault-muted font-mono mb-1 truncate px-2" title={noteTitle}>
          {noteTitle}
        </p>
        <p className="text-[10px] text-vault-muted mb-6">{modeSubLabel}</p>

        {/* Hidden real input */}
        <div className="relative mb-3">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            maxLength={MAX}
            className="absolute inset-0 opacity-0 cursor-default w-full h-full"
            autoComplete="off"
          />

          {/* Exactly boxCount boxes — no more, no less */}
          <div
            className="flex justify-center gap-2.5"
            onClick={() => inputRef.current?.focus()}
          >
            {Array.from({ length: MAX }).map((_, i) => (
              <div
                key={i}
                style={{ height: '52px', width: '44px' }}
                className={`rounded-xl border-2 flex items-center justify-center
                            font-mono transition-all cursor-text select-none
                            ${i === value.length && !loading
                              ? 'border-vault-accent bg-[rgba(79,138,255,0.08)] shadow-[0_0_0_3px_rgba(79,138,255,0.15)]'
                              : value[i]
                                ? 'border-vault-dimmed bg-vault-card'
                                : 'border-vault-border bg-vault-card'
                            }`}
              >
                {value[i] ? <span className="text-vault-text text-xl">•</span> : null}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-vault-muted font-mono mb-5">
          {value.length} / {MAX} digits
        </p>

        {error && (
          <p className="text-xs text-vault-red bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.2)]
                        rounded-xl px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => handleSubmit(value)}
            disabled={loading || value.length < MAX}
            className={`btn-primary flex-1 disabled:opacity-40 ${mode==='delete' ? 'bg-gradient-to-br from-vault-red to-rose-700' : ''}`}
          >
            {loading ? '…' : mode === 'delete' ? 'Delete' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
