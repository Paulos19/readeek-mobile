import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Plus, Lock } from 'lucide-react-native';
import { communityService } from 'lib/api';
import { Community } from '../_types/community';

export default function CommunityList() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCommunities = async () => {
    try {
      const data = await communityService.getAll();
      setCommunities(data);
    } catch (e) {
      console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommunities();
    setRefreshing(false);
  };

  useEffect(() => { 
      fetchCommunities(); 
  }, []);

  const renderItem = ({ item }: { item: Community }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/community/${item.id}`)}
      className="bg-zinc-900 mb-4 rounded-xl overflow-hidden border border-zinc-800"
    >
        {/* Banner Preview (Se existir) */}
        {item.coverUrl && (
            <View className="h-24 w-full">
                <Image source={{ uri: item.coverUrl }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute inset-0 bg-black/40" />
            </View>
        )}

      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
            <Text className="text-white font-bold text-lg flex-1 mr-2">{item.name}</Text>
            {item.visibility === 'PRIVATE' && (
                <Lock size={16} color="#ef4444" />
            )}
        </View>
        
        <Text className="text-zinc-400 text-sm mb-3 line-clamp-2" numberOfLines={2}>
            {item.description || "Sem descrição"}
        </Text>
        
        <View className="flex-row items-center gap-4">
             <View className="flex-row items-center bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                <Users size={12} color="#a1a1aa" />
                <Text className="text-zinc-400 text-xs ml-1 font-medium">
                  {item._count?.members || 0} membros
                </Text>
             </View>
             
             {item.visibility === 'PRIVATE' && (
                <View className="bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                    <Text className="text-red-400 text-[10px] font-bold">PRIVADA</Text>
                </View>
             )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-zinc-800 bg-zinc-950">
        <Text className="text-white font-bold text-2xl">Comunidades</Text>
        
        {/* Botão de Criar com Navegação Atualizada */}
        <TouchableOpacity 
            onPress={() => router.push('/(app)/community/create')}
            className="bg-emerald-600 p-2 rounded-full shadow-lg shadow-emerald-900/50 active:bg-emerald-700"
        >
            <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={communities}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
            !loading ? (
                <View className="items-center justify-center mt-20 px-10">
                    <Users size={48} color="#3f3f46" />
                    <Text className="text-zinc-500 text-center mt-4 text-base">
                        Nenhuma comunidade encontrada. Que tal criar a primeira?
                    </Text>
                </View>
            ) : null
        }
      />
    </SafeAreaView>
  );
}