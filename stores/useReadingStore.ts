import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface para o último livro lido (Padronizada para evitar erros no Header)
export interface LastRead {
  id: string;
  title: string;
  author: string;          // Adicionado para compatibilidade
  progress: number;
  coverUrl: string | null; // Renomeado de 'cover' para 'coverUrl'
}

// Interface Principal do Estado
interface ReadingState {
  lastRead: LastRead | null;
  books: any[]; // Cache da biblioteca
  progress: Record<string, string>; // Mapa de BookId -> CFI (Localização)
  
  // Actions
  setLastRead: (book: LastRead) => void;
  setBooks: (books: any[]) => void;
  updateProgress: (bookId: string, cfi: string, percentage: number) => void;
  getProgress: (bookId: string) => string | null;
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

      // Atualiza o progresso (CFI) e também atualiza o objeto LastRead visualmente se for o mesmo livro
      updateProgress: (bookId, cfi, percentage) => 
        set((state) => {
          // Se o livro que está sendo lido agora é o mesmo que está no banner "Continuar Lendo",
          // atualizamos a porcentagem dele imediatamente para a UI ficar fluida.
          const updatedLastRead = state.lastRead?.id === bookId
            ? { ...state.lastRead, progress: percentage }
            : state.lastRead;

          return {
            progress: { ...state.progress, [bookId]: cfi },
            lastRead: updatedLastRead
          };
        }),

      getProgress: (bookId) => get().progress[bookId] || null,
    }),
    {
      name: 'reading-storage', // Persistência no AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);