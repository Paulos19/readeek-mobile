// app/(app)/read/[bookId]/_hooks/useReader.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy'; // Importante usar legacy no SDK 54
import { fileManager } from 'lib/files';
import { syncProgress, highlightService, Highlight } from 'lib/api';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

export const THEMES = {
    dark: { name: 'Escuro', bg: '#09090b', text: '#e4e4e7', ui: 'dark' },
    light: { name: 'Claro', bg: '#ffffff', text: '#000000', ui: 'light' },
    sepia: { name: 'Sépia', bg: '#f6f1d1', text: '#5f4b32', ui: 'light' }
};

export function useReader(rawBookId: string | string[]) {
    const router = useRouter();
    const navigation = useNavigation();
    const webviewRef = useRef<WebView>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const bookId = Array.isArray(rawBookId) ? rawBookId[0] : rawBookId;

    const [isLoading, setIsLoading] = useState(true);
    const [bookBase64, setBookBase64] = useState<string | null>(null);
    const [initialLocation, setInitialLocation] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [toc, setToc] = useState<any[]>([]);

    const [menuVisible, setMenuVisible] = useState(false);
    const [menuExpanded, setMenuExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'chapters' | 'highlights'>('settings');
    const [fontSize, setFontSize] = useState(100);
    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
    const [selection, setSelection] = useState<{ cfiRange: string; text: string } | null>(null);

    // Ocultar Tabs
    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: { display: 'none' },
            headerShown: false,
        });
    }, [navigation]);

    // Load Book
    useEffect(() => {
        if (!bookId) { router.back(); return; }
        const load = async () => {
            try {
                const savedSize = await AsyncStorage.getItem('@reader_fontsize');
                const savedTheme = await AsyncStorage.getItem('@reader_theme');
                if (savedSize) setFontSize(parseInt(savedSize));
                if (savedTheme) setCurrentTheme(savedTheme as any);

                const exists = await fileManager.checkBookExists(bookId);
                if (!exists) throw new Error("Livro não encontrado");

                const uri = fileManager.getLocalBookUri(bookId);
                const info = await FileSystem.getInfoAsync(uri);
                if (!info.exists || info.size === 0) throw new Error("Arquivo vazio");

                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
                setBookBase64(base64);

                const savedCfi = await AsyncStorage.getItem(`@progress:${bookId}`);
                if (savedCfi) setInitialLocation(savedCfi);

                try {
                    const remote = await highlightService.getByBook(bookId);
                    setHighlights(remote);
                } catch (e) {}
            } catch (error) {
                console.error("Reader Load Error:", error);
                Alert.alert("Erro", "Falha ao carregar livro.");
                router.back();
            } finally { setIsLoading(false); }
        };
        load();
        return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
    }, [bookId]);

    // Change Font Helper
    const changeFontSize = useCallback(async (newValue: number) => {
        const safeValue = Math.max(50, Math.min(250, Math.round(newValue)));
        setFontSize(prev => {
            if (prev !== safeValue) {
                // Injeta no WebView
                webviewRef.current?.injectJavaScript(`window.setFontSize(${safeValue});`);
                AsyncStorage.setItem('@reader_fontsize', safeValue.toString());
                return safeValue;
            }
            return prev;
        });
    }, []);

    // Gesto de Pinça (Pinch)
    const startFontSize = useRef(100);
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            startFontSize.current = fontSize;
        })
        .onUpdate((e) => {
            const newSize = startFontSize.current * e.scale;
            // Debounce visual
            if (Math.abs(newSize - fontSize) > 5) {
                runOnJS(changeFontSize)(newSize);
            }
        });

    const handleMessage = useCallback((event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            switch(data.type) {
                case 'LOC':
                    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                    syncTimeoutRef.current = setTimeout(() => {
                        syncProgress(bookId, data.cfi, data.percentage);
                        AsyncStorage.setItem(`@progress:${bookId}`, data.cfi);
                        if(data.percentage > 0) AsyncStorage.setItem(`@percent:${bookId}`, data.percentage.toString());
                    }, 1500);
                    break;
                case 'TOC': setToc(data.toc); break;
                case 'SELECTION': setSelection({ cfiRange: data.cfiRange, text: data.text }); setMenuVisible(false); break;
                case 'TOGGLE_UI': toggleMenu(); break;
                case 'HIGHLIGHT_CLICKED': setMenuVisible(true); setMenuExpanded(true); setActiveTab('highlights'); break;
                case 'LOG': console.log("[WebView]", data.msg); break;
            }
        } catch (e) {}
    }, [bookId, menuVisible, fontSize]);

    const toggleMenu = () => {
        if (menuVisible) { setMenuVisible(false); setMenuExpanded(false); }
        else { setMenuVisible(true); setMenuExpanded(false); }
    };

    // ... Helpers de tema e highlight mantidos
    const changeTheme = async (theme: 'dark' | 'light' | 'sepia') => {
        setCurrentTheme(theme);
        await AsyncStorage.setItem('@reader_theme', theme);
        webviewRef.current?.injectJavaScript(`window.applyTheme(${JSON.stringify(THEMES[theme])});`);
    };
    const nextPage = () => webviewRef.current?.injectJavaScript('window.rendition.next()');
    const prevPage = () => webviewRef.current?.injectJavaScript('window.rendition.prev()');
    const addHighlight = async (color: string) => {
         if (!selection) return;
         const tempId = Math.random().toString(36).substr(2, 9);
         const newH = { id: tempId, cfiRange: selection.cfiRange, text: selection.text, color };
         setHighlights(prev => [...prev, newH]);
         webviewRef.current?.injectJavaScript(`
             window.rendition.annotations.add('highlight', '${selection.cfiRange}', {}, null, 'hl-${tempId}');
             window.getSelection().removeAllRanges();
         `);
         setSelection(null);
         try { await highlightService.create(bookId, selection.cfiRange, selection.text, color); } catch(e) {}
    };
    const removeHighlight = async (cfiRange: string, id: string) => {
        webviewRef.current?.injectJavaScript(`window.rendition.annotations.remove('${cfiRange}', 'highlight');`);
        setHighlights(prev => prev.filter(h => h.id !== id));
        try { await highlightService.delete(id); } catch(e) {}
    };
    const goToChapter = (href: string) => {
        webviewRef.current?.injectJavaScript(`window.rendition.display('${href}');`);
        setMenuVisible(false); setMenuExpanded(false);
    };

    return {
        state: { isLoading, bookBase64, initialLocation, highlights, toc, fontSize, currentTheme, selection, menuVisible, menuExpanded, activeTab },
        actions: { setMenuVisible, setMenuExpanded, setActiveTab, toggleMenu, changeTheme, changeFontSize, goToChapter, nextPage, prevPage, addHighlight, removeHighlight, handleMessage, setSelection },
        refs: { webviewRef },
        gestures: { pinchGesture }
    };
}