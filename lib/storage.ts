// lib/storage.ts
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'readeek_token';
const USER_KEY = 'readeek_user_data'; // Nova chave para o usuário

export const storage = {
  // ... suas funções de token existentes ...
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },
  setToken: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },
  removeToken: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // ADICIONE ESTAS FUNÇÕES PARA O USER
  getUser: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(USER_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading user:', e);
      return null;
    }
  },
  setUser: async (user: any) => {
    try {
      const jsonValue = JSON.stringify(user);
      await AsyncStorage.setItem(USER_KEY, jsonValue);
    } catch (e) {
      console.error('Error saving user:', e);
    }
  },
  removeUser: async () => {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error removing user:', e);
    }
  },
};