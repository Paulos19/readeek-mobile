import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, SafeAreaView, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Text, TouchableOpacity, StatusBar, TextInput, Modal, Pressable, Image, Alert 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, CheckCircle2, AlertCircle, Edit3, Save, Sparkles, X, Check, BookOpen, Trash2 } from 'lucide-react-native';
import { api } from '../../../../../lib/api'; 
import { EditorToolbar, ThemeType } from './_components/EditorToolbar';

// URL base pública onde estão os arquivos .dic (na pasta public/dictionaries do Next.js)
const DICT_BASE_URL = "https://readeek.vercel.app/dictionaries"; 

const createHTML = (initialContent: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Courier+Prime&family=Crimson+Text:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,300;0,700;1,300&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">

        <style>
            html, body { height: 100%; margin: 0; padding: 0; }
            
            /* Variáveis de Cores */
            .theme-dark { --text: #e4e4e7; --ph: #52525b; --border: #333; }
            .theme-light { --text: #18181b; --ph: #a1a1aa; --border: #e4e4e7; }
            .theme-sepia { --text: #433422; --ph: #9c8ba9; --border: #eaddc5; }

            :root {
                --font: 'Merriweather', serif; /* Valor padrão */
            }

            body { 
                background-color: transparent; 
                color: var(--text); 
                
                /* USO DA FONTE DINÂMICA */
                font-family: var(--font); 
                
                padding: 20px; padding-bottom: 80px;
                font-size: 18px; line-height: 1.6;
                transition: color 0.3s ease, font-family 0.3s ease;
            }
            
            /* Ajuste para Wallpaper */
            body.has-wallpaper { text-shadow: 0px 1px 2px rgba(0,0,0,0.8); }
            body.has-wallpaper h2 { border-color: rgba(255,255,255,0.3) !important; }

            /* CORREÇÃO #1: Parágrafos não colapsam */
            p { 
                margin-bottom: 1em; 
                min-height: 1.5em; /* Garante altura mesmo vazio */
            }
            
            /* CORREÇÃO #3: Estilo do erro visível */
            .misspelled { 
                border-bottom: 3px wavy #ef4444; 
                cursor: pointer; 
                background-color: rgba(239, 68, 68, 0.1);
            }

            #editor { outline: none; min-height: 80vh; white-space: pre-wrap; }
            #editor:empty:before {
                content: 'Comece a escrever aqui...';
                color: var(--ph); opacity: 0.5; pointer-events: none; display: block;
            }
            
            h1 { font-size: 1.8em; font-weight: 800; margin-top: 1.2em; margin-bottom: 0.5em; line-height: 1.2; }
            h2 { font-size: 1.4em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
            h3 { font-size: 1.1em; font-weight: 600; margin-top: 1em; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
            blockquote { border-left: 4px solid #10b981; margin: 1em 0; padding-left: 1em; font-style: italic; opacity: 0.8; background: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 4px; }
            ul, ol { padding-left: 1.2em; margin-bottom: 1em; }
            li { margin-bottom: 0.5em; }
            b, strong { font-weight: bold; }
        </style>
    </head>
    <body class="theme-dark">
        <div id="editor" contenteditable="true" spellcheck="false">${initialContent || '<p><br></p>'}</div>
        <script>
            const editor = document.getElementById('editor');
            editor.spellcheck = false; // Desativa corretor nativo
            
            // Garante comportamento de parágrafo no Enter
            document.execCommand('defaultParagraphSeparator', false, 'p');
            
            let wordSet = new Set();
            let customWords = new Set();
            let checkTimeout;

            // --- 1. CARREGAMENTO LEVE (Lista de Palavras) ---
            async function loadDictionary() {
                try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', message: 'Iniciando Dicionário...' }));
                    
                    // Baixa apenas o .dic (palavras) - Muito mais leve que .aff
                    const response = await fetch('${DICT_BASE_URL}/pt_BR.dic');
                    if (!response.ok) throw new Error("Erro HTTP ao baixar dicionário");
                    
                    const text = await response.text();
                    
                    // Parse Rápido
                    const lines = text.split('\\n');
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line) {
                            // Remove flags de conjugação (ex: "amar/v") -> pega só "amar"
                            const word = line.split('/')[0];
                            wordSet.add(word);
                        }
                    }

                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DICT_LOADED' }));
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_USER_DICT' }));
                    
                    // Primeira verificação
                    setTimeout(scanAndHighlight, 1000);

                } catch(e) { 
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DICT_ERROR', message: e.message }));
                }
            }
            loadDictionary();

            // --- 2. GERENCIAMENTO DE CURSOR ---
            function saveSelection() {
                const sel = window.getSelection();
                if (!sel.rangeCount) return null;
                const range = sel.getRangeAt(0);
                const preSelectionRange = range.cloneRange();
                preSelectionRange.selectNodeContents(editor);
                preSelectionRange.setEnd(range.startContainer, range.startOffset);
                return preSelectionRange.toString().length;
            }

            function restoreSelection(savedPos) {
                if (savedPos === null) return;
                const range = document.createRange();
                range.setStart(editor, 0);
                range.collapse(true);
                const nodeStack = [editor];
                let node, foundStart = false, charCount = 0;

                while (!foundStart && (node = nodeStack.pop())) {
                    if (node.nodeType === 3) {
                        const nextCharCount = charCount + node.length;
                        if (!foundStart && savedPos >= charCount && savedPos <= nextCharCount) {
                            range.setStart(node, savedPos - charCount);
                            range.collapse(true);
                            foundStart = true;
                        }
                        charCount = nextCharCount;
                    } else {
                        let i = node.childNodes.length;
                        while (i--) nodeStack.push(node.childNodes[i]);
                    }
                }
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }

            // --- 3. CORE: VERIFICAÇÃO ORTOGRÁFICA (SCAN) ---
            function scanAndHighlight() {
                if (wordSet.size === 0) return;

                const savedPos = saveSelection();

                // Remove spans antigos (limpa para re-verificar)
                const spans = editor.querySelectorAll('span.misspelled');
                spans.forEach(span => {
                    const parent = span.parentNode;
                    parent.replaceChild(document.createTextNode(span.innerText), span);
                    parent.normalize();
                });

                const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
                let node;
                const nodesToProcess = [];
                while(node = walker.nextNode()) nodesToProcess.push(node);

                // Regex para palavras (inclui acentos)
                const wordRegex = /[a-zA-ZÀ-ÿ]+/g;

                nodesToProcess.forEach(textNode => {
                    const text = textNode.nodeValue;
                    const matches = [];
                    let match;
                    
                    while ((match = wordRegex.exec(text)) !== null) {
                        const word = match[0];
                        // Regra: > 2 letras, não está no set, não é custom, não é minúsculo válido
                        if (word.length > 2 && !wordSet.has(word) && !customWords.has(word)) {
                            if (!wordSet.has(word.toLowerCase())) {
                                matches.push({ word, index: match.index });
                            }
                        }
                    }

                    if (matches.length > 0) {
                        const fragment = document.createDocumentFragment();
                        let lastIndex = 0;
                        matches.forEach(m => {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex, m.index)));
                            
                            const span = document.createElement('span');
                            span.className = 'misspelled';
                            span.innerText = m.word;
                            fragment.appendChild(span);

                            lastIndex = m.index + m.word.length;
                        });
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                        textNode.parentNode.replaceChild(fragment, textNode);
                    }
                });

                restoreSelection(savedPos);
            }

            // --- 4. CORREÇÃO #4: SUBSTITUIÇÃO CORRETA ---
            function replaceWord(newWord) {
                // Como já selecionamos a palavra no evento de click,
                // basta executar o comando de substituição sobre a seleção
                document.execCommand('insertText', false, newWord);
                
                // Força atualização e remove o vermelho
                sendContent();
                setTimeout(scanAndHighlight, 100);
            }

            // --- EVENTOS ---
            editor.addEventListener('input', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTENT_CHANGE', content: editor.innerHTML }));
                
                // Debounce: Verifica 1.5s após parar de digitar
                clearTimeout(checkTimeout);
                checkTimeout = setTimeout(scanAndHighlight, 1500); 
            });

            // CLIQUE NO ERRO
            editor.addEventListener('click', (e) => {
                if (e.target.classList.contains('misspelled')) {
                    const word = e.target.innerText;
                    
                    // CORREÇÃO #4: Seleciona a palavra inteira visualmente
                    // Isso garante que o replaceWord substitua tudo
                    const range = document.createRange();
                    range.selectNode(e.target);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);

                    // Pede sugestão ao App (que chama a IA)
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'WORD_ERROR_CLICKED', 
                        word: word
                    }));
                }
            });

            // --- HELPERS ---
            function sendContent() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTENT_CHANGE', content: editor.innerHTML }));
            }

            function applyConfig(data) {
                if (data.theme) { document.body.className = ''; document.body.classList.add('theme-' + data.theme); }
                if (data.textColor) document.body.style.color = data.textColor;
                else document.body.style.color = '';
                if (data.hasWallpaper) document.body.classList.add('has-wallpaper');
                else document.body.classList.remove('has-wallpaper');
                
                // NOVO: APLICAR FONTE
                if (data.fontFamily) {
                    document.documentElement.style.setProperty('--font', data.fontFamily);
                }
            }

            function getSelectionText() {
                const text = window.getSelection().toString();
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECTION_TEXT', text: text }));
            }
            
            function loadUserWords(words) { words.forEach(w => customWords.add(w)); scanAndHighlight(); }
            function addToDict(word) { customWords.add(word); scanAndHighlight(); }

            // Listener de Mensagens
            document.addEventListener('message', handleMessage);
            window.addEventListener('message', handleMessage);

            function handleMessage(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.command === 'format') {
                        document.execCommand(data.value, false, data.args || null);
                        if (['h1','h2','h3','blockquote','p'].includes(data.value)) document.execCommand('formatBlock', false, data.value);
                    }
                    else if (data.command === 'setConfig') applyConfig(data);
                    else if (data.command === 'getSelection') getSelectionText();
                    else if (data.command === 'replaceSelection') { 
                        // IA Substituição de frase
                        document.execCommand('insertText', false, data.value);
                        sendContent();
                    }
                    else if (data.command === 'replaceWord') replaceWord(data.replacement);
                    else if (data.command === 'loadUserDict') loadUserWords(data.words);
                    else if (data.command === 'addToDict') addToDict(data.word);
                } catch(e) {}
            }
        </script>
    </body>
    </html>
    `;
};

// ... Imports ...

export default function ChapterEditor() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  
  // DADOS
  const [title, setTitle] = useState('');
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [content, setContent] = useState(''); 
  const [loading, setLoading] = useState(true);
  
  // STATUS
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved'|'editing'|'saving'|'error'>('saved');
  
  // ESTILOS (Persistentes)
  const [editorTheme, setEditorTheme] = useState<ThemeType>('dark');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [customTextColor, setCustomTextColor] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>("'Merriweather', serif");
  
  // Upload Imagem
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // IA & Dicionário
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  const [dictModalVisible, setDictModalVisible] = useState(false);
  const [misspelledWord, setMisspelledWord] = useState('');
  const [dictSuggestions, setDictSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const webViewRef = useRef<WebView>(null);
  // REF ATUALIZADA PARA AUTOSAVE (incluindo font)
  const lastSavedRef = useRef({ title: '', content: '', theme: 'dark', color: '', wallpaper: '', font: "'Merriweather', serif" });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. CARREGAR DADOS
  useEffect(() => { loadChapter(); }, [chapterId]);

  const loadChapter = async () => {
    try {
      const res = await api.get(`/mobile/writer/chapters/${chapterId}`);
      const data = res.data;
      setTitle(data.title);
      setInitialContent(data.content || '');
      setContent(data.content || '');
      
      if (data.theme) setEditorTheme(data.theme as ThemeType);
      if (data.wallpaperUrl) setBackgroundImage(data.wallpaperUrl);
      if (data.textColor) setCustomTextColor(data.textColor);
      if (data.fontFamily) setFontFamily(data.fontFamily);

      lastSavedRef.current = {
          title: data.title, content: data.content || '', theme: data.theme || 'dark', color: data.textColor || '', wallpaper: data.wallpaperUrl || '', font: data.fontFamily || "'Merriweather', serif"
      };
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // 2. TIMEOUT (Libera o editor se o dicionário demorar)
  useEffect(() => {
      const timeout = setTimeout(() => {
          if (!isEditorReady) setIsEditorReady(true);
      }, 10000); // 10 segundos max
      return () => clearTimeout(timeout);
  }, [isEditorReady]);

  // 3. SAVE TEXTO
  const saveTextChanges = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const payload = {
        title, content, theme: editorTheme, textColor: customTextColor, wallpaperUrl: backgroundImage,
        fontFamily // Enviando fonte
      };
      await api.patch(`/mobile/writer/chapters/${chapterId}`, payload);
      lastSavedRef.current = { ...lastSavedRef.current, title, content, theme: editorTheme, color: customTextColor, font: fontFamily };
      setSaveStatus('saved');
    } catch { setSaveStatus('error'); }
  }, [title, content, editorTheme, customTextColor, backgroundImage, fontFamily, chapterId]);

  // 4. UPLOAD IMAGEM
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) { setPendingImageUri(result.assets[0].uri); setConfirmModalVisible(true); }
  };

  const confirmUploadImage = async () => {
    if (!pendingImageUri) return;
    setConfirmModalVisible(false); setIsUploadingImage(true); setBackgroundImage(pendingImageUri);
    try {
        const formData = new FormData();
        const filename = pendingImageUri.split('/').pop() || 'bg.jpg';
        // @ts-ignore
        formData.append('file', { uri: pendingImageUri, name: filename, type: 'image/jpeg' });
        const uploadRes = await api.post(`/mobile/writer/upload?filename=${filename}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const persistentUrl = uploadRes.data.url;
        setBackgroundImage(persistentUrl);
        await api.patch(`/mobile/writer/chapters/${chapterId}`, { wallpaperUrl: persistentUrl });
        lastSavedRef.current.wallpaper = persistentUrl;
    } catch { Alert.alert("Erro", "Falha no upload."); setBackgroundImage(lastSavedRef.current.wallpaper || null); }
    finally { setIsUploadingImage(false); setPendingImageUri(null); }
  };

  const handleRemoveImage = async () => {
      setBackgroundImage(null);
      await api.patch(`/mobile/writer/chapters/${chapterId}`, { wallpaperUrl: null });
      lastSavedRef.current.wallpaper = '';
  };

  // 5. AUTO-SAVE
  useEffect(() => {
    if (loading || initialContent === null) return;
    const hasChanges = content !== lastSavedRef.current.content || title !== lastSavedRef.current.title || editorTheme !== lastSavedRef.current.theme || customTextColor !== lastSavedRef.current.color || fontFamily !== lastSavedRef.current.font;
    if (hasChanges) {
      setSaveStatus('editing');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveTextChanges, 2000);
    }
  }, [content, title, editorTheme, customTextColor, fontFamily, loading, saveTextChanges]);

  // 6. SINCRONIA VISUAL (CSS)
  useEffect(() => {
    if (!loading && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
            command: 'setConfig', theme: editorTheme, textColor: customTextColor, hasWallpaper: !!backgroundImage, 
            fontFamily: fontFamily
        }));
    }
  }, [editorTheme, customTextColor, backgroundImage, fontFamily, loading]);

  // 7. HANDLERS WEBVIEW
  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        
        if (data.type === 'LOG') console.log('[WebView]', data.message);
        
        else if (data.type === 'DICT_LOADED' || data.type === 'DICT_ERROR') setIsEditorReady(true);
        
        else if (data.type === 'CONTENT_CHANGE') setContent(data.content); 
        else if (data.type === 'SELECTION_CHANGE') setActiveFormats(data.formats);
        
        // CORREÇÃO #2: IA (Recebe texto selecionado)
        else if (data.type === 'SELECTION_TEXT') {
            if (data.text && data.text.trim().length > 0) { 
                setSelectedText(data.text); 
                setAiModalVisible(true);
                handleLaunchAi(data.text); // Chama API direto
            }
            else Alert.alert("Aviso", "Selecione um texto para usar a IA.");
        }
        
        // Dicionário
        else if (data.type === 'REQUEST_USER_DICT') loadUserDictionary();
        else if (data.type === 'WORD_ERROR_CLICKED') {
            handleDictionaryCheck(data.word);
        }
    } catch {}
  };

  const loadUserDictionary = async () => {
      try {
          const res = await api.get('/mobile/writer/dictionary');
          webViewRef.current?.postMessage(JSON.stringify({ command: 'loadUserDict', words: res.data.words }));
      } catch {}
  };

  // BUSCA SUGESTÕES NA IA (Para não pesar o app) - CORRIGIDO
  const handleDictionaryCheck = async (word: string) => {
      // Limpa a palavra de pontuações (defensivo)
      const cleanWord = word.trim().replace(/[.,;!?"]+$/, "");
      
      setMisspelledWord(cleanWord);
      setDictSuggestions([]);
      setDictModalVisible(true);
      setLoadingSuggestions(true);

      try {
          // ENVIA MODO LOOKUP PARA O BACKEND
          const res = await api.post('/mobile/writer/ai/fix', { 
              text: cleanWord,
              mode: 'lookup' 
          });
          
          if (res.data.suggestions && Array.isArray(res.data.suggestions)) {
              // Filtra sugestões idênticas à palavra original
              const uniqueSuggestions = res.data.suggestions.filter((s: string) => s.toLowerCase() !== cleanWord.toLowerCase());
              setDictSuggestions(uniqueSuggestions.length > 0 ? uniqueSuggestions : [res.data.corrected].filter(Boolean));
          }
          else if (res.data.corrected) {
              setDictSuggestions([res.data.corrected]);
          }
          else {
              setDictSuggestions([]);
          }

      } catch (e) {
          console.error(e);
          setDictSuggestions(["Erro ao carregar"]);
      } finally {
          setLoadingSuggestions(false);
      }
  };

  const addToDictionary = async () => {
      try {
          await api.post('/mobile/writer/dictionary', { word: misspelledWord });
          webViewRef.current?.postMessage(JSON.stringify({ command: 'addToDict', word: misspelledWord }));
          setDictModalVisible(false);
      } catch { Alert.alert("Erro", "Falha ao salvar."); }
  };

  // Substituição de Palavra (Dicionário)
  const replaceWord = (newWord: string) => {
      webViewRef.current?.postMessage(JSON.stringify({ command: 'replaceWord', replacement: newWord }));
      setDictModalVisible(false);
  };

  // Substituição de Texto (IA)
  const applyCorrection = () => {
      if (aiSuggestion?.corrected) {
          webViewRef.current?.postMessage(JSON.stringify({ command: 'replaceSelection', value: aiSuggestion.corrected }));
          setAiModalVisible(false);
      }
  };

  // Trigger Toolbar IA
  const requestAiFix = () => {
      webViewRef.current?.postMessage(JSON.stringify({ command: 'getSelection' }));
  };

  const handleLaunchAi = async (textToFix: string) => {
      setAiLoading(true); setAiSuggestion(null);
      try {
          const res = await api.post('/mobile/writer/ai/fix', { text: textToFix });
          if(res.data.error) throw new Error(res.data.error);
          setAiSuggestion(res.data);
      } catch (e: any) { 
          Alert.alert("Erro IA", "Falha na conexão.\n" + e.message);
          setAiSuggestion({ error: true }); 
      } finally { setAiLoading(false); }
  };

  const handleFormat = (type: string) => {
      let command = type;
      if (['h1','h2','h3','blockquote'].includes(type)) command = activeFormats.includes(type) ? 'p' : type;
      else if (['orderedList','unorderedList'].includes(type)) command = 'insert' + type.charAt(0).toUpperCase() + type.slice(1);
      webViewRef.current?.postMessage(JSON.stringify({ command: 'format', value: command }));
  };

  const htmlSource = useMemo(() => ({ html: initialContent ? createHTML(initialContent) : '' }), [initialContent]);

  const themeColors = {
      dark: { bg: 'bg-zinc-950', border: 'border-zinc-800', text: 'text-zinc-200' },
      light: { bg: 'bg-white', border: 'border-zinc-200', text: 'text-zinc-900' },
      sepia: { bg: 'bg-[#f4ecd8]', border: 'border-[#eaddc5]', text: 'text-[#5b4636]' }
  }[editorTheme];
  const uiTextColor = backgroundImage ? 'text-white' : themeColors.text;
  const headerBg = backgroundImage ? 'bg-transparent border-transparent' : `${themeColors.bg} ${themeColors.border}`;

  if (loading || initialContent === null) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#10b981" /></View>;

  return (
    <View className={`flex-1 ${!backgroundImage ? themeColors.bg : 'bg-black'}`}>
      <StatusBar barStyle={backgroundImage ? 'light-content' : (editorTheme === 'dark' ? 'light-content' : 'dark-content')} />
      {backgroundImage && <Image source={{ uri: backgroundImage }} className="absolute inset-0 w-full h-full opacity-80" resizeMode="cover" />}

      {/* HEADER */}
      <SafeAreaView style={{ zIndex: 10 }}>
          <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0 }} className={`px-4 pb-2 border-b flex-row justify-between items-center ${headerBg}`}>
            <TouchableOpacity onPress={() => router.back()} className={`p-2 -ml-2 rounded-full ${backgroundImage ? 'bg-black/30' : ''}`}>
                <ArrowLeft size={24} color={backgroundImage || editorTheme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
            <View className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full ${backgroundImage ? 'bg-black/40 backdrop-blur-md' : 'bg-black/5 dark:bg-white/10'}`}>
                {isUploadingImage ? <ActivityIndicator size={12} color="#fbbf24" /> : saveStatus === 'saved' ? <CheckCircle2 size={12} color="#34d399" /> : <Edit3 size={12} color="#fbbf24" />}
                <Text className={`text-[10px] uppercase font-bold ${backgroundImage ? 'text-white/90' : themeColors.text} opacity-70`}>
                    {isUploadingImage ? 'Enviando...' : saveStatus === 'editing' ? 'Editando...' : 'Salvo'}
                </Text>
            </View>
            <TouchableOpacity onPress={saveTextChanges} className={`p-2 rounded-full ${backgroundImage ? 'bg-black/30' : ''}`}>
                <Save size={20} color={backgroundImage || editorTheme === 'dark' ? '#fff' : '#000'} opacity={saveStatus === 'saved' ? 0.3 : 1} />
            </TouchableOpacity>
          </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1">
            <View className={`px-5 py-2 ${backgroundImage ? 'bg-transparent' : themeColors.bg}`}>
                <TextInput value={title} onChangeText={setTitle} placeholder="Título do Capítulo" placeholderTextColor={backgroundImage || editorTheme === 'dark' ? '#52525b' : '#a1a1aa'} multiline style={backgroundImage ? { textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 } : {}} className={`text-xl font-bold font-serif ${uiTextColor}`} />
            </View>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={htmlSource}
                onLoadEnd={() => webViewRef.current?.postMessage(JSON.stringify({ command: 'setConfig', theme: editorTheme, textColor: customTextColor, hasWallpaper: !!backgroundImage, fontFamily: fontFamily }))}
                onMessage={handleWebViewMessage}
                style={{ backgroundColor: 'transparent', flex: 1 }}
                containerStyle={{ backgroundColor: 'transparent' }}
                showsVerticalScrollIndicator={false}
                overScrollMode="never"
                hideKeyboardAccessoryView={true}
            />
        </View>
        <EditorToolbar 
          onFormat={handleFormat} 
          activeFormats={activeFormats} 
          onThemeChange={setEditorTheme} 
          currentTheme={editorTheme} 
          onAiFix={requestAiFix} 
          onPickImage={pickImage} 
          onRemoveImage={handleRemoveImage} 
          backgroundImage={backgroundImage} 
          onTextColorChange={setCustomTextColor} 
          customTextColor={customTextColor}
          onFontChange={setFontFamily}
          currentFont={fontFamily}
        />
      </KeyboardAvoidingView>

      {/* --- MODAIS --- */}
      
      {/* 1. LOADING (Bloqueia até dicionário carregar) */}
      <Modal visible={!isEditorReady} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-zinc-300 mt-4 font-medium text-sm">Carregando Estúdio...</Text>
            <Text className="text-zinc-500 text-xs mt-1">Baixando dicionários</Text>
        </View>
      </Modal>

      {/* 2. CONFIRMAÇÃO IMAGEM */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
            <View className="bg-zinc-900 w-full rounded-2xl border border-zinc-700 overflow-hidden">
                <View className="h-48 w-full bg-zinc-800">{pendingImageUri && <Image source={{ uri: pendingImageUri }} className="w-full h-full" resizeMode="cover" />}</View>
                <View className="p-6">
                    <Text className="text-white text-lg font-bold text-center mb-2">Usar Imagem?</Text>
                    <View className="flex-row gap-3 mt-4">
                        <TouchableOpacity onPress={() => setConfirmModalVisible(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl items-center"><Text className="text-zinc-300">Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity onPress={confirmUploadImage} className="flex-1 py-3 bg-emerald-600 rounded-xl items-center"><Text className="text-white font-bold">Confirmar</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
      </Modal>

      {/* 3. DICIONÁRIO (Ao clicar no erro) */}
      <Modal visible={dictModalVisible} transparent animationType="slide" onRequestClose={() => setDictModalVisible(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setDictModalVisible(false)}>
            <View className={`p-6 rounded-t-3xl shadow-xl ${editorTheme === 'light' ? 'bg-white' : 'bg-zinc-900'} border-t border-zinc-700`}>
                <View className="flex-row items-center gap-2 mb-4"><BookOpen size={20} color="#f472b6" /><Text className={`font-bold text-lg ${themeColors.text}`}>Ortografia</Text></View>
                <Text className="text-red-500 font-bold text-2xl line-through mb-4 text-center">{misspelledWord}</Text>
                
                {loadingSuggestions ? <ActivityIndicator color="#f472b6" className="py-4" /> : dictSuggestions.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2 mb-6 justify-center">
                        {dictSuggestions.map(s => (
                            <TouchableOpacity key={s} onPress={() => replaceWord(s)} className="bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700"><Text className="text-emerald-400 font-medium">{s}</Text></TouchableOpacity>
                        ))}
                    </View>
                ) : <Text className="text-zinc-500 text-center mb-6">Nenhuma sugestão (IA)</Text>}
                
                <TouchableOpacity onPress={addToDictionary} className="bg-zinc-800 p-4 rounded-xl flex-row justify-center gap-2"><Check size={20} color="#e4e4e7" /><Text className="text-zinc-200">Adicionar ao Dicionário</Text></TouchableOpacity>
            </View>
        </Pressable>
      </Modal>

      {/* 4. REVISOR IA (Texto Selecionado) */}
      <Modal visible={aiModalVisible} transparent animationType="slide" onRequestClose={() => setAiModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <Pressable className="flex-1 bg-black/60" onPress={() => setAiModalVisible(false)} />
            <View className={`p-6 rounded-t-3xl shadow-xl ${editorTheme === 'light' ? 'bg-white' : 'bg-zinc-900'} border-t border-zinc-700`}>
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2"><Sparkles size={18} color="#818cf8" /><Text className={`font-bold text-lg ${themeColors.text}`}>Revisor IA</Text></View>
                    <TouchableOpacity onPress={() => setAiModalVisible(false)}><X size={24} color="#71717a" /></TouchableOpacity>
                </View>
                {aiLoading ? <ActivityIndicator size="large" color="#818cf8" className="py-8" /> : (
                    <View>
                        <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">Original</Text>
                        <Text className={`text-base mb-4 opacity-60 ${themeColors.text}`} numberOfLines={3}>{selectedText}</Text>
                        <View className="h-[1px] bg-zinc-700/50 mb-4" />
                        <Text className="text-emerald-500 text-xs font-bold uppercase mb-2">Sugestão</Text>
                        <Text className={`text-lg font-medium mb-3 ${themeColors.text}`}>{aiSuggestion?.corrected || "Texto parece correto."}</Text>
                        <TouchableOpacity onPress={applyCorrection} disabled={!aiSuggestion?.corrected} className={`p-4 rounded-xl flex-row justify-center gap-2 ${!aiSuggestion?.corrected ? 'bg-zinc-700 opacity-50' : 'bg-emerald-600'}`}><Text className="text-white font-bold">Aplicar Correção</Text></TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}