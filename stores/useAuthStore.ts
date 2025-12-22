// stores/useAuthStore.ts
import { create } from 'zustand';
import { router } from 'expo-router';
import { api } from 'lib/api';
import { storage } from 'lib/storage';

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
      
      // Salva tanto o token quanto o objeto do usuário
      await storage.setToken(token);
      // @ts-ignore - Certifique-se de ter implementado setUser no lib/storage.ts
      await storage.setUser(user); 
      
      set({ user, token, isLoading: false });
      
      router.replace('/(app)/dashboard'); 
      
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.error || 'Erro ao fazer login';
      console.error(message);
      throw new Error(message);
    }
  },

  signOut: async () => {
    await storage.removeToken();
    // @ts-ignore - Certifique-se de ter implementado removeUser no lib/storage.ts
    await storage.removeUser(); 
    
    set({ user: null, token: null });
    router.replace('/login');
  },

  loadStorageData: async () => {
    try {
      set({ isLoading: true });
      
      // Carrega token e usuário simultaneamente
      const token = await storage.getToken();
      // @ts-ignore - Certifique-se de ter implementado getUser no lib/storage.ts
      const user = await storage.getUser(); 
      
      if (token && user) {
        set({ token, user });
      } else if (token) {
        // Fallback: Se tiver token mas não user (caso raro), tenta recuperar da API ou define apenas token
        set({ token });
        // Opcional: chamar api.get('/me') aqui
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do storage:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (data) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...data };
      set({ user: updatedUser });
      // Opcional: Atualizar o storage local também para persistir a edição
      // storage.setUser(updatedUser); 
    }
  }
}));