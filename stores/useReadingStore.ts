import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface para o último livro lido
export interface LastRead {
  id: string;
  title: string;
  author: string;
  progress: number;
  coverUrl: string | null;
  updatedAt?: number; // Timestamp para forçar refresh visual ou verificação de versão
}

// Interface Principal do Estado
interface ReadingState {
  lastRead: LastRead | null;
  books: any[]; // Cache da biblioteca
  progress: Record<string, string>; // Mapa de BookId -> CFI (Localização exata)
  
  // Actions
  setLastRead: (book: LastRead) => void;
  setBooks: (books: any[]) => void;
  updateProgress: (bookId: string, cfi: string, percentage: number) => void;
  getProgress: (bookId: string) => string | null;
  resetProgress: (bookId: string) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      // Estado Inicial
      lastRead: null,
      books: [],
      progress: {},

      // Actions
      setLastRead: (book) => set({ lastRead: book }),
      
      setBooks: (books) => set({ books }),

      // Atualiza o progresso (CFI) e sincroniza a porcentagem no LastRead
      updateProgress: (bookId, cfi, percentage) => 
        set((state) => {
          // Proteção contra dados inválidos
          if (!cfi || cfi === '' || percentage < 0) return state;

          // Se o livro sendo lido é o mesmo do "Continuar Lendo", atualiza a UI
          const updatedLastRead = state.lastRead?.id === bookId
            ? { ...state.lastRead, progress: percentage }
            : state.lastRead;

          return {
            progress: { ...state.progress, [bookId]: cfi },
            lastRead: updatedLastRead
          };
        }),

      getProgress: (bookId) => get().progress[bookId] || null,

      // Remove o progresso de um livro específico (útil para debug ou recomeçar)
      resetProgress: (bookId) => 
        set((state) => {
            const newProgress = { ...state.progress };
            delete newProgress[bookId];
            return { progress: newProgress };
        }),
    }),
    {
      name: 'reading-storage-v2', // Alterado para v2 para limpar caches antigos conflitantes
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);