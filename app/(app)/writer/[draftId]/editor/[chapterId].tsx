import React, { useState, useEffect, useRef } from 'react';
import { 
  View, SafeAreaView, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Text, TouchableOpacity, StatusBar, TextInput 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, AlertCircle, Edit3, Save } from 'lucide-react-native';
import { api } from '../../../../../lib/api'; 
import { EditorToolbar, ThemeType } from './_components/EditorToolbar';

// --- TEMPLATE DO EDITOR HTML ---
// Criamos um mini-site que roda dentro do app para editar o texto
const createHTML = (initialContent: string, theme: ThemeType) => {
    const colors = {
        dark: { bg: '#09090b', text: '#e4e4e7', placeholder: '#52525b' },
        light: { bg: '#ffffff', text: '#18181b', placeholder: '#a1a1aa' },
        sepia: { bg: '#f4ecd8', text: '#433422', placeholder: '#9c8ba9' }
    }[theme];

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
            body { 
                background-color: ${colors.bg}; 
                color: ${colors.text}; 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0; padding: 20px; padding-bottom: 80px;
                font-size: 18px; line-height: 1.6;
            }
            #editor {
                outline: none; min-height: 80vh;
            }
            #editor:empty:before {
                content: 'Comece a escrever sua história...';
                color: ${colors.placeholder}; pointer-events: none; display: block;
            }
            h1 { font-size: 1.8em; font-weight: 800; margin-top: 1em; }
            h2 { font-size: 1.5em; font-weight: 700; margin-top: 0.8em; border-bottom: 1px solid ${theme === 'dark' ? '#333' : '#ccc'}; padding-bottom: 5px;}
            h3 { font-size: 1.2em; font-weight: 600; margin-top: 0.5em; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }
            blockquote { border-left: 4px solid #10b981; margin: 1em 0; padding-left: 1em; font-style: italic; opacity: 0.8; }
            ul, ol { padding-left: 1.2em; }
        </style>
    </head>
    <body>
        <div id="editor" contenteditable="true">${initialContent || ''}</div>
        <script>
            const editor = document.getElementById('editor');
            
            // Envia o texto para o App salvar
            const sendContent = () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'CONTENT_CHANGE',
                    content: editor.innerHTML
                }));
            };

            // Verifica formatação atual (para acender botões na toolbar)
            const checkFormats = () => {
                const formats = [];
                if (document.queryCommandState('bold')) formats.push('bold');
                if (document.queryCommandState('italic')) formats.push('italic');
                if (document.queryCommandState('underline')) formats.push('underline');
                if (document.queryCommandState('insertUnorderedList')) formats.push('unorderedList');
                if (document.queryCommandState('insertOrderedList')) formats.push('orderedList');
                
                // Detectar Headers é mais chato, verificamos o parentNode
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    let parent = selection.getRangeAt(0).commonAncestorContainer;
                    if (parent.nodeType === 3) parent = parent.parentNode;
                    
                    const tag = parent.tagName.toLowerCase();
                    if (['h1','h2','h3','blockquote'].includes(tag)) formats.push(tag);
                }

                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SELECTION_CHANGE',
                    formats: formats
                }));
            };

            editor.addEventListener('input', sendContent);
            document.addEventListener('selectionchange', checkFormats);
            
            // Recebe comandos do App (Bold, H1, etc)
            document.addEventListener('message', function(event) {
                handleMessage(event.data);
            });
            window.addEventListener('message', function(event) {
                handleMessage(event.data);
            });

            function handleMessage(data) {
                try {
                    const msg = JSON.parse(data);
                    if (msg.command === 'format') {
                        document.execCommand(msg.value, false, msg.args || null);
                        // Para Headers e Quotes, execCommand 'formatBlock'
                        if (['h1','h2','h3','blockquote','p'].includes(msg.value)) {
                            document.execCommand('formatBlock', false, msg.value);
                        }
                    }
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
  
  // Dados
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // Agora armazena HTML
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [editorTheme, setEditorTheme] = useState<ThemeType>('dark');
  const [activeFormats, setActiveFormats] = useState<string[]>([]); // Formatos ativos (bold, h1...)

  // Refs
  const webViewRef = useRef<WebView>(null);
  const lastSavedContent = useRef('');
  const lastSavedTitle = useRef('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. CARREGAR CAPÍTULO
  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      const res = await api.get(`/mobile/writer/chapters/${chapterId}`);
      setTitle(res.data.title);
      // Se vier null, manda string vazia. Se vier markdown antigo, o browser vai renderizar como texto puro (o que é ok para transição)
      setContent(res.data.content || ''); 
      lastSavedContent.current = res.data.content || '';
      lastSavedTitle.current = res.data.title || '';
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. AUTO-SAVE LÓGICA
  useEffect(() => {
    if (loading) return;
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
      // Importante: Estamos salvando HTML agora. O backend deve estar preparado para receber string.
      // O Prisma schema trata content como String, então tudo bem.
      await api.patch(`/mobile/writer/chapters/${chapterId}`, { title, content });
      lastSavedContent.current = content;
      lastSavedTitle.current = title;
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  };

  // 3. COMUNICAÇÃO COM WEBVIEW
  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'CONTENT_CHANGE') {
            setContent(data.content); // Atualiza estado com HTML novo
        } else if (data.type === 'SELECTION_CHANGE') {
            setActiveFormats(data.formats); // Atualiza botões ativos
        }
    } catch (e) {}
  };

  const handleFormat = (type: string) => {
    // Mapeia botões da toolbar para comandos do execCommand
    let command = type;
    let args = null;

    if (type === 'h1' || type === 'h2' || type === 'h3' || type === 'blockquote') {
        // Se já estiver ativo, volta para parágrafo (toggle)
        command = activeFormats.includes(type) ? 'p' : type;
    } else if (type === 'orderedList') {
        command = 'insertOrderedList';
    } else if (type === 'unorderedList') {
        command = 'insertUnorderedList';
    }

    webViewRef.current?.postMessage(JSON.stringify({ 
        command: 'format', 
        value: command,
        args 
    }));
  };

  // --- UI HELPERS ---
  const themeColors = {
      dark: { bg: 'bg-zinc-950', border: 'border-zinc-800', text: 'text-zinc-200' },
      light: { bg: 'bg-white', border: 'border-zinc-200', text: 'text-zinc-900' },
      sepia: { bg: 'bg-[#f4ecd8]', border: 'border-[#eaddc5]', text: 'text-[#5b4636]' }
  }[editorTheme];

  if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#10b981" /></View>;

  return (
    <View className={`flex-1 ${themeColors.bg}`}>
      <StatusBar barStyle={editorTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          
          {/* HEADER */}
          <View 
             style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 0 }}
             className={`px-4 pb-3 border-b flex-row justify-between items-center z-10 ${themeColors.bg} ${themeColors.border}`}
          >
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                <ArrowLeft size={24} color={editorTheme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-full">
                {saveStatus === 'editing' && <Edit3 size={12} color="#fbbf24" />}
                {saveStatus === 'saving' && <ActivityIndicator size={12} color="#fbbf24" />}
                {saveStatus === 'saved' && <CheckCircle2 size={12} color="#34d399" />}
                {saveStatus === 'error' && <AlertCircle size={12} color="#ef4444" />}
                
                <Text className={`text-[10px] uppercase font-bold ${themeColors.text} opacity-70`}>
                    {saveStatus === 'editing' ? 'Editando...' : saveStatus === 'saved' ? 'Salvo' : 'Salvando'}
                </Text>
            </View>

            <TouchableOpacity onPress={saveChapter} className="p-2">
                <Save size={20} color={editorTheme === 'dark' ? '#fff' : '#000'} opacity={saveStatus === 'saved' ? 0.3 : 1} />
            </TouchableOpacity>
          </View>

          {/* ÁREA DE TÍTULO (Nativa) */}
          <View className={`px-5 py-4 ${themeColors.bg}`}>
            <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Título do Capítulo"
                placeholderTextColor={editorTheme === 'dark' ? '#52525b' : '#a1a1aa'}
                multiline
                className={`text-2xl font-bold font-serif ${themeColors.text}`}
            />
          </View>

          {/* EDITOR WEBVIEW (Onde a mágica acontece) */}
          <View className="flex-1">
            <WebView
                ref={webViewRef}
                source={{ html: createHTML(content, editorTheme) }}
                onMessage={handleWebViewMessage}
                style={{ backgroundColor: 'transparent' }}
                containerStyle={{ backgroundColor: 'transparent' }}
                // Esconde scrollbar feia do Android
                showsVerticalScrollIndicator={false}
                // Importante para teclado não cobrir no Android
                overScrollMode="never"
                hideKeyboardAccessoryView={true} // Remove barra extra no iOS se quiser
                keyboardDisplayRequiresUserAction={false}
            />
          </View>

          {/* TOOLBAR */}
          <EditorToolbar 
            onFormat={handleFormat} 
            activeFormats={activeFormats}
            onThemeChange={setEditorTheme}
            currentTheme={editorTheme}
          />

        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}