import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Loader2 } from 'lucide-react';
import { getAPIBaseURL } from '@/lib/config';

interface Monster {
  id: number;
  name: string;
  image_filename: string;
  element: string;
  natural_stars: number;
  awaken_level: number;
}

interface MonsterSelectorProps {
  value: string;
  element: string;
  onSelect: (name: string, element: string) => void;
  placeholder?: string;
}

const SWARFARM_IMG_BASE = 'https://swarfarm.com/static/herders/images/monsters/';

const ELEMENT_MAP: Record<string, string> = {
  Fire: 'fire',
  Water: 'water',
  Wind: 'wind',
  Light: 'light',
  Dark: 'dark',
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'border-red-500/60 bg-red-500/10',
  Water: 'border-blue-500/60 bg-blue-500/10',
  Wind: 'border-yellow-500/60 bg-yellow-500/10',
  Light: 'border-amber-300/60 bg-amber-300/10',
  Dark: 'border-purple-500/60 bg-purple-500/10',
};

const ELEMENT_RING: Record<string, string> = {
  Fire: 'ring-red-500/50',
  Water: 'ring-blue-500/50',
  Wind: 'ring-yellow-500/50',
  Light: 'ring-amber-300/50',
  Dark: 'ring-purple-500/50',
};

export default function MonsterSelector({ value, element, onSelect, placeholder }: MonsterSelectorProps) {
  const [search, setSearch] = useState('');
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search monsters via backend proxy (avoids CORS issues)
  useEffect(() => {
    if (!search || search.length < 2) {
      setMonsters([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          name: search,
          page_size: '50',
        });
        const response = await fetch(`${getAPIBaseURL()}/api/v1/monsters/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Monster search failed');
        }
        const data = await response.json();
        setMonsters(data?.results || []);
      } catch {
        setMonsters([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const handleSelect = (monster: Monster) => {
    setSelectedMonster(monster);
    setSearch('');
    setOpen(false);
    onSelect(monster.name, ELEMENT_MAP[monster.element] || 'fire');
  };

  const handleClear = () => {
    setSelectedMonster(null);
    setSearch('');
    onSelect('', 'fire');
  };

  // If value is set externally but no selectedMonster, show value as text
  const displayName = selectedMonster?.name || value;
  const displayElement = selectedMonster?.element || (element ? element.charAt(0).toUpperCase() + element.slice(1) : 'Fire');
  const displayImage = selectedMonster?.image_filename
    ? `${SWARFARM_IMG_BASE}${selectedMonster.image_filename}`
    : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Selected monster display */}
      {displayName && !open ? (
        <div
          className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2 transition-all hover:brightness-110 ${ELEMENT_COLORS[displayElement] || 'border-slate-600 bg-slate-700/50'}`}
          onClick={() => setOpen(true)}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              className={`h-12 w-12 rounded-md object-cover ring-2 ${ELEMENT_RING[displayElement] || ''}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-600 text-xs text-slate-400">
              ?
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-slate-400">{displayElement}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-600 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || 'Buscar monstro...'}
            className="border-slate-600 bg-slate-700/50 pl-9 text-white placeholder:text-slate-500"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-400" />
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && monsters.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          <div className="grid grid-cols-3 gap-1 p-2 sm:grid-cols-4">
            {monsters.map((monster) => (
              <button
                key={monster.id}
                type="button"
                onClick={() => handleSelect(monster)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all hover:scale-105 hover:brightness-125 ${ELEMENT_COLORS[monster.element] || 'border-slate-600'}`}
              >
                <img
                  src={`${SWARFARM_IMG_BASE}${monster.image_filename}`}
                  alt={monster.name}
                  className={`h-10 w-10 rounded-md object-cover ring-1 ${ELEMENT_RING[monster.element] || ''}`}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0.3';
                  }}
                />
                <span className="w-full truncate text-center text-[10px] font-medium text-slate-200">
                  {monster.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {open && search.length >= 2 && !loading && monsters.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-4 text-center text-sm text-slate-400">
          Nenhum monstro encontrado
        </div>
      )}

      {/* Hint */}
      {open && search.length < 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-4 text-center text-sm text-slate-400">
          Digite pelo menos 2 letras para buscar
        </div>
      )}
    </div>
  );
}
