import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { client } from '@/lib/client';
import Header from '@/components/Header';
import { isAuthenticated } from '@/lib/auth';
import {
  Defense,
  ATTACK_TYPES,
  ATTACK_TYPE_LABELS,
  SUCCESS_RATES,
  SUCCESS_RATE_LABELS,
  RECOMMENDATIONS,
  RECOMMENDATION_LABELS,
  SEASONS,
} from '@/lib/types';
import { toast } from 'sonner';

export default function AttackForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defenses, setDefenses] = useState<Defense[]>([]);

  const [form, setForm] = useState({
    defense_id: searchParams.get('defense_id') || '',
    name: '',
    monster1: '',
    monster2: '',
    monster3: '',
    attack_type: 'safe',
    success_rate: 'medium',
    recommendation: 'recommended',
    focus_order: '',
    tips: '',
    risks: '',
    requirements: '',
    observations: '',
    season: 'Season 25',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) {
      loadDefenses();
      if (isEdit) loadAttack();
    }
  }, [ready, id]);

  const loadDefenses = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/search/defenses',
        method: 'GET',
        data: { limit: '100' },
      });
      const items = response.data?.results?.map((r: any) => r.defense) || [];
      setDefenses(items);
    } catch (e) {
      console.error('Error loading defenses:', e);
    }
  };

  const loadAttack = async () => {
    setLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/search/attack/${id}`,
        method: 'GET',
        data: {},
      });
      const a = response.data;
      if (a) {
        setForm({
          defense_id: String(a.defense_id) || '',
          name: a.name || '',
          monster1: a.monster1 || '',
          monster2: a.monster2 || '',
          monster3: a.monster3 || '',
          attack_type: a.attack_type || 'safe',
          success_rate: a.success_rate || 'medium',
          recommendation: a.recommendation || 'recommended',
          focus_order: a.focus_order || '',
          tips: a.tips || '',
          risks: a.risks || '',
          requirements: a.requirements || '',
          observations: a.observations || '',
          season: a.season || 'Season 25',
        });
      }
    } catch (e) {
      toast.error('Erro ao carregar ataque');
    } finally {
      setLoading(false);
    }
  };

  const updateName = () => {
    if (form.monster1 && form.monster2 && form.monster3) {
      setForm((prev) => ({
        ...prev,
        name: `${prev.monster1} / ${prev.monster2} / ${prev.monster3}`,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.defense_id) {
      toast.error('Selecione uma defesa');
      return;
    }
    if (!form.monster1 || !form.monster2 || !form.monster3) {
      toast.error('Preencha todos os monstros');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        defense_id: Number(form.defense_id),
        name: form.name || `${form.monster1} / ${form.monster2} / ${form.monster3}`,
      };

      if (isEdit) {
        await client.entities.attacks.update({
          id: Number(id),
          data: payload,
        });
        toast.success('Ataque atualizado com sucesso');
      } else {
        await client.entities.attacks.create({ data: payload });
        toast.success('Ataque criado com sucesso');
      }
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar ataque');
    } finally {
      setSaving(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-6">
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
            <CardTitle className="text-xl text-white">
              {isEdit ? 'Editar Ataque' : 'Novo Ataque'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Defense selection */}
              <div>
                <Label className="text-slate-300">Defesa Alvo</Label>
                <Select
                  value={form.defense_id}
                  onValueChange={(v) => setForm({ ...form, defense_id: v })}
                >
                  <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                    <SelectValue placeholder="Selecione uma defesa" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {defenses.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)} className="text-slate-200">
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div>
                <Label className="text-slate-300">Nome do Ataque</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Tractor / Lulu / Windy"
                  className="border-slate-600 bg-slate-700/50 text-white"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Deixe vazio para gerar automaticamente
                </p>
              </div>

              {/* Monsters */}
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((num) => (
                  <div key={num}>
                    <Label className="text-slate-300">Monstro {num}</Label>
                    <Input
                      value={form[`monster${num}` as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [`monster${num}`]: e.target.value })}
                      onBlur={updateName}
                      placeholder={`Monstro ${num}`}
                      className="border-slate-600 bg-slate-700/50 text-white"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Type, Success Rate, Recommendation */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-slate-300">Tipo</Label>
                  <Select
                    value={form.attack_type}
                    onValueChange={(v) => setForm({ ...form, attack_type: v })}
                  >
                    <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      {ATTACK_TYPES.map((at) => (
                        <SelectItem key={at} value={at} className="text-slate-200">
                          {ATTACK_TYPE_LABELS[at]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Taxa de Sucesso</Label>
                  <Select
                    value={form.success_rate}
                    onValueChange={(v) => setForm({ ...form, success_rate: v })}
                  >
                    <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      {SUCCESS_RATES.map((sr) => (
                        <SelectItem key={sr} value={sr} className="text-slate-200">
                          {SUCCESS_RATE_LABELS[sr]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Recomendação</Label>
                  <Select
                    value={form.recommendation}
                    onValueChange={(v) => setForm({ ...form, recommendation: v })}
                  >
                    <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      {RECOMMENDATIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-slate-200">
                          {RECOMMENDATION_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Focus order */}
              <div>
                <Label className="text-slate-300">Ordem de Foco</Label>
                <Textarea
                  value={form.focus_order}
                  onChange={(e) => setForm({ ...form, focus_order: e.target.value })}
                  placeholder="Ex: Matar Savannah primeiro, depois Clara, depois Triana."
                  className="border-slate-600 bg-slate-700/50 text-white"
                  rows={2}
                />
              </div>

              {/* Tips */}
              <div>
                <Label className="text-slate-300">Dicas</Label>
                <Textarea
                  value={form.tips}
                  onChange={(e) => setForm({ ...form, tips: e.target.value })}
                  placeholder="Dicas para executar o ataque..."
                  className="border-slate-600 bg-slate-700/50 text-white"
                  rows={2}
                />
              </div>

              {/* Risks */}
              <div>
                <Label className="text-slate-300">Riscos</Label>
                <Textarea
                  value={form.risks}
                  onChange={(e) => setForm({ ...form, risks: e.target.value })}
                  placeholder="Riscos e situações perigosas..."
                  className="border-slate-600 bg-slate-700/50 text-white"
                  rows={2}
                />
              </div>

              {/* Requirements */}
              <div>
                <Label className="text-slate-300">Requisitos Mínimos</Label>
                <Textarea
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Velocidade, runas, artefatos necessários..."
                  className="border-slate-600 bg-slate-700/50 text-white"
                  rows={2}
                />
              </div>

              {/* Season */}
              <div>
                <Label className="text-slate-300">Season</Label>
                <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v })}>
                  <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                    <SelectValue placeholder="Selecione a season" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {SEASONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-slate-200">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observations */}
              <div>
                <Label className="text-slate-300">Observações</Label>
                <Textarea
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder="Observações extras..."
                  className="border-slate-600 bg-slate-700/50 text-white"
                  rows={2}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEdit ? 'Atualizar Ataque' : 'Cadastrar Ataque'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}