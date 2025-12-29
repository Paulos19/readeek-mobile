import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, SafeAreaView, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Text, TouchableOpacity, StatusBar, TextInput, Modal, Pressable, Image 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, CheckCircle2, AlertCircle, Edit3, Save, Sparkles, X, Check } from 'lucide-react-native';
import { api } from '../../../../../lib/api'; 
import { EditorToolbar, ThemeType } from './_components/EditorToolbar';

// --- TEMPLATE HTML OTIMIZADO ---
// O WebView agora é transparente. O Fundo é gerenciado pelo React Native.
const createHTML = (
    initialContent: string, 
    theme: ThemeType, 
    hasWallpaper: boolean, 
    customTextColor: string
) => {
    const colors = {
        dark: { text: '#e4e4e7', placeholder: '#52525b', border: '#333' },
        light: { text: '#18181b', placeholder: '#a1a1aa', border: '#e4e4e7' },
        sepia: { text: '#433422', placeholder: '#9c8ba9', border: '#eaddc5' }
    }[theme];

    // Se tiver wallpaper, o fundo do HTML deve ser transparente
    const bodyBg = hasWallpaper ? 'background-color: transparent;' : '';
    
    // Cor do texto
    const textColor = customTextColor ? customTextColor : colors.text;
    
    // Sombra leve no texto se tiver wallpaper para garantir leitura
    const textShadow = hasWallpaper ? 'text-shadow: 0px 1px 2px rgba(0,0,0,0.6);' : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
            html, body {
                height: 100%;
                margin: 0; padding: 0;
            }
            body { 
                ${bodyBg}
                color: ${textColor}; 
                ${textShadow}
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                padding: 20px; padding-bottom: 80px;
                font-size: 18px; line-height: 1.6;
            }
            #editor {
                outline: none; min-height: 80vh;
            }
            #editor:empty:before {
                content: 'Comece a escrever aqui...';
                color: ${textColor}; opacity: 0.5; pointer-events: none; display: block;
            }
            p { margin-bottom: 1em; min-height: 1em; }
            h1 { font-size: 1.8em; font-weight: 800; margin-top: 1.2em; margin-bottom: 0.5em; line-height: 1.2; }
            h2 { font-size: 1.4em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; border-bottom: 1px solid ${hasWallpaper ? 'rgba(255,255,255,0.2)' : colors.border}; padding-bottom: 4px; }
            h3 { font-size: 1.1em; font-weight: 600; margin-top: 1em; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
            blockquote { border-left: 4px solid #10b981; margin: 1em 0; padding-left: 1em; font-style: italic; opacity: 0.8; background: ${hasWallpaper ? 'rgba(0,0,0,0.2)' : 'rgba(16, 185, 129, 0.1)'}; padding: 10px; border-radius: 4px; }
            ul, ol { padding-left: 1.2em; margin-bottom: 1em; }
            li { margin-bottom: 0.5em; }
            b, strong { font-weight: bold; }
        </style>
    </head>
    <body>
        <div id="editor" contenteditable="true">${initialContent || '<p><br></p>'}</div>
        <script>
            const editor = document.getElementById('editor');
            document.execCommand('defaultParagraphSeparator', false, 'p');

            const sendContent = () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'CONTENT_CHANGE',
                    content: editor.innerHTML
                }));
            };

            const checkFormats = () => {
                const formats = [];
                if (document.queryCommandState('bold')) formats.push('bold');
                if (document.queryCommandState('italic')) formats.push('italic');
                if (document.queryCommandState('underline')) formats.push('underline');
                if (document.queryCommandState('insertUnorderedList')) formats.push('unorderedList');
                if (document.queryCommandState('insertOrderedList')) formats.push('orderedList');
                
                const blockValue = document.queryCommandValue('formatBlock');
                if (blockValue) {
                    formats.push(blockValue.toLowerCase());
                }

                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SELECTION_CHANGE',
                    formats: formats
                }));
            };

            function getSelectionText() {
                const selection = window.getSelection();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SELECTION_TEXT',
                    text: selection.toString()
                }));
            }

            function replaceSelection(newText) {
                document.execCommand('insertText', false, newText);
                sendContent();
            }

            editor.addEventListener('input', sendContent);
            document.addEventListener('selectionchange', checkFormats);
            
            function handleMessage(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.command === 'format') {
                        document.execCommand(data.value, false, data.args || null);
                        if (['h1','h2','h3','blockquote','p'].includes(data.value)) {
                            document.execCommand('formatBlock', false, data.value);
                        }
                        editor.focus();
                        checkFormats();
                        sendContent();
                    }
                    else if (data.command === 'getSelection') getSelectionText();
                    else if (data.command === 'replaceSelection') replaceSelection(data.value);
                } catch(e) {}
            }

            document.addEventListener('message', handleMessage);
            window.addEventListener('message', handleMessage);
        </script>
    </body>
    </html>
    `;
};

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved' | 'editing';

export default function ChapterEditor() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [content, setContent] = useState(''); 
  const [loading, setLoading] = useState(true);
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [editorTheme, setEditorTheme] = useState<ThemeType>('dark');
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [customTextColor, setCustomTextColor] = useState<string>('');

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  const webViewRef = useRef<WebView>(null);
  const lastSavedContent = useRef('');
  const lastSavedTitle = useRef('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      const res = await api.get(`/mobile/writer/chapters/${chapterId}`);
      setTitle(res.data.title);
      setInitialContent(res.data.content || '');
      setContent(res.data.content || '');
      lastSavedContent.current = res.data.content || '';
      lastSavedTitle.current = res.data.title || '';
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 0.8, 
      base64: true, // Ainda precisamos do base64 se quisermos salvar no server depois, mas aqui usamos URI local
    });

    if (!result.canceled) {
        // Usamos a URI diretamente no Image do RN
        setBackgroundImage(result.assets[0].uri);
    }
  };

  useEffect(() => {
    if (loading || initialContent === null) return;
    const hasChanges = content !== lastSavedContent.current || title !== lastSavedTitle.current;
    if (hasChanges) {
      setSaveStatus('editing');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveChapter, 2000);
    }
  }, [content, title]);

  const saveChapter = async () => {
    setSaveStatus('saving');
    try {
      await api.patch(`/mobile/writer/chapters/${chapterId}`, { title, content });
      lastSavedContent.current = content;
      lastSavedTitle.current = title;
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'CONTENT_CHANGE') setContent(data.content); 
        else if (data.type === 'SELECTION_CHANGE') setActiveFormats(data.formats);
        else if (data.type === 'SELECTION_TEXT') {
            if (data.text && data.text.trim().length > 0) handleLaunchAi(data.text);
            else alert("Selecione um trecho do texto para corrigir.");
        }
    } catch (e) {}
  };

  const requestAiFix = () => webViewRef.current?.postMessage(JSON.stringify({ command: 'getSelection' }));

  const handleLaunchAi = async (text: string) => {
    setSelectedText(text);
    setAiModalVisible(true);
    setAiLoading(true);
    setAiSuggestion(null);
    try {
        const res = await api.post('/mobile/writer/ai/fix', { text, language: 'português' });
        setAiSuggestion(res.data);
    } catch (error) {
        setAiSuggestion({ error: true });
    } finally {
        setAiLoading(false);
    }
  };

  const applyCorrection = () => {
    if (aiSuggestion?.corrected) {
        webViewRef.current?.postMessage(JSON.stringify({ command: 'replaceSelection', value: aiSuggestion.corrected }));
        setAiModalVisible(false);
    }
  };

  const handleFormat = (type: string) => {
    let command = type;
    if (type === 'h1' || type === 'h2' || type === 'h3' || type === 'blockquote') {
        command = activeFormats.includes(type) ? 'p' : type;
    } else if (type === 'orderedList') command = 'insertOrderedList';
      else if (type === 'unorderedList') command = 'insertUnorderedList';
    webViewRef.current?.postMessage(JSON.stringify({ command: 'format', value: command }));
  };

  // Memoiza HTML. Passamos "hasWallpaper" (booleano) em vez da imagem base64 pesada.
  const htmlSource = useMemo(() => {
      if (initialContent === null) return '';
      return createHTML(initialContent, editorTheme, !!backgroundImage, customTextColor);
  }, [initialContent, editorTheme, backgroundImage, customTextColor]);

  const themeColors = {
      dark: { bg: 'bg-zinc-950', border: 'border-zinc-800', text: 'text-zinc-200' },
      light: { bg: 'bg-white', border: 'border-zinc-200', text: 'text-zinc-900' },
      sepia: { bg: 'bg-[#f4ecd8]', border: 'border-[#eaddc5]', text: 'text-[#5b4636]' }
  }[editorTheme];

  // Define se o texto do RN (Título/Header) deve ser claro ou usar a cor do tema
  const uiTextColor = backgroundImage ? 'text-white' : themeColors.text;
  const headerBg = backgroundImage ? 'bg-transparent border-transparent' : `${themeColors.bg} ${themeColors.border}`;

  if (loading || initialContent === null) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#10b981" /></View>;

  return (
    <View className={`flex-1 ${!backgroundImage ? themeColors.bg : 'bg-black'}`}>
      <StatusBar barStyle={backgroundImage ? 'light-content' : (editorTheme === 'dark' ? 'light-content' : 'dark-content')} />
      
      {/* IMAGEM DE FUNDO DO REACT NATIVE (Absoluta atrás de tudo) */}
      {backgroundImage && (
        <Image 
            source={{ uri: backgroundImage }} 
            className="absolute inset-0 w-full h-full opacity-80" 
            resizeMode="cover"
        />
      )}

      {/* HEADER - Agora transparente se tiver wallpaper */}
      <SafeAreaView style={{ zIndex: 10 }}>
          <View 
             style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0 }}
             className={`px-4 pb-2 border-b flex-row justify-between items-center ${headerBg}`}
          >
            <TouchableOpacity onPress={() => router.back()} className={`p-2 -ml-2 rounded-full ${backgroundImage ? 'bg-black/30' : ''}`}>
                <ArrowLeft size={24} color={backgroundImage ? '#fff' : (editorTheme === 'dark' ? '#fff' : '#000')} />
            </TouchableOpacity>

            <View className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full ${backgroundImage ? 'bg-black/40 backdrop-blur-md' : 'bg-black/5 dark:bg-white/10'}`}>
                {saveStatus === 'editing' && <Edit3 size={12} color="#fbbf24" />}
                {saveStatus === 'saving' && <ActivityIndicator size={12} color="#fbbf24" />}
                {saveStatus === 'saved' && <CheckCircle2 size={12} color="#34d399" />}
                
                <Text className={`text-[10px] uppercase font-bold ${backgroundImage ? 'text-white/90' : themeColors.text} opacity-70`}>
                    {saveStatus === 'editing' ? 'Editando...' : saveStatus === 'saved' ? 'Salvo' : 'Salvando'}
                </Text>
            </View>

            <TouchableOpacity onPress={saveChapter} className={`p-2 rounded-full ${backgroundImage ? 'bg-black/30' : ''}`}>
                <Save size={20} color={backgroundImage ? '#fff' : (editorTheme === 'dark' ? '#fff' : '#000')} opacity={saveStatus === 'saved' ? 0.3 : 1} />
            </TouchableOpacity>
          </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1">
            {/* TÍTULO - Compacto e com sombra se tiver wallpaper */}
            <View className={`px-5 py-2 ${backgroundImage ? 'bg-transparent' : themeColors.bg}`}>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Título do Capítulo"
                    placeholderTextColor={backgroundImage ? 'rgba(255,255,255,0.6)' : (editorTheme === 'dark' ? '#52525b' : '#a1a1aa')}
                    multiline
                    // Sombra no texto se tiver imagem
                    style={backgroundImage ? { textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 } : {}}
                    className={`text-xl font-bold font-serif ${uiTextColor}`}
                />
            </View>
            
            {/* WEBVIEW - Transparente para mostrar a imagem do RN */}
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlSource }}
                onMessage={handleWebViewMessage}
                style={{ backgroundColor: 'transparent', flex: 1 }}
                containerStyle={{ backgroundColor: 'transparent' }}
                showsVerticalScrollIndicator={false}
                overScrollMode="never"
                hideKeyboardAccessoryView={true}
                keyboardDisplayRequiresUserAction={false}
                automaticallyAdjustContentInsets={false}
            />
        </View>

        <EditorToolbar 
            onFormat={handleFormat} 
            activeFormats={activeFormats}
            onThemeChange={setEditorTheme}
            currentTheme={editorTheme}
            onAiFix={requestAiFix}
            onPickImage={pickImage}
            onRemoveImage={() => setBackgroundImage(null)}
            backgroundImage={backgroundImage}
            onTextColorChange={setCustomTextColor}
            customTextColor={customTextColor}
        />
      </KeyboardAvoidingView>

      {/* MODAL IA */}
      <Modal visible={aiModalVisible} transparent animationType="slide" onRequestClose={() => setAiModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <Pressable className="flex-1 bg-black/60" onPress={() => setAiModalVisible(false)} />
            <View className={`p-6 rounded-t-3xl shadow-xl ${editorTheme === 'light' ? 'bg-white' : 'bg-zinc-900'} border-t border-zinc-700`}>
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                        <Sparkles size={18} color="#818cf8" />
                        <Text className={`font-bold text-lg ${themeColors.text}`}>Revisor IA</Text>
                    </View>
                    <TouchableOpacity onPress={() => setAiModalVisible(false)}><X size={24} color="#71717a" /></TouchableOpacity>
                </View>
                {aiLoading ? (
                    <View className="py-8 items-center"><ActivityIndicator size="large" color="#818cf8" /></View>
                ) : (
                    <View>
                        <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">Original</Text>
                        <Text className={`text-base mb-4 opacity-60 ${themeColors.text}`} numberOfLines={3}>{selectedText}</Text>
                        <View className="h-[1px] bg-zinc-700/50 mb-4" />
                        <Text className="text-emerald-500 text-xs font-bold uppercase mb-2">Sugestão</Text>
                        <Text className={`text-lg font-medium mb-3 ${themeColors.text}`}>{aiSuggestion?.corrected}</Text>
                        <TouchableOpacity onPress={applyCorrection} disabled={!aiSuggestion?.corrected} className={`p-4 rounded-xl flex-row justify-center items-center gap-2 ${!aiSuggestion?.corrected ? 'bg-zinc-700 opacity-50' : 'bg-emerald-600 active:bg-emerald-700'}`}>
                            <Check size={20} color="white" />
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