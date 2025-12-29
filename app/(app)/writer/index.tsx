import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, BookOpen, ChevronRight } from 'lucide-react-native';
import { api } from '../../../lib/api'; // Sua lib de API configurada

export default function WriterStudioScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const res = await api.get('/mobile/writer/drafts'); // Rota que criaremos a seguir
      setDrafts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = () => {
    Alert.alert(
      "Nova História",
      "Iniciar um novo livro custa 15 Créditos. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Criar (-15 CR)", 
          onPress: () => router.push('/writer/create') 
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#312e81', '#000']} className="h-40 absolute w-full top-0" />
      
      <View className="px-6 pt-16 pb-6 flex-row justify-between items-center">
        <Text className="text-white font-black text-3xl">Meu Estúdio</Text>
        <TouchableOpacity onPress={createNewProject} className="bg-indigo-500 p-3 rounded-full">
            <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" className="mt-10" />
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 opacity-50">
                <BookOpen size={64} color="#6366f1" />
                <Text className="text-indigo-200 mt-4 font-bold text-center">
                    Sua estante de criação está vazia.{"\n"}Comece sua obra-prima hoje.
                </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
                onPress={() => router.push(`/writer/${item.id}`)}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl mb-4 flex-row items-center"
            >
                <View className="h-16 w-12 bg-zinc-800 rounded-lg mr-4 border border-zinc-700" />
                <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{item.title}</Text>
                    <Text className="text-zinc-500 text-xs uppercase font-bold mt-1">{item.genre || 'Sem Gênero'}</Text>
                    <Text className="text-indigo-400 text-xs mt-2">
                        {item._count?.chapters || 0} Capítulos • {item.status}
                    </Text>
                </View>
                <ChevronRight color="#52525b" size={20} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}