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

// URL base para baixar os arquivos de dicionário (ajuste conforme seu deploy)
const DICT_BASE_URL = "https://readeek.vercel.app/dictionaries"; 

// --- TEMPLATE HTML POWER-UP (IA + Dicionário + Estilos) ---
const createHTML = (initialContent: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/typo-js@1.2.4/typo.min.js"></script>
        <style>
            html, body { height: 100%; margin: 0; padding: 0; }
            
            /* Temas */
            .theme-dark { --text: #e4e4e7; --ph: #52525b; --border: #333; }
            .theme-light { --text: #18181b; --ph: #a1a1aa; --border: #e4e4e7; }
            .theme-sepia { --text: #433422; --ph: #9c8ba9; --border: #eaddc5; }

            body { 
                background-color: transparent; 
                color: var(--text); 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                padding: 20px; padding-bottom: 80px;
                font-size: 18px; line-height: 1.6;
                transition: color 0.3s ease;
            }
            
            /* Utilitários */
            body.has-wallpaper { text-shadow: 0px 1px 2px rgba(0,0,0,0.8); }
            body.has-wallpaper h2 { border-color: rgba(255,255,255,0.3) !important; }
            
            /* Erro Ortográfico */
            .misspelled { border-bottom: 2px wavy #ef4444; cursor: pointer; }

            #editor { outline: none; min-height: 80vh; }
            #editor:empty:before {
                content: 'Comece a escrever aqui...';
                color: var(--ph); opacity: 0.5; pointer-events: none; display: block;
            }
            p { margin-bottom: 1em; min-height: 1em; }
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
        <div id="editor" contenteditable="true">${initialContent || '<p><br></p>'}</div>
        <script>
            const editor = document.getElementById('editor');
            document.execCommand('defaultParagraphSeparator', false, 'p');
            
            let dictionary = null;
            let customWords = new Set();

            // --- DICIONÁRIO ---
            async function loadDictionary() {
                try {
                    const aff = await fetch('${DICT_BASE_URL}/pt_BR.aff').then(r => r.text());
                    const dic = await fetch('${DICT_BASE_URL}/pt_BR.dic').then(r => r.text());
                    dictionary = new Typo("pt_BR", aff, dic);
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_USER_DICT' }));
                } catch(e) { console.log('Dict load error', e); }
            }
            loadDictionary();

            // Interação de Clique para Ortografia
            editor.addEventListener('click', (e) => {
                const s = window.getSelection();
                if (s.isCollapsed && dictionary) {
                    s.modify('move', 'forward', 'character');
                    s.modify('move', 'backward', 'word');
                    s.modify('extend', 'forward', 'word');
                    let word = s.toString().trim().replace(/[.,/#!$%^&*;:{}=\\-_'\\"\`~()]/g,"");
                    
                    // Se a palavra existe, não é vazia e o dicionário diz que está errada
                    if (word && !dictionary.check(word) && !customWords.has(word)) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ 
                            type: 'WORD_CLICKED', 
                            word: word,
                            suggestions: dictionary.suggest(word)
                        }));
                    }
                    s.collapseToEnd(); // Remove seleção
                }
            });

            // --- ESTILOS E COMUNICAÇÃO ---
            const sendContent = () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTENT_CHANGE', content: editor.innerHTML }));
            };

            function applyConfig(data) {
                if (data.theme) { document.body.className = ''; document.body.classList.add('theme-' + data.theme); }
                if (data.textColor) document.body.style.color = data.textColor;
                else document.body.style.color = '';
                if (data.hasWallpaper) document.body.classList.add('has-wallpaper');
                else document.body.classList.remove('has-wallpaper');
            }

            // Funções Auxiliares
            function getSelectionText() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECTION_TEXT', text: window.getSelection().toString() }));
            }
            function replaceSelection(newText) {
                document.execCommand('insertText', false, newText);
                sendContent();
            }
            function loadUserWords(words) { words.forEach(w => customWords.add(w)); }
            function addToDict(word) { customWords.add(word); }
            function replaceWord(oldWord, newWord) {
                // Tenta selecionar a palavra errada e substituir (simples)
                // Numa implementação real, usaríamos Ranges salvos
                document.execCommand('insertText', false, newWord);
                sendContent();
            }

            editor.addEventListener('input', sendContent);
            document.addEventListener('selectionchange', () => {
                // Lógica de active formats
                const formats = [];
                if (document.queryCommandState('bold')) formats.push('bold');
                if (document.queryCommandState('italic')) formats.push('italic');
                if (document.queryCommandState('underline')) formats.push('underline');
                const blockValue = document.queryCommandValue('formatBlock');
                if (blockValue) formats.push(blockValue.toLowerCase());
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECTION_CHANGE', formats: formats }));
            });

            document.addEventListener('message', (e) => handleMessage(e));
            window.addEventListener('message', (e) => handleMessage(e));

            function handleMessage(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.command === 'format') {
                        document.execCommand(data.value, false, data.args || null);
                        if (['h1','h2','h3','blockquote','p'].includes(data.value)) document.execCommand('formatBlock', false, data.value);
                    }
                    else if (data.command === 'setConfig') applyConfig(data);
                    else if (data.command === 'getSelection') getSelectionText();
                    else if (data.command === 'replaceSelection') replaceSelection(data.value);
                    else if (data.command === 'loadUserDict') loadUserWords(data.words);
                    else if (data.command === 'addToDict') addToDict(data.word);
                    else if (data.command === 'replaceWord') replaceWord(data.original, data.replacement);
                } catch(e) {}
            }
        </script>
    </body>
    </html>
    `;
};

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved' | 'editing';

export default function ChapterEditor() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  
  // DADOS
  const [title, setTitle] = useState('');
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [content, setContent] = useState(''); 
  const [loading, setLoading] = useState(true);
  
  // ESTILOS PERSISTENTES
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [editorTheme, setEditorTheme] = useState<ThemeType>('dark');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [customTextColor, setCustomTextColor] = useState<string>('');
  
  // CONTROLES
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // FEATURES (IA + DICIONÁRIO)
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  const [dictModalVisible, setDictModalVisible] = useState(false);
  const [misspelledWord, setMisspelledWord] = useState('');
  const [dictSuggestions, setDictSuggestions] = useState<string[]>([]);

  const webViewRef = useRef<WebView>(null);
  
  // Ref para controle de mudanças (Auto-Save)
  const lastSavedRef = useRef({ 
      title: '', content: '', theme: 'dark', color: '', wallpaper: '' 
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. CARREGAR DADOS
  useEffect(() => {
    loadChapter();
  }, [chapterId]);

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

      lastSavedRef.current = {
          title: data.title,
          content: data.content || '',
          theme: data.theme || 'dark',
          color: data.textColor || '',
          wallpaper: data.wallpaperUrl || ''
      };
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNÇÃO SAVE (Definida ANTES dos efeitos que a usam)
  const saveChapter = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await api.patch(`/mobile/writer/chapters/${chapterId}`, {
        title,
        content,
        theme: editorTheme,
        textColor: customTextColor,
        wallpaperUrl: backgroundImage // Envia o atual, se não estiver upando
      });
      
      lastSavedRef.current = {
          title, content, theme: editorTheme, color: customTextColor, wallpaper: backgroundImage || ''
      };
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  }, [title, content, editorTheme, customTextColor, backgroundImage, chapterId]);

  // 3. SINCRONIA VISUAL (CSS Injection)
  useEffect(() => {
    if (!loading && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
            command: 'setConfig',
            theme: editorTheme,
            textColor: customTextColor,
            hasWallpaper: !!backgroundImage
        }));
    }
  }, [editorTheme, customTextColor, backgroundImage, loading]);

  // 4. AUTO-SAVE TRIGGER
  useEffect(() => {
    if (loading || initialContent === null) return;

    const hasChanges = 
        content !== lastSavedRef.current.content || 
        title !== lastSavedRef.current.title ||
        editorTheme !== lastSavedRef.current.theme ||
        customTextColor !== lastSavedRef.current.color;

    if (hasChanges) {
      setSaveStatus('editing');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveChapter(), 2000);
    }
  }, [content, title, editorTheme, customTextColor, loading, saveChapter]);

  // 5. IMAGEM DE FUNDO (Upload)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 0.8, 
    });
    if (!result.canceled) {
        setPendingImageUri(result.assets[0].uri);
        setConfirmModalVisible(true);
    }
  };

  const confirmUploadImage = async () => {
    if (!pendingImageUri) return;
    setConfirmModalVisible(false);
    setIsUploadingImage(true);
    setBackgroundImage(pendingImageUri); // UI Otimista

    try {
        const formData = new FormData();
        const filename = pendingImageUri.split('/').pop() || 'bg.jpg';
        // @ts-ignore
        formData.append('file', { uri: pendingImageUri, name: filename, type: 'image/jpeg' });

        const uploadRes = await api.post(`/mobile/writer/upload?filename=${filename}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        const persistentUrl = uploadRes.data.url;
        setBackgroundImage(persistentUrl);
        // Persiste URL imediatamente
        await api.patch(`/mobile/writer/chapters/${chapterId}`, { wallpaperUrl: persistentUrl });
        lastSavedRef.current.wallpaper = persistentUrl;

    } catch (error) {
        Alert.alert("Erro", "Falha ao enviar imagem.");
        setBackgroundImage(lastSavedRef.current.wallpaper || null); // Reverte
    } finally {
        setIsUploadingImage(false);
        setPendingImageUri(null);
    }
  };

  const handleRemoveImage = async () => {
      setBackgroundImage(null);
      await api.patch(`/mobile/writer/chapters/${chapterId}`, { wallpaperUrl: null });
      lastSavedRef.current.wallpaper = '';
  };

  // 6. HANDLERS WEBVIEW E IA
  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        
        if (data.type === 'CONTENT_CHANGE') setContent(data.content); 
        else if (data.type === 'SELECTION_CHANGE') setActiveFormats(data.formats);
        
        // IA
        else if (data.type === 'SELECTION_TEXT') {
            if (data.text?.trim()) { setSelectedText(data.text); setAiModalVisible(true); }
            else alert("Selecione texto para corrigir.");
        }
        
        // DICIONÁRIO
        else if (data.type === 'REQUEST_USER_DICT') loadUserDictionary();
        else if (data.type === 'WORD_CLICKED') {
            setMisspelledWord(data.word);
            setDictSuggestions(data.suggestions || []);
            setDictModalVisible(true);
        }
    } catch {}
  };

  // Dicionário Helpers
  const loadUserDictionary = async () => {
      try {
          const res = await api.get('/mobile/writer/dictionary');
          webViewRef.current?.postMessage(JSON.stringify({ command: 'loadUserDict', words: res.data.words }));
      } catch {}
  };

  const addToDictionary = async () => {
      try {
          await api.post('/mobile/writer/dictionary', { word: misspelledWord });
          webViewRef.current?.postMessage(JSON.stringify({ command: 'addToDict', word: misspelledWord }));
          setDictModalVisible(false);
      } catch { alert("Erro ao salvar palavra."); }
  };

  const replaceWord = (newWord: string) => {
      // Nota: Implementação simplificada de substituição
      // Para funcionar perfeitamente, o cursor deve estar na palavra (o que o clique já faz)
      webViewRef.current?.postMessage(JSON.stringify({ command: 'replaceWord', replacement: newWord }));
      setDictModalVisible(false);
  };

  // IA Helpers
  const requestAiFix = () => webViewRef.current?.postMessage(JSON.stringify({ command: 'getSelection' }));
  const handleLaunchAi = async () => {
      setAiLoading(true); setAiSuggestion(null);
      try {
          const res = await api.post('/mobile/writer/ai/fix', { text: selectedText });
          setAiSuggestion(res.data);
      } catch { setAiSuggestion({ error: true }); } finally { setAiLoading(false); }
  };
  const applyCorrection = () => {
      if (aiSuggestion?.corrected) {
          webViewRef.current?.postMessage(JSON.stringify({ command: 'replaceSelection', value: aiSuggestion.corrected }));
          setAiModalVisible(false);
      }
  };

  const handleFormat = (type: string) => {
      let command = type;
      if (['h1','h2','h3','blockquote'].includes(type)) command = activeFormats.includes(type) ? 'p' : type;
      else if (['orderedList','unorderedList'].includes(type)) command = 'insert' + type.charAt(0).toUpperCase() + type.slice(1);
      webViewRef.current?.postMessage(JSON.stringify({ command: 'format', value: command }));
  };

  const htmlSource = useMemo(() => ({ html: initialContent ? createHTML(initialContent) : '' }), [initialContent]);

  // Cores UI
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
      
      {backgroundImage && (
        <Image source={{ uri: backgroundImage }} className="absolute inset-0 w-full h-full opacity-80" resizeMode="cover" />
      )}

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

            <TouchableOpacity onPress={() => saveChapter()} className={`p-2 rounded-full ${backgroundImage ? 'bg-black/30' : ''}`}>
                <Save size={20} color={backgroundImage || editorTheme === 'dark' ? '#fff' : '#000'} opacity={saveStatus === 'saved' ? 0.3 : 1} />
            </TouchableOpacity>
          </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1">
            <View className={`px-5 py-2 ${backgroundImage ? 'bg-transparent' : themeColors.bg}`}>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Título do Capítulo"
                    placeholderTextColor={backgroundImage || editorTheme === 'dark' ? '#52525b' : '#a1a1aa'}
                    multiline
                    style={backgroundImage ? { textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 } : {}}
                    className={`text-xl font-bold font-serif ${uiTextColor}`}
                />
            </View>
            
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={htmlSource}
                onLoadEnd={() => {
                    webViewRef.current?.postMessage(JSON.stringify({
                        command: 'setConfig', theme: editorTheme, textColor: customTextColor, hasWallpaper: !!backgroundImage
                    }));
                }}
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
        />
      </KeyboardAvoidingView>

      {/* 1. MODAL CONFIRMAÇÃO IMAGEM */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
            <View className="bg-zinc-900 w-full rounded-2xl border border-zinc-700 overflow-hidden">
                <View className="h-48 w-full bg-zinc-800">
                    {pendingImageUri && <Image source={{ uri: pendingImageUri }} className="w-full h-full" resizeMode="cover" />}
                </View>
                <View className="p-6">
                    <Text className="text-white text-lg font-bold text-center mb-2">Definir Papel de Parede?</Text>
                    <View className="flex-row gap-3 mt-4">
                        <TouchableOpacity onPress={() => setConfirmModalVisible(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl items-center"><Text className="text-zinc-300">Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity onPress={confirmUploadImage} className="flex-1 py-3 bg-emerald-600 rounded-xl items-center"><Text className="text-white font-bold">Confirmar</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
      </Modal>

      {/* 2. MODAL DICIONÁRIO */}
      <Modal visible={dictModalVisible} transparent animationType="slide" onRequestClose={() => setDictModalVisible(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setDictModalVisible(false)}>
            <View className={`p-6 rounded-t-3xl shadow-xl ${editorTheme === 'light' ? 'bg-white' : 'bg-zinc-900'}`}>
                <View className="flex-row items-center gap-2 mb-4">
                    <BookOpen size={20} color="#f472b6" />
                    <Text className={`font-bold text-lg ${themeColors.text}`}>Ortografia</Text>
                </View>
                
                <Text className="text-red-500 font-bold text-2xl line-through mb-4 text-center">{misspelledWord}</Text>
                
                {dictSuggestions.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2 mb-6 justify-center">
                        {dictSuggestions.slice(0, 4).map(s => (
                            <TouchableOpacity key={s} onPress={() => replaceWord(s)} className="bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700">
                                <Text className="text-emerald-400 font-medium">{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : <Text className="text-zinc-500 text-center mb-6">Sem sugestões.</Text>}

                <TouchableOpacity onPress={addToDictionary} className="bg-zinc-800 p-4 rounded-xl flex-row justify-center gap-2">
                    <Check size={20} color="#e4e4e7" />
                    <Text className="text-zinc-200">Adicionar ao Dicionário</Text>
                </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>

      {/* 3. MODAL IA */}
      <Modal visible={aiModalVisible} transparent animationType="slide" onRequestClose={() => setAiModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <Pressable className="flex-1 bg-black/60" onPress={() => setAiModalVisible(false)} />
            <View className={`p-6 rounded-t-3xl shadow-xl ${editorTheme === 'light' ? 'bg-white' : 'bg-zinc-900'}`}>
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
                        <TouchableOpacity onPress={applyCorrection} disabled={!aiSuggestion?.corrected} className={`p-4 rounded-xl flex-row justify-center gap-2 ${!aiSuggestion?.corrected ? 'bg-zinc-700 opacity-50' : 'bg-emerald-600'}`}>
                            <Text className="text-white font-bold">Aplicar Correção</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}