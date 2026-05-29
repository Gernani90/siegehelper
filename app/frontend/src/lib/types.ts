export interface Defense {
  id: number;
  user_id: string;
  name: string;
  monster1: string;
  monster2: string;
  monster3: string;
  element1: string;
  element2: string;
  element3: string;
  tower: string;
  defense_type: string;
  difficulty: string;
  observations?: string;
  status: string;
  season?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attack {
  id: number;
  user_id: string;
  defense_id: number;
  name: string;
  monster1: string;
  monster2: string;
  monster3: string;
  attack_type: string;
  success_rate: string;
  recommendation: string;
  focus_order?: string;
  tips?: string;
  risks?: string;
  requirements?: string;
  observations?: string;
  season?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DefenseWithAttacks {
  defense: Defense;
  attacks: Attack[];
  attack_count: number;
}

export interface SearchResponse {
  results: DefenseWithAttacks[];
  total: number;
}

export const ELEMENTS = ['fire', 'water', 'wind', 'light', 'dark'] as const;
export const TOWERS = ['4star', '5star'] as const;
export const DEFENSE_TYPES = ['bruiser', 'cleave', 'sustain', 'control', 'speed_contest'] as const;
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const ATTACK_TYPES = ['safe', 'bruiser', 'cleave', 'tank', 'counter', 'speed_contest'] as const;
export const SUCCESS_RATES = ['low', 'medium', 'high'] as const;
export const RECOMMENDATIONS = ['recommended', 'situational', 'not_recommended'] as const;

export const SEASONS = [
  'Season 25', 'Season 24', 'Season 23', 'Season 22', 'Season 21',
  'Season 20', 'Season 19', 'Season 18', 'Season 17', 'Season 16',
  'Season 15', 'Season 14', 'Season 13', 'Season 12', 'Season 11',
  'Season 10', 'Season 9', 'Season 8', 'Season 7', 'Season 6',
  'Season 5', 'Season 4', 'Season 3', 'Season 2', 'Season 1',
] as const;

export const ELEMENT_COLORS: Record<string, string> = {
  fire: 'bg-red-500/20 text-red-400 border-red-500/30',
  water: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  wind: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  light: 'bg-amber-200/20 text-amber-200 border-amber-200/30',
  dark: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const SUCCESS_RATE_COLORS: Record<string, string> = {
  low: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export const RECOMMENDATION_COLORS: Record<string, string> = {
  recommended: 'bg-green-500/20 text-green-400 border-green-500/30',
  situational: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  not_recommended: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const ELEMENT_LABELS: Record<string, string> = {
  fire: 'Fogo',
  water: 'Água',
  wind: 'Vento',
  light: 'Luz',
  dark: 'Trevas',
};

export const TOWER_LABELS: Record<string, string> = {
  '4star': '4★',
  '5star': '5★',
};

export const DEFENSE_TYPE_LABELS: Record<string, string> = {
  bruiser: 'Bruiser',
  cleave: 'Cleave',
  sustain: 'Sustain',
  control: 'Controle',
  speed_contest: 'Speed Contest',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

export const ATTACK_TYPE_LABELS: Record<string, string> = {
  safe: 'Safe',
  bruiser: 'Bruiser',
  cleave: 'Cleave',
  tank: 'Tank',
  counter: 'Counter',
  speed_contest: 'Speed Contest',
};

export const SUCCESS_RATE_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const RECOMMENDATION_LABELS: Record<string, string> = {
  recommended: 'Recomendado',
  situational: 'Situacional',
  not_recommended: 'Não Recomendado',
};