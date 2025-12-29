import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, TextInput, SafeAreaView, KeyboardAvoidingView, 
  Platform, ActivityIndicator, Text, TouchableOpacity, StatusBar, Keyboard 
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Save, Cloud, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { api } from '../../../../../lib/api';
import { EditorToolbar } from './_components/EditorToolbar';

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

export default function ChapterEditor() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Controle de Salvamento
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const lastSavedContent = useRef('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Controle de Cursor para Formatação
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const contentInputRef = useRef<TextInput>(null);

  // 1. Carregar Dados Iniciais
  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      const res = await api.get(`/mobile/writer/chapters/${chapterId}`);
      setTitle(res.data.title);
      setContent(res.data.content || '');
      lastSavedContent.current = res.data.content || '';
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Lógica de Auto-Save (Debounce)
  useEffect(() => {
    if (loading) return;

    // Se o conteúdo mudou em relação ao último save
    if (content !== lastSavedContent.current) {
      setSaveStatus('unsaved');

      // Limpa timer anterior
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      // Define novo timer de 2 segundos
      saveTimeoutRef.current = setTimeout(() => {
        saveChapter();
      }, 2000);
    }
  }, [content, title]);

  const saveChapter = async () => {
    setSaveStatus('saving');
    try {
      await api.patch(`/mobile/writer/chapters/${chapterId}`, {
        title,
        content
      });
      lastSavedContent.current = content;
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  };

  // 3. Lógica de Inserção de Formatação
  const handleInsertFormat = (prefix: string, suffix: string = '') => {
    const start = selection.start;
    const end = selection.end;
    
    const before = content.substring(0, start);
    const selected = content.substring(start, end);
    const after = content.substring(end);

    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    setContent(newText);

    // Tenta reposicionar o cursor (UX melhorada)
    // Pequeno delay para o React atualizar o state
    setTimeout(() => {
        const newCursorPos = start + prefix.length + selected.length + suffix.length;
        contentInputRef.current?.focus();
        // Nota: setSelection programático no Android pode ser instável em algumas versões do RN
    }, 100);
  };

  // Renderizador do Status de Save
  const renderStatus = () => {
    switch (saveStatus) {
      case 'saving': return <ActivityIndicator size="small" color="#818cf8" />;
      case 'saved': return <CheckCircle2 size={18} color="#34d399" />;
      case 'error': return <AlertCircle size={18} color="#f87171" />;
      default: return <Cloud size={18} color="#71717a" />;
    }
  };

  if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* HEADER DE EDIÇÃO */}
      <View className="px-4 py-3 border-b border-zinc-900 flex-row justify-between items-center bg-black z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft color="white" size={24} />
        </TouchableOpacity>

        <View className="flex-1 mx-4">
            <TextInput 
                value={title}
                onChangeText={setTitle}
                placeholder="Título do Capítulo"
                placeholderTextColor="#52525b"
                className="text-white font-bold text-center text-lg"
            />
        </View>

        <View className="flex-row items-center gap-2">
            <Text className="text-zinc-600 text-[10px] uppercase font-bold">
                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo' : saveStatus === 'unsaved' ? 'Editando...' : 'Erro'}
            </Text>
            {renderStatus()}
        </View>
      </View>

      {/* ÁREA DE TEXTO */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TextInput
            ref={contentInputRef}
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Comece a escrever sua história... Use Markdown para formatar."
            placeholderTextColor="#3f3f46"
            className="flex-1 text-zinc-300 text-lg px-6 pt-6 leading-8 font-normal"
            textAlignVertical="top"
            style={{ fontSize: 18 }}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            autoCapitalize="sentences"
            keyboardAppearance="dark"
        />

        {/* TOOLBAR (Acima do teclado) */}
        <EditorToolbar onInsert={handleInsertFormat} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}