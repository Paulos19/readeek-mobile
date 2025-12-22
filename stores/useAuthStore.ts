// stores/useAuthStore.ts
import { create } from 'zustand';
import { router } from 'expo-router';
import { api } from 'lib/api';
import { storage } from 'lib/storage';

// 1. ATUALIZAÇÃO DA INTERFACE: Adicionamos os campos que faltavam
interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'ADMIN' | 'USER' | string; // Melhor tipagem para o role
  about: string | null;            // Novo campo
  profileVisibility: 'PUBLIC' | 'PRIVATE'; // Novo campo
  credits: number;                 // Novo campo (usado para exibir os créditos)
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadStorageData: () => Promise<void>;
  // Opcional: Action para atualizar dados do usuário localmente sem refetch
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
      
      await storage.setToken(token);
      
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
    set({ user: null, token: null });
    router.replace('/login');
  },

  loadStorageData: async () => {
    try {
      set({ isLoading: true });
      const token = await storage.getToken();
      
      if (token) {
        set({ token });
        // DICA: Em um app real, aqui você faria um fetch para /api/mobile/auth/me
        // para pegar os dados atualizados (como créditos e bio) do usuário
        // ao reabrir o app.
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Helper para atualizar a UI imediatamente após editar o perfil
  updateUser: (data) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...data } });
    }
  }
}));