import React from 'react';
import { ChestType, RARITY_COLORS, DROP_RATES } from '../types';
import { Box, Lock, Coins, Sparkles } from 'lucide-react';

interface ChestProps {
  chest: ChestType;
  onClick: (chest: ChestType) => void;
  disabled: boolean;
  canAfford: boolean;
}

const Chest: React.FC<ChestProps> = ({ chest, onClick, disabled, canAfford }) => {
  const isLocked = disabled || !canAfford;

  // Format drop rates for display
  const rates = DROP_RATES[chest.rarity];
  const rateDisplay = Object.entries(rates)
    .map(([tier, chance]) => `T${tier}: ${((chance as number) * 100).toFixed(0)}%`)
    .join(' | ');

  return (
    <button
      onClick={() => canAfford && !disabled ? onClick(chest) : undefined}
      disabled={isLocked}
      className={`
        group relative w-full p-3 rounded-xl border-2 transition-all duration-300
        flex flex-row items-center justify-start gap-4 text-left
        ${RARITY_COLORS[chest.rarity]}
        ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg active:scale-95'}
      `}
    >
      <div className={`
        p-3 rounded-full bg-black/20 
        transition-transform duration-500 group-hover:rotate-12 shrink-0
        ${chest.rarity >= 3 && !isLocked ? 'animate-float' : ''}
      `}>
        {isLocked ? <Lock size={24} /> : <Box size={24} />}
      </div>
      
      <div className="flex-grow">
        <h3 className="font-bold text-lg font-cinzel leading-none flex items-center justify-between">
          {chest.name}
          <span className="text-[10px] font-mono opacity-60 bg-black/30 px-1.5 py-0.5 rounded ml-2">XP +{chest.xp}</span>
        </h3>
        <p className="text-[10px] opacity-70 mt-1 leading-tight max-w-[180px]">{chest.description}</p>
        
        <div className="flex items-center gap-1 mt-1 font-bold text-amber-400">
           <Coins size={12} />
           <span className="text-sm">{chest.cost}</span>
        </div>
        
        {/* Drop Rate Indicator */}
        <div className="mt-2 text-[10px] text-white/60 bg-black/20 px-2 py-1 rounded inline-flex items-center gap-1 border border-white/5">
           <Sparkles size={8} />
           {rateDisplay}
        </div>
      </div>

      <div className="absolute top-2 right-2 text-[10px] font-bold opacity-50">
        {"⭐".repeat(chest.rarity)}
      </div>
    </button>
  );
};

export default Chest;