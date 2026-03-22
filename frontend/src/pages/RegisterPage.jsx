import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ username:'', email:'', password:'', confirm:'' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try { await register(form.username, form.email, form.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Registration failed.'); }
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
        <h1 className="text-2xl font-bold tracking-tight mb-1">Create your vault</h1>
        <p className="text-sm text-vault-muted mb-7">Your master password is never stored or transmitted.</p>
        {error && (
          <div className="bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.2)] rounded-xl px-4 py-2.5 text-xs text-vault-red mb-5">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-vault-muted font-mono uppercase tracking-widest mb-2">Username</label>
            <input className="vault-input" type="text" name="username" value={form.username} onChange={onChange} placeholder="yourname" required minLength={3} autoFocus />
          </div>
          <div>
            <label className="block text-[10px] text-vault-muted font-mono uppercase tracking-widest mb-2">Email</label>
            <input className="vault-input" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-[10px] text-vault-muted font-mono uppercase tracking-widest mb-2">Master password</label>
            <input className="vault-input" type="password" name="password" value={form.password} onChange={onChange} placeholder="Min 8 characters" required minLength={8} />
          </div>
          <div>
            <label className="block text-[10px] text-vault-muted font-mono uppercase tracking-widest mb-2">Confirm password</label>
            <input className="vault-input" type="password" name="confirm" value={form.confirm} onChange={onChange} placeholder="Repeat password" required />
          </div>
          <div className="bg-[rgba(255,179,0,0.08)] border border-[rgba(255,179,0,0.2)] rounded-xl px-4 py-3 text-[10px] text-vault-amber font-mono leading-relaxed">
            ⚠️ Your master password cannot be recovered. It derives your AES-256 key and is never sent to our servers.
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Creating vault…' : 'Create vault →'}
          </button>
        </form>
        <p className="text-center text-xs text-vault-muted mt-5">
          Already have a vault?{' '}<Link to="/login" className="text-vault-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
