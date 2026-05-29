import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Swords, Menu, X, LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';

export default function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-indigo-400" />
          <span className="text-xl font-bold text-white">Siege Helper</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              Home
            </Button>
          </Link>
          <Link to="/defenses/new">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              <Shield className="mr-1 h-4 w-4" />
              Nova Defesa
            </Button>
          </Link>
          <Link to="/attacks/new">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              <Swords className="mr-1 h-4 w-4" />
              Novo Ataque
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="border-t border-slate-700/50 bg-slate-900 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                Home
              </Button>
            </Link>
            <Link to="/defenses/new" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <Shield className="mr-2 h-4 w-4" />
                Nova Defesa
              </Button>
            </Link>
            <Link to="/attacks/new" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <Swords className="mr-2 h-4 w-4" />
                Novo Ataque
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
