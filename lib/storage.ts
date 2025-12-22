// lib/storage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'readeek_user_token';

export const storage = {
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao buscar token', error);
      return null;
    }
  },
  setToken: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Erro ao salvar token', error);
    }
  },
  removeToken: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao remover token', error);
    }
  },
};