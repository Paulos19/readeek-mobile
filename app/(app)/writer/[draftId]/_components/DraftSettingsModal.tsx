import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { X, List, Hash, Clock, Book, ToggleLeft, Save, UploadCloud, Sparkles, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInDown, Easing } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { CoverGeneratorModal } from './CoverGeneratorModal'; // Importando o modal criado
import { api } from 'lib/api';

interface DraftSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  draft: any;
  onUpdate: () => void;
}

export const DraftSettingsModal = ({ visible, onClose, draft, onUpdate }: DraftSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'index' | 'general' | 'references'>('general');
  const [generateTocPage, setGenerateTocPage] = useState(true);
  const [autoLinkMentions, setAutoLinkMentions] = useState(false);
  
  // Estados de Edição
  const [title, setTitle] = useState(draft?.title || '');
  const [genre, setGenre] = useState(draft?.genre || '');
  const [coverUrl, setCoverUrl] = useState(draft?.coverUrl || null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Controle do Modal de IA
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  // Sincroniza dados quando o draft muda
  useEffect(() => {
    if (draft) {
      setTitle(draft.title);
      setGenre(draft.genre || '');
      setCoverUrl(draft.coverUrl);
    }
  }, [draft]);

  // Estatísticas
  const totalWords = draft?.chapters?.reduce((acc: number, ch: any) => acc + (ch.content?.split(/\s+/).length || 0), 0) || 0;
  const readTime = Math.ceil(totalWords / 200);

  // --- LÓGICA DE INTERAÇÃO DA CAPA ---
  const handleCoverPress = () => {
    Alert.alert(
      "Definir Capa",
      "Como você deseja adicionar a capa do seu livro?",
      [
        { 
          text: "Cancelar", 
          style: "cancel" 
        },
        { 
          text: "Galeria", 
          onPress: handlePickCover,
          style: "default"
        },
        { 
          text: "✨ Gerar com IA (1500 Créditos)", 
          onPress: () => setShowAiGenerator(true),
          style: "default"
        }
      ]
    );
  };

  const handlePickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3], // Proporção de livro padrão
      quality: 0.8,
    });

    if (!result.canceled) {
        uploadCover(result.assets[0].uri);
    }
  };

  const uploadCover = async (uri: string) => {
    setIsUploading(true);
    try {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'cover.jpg';
        // @ts-ignore
        formData.append('file', { uri, name: filename, type: 'image/jpeg' });

        const res = await api.post(`/mobile/writer/upload?filename=${filename}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        setCoverUrl(res.data.url); 
    } catch (e) {
        Alert.alert("Erro", "Falha no upload da capa.");
    } finally {
        setIsUploading(false);
    }
  };

  // Callback quando a IA termina de gerar e o usuário escolhe uma capa
  const handleAiCoverSelected = (newUrl: string) => {
      setCoverUrl(newUrl);
      // Opcional: Já salvar no banco imediatamente ou esperar o botão "Salvar" geral
      // Aqui estamos apenas atualizando o estado visual, o usuário precisa clicar em "Salvar Alterações" para persistir no draft geral, 
      // ou se o modal da IA já salvou no banco, este estado serve para refletir na UI.
      // No código do modal da IA anterior, ele já chama '/mobile/writer/ai/covers/save', então já está salvo no banco.
  };

  // --- SALVAR ALTERAÇÕES GERAIS ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
        await api.patch(`/mobile/writer/drafts/${draft.id}`, {
            title,
            genre,
            coverUrl
        });
        onUpdate();
        onClose();
    } catch (e) {
        Alert.alert("Erro", "Falha ao salvar alterações.");
    } finally {
        setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <View>
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">Metadados do Livro</Text>
            <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-6">
              <View className="mb-4 border-b border-zinc-800 pb-4">
                <Text className="text-zinc-400 text-xs mb-1">Título</Text>
                <TextInput 
                    value={title}
                    onChangeText={setTitle}
                    className="text-white font-bold text-base"
                    placeholderTextColor="#52525b"
                />
              </View>
              <View>
                <Text className="text-zinc-400 text-xs mb-1">Gênero</Text>
                <TextInput 
                    value={genre}
                    onChangeText={setGenre}
                    className="text-white font-medium"
                    placeholder="Ex: Fantasia, Sci-Fi..."
                    placeholderTextColor="#52525b"
                />
              </View>
            </View>
            
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">Capa</Text>
            <TouchableOpacity 
                onPress={handleCoverPress}
                className="bg-zinc-900 h-48 w-32 self-center rounded-xl border border-dashed border-zinc-700 items-center justify-center mb-6 overflow-hidden relative"
            >
                {isUploading ? (
                    <ActivityIndicator color="#6366f1" />
                ) : coverUrl ? (
                    <>
                        <Image source={{ uri: coverUrl }} className="w-full h-full opacity-80" resizeMode="cover" />
                        <View className="absolute bg-black/50 inset-0 items-center justify-center">
                            <Sparkles color="white" size={24} />
                        </View>
                    </>
                ) : (
                    <>
                        <UploadCloud color="#52525b" size={24} className="mb-2" />
                        <Text className="text-zinc-500 text-xs text-center px-2">Toque para adicionar capa</Text>
                    </>
                )}
            </TouchableOpacity>
          </View>
        );

      case 'index':
        return (
          <View>
            <View className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30 mb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-indigo-200 font-bold">Gerar Página de Índice</Text>
                    <Text className="text-indigo-400/60 text-[10px] w-48">Cria uma página HTML clicável no início do EPUB.</Text>
                </View>
                <Switch 
                    value={generateTocPage} 
                    onValueChange={setGenerateTocPage}
                    trackColor={{false: '#27272a', true: '#6366f1'}}
                />
            </View>

            <Text className="text-zinc-500 text-xs font-bold uppercase mb-3">Estrutura Calculada</Text>
            
            <View className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                {draft?.chapters?.map((chapter: any, index: number) => (
                    <View key={chapter.id} className="flex-row items-center p-4 border-b border-zinc-800">
                        <Text className="text-zinc-600 font-black mr-4 w-6">{index + 1}</Text>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-sm" numberOfLines={1}>{chapter.title}</Text>
                            <Text className="text-zinc-500 text-[10px]">
                                {chapter.content?.split(/\s+/).length || 0} palavras
                            </Text>
                        </View>
                        <View className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                            <Text className="text-zinc-500 text-[10px]">Cap {index + 1}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View className="flex-row mt-6 justify-between">
                <View className="bg-zinc-900 p-3 rounded-xl items-center flex-1 mr-2 border border-zinc-800">
                    <Hash size={16} color="#a1a1aa" />
                    <Text className="text-white font-bold text-lg mt-1">{totalWords}</Text>
                    <Text className="text-zinc-500 text-[10px] uppercase">Palavras</Text>
                </View>
                <View className="bg-zinc-900 p-3 rounded-xl items-center flex-1 ml-2 border border-zinc-800">
                    <Clock size={16} color="#a1a1aa" />
                    <Text className="text-white font-bold text-lg mt-1">~{readTime} min</Text>
                    <Text className="text-zinc-500 text-[10px] uppercase">Leitura</Text>
                </View>
            </View>
          </View>
        );

      case 'references':
        return (
          <View>
             <View className="items-center py-6">
                <Text className="text-zinc-400 text-center mb-6 px-4">
                    O sistema pode varrer seu texto e criar links automáticos para a aba de Lore e Personagens.
                </Text>
             </View>

             <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-white font-bold">Menções Automáticas</Text>
                    <Text className="text-zinc-500 text-[10px]">Linkar nomes de personagens</Text>
                </View>
                <Switch 
                    value={autoLinkMentions} 
                    onValueChange={setAutoLinkMentions}
                    trackColor={{false: '#27272a', true: '#10b981'}}
                />
            </View>

            <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 opacity-50">
                <Text className="text-white font-bold mb-1">Glossário no Final</Text>
                <Text className="text-zinc-500 text-xs">Adicionar apêndice com Lore (Em breve)</Text>
            </View>
          </View>
        );
    }
  };

  if (!visible) return null;

  return (
    <>
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View className="flex-1 justify-end bg-black/60">
            <Animated.View 
                entering={SlideInDown.duration(300).easing(Easing.out(Easing.quad))}
                className="bg-zinc-950 rounded-t-[32px] h-[85%] border-t border-zinc-800"
            >
                {/* Handle */}
                <View className="items-center pt-3 pb-2">
                    <View className="w-12 h-1 bg-zinc-800 rounded-full" />
                </View>

                {/* Header */}
                <View className="px-6 pb-4 flex-row justify-between items-center border-b border-zinc-900">
                    <Text className="text-white font-black text-2xl">Configurações</Text>
                    <TouchableOpacity onPress={onClose} className="bg-zinc-900 p-2 rounded-full">
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View className="flex-row px-6 mt-4 mb-6">
                    {[
                        { id: 'general', label: 'Geral', icon: Book },
                        { id: 'index', label: 'Índice', icon: List },
                        { id: 'references', label: 'Refs', icon: ToggleLeft },
                    ].map((tab) => (
                        <TouchableOpacity 
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id as any)}
                            className={`mr-3 px-4 py-2.5 rounded-full flex-row items-center border ${activeTab === tab.id ? 'bg-indigo-600 border-indigo-500' : 'bg-zinc-900 border-zinc-800'}`}
                        >
                            <tab.icon size={14} color={activeTab === tab.id ? 'white' : '#71717a'} />
                            <Text className={`ml-2 text-xs font-bold ${activeTab === tab.id ? 'text-white' : 'text-zinc-500'}`}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                    {renderTabContent()}
                </ScrollView>

                {/* Footer Action */}
                <View className="p-6 border-t border-zinc-900 bg-zinc-950 pb-10">
                    <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                        <LinearGradient
                            colors={['#4f46e5', '#3730a3']}
                            className="p-4 rounded-2xl flex-row justify-center items-center"
                        >
                            {isSaving ? <ActivityIndicator color="white" /> : (
                                <>
                                    <Save size={18} color="white" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-bold uppercase tracking-widest">Salvar Alterações</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </Animated.View>
        </View>
        </Modal>

        {/* Modal de IA Renderizado condicionalmente */}
        {showAiGenerator && (
            <CoverGeneratorModal 
                visible={showAiGenerator}
                onClose={() => setShowAiGenerator(false)}
                draftId={draft?.id}
                onCoverUpdated={handleAiCoverSelected}
            />
        )}
    </>
  );
};