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
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadStorageData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  signIn: async (email, password) => {
    try {
      set({ isLoading: true });
      // Chama a rota que criamos no Next.js
      const response = await api.post('/mobile/auth/login', { email, password });
      
      const { user, token } = response.data;
      
      await storage.setToken(token);
      
      set({ user, token, isLoading: false });
      
      // Navegação após login
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
    set({ user: null, token: null });
    router.replace('/login');
  },

  loadStorageData: async () => {
    try {
      set({ isLoading: true });
      const token = await storage.getToken();
      
      if (token) {
        // Opcional: Validar token chamando uma rota /me no backend
        // Por enquanto, vamos assumir que se tem token, está logado (offline support)
        set({ token });
        // Idealmente, cacheamos o User também no SecureStore ou AsyncStore para offline
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));