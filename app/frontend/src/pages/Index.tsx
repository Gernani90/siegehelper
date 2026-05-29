import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';
import { login, isAuthenticated } from '@/lib/auth';

export default function Index() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Usuário ou senha incorretos');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Guild Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/assets/guild-logo-op.png"
            alt="Ordem & Progress Guild Logo"
            className="h-24 w-24 rounded-full border-2 border-amber-500/50 shadow-lg shadow-amber-500/20"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">Siege Helper</h1>
            <p className="mt-1 text-sm font-medium text-amber-400">
              Guild Ordem &amp; Progress
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-slate-600">
          © 2026 Ordem &amp; Progress — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}