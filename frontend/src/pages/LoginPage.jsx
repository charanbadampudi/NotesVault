import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: 'linear-gradient(#252836 1px,transparent 1px),linear-gradient(90deg,#252836 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="bg-vault-surface border border-vault-border rounded-2xl p-10 w-96 relative z-10 animate-fadeIn">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-vault-accent to-vault-accent2 flex items-center justify-center text-xl">🔐</div>
          <div>
            <p className="text-lg font-bold">VaultNotes</p>
            <p className="text-[10px] text-vault-muted font-mono uppercase tracking-widest">end-to-end encrypted</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Unlock your vault</h1>
        <p className="text-sm text-vault-muted mb-7">Notes are encrypted — only you can read them.</p>
        {error && (
          <div className="bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.2)] rounded-xl px-4 py-2.5 text-xs text-vault-red mb-5">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-vault-muted font-mono uppercase tracking-widest mb-2">Email</label>
            <input className="vault-input" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required autoFocus />
          </div>
          <div>
            <label className="block text-[10px] text-vault-muted font-mono uppercase tracking-widest mb-2">Master password</label>
            <input className="vault-input" type="password" name="password" value={form.password} onChange={onChange} placeholder="Your master password" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
            {loading ? 'Deriving encryption key…' : 'Unlock vault →'}
          </button>
        </form>
        <div className="flex items-center justify-center gap-2 text-[11px] text-vault-green font-mono mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-vault-green enc-pulse" />
          AES-256 · key never leaves your device
        </div>
        <p className="text-center text-xs text-vault-muted mt-5">
          No account?{' '}<Link to="/register" className="text-vault-accent hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
