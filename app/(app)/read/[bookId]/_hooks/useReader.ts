import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy'; // Corrigido import (removido /legacy se usar Expo 50+)
import { fileManager } from 'lib/files';
import { syncProgress, highlightService, Highlight } from 'lib/api';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useReadingStore } from 'stores/useReadingStore';

export const THEMES = {
    dark: { name: 'Escuro', bg: '#09090b', text: '#e4e4e7', ui: 'dark' },
    light: { name: 'Claro', bg: '#ffffff', text: '#000000', ui: 'light' },
    sepia: { name: 'Sépia', bg: '#f6f1d1', text: '#5f4b32', ui: 'light' }
};

const flattenToc = (items: any[]): any[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.reduce((acc, item) => {
        acc.push({ label: item.label, href: item.href });
        if (item.subitems && item.subitems.length > 0) {
            acc.push(...flattenToc(item.subitems));
        }
        return acc;
    }, []);
};

export function useReader(rawBookId: string | string[]) {
    const router = useRouter();
    const navigation = useNavigation();
    const params = useLocalSearchParams(); 
    
    const { setLastRead, updateProgress: updateGlobalProgress } = useReadingStore();

    const webviewRef = useRef<WebView>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const navigatingRef = useRef(false);
    
    // REF PARA SINCRONIZAÇÃO SEGURA NO UNMOUNT
    const latestProgressRef = useRef<{ cfi: string, pct: number } | null>(null);

    const bookId = Array.isArray(rawBookId) ? rawBookId[0] : rawBookId;

    const [isLoading, setIsLoading] = useState(true);
    const [bookBase64, setBookBase64] = useState<string | null>(null);
    const [initialLocation, setInitialLocation] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [toc, setToc] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);

    const [menuVisible, setMenuVisible] = useState(false);
    const [menuExpanded, setMenuExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'chapters' | 'highlights'>('settings');
    
    const [fontSize, setFontSize] = useState(100);
    const fontSizeSv = useSharedValue(100); 

    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
    const [selection, setSelection] = useState<{ cfiRange: string; text: string } | null>(null);

    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: { display: 'none' },
            headerShown: false,
        });
    }, [navigation]);

    useEffect(() => { fontSizeSv.value = fontSize; }, [fontSize]);

    // SALVA PROGRESSO AO SAIR DA TELA (CLEANUP)
    useEffect(() => {
        return () => {
            if (latestProgressRef.current) {
                console.log("[Reader] Salvando progresso ao sair...");
                syncProgress(bookId, latestProgressRef.current.cfi, latestProgressRef.current.pct);
            }
        };
    }, [bookId]);

    useEffect(() => {
        if (!bookId) { router.back(); return; }
        const load = async () => {
            try {
                const [savedSize, savedTheme, savedCfi, remoteHighlights, bookExists] = await Promise.all([
                    AsyncStorage.getItem('@reader_fontsize'),
                    AsyncStorage.getItem('@reader_theme'),
                    AsyncStorage.getItem(`@progress:${bookId}`),
                    highlightService.getByBook(bookId).catch(() => [] as Highlight[]),
                    fileManager.checkBookExists(bookId)
                ]);

                if (savedSize) {
                    const size = parseInt(savedSize);
                    setFontSize(size);
                    fontSizeSv.value = size;
                }
                if (savedTheme) setCurrentTheme(savedTheme as any);
                if (savedCfi) setInitialLocation(savedCfi);
                setHighlights(remoteHighlights);

                if (!bookExists) throw new Error("Livro não encontrado");

                const uri = fileManager.getLocalBookUri(bookId);
                const info = await FileSystem.getInfoAsync(uri);
                if (!info.exists || info.size === 0) throw new Error("Arquivo vazio");

                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                setBookBase64(base64);

                const potentialCoverPath = `${FileSystem.documentDirectory}books/${bookId}/cover.jpg`;
                const coverInfo = await FileSystem.getInfoAsync(potentialCoverPath);
                const validCoverUri = coverInfo.exists ? potentialCoverPath : null;

                setLastRead({
                    id: bookId,
                    title: (params.title as string) || "Leitura Atual",
                    progress: progress || 0, 
                    cover: validCoverUri 
                });

            } catch (error) {
                console.error("Reader Load Error:", error);
                Alert.alert("Erro", "Falha ao carregar livro.");
                router.back();
            } finally { setIsLoading(false); }
        };
        load();
    }, [bookId]);

    const changeFontSize = useCallback(async (newValue: number) => {
        const safeValue = Math.max(50, Math.min(250, Math.round(newValue)));
        setFontSize(prev => {
            if (prev !== safeValue) {
                webviewRef.current?.injectJavaScript(`window.setFontSize(${safeValue});`);
                AsyncStorage.setItem('@reader_fontsize', safeValue.toString());
                return safeValue;
            }
            return prev;
        });
    }, []);

    const pinchGesture = useMemo(() => Gesture.Pinch()
        .onEnd((e) => {
            const newSize = fontSizeSv.value * e.scale;
            runOnJS(changeFontSize)(newSize);
        }), [changeFontSize, fontSizeSv]);

    const handleMessage = useCallback((event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            switch(data.type) {
                case 'LOC':
                    if (data.percentage !== undefined) { // Check mais seguro que if(data.percentage) pois 0 é falsy
                        const pct = data.percentage;
                        setProgress(pct);
                        
                        // Atualiza Ref para o Unmount usar
                        latestProgressRef.current = { cfi: data.cfi, pct };

                        updateGlobalProgress(bookId, pct * 100);

                        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                        
                        // Salva localmente imediatamente para responsividade da UI
                        AsyncStorage.setItem(`@progress:${bookId}`, data.cfi);
                        AsyncStorage.setItem(`@percent:${bookId}`, pct.toString());

                        // Debounce apenas para a API
                        syncTimeoutRef.current = setTimeout(() => {
                            syncProgress(bookId, data.cfi, pct);
                        }, 2000);
                    }
                    break;
                case 'TOC': 
                    setToc(flattenToc(data.toc)); 
                    break;
                case 'SELECTION': setSelection({ cfiRange: data.cfiRange, text: data.text }); setMenuVisible(false); break;
                case 'TOGGLE_UI': toggleMenu(); break;
                case 'HIGHLIGHT_CLICKED': setMenuVisible(true); setMenuExpanded(true); setActiveTab('highlights'); break;
                case 'LOG': console.log("[WebView Log]", data.msg); break;
            }
        } catch (e) {}
    }, [bookId, menuVisible, fontSize]);

    const toggleMenu = () => {
        if (menuVisible) { setMenuVisible(false); setMenuExpanded(false); }
        else { setMenuVisible(true); setMenuExpanded(false); }
    };

    const changeTheme = async (theme: 'dark' | 'light' | 'sepia') => {
        setCurrentTheme(theme);
        await AsyncStorage.setItem('@reader_theme', theme);
        webviewRef.current?.injectJavaScript(`window.applyTheme(${JSON.stringify(THEMES[theme])});`);
    };

    const navDebounce = (fn: () => void) => {
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        fn();
        setTimeout(() => { navigatingRef.current = false; }, 300);
    };

    const nextPage = () => navDebounce(() => webviewRef.current?.injectJavaScript('window.rendition.next()'));
    const prevPage = () => navDebounce(() => webviewRef.current?.injectJavaScript('window.rendition.prev()'));

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
        state: { isLoading, bookBase64, initialLocation, highlights, toc, fontSize, currentTheme, selection, menuVisible, menuExpanded, activeTab, progress },
        actions: { setMenuVisible, setMenuExpanded, setActiveTab, toggleMenu, changeTheme, changeFontSize, goToChapter, nextPage, prevPage, addHighlight, removeHighlight, handleMessage, setSelection },
        refs: { webviewRef },
        gestures: { pinchGesture }
    };
}