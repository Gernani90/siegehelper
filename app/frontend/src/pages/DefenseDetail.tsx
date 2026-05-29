import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react';
import { client } from '@/lib/client';
import Header from '@/components/Header';
import AttackCard from '@/components/AttackCard';
import { isAuthenticated } from '@/lib/auth';
import {
  DefenseWithAttacks,
  ELEMENT_COLORS,
  ELEMENT_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DEFENSE_TYPE_LABELS,
  TOWER_LABELS,
} from '@/lib/types';
import { toast } from 'sonner';

export default function DefenseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<DefenseWithAttacks | null>(null);
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
      loadDefense();
    }
  }, [ready, id]);

  const loadDefense = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/search/defense/${id}`,
        method: 'GET',
        data: {},
      });
      setData(response.data);
    } catch (e) {
      console.error('Error loading defense:', e);
      toast.error('Erro ao carregar defesa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta defesa?')) return;
    try {
      await client.entities.defenses.delete({ id: Number(id) });
      toast.success('Defesa excluída com sucesso');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Erro ao excluir defesa. Você só pode excluir defesas que criou.');
    }
  };

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-center text-slate-400">Defesa não encontrada.</p>
        </main>
      </div>
    );
  }

  const { defense, attacks } = data;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        {/* Defense info */}
        <Card className="mb-6 border-slate-700/50 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-white">{defense.name}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-indigo-500/50 text-indigo-300">
                    {TOWER_LABELS[defense.tower]}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {DEFENSE_TYPE_LABELS[defense.defense_type] || defense.defense_type}
                  </Badge>
                  <Badge variant="outline" className={DIFFICULTY_COLORS[defense.difficulty]}>
                    {DIFFICULTY_LABELS[defense.difficulty]}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/defenses/${id}/edit`)}
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
          <CardContent className="space-y-4">
            {/* Monsters */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-400">Composição</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: defense.monster1, element: defense.element1 },
                  { name: defense.monster2, element: defense.element2 },
                  { name: defense.monster3, element: defense.element3 },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-slate-600/50 bg-slate-700/30 px-3 py-2"
                  >
                    <Badge variant="outline" className={`text-xs ${ELEMENT_COLORS[m.element]}`}>
                      {ELEMENT_LABELS[m.element]}
                    </Badge>
                    <span className="font-medium text-white">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Observations */}
            {defense.observations && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-slate-400">Observações</h4>
                <p className="text-slate-200">{defense.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attacks */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Ataques ({attacks.length})
            </h2>
            <Link to={`/attacks/new?defense_id=${defense.id}`}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                + Novo Ataque
              </Button>
            </Link>
          </div>

          {attacks.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              Nenhum ataque cadastrado para esta defesa.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {attacks.map((attack) => (
                <AttackCard key={attack.id} attack={attack} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}