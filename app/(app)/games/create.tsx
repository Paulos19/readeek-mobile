import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, ScrollView, 
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { 
  Code2, Upload, Sparkles, ChevronLeft, Image as ImageIcon, 
  Smartphone, Monitor, Play, Check, X 
} from 'lucide-react-native';
import { useAuthStore } from 'stores/useAuthStore';
import { gameService } from 'lib/api';

type CreateMode = 'IMPORT' | 'EDITOR' | 'AI' | null;

export default function GameCreatorStudio() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  // Estados do Fluxo
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<CreateMode>(null);
  const [loading, setLoading] = useState(false);

  // Estados da IA
  const [prompt, setPrompt] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Formulário Geral
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [coverUri, setCoverUri] = useState<string | null>(null);

  // Custos
  const COSTS = { IMPORT: 45, EDITOR: 60, AI: 1500 };

  // --- HANDLERS DE SELEÇÃO ---
  const handleSelectMode = (selectedMode: CreateMode) => {
    if (!selectedMode) return;
    
    // Verificação de Saldo Inicial
    const cost = COSTS[selectedMode];
    if ((user?.credits || 0) < cost) {
      Alert.alert("Saldo Insuficiente", `Você precisa de ${cost} créditos para usar este modo.`);
      return;
    }
    
    // Se for IA, abrimos o modal direto, não muda de step ainda
    if (selectedMode === 'AI') {
      setMode('AI');
      setIsAiModalOpen(true);
      return;
    }

    setMode(selectedMode);
    setStep(2);
  };

  // --- HANDLERS DE ARQUIVO ---
  const handlePickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleImportHtml = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/html', 'text/plain'] });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        setHtmlContent(content);
        Alert.alert("Sucesso", "Código HTML importado!");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao ler o arquivo.");
    }
  };

  // --- SUBMIT GERAL (Manual/Import) ---
  const handleSubmit = async () => {
    if (!title || !description || !htmlContent || !mode) {
      Alert.alert("Campos vazios", "Preencha todas as informações e insira o código do jogo.");
      return;
    }

    setLoading(true);
    try {
      const result = await gameService.create({
        title,
        description,
        htmlContent,
        orientation,
        mode: mode === 'IMPORT' ? 'IMPORT' : 'CREATE',
        coverUri // Passando a capa se houver
      });

      if (result.success) {
        // Atualização Otimista
        updateUser({ credits: (user?.credits || 0) - COSTS[mode] });
        
        Alert.alert("Sucesso!", "Seu jogo foi publicado no Marketplace.", [
          { text: "OK", onPress: () => router.replace('/(app)/games') }
        ]);
      } else {
        Alert.alert("Erro", result.error === 'insufficient_funds' ? "Saldo insuficiente." : "Falha ao publicar jogo.");
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT IA ---
  const handleAiGenerate = async () => {
    if (!prompt.trim()) return Alert.alert("Atenção", "Descreva sua ideia para o jogo!");
    
    // Verificação redundante de saldo
    if ((user?.credits || 0) < COSTS.AI) {
        Alert.alert("Saldo", "Você precisa de 1500 créditos.");
        return;
    }

    setLoading(true);
    setIsAiModalOpen(false); // Fecha modal para mostrar loading na tela ou transição

    try {
        // Assumindo que você adicionou generateWithAi no gameService conforme instruções anteriores
        // Se não, certifique-se de atualizar o lib/api.ts
        const result = await gameService.generateWithAi({
            title: title || "Jogo Gerado por IA", // Usa titulo se o user ja tiver digitado algo, ou default
            prompt,
            orientation
        });

        if (result.success) {
            updateUser({ credits: (user?.credits || 0) - COSTS.AI });
            
            Alert.alert(
                "IA Iniciada! 🤖", 
                "O Agente está codificando seu jogo. Ele aparecerá na sua lista em breve com status 'Processando'.",
                [{ text: "Ir para Arcade", onPress: () => router.replace('/(app)/games') }]
            );
        } else {
            Alert.alert("Erro", result.error === 'insufficient_funds' ? "Saldo insuficiente." : "Falha ao iniciar geração.");
        }
    } catch (e) {
        Alert.alert("Erro", "Falha de conexão com o servidor de IA.");
    } finally {
        setLoading(false);
    }
  };

  // --- RENDERIZADORES ---

  const renderStep1 = () => (
    <View className="px-6 pt-4">
      <Text className="text-white font-bold text-2xl mb-2">Como você quer criar?</Text>
      <Text className="text-zinc-400 mb-8">Escolha o método para lançar seu game.</Text>

      {/* CARD: IMPORTAR */}
      <TouchableOpacity 
        onPress={() => handleSelectMode('IMPORT')}
        activeOpacity={0.8}
        className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-4 flex-row items-center"
      >
        <View className="w-12 h-12 bg-blue-500/10 rounded-full items-center justify-center mr-4">
          <Upload size={24} color="#3b82f6" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">Importar HTML</Text>
          <Text className="text-zinc-500 text-xs">Tenho o arquivo pronto (.html)</Text>
        </View>
        <View className="bg-zinc-800 px-3 py-1 rounded-full">
          <Text className="text-blue-400 font-bold text-xs">{COSTS.IMPORT}c</Text>
        </View>
      </TouchableOpacity>

      {/* CARD: EDITOR */}
      <TouchableOpacity 
        onPress={() => handleSelectMode('EDITOR')}
        activeOpacity={0.8}
        className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-4 flex-row items-center"
      >
        <View className="w-12 h-12 bg-emerald-500/10 rounded-full items-center justify-center mr-4">
          <Code2 size={24} color="#10b981" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">Editor de Código</Text>
          <Text className="text-zinc-500 text-xs">Escrever ou colar código</Text>
        </View>
        <View className="bg-zinc-800 px-3 py-1 rounded-full">
          <Text className="text-emerald-400 font-bold text-xs">{COSTS.EDITOR}c</Text>
        </View>
      </TouchableOpacity>

      {/* CARD: IA */}
      <TouchableOpacity 
        onPress={() => handleSelectMode('AI')}
        activeOpacity={0.8}
        className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-4 flex-row items-center"
      >
        <View className="w-12 h-12 bg-purple-500/10 rounded-full items-center justify-center mr-4">
          <Sparkles size={24} color="#a855f7" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">Gerar com IA</Text>
          <Text className="text-zinc-500 text-xs">Prompt text-to-game (N8N)</Text>
        </View>
        <View className="bg-zinc-800 px-3 py-1 rounded-full">
          <Text className="text-purple-400 font-bold text-xs">{COSTS.AI}c</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* CAPA */}
      <TouchableOpacity onPress={handlePickCover} className="h-48 w-full bg-zinc-900 rounded-2xl border border-zinc-800 border-dashed mb-6 items-center justify-center overflow-hidden">
        {coverUri ? (
          <Image source={{ uri: coverUri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="items-center">
            <ImageIcon size={32} color="#52525b" />
            <Text className="text-zinc-500 text-xs mt-2">Toque para adicionar capa</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* METADADOS */}
      <Text className="text-zinc-400 text-xs font-bold uppercase mb-2">Informações Básicas</Text>
      <TextInput 
        value={title} onChangeText={setTitle}
        placeholder="Título do Jogo" placeholderTextColor="#52525b"
        className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-3 font-bold text-lg"
      />
      <TextInput 
        value={description} onChangeText={setDescription}
        placeholder="Breve descrição e instruções..." placeholderTextColor="#52525b"
        multiline numberOfLines={3}
        className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-6 text-sm h-24"
        textAlignVertical="top"
      />

      {/* ORIENTAÇÃO */}
      <Text className="text-zinc-400 text-xs font-bold uppercase mb-2">Orientação da Tela</Text>
      <View className="flex-row gap-4 mb-6">
        <TouchableOpacity 
          onPress={() => setOrientation('PORTRAIT')}
          className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${orientation === 'PORTRAIT' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <Smartphone size={20} color={orientation === 'PORTRAIT' ? '#10b981' : '#71717a'} />
          <Text className={orientation === 'PORTRAIT' ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>Vertical</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setOrientation('LANDSCAPE')}
          className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${orientation === 'LANDSCAPE' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <Monitor size={20} color={orientation === 'LANDSCAPE' ? '#10b981' : '#71717a'} />
          <Text className={orientation === 'LANDSCAPE' ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>Horizontal</Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DE CÓDIGO */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-zinc-400 text-xs font-bold uppercase">Código Fonte (HTML5)</Text>
        {mode === 'IMPORT' && (
          <TouchableOpacity onPress={handleImportHtml} className="bg-blue-500/20 px-3 py-1 rounded-full">
             <Text className="text-blue-400 text-[10px] font-bold">RE-IMPORTAR</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TextInput 
        value={htmlContent} onChangeText={setHtmlContent}
        placeholder="<!DOCTYPE html><html>..." placeholderTextColor="#52525b"
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        className="bg-zinc-950 text-emerald-500 p-4 rounded-xl border border-zinc-800 mb-4 font-mono text-xs h-64"
        textAlignVertical="top"
      />
      
      <Text className="text-zinc-500 text-[10px] text-center mb-8">
        Certifique-se de incluir suporte a eventos de toque (touchstart, touchend) para controles móveis.
      </Text>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <StatusBar style="light" />
      
      {/* HEADER */}
      <View className="pt-14 px-6 pb-4 bg-zinc-950 border-b border-zinc-900 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800">
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white font-serif font-bold text-lg">
          {step === 1 ? 'Novo Jogo' : 'Configurar Jogo'}
        </Text>
        <View className="w-10" /> 
      </View>

      {step === 1 ? renderStep1() : renderStep2()}

      {/* FOOTER ACTION (Apenas para Import/Edit, IA usa o Modal) */}
      {step === 2 && (
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-black/90 border-t border-zinc-900">
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 h-14 rounded-full flex-row items-center justify-center shadow-lg shadow-emerald-900/40"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">
                   Publicar ({mode && COSTS[mode]}c)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL IA */}
      <Modal visible={isAiModalOpen} transparent animationType="slide" onRequestClose={() => setIsAiModalOpen(false)}>
        <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-zinc-900 rounded-t-3xl p-6 h-3/4 border-t border-zinc-800">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white font-bold text-xl flex-row items-center">
                        <Sparkles size={18} color="#a855f7" /> Agente de Games
                    </Text>
                    <TouchableOpacity onPress={() => setIsAiModalOpen(false)} className="p-2">
                        <X size={24} color="#71717a" />
                    </TouchableOpacity>
                </View>

                <Text className="text-zinc-400 mb-2 font-bold">Título do Jogo (Opcional)</Text>
                <TextInput 
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ex: Drone Delivery, Space Jump..."
                    placeholderTextColor="#52525b"
                    className="bg-black text-white p-4 rounded-xl border border-zinc-800 mb-4"
                />

                <Text className="text-zinc-400 mb-2 font-bold">Descreva a Jogabilidade</Text>
                <TextInput 
                    value={prompt}
                    onChangeText={setPrompt}
                    multiline
                    placeholder="Ex: Um jogo estilo Flappy Bird onde controlo um drone entregando pizzas. O cenário deve ser cyberpunk com neons. Ao bater nos prédios, perde."
                    placeholderTextColor="#52525b"
                    className="bg-black text-white p-4 rounded-xl border border-zinc-800 h-40 mb-2"
                    textAlignVertical="top"
                />

                <View className="flex-row gap-2 mb-6">
                    <TouchableOpacity onPress={() => setOrientation('PORTRAIT')} className={`px-3 py-1 rounded-full border ${orientation === 'PORTRAIT' ? 'bg-purple-500/20 border-purple-500' : 'border-zinc-700'}`}>
                        <Text className={orientation === 'PORTRAIT' ? 'text-purple-400' : 'text-zinc-500'}>Retrato</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setOrientation('LANDSCAPE')} className={`px-3 py-1 rounded-full border ${orientation === 'LANDSCAPE' ? 'bg-purple-500/20 border-purple-500' : 'border-zinc-700'}`}>
                        <Text className={orientation === 'LANDSCAPE' ? 'text-purple-400' : 'text-zinc-500'}>Paisagem</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-1 justify-end">
                    <Text className="text-zinc-500 text-xs mb-4 text-center">
                        Custo: <Text className="text-purple-400 font-bold">1500 créditos</Text> • Tempo: ~45s
                    </Text>

                    <TouchableOpacity 
                        onPress={handleAiGenerate}
                        disabled={loading}
                        className="bg-purple-600 h-14 rounded-full flex-row items-center justify-center shadow-lg shadow-purple-900/50"
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Sparkles size={20} color="#fff" />
                                <Text className="text-white font-bold ml-2">Gerar Código</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}