import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAPIBaseURL } from '@/lib/config';
import {
  Defense,
  ELEMENT_COLORS,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DEFENSE_TYPE_LABELS,
  TOWER_LABELS,
} from '@/lib/types';

interface DefenseCardProps {
  defense: Defense;
  attackCount?: number;
}

interface MonsterPortrait {
  name: string;
  element: string;
  imageUrl: string | null;
}

const SWARFARM_IMG_BASE = 'https://swarfarm.com/static/herders/images/monsters/';
const portraitCache = new Map<string, MonsterPortrait | null>();

function useMonsterPortrait(name: string, fallbackElement: string) {
  const [portrait, setPortrait] = useState<MonsterPortrait | null>(() => {
    return portraitCache.get(name.toLowerCase()) ?? null;
  });

  useEffect(() => {
    const key = name.toLowerCase();
    if (portraitCache.has(key)) {
      setPortrait(portraitCache.get(key) ?? null);
      return;
    }

    let cancelled = false;
    async function loadPortrait() {
      try {
        const params = new URLSearchParams({ name, page_size: '10' });
        const response = await fetch(`${getAPIBaseURL()}/api/v1/monsters/search?${params.toString()}`);
        if (!response.ok) throw new Error('Monster image lookup failed');
        const data = await response.json();
        const results = data?.results || [];
        const match = results.find((item: any) => item.name?.toLowerCase() === key) || results[0];
        const nextPortrait = match
          ? {
              name: match.name,
              element: String(match.element || fallbackElement),
              imageUrl: match.image_filename ? `${SWARFARM_IMG_BASE}${match.image_filename}` : null,
            }
          : null;
        portraitCache.set(key, nextPortrait);
        if (!cancelled) setPortrait(nextPortrait);
      } catch {
        portraitCache.set(key, null);
        if (!cancelled) setPortrait(null);
      }
    }

    loadPortrait();
    return () => {
      cancelled = true;
    };
  }, [fallbackElement, name]);

  return portrait;
}

function MonsterTile({ name, element }: { name: string; element: string }) {
  const portrait = useMonsterPortrait(name, element);
  const displayElement = portrait?.element?.toLowerCase() || element;

  return (
    <div className="min-w-0 rounded-md border border-slate-700 bg-slate-900/60 p-2">
      <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-md bg-slate-700 ring-1 ring-slate-600">
        {portrait?.imageUrl ? (
          <img
            src={portrait.imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
            {name.slice(0, 1)}
          </div>
        )}
      </div>
      <p className="truncate text-center text-xs font-medium text-slate-100" title={name}>
        {name}
      </p>
      <div className="mt-1 flex justify-center">
        <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${ELEMENT_COLORS[displayElement] || 'border-slate-600 text-slate-400'}`}>
          {displayElement}
        </Badge>
      </div>
    </div>
  );
}

export default function DefenseCard({ defense, attackCount }: DefenseCardProps) {
  return (
    <Link to={`/defenses/${defense.id}`} className="block h-full">
      <Card className="h-full border-slate-700/50 bg-slate-800/50 transition-all hover:border-indigo-500/50 hover:bg-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white">{defense.name}</h3>
            <Badge variant="outline" className="shrink-0 border-indigo-500/50 text-indigo-300">
              {TOWER_LABELS[defense.tower] || defense.tower}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: defense.monster1, element: defense.element1 },
              { name: defense.monster2, element: defense.element2 },
              { name: defense.monster3, element: defense.element3 },
            ].map((m, i) => (
              <MonsterTile key={`${m.name}-${i}`} name={m.name} element={m.element} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {DEFENSE_TYPE_LABELS[defense.defense_type] || defense.defense_type}
            </Badge>
            <Badge
              variant="outline"
              className={DIFFICULTY_COLORS[defense.difficulty] || ''}
            >
              {DIFFICULTY_LABELS[defense.difficulty] || defense.difficulty}
            </Badge>
            {defense.season && (
              <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">
                {defense.season}
              </Badge>
            )}
            {attackCount !== undefined && (
              <span className="text-xs text-slate-400">
                {attackCount} ataque{attackCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
