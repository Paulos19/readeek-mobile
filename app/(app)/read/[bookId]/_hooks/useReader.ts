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

// Script para paginação e comunicação
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
    
    const { books, setBooks, setLastRead, updateProgress: updateGlobalProgress } = useReadingStore();

    const webviewRef = useRef<WebView>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const navigatingRef = useRef(false);
    
    const latestProgressRef = useRef<{ cfi: string, pct: number } | null>(null);

    const bookId = Array.isArray(rawBookId) ? rawBookId[0] : rawBookId;

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

    useEffect(() => {
        navigation.setOptions({ tabBarStyle: { display: 'none' }, headerShown: false });
    }, [navigation]);

    useEffect(() => { fontSizeSv.value = fontSize; }, [fontSize]);

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

                // 1. Busca metadados atualizados da API (para garantir que temos o 'updatedAt' mais recente)
                // Isso resolve o problema de stale data quando vem do Writer Studio
                console.log("[Reader] Buscando metadados atualizados...");
                const res = await api.get('/mobile/books');
                let currentBook = null;

                if (res.data) {
                    setBooks(res.data); // Atualiza cache global
                    currentBook = res.data.find((b: any) => b.id === bookId);
                } else {
                    // Fallback para cache se API falhar (offline)
                    currentBook = books.find((b) => b.id === bookId);
                }

                if (!currentBook) throw new Error("Livro não encontrado na biblioteca.");
                setBookMeta(currentBook);

                // 2. Lógica Inteligente de Cache do Arquivo
                const localUri = `${FileSystem.documentDirectory}${bookId}.epub`;
                const fileInfo = await FileSystem.getInfoAsync(localUri);
                
                let shouldDownload = !fileInfo.exists;

                if (fileInfo.exists) {
                    // Verifica se a versão do servidor é mais nova que o download local
                    const lastDownloadStr = await AsyncStorage.getItem(`@book_download_date:${bookId}`);
                    const lastDownloadTime = lastDownloadStr ? parseInt(lastDownloadStr) : 0;
                    const serverUpdateTime = new Date(currentBook.updatedAt).getTime();

                    // Se o servidor for mais novo, força re-download
                    if (serverUpdateTime > lastDownloadTime) {
                        console.log(`[Reader] Atualização detectada. Local: ${lastDownloadTime}, Server: ${serverUpdateTime}`);
                        shouldDownload = true;
                    }
                }

                if (shouldDownload) {
                    if (!currentBook.filePath) throw new Error("URL do livro inválida.");
                    console.log("[Reader] Baixando/Atualizando livro...", currentBook.filePath);
                    
                    // Remove arquivo antigo se existir para evitar corrupção
                    if (fileInfo.exists) {
                        await FileSystem.deleteAsync(localUri, { idempotent: true });
                    }

                    await FileSystem.downloadAsync(currentBook.filePath, localUri);
                    
                    // Marca o timestamp deste download
                    await AsyncStorage.setItem(`@book_download_date:${bookId}`, Date.now().toString());
                }

                // 3. Leitura e Preparação
                const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
                setBookBase64(base64);

                // 4. Carrega Preferências
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
                
                if (savedCfi) {
                    setInitialLocation(savedCfi);
                } else if (currentBook.currentLocation) {
                    setInitialLocation(currentBook.currentLocation);
                }

                setHighlights(remoteHighlights);

                setLastRead({
                    id: bookId,
                    title: currentBook.title,
                    author: currentBook.author || 'Autor Desconhecido',
                    progress: currentBook.progress || 0, 
                    coverUrl: currentBook.coverUrl 
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
                        latestProgressRef.current = { cfi: data.cfi, pct };
                        updateGlobalProgress(bookId, data.cfi, pct * 100);

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