import React, { useState, useEffect } from 'react';
import { Trophy, User, Medal, X, Crown, Flame, Shield, Swords, Globe } from 'lucide-react';
import { authService } from '../services/storageService';

interface LeaderboardProps {
  currentUser: string | null;
  refreshTrigger: number; // Prop to force refresh when user performs actions
}

interface Player {
  name: string;
  score: number;
  xp: number;
  isUser?: boolean;
  bestDragon?: string;
  favElement?: string;
  avatarColor: string;
}

// Helper to generate a consistent color from a name
const stringToColor = (str: string) => {
  const colors = [
    "bg-red-600", "bg-orange-600", "bg-amber-600", "bg-yellow-600", 
    "bg-lime-600", "bg-green-600", "bg-emerald-600", "bg-teal-600", 
    "bg-cyan-600", "bg-sky-600", "bg-blue-600", "bg-indigo-600", 
    "bg-violet-600", "bg-purple-600", "bg-fuchsia-600", "bg-pink-600", "bg-rose-600"
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, refreshTrigger }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Fetch real data
    const data = authService.getLeaderboard();
    
    const formattedPlayers: Player[] = data.map(userData => {
      // Calculate a "Score" based on inventory value roughly
      const score = userData.inventory.reduce((acc: number, item: any) => {
         // rough estimation if logic isn't imported
         const rarityVal = [0, 10, 50, 250, 1500][item.rarity] || 10;
         return acc + rarityVal;
      }, 0);

      // Find best dragon (highest rarity)
      const best = userData.inventory.length > 0 
        ? userData.inventory.reduce((prev: any, current: any) => (prev.rarity > current.rarity) ? prev : current) 
        : null;

      // Find fav element
      const elementCounts: Record<string, number> = {};
      userData.inventory.forEach((d: any) => {
        elementCounts[d.element] = (elementCounts[d.element] || 0) + 1;
      });
      const favElement = Object.keys(elementCounts).reduce((a, b) => elementCounts[a] > elementCounts[b] ? a : b, "Нет");

      return {
        name: userData.username,
        score: score,
        xp: userData.xp,
        isUser: userData.username === currentUser,
        bestDragon: best ? best.name : "Нет",
        favElement: favElement,
        avatarColor: stringToColor(userData.username)
      };
    });

    setPlayers(formattedPlayers);
  }, [refreshTrigger, currentUser]);

  return (
    <>
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 w-full max-w-sm">
        <h3 className="text-xl font-cinzel text-yellow-400 flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
          <Globe size={20} /> Рейтинг Миров
        </h3>
        <ul className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {players.length === 0 && <li className="text-slate-500 text-center italic">Мир пуст...</li>}
          {players.map((player, idx) => (
            <li 
              key={idx} 
              onClick={() => setSelectedPlayer(player)}
              className={`
                flex justify-between items-center p-2 rounded-lg text-sm cursor-pointer
                ${player.isUser 
                  ? 'bg-indigo-900/50 border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                  : 'bg-slate-800/50 hover:bg-slate-700 hover:scale-105 transition-all'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`
                  font-bold w-6 text-center
                  ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}
                `}>
                  {idx + 1}
                </span>
                
                {/* Avatar Mini */}
                <div className={`w-8 h-8 rounded-full ${player.avatarColor} flex items-center justify-center font-bold text-xs border border-white/20 uppercase`}>
                  {player.name.charAt(0)}
                </div>

                <div className="flex flex-col">
                  <span className={`font-cinzel truncate max-w-[100px] ${player.isUser ? 'text-white font-bold' : 'text-slate-300'}`}>
                     {player.name} {player.isUser && "(Вы)"}
                  </span>
                </div>
              </div>
              <span className="font-mono text-amber-200 opacity-90 text-xs">lvl {Math.floor(player.xp / 1000) + 1}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Profile Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
          <div 
            className="bg-slate-900 border-2 border-slate-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center">
               <div className={`w-24 h-24 rounded-full ${selectedPlayer.avatarColor} flex items-center justify-center text-4xl font-cinzel border-4 border-slate-700 shadow-xl mb-4 uppercase text-white`}>
                 {selectedPlayer.name.charAt(0)}
               </div>
               
               <h2 className="text-2xl font-cinzel text-white mb-1 flex items-center gap-2">
                 {selectedPlayer.name} 
                 {selectedPlayer.score > 10000 && <Crown size={20} className="text-yellow-400" />}
               </h2>
               <p className="text-slate-400 font-serif italic mb-6">Уровень {Math.floor(selectedPlayer.xp / 1000) + 1}</p>

               <div className="w-full grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center">
                   <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                     <Shield size={12} /> Очки
                   </div>
                   <div className="text-xl font-bold text-amber-300">{selectedPlayer.score.toLocaleString()}</div>
                 </div>

                 <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center">
                   <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                     <Flame size={12} /> Любимая Стихия
                   </div>
                   <div className="text-lg font-bold text-white">{selectedPlayer.favElement}</div>
                 </div>

                 <div className="col-span-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                    <div className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1">
                      <Swords size={12} /> Лучший дракон
                    </div>
                    <div className="font-bold text-purple-300">{selectedPlayer.bestDragon}</div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Leaderboard;