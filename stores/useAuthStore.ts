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
  isLoading: true, // Começa carregando para o _layout.tsx esperar

  signIn: async (email, password) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/mobile/auth/login', { email, password });
      
      const { user, token } = response.data;
      
      // Salva persistência
      await storage.setToken(token);
      await storage.setUser(user);
      
      // Atualiza estado em memória
      set({ user, token, isLoading: false });
      
      // Redireciona
      router.replace('/(app)/dashboard'); 
      
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.error || 'Erro ao fazer login';
      console.error(message);
      throw new Error(message);
    }
  },

  signOut: async () => {
    try {
      await storage.removeToken();
      await storage.removeUser();
      
      set({ user: null, token: null });
      router.replace('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  },

  loadStorageData: async () => {
    try {
      set({ isLoading: true });
      
      // Carrega token e usuário simultaneamente
      const [token, user] = await Promise.all([
        storage.getToken(),
        storage.getUser()
      ]);
      
      if (token && user) {
        // Se temos ambos, o usuário está autenticado e hidratado
        set({ token, user });
        
        // Opcional: Validar token ou atualizar usuário em background
        // api.get('/mobile/auth/me').then(res => set({ user: res.data })).catch(() => {});
      } else if (token && !user) {
        // Caso raro: Tem token mas perdeu o user data. Tenta recuperar ou força logout.
        // Aqui assumimos logout para segurança e consistência UI.
        await storage.removeToken();
        set({ token: null, user: null });
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do storage:', error);
      set({ token: null, user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (data) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...data } as User;
      set({ user: updatedUser });
      // Persiste a atualização localmente para não perder ao reiniciar
      storage.setUser(updatedUser); 
    }
  }
}));