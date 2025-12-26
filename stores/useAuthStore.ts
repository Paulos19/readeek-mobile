import { create } from 'zustand';
import { router } from 'expo-router';
import { api } from '../lib/api'; // Ajuste o caminho se necessário
import { storage } from '../lib/storage';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'ADMIN' | 'USER' | string;
  about: string | null;
  profileVisibility: 'PUBLIC' | 'PRIVATE';
  credits: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadStorageData: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true, 

  signIn: async (email, password) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/mobile/auth/login', { email, password });
      
      const { user, token } = response.data;
      
      // 1. Salva persistência (Importante: aguardar para evitar race conditions)
      await Promise.all([
        storage.setToken(token),
        storage.setUser(user)
      ]);
      
      // 2. Atualiza estado em memória
      set({ user, token, isLoading: false });
      
      // 3. Redireciona usando replace para limpar a pilha de navegação
      router.replace('/(app)/dashboard'); 
      
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.error || 'Erro ao fazer login';
      console.error("[AuthStore] Login Error:", message);
      throw new Error(message);
    }
  },

  signOut: async () => {
    try {
      // 1. Limpa Storage Local
      await Promise.all([
        storage.removeToken(),
        storage.removeUser()
      ]);
      
      // 2. Reseta Estado em Memória
      set({ user: null, token: null, isLoading: false });
      
      // 3. Redireciona para Login
      router.replace('/login');
    } catch (error) {
      console.error('[AuthStore] Erro ao sair:', error);
      // Mesmo com erro, força limpeza do estado local
      set({ user: null, token: null });
      router.replace('/login');
    }
  },

  loadStorageData: async () => {
    try {
      set({ isLoading: true });
      
      const [token, user] = await Promise.all([
        storage.getToken(),
        storage.getUser()
      ]);
      
      if (token && user) {
        set({ token, user });
        
        // DICA: Como você teve erro 401, é bom validar o token em background aqui
        // api.get('/mobile/profile/me').catch(() => get().signOut());
      } else {
        // Se faltar um dos dois, garante que o estado esteja limpo
        await storage.removeToken();
        await storage.removeUser();
        set({ token: null, user: null });
      }
      
    } catch (error) {
      console.error('[AuthStore] Erro ao carregar storage:', error);
      set({ token: null, user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (data) => {
    const currentUser = get().user;
    if (currentUser) {
      // Merge seguro dos dados
      const updatedUser = { ...currentUser, ...data };
      set({ user: updatedUser });
      
      // Persiste a atualização de forma assíncrona (não precisa dar await aqui)
      storage.setUser(updatedUser).catch(err => 
        console.error("[AuthStore] Erro ao persistir atualização do user:", err)
      ); 
    }
  }
}));