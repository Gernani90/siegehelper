import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Shield } from 'lucide-react';
import { client } from '@/lib/client';
import Header from '@/components/Header';
import MonsterSelector from '@/components/MonsterSelector';
import { isAuthenticated } from '@/lib/auth';
import {
  TOWERS,
  TOWER_LABELS,
  DEFENSE_TYPES,
  DEFENSE_TYPE_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  SEASONS,
} from '@/lib/types';
import { toast } from 'sonner';

export default function DefenseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    monster1: '',
    monster2: '',
    monster3: '',
    element1: 'fire',
    element2: 'fire',
    element3: 'fire',
    tower: '4star',
    defense_type: 'bruiser',
    difficulty: 'medium',
    observations: '',
    status: 'active',
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
    if (ready && isEdit) {
      loadDefense();
    }
  }, [ready, id]);

  const loadDefense = async () => {
    setLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/search/defense/${id}`,
        method: 'GET',
        data: {},
      });
      const d = response.data?.defense;
      if (d) {
        setForm({
          name: d.name || '',
          monster1: d.monster1 || '',
          monster2: d.monster2 || '',
          monster3: d.monster3 || '',
          element1: d.element1 || 'fire',
          element2: d.element2 || 'fire',
          element3: d.element3 || 'fire',
          tower: d.tower || '4star',
          defense_type: d.defense_type || 'bruiser',
          difficulty: d.difficulty || 'medium',
          observations: d.observations || '',
          status: d.status || 'active',
          season: d.season || 'Season 25',
        });
      }
    } catch {
      toast.error('Erro ao carregar defesa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monster1 || !form.monster2 || !form.monster3) {
      toast.error('Selecione todos os 3 monstros');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name || `${form.monster1} / ${form.monster2} / ${form.monster3}`,
      };

      if (isEdit) {
        await client.entities.defenses.update({
          id: Number(id),
          data: payload,
        });
        toast.success('Defesa atualizada com sucesso');
      } else {
        await client.entities.defenses.create({ data: payload });
        toast.success('Defesa criada com sucesso');
      }
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar defesa');
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
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Shield className="h-5 w-5 text-indigo-400" />
              {isEdit ? 'Editar Defesa' : 'Nova Defesa'}
            </CardTitle>
            <p className="text-sm text-slate-400">
              Selecione os monstros clicando nas imagens abaixo
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Monster Selection - Visual */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-indigo-300">
                  Composição da Defesa
                </Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Monstro 1 (Líder)</Label>
                    <MonsterSelector
                      value={form.monster1}
                      element={form.element1}
                      onSelect={(name, element) =>
                        setForm((prev) => ({ ...prev, monster1: name, element1: element }))
                      }
                      placeholder="Buscar líder..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Monstro 2</Label>
                    <MonsterSelector
                      value={form.monster2}
                      element={form.element2}
                      onSelect={(name, element) =>
                        setForm((prev) => ({ ...prev, monster2: name, element2: element }))
                      }
                      placeholder="Buscar monstro 2..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Monstro 3</Label>
                    <MonsterSelector
                      value={form.monster3}
                      element={form.element3}
                      onSelect={(name, element) =>
                        setForm((prev) => ({ ...prev, monster3: name, element3: element }))
                      }
                      placeholder="Buscar monstro 3..."
                    />
                  </div>
                </div>
              </div>

              {/* Preview of selected defense */}
              {form.monster1 && form.monster2 && form.monster3 && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3">
                  <p className="text-center text-sm font-medium text-indigo-300">
                    {form.monster1} / {form.monster2} / {form.monster3}
                  </p>
                </div>
              )}

              {/* Tower, Type, Difficulty */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-slate-300">Torre</Label>
                  <Select value={form.tower} onValueChange={(v) => setForm({ ...form, tower: v })}>
                    <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      {TOWERS.map((t) => (
                        <SelectItem key={t} value={t} className="text-slate-200">
                          {TOWER_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Tipo</Label>
                  <Select
                    value={form.defense_type}
                    onValueChange={(v) => setForm({ ...form, defense_type: v })}
                  >
                    <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      {DEFENSE_TYPES.map((dt) => (
                        <SelectItem key={dt} value={dt} className="text-slate-200">
                          {DEFENSE_TYPE_LABELS[dt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Dificuldade</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) => setForm({ ...form, difficulty: v })}
                  >
                    <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d} className="text-slate-200">
                          {DIFFICULTY_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  placeholder="Observações gerais sobre a defesa..."
                  className="border-slate-600 bg-slate-700/50 text-white"
                  rows={3}
                />
              </div>

              {/* Status */}
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="active" className="text-slate-200">Ativa</SelectItem>
                    <SelectItem value="inactive" className="text-slate-200">Inativa</SelectItem>
                  </SelectContent>
                </Select>
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
                {isEdit ? 'Atualizar Defesa' : 'Cadastrar Defesa'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}