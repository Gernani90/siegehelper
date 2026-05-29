import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Shield, Swords, Search, Loader2, Upload } from 'lucide-react';
import Header from '@/components/Header';
import DefenseCard from '@/components/DefenseCard';
import { isAuthenticated } from '@/lib/auth';
import { getAPIBaseURL } from '@/lib/config';
import {
  DefenseWithAttacks,
  TOWERS,
  TOWER_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  DEFENSE_TYPES,
  DEFENSE_TYPE_LABELS,
  ELEMENTS,
  ELEMENT_LABELS,
  SEASONS,
} from '@/lib/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<DefenseWithAttacks[]>([]);
  const [loading, setLoading] = useState(false);
  const [tower, setTower] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [defenseType, setDefenseType] = useState<string>('');
  const [element, setElement] = useState<string>('');
  const [season, setSeason] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 24;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
    } else {
      setReady(true);
    }
  }, []);

  const searchDefenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (tower) params.tower = tower;
      if (difficulty) params.difficulty = difficulty;
      if (defenseType) params.defense_type = defenseType;
      if (element) params.element = element;
      if (season) params.season = season;
      params.limit = String(pageSize);
      params.skip = String((page - 1) * pageSize);

      const response = await fetch(`${getAPIBaseURL()}/api/v1/search/defenses?${new URLSearchParams(params)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Erro ao buscar defesas');
      }
      setResults(data?.results || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tower, difficulty, defenseType, element, season, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, tower, difficulty, defenseType, element, season]);

  // Real-time search as user types (debounced)
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      searchDefenses();
    }, 300);
    return () => clearTimeout(timer);
  }, [ready, searchQuery, tower, difficulty, defenseType, element, season]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    searchDefenses();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Home</h1>
            <p className="text-sm text-slate-400">Defesas cadastradas para consulta rápida.</p>
          </div>
          <p className="text-sm text-slate-400">
            {loading ? 'Carregando...' : `${rangeStart}-${rangeEnd} de ${total} defesas`}
          </p>
        </div>

        {/* Search bar - real-time search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar defesa por monstros... (ex: Clara Savanah Triana)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Select value={tower} onValueChange={(v) => setTower(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[140px] border-slate-700 bg-slate-800/50 text-slate-200">
              <SelectValue placeholder="Torre" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              <SelectItem value="all" className="text-slate-200">Todas</SelectItem>
              {TOWERS.map((t) => (
                <SelectItem key={t} value={t} className="text-slate-200">
                  {TOWER_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={(v) => setDifficulty(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[140px] border-slate-700 bg-slate-800/50 text-slate-200">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              <SelectItem value="all" className="text-slate-200">Todas</SelectItem>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d} className="text-slate-200">
                  {DIFFICULTY_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={defenseType} onValueChange={(v) => setDefenseType(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[160px] border-slate-700 bg-slate-800/50 text-slate-200">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              <SelectItem value="all" className="text-slate-200">Todos</SelectItem>
              {DEFENSE_TYPES.map((dt) => (
                <SelectItem key={dt} value={dt} className="text-slate-200">
                  {DEFENSE_TYPE_LABELS[dt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={element} onValueChange={(v) => setElement(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[140px] border-slate-700 bg-slate-800/50 text-slate-200">
              <SelectValue placeholder="Elemento" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              <SelectItem value="all" className="text-slate-200">Todos</SelectItem>
              {ELEMENTS.map((el) => (
                <SelectItem key={el} value={el} className="text-slate-200">
                  {ELEMENT_LABELS[el]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={season} onValueChange={(v) => setSeason(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[160px] border-slate-700 bg-slate-800/50 text-slate-200">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              <SelectItem value="all" className="text-slate-200">Todas Seasons</SelectItem>
              {SEASONS.map((s) => (
                <SelectItem key={s} value={s} className="text-slate-200">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={() => navigate('/defenses/new')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Shield className="mr-1 h-4 w-4" />
            Nova Defesa
          </Button>
          <Button
            onClick={() => navigate('/attacks/new')}
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-800"
          >
            <Swords className="mr-1 h-4 w-4" />
            Novo Ataque
          </Button>
          <Button
            onClick={() => navigate('/import')}
            variant="outline"
            className="border-emerald-600 text-emerald-300 hover:bg-emerald-900/30"
          >
            <Upload className="mr-1 h-4 w-4" />
            Importar SWGT
          </Button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">Nenhuma defesa encontrada.</p>
            <p className="text-sm text-slate-500">
              Tente buscar por outros monstros ou cadastre uma nova defesa.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((item) => (
                <DefenseCard
                  key={item.defense.id}
                  defense={item.defense}
                  attackCount={item.attack_count}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  Próxima
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
