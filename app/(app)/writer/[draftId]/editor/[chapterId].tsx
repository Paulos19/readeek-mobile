import React, { useEffect, useState, useRef } from 'react';
import { 
  View, TextInput, TouchableOpacity, Text, ActivityIndicator, 
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../../../../lib/api'; // Ajuste o caminho dos imports conforme necessário
import { Save } from 'lucide-react-native';

export default function ChapterEditorScreen() {
  const { chapterId, draftId } = useLocalSearchParams();
  const router = useRouter();
  
  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  
  // Dirty state para avisar se sair sem salvar
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  // Atualiza contador de palavras em tempo real
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  const loadChapter = async () => {
    try {
      const res = await api.get(`/mobile/writer/chapters/${chapterId}`);
      setTitle(res.data.title || '');
      setContent(res.data.content || '');
      setIsDirty(false);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o texto.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Atenção", "O capítulo precisa de um título.");
    
    try {
      setSaving(true);
      await api.put(`/mobile/writer/chapters/${chapterId}`, {
        title,
        content
      });
      setIsDirty(false);
      // Feedback visual rápido
      Alert.alert("Salvo", "Alterações guardadas com sucesso.");
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  };

  // Header Personalizado para o Editor
  const renderHeader = () => (
    <View className="flex-row justify-between items-center px-4 py-3 bg-zinc-900 border-b border-zinc-800 pt-12">
      <TouchableOpacity onPress={() => {
        if (isDirty) {
          Alert.alert("Alterações não salvas", "Deseja sair e perder o progresso?", [
            { text: "Ficar", style: "cancel" },
            { text: "Sair", style: "destructive", onPress: () => router.back() }
          ]);
        } else {
          router.back();
        }
      }}>
        <Feather name="arrow-left" color="#a1a1aa" size={24} />
      </TouchableOpacity>

      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
        {saving ? "Salvando..." : `${wordCount} palavras`}
      </Text>

      <TouchableOpacity 
        onPress={handleSave} 
        disabled={saving}
        className={`flex-row items-center px-4 py-2 rounded-full ${isDirty ? 'bg-indigo-600' : 'bg-zinc-800'}`}
      >
        {saving ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Save size={16} color={isDirty ? "white" : "#71717a"} style={{ marginRight: 6 }} />
            <Text className={`font-bold text-xs ${isDirty ? 'text-white' : 'text-zinc-500'}`}>
              Salvar
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View className="flex-1 bg-black items-center justify-center">
      <ActivityIndicator color="#6366f1" size="large" />
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {renderHeader()}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          className="flex-1 px-6 pt-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Título do Capítulo */}
          <TextInput
            value={title}
            onChangeText={(t) => { setTitle(t); setIsDirty(true); }}
            placeholder="Título do Capítulo"
            placeholderTextColor="#52525b"
            className="text-2xl font-black text-white mb-6 border-b border-zinc-800 pb-4"
            multiline={false}
          />

          {/* Área de Escrita */}
          <TextInput
            value={content}
            onChangeText={(t) => { setContent(t); setIsDirty(true); }}
            placeholder="Comece a escrever sua história aqui..."
            placeholderTextColor="#3f3f46"
            className="text-lg text-zinc-300 leading-8 font-medium min-h-[500px]"
            multiline
            textAlignVertical="top"
            scrollEnabled={false} // Deixa o ScrollView pai controlar a rolagem
            autoCorrect={false} // Opcional: desativar corretor para escrita criativa
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}