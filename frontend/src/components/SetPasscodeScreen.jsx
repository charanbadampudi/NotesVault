import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SetPasscodeScreen({ onDone }) {
  const { setPasscode } = useAuth();

  const [step,      setStep]     = useState('size');   // 'size' | 'set' | 'confirm'
  const [pinLength, setPinLength]= useState(null);     // 4 | 5 | 6
  const [first,     setFirst]    = useState('');
  const [second,    setSecond]   = useState('');
  const [error,     setError]    = useState('');
  const [saving,    setSaving]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (step !== 'size') setTimeout(() => inputRef.current?.focus(), 50);
  }, [step]);

  const current     = step === 'set' ? first   : second;
  const setCurrent  = step === 'set' ? setFirst : setSecond;

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, pinLength);
    setCurrent(v); setError('');
    // auto-advance when full
    if (v.length === pinLength) setTimeout(() => handleNext(v), 120);
  };

  const handleNext = async (val) => {
    const code = val ?? current;
    if (code.length < pinLength) { setError(`Enter all ${pinLength} digits.`); return; }

    if (step === 'set') {
      setStep('confirm'); setSecond(''); return;
    }

    // confirm step
    if (first !== code) {
      setError('Passcodes do not match. Try again.');
      setSecond('');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    setSaving(true);
    try { await setPasscode(first); onDone(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to save passcode.'); }
    finally { setSaving(false); }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && current.length === pinLength) handleNext(current);
  };

  // ── STEP 1: Choose size ──────────────────────────────────────────
  if (step === 'size') {
    return (
      <div className="min-h-screen bg-vault-bg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage:'linear-gradient(#252836 1px,transparent 1px),linear-gradient(90deg,#252836 1px,transparent 1px)',
          backgroundSize:'40px 40px',
        }} />

        <div className="bg-vault-surface border border-vault-border rounded-2xl p-10 w-96 relative z-10 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vault-accent to-vault-accent2
                          flex items-center justify-center text-3xl mx-auto mb-6">🔑</div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">Set vault passcode</h1>
          <p className="text-sm text-vault-muted mb-8 leading-relaxed">
            Choose how many digits your passcode will be.
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {[4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => { setPinLength(n); setStep('set'); setFirst(''); setError(''); }}
                className="flex items-center justify-between px-5 py-4 rounded-xl border
                           border-vault-border bg-vault-card hover:border-vault-accent
                           hover:bg-[rgba(79,138,255,0.06)] transition-all cursor-pointer text-left group"
              >
                <div>
                  <p className="text-sm font-semibold text-vault-text">{n}-digit passcode</p>
                  <p className="text-[10px] text-vault-muted font-mono mt-0.5">
                    {n === 4 ? 'Standard — quick to enter'
                     : n === 5 ? 'Medium — good balance'
                     : 'Strong — harder to guess'}
                  </p>
                </div>
                {/* Preview dots */}
                <div className="flex gap-1.5 shrink-0">
                  {Array.from({ length: n }).map((_, i) => (
                    <div key={i}
                      className="w-3 h-3 rounded-full border-2 border-vault-dimmed
                                 group-hover:border-vault-accent transition-colors" />
                  ))}
                </div>
              </button>
            ))}
          </div>

          <button onClick={onDone}
            className="text-xs text-vault-muted hover:text-vault-text transition-colors bg-transparent border-0 cursor-pointer">
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2 & 3: Enter PIN / Confirm PIN ──────────────────────────
  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage:'linear-gradient(#252836 1px,transparent 1px),linear-gradient(90deg,#252836 1px,transparent 1px)',
        backgroundSize:'40px 40px',
      }} />

      <div className="bg-vault-surface border border-vault-border rounded-2xl p-10 w-96 relative z-10 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vault-accent to-vault-accent2
                        flex items-center justify-center text-3xl mx-auto mb-6">🔑</div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {step === 'set' ? `Enter ${pinLength}-digit passcode` : 'Confirm passcode'}
        </h1>
        <p className="text-sm text-vault-muted mb-8 leading-relaxed">
          {step === 'set'
            ? `Type your ${pinLength}-digit PIN below.`
            : 'Enter the same digits again to confirm.'}
        </p>

        {/* Hidden input + exact pinLength boxes */}
        <div className="relative mb-2">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            value={current}
            onChange={handleChange}
            onKeyDown={handleKey}
            maxLength={pinLength}
            className="absolute inset-0 opacity-0 cursor-default w-full h-full"
            autoComplete="off"
          />
          <div className="flex justify-center gap-2.5" onClick={() => inputRef.current?.focus()}>
            {Array.from({ length: pinLength }).map((_, i) => (
              <div key={i}
                style={{ height:'56px', width:'48px' }}
                className={`rounded-xl border-2 flex items-center justify-center
                            text-xl font-mono transition-all cursor-text select-none
                            ${i === current.length && !saving
                              ? 'border-vault-accent bg-[rgba(79,138,255,0.08)] shadow-[0_0_0_3px_rgba(79,138,255,0.15)]'
                              : current[i]
                                ? 'border-vault-dimmed bg-vault-card'
                                : 'border-vault-border bg-vault-card'
                            }`}>
                {current[i] ? <span className="text-vault-text">•</span> : null}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-vault-muted font-mono mb-6">
          {current.length} / {pinLength} digits
        </p>

        {error && (
          <p className="text-xs text-vault-red bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.2)]
                        rounded-xl px-4 py-2.5 mb-5">{error}</p>
        )}

        <button
          onClick={() => handleNext(current)}
          disabled={saving || current.length < pinLength}
          className="btn-primary w-full disabled:opacity-40 mb-3"
        >
          {saving ? 'Saving…' : step === 'set' ? 'Continue →' : 'Set passcode →'}
        </button>

        {/* Back button */}
        <button
          onClick={() => {
            if (step === 'confirm') { setStep('set'); setFirst(''); setSecond(''); setError(''); }
            else { setStep('size'); setFirst(''); setError(''); }
          }}
          className="text-xs text-vault-muted hover:text-vault-text transition-colors bg-transparent border-0 cursor-pointer"
        >
          ← Back
        </button>

        <p className="text-[10px] text-vault-muted font-mono mt-5">
          Hashed with bcrypt — never stored in plaintext
        </p>
      </div>
    </div>
  );
}
