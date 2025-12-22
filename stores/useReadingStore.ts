import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LastBook {
  id: string;
  cover?: string | null; 
  title: string;
  progress: number; 
}

interface ReadingState {
  lastRead: LastBook | null;
  setLastRead: (book: LastBook) => void;
  updateProgress: (bookId: string, progress: number) => void;
}

export const useReadingStore = create(
  persist<ReadingState>(
    (set) => ({
      lastRead: null,
      setLastRead: (book) => set({ lastRead: book }),
      updateProgress: (bookId, progress) => 
        set((state) => {
          if (state.lastRead?.id === bookId) {
             return { lastRead: { ...state.lastRead, progress } };
          }
          return state;
        }),
    }),
    {
      name: 'reading-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);