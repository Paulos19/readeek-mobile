import { create } from 'zustand';
import { getUserPreferences, saveUserPreferences, UserPreferences } from '../lib/api';

interface ThemeState {
  wallpaper: string | null;
  myBubbleColor: string;
  otherBubbleColor: string;
  isLoading: boolean;

  // Ações
  fetchPreferences: () => Promise<void>;
  updateTheme: (my: string, other: string, wall?: string | null) => Promise<void>;
  resetTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  wallpaper: null,
  myBubbleColor: '#059669',
  otherBubbleColor: '#27272a',
  isLoading: false,

  fetchPreferences: async () => {
    set({ isLoading: true });
    const prefs = await getUserPreferences();
    if (prefs) {
      set({
        wallpaper: prefs.wallpaperUrl,
        myBubbleColor: prefs.myBubbleColor,
        otherBubbleColor: prefs.otherBubbleColor,
      });
    }
    set({ isLoading: false });
  },

  updateTheme: async (my, other, wall) => {
    // Atualização Otimista na UI
    set({ myBubbleColor: my, otherBubbleColor: other, wallpaper: wall });
    
    try {
      // Salva no servidor
      const newPrefs = await saveUserPreferences(my, other, wall);
      if (newPrefs) {
        set({
            wallpaper: newPrefs.wallpaperUrl, // URL real da nuvem
            myBubbleColor: newPrefs.myBubbleColor,
            otherBubbleColor: newPrefs.otherBubbleColor
        });
      }
    } catch (error) {
      // Em caso de erro, seria ideal reverter, mas manteremos simples por enquanto
      console.error("Falha ao salvar tema remoto");
    }
  },

  resetTheme: async () => {
    const defaults = { my: '#059669', other: '#27272a', wall: null };
    set({ myBubbleColor: defaults.my, otherBubbleColor: defaults.other, wallpaper: null });
    await saveUserPreferences(defaults.my, defaults.other, null);
  }
}));