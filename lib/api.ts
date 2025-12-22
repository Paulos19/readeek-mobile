// lib/api.ts
import axios from 'axios';
import { storage } from './storage';

// IMPORTANTE: Mude para o IP da sua máquina se estiver testando no device físico
// Ex: http://192.168.1.15:3000/api
const API_URL = 'https://readeek.vercel.app/api'; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Highlight {
    id: string;
    cfiRange: string;
    text: string;
    color: string;
}

// Interceptor para injetar o token automaticamente
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const syncProgress = async (bookId: string, cfi: string, percentage: number) => {
  try {
    await api.patch('/mobile/progress', {
      bookId,
      cfi,
      percentage
    });
    console.log(`[Sync] Progresso salvo na nuvem: ${Math.round(percentage * 100)}%`);
  } catch (error) {
    // Silent fail: Se falhar (offline), não tem problema, o local storage é a verdade absoluta no momento
    console.log('[Sync] Falha ao sincronizar (provavelmente offline)');
  }
};

export const highlightService = {
    getByBook: async (bookId: string) => {
        const res = await api.get(`/mobile/highlights?bookId=${bookId}`);
        return res.data as Highlight[];
    },
    
    create: async (bookId: string, cfiRange: string, text: string, color: string) => {
        const res = await api.post('/mobile/highlights', { bookId, cfiRange, text, color });
        return res.data as Highlight;
    },

    delete: async (id: string) => {
        await api.delete(`/mobile/highlights?id=${id}`);
    }
};

export const registerDownload = async (bookId: string) => {
    try {
        const response = await api.post('/mobile/books/download', { bookId });
        // Retorna o ID do livro que deve ser usado no sistema de arquivos
        return response.data.newBookId; 
    } catch (error) {
        console.error("[API] Falha ao registrar download", error);
        return null;
    }
};