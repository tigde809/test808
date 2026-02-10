import React from 'react';
import { Dragon, RARITY_COLORS, ELEMENT_COLORS, ElementType } from '../types';
import { 
  Sparkles, Flame, Wind, Mountain, Droplet, Leaf, 
  Hammer, Zap, Circle, Moon, Sun, 
  Crown, Dna, Cross, Hourglass, Skull,
  Sword
} from 'lucide-react';

interface DragonCardProps {
  poem: Dragon; // Keeping prop name 'poem' for easier App.tsx compatibility, but it treats it as Dragon
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const ElementIcon: React.FC<{ type: ElementType, size?: number }> = ({ type, size = 18 }) => {
  switch (type) {
    case 'Огонь': return <Flame size={size} />;
    case 'Ветер': return <Wind size={size} />;
    case 'Земля': return <Mountain size={size} />;
    case 'Вода': return <Droplet size={size} />;
    case 'Зелень': return <Leaf size={size} />;
    case 'Металл': return <Hammer size={size} />;
    case 'Энергия': return <Zap size={size} />;
    case 'Пустота': return <Circle size={size} className="animate-pulse" />;
    case 'Тень': return <Moon size={size} />;
    case 'Свет': return <Sun size={size} />;
    case 'Легендарный': return <Crown size={size} />;
    case 'Первородный': return <Dna size={size} />;
    case 'Божественный': return <Cross size={size} />;
    case 'Древний': return <Hourglass size={size} />;
    case 'Тиран': return <Skull size={size} />;
    default: return <Sparkles size={size} />;
  }
};

const DragonCard: React.FC<DragonCardProps> = ({ poem: dragon, isSelected, onClick, disabled }) => {
  const rarityClass = RARITY_COLORS[dragon.rarity];
  const elementClass = ELEMENT_COLORS[dragon.element];
  const stars = "⭐".repeat(dragon.rarity);

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
        flex flex-col h-full min-h-[220px]
        ${rarityClass}
        ${isSelected ? 'scale-105 ring-4 ring-offset-2 ring-purple-500 ring-offset-slate-900 z-10 shadow-2xl' : 'hover:scale-102 hover:brightness-110'}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
      `}
    >
      {/* Background Gradient based on Element */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full opacity-20 -mr-10 -mt-10 pointer-events-none`} />

      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2 z-10">
        <div className="flex flex-col">
           <h3 className="font-bold text-lg leading-tight font-cinzel">{dragon.name}</h3>
           <span className="text-[10px] tracking-widest opacity-80 mt-1">{stars}</span>
        </div>
        <div className={`p-1.5 rounded-lg border ${elementClass} flex items-center justify-center shadow-md`} title={dragon.element}>
          <ElementIcon type={dragon.element} size={20} />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-grow flex items-center justify-center my-2 z-10">
        <p className="whitespace-pre-wrap text-center italic font-serif text-sm md:text-md opacity-90 leading-relaxed drop-shadow-sm">
          {dragon.content}
        </p>
      </div>

      {/* Footer / Tags */}
      <div className="mt-3 pt-2 border-t border-white/10 z-10">
        <div className="flex flex-wrap gap-1 justify-center">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border border-white/10 ${elementClass}`}>
            {dragon.element}
          </span>
          {dragon.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-[10px] uppercase tracking-wider bg-black/40 px-2 py-1 rounded-full text-white/70">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-2 left-2 text-purple-400 animate-pulse">
          <Sparkles size={16} />
        </div>
      )}
    </div>
  );
};

export default DragonCard;