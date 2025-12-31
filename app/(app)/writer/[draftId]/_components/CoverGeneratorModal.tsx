import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Sparkles, Check, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from 'stores/useAuthStore';
import { api } from 'lib/api';

interface CoverGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  draftId: string;
  onCoverUpdated: (newUrl: string) => void;
}

export function CoverGeneratorModal({ visible, onClose, draftId, onCoverUpdated }: CoverGeneratorModalProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<'input' | 'generating' | 'selection'>('input');
  
  // Form State
  const [genre, setGenre] = useState('');
  const [style, setStyle] = useState('');
  const [colors, setColors] = useState('');
  const [description, setDescription] = useState('');

  // Result State
  const [generatedCovers, setGeneratedCovers] = useState<{id: number, url: string}[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if ((user?.credits || 0) < 1500) {
      Alert.alert("Saldo Insuficiente", "Você precisa de 1500 créditos.");
      return;
    }

    try {
      setStep('generating');
      const res = await api.post('/mobile/writer/ai/covers/generate', {
        draftId,
        genre,
        style,
        colors,
        description
      });
      
      if (res.data.covers) {
        setGeneratedCovers(res.data.covers);
        setStep('selection');
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar capas. Seus créditos não foram descontados.");
      setStep('input');
    }
  };

  const handleSaveChoice = async () => {
    if (selectedCoverIndex === null) return;
    
    try {
      setIsSaving(true);
      const chosenUrl = generatedCovers[selectedCoverIndex].url;
      
      const res = await api.post('/mobile/writer/ai/covers/save', {
        draftId,
        imageUrl: chosenUrl
      });

      onCoverUpdated(res.data.coverUrl);
      onClose();
      // Reset states
      setStep('input');
      setGeneratedCovers([]);
      setSelectedCoverIndex(null);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar a capa escolhida.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-zinc-900 rounded-t-3xl h-[85%] border-t border-zinc-800">
          
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-zinc-800">
            <Text className="text-xl font-bold text-white">
              {step === 'selection' ? 'Escolha sua Capa' : 'Criar Capa com IA'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            
            {step === 'input' && (
              <View className="space-y-4">
                <View className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 flex-row items-center space-x-3 mb-2">
                  <Sparkles size={20} color="#10b981" />
                  <Text className="text-emerald-400 font-medium">Custo: 1500 créditos</Text>
                </View>

                <View>
                  <Text className="text-zinc-400 mb-2">Gênero Literário</Text>
                  <TextInput 
                    className="bg-zinc-800 p-4 rounded-xl text-white border border-zinc-700 focus:border-emerald-500"
                    placeholder="Ex: Fantasia Sombria, Romance Cyberpunk"
                    placeholderTextColor="#52525b"
                    value={genre}
                    onChangeText={setGenre}
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 mb-2">Estilo Artístico</Text>
                  <TextInput 
                    className="bg-zinc-800 p-4 rounded-xl text-white border border-zinc-700"
                    placeholder="Ex: Pintura a óleo, 3D Render, Minimalista"
                    placeholderTextColor="#52525b"
                    value={style}
                    onChangeText={setStyle}
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 mb-2">Cores de Destaque</Text>
                  <TextInput 
                    className="bg-zinc-800 p-4 rounded-xl text-white border border-zinc-700"
                    placeholder="Ex: Dourado e Preto, Neon Azul"
                    placeholderTextColor="#52525b"
                    value={colors}
                    onChangeText={setColors}
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 mb-2">Elementos Visuais (Descrição)</Text>
                  <TextInput 
                    className="bg-zinc-800 p-4 rounded-xl text-white border border-zinc-700 h-32"
                    placeholder="Descreva o que deve aparecer na capa (personagens, cenários, objetos)..."
                    placeholderTextColor="#52525b"
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
              </View>
            )}

            {step === 'generating' && (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-white mt-4 font-medium text-lg">Invocando a IA...</Text>
                <Text className="text-zinc-500 text-center mt-2 px-10">
                  Isso pode levar até 30 segundos. Estamos pintando sua obra.
                </Text>
              </View>
            )}

            {step === 'selection' && (
              <View className="flex-row flex-wrap justify-between">
                {generatedCovers.map((cover, index) => (
                  <TouchableOpacity 
                    key={cover.id}
                    onPress={() => setSelectedCoverIndex(index)}
                    className={`w-[48%] aspect-[2/3] rounded-xl overflow-hidden mb-4 border-2 ${selectedCoverIndex === index ? 'border-emerald-500' : 'border-transparent'}`}
                  >
                    <Image 
                      source={{ uri: cover.url }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {selectedCoverIndex === index && (
                      <View className="absolute inset-0 bg-emerald-500/20 items-center justify-center">
                        <View className="bg-emerald-500 rounded-full p-2">
                          <Check size={20} color="white" />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

          </ScrollView>

          {/* Footer Actions */}
          <View className="p-4 bg-zinc-900 border-t border-zinc-800 pb-8">
            {step === 'input' && (
              <TouchableOpacity 
                onPress={handleGenerate}
                className="bg-emerald-600 p-4 rounded-xl flex-row justify-center items-center"
              >
                <Sparkles size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg">Gerar Capas</Text>
              </TouchableOpacity>
            )}

            {step === 'selection' && (
              <View className="flex-row space-x-3">
                 <TouchableOpacity 
                  onPress={() => setStep('input')}
                  className="flex-1 bg-zinc-800 p-4 rounded-xl flex-row justify-center items-center border border-zinc-700"
                >
                  <RefreshCw size={20} color="white" className="mr-2" />
                  <Text className="text-white font-bold">Tentar Novamente</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleSaveChoice}
                  disabled={selectedCoverIndex === null || isSaving}
                  className={`flex-1 p-4 rounded-xl flex-row justify-center items-center ${selectedCoverIndex !== null ? 'bg-emerald-600' : 'bg-zinc-700 opacity-50'}`}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Check size={20} color="white" className="mr-2" />
                      <Text className="text-white font-bold">Escolher Essa</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}