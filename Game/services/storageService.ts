import { Dragon } from '../types';

interface UserData {
  username: string;
  password?: string; // In a real app, hash this!
  coins: number;
  xp: number;
  inventory: Dragon[];
  createdAt: number;
}

const DB_KEY = 'dragon_treasury_db';

const getDB = (): Record<string, UserData> => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : {};
};

const saveDB = (db: Record<string, UserData>) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const authService = {
  login: async (username: string, password: string): Promise<UserData> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    
    const db = getDB();
    const user = db[username];
    
    if (!user) {
      throw new Error("Пользователь не найден");
    }
    if (user.password !== password) {
      throw new Error("Неверный пароль");
    }
    return user;
  },

  register: async (username: string, password: string): Promise<UserData> => {
    await new Promise(r => setTimeout(r, 500));
    
    const db = getDB();
    if (db[username]) {
      throw new Error("Имя пользователя уже занято");
    }

    const newUser: UserData = {
      username,
      password,
      coins: 500,
      xp: 0,
      inventory: [],
      createdAt: Date.now()
    };

    db[username] = newUser;
    saveDB(db);
    return newUser;
  },

  saveProgress: (username: string, coins: number, xp: number, inventory: Dragon[]) => {
    const db = getDB();
    if (db[username]) {
      db[username] = { ...db[username], coins, xp, inventory };
      saveDB(db);
    }
  },

  getLeaderboard: (): UserData[] => {
    const db = getDB();
    return Object.values(db)
      .sort((a, b) => b.xp - a.xp) // Sort by XP (Level) or score
      .slice(0, 50);
  }
};