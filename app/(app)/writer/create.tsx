import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { api } from '../../../lib/api';
import { Book, Sparkles } from 'lucide-react-native';

export default function CreateDraftScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore(); // Precisamos atualizar os créditos locais após gastar
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert("Atenção", "O livro precisa de um título.");
    if ((user?.credits || 0) < 15) return Alert.alert("Saldo Insuficiente", "Precisa de 15 créditos para iniciar um projeto.");

    try {
      setLoading(true);
      const res = await api.post('/mobile/writer/drafts/create', {
        title,
        genre,
        synopsis
      });

      // Atualizar créditos do utilizador localmente
      if (user) {
        updateUser({ ...user, credits: user.credits - 15 });
      }

      Alert.alert("Sucesso!", "O seu novo universo foi criado.", [
        { text: "Entrar no Estúdio", onPress: () => router.replace(`/writer/${res.data.id}` as any) }
      ]);

    } catch (error: any) {
      Alert.alert("Erro", error.response?.data?.error || "Falha ao criar livro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#312e81', '#000']} className="h-64 absolute w-full top-0" />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          
          <TouchableOpacity onPress={() => router.back()} className="mt-12 mb-6 w-10 h-10 bg-zinc-900 rounded-full items-center justify-center">
            <Feather name="arrow-left" color="white" size={20} />
          </TouchableOpacity>

          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-indigo-500/20 rounded-full items-center justify-center border border-indigo-500/50 mb-4 shadow-xl shadow-indigo-500/30">
              <Sparkles color="#818cf8" size={40} />
            </View>
            <Text className="text-white font-black text-3xl text-center">Nova Obra</Text>
            <Text className="text-indigo-300 text-sm font-medium mt-2">Custo de Criação: 15 Créditos</Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2 ml-1">Título da Obra</Text>
              <TextInput 
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: As Crónicas de Readeek"
                placeholderTextColor="#52525b"
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-white font-bold text-lg"
              />
            </View>

            <View>
              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2 ml-1">Género Literário</Text>
              <TextInput 
                value={genre}
                onChangeText={setGenre}
                placeholder="Ex: Fantasia, Sci-Fi, Romance..."
                placeholderTextColor="#52525b"
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-white font-medium"
              />
            </View>

            <View>
              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2 ml-1">Sinopse Breve (Opcional)</Text>
              <TextInput 
                value={synopsis}
                onChangeText={setSynopsis}
                placeholder="Sobre o que é a sua história?"
                placeholderTextColor="#52525b"
                multiline
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-white font-medium min-h-[120px]"
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleCreate}
            disabled={loading}
            className="mt-10 bg-indigo-600 p-5 rounded-2xl items-center flex-row justify-center shadow-lg shadow-indigo-500/20 active:bg-indigo-700"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Book color="white" size={20} style={{ marginRight: 10 }} />
                <Text className="text-white font-black text-base tracking-wide">CONFIRMAR E CRIAR</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text className="text-zinc-600 text-center text-xs mt-4">
            Ao criar, 15 créditos serão descontados do seu saldo atual de {user?.credits}.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}