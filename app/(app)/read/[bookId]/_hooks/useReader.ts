import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
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

// Script para paginação e comunicação de localização
const LOCATION_GENERATION_SCRIPT = `
    if (window.book) {
        window.book.ready.then(() => {
            // Gera locais apenas se não existirem
            if (window.book.locations.length() === 0) {
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

// SCRIPT: Extrai texto dos capítulos em background para o Menu
const TOC_PREVIEW_SCRIPT = `
    async function generateTocPreviews() {
        if (!window.book || !window.book.navigation) return;
        
        function flatten(items) {
            return items.reduce((acc, item) => {
                acc.push(item);
                if (item.subitems) acc.push(...flatten(item.subitems));
                return acc;
            }, []);
        }

        const allItems = flatten(window.book.navigation.toc);
        const previews = {};
        
        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            try {
                // Carrega o HTML do capítulo na memória sem exibir
                const doc = await window.book.load(item.href);
                if (doc && doc.body) {
                    // Limpa quebras de linha e pega os primeiros 120 caracteres
                    const text = doc.body.innerText.replace(/\\s+/g, ' ').trim().substring(0, 120);
                    previews[item.href] = text;
                }
            } catch (e) {
                console.log('Erro preview:', item.href);
            }

            // Envia em lotes para não travar a UI
            if (i % 3 === 0 || i === allItems.length - 1) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'TOC_PREVIEWS',
                    data: previews
                }));
                await new Promise(r => setTimeout(r, 50));
            }
        }
    }
    
    window.book.ready.then(() => {
        setTimeout(generateTocPreviews, 2000); // Delay para não competir com render inicial
    });
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
    
    // Usamos o Store como Fonte da Verdade para o progresso local
    const { 
        books, 
        setBooks, 
        setLastRead, 
        updateProgress: updateGlobalProgress,
        getProgress: getStoreProgress
    } = useReadingStore();

    const webviewRef = useRef<WebView>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const navigatingRef = useRef(false);
    const latestProgressRef = useRef<{ cfi: string, pct: number } | null>(null);
    
    // Trava para evitar que o WebView sobrescreva o progresso com "0" durante o boot
    const isReadyRef = useRef(false);

    const bookId = Array.isArray(rawBookId) ? rawBookId[0] : rawBookId;

    const [isLoading, setIsLoading] = useState(true);
    const [bookBase64, setBookBase64] = useState<string | null>(null);
    const [initialLocation, setInitialLocation] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [toc, setToc] = useState<any[]>([]);
    const [tocPreviews, setTocPreviews] = useState<Record<string, string>>({}); 
    const [progress, setProgress] = useState(0);
    const [bookMeta, setBookMeta] = useState<any>(null);

    // UI States
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuExpanded, setMenuExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'chapters' | 'highlights'>('settings');
    const [selection, setSelection] = useState<{ cfiRange: string; text: string; y: number } | null>(null);
    
    // Configurações
    const [fontSize, setFontSize] = useState(100);
    const fontSizeSv = useSharedValue(100); 
    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'sepia'>('dark');

    useEffect(() => {
        navigation.setOptions({ tabBarStyle: { display: 'none' }, headerShown: false });
    }, [navigation]);

    useEffect(() => { fontSizeSv.value = fontSize; }, [fontSize]);

    // Salvar progresso ao desmontar
    useEffect(() => {
        return () => {
            if (latestProgressRef.current) {
                const { cfi, pct } = latestProgressRef.current;
                if (cfi && pct >= 0) {
                    syncProgress(bookId, cfi, pct);
                }
            }
        };
    }, [bookId]);

    // LOAD DO LIVRO
    useEffect(() => {
        if (!bookId) { router.back(); return; }

        const load = async () => {
            try {
                setIsLoading(true);
                isReadyRef.current = false; // Bloqueia sync até terminar load

                // 1. Metadados (Sempre busca fresh do servidor para garantir atualizações)
                let currentBook = null;
                try {
                    const res = await api.get('/mobile/books');
                    if (res.data) {
                        setBooks(res.data);
                        currentBook = res.data.find((b: any) => b.id === bookId);
                    }
                } catch (err) {
                    console.log("Offline ou erro API, usando cache local");
                    currentBook = books.find((b) => b.id === bookId);
                }

                if (!currentBook) throw new Error("Livro não encontrado.");
                setBookMeta(currentBook);

                // 2. Arquivo Local e Cache (Lógica de Atualização Robusta)
                const localUri = `${FileSystem.documentDirectory}${bookId}.epub`;
                const fileInfo = await FileSystem.getInfoAsync(localUri);
                
                let shouldDownload = !fileInfo.exists;

                if (fileInfo.exists) {
                    const lastDownloadStr = await AsyncStorage.getItem(`@book_download_date:${bookId}`);
                    const lastDownloadTime = lastDownloadStr ? parseInt(lastDownloadStr) : 0;
                    
                    // Converte string ISO do servidor para timestamp
                    const serverUpdateTime = new Date(currentBook.updatedAt).getTime();

                    // Se o servidor tem uma versão mais nova (> 1min de diferença para evitar flutuação)
                    if (serverUpdateTime > (lastDownloadTime + 60000)) {
                        console.log(`[Reader] Atualização detectada. Local: ${lastDownloadTime}, Server: ${serverUpdateTime}`);
                        shouldDownload = true;
                    }
                }

                if (shouldDownload) {
                    if (!currentBook.filePath) throw new Error("URL inválida.");
                    
                    // DELETA explícito para garantir que o SO não cacheie o arquivo antigo
                    if (fileInfo.exists) {
                        await FileSystem.deleteAsync(localUri, { idempotent: true });
                    }

                    console.log(`[Reader] Baixando: ${currentBook.filePath}`);
                    await FileSystem.downloadAsync(currentBook.filePath, localUri);
                    await AsyncStorage.setItem(`@book_download_date:${bookId}`, Date.now().toString());
                }

                // 3. Leitura Base64
                const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
                setBookBase64(base64);

                // 4. Preferências e Progresso (Unificado)
                const [savedSize, savedTheme, remoteHighlights] = await Promise.all([
                    AsyncStorage.getItem('@reader_fontsize'),
                    AsyncStorage.getItem('@reader_theme'),
                    highlightService.getByBook(bookId).catch(() => [] as Highlight[]),
                ]);

                if (savedSize) {
                    const size = parseInt(savedSize);
                    setFontSize(size);
                    fontSizeSv.value = size;
                }
                if (savedTheme) setCurrentTheme(savedTheme as any);

                // LÓGICA DE PROGRESSO CORRIGIDA:
                // 1. Tenta pegar do Store Local (mais rápido e garantido após restart)
                const localCfi = getStoreProgress(bookId);
                
                // 2. Se não tiver local, tenta pegar do Servidor (currentBook.currentLocation)
                // 3. Se não tiver nada, começa do início (null)
                const targetCfi = localCfi || currentBook.currentLocation || null;

                console.log(`[Reader] Iniciando em: ${targetCfi ? 'Ponto Salvo' : 'Capa'}`);
                setInitialLocation(targetCfi);

                setHighlights(remoteHighlights);

                setLastRead({
                    id: bookId,
                    title: currentBook.title,
                    author: currentBook.author || 'Autor Desconhecido',
                    progress: currentBook.progress || 0, 
                    coverUrl: currentBook.coverUrl,
                    updatedAt: new Date(currentBook.updatedAt).getTime()
                });

                // Libera para receber eventos de progresso após 1.5 segundo de "render time"
                setTimeout(() => { isReadyRef.current = true; }, 1500);

            } catch (error: any) {
                console.error("Erro Load:", error);
                Alert.alert("Erro", "Falha ao carregar livro.");
                router.back();
            } finally { 
                setIsLoading(false); 
            }
        };
        load();
    }, [bookId]);

    // ACTIONS
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
                    // Só aceita atualizações de progresso se o livro estiver totalmente carregado e a trava liberada
                    if (!isReadyRef.current) return;

                    if (typeof data.percentage === 'number') { 
                        const pct = data.percentage;
                        setProgress(pct);
                        latestProgressRef.current = { cfi: data.cfi, pct };
                        
                        // Atualiza na Store Global (Persistida automaticamente)
                        updateGlobalProgress(bookId, data.cfi, pct * 100);

                        // Debounce para API
                        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                        syncTimeoutRef.current = setTimeout(() => {
                            syncProgress(bookId, data.cfi, pct);
                        }, 2000);
                    }
                    break;
                case 'TOC': 
                    setToc(flattenToc(data.toc)); 
                    break;
                case 'TOC_PREVIEWS': 
                    setTocPreviews(prev => ({ ...prev, ...data.data }));
                    break;
                case 'SELECTION': 
                    setSelection({ 
                        cfiRange: data.cfiRange, 
                        text: data.text,
                        y: data.y || 0.5 
                    }); 
                    setMenuVisible(false); 
                    break;
                case 'TOGGLE_UI': 
                    toggleMenu(); 
                    break;
                case 'HIGHLIGHT_CLICKED': 
                    setMenuVisible(true); 
                    setMenuExpanded(true); 
                    setActiveTab('highlights'); 
                    break;
                case 'LOG': 
                    console.log("[WebView Log]", data.msg); 
                    break;
            }
        } catch (e) {}
    }, [bookId, menuVisible, fontSize]);

    const onWebViewLoaded = () => {
        webviewRef.current?.injectJavaScript(LOCATION_GENERATION_SCRIPT);
        webviewRef.current?.injectJavaScript(TOC_PREVIEW_SCRIPT);
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

    // Adicionar Destaque com Cor
    const addHighlight = async (color: string) => {
         if (!selection) return;
         
         const tempId = Math.random().toString(36).substr(2, 9);
         const newH = { id: tempId, cfiRange: selection.cfiRange, text: selection.text, color };
         
         setHighlights(prev => [...prev, newH]);
         
         const className = `highlight-${color}`;
         
         // Injeta no WebView e limpa a seleção
         webviewRef.current?.injectJavaScript(`
             window.rendition.annotations.add('highlight', '${selection.cfiRange}', {}, null, '${className}');
             window.clearSelection(); 
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
        state: { 
            isLoading, 
            bookBase64, 
            initialLocation, 
            highlights, 
            toc, 
            tocPreviews,
            fontSize, 
            currentTheme, 
            selection, 
            menuVisible, 
            menuExpanded, 
            activeTab, 
            progress, 
            bookMeta 
        },
        actions: { 
            setMenuVisible, 
            setMenuExpanded, 
            setActiveTab, 
            toggleMenu, 
            changeTheme, 
            changeFontSize, 
            goToChapter, 
            nextPage, 
            prevPage, 
            addHighlight, 
            removeHighlight, 
            handleMessage, 
            setSelection, 
            onWebViewLoaded 
        },
        refs: { webviewRef },
        gestures: { pinchGesture }
    };
}