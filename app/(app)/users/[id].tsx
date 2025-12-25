import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { fetchUserProfile, PublicUserProfile } from '../../../lib/api'; // Ajuste o caminho conforme necessário
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);
    const data = await fetchUserProfile(id);
    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-background-light dark:bg-background-dark">
        <Text className="text-text-secondary dark:text-gray-400">Usuário não encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header com botão voltar */}
      <View className="px-4 py-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} className="text-text-primary dark:text-white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4 text-text-primary dark:text-white">Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Info do Usuário */}
        <View className="items-center px-6 pt-4">
          <Image
            source={{ uri: profile.image || 'https://ui-avatars.com/api/?name=' + profile.name }}
            className="w-24 h-24 rounded-full border-2 border-primary"
          />
          <Text className="text-2xl font-bold mt-3 text-text-primary dark:text-white">{profile.name}</Text>
          <Text className="text-sm text-primary uppercase font-bold mt-1">{profile.role}</Text>
          
          {/* Bio */}
          {profile.about && (
            <Text className="text-center text-text-secondary dark:text-gray-300 mt-3 px-4">
              {profile.about}
            </Text>
          )}

          {/* Stats */}
          <View className="flex-row mt-6 w-full justify-around border-y border-gray-200 dark:border-gray-800 py-4">
            <View className="items-center">
              <Text className="font-bold text-lg text-text-primary dark:text-white">{profile._count.books}</Text>
              <Text className="text-xs text-text-secondary dark:text-gray-400">Livros</Text>
            </View>
            <View className="items-center">
              <Text className="font-bold text-lg text-text-primary dark:text-white">{profile._count.followers}</Text>
              <Text className="text-xs text-text-secondary dark:text-gray-400">Seguidores</Text>
            </View>
            <View className="items-center">
              <Text className="font-bold text-lg text-text-primary dark:text-white">{profile._count.following}</Text>
              <Text className="text-xs text-text-secondary dark:text-gray-400">Seguindo</Text>
            </View>
          </View>

          {/* Botão Seguir (Visual apenas) */}
          <TouchableOpacity 
            className="mt-6 bg-primary w-full py-3 rounded-xl items-center shadow-sm active:opacity-90"
            onPress={() => alert("Funcionalidade em breve!")}
          >
            <Text className="text-white font-bold text-base">Seguir</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Insígnias (Placeholder simples) */}
        {profile.displayedInsigniaIds.length > 0 && (
            <View className="px-6 mt-8">
                <Text className="text-lg font-bold mb-3 text-text-primary dark:text-white">Insígnias</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {/* Aqui você renderizaria os SVGs das insígnias baseado nos IDs */}
                    {profile.displayedInsigniaIds.map((id: React.Key | null | undefined, index: any) => (
                        <View key={id} className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-3 items-center justify-center">
                            <Text className="text-xs">🏆</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        )}

        {/* Lista de Livros */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-bold mb-4 text-text-primary dark:text-white">Biblioteca ({profile.books.length})</Text>
          
          {profile.books.length === 0 ? (
            <Text className="text-text-secondary dark:text-gray-400 italic">Nenhum livro público.</Text>
          ) : (
            profile.books.map((book) => (
              <View key={book.id} className="flex-row mb-4 bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm">
                {/* Capa */}
                <Image 
                    source={{ uri: book.coverUrl || 'https://via.placeholder.com/100x150' }}
                    className="w-16 h-24 rounded-md"
                    resizeMode="cover"
                />
                
                {/* Detalhes + Barra de Progresso */}
                <View className="flex-1 ml-4 justify-center">
                    <Text numberOfLines={2} className="font-bold text-base text-text-primary dark:text-white">
                        {book.title}
                    </Text>
                    <Text numberOfLines={1} className="text-sm text-text-secondary dark:text-gray-400 mb-2">
                        {book.author || "Autor Desconhecido"}
                    </Text>

                    {/* Barra de Progresso Visual */}
                    <View className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <View 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${book.progress}%` }} 
                        />
                    </View>
                    <Text className="text-xs text-right mt-1 text-text-secondary dark:text-gray-400">
                        {book.progress}% lido
                    </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}