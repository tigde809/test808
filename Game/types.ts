export type Rarity = 1 | 2 | 3 | 4;

export type ElementType = 
  | 'Огонь' | 'Ветер' | 'Земля' | 'Вода' | 'Зелень'
  | 'Металл' | 'Энергия' | 'Пустота' | 'Тень' | 'Свет'
  | 'Легендарный' | 'Первородный' | 'Божественный' | 'Древний' | 'Тиран';

export interface Dragon {
  id: string;
  name: string;
  element: ElementType;
  content: string; // Description/Lore/Poem
  tags: string[];
  rarity: Rarity;
  isNew?: boolean;
}

export interface ChestType {
  id: string;
  name: string;
  rarity: Rarity;
  color: string;
  iconColor: string;
  description: string;
  cost: number;
  xp: number; // Experience given
}

export const RARITY_NAMES: Record<Rarity, string> = {
  1: 'Деревянный',
  2: 'Железный',
  3: 'Серебряный',
  4: 'Золотой'
};

export const RARITY_COLORS: Record<Rarity, string> = {
  1: 'border-amber-800 bg-amber-950/40 text-amber-200',
  2: 'border-slate-500 bg-slate-800/60 text-slate-200',
  3: 'border-cyan-300 bg-cyan-950/50 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
  4: 'border-yellow-400 bg-yellow-950/50 text-yellow-100 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
};

export const ELEMENT_COLORS: Record<ElementType, string> = {
  'Огонь': 'text-red-500 bg-red-950/50 border-red-500',
  'Ветер': 'text-sky-300 bg-sky-950/50 border-sky-300',
  'Земля': 'text-amber-700 bg-amber-950/50 border-amber-700',
  'Вода': 'text-blue-500 bg-blue-950/50 border-blue-500',
  'Зелень': 'text-green-500 bg-green-950/50 border-green-500',
  'Металл': 'text-slate-400 bg-slate-700/50 border-slate-400',
  'Энергия': 'text-yellow-400 bg-yellow-900/50 border-yellow-400',
  'Пустота': 'text-fuchsia-800 bg-fuchsia-950/50 border-fuchsia-800',
  'Тень': 'text-gray-400 bg-gray-900/80 border-gray-600',
  'Свет': 'text-yellow-100 bg-yellow-500/20 border-yellow-200',
  'Легендарный': 'text-purple-400 bg-purple-900/50 border-purple-400',
  'Первородный': 'text-teal-400 bg-teal-900/50 border-teal-400',
  'Божественный': 'text-amber-300 bg-amber-800/50 border-amber-300',
  'Древний': 'text-rose-400 bg-rose-900/50 border-rose-400',
  'Тиран': 'text-red-800 bg-black/80 border-red-900',
};

// Purely visual background colors for the animation reveal phase
export const ELEMENT_BG_COLORS: Record<ElementType, string> = {
  'Огонь': 'bg-red-600',
  'Ветер': 'bg-sky-400',
  'Земля': 'bg-amber-700',
  'Вода': 'bg-blue-600',
  'Зелень': 'bg-green-600',
  'Металл': 'bg-slate-500',
  'Энергия': 'bg-yellow-500',
  'Пустота': 'bg-fuchsia-700',
  'Тень': 'bg-gray-800',
  'Свет': 'bg-yellow-200',
  'Легендарный': 'bg-purple-600',
  'Первородный': 'bg-teal-500',
  'Божественный': 'bg-amber-300',
  'Древний': 'bg-rose-500',
  'Тиран': 'bg-red-900',
};

export const SELL_VALUES: Record<Rarity, number> = {
  1: 15,
  2: 60,
  3: 200,
  4: 1000
};

export const SCORE_VALUES: Record<Rarity, number> = {
  1: 10,
  2: 50,
  3: 250,
  4: 1500
};

export const CHEST_XP: Record<Rarity, number> = {
  1: 25,
  2: 100,
  3: 350,
  4: 1000
};

// Drop Rates (Probability of Element Tier)
export const DROP_RATES: Record<Rarity, Record<number, number>> = {
  1: { 1: 0.90, 2: 0.10 },           // Wood: 90% Tier 1, 10% Tier 2
  2: { 1: 0.30, 2: 0.60, 3: 0.10 },  // Iron: 30% T1, 60% T2, 10% T3
  3: { 2: 0.30, 3: 0.60, 4: 0.10 },  // Silver: 30% T2, 60% T3, 10% T4
  4: { 3: 0.20, 4: 0.80 }            // Gold: 20% T3, 80% T4
};

export const TIER_1_ELEMENTS: ElementType[] = ['Огонь', 'Ветер', 'Земля', 'Вода', 'Зелень'];
export const TIER_2_ELEMENTS: ElementType[] = ['Металл', 'Энергия', 'Тень'];
export const TIER_3_ELEMENTS: ElementType[] = ['Пустота', 'Свет', 'Древний'];
export const TIER_4_ELEMENTS: ElementType[] = ['Легендарный', 'Первородный', 'Божественный', 'Тиран'];

export const ELEMENT_TIERS: Record<ElementType, number> = {
  'Огонь': 1, 'Ветер': 1, 'Земля': 1, 'Вода': 1, 'Зелень': 1,
  'Металл': 2, 'Энергия': 2, 'Тень': 2,
  'Пустота': 3, 'Свет': 3, 'Древний': 3,
  'Легендарный': 4, 'Первородный': 4, 'Божественный': 4, 'Тиран': 4
};

export const getDragonValue = (dragon: Dragon): number => {
  const baseRarityValue = SELL_VALUES[dragon.rarity] || 0;
  const elementTier = ELEMENT_TIERS[dragon.element] || 1;
  // Base 100 + 50 per tier level above 1? No, "minimum for element is 100".
  // So Tier 1 = 100. Tier 2 = 150.
  const elementValue = 100 + (elementTier - 1) * 50;
  return baseRarityValue + elementValue;
};