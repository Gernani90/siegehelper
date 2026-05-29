import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import { isAuthenticated } from '@/lib/auth';
import {
  SEASONS,
  TOWERS,
  TOWER_LABELS,
  DEFENSE_TYPES,
  DEFENSE_TYPE_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
} from '@/lib/types';
import { toast } from 'sonner';
import { getAPIBaseURL } from '@/lib/config';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function SwgtImport() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [rawText, setRawText] = useState('');
  const [season, setSeason] = useState('Season 25');
  const [tower, setTower] = useState('4star');
  const [difficulty, setDifficulty] = useState('medium');
  const [defenseType, setDefenseType] = useState('bruiser');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
    } else {
      setReady(true);
    }
  }, []);

  const handleImport = async () => {
    if (!rawText.trim()) {
      toast.error('Cole os dados da tabela SWGT');
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const response = await fetch(`${getAPIBaseURL()}/api/v1/import/swgt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          season,
          tower,
          difficulty,
          defense_type: defenseType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Erro na importação');
      }

      setResult(data);
      if (data.imported > 0) {
        toast.success(`${data.imported} defesas importadas com sucesso!`);
      }
      if (data.skipped > 0) {
        toast.warning(`${data.skipped} defesas não puderam ser importadas`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro na importação');
    } finally {
      setImporting(false);
    }
  };

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

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para Home
        </Button>

        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Upload className="h-5 w-5 text-emerald-400" />
              Importar Defesas do SWGT
            </CardTitle>
            <p className="text-sm text-slate-400">
              Cole os dados da tabela de defesas do SWGT abaixo, ou uma lista simples de nomes. O sistema aceita dados separados por tab, vírgula, pipe (|) ou barra (/).
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Instructions */}
            <div className="rounded-lg border border-slate-600/50 bg-slate-900/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-indigo-300">Como importar:</h3>
              <ol className="space-y-1 text-xs text-slate-400">
                <li>1. Acesse o SWGT e abra a página de defesas do siege</li>
                <li>2. Selecione e copie a tabela de defesas (Ctrl+A na tabela, depois Ctrl+C)</li>
                <li>3. Cole aqui abaixo (Ctrl+V)</li>
                <li>4. Selecione a season, torre e configurações padrão</li>
                <li>5. Clique em &quot;Importar&quot;</li>
              </ol>
              <p className="mt-2 text-xs text-amber-400">
                ⚠️ Os elementos dos monstros serão definidos como padrão. Edite individualmente depois se necessário.
              </p>
            </div>

            {/* Season & default settings */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-slate-300">Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-200">
                    <SelectValue />
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
              <div>
                <Label className="text-slate-300">Torre Padrão</Label>
                <Select value={tower} onValueChange={setTower}>
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
                <Label className="text-slate-300">Dificuldade Padrão</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
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
              <div>
                <Label className="text-slate-300">Tipo Padrão</Label>
                <Select value={defenseType} onValueChange={setDefenseType}>
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
            </div>

            {/* Paste area */}
            <div>
              <Label className="text-slate-300">Dados da Tabela SWGT</Label>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Cole os dados aqui. Formatos aceitos:\n\nTab-separado:\nMonstro1\tMonstro2\tMonstro3\n\nLista por vírgula:\nMonstro1, Monstro2, Monstro3, Monstro4, Monstro5, Monstro6\n\nBarra:\nMonstro1 / Monstro2 / Monstro3`}
                className="min-h-[200px] border-slate-600 bg-slate-700/50 font-mono text-sm text-white"
                rows={10}
              />
              <p className="mt-1 text-xs text-slate-500">
                {rawText.trim().split('\n').filter((l) => l.trim()).length} linhas detectadas
              </p>
            </div>

            {/* Import button */}
            <Button
              onClick={handleImport}
              disabled={importing || !rawText.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Importar Defesas
            </Button>

            {/* Result */}
            {result && (
              <div className="rounded-lg border border-slate-600/50 bg-slate-900/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Resultado da Importação</h3>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300">{result.imported} importadas</span>
                  </div>
                  {result.skipped > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-amber-300">{result.skipped} ignoradas</span>
                    </div>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-400">• {err}</p>
                    ))}
                  </div>
                )}
                {result.imported > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 border-slate-600 text-slate-200 hover:bg-slate-800"
                  >
                    Ver na Home
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
