import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Attack,
  ATTACK_TYPE_LABELS,
  SUCCESS_RATE_COLORS,
  SUCCESS_RATE_LABELS,
  RECOMMENDATION_COLORS,
  RECOMMENDATION_LABELS,
} from '@/lib/types';

interface AttackCardProps {
  attack: Attack;
  showDefenseLink?: boolean;
}

export default function AttackCard({ attack, showDefenseLink = false }: AttackCardProps) {
  return (
    <Link to={`/attacks/${attack.id}`}>
      <Card className="border-slate-700/50 bg-slate-800/50 transition-all hover:border-indigo-500/50 hover:bg-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-white">{attack.name}</h3>
            <Badge
              variant="outline"
              className={RECOMMENDATION_COLORS[attack.recommendation] || ''}
            >
              {RECOMMENDATION_LABELS[attack.recommendation] || attack.recommendation}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Monsters */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-500 text-slate-200">
              {attack.monster1}
            </Badge>
            <Badge variant="outline" className="border-slate-500 text-slate-200">
              {attack.monster2}
            </Badge>
            <Badge variant="outline" className="border-slate-500 text-slate-200">
              {attack.monster3}
            </Badge>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {ATTACK_TYPE_LABELS[attack.attack_type] || attack.attack_type}
            </Badge>
            <Badge
              variant="outline"
              className={SUCCESS_RATE_COLORS[attack.success_rate] || ''}
            >
              Taxa: {SUCCESS_RATE_LABELS[attack.success_rate] || attack.success_rate}
            </Badge>
          </div>

          {/* Tips preview */}
          {attack.tips && (
            <p className="line-clamp-2 text-sm text-slate-400">{attack.tips}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}