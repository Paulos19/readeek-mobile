import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Plus, Lock, Globe, Search, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Importante para o visual
import { communityService } from 'lib/api';
import { Community } from '../_types/community';

export default function CommunityList() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtragem local para busca instantânea
  const filteredCommunities = useMemo(() => {
    if (!searchQuery) return communities;
    return communities.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [communities, searchQuery]);

  const renderCommunityCard = ({ item }: { item: Community }) => {
    const isPrivate = item.visibility === 'private';

    return (
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push(`/(app)/community/${item.id}`)}
            className="mb-6 h-56 w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg relative"
        >
            {/* Imagem de Fundo (Capa) */}
            {item.coverUrl ? (
                <Image 
                    source={{ uri: item.coverUrl }} 
                    className="w-full h-full absolute" 
                    resizeMode="cover"
                />
            ) : (
                // Fallback visual se não tiver capa
                <View className="w-full h-full absolute bg-zinc-800 items-center justify-center">
                    <Users size={64} color="#3f3f46" />
                </View>
            )}

            {/* Gradiente para Legibilidade */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                className="absolute inset-0"
            />

            {/* Conteúdo do Card */}
            <View className="flex-1 p-5 justify-between">
                
                {/* Header do Card (Badges) */}
                <View className="flex-row justify-between items-start">
                    <View className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${isPrivate ? 'bg-red-500/90' : 'bg-emerald-500/90'}`}>
                        {isPrivate ? <Lock size={12} color="white" /> : <Globe size={12} color="white" />}
                        <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                            {isPrivate ? 'Privada' : 'Pública'}
                        </Text>
                    </View>

                    {/* Contador de Membros */}
                    <View className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-white/10">
                        <Users size={12} color="#e4e4e7" />
                        <Text className="text-zinc-200 text-[10px] font-bold">
                            {item._count?.members || 0}
                        </Text>
                    </View>
                </View>

                {/* Footer do Card (Info) */}
                <View>
                    <Text className="text-white font-black text-2xl mb-1 shadow-black shadow-md leading-tight" numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text className="text-zinc-300 text-sm mb-3 line-clamp-2 leading-5 opacity-90" numberOfLines={2}>
                        {item.description || "Uma comunidade para leitores apaixonados."}
                    </Text>
                    
                    <View className="flex-row items-center gap-1">
                        <Text className="text-emerald-400 text-xs font-bold uppercase">Acessar Comunidade</Text>
                        <ArrowRight size={12} color="#34d399" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* Cabeçalho Fixo */}
        <View className="px-6 py-4 bg-zinc-950 z-10">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Social</Text>
                    <Text className="text-white font-bold text-3xl">Descobrir</Text>
                </View>
                
                {/* Botão de Criar (FAB no Header para fácil acesso) */}
                <TouchableOpacity 
                    onPress={() => router.push('/(app)/community/create')}
                    className="bg-emerald-600 w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-emerald-900/50 border border-emerald-500/20"
                >
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Barra de Busca */}
            <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 focus:border-emerald-500/50 transition-colors">
                <Search size={20} color="#71717a" className="mr-3" />
                <TextInput 
                    placeholder="Buscar comunidades..."
                    placeholderTextColor="#71717a"
                    className="flex-1 text-white text-base"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </View>

        {/* Lista */}
        <FlatList
            data={filteredCommunities}
            renderItem={renderCommunityCard}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={onRefresh} 
                    tintColor="#10b981" 
                    colors={["#10b981"]}
                />
            }
            ListEmptyComponent={
                !loading ? (
                    <View className="items-center justify-center mt-20 px-10 opacity-60">
                        <Users size={64} color="#3f3f46" />
                        <Text className="text-zinc-500 text-center mt-6 text-lg font-medium">
                            {searchQuery ? "Nenhuma comunidade encontrada." : "Nada por aqui ainda."}
                        </Text>
                        <Text className="text-zinc-600 text-center mt-2 text-sm">
                            Que tal criar a primeira comunidade e juntar a galera?
                        </Text>
                    </View>
                ) : null
            }
        />
      </SafeAreaView>
    </View>
  );
}