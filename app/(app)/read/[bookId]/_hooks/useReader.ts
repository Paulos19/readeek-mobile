import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { highlightService, syncProgress, Highlight, api } from '../../../../../lib/api';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useReadingStore } from '../../../../../stores/useReadingStore';

export const THEMES = {
    dark: { name: 'Escuro', bg: '#09090b', text: '#e4e4e7', ui: 'dark' },
    light: { name: 'Claro', bg: '#ffffff', text: '#000000', ui: 'light' },
    sepia: { name: 'Sépia', bg: '#f6f1d1', text: '#5f4b32', ui: 'light' }
};

// Script para forçar a geração de paginação e corrigir o "0%"
const LOCATION_GENERATION_SCRIPT = `
    if (window.book) {
        window.book.ready.then(() => {
            if (window.book.locations.length() === 0) {
                console.log("Gerando localizações...");
                return window.book.locations.generate(1000); 
            }
        }).then(() => {
            var currentLocation = window.rendition.currentLocation();
            if (currentLocation && currentLocation.start) {
               var cfi = currentLocation.start.cfi;
               var percentage = window.book.locations.percentageFromCfi(cfi);
               
               window.ReactNativeWebView.postMessage(JSON.stringify({
                   type: 'LOC',
                   cfi: cfi,
                   percentage: percentage
               }));
            }
        }).catch(err => console.log("Erro locations:", err));
    }
`;

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
    
    // Zustand Store
    const { books, setBooks, setLastRead, updateProgress: updateGlobalProgress } = useReadingStore();

    const webviewRef = useRef<WebView>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // --- CORREÇÃO: Adicionando a declaração que faltava ---
    const navigatingRef = useRef(false);
    
    // Ref para salvar o último progresso conhecido (para o unmount)
    const latestProgressRef = useRef<{ cfi: string, pct: number } | null>(null);

    const bookId = Array.isArray(rawBookId) ? rawBookId[0] : rawBookId;

    // Estados
    const [isLoading, setIsLoading] = useState(true);
    const [bookBase64, setBookBase64] = useState<string | null>(null);
    const [initialLocation, setInitialLocation] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [toc, setToc] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);
    const [bookMeta, setBookMeta] = useState<any>(null);

    // UI
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuExpanded, setMenuExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'chapters' | 'highlights'>('settings');
    
    // Configurações
    const [fontSize, setFontSize] = useState(100);
    const fontSizeSv = useSharedValue(100); 
    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
    const [selection, setSelection] = useState<{ cfiRange: string; text: string } | null>(null);

    // Fullscreen mode
    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: { display: 'none' },
            headerShown: false,
        });
    }, [navigation]);

    useEffect(() => { fontSizeSv.value = fontSize; }, [fontSize]);

    // Cleanup: Salvar progresso ao sair
    useEffect(() => {
        return () => {
            if (latestProgressRef.current) {
                const { cfi, pct } = latestProgressRef.current;
                if (cfi && pct >= 0) {
                    console.log(`[Reader] Salvando progresso ao sair: ${Math.round(pct * 100)}%`);
                    syncProgress(bookId, cfi, pct);
                }
            }
        };
    }, [bookId]);

    // LOAD PRINCIPAL
    useEffect(() => {
        if (!bookId) { router.back(); return; }

        const load = async () => {
            try {
                setIsLoading(true);

                // 1. Tenta encontrar metadados do livro (Store -> API)
                let currentBook = books.find((b: { id: string; }) => b.id === bookId);

                if (!currentBook) {
                    console.log("[Reader] Livro não encontrado no cache, buscando API...");
                    const res = await api.get('/mobile/books');
                    if (res.data) {
                        setBooks(res.data);
                        currentBook = res.data.find((b: any) => b.id === bookId);
                    }
                }

                if (!currentBook) throw new Error("Livro não encontrado na biblioteca.");
                setBookMeta(currentBook);

                // 2. Verifica se o arquivo existe localmente, senão baixa
                const localUri = `${FileSystem.documentDirectory}${bookId}.epub`;
                const fileInfo = await FileSystem.getInfoAsync(localUri);

                if (!fileInfo.exists) {
                    if (!currentBook.filePath) throw new Error("URL do livro inválida.");
                    console.log("[Reader] Baixando livro...", currentBook.filePath);
                    
                    await FileSystem.downloadAsync(currentBook.filePath, localUri);
                }

                // 3. Lê o arquivo como Base64 para injetar na WebView
                const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
                setBookBase64(base64);

                // 4. Carrega Preferências e Destaques
                const [savedSize, savedTheme, savedCfi, remoteHighlights] = await Promise.all([
                    AsyncStorage.getItem('@reader_fontsize'),
                    AsyncStorage.getItem('@reader_theme'),
                    AsyncStorage.getItem(`@progress:${bookId}`),
                    highlightService.getByBook(bookId).catch(() => [] as Highlight[]),
                ]);

                if (savedSize) {
                    const size = parseInt(savedSize);
                    setFontSize(size);
                    fontSizeSv.value = size;
                }
                if (savedTheme) setCurrentTheme(savedTheme as any);
                
                // Prioridade de localização: Local > Remoto > 0
                if (savedCfi) {
                    setInitialLocation(savedCfi);
                } else if (currentBook.currentLocation) {
                    setInitialLocation(currentBook.currentLocation);
                }

                setHighlights(remoteHighlights);

                // 5. Atualiza "Última Leitura"
                setLastRead({
                    id: bookId,
                    title: currentBook.title,
                    progress: currentBook.progress || 0, 
                    cover: currentBook.coverUrl 
                });

            } catch (error: any) {
                console.error("Reader Load Error:", error);
                Alert.alert("Erro", error.message || "Falha ao carregar livro.");
                router.back();
            } finally { 
                setIsLoading(false); 
            }
        };
        load();
    }, [bookId]);

    // Gestos e Ações
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
                    if (typeof data.percentage === 'number') { 
                        const pct = data.percentage;
                        setProgress(pct);
                        
                        // Atualiza Ref
                        latestProgressRef.current = { cfi: data.cfi, pct };

                        // Atualiza Store Global (UI)
                        updateGlobalProgress(bookId, data.cfi, pct * 100);

                        // Sync API (Debounce)
                        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                        
                        AsyncStorage.setItem(`@progress:${bookId}`, data.cfi);
                        AsyncStorage.setItem(`@percent:${bookId}`, pct.toString());

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

    const onWebViewLoaded = () => {
        webviewRef.current?.injectJavaScript(LOCATION_GENERATION_SCRIPT);
    };

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
        state: { isLoading, bookBase64, initialLocation, highlights, toc, fontSize, currentTheme, selection, menuVisible, menuExpanded, activeTab, progress, bookMeta },
        actions: { setMenuVisible, setMenuExpanded, setActiveTab, toggleMenu, changeTheme, changeFontSize, goToChapter, nextPage, prevPage, addHighlight, removeHighlight, handleMessage, setSelection, onWebViewLoaded },
        refs: { webviewRef },
        gestures: { pinchGesture }
    };
}