import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader } from 'lucide-react';

interface AuthModalProps {
  onLogin: (username: string, pass: string) => Promise<void>;
  onRegister: (username: string, pass: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin, onRegister, loading, error }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    if (isLogin) {
      onLogin(username, password);
    } else {
      onRegister(username, password);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
       <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(79,70,229,0.2)] relative overflow-hidden">
          
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-cinzel text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300">
              {isLogin ? "Вход в Сокровищницу" : "Регистрация Лорда"}
            </h2>
            <p className="text-center text-slate-400 mb-8 font-serif italic">
              {isLogin ? "Введите свои данные, чтобы продолжить путь." : "Создайте аккаунт и начните собирать коллекцию."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-1">
                 <label className="text-xs uppercase tracking-wider text-slate-500 ml-1">Никнейм</label>
                 <div className="relative">
                   <User className="absolute left-3 top-3 text-slate-500" size={18} />
                   <input 
                     type="text" 
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                     placeholder="Имя героя"
                   />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs uppercase tracking-wider text-slate-500 ml-1">Пароль</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                   <input 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                     placeholder="••••••••"
                   />
                 </div>
               </div>

               {error && (
                 <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                   {error}
                 </div>
               )}

               <button 
                 type="submit"
                 disabled={loading || !username || !password}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
               >
                 {loading ? <Loader className="animate-spin" size={20} /> : (
                   <>
                     {isLogin ? "Войти" : "Создать аккаунт"}
                     <ArrowRight size={18} />
                   </>
                 )}
               </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setUsername(''); setPassword(''); }}
                className="text-slate-400 hover:text-white text-sm transition-colors border-b border-dashed border-slate-600 hover:border-white pb-0.5"
              >
                {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
              </button>
            </div>
          </div>
       </div>
    </div>
  );
};

export default AuthModal;