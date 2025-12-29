import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FileText, Settings, Users, Globe, ChevronRight, Plus, Download, Trash2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy'; // Importante para deletar localmente

import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { useReadingStore } from '../../../../stores/useReadingStore'; // Para atualizar a estante

// Componentes
import { CharactersTab } from './_components/CharactersTab';
import { LoreTab } from './_components/LoreTab';
import { DraftSettingsModal } from './_components/DraftSettingsModal';

export default function DraftDashboard() {
  const { draftId } = useLocalSearchParams();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { setBooks } = useReadingStore(); // Para forçar refresh da biblioteca
  
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'lore'>('chapters');
  const [settingsVisible, setSettingsVisible] = useState(false);

  const loadDraftDetails = async () => {
    try {
      const res = await api.get(`/mobile/writer/drafts/${draftId}`);
      setDraft(res.data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o projeto.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!draft) setLoading(true);
      loadDraftDetails();
    }, [draftId])
  );

  const handleAddChapter = async () => {
    try {
      const res = await api.post('/mobile/writer/chapters', { draftId });
      router.push(`/writer/${draftId}/editor/${res.data.id}` as any);
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar capítulo.");
    }
  };

  // --- LÓGICA DE DELETAR RASCUNHO (Agora funciona com o Backend corrigido) ---
  const handleDeleteDraft = () => {
    Alert.alert(
        "Excluir Projeto",
        "Tem certeza? Isso apagará todos os capítulos, personagens e lore permanentemente.",
        [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Excluir", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        setLoading(true);
                        await api.delete(`/mobile/writer/drafts/${draftId}`);
                        router.replace('/writer'); // Volta para a lista
                    } catch (error) {
                        Alert.alert("Erro", "Não foi possível excluir.");
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  // --- LÓGICA DE EXPORTAÇÃO E SUBSTITUIÇÃO ---
  const handleExport = () => {
    if (!draft.chapters || draft.chapters.length === 0) {
      return Alert.alert("Livro Vazio", "Escreva pelo menos um capítulo antes de publicar.");
    }

    Alert.alert(
      "Publicar & Exportar",
      `Gerar versão final (EPUB)?\nCusto: 25 Créditos\nSaldo: ${user?.credits} CR`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            if ((user?.credits || 0) < 25) return Alert.alert("Erro", "Saldo insuficiente.");

            try {
              setExporting(true);
              const res = await api.post(`/mobile/writer/drafts/${draftId}/export`);
              
              if (user) updateUser({ ...user, credits: user.credits - 25 });

              const { bookId, action } = res.data;

              // Lógica de Substituição
              if (action === 'updated') {
                  Alert.alert(
                      "Nova Versão Criada",
                      "Você já possui este livro na biblioteca. Deseja substituir a versão antiga pela nova agora?",
                      [
                          { text: "Não, manter antiga", style: "cancel" },
                          { 
                              text: "Sim, Substituir", 
                              onPress: async () => {
                                  // 1. Apaga arquivo local
                                  const localUri = `${FileSystem.documentDirectory}${bookId}.epub`;
                                  await FileSystem.deleteAsync(localUri, { idempotent: true });
                                  
                                  // 2. Limpa cache de download (opcional, dependendo de como você implementou no useReader)
                                  // await AsyncStorage.removeItem(`@book_download_date:${bookId}`);

                                  // 3. Força refresh da store
                                  try {
                                      const newBooks = await api.get('/mobile/books');
                                      setBooks(newBooks.data);
                                  } catch (e) {}

                                  Alert.alert("Sucesso", "Livro atualizado! Abra-o para ler a nova versão.", [
                                      { text: "Ler Agora", onPress: () => router.push(`/read/${bookId}`) }
                                  ]);
                              } 
                          }
                      ]
                  );
              } else {
                  // Novo livro
                  Alert.alert(
                    "Sucesso! 🎉", 
                    "Livro publicado e adicionado à biblioteca.",
                    [
                      { text: "Ler Agora", onPress: () => router.push(`/read/${bookId}`) }
                    ]
                  );
              }

            } catch (error: any) {
              const msg = error.response?.data?.error || "Falha na exportação.";
              Alert.alert("Erro", msg);
            } finally {
              setExporting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) return <View className="flex-1 bg-black items-center justify-center"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* HEADER AMBIENTADO */}
      <View className="h-72 relative">
        <LinearGradient colors={['#312e81', '#1e1b4b', '#000']} className="absolute inset-0" />
        <View className="absolute bottom-0 w-full p-6 pb-6">
            <View className="flex-row justify-between items-start mb-4">
                <TouchableOpacity onPress={() => router.back()} className="bg-black/20 p-2 rounded-full">
                    <Feather color="white" size={20} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDeleteDraft} className="bg-red-500/20 p-2 rounded-full border border-red-500/30">
                    <Trash2 color="#f87171" size={18} />
                </TouchableOpacity>
            </View>
            
            <Text className="text-indigo-300 font-bold text-xs uppercase tracking-widest mb-1">
                {draft.genre || 'Rascunho'} • {draft.status}
            </Text>
            <Text className="text-white font-black text-3xl shadow-sm mb-4 leading-8">
              {draft.title}
            </Text>
            
            <View className="flex-row space-x-3 gap-3">
                <TouchableOpacity 
                    onPress={() => setSettingsVisible(true)}
                    className="flex-row items-center bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-500/30"
                >
                    <Settings size={14} color="#a5b4fc" />
                    <Text className="text-indigo-200 text-xs font-bold ml-2">Configurar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleExport}
                  disabled={exporting}
                  className="flex-row items-center bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30 active:bg-emerald-500/20"
                >
                    {exporting ? (
                      <ActivityIndicator size="small" color="#34d399" />
                    ) : (
                      <>
                        <Download size={14} color="#34d399" />
                        <Text className="text-emerald-400 text-xs font-bold ml-2">Publicar</Text>
                      </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
      </View>

      {/* TABS */}
      <View className="flex-row px-6 border-b border-zinc-800 mb-4">
        {[
            { key: 'chapters', label: 'Capítulos', icon: FileText },
            { key: 'characters', label: 'Personagens', icon: Users },
            { key: 'lore', label: 'Mundo', icon: Globe }
        ].map((tab) => (
            <TouchableOpacity 
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                className={`mr-6 pb-3 flex-row items-center ${activeTab === tab.key ? 'border-b-2 border-indigo-500' : ''}`}
            >
                <tab.icon size={14} color={activeTab === tab.key ? '#818cf8' : '#71717a'} />
                <Text className={`ml-2 font-bold text-sm ${activeTab === tab.key ? 'text-white' : 'text-zinc-500'}`}>
                    {tab.label}
                </Text>
            </TouchableOpacity>
        ))}
      </View>

      {/* CONTEÚDO */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'chapters' && (
            <View>
                <TouchableOpacity 
                    onPress={handleAddChapter}
                    className="bg-zinc-900 border border-zinc-800 border-dashed p-4 rounded-xl flex-row items-center justify-center mb-6 active:bg-zinc-800"
                >
                    <Plus color="#a1a1aa" size={20} />
                    <Text className="text-zinc-400 font-bold ml-2">Novo Capítulo</Text>
                </TouchableOpacity>

                {draft.chapters?.length === 0 ? (
                    <Text className="text-zinc-600 text-center mt-10 font-medium">
                      O livro está em branco.{"\n"}Comece a escrever a sua história!
                    </Text>
                ) : (
                    draft.chapters.map((chapter: any) => (
                        <TouchableOpacity 
                            key={chapter.id}
                            onPress={() => router.push(`/writer/${draftId}/editor/${chapter.id}` as any)}
                            className="bg-zinc-900 p-5 rounded-2xl mb-3 border border-zinc-800 flex-row items-center justify-between active:border-indigo-500/50"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-8 h-8 bg-zinc-800 rounded-full items-center justify-center mr-4 border border-zinc-700">
                                    <Text className="text-zinc-400 font-black text-xs">{chapter.order}</Text>
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base" numberOfLines={1}>{chapter.title}</Text>
                                    <Text className="text-zinc-500 text-[10px] mt-0.5">
                                        Editado a: {new Date(chapter.updatedAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight color="#52525b" size={18} />
                        </TouchableOpacity>
                    ))
                )}
            </View>
        )}

        {activeTab === 'characters' && (
            <CharactersTab 
                draftId={draftId as string} 
                characters={draft.characters || []} 
                onRefresh={loadDraftDetails}
            />
        )}

        {activeTab === 'lore' && (
            <LoreTab 
                draftId={draftId as string} 
                lore={draft.lore || []} 
                onRefresh={loadDraftDetails}
            />
        )}

      </ScrollView>

      <DraftSettingsModal 
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        draft={draft}
      />

    </View>
  );
}