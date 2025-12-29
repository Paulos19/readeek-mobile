import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api } from '../../../../lib/api';
import { ChevronRight, FileText, Globe, Plus, Settings, Users2 } from 'lucide-react-native';

export default function DraftDashboard() {
  const { draftId } = useLocalSearchParams();
  const router = useRouter();
  
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'lore'>('chapters');

  // useFocusEffect garante que os dados recarregam quando voltamos do editor
  useFocusEffect(
    useCallback(() => {
      loadDraftDetails();
    }, [draftId])
  );

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

  const handleAddChapter = async () => {
    try {
      // Cria capítulo vazio e redireciona imediatamente para o editor
      const res = await api.post('/mobile/writer/chapters', { draftId });
      router.push(`/writer/${draftId}/editor/${res.data.id}` as any);
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar capítulo.");
    }
  };

  if (loading) return <View className="flex-1 bg-black items-center justify-center"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View className="flex-1 bg-black">
      {/* HEADER AMBIENTADO */}
      <View className="h-64 relative">
        <LinearGradient colors={['#312e81', '#1e1b4b', '#000']} className="absolute inset-0" />
        <View className="absolute bottom-0 w-full p-6 pb-8">
            <TouchableOpacity onPress={() => router.back()} className="mb-4 bg-black/20 self-start p-2 rounded-full">
                <Feather name="arrow-left" color="white" size={20} />
            </TouchableOpacity>
            
            <Text className="text-indigo-300 font-bold text-xs uppercase tracking-widest mb-1">
                {draft.genre || 'Rascunho'} • {draft.status}
            </Text>
            <Text className="text-white font-black text-3xl shadow-sm mb-2">{draft.title}</Text>
            
            <View className="flex-row space-x-4 mt-2">
                <TouchableOpacity className="flex-row items-center bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                    <Settings size={12} color="#a5b4fc" />
                    <Text className="text-indigo-200 text-xs font-bold ml-2">Configurar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <Feather name="download" size={12} color="#34d399" />
                    <Text className="text-emerald-400 text-xs font-bold ml-2">Exportar (-25 CR)</Text>
                </TouchableOpacity>
            </View>
        </View>
      </View>

      {/* TABS NAVEGAÇÃO */}
      <View className="flex-row px-6 border-b border-zinc-800 mb-4">
        {[
            { key: 'chapters', label: 'Capítulos', icon: FileText },
            { key: 'characters', label: 'Personagens', icon: Users2 },
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

      {/* CONTEÚDO DA TAB */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        
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
                    <Text className="text-zinc-600 text-center mt-10">Nenhum capítulo escrito ainda.</Text>
                ) : (
                    draft.chapters.map((chapter: any) => (
                        <TouchableOpacity 
                            key={chapter.id}
                            onPress={() => router.push(`/writer/${draftId}/editor/${chapter.id}` as any)}
                            className="bg-zinc-900 p-5 rounded-2xl mb-3 border border-zinc-800 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-8 h-8 bg-zinc-800 rounded-full items-center justify-center mr-4">
                                    <Text className="text-zinc-500 font-black text-xs">{chapter.order}</Text>
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base" numberOfLines={1}>{chapter.title}</Text>
                                    <Text className="text-zinc-500 text-[10px]">
                                        Última edição: {new Date(chapter.updatedAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight color="#52525b" size={18} />
                        </TouchableOpacity>
                    ))
                )}
            </View>
        )}

        {/* Placeholders para as outras tabs (implementaremos depois) */}
        {activeTab === 'characters' && (
            <View className="items-center mt-10">
                <Users2 size={48} color="#27272a" />
                <Text className="text-zinc-500 mt-4 text-center">Gestão de Personagens{"\n"}em breve...</Text>
            </View>
        )}
        {activeTab === 'lore' && (
            <View className="items-center mt-10">
                <Globe size={48} color="#27272a" />
                <Text className="text-zinc-500 mt-4 text-center">Construção de Mundo{"\n"}em breve...</Text>
            </View>
        )}

      </ScrollView>
    </View>
  );
}