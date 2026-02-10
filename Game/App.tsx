import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Dragon, ChestType, SCORE_VALUES, ElementType, ELEMENT_BG_COLORS, getDragonValue, CHEST_XP } from './types';
import { generateDragonFromChest, breedDragons } from './services/geminiService';
import { authService } from './services/storageService';
import Chest from './components/Chest';
import DragonCard from './components/PoemCard';
import Leaderboard from './components/Leaderboard';
import AuthModal from './components/AuthModal';
import { Sparkles, Trash2, Flame, Dna, Coins, ShieldCheck, Box, User, Crown, LogOut } from 'lucide-react';

const CHESTS: ChestType[] = [
  { id: 'wood', name: 'Деревянный', rarity: 1, color: 'amber', iconColor: 'text-amber-200', description: 'Обычные драконы', cost: 100, xp: CHEST_XP[1] },
  { id: 'iron', name: 'Железный', rarity: 2, color: 'slate', iconColor: 'text-slate-300', description: 'Редкие виды', cost: 350, xp: CHEST_XP[2] },
  { id: 'silver', name: 'Серебряный', rarity: 3, color: 'cyan', iconColor: 'text-cyan-200', description: 'Мистические', cost: 1000, xp: CHEST_XP[3] },
  { id: 'gold', name: 'Золотой', rarity: 4, color: 'yellow', iconColor: 'text-yellow-300', description: 'Эпические', cost: 5000, xp: CHEST_XP[4] },
];

