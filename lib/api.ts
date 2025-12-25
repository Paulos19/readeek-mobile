import axios from 'axios';
import { storage } from './storage';
import { Community, CommunityPost } from 'app/(app)/_types/community';
import { PublicUserProfile } from 'app/(app)/_types/user';

// IMPORTANTE: Mude para o IP da sua máquina se estiver testando no device físico
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

// --- NOVAS FUNÇÕES DE FOLLOW E PERFIL ---

export const fetchUserProfile = async (userId: string): Promise<PublicUserProfile | null> => {
  try {
    const { data } = await api.get(`/mobile/users/${userId}`);
    return data;
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
};

export const toggleFollowUser = async (targetUserId: string): Promise<{ isFollowing: boolean }> => {
  // Chama a rota POST criada no backend
  const { data } = await api.post(`/mobile/users/${targetUserId}/follow`);
  return data;
};

// --- FIM DAS NOVAS FUNÇÕES ---

export const syncProgress = async (bookId: string, cfi: string, percentage: number) => {
  try {
    await api.patch('/mobile/progress', {
      bookId,
      cfi,
      percentage
    });
    console.log(`[Sync] Progresso salvo na nuvem: ${Math.round(percentage * 100)}%`);
  } catch (error) {
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
            return response.data.book; 
        }
        return null; 
    } catch (error) {
        console.error("[Metadata] Falha ao tentar reparar metadados:", error);
        return null;
    }
};

export const uploadBook = async (fileUri: string, fileName: string, mimeType: string) => {
    try {
        const formData = new FormData();
        const fileData = {
            uri: fileUri,
            name: fileName,
            type: mimeType || 'application/epub+zip'
        } as any; 

        formData.append('file', fileData);

        const response = await api.post('/mobile/books', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        if (error.response && error.response.status === 409) {
            return { success: false, error: 'duplicate', message: error.response.data.message };
        }
        console.error("Erro no upload:", error);
        return { success: false, error: 'upload_failed' };
    }
};

export const profileService = {
  update: async (data: { name?: string; about?: string; profileVisibility?: 'PUBLIC' | 'PRIVATE'; image?: string }) => {
    const hasNewImage = data.image && (data.image.startsWith('file://') || data.image.startsWith('content://'));

    if (hasNewImage) {
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
      const { image, ...textData } = data; 
      const res = await api.patch('/mobile/profile/update', textData);
      return res.data;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
     const res = await api.post('/mobile/auth/change-password', { currentPassword, newPassword });
     return res.data;
  }
};

export const communityService = {
  getAll: async () => {
    const res = await api.get('/mobile/communities');
    return res.data; 
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/mobile/communities/${id}`);
    return res.data; 
  },

  searchMembers: async (communityId: string, query: string) => {
    const res = await api.get(`/mobile/communities/${communityId}/members/search`, {
      params: { query }
    });
    return res.data; 
  },

  create: async (data: { 
    name: string; 
    description: string; 
    visibility: 'public' | 'private'; 
    password?: string;
    coverUri?: string; 
  }) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('visibility', data.visibility);
    if (data.password) formData.append('password', data.password);

    if (data.coverUri) {
        const filename = data.coverUri.split('/').pop() || 'cover.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('cover', {
            uri: data.coverUri,
            name: filename,
            type,
        } as any);
    }

    const res = await api.post('/mobile/communities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  join: async (communityId: string, password?: string) => {
    const res = await api.post(`/mobile/communities/${communityId}/join`, { password });
    return res.data;
  },

  uploadFile: async (communityId: string, fileUri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType
    } as any);

    const res = await api.post(`/mobile/communities/${communityId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  manageMember: async (communityId: string, memberId: string, action: 'BAN' | 'PROMOTE') => {
    const res = await api.patch(`/mobile/communities/${communityId}/members`, { memberId, action });
    return res.data;
  },

  createPost: async (communityId: string, content: string) => {
    const res = await api.post(`/mobile/communities/${communityId}/posts`, { content });
    return res.data;
  },

  toggleLike: async (postId: string) => {
    const res = await api.post(`/mobile/communities/posts/${postId}/react`, { emoji: '❤️' });
    return res.data; 
  },

  getComments: async (postId: string) => {
    const res = await api.get(`/mobile/communities/posts/${postId}/comments`);
    return res.data;
  },

  createComment: async (postId: string, content: string, parentId?: string) => {
    const res = await api.post(`/mobile/communities/posts/${postId}/comments`, { 
      content, 
      parentId 
    });
    return res.data;
  },

  toggleCommentLike: async (commentId: string) => {
    const res = await api.post(`/mobile/communities/comments/${commentId}/react`);
    return res.data;
  }
};

// --- SERVIÇO SOCIAL PRINCIPAL (FEED) ---
export const socialService = {
  getFeed: async () => {
    const res = await api.get('/mobile/social/feed');
    return res.data;
  },

  searchUsers: async (query: string) => {
    try {
        const res = await api.get('/mobile/users/search', { params: { query } });
        return res.data;
    } catch (e) {
        console.warn('API de busca de usuários não disponível');
        return [];
    }
  },

  createPost: async (data: { content: string; type: 'POST' | 'EXCERPT' | 'CHALLENGE'; bookId?: string; imageUri?: string }) => {
    const { content, type, bookId, imageUri } = data;

    if (imageUri) {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('type', type);
        if (bookId) formData.append('bookId', bookId);

        const filename = imageUri.split('/').pop() || 'post.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('image', {
            uri: imageUri,
            name: filename,
            type: mimeType,
        } as any);

        const res = await api.post('/mobile/social/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } else {
        const res = await api.post('/mobile/social/posts', { content, type, bookId });
        return res.data;
    }
  },

  toggleLike: async (postId: string) => {
    const res = await api.post(`/mobile/social/posts/${postId}/react`);
    return res.data;
  },

  deletePost: async (postId: string) => {
    const res = await api.delete(`/mobile/social/posts/${postId}`);
    return res.data;
  },

  getMyBooks: async () => {
    const res = await api.get('/mobile/books');
    return res.data;
  },

  getComments: async (postId: string) => {
    const res = await api.get(`/mobile/social/posts/${postId}/comments`);
    return res.data;
  },

  createComment: async (postId: string, content: string, parentId?: string) => {
    const res = await api.post(`/mobile/social/posts/${postId}/comments`, { 
      content, 
      parentId 
    });
    return res.data;
  },

  toggleCommentLike: async (commentId: string) => {
    const res = await api.post(`/mobile/social/comments/${commentId}/react`);
    return res.data; 
  }
};

export { PublicUserProfile };