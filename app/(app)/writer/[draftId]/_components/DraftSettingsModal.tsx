import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { X, List, Hash, Clock, Book, ToggleLeft, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInDown } from 'react-native-reanimated';

interface DraftSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  draft: any;
}

export const DraftSettingsModal = ({ visible, onClose, draft }: DraftSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'index' | 'general' | 'references'>('general');
  const [generateTocPage, setGenerateTocPage] = useState(true);
  const [autoLinkMentions, setAutoLinkMentions] = useState(false);

  // Estatísticas simuladas para "encorpar" a lógica visual
  const totalWords = draft?.chapters?.reduce((acc: number, ch: any) => acc + (ch.content?.split(' ').length || 0), 0) || 0;
  const readTime = Math.ceil(totalWords / 200); // 200 palavras por minuto

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <View>
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">Metadados do Livro</Text>
            <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-4">
              <View className="flex-row justify-between mb-4 border-b border-zinc-800 pb-4">
                <Text className="text-white font-bold">Título</Text>
                <Text className="text-zinc-400">{draft?.title}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-white font-bold">Gênero</Text>
                <Text className="text-zinc-400">{draft?.genre}</Text>
              </View>
            </View>
            
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">Capa</Text>
            <TouchableOpacity className="bg-zinc-900 h-32 rounded-xl border border-dashed border-zinc-700 items-center justify-center mb-6">
                <Text className="text-zinc-500 text-xs">Toque para alterar a capa</Text>
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
                                {chapter.content?.split(' ').length || 0} palavras
                            </Text>
                        </View>
                        <View className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                            <Text className="text-zinc-500 text-[10px]">Pág {index * 3 + 1}</Text>
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Animated.View 
            entering={SlideInDown.springify().damping(15)}
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
                <TouchableOpacity onPress={onClose}>
                    <LinearGradient
                        colors={['#4f46e5', '#3730a3']}
                        className="p-4 rounded-2xl flex-row justify-center items-center"
                    >
                        <Save size={18} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold uppercase tracking-widest">Salvar Alterações</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

        </Animated.View>
      </View>
    </Modal>
  );
};