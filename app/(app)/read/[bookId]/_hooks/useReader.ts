import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { fileManager } from 'lib/files';
import { syncProgress, highlightService, Highlight } from 'lib/api';

// Definição dos Temas
export const THEMES = {
    dark: { name: 'Escuro', bg: '#09090b', text: '#e4e4e7', ui: 'dark' },
    light: { name: 'Claro', bg: '#ffffff', text: '#000000', ui: 'light' },
    sepia: { name: 'Sépia', bg: '#f6f1d1', text: '#5f4b32', ui: 'light' }
};

export function useReader(bookId: string) {
    const router = useRouter();
    const webviewRef = useRef<WebView>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Estados de Dados do Livro ---
    const [isLoading, setIsLoading] = useState(true);
    const [bookBase64, setBookBase64] = useState<string | null>(null);
    const [initialLocation, setInitialLocation] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [toc, setToc] = useState<any[]>([]);

    // --- Estados de UI e Configuração ---
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuExpanded, setMenuExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'chapters' | 'highlights'>('settings');
    
    const [fontSize, setFontSize] = useState(100);
    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
    
    // Texto Selecionado (para criar destaque)
    const [selection, setSelection] = useState<{ cfiRange: string; text: string } | null>(null);

    // --- 1. Inicialização e Carregamento ---
    useEffect(() => {
        if (!bookId) { router.back(); return; }

        const load = async () => {
            try {
                // 1. Carregar Configurações Salvas
                const savedSize = await AsyncStorage.getItem('@reader_fontsize');
                const savedTheme = await AsyncStorage.getItem('@reader_theme');
                if (savedSize) setFontSize(parseInt(savedSize));
                if (savedTheme) setCurrentTheme(savedTheme as any);

                // 2. Verificar Arquivo do Livro
                const exists = await fileManager.checkBookExists(bookId);
                if (!exists) throw new Error("Livro não encontrado no dispositivo.");

                const uri = fileManager.getLocalBookUri(bookId);
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                setBookBase64(base64);

                // 3. Carregar Progresso e Destaques
                const savedCfi = await AsyncStorage.getItem(`@progress:${bookId}`);
                if (savedCfi) setInitialLocation(savedCfi);

                try {
                    const remoteHighlights = await highlightService.getByBook(bookId);
                    setHighlights(remoteHighlights);
                } catch (e) { console.log("Offline: Usando destaques locais ou vazio."); }

            } catch (error) {
                Alert.alert("Erro", "Falha ao carregar o livro.");
                router.back();
            } finally {
                setIsLoading(false);
            }
        };
        load();
        
        // Cleanup do timeout de sync
        return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
    }, [bookId]);

    // --- 2. Comunicação com WebView (Eventos) ---
    const handleMessage = useCallback((event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            switch(data.type) {
                case 'LOC':
                    // Salvar progresso com Debounce
                    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                    syncTimeoutRef.current = setTimeout(() => {
                        syncProgress(bookId, data.cfi, data.percentage);
                        AsyncStorage.setItem(`@progress:${bookId}`, data.cfi);
                        if(data.percentage > 0) AsyncStorage.setItem(`@percent:${bookId}`, data.percentage.toString());
                    }, 1500);
                    break;
                case 'TOC': 
                    setToc(data.toc); 
                    break;
                case 'SELECTION': 
                    setSelection({ cfiRange: data.cfiRange, text: data.text }); 
                    setMenuVisible(false); // Esconde menu principal se aparecer seleção
                    break;
                case 'TOGGLE_UI': 
                    toggleMenu(); 
                    break;
                case 'HIGHLIGHT_CLICKED': 
                    // Abre aba de destaques e expande menu para facilitar remoção
                    setMenuVisible(true);
                    setMenuExpanded(true);
                    setActiveTab('highlights');
                    break;
                case 'LOG':
                    console.log('[WebView Log]', data.msg);
                    break;
            }
        } catch (e) {}
    }, [bookId, menuVisible]);

    // --- 3. Ações de UI e Navegação ---

    const toggleMenu = () => {
        if (menuVisible) {
            // Se aberto, fecha tudo
            setMenuVisible(false);
            setMenuExpanded(false);
        } else {
            // Se fechado, abre minimizado
            setMenuVisible(true);
            setMenuExpanded(false);
        }
    };

    const changeTheme = async (theme: 'dark' | 'light' | 'sepia') => {
        setCurrentTheme(theme);
        await AsyncStorage.setItem('@reader_theme', theme);
        webviewRef.current?.injectJavaScript(`window.applyTheme(${JSON.stringify(THEMES[theme])});`);
    };

    const changeFontSize = async (delta: number) => {
        // Limita entre 50% e 200%
        const newSize = Math.max(50, Math.min(200, fontSize + delta));
        setFontSize(newSize);
        await AsyncStorage.setItem('@reader_fontsize', newSize.toString());
        // Chama o helper que criamos no HTML Generator
        webviewRef.current?.injectJavaScript(`window.setFontSize(${newSize});`);
    };

    const goToChapter = (href: string) => {
        webviewRef.current?.injectJavaScript(`window.rendition.display('${href}');`);
        setMenuVisible(false);
        setMenuExpanded(false);
    };

    const nextPage = () => webviewRef.current?.injectJavaScript('window.rendition.next()');
    const prevPage = () => webviewRef.current?.injectJavaScript('window.rendition.prev()');

    // --- 4. Gerenciamento de Destaques ---

    const addHighlight = async (color: string) => {
        if (!selection) return;
        
        const tempId = Math.random().toString(36).substr(2, 9);
        const newH = { id: tempId, cfiRange: selection.cfiRange, text: selection.text, color };
        
        // Atualiza estado local (otimista)
        setHighlights(prev => [...prev, newH]);
        
        // Injeta na WebView
        webviewRef.current?.injectJavaScript(`
            window.rendition.annotations.add('highlight', '${selection.cfiRange}', {}, null, 'hl-${tempId}');
            window.getSelection().removeAllRanges();
        `);
        
        setSelection(null);

        // Salva na API
        try { await highlightService.create(bookId, selection.cfiRange, selection.text, color); } 
        catch(e) { console.error("Erro ao salvar destaque online"); }
    };

    const removeHighlight = async (cfiRange: string, id: string) => {
        // Remove visualmente
        webviewRef.current?.injectJavaScript(`window.rendition.annotations.remove('${cfiRange}', 'highlight');`);
        
        // Remove do estado
        setHighlights(prev => prev.filter(h => h.id !== id));
        
        // Remove da API
        try { await highlightService.delete(id); } catch(e) {}
    };

    return {
        state: { 
            isLoading, bookBase64, initialLocation, highlights, toc, 
            fontSize, currentTheme, selection,
            menuVisible, menuExpanded, activeTab
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
            setSelection 
        },
        refs: { webviewRef }
    };
}