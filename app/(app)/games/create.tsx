import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Code, Sparkles, Upload } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameService } from '../../../lib/api';

export default function CreateGameScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'IMPORT' | 'CREATE'>('IMPORT'); // IMPORT (45c) ou CREATE (60c)

  const handleCreate = async () => {
    if (!title || !htmlContent) {
      Alert.alert("Erro", "Preencha o título e o código do jogo.");
      return;
    }

    setLoading(true);
    const result = await gameService.create({
      title,
      description,
      htmlContent,
      orientation: 'PORTRAIT', // Pode adicionar seletor depois
      mode
    });
    setLoading(false);

    if (result.success) {
      Alert.alert("Sucesso!", "Jogo publicado com sucesso.");
      router.back();
    } else {
      Alert.alert("Erro", result.error === 'insufficient_funds' ? "Saldo insuficiente." : "Erro ao criar jogo.");
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center border-b border-zinc-900">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-zinc-900 rounded-full mr-4">
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-xl">Novo Jogo</Text>
        </View>

        <ScrollView className="p-6">
          {/* Seletor de Modo (Simplificado) */}
          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity 
              onPress={() => setMode('IMPORT')}
              className={`flex-1 p-4 rounded-xl border ${mode === 'IMPORT' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}
            >
              <Upload size={24} color={mode === 'IMPORT' ? '#10b981' : '#71717a'} className="mb-2" />
              <Text className="text-white font-bold">Importar HTML</Text>
              <Text className="text-zinc-500 text-xs mt-1">45 Créditos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setMode('CREATE')}
              className={`flex-1 p-4 rounded-xl border ${mode === 'CREATE' ? 'bg-purple-500/10 border-purple-500' : 'bg-zinc-900 border-zinc-800'}`}
            >
              <Sparkles size={24} color={mode === 'CREATE' ? '#a855f7' : '#71717a'} className="mb-2" />
              <Text className="text-white font-bold">Gerar com IA</Text>
              <Text className="text-zinc-500 text-xs mt-1">60 Créditos</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Text className="text-zinc-400 mb-2 text-sm font-bold uppercase">Título do Jogo</Text>
          <TextInput 
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Flappy Bird Clone"
            placeholderTextColor="#52525b"
            className="bg-zinc-900 text-white p-4 rounded-xl mb-6 border border-zinc-800"
          />

          <Text className="text-zinc-400 mb-2 text-sm font-bold uppercase">Descrição</Text>
          <TextInput 
            value={description}
            onChangeText={setDescription}
            placeholder="Como jogar..."
            placeholderTextColor="#52525b"
            multiline
            className="bg-zinc-900 text-white p-4 rounded-xl mb-6 border border-zinc-800 h-24"
            textAlignVertical="top"
          />

          <Text className="text-zinc-400 mb-2 text-sm font-bold uppercase">Código HTML/JS</Text>
          <TextInput 
            value={htmlContent}
            onChangeText={setHtmlContent}
            placeholder="<!DOCTYPE html>..."
            placeholderTextColor="#52525b"
            multiline
            className="bg-zinc-900 text-white p-4 rounded-xl mb-8 border border-zinc-800 h-48 font-mono text-xs"
            textAlignVertical="top"
            autoCapitalize="none"
          />

          <TouchableOpacity 
            onPress={handleCreate}
            disabled={loading}
            className={`w-full py-4 rounded-full items-center mb-10 ${loading ? 'bg-zinc-800' : 'bg-emerald-600'}`}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Publicar Jogo</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}