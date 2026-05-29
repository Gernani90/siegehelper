import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Edit, Trash2, Target, AlertTriangle, Lightbulb, Wrench } from 'lucide-react';
import { client } from '@/lib/client';
import Header from '@/components/Header';
import { isAuthenticated } from '@/lib/auth';
import {
  Attack,
  ATTACK_TYPE_LABELS,
  SUCCESS_RATE_COLORS,
  SUCCESS_RATE_LABELS,
  RECOMMENDATION_COLORS,
  RECOMMENDATION_LABELS,
} from '@/lib/types';
import { toast } from 'sonner';

export default function AttackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [attack, setAttack] = useState<Attack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready && id) {
      loadAttack();
    }
  }, [ready, id]);

  const loadAttack = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/search/attack/${id}`,
        method: 'GET',
        data: {},
      });
      setAttack(response.data);
    } catch (e) {
      console.error('Error loading attack:', e);
      toast.error('Erro ao carregar ataque');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este ataque?')) return;
    try {
      await client.entities.attacks.delete({ id: Number(id) });
      toast.success('Ataque excluído com sucesso');
      navigate(-1);
    } catch (e) {
      toast.error('Erro ao excluir ataque. Você só pode excluir ataques que criou.');
    }
  };

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!attack) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-center text-slate-400">Ataque não encontrado.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-white">{attack.name}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className={RECOMMENDATION_COLORS[attack.recommendation]}>
                    {RECOMMENDATION_LABELS[attack.recommendation]}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {ATTACK_TYPE_LABELS[attack.attack_type] || attack.attack_type}
                  </Badge>
                  <Badge variant="outline" className={SUCCESS_RATE_COLORS[attack.success_rate]}>
                    Taxa: {SUCCESS_RATE_LABELS[attack.success_rate]}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/attacks/${id}/edit`)}
                  className="text-slate-400 hover:text-white"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monsters */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-400">Composição do Ataque</h4>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2">
                  <span className="font-medium text-white">{attack.monster1}</span>
                </div>
                <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2">
                  <span className="font-medium text-white">{attack.monster2}</span>
                </div>
                <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2">
                  <span className="font-medium text-white">{attack.monster3}</span>
                </div>
              </div>
            </div>

            {/* Defense link */}
            <div>
              <h4 className="mb-1 text-sm font-medium text-slate-400">Defesa Alvo</h4>
              <Link
                to={`/defenses/${attack.defense_id}`}
                className="text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Ver defesa →
              </Link>
            </div>

            {/* Focus order */}
            {attack.focus_order && (
              <div className="rounded-lg border border-slate-600/50 bg-slate-700/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-sm font-medium text-slate-300">Ordem de Foco</h4>
                </div>
                <p className="text-slate-200">{attack.focus_order}</p>
              </div>
            )}

            {/* Tips */}
            {attack.tips && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-green-400" />
                  <h4 className="text-sm font-medium text-green-300">Dicas</h4>
                </div>
                <p className="text-slate-200">{attack.tips}</p>
              </div>
            )}

            {/* Risks */}
            {attack.risks && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <h4 className="text-sm font-medium text-red-300">Riscos</h4>
                </div>
                <p className="text-slate-200">{attack.risks}</p>
              </div>
            )}

            {/* Requirements */}
            {attack.requirements && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-yellow-400" />
                  <h4 className="text-sm font-medium text-yellow-300">Requisitos Mínimos</h4>
                </div>
                <p className="text-slate-200">{attack.requirements}</p>
              </div>
            )}

            {/* Observations */}
            {attack.observations && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-slate-400">Observações</h4>
                <p className="text-slate-200">{attack.observations}</p>
              </div>
            )}

            {/* Meta info */}
            <div className="border-t border-slate-700/50 pt-4 text-xs text-slate-500">
              {attack.created_at && (
                <span>Criado em: {new Date(attack.created_at).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}