type AnimationState = 'idle' | 'charging' | 'revealing';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [inventory, setInventory] = useState<Dragon[]>([]);
  const [coins, setCoins] = useState<number>(500); // Start currency 500
  
  // Level System
  const [xp, setXp] = useState<number>(0);
  const currentLevel = Math.floor(xp / 1000) + 1;
  const xpForNextLevel = 1000;
  const currentLevelXp = xp % 1000;
  const xpProgress = (currentLevelXp / xpForNextLevel) * 100;
  
  // Animation States
  const [animState, setAnimState] = useState<AnimationState>('idle');
  const [revealedElement, setRevealedElement] = useState<ElementType | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Trigger to update leaderboard
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- Auth Handlers ---
  const handleLogin = async (username: string, pass: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const user = await authService.login(username, pass);
      setCurrentUser(user.username);
      setCoins(user.coins);
      setXp(user.xp);
      setInventory(user.inventory);
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (username: string, pass: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const user = await authService.register(username, pass);
      setCurrentUser(user.username);
      setCoins(user.coins);
      setXp(user.xp);
      setInventory(user.inventory);
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setInventory([]);
    setCoins(500);
    setXp(0);
    setSelectedIds([]);
  };

  // --- Persistence Effect ---
  useEffect(() => {
    if (currentUser) {
      authService.saveProgress(currentUser, coins, xp, inventory);
      setRefreshTrigger(prev => prev + 1); // Notify leaderboard of updates
    }
  }, [coins, xp, inventory, currentUser]);

  // --- Game Handlers ---

  const handleOpenChest = useCallback(async (chest: ChestType) => {
    if (coins < chest.cost) {
      setError("Недостаточно золота!");
      return;
    }
    
    setCoins(prev => prev - chest.cost);
    setAnimState('charging');
    setLoadingMessage(`Открываем ${chest.name.toLowerCase()} сундук...`);
    setError(null);
    setRevealedElement(null);

    const apiPromise = generateDragonFromChest(chest.rarity);
    // Timer 1: The "charging" phase (2 seconds)
    const timerPromise = new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Wait for both API and initial timer
      const [newDragonData] = await Promise.all([apiPromise, timerPromise]);
      
      // Phase 2: Reveal Color (1 second)
      setRevealedElement(newDragonData.element);
      setAnimState('revealing');
      setLoadingMessage("Стихия пробуждается!");

      setTimeout(() => {
        // Finalize
        const newDragon: Dragon = {
          ...newDragonData,
          id: crypto.randomUUID(),
          isNew: true
        };
        setInventory(prev => [newDragon, ...prev]);
        setXp(prev => prev + chest.xp); // Grant XP
        setAnimState('idle');
        setRevealedElement(null);
      }, 1000); // The 3rd second

    } catch (e: any) {
      setError(e.message || "Не удалось открыть сундук.");
      setAnimState('idle');
    } 
  }, [coins]);

  const handleSelectDragon = (id: string) => {
    if (animState !== 'idle') return;
    
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      }
      
      if (prev.length === 0) return [id];
      
      if (prev.length === 1) {
        const d1 = inventory.find(p => p.id === prev[0]);
        const d2 = inventory.find(p => p.id === id);
        if (!d1 || !d2) return prev;
        
        // Removed restriction on different rarities
        
        if (d1.rarity === 4 && d2.rarity === 4) {
             setError("Двух Легендарных драконов нельзя скрестить (предел магии).");
             setTimeout(() => setError(null), 3000);
             return prev;
        }
        return [...prev, id];
      }
      return [id];
    });
  };

  const handleBreed = async () => {
    if (selectedIds.length !== 2) return;
    const d1 = inventory.find(p => p.id === selectedIds[0]);
    const d2 = inventory.find(p => p.id === selectedIds[1]);
    if (!d1 || !d2) return;

    setAnimState('charging');
    setLoadingMessage(`Ритуал: ${d1.element} + ${d2.element}...`);
    setError(null);
    setRevealedElement(null);

    const apiPromise = breedDragons(d1, d2);
    // Timer for breeding animation
    const timerPromise = new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const [babyDragonData] = await Promise.all([apiPromise, timerPromise]);

      setRevealedElement(babyDragonData.element);
      setAnimState('revealing');
      setLoadingMessage("Рождение новой силы!");

      setTimeout(() => {
        const newDragon: Dragon = {
          ...babyDragonData,
          id: crypto.randomUUID(),
          isNew: true
        };
        setInventory(prev => {
          const remaining = prev.filter(p => p.id !== d1.id && p.id !== d2.id);
          return [newDragon, ...remaining];
        });
        setXp(prev => prev + 50); // XP for breeding
        setSelectedIds([]);
        setAnimState('idle');
        setRevealedElement(null);
      }, 1000);

    } catch (e: any) {
      setError(e.message || "Ритуал не удался.");
      setAnimState('idle');
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setError(null);
  };

  const handleSell = (dragon: Dragon, e: React.MouseEvent) => {
    e.stopPropagation();
    const value = getDragonValue(dragon);
    setCoins(prev => prev + value);
    setInventory(prev => prev.filter(p => p.id !== dragon.id));
    setSelectedIds(prev => prev.filter(pId => pId !== dragon.id));
  };

  // --- Derived State ---
  const selectedDragons = inventory.filter(p => selectedIds.includes(p.id));
  // Validation for Breed Button
  const canBreed = selectedIds.length === 2 && !(selectedDragons[0].rarity === 4 && selectedDragons[1].rarity === 4);
  
  const playerScore = useMemo(() => {
    return inventory.reduce((acc, dragon) => acc + (SCORE_VALUES[dragon.rarity] || 0), 0);
  }, [inventory]);

  if (!currentUser) {
    return (
      <AuthModal 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        loading={authLoading} 
        error={authError} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] text-slate-200 pb-20 overflow-x-hidden">
      <style>{`
        @keyframes subtle-float-left {
          0%, 100% { transform: translateY(0) rotate(-6deg) translateX(10px); }
          50% { transform: translateY(-10px) rotate(-8deg) translateX(10px); }
        }
        @keyframes subtle-float-right {
          0%, 100% { transform: translateY(0) rotate(6deg) translateX(-10px); }
          50% { transform: translateY(-10px) rotate(8deg) translateX(-10px); }
        }
        .animate-float-left { animation: subtle-float-left 4s ease-in-out infinite; }
        .animate-float-right { animation: subtle-float-right 4s ease-in-out infinite; }
        
        @keyframes reveal-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); transform: scale(1); }
          70% { box-shadow: 0 0 50px 20px rgba(255, 255, 255, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); transform: scale(1); }
        }
        .animate-reveal { animation: reveal-pulse 1s ease-out infinite; }
      `}</style>

      {/* Header */}
      <header className="pt-6 pb-4 px-4 border-b border-indigo-900/50 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left flex items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-bold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-amber-500 drop-shadow-[0_2px_15px_rgba(220,38,38,0.5)]">
              Драконья Сокровищница
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center justify-center">
            
            {/* User Profile */}
            <div className="flex items-center gap-2 bg-indigo-900/40 px-3 py-1.5 rounded-lg border border-indigo-500/30">
               <User size={16} className="text-indigo-300" />
               <span className="font-cinzel font-bold text-indigo-100">{currentUser}</span>
               <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-white transition-colors" title="Выйти">
                 <LogOut size={16} />
               </button>
            </div>

            {/* Level Indicator */}
            <div className="flex flex-col items-center bg-slate-800/50 px-4 py-1 rounded-xl border border-indigo-500/30 min-w-[120px]">
               <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                 <Crown size={14} /> Уровень {currentLevel}
               </div>
               <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                   style={{ width: `${xpProgress}%` }}
                 />
               </div>
            </div>

            <div className="flex gap-4 items-center bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xl" title="Золото">
                <Coins className="drop-shadow-lg" /> {coins.toLocaleString()}
              </div>
              <div className="w-px h-8 bg-slate-600"></div>
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xl" title="Очки коллекции">
                <ShieldCheck className="drop-shadow-lg" /> {playerScore.toLocaleString()}
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Chests */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
            <h2 className="text-2xl font-cinzel text-center mb-4 text-indigo-200">Рынок Сундуков</h2>
            <div className="grid grid-cols-1 gap-3">
              {CHESTS.map(chest => (
                <Chest 
                  key={chest.id} 
                  chest={chest} 
                  onClick={handleOpenChest}
                  disabled={animState !== 'idle'}
                  canAfford={coins >= chest.cost}
                />
              ))}
            </div>
          </div>
          
          <div className="hidden lg:block">
            <Leaderboard currentUser={currentUser} refreshTrigger={refreshTrigger} />
          </div>
        </section>

        {/* Middle Column: Altar (The Stage) */}
        <section className="lg:col-span-5 flex flex-col items-center relative">
           <div className={`
             w-full aspect-square max-w-[500px] rounded-full border-4 border-dashed 
             flex flex-col items-center justify-center transition-all duration-700 relative overflow-hidden
             ${animState !== 'idle' ? 'border-transparent' : canBreed ? 'border-amber-500 bg-amber-900/10' : 'border-slate-700 bg-slate-800/20'}
           `}>
             
             {/* --- ANIMATION STATE: CHARGING or REVEALING --- */}
             {animState !== 'idle' ? (
                <div className={`absolute inset-0 flex items-center justify-center z-50 transition-colors duration-1000 ${animState === 'revealing' && revealedElement ? ELEMENT_BG_COLORS[revealedElement] : 'bg-black/40'}`}>
                   
                   {/* Background Effects */}
                   <div className={`absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${animState === 'charging' ? 'animate-spin-slow' : ''}`} />
                   
                   {/* Central Orb/Effect */}
                   <div className={`
                      relative z-10 p-12 rounded-full 
                      ${animState === 'revealing' ? 'animate-reveal bg-white text-black' : 'animate-pulse bg-slate-900 border-4 border-white/20'}
                   `}>
                      {animState === 'charging' ? (
                        <Dna size={80} className="text-white animate-spin" />
                      ) : (
                        <Flame size={100} className="animate-bounce" />
                      )}
                   </div>

                   {/* Text */}
                   <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                     <p className={`text-2xl font-cinzel font-bold drop-shadow-md ${animState === 'revealing' ? 'text-white scale-110' : 'text-slate-200'}`}>
                       {loadingMessage}
                     </p>
                   </div>
                </div>
             ) : (
                /* --- IDLE STATE --- */
                <div className="w-full h-full flex items-center justify-center relative p-4">
                 
                 {selectedDragons.length === 0 && (
                    <div className="text-center text-slate-500 z-20">
                      <Flame size={64} className="mx-auto mb-4 opacity-20" />
                      <p className="mb-2 font-serif italic text-lg">Алтарь ждет подношений...</p>
                    </div>
                 )}

                 {/* Breeding Pair Visualization */}
                 {selectedDragons.length > 0 && (
                   <>
                     {selectedDragons.length === 2 && (
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                         <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent blur-sm animate-pulse" />
                         <Dna className="text-amber-500/10 animate-[spin_10s_linear_infinite]" size={300} />
                       </div>
                     )}

                     {selectedDragons.map((dragon, idx) => {
                       const isPair = selectedDragons.length === 2;
                       return (
                         <div 
                            key={dragon.id} 
                            className={`
                               transition-all duration-700 ease-in-out relative z-10
                               ${isPair ? 'w-1/2 -mx-4 animate-float-' + (idx === 0 ? 'left' : 'right') : 'w-full max-w-[240px]'}
                            `}
                            style={isPair ? { 
                              transform: idx === 0 ? 'rotate(-6deg) translateX(20px)' : 'rotate(6deg) translateX(-20px)' 
                            } : {}}
                         >
                            <div className={`transform ${isPair ? 'scale-90' : 'scale-100'}`}>
                               <DragonCard poem={dragon} disabled={true} />
                            </div>
                         </div>
                       );
                     })}
                   </>
                 )}
               </div>
             )}
           </div>

           {/* Action Buttons MOVED HERE (Outside of overflow-hidden container) */}
           {animState === 'idle' && selectedDragons.length > 0 && (
             <div className="mt-6 flex gap-4 z-30">
               <button 
                onClick={handleClearSelection}
                className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-slate-500/20 active:scale-95 border border-slate-600"
               >
                 Отмена
               </button>
               <button 
                onClick={handleBreed}
                disabled={!canBreed}
                className={`
                  px-8 py-2 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 text-base
                  ${canBreed 
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:scale-110 hover:shadow-amber-500/40 text-white border border-amber-400/50 active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                `}
               >
                 <Dna size={18} /> Скрестить
               </button>
             </div>
           )}

           {error && (
             <div className="mt-4 w-full max-w-md p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-center animate-bounce">
               {error}
             </div>
           )}
           
           <div className="block lg:hidden mt-8 w-full">
            <Leaderboard currentUser={currentUser} refreshTrigger={refreshTrigger} />
           </div>
        </section>

        {/* Right Column: Inventory */}
        <section className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-center mb-4 px-2">
             <h2 className="text-2xl font-cinzel text-indigo-200">Логово ({inventory.length})</h2>
             <span className="text-xs text-slate-500 uppercase tracking-widest">Клик для выбора</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3 auto-rows-max overflow-y-auto max-h-[75vh] p-2 custom-scrollbar">
            {inventory.length === 0 && (
              <div className="py-20 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <Box size={48} className="mx-auto mb-2 opacity-30" />
                <p>Здесь пока пусто.</p>
                <p className="text-sm">Купите сундук на рынке!</p>
              </div>
            )}
            
            {inventory.map((dragon) => (
              <div key={dragon.id} className="relative group transform transition-transform hover:z-10">
                <DragonCard 
                  poem={dragon} 
                  isSelected={selectedIds.includes(dragon.id)}
                  disabled={animState !== 'idle'}
                  onClick={() => handleSelectDragon(dragon.id)}
                />
                
                {/* Sell Button Overlay */}
                {animState === 'idle' && !selectedIds.includes(dragon.id) && (
                   <button 
                    onClick={(e) => handleSell(dragon, e)}
                    className="absolute -top-2 -right-2 bg-emerald-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600 hover:scale-110 z-20 text-white shadow-lg border border-emerald-400 flex items-center gap-1 pr-3"
                    title={`Продать за ${getDragonValue(dragon)} золота`}
                   >
                     <Coins size={14} className="text-yellow-300" />
                     <span className="text-xs font-bold">+{getDragonValue(dragon)}</span>
                   </button>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;