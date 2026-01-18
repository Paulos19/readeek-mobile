import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, SafeAreaView, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Text, TouchableOpacity, StatusBar, TextInput, Modal, Pressable, Image, Alert 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, CheckCircle2, Edit3, Save, Sparkles, X, Check, BookOpen } from 'lucide-react-native';
import { api } from '../../../../../lib/api'; 
import { EditorToolbar, ThemeType } from './_components/EditorToolbar';

const DICT_BASE_URL = "https://readeek.vercel.app/dictionaries"; 

const createHTML = (initialContent: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,700;1,300&family=Roboto:ital,wght@0,400;1,400&display=swap" rel="stylesheet">

        <style>
            * { box-sizing: border-box; }
            html, body { height: 100%; width: 100%; -webkit-tap-highlight-color: transparent; }
            
            body { 
                margin: 0; padding: 20px; padding-bottom: 50vh; 
                font-size: 18px; line-height: 1.6;
                color: var(--text); font-family: 'Merriweather', serif;
                background-color: transparent;
            }
            
            /* TEMAS */
            .theme-dark { --text: #e4e4e7; --ph: #52525b; --accent: #6366f1; }
            .theme-light { --text: #18181b; --ph: #a1a1aa; --accent: #6366f1; }
            
            /* EDITOR */
            #editor { outline: none; min-height: 100%; white-space: pre-wrap; }
            #editor:empty:before { content: 'Comece a escrever...'; color: var(--ph); pointer-events: none; display: block; }
            
            /* ESTILO DE ERRO - Apenas sublinhado ondulado vermelho */
            .misspelled { 
                text-decoration: underline wavy #ef4444;
                text-decoration-skip-ink: none;
                cursor: pointer;
                color: inherit; /* Mantém a cor do texto original */
            }
            
            /* IMAGENS */
            .resize-container { display: inline-block; position: relative; margin: 10px auto; max-width: 100%; }
            .resize-container img { max-width: 100%; border-radius: 4px; display: block; }
            .resize-container.selected img { outline: 2px solid var(--accent); }
        </style>
    </head>
    <body class="theme-dark">
        <div id="editor" contenteditable="true" spellcheck="false">${initialContent || '<p><br></p>'}</div>
        
        <script>
            const editor = document.getElementById('editor');
            // Desativa corretor nativo para usar o nosso
            editor.spellcheck = false; 
            document.execCommand('defaultParagraphSeparator', false, 'p');
            
            let wordSet = new Set();
            let checkTimeout;
            let errorCount = 0; // Contador para gerar IDs únicos

            // --- 1. CARREGAR DICIONÁRIO ---
            async function loadDictionary() {
                try {
                    const response = await fetch('${DICT_BASE_URL}/pt_BR.dic');
                    if (!response.ok) return;
                    const text = await response.text();
                    text.split('\\n').forEach(l => { 
                        if(l) {
                            const w = l.split('/')[0].trim();
                            wordSet.add(w);
                            wordSet.add(w.toLowerCase());
                        }
                    });
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DICT_LOADED' }));
                    scanAndHighlight();
                } catch(e) {}
            }
            loadDictionary();

            // --- 2. LÓGICA DE VERIFICAÇÃO (NODE WALKER) ---
            function scanAndHighlight() {
                if (wordSet.size === 0) return;

                // Não executa se usuário estiver selecionando texto
                const sel = window.getSelection();
                if (sel.type === 'Range' && !sel.isCollapsed) return;

                const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
                    acceptNode: (node) => {
                        // Ignora scripts e containers de imagem
                        if (node.parentElement.tagName === 'SCRIPT' || node.parentElement.classList.contains('resize-container')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                });

                let node;
                let nodesToReplace = [];

                while (node = walker.nextNode()) {
                    const text = node.nodeValue;
                    // Regex: Divide por separadores (pontuação, espaço), mantendo-os no array
                    const tokens = text.split(/([\\s.,;!?"()\\-]+)/);
                    
                    let hasError = false;
                    
                    // Verifica se há erros neste nó de texto
                    for (let token of tokens) {
                        const clean = token.trim();
                        // Regra: Deve ser palavra, >2 letras, não ser número
                        if (clean.length > 2 && !/^\\d+$/.test(clean)) {
                            // Se NÃO está no dicionário
                            if (!wordSet.has(clean) && !wordSet.has(clean.toLowerCase())) {
                                hasError = true;
                                break;
                            }
                        }
                    }

                    // Se encontrou erro ou se o nó pai já é um erro (para revalidar)
                    if (hasError || node.parentElement.classList.contains('misspelled')) {
                        nodesToReplace.push({ node, tokens });
                    }
                }

                // Substituição atômica
                nodesToReplace.forEach(({ node, tokens }) => {
                    const fragment = document.createDocumentFragment();
                    
                    tokens.forEach(token => {
                        const clean = token.trim();
                        // Validação final antes de criar o SPAN
                        if (clean.length > 2 && !/^\\d+$/.test(clean) && !wordSet.has(clean) && !wordSet.has(clean.toLowerCase())) {
                            const span = document.createElement('span');
                            span.className = 'misspelled';
                            // ID Único para substituição precisa
                            span.id = 'err-' + (errorCount++); 
                            span.innerText = token;
                            fragment.appendChild(span);
                        } else {
                            // Texto normal
                            fragment.appendChild(document.createTextNode(token));
                        }
                    });

                    // Substitui o nó original (ou o span pai se já estava marcado)
                    if (node.parentElement.classList.contains('misspelled')) {
                        node.parentElement.replaceWith(fragment);
                    } else {
                        node.replaceWith(fragment);
                    }
                });
            }

            // --- 3. EVENTOS ---
            
            // Debounce na digitação
            editor.addEventListener('input', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTENT_CHANGE', content: editor.innerHTML }));
                clearTimeout(checkTimeout);
                checkTimeout = setTimeout(scanAndHighlight, 1500);
            });

            // Clique no erro (Delegação de evento)
            editor.addEventListener('click', (e) => {
                // Foco no editor se clicar fora
                if (e.target.id !== 'editor' && !e.target.closest('.resize-container') && !e.target.classList.contains('misspelled')) {
                    editor.focus();
                }

                // Lógica da palavra errada
                if (e.target.classList.contains('misspelled')) {
                    const errorId = e.target.id;
                    const word = e.target.innerText;
                    
                    // Seleciona visualmente para o usuário saber o que vai mudar
                    const range = document.createRange();
                    range.selectNode(e.target);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);

                    // Envia ID e Palavra para o App
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'WORD_ERROR_CLICKED', 
                        id: errorId, 
                        word: word 
                    }));
                }
            });

            // --- 4. BRIDGE (Comandos do React Native) ---
            document.addEventListener('message', handleMessage);
            window.addEventListener('message', handleMessage);

            function handleMessage(event) {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.command === 'replaceError') {
                        // SUBSTITUIÇÃO CIRÚRGICA PELO ID
                        const el = document.getElementById(data.id);
                        if (el) {
                            // Substitui o elemento <span id="...">...</span> apenas pelo texto novo
                            const textNode = document.createTextNode(data.value);
                            el.replaceWith(textNode);
                            
                            // Re-scan imediato para limpar adjacências
                            scanAndHighlight();
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTENT_CHANGE', content: editor.innerHTML }));
                        }
                    }
                    else if (data.command === 'addToDict') {
                        wordSet.add(data.word);
                        wordSet.add(data.word.toLowerCase());
                        scanAndHighlight(); // Remove o vermelho da palavra recém adicionada
                    }
                    else if (data.command === 'setConfig') {
                        if (data.theme) document.body.className = 'theme-' + data.theme;
                        if (data.hasWallpaper) document.body.classList.add('has-wallpaper'); 
                        else document.body.classList.remove('has-wallpaper');
                    }
                    else if (data.command === 'insertImage') {
                        // Lógica simplificada de imagem
                        const div = document.createElement('div');
                        div.className = 'resize-container';
                        div.contentEditable = 'false';
                        div.innerHTML = '<img src="' + data.base64 + '" />';
                        editor.appendChild(div);
                        editor.appendChild(document.createElement('p')); // Nova linha
                    }
                } catch(e) {}
            }
        </script>
    </body>
    </html>
    `;
};

export default function ChapterEditor() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  
  // Estados de Dados
  const [title, setTitle] = useState('');
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [content, setContent] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved'|'editing'|'saving'|'error'>('saved');
  
  // Estados de UI
  const [editorTheme, setEditorTheme] = useState<ThemeType>('dark');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [customTextColor, setCustomTextColor] = useState<string>('');
  
  // Imagem
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Dicionário & Correção
  const [dictModalVisible, setDictModalVisible] = useState(false);
  const [misspelledWord, setMisspelledWord] = useState('');
  const [currentErrorId, setCurrentErrorId] = useState<string | null>(null); // ID do SPAN clicado
  const [dictSuggestions, setDictSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const lastSavedRef = useRef({ title: '', content: '', theme: 'dark', wallpaper: '' });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- CARREGAMENTO ---
  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      const res = await api.get(`/mobile/writer/chapters/${chapterId}`);
      const data = res.data;
      setTitle(data.title);
      // Garante conteúdo mínimo para o editor não quebrar
      setInitialContent(data.content || '<p><br></p>'); 
      
      if (data.theme) setEditorTheme(data.theme as ThemeType);
      if (data.wallpaperUrl) setBackgroundImage(data.wallpaperUrl);
      if (data.textColor) setCustomTextColor(data.textColor);

      lastSavedRef.current = {
          title: data.title, content: data.content || '', theme: data.theme || 'dark', wallpaper: data.wallpaperUrl || ''
      };
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- AUTO SAVE ---
  const saveTextChanges = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await api.patch(`/mobile/writer/chapters/${chapterId}`, {
        title, content, theme: editorTheme, wallpaperUrl: backgroundImage, textColor: customTextColor
      });
      lastSavedRef.current = { ...lastSavedRef.current, title, content, theme: editorTheme };
      setSaveStatus('saved');
    } catch { setSaveStatus('error'); }
  }, [title, content, editorTheme, backgroundImage, customTextColor, chapterId]);

  useEffect(() => {
    if (loading || initialContent === null) return;
    const hasChanges = content !== lastSavedRef.current.content || title !== lastSavedRef.current.title;
    if (hasChanges) {
      setSaveStatus('editing');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveTextChanges, 2000);
    }
  }, [content, title, loading, saveTextChanges]);

  // Sincroniza Tema com WebView
  useEffect(() => {
    if (!loading && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
            command: 'setConfig', theme: editorTheme, hasWallpaper: !!backgroundImage
        }));
    }
  }, [editorTheme, backgroundImage, loading]);

  // --- HANDLER WEBVIEW ---
  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'CONTENT_CHANGE') {
            setContent(data.content);
        }
        else if (data.type === 'WORD_ERROR_CLICKED') {
            // Recebe o ID do span e a palavra
            setCurrentErrorId(data.id);
            handleDictionaryCheck(data.word);
        }
    } catch {}
  };

  // --- CORREÇÃO / DICIONÁRIO ---
  const handleDictionaryCheck = async (word: string) => {
      setMisspelledWord(word);
      setDictSuggestions([]);
      setDictModalVisible(true);
      setLoadingSuggestions(true);
      
      try {
          // Chama API para sugestões (pode ser sua API de IA ou dicionário)
          const res = await api.post('/mobile/writer/ai/fix', { text: word, mode: 'lookup' });
          
          if (res.data.suggestions && res.data.suggestions.length > 0) {
              setDictSuggestions(res.data.suggestions);
          } else if (res.data.corrected) {
              setDictSuggestions([res.data.corrected]);
          } else {
              setDictSuggestions([]);
          }
      } catch { 
          setDictSuggestions([]); 
      } finally { 
          setLoadingSuggestions(false); 
      }
  };

  const replaceMisspelledWord = (newWord: string) => {
      if (currentErrorId) {
          // Envia comando para substituir o elemento específico pelo ID
          webViewRef.current?.postMessage(JSON.stringify({ 
              command: 'replaceError', 
              id: currentErrorId, 
              value: newWord 
          }));
          setDictModalVisible(false);
          setCurrentErrorId(null);
      }
  };

  const addToDictionary = async () => {
      try {
          await api.post('/mobile/writer/dictionary', { word: misspelledWord });
          // Atualiza a WebView para não marcar mais essa palavra
          webViewRef.current?.postMessage(JSON.stringify({ command: 'addToDict', word: misspelledWord }));
          setDictModalVisible(false);
      } catch { Alert.alert("Erro", "Falha ao salvar."); }
  };

  // --- UPLOAD IMAGENS ---
  const handleInsertInlineImage = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.5 });
      if (!result.canceled && result.assets) {
          const base64 = `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`;
          webViewRef.current?.postMessage(JSON.stringify({ command: 'insertImage', base64 }));
      }
  };

  const pickBackgroundImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) { setPendingImageUri(result.assets[0].uri); setConfirmModalVisible(true); }
  };

  const confirmUploadWallpaper = async () => {
    if (!pendingImageUri) return;
    setConfirmModalVisible(false); setIsUploadingImage(true);
    // Simula update otimista
    setBackgroundImage(pendingImageUri); 
    
    try {
        const formData = new FormData();
        const filename = 'bg.jpg';
        // @ts-ignore
        formData.append('file', { uri: pendingImageUri, name: filename, type: 'image/jpeg' });
        const res = await api.post(`/mobile/writer/upload?filename=${filename}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        // Atualiza com URL real
        setBackgroundImage(res.data.url);
        await api.patch(`/mobile/writer/chapters/${chapterId}`, { wallpaperUrl: res.data.url });
    } catch { 
        Alert.alert("Erro no upload"); 
        setBackgroundImage(null); 
    } finally { setIsUploadingImage(false); }
  };

  const themeColors = {
      dark: { bg: 'bg-zinc-950', border: 'border-zinc-800', text: 'text-zinc-200' },
      light: { bg: 'bg-white', border: 'border-zinc-200', text: 'text-zinc-900' },
      sepia: { bg: 'bg-[#f4ecd8]', border: 'border-[#eaddc5]', text: 'text-[#5b4636]' }
  }[editorTheme];
  
  const headerBg = backgroundImage ? 'bg-transparent' : themeColors.bg;
  const contentTextColor = backgroundImage ? 'text-white' : themeColors.text;

  if (loading || initialContent === null) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View className={`flex-1 ${!backgroundImage ? themeColors.bg : 'bg-black'}`}>
      <StatusBar barStyle="light-content" />
      {backgroundImage && <Image source={{ uri: backgroundImage }} className="absolute inset-0 w-full h-full opacity-60" resizeMode="cover" />}

      {/* HEADER FIXO */}
      <SafeAreaView style={{ zIndex: 10 }}>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }} className={`px-4 pb-3 border-b ${backgroundImage ? 'border-white/10' : themeColors.border} flex-row justify-between items-center ${headerBg}`}>
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                <ArrowLeft size={24} color={backgroundImage ? '#fff' : (editorTheme === 'dark' ? '#fff' : '#000')} />
            </TouchableOpacity>
            
            <View className="flex-1 mx-4">
                <TextInput 
                    value={title} onChangeText={setTitle} 
                    placeholder="Título do Capítulo" 
                    placeholderTextColor="#71717a"
                    className={`font-serif font-bold text-lg ${contentTextColor}`}
                />
                <Text className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5">
                    {saveStatus === 'editing' ? 'Editando...' : saveStatus === 'saving' ? 'Salvando...' : 'Salvo'}
                </Text>
            </View>

            <TouchableOpacity onPress={saveTextChanges} className="p-2">
                <Save size={20} color={saveStatus === 'saved' ? '#10b981' : '#fbbf24'} />
            </TouchableOpacity>
          </View>
      </SafeAreaView>

      {/* EDITOR */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: createHTML(initialContent) }}
            onMessage={handleWebViewMessage}
            style={{ backgroundColor: 'transparent' }}
            containerStyle={{ backgroundColor: 'transparent' }}
            hideKeyboardAccessoryView={true}
            keyboardDisplayRequiresUserAction={false} // CRÍTICO: Permite focar e digitar
            scrollEnabled={false} // HTML controla o scroll
            javaScriptEnabled={true}
            domStorageEnabled={true}
        />

        <EditorToolbar 
            onThemeChange={setEditorTheme} currentTheme={editorTheme} 
            onInsertImage={handleInsertInlineImage} 
            onPickImage={pickBackgroundImage} 
            backgroundImage={backgroundImage} 
            onRemoveImage={() => setBackgroundImage(null)}
            // Passar handlers vazios para props não usadas no exemplo simplificado
            onFormat={() => {}} activeFormats={[]} onAiFix={() => {}} onTextColorChange={() => {}} customTextColor="" onFontChange={() => {}} currentFont=""
        />
      </KeyboardAvoidingView>

      {/* MODAL DE CORREÇÃO */}
      <Modal visible={dictModalVisible} transparent animationType="slide" onRequestClose={() => setDictModalVisible(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setDictModalVisible(false)}>
            <View className={`p-6 rounded-t-3xl ${editorTheme === 'light' ? 'bg-white' : 'bg-zinc-900'} border-t border-zinc-700`}>
                <View className="flex-row items-center gap-2 mb-4">
                    <BookOpen size={20} color="#f472b6" />
                    <Text className={`font-bold text-lg ${themeColors.text}`}>Ortografia</Text>
                </View>
                
                <Text className="text-red-500 font-bold text-2xl line-through mb-6 text-center">{misspelledWord}</Text>
                
                {loadingSuggestions ? (
                    <ActivityIndicator color="#f472b6" className="py-4" />
                ) : (
                    <View className="flex-row flex-wrap gap-2 justify-center mb-6">
                        {dictSuggestions.length > 0 ? dictSuggestions.map((s, i) => (
                            <TouchableOpacity key={i} onPress={() => replaceMisspelledWord(s)} className="bg-zinc-800 px-5 py-3 rounded-xl border border-zinc-700">
                                <Text className="text-emerald-400 font-bold text-lg">{s}</Text>
                            </TouchableOpacity>
                        )) : (
                            <Text className="text-zinc-500">Sem sugestões disponíveis.</Text>
                        )}
                    </View>
                )}
                
                <TouchableOpacity onPress={addToDictionary} className="bg-zinc-800/50 p-4 rounded-xl flex-row justify-center gap-2 border border-zinc-700/50">
                    <Check size={20} color="#a1a1aa" />
                    <Text className="text-zinc-400 font-medium">Adicionar ao Dicionário</Text>
                </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>

      {/* MODAL CONFIRMAÇÃO WALLPAPER */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
            <View className="bg-zinc-900 w-full rounded-2xl border border-zinc-700 overflow-hidden">
                <View className="h-48 w-full bg-zinc-800">
                    {pendingImageUri && <Image source={{ uri: pendingImageUri }} className="w-full h-full" resizeMode="cover" />}
                </View>
                <View className="p-6 flex-row gap-3">
                    <TouchableOpacity onPress={() => setConfirmModalVisible(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl items-center">
                        <Text className="text-zinc-300">Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmUploadWallpaper} className="flex-1 py-3 bg-emerald-600 rounded-xl items-center">
                        <Text className="text-white font-bold">Usar Imagem</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}