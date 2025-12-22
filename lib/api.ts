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

export const repairBookMetadata = async (bookId: string) => {
    try {
        const response = await api.post('/mobile/books/refresh', { bookId });
        if (response.data.updated) {
            console.log("[Metadata] Livro atualizado com sucesso:", response.data.book.title);
            return response.data.book; // Retorna os novos dados (capa, titulo, etc)
        }
        return null; // Não precisou atualizar
    } catch (error) {
        console.error("[Metadata] Falha ao tentar reparar metadados:", error);
        return null;
    }
};

export const uploadBook = async (fileUri: string, fileName: string, mimeType: string) => {
    try {
        const formData = new FormData();
        
        // No React Native, o objeto de arquivo para FormData tem essa estrutura específica
        const fileData = {
            uri: fileUri,
            name: fileName,
            type: mimeType || 'application/epub+zip'
        } as any; // Cast para any necessário para evitar erro de tipagem do TS no React Native

        formData.append('file', fileData);

        const response = await api.post('/mobile/books', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        // Tratamento de erro específico para duplicidade (409)
        if (error.response && error.response.status === 409) {
            return { success: false, error: 'duplicate', message: error.response.data.message };
        }
        console.error("Erro no upload:", error);
        return { success: false, error: 'upload_failed' };
    }
};

export const profileService = {
  update: async (data: { name?: string; about?: string; profileVisibility?: 'PUBLIC' | 'PRIVATE'; image?: string }) => {
    
    // Verifica se há uma imagem para upload (URI local começa com file:// ou content://)
    const hasNewImage = data.image && (data.image.startsWith('file://') || data.image.startsWith('content://'));

    if (hasNewImage) {
      // --- MODO MULTIPART (Upload) ---
      const formData = new FormData();
      
      if (data.name) formData.append('name', data.name);
      if (data.about) formData.append('about', data.about);
      if (data.profileVisibility) formData.append('profileVisibility', data.profileVisibility);
      
      if (data.image) {
        const uri = data.image;
        const fileType = uri.split('.').pop();
        const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
        
        formData.append('image', {
          uri,
          name: `avatar.${fileType}`,
          type: mimeType,
        } as any);
      }

      const res = await api.patch('/mobile/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;

    } else {
      // --- MODO JSON (Texto normal) ---
      // Removemos a imagem se ela for uma URL http (já existente na nuvem), 
      // para não reenviar a string da URL como se fosse um arquivo.
      const { image, ...textData } = data; 
      
      const res = await api.patch('/mobile/profile/update', textData);
      return res.data;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
     // ... (manter igual)
     const res = await api.post('/mobile/auth/change-password', { currentPassword, newPassword });
     return res.data;
  }
};

