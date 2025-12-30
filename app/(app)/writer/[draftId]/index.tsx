import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, 
  StatusBar, ImageBackground, Modal, TextInput, FlatList 
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Feather, FileText, Settings, Users, Globe, ChevronRight, 
  Plus, Download, Trash2, Search, X 
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { useReadingStore } from '../../../../stores/useReadingStore';

import { CharactersTab } from './_components/CharactersTab';
import { LoreTab } from './_components/LoreTab';
import { DraftSettingsModal } from './_components/DraftSettingsModal';
import { WriterAlert, WriterAlertType } from '../_components/WriterAlert';

export default function DraftDashboard() {
  const { draftId } = useLocalSearchParams();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { setBooks } = useReadingStore();
  
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'lore'>('chapters');
  const [settingsVisible, setSettingsVisible] = useState(false);

  // --- Estados da Busca ---
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Estados do WriterAlert (Custom Alert) ---
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: WriterAlertType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void;
    singleButton?: boolean;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (config: Omit<typeof alertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const loadDraftDetails = async () => {
    try {
      const res = await api.get(`/mobile/writer/drafts/${draftId}`);
      setDraft(res.data);
    } catch (error) {
      console.log("Erro ao carregar detalhes:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDraftDetails();
    }, [draftId])
  );

  // Lógica de Busca (Debounce Manual)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQuery.length >= 3) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await api.get(`/mobile/writer/drafts/${draftId}/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res.data);
        } catch (e) {
          console.log("Search error", e);
        } finally {
          setIsSearching(false);
        }
      }, 600);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery, draftId]);

  const handleAddChapter = async () => {
    try {
      const res = await api.post('/mobile/writer/chapters', { draftId });
      router.push(`/writer/${draftId}/editor/${res.data.id}` as any);
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível criar um novo capítulo.',
        singleButton: true
      });
    }
  };

  const handleDeleteDraft = () => {
    showAlert({
      type: 'error',
      title: 'Excluir Projeto',
      message: 'Tem certeza? Isso apagará todos os capítulos, personagens e lore permanentemente.',
      confirmText: 'Excluir',
      onConfirm: async () => {
        closeAlert();
        try {
          setLoading(true);
          await api.delete(`/mobile/writer/drafts/${draftId}`);
          router.replace('/writer');
        } catch (error) {
          setLoading(false);
          showAlert({
            type: 'error',
            title: 'Erro',
            message: 'Não foi possível excluir o projeto.',
            singleButton: true
          });
        }
      }
    });
  };

  const handleExport = () => {
    if (!draft.chapters || draft.chapters.length === 0) {
      return showAlert({
        type: 'info',
        title: 'Livro Vazio',
        message: 'Escreva pelo menos um capítulo antes de publicar.',
        singleButton: true
      });
    }

    showAlert({
      type: 'confirm',
      title: 'Publicar & Exportar',
      message: `Deseja gerar a versão final (EPUB)?\nCusto: 25 Créditos\nSeu Saldo: ${user?.credits} CR`,
      confirmText: 'Publicar',
      onConfirm: async () => {
        closeAlert();
        if ((user?.credits || 0) < 25) {
          return setTimeout(() => {
            showAlert({
              type: 'error',
              title: 'Saldo Insuficiente',
              message: 'Você precisa de 25 créditos para exportar seu livro.',
              singleButton: true
            });
          }, 500);
        }

        try {
          setExporting(true);
          const res = await api.post(`/mobile/writer/drafts/${draftId}/export`);
          if (user) updateUser({ ...user, credits: user.credits - 25 });

          const { bookId, action } = res.data;

          if (action === 'updated') {
            setTimeout(() => {
              showAlert({
                type: 'confirm',
                title: 'Nova Versão Criada',
                message: 'Você já possui este livro na biblioteca. Deseja substituir pela nova versão agora?',
                confirmText: 'Substituir',
                onConfirm: async () => {
                  closeAlert();
                  const localUri = `${FileSystem.documentDirectory}${bookId}.epub`;
                  await FileSystem.deleteAsync(localUri, { idempotent: true });
                  try {
                    const newBooks = await api.get('/mobile/books');
                    setBooks(newBooks.data);
                  } catch (e) {}
                  router.push(`/read/${bookId}`);
                }
              });
            }, 500);
          } else {
            setTimeout(() => {
              showAlert({
                type: 'success',
                title: 'Sucesso! 🎉',
                message: 'Seu livro foi publicado e já está disponível na biblioteca.',
                confirmText: 'Ler Agora',
                onConfirm: () => {
                  closeAlert();
                  router.push(`/read/${bookId}`);
                }
              });
            }, 500);
          }
        } catch (error: any) {
          const msg = error.response?.data?.error || "Falha na exportação.";
          showAlert({ type: 'error', title: 'Erro', message: msg, singleButton: true });
        } finally {
          setExporting(false);
        }
      }
    });
  };

  if (loading || !draft) return <View className="flex-1 bg-black items-center justify-center"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View className="h-72 relative">
        {draft.coverUrl ? (
          <ImageBackground source={{ uri: draft.coverUrl }} className="absolute inset-0" resizeMode="cover">
            <LinearGradient colors={['rgba(0,0,0,0.3)', '#000']} className="absolute inset-0" />
          </ImageBackground>
        ) : (
          <LinearGradient colors={['#312e81', '#1e1b4b', '#000']} className="absolute inset-0" />
        )}
        
        <View className="absolute bottom-0 w-full p-6 pb-6">
          <View className="flex-row justify-between items-start mb-4">
            <TouchableOpacity onPress={() => router.back()} className="bg-black/30 p-2 rounded-full backdrop-blur-md">
              <Feather color="white" size={20} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteDraft} className="bg-red-500/20 p-2 rounded-full border border-red-500/30 backdrop-blur-md">
              <Trash2 color="#f87171" size={18} />
            </TouchableOpacity>
          </View>
          
          <Text className="text-indigo-300 font-bold text-xs uppercase tracking-widest mb-1 shadow-black shadow-md">
            {draft.genre || 'Rascunho'} • {draft.status}
          </Text>
          <Text className="text-white font-black text-3xl shadow-sm mb-4 leading-8 shadow-black">
            {draft.title}
          </Text>
          
          <View className="flex-row space-x-3 gap-3">
            <TouchableOpacity 
              onPress={() => setSettingsVisible(true)}
              className="flex-row items-center bg-white/10 px-3 py-2 rounded-xl border border-white/20 backdrop-blur-md"
            >
              <Settings size={14} color="#a5b4fc" />
              <Text className="text-indigo-100 text-xs font-bold ml-2">Configurar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setSearchVisible(true);
                if(searchQuery.length < 3) setSearchResults([]); 
              }}
              className="flex-row items-center bg-indigo-500/20 px-3 py-2 rounded-xl border border-indigo-500/30 active:bg-indigo-500/30 backdrop-blur-md"
            >
              <Search size={14} color="#818cf8" />
              <Text className="text-indigo-200 text-xs font-bold ml-2">Localizar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleExport}
              disabled={exporting}
              className="flex-row items-center bg-emerald-500/20 px-3 py-2 rounded-xl border border-emerald-500/30 active:bg-emerald-500/30 backdrop-blur-md ml-auto"
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#34d399" />
              ) : (
                <Download size={14} color="#34d399" />
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
                        Editado em: {new Date(chapter.updatedAt).toLocaleDateString()}
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
          <CharactersTab draftId={draftId as string} characters={draft.characters || []} onRefresh={loadDraftDetails} />
        )}

        {activeTab === 'lore' && (
          <LoreTab draftId={draftId as string} lore={draft.lore || []} onRefresh={loadDraftDetails} />
        )}
      </ScrollView>

      <DraftSettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} draft={draft} onUpdate={loadDraftDetails} />

      {/* SEARCH MODAL */}
      <Modal animationType="slide" transparent={true} visible={searchVisible} onRequestClose={() => setSearchVisible(false)}>
        <View className="flex-1 bg-black/95">
          <View className="pt-14 px-4 pb-4 bg-zinc-900 border-b border-zinc-800 flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setSearchVisible(false)} className="p-1"><X size={24} color="#e4e4e7" /></TouchableOpacity>
            <View className="flex-1 h-12 bg-black rounded-xl flex-row items-center px-4 border border-zinc-800 focus:border-indigo-500">
              <Search size={18} color="#71717a" />
              <TextInput 
                className="flex-1 ml-3 text-white font-medium text-base"
                placeholder="Localizar no livro..."
                placeholderTextColor="#52525b"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {isSearching && <ActivityIndicator size="small" color="#6366f1" />}
            </View>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.chapterId}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="mb-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 active:bg-zinc-800"
                onPress={() => {
                  setSearchVisible(false);
                  router.push({
                    pathname: `/writer/${draftId}/editor/${item.chapterId}`,
                    params: { highlight: searchQuery }
                  } as any);
                }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <FileText size={14} color="#818cf8" />
                  <Text className="text-indigo-400 font-bold text-xs uppercase tracking-wide">{item.chapterTitle}</Text>
                </View>
                <Text className="text-zinc-300 text-sm leading-6 font-medium">
                  {item.snippet.split(new RegExp(`(${searchQuery})`, 'gi')).map((part: string, i: number) => (
                    part.toLowerCase() === searchQuery.toLowerCase() 
                      ? <Text key={i} className="bg-indigo-500/40 text-white font-bold">{part}</Text>
                      : <Text key={i} className="text-zinc-400">{part}</Text>
                  ))}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* COMPONENTE DE ALERTA CUSTOMIZADO */}
      <WriterAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onCancel={closeAlert}
        singleButton={alertConfig.singleButton}
      />
    </View>
  );
}