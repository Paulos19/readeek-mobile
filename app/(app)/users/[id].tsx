import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, BookOpen, Users, Eye, Trophy, 
  UserPlus, UserCheck, Shield 
} from 'lucide-react-native';

import { fetchUserProfile, PublicUserProfile } from 'lib/api';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // Mock de estado

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchUserProfile(id);
      setProfile(data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = () => {
    // Aqui você conectaria com a API real de follow
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
        // Feedback visual rápido
        // Toast.show("Você agora segue este leitor");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-6">
        <View className="w-20 h-20 bg-zinc-900 rounded-full items-center justify-center mb-4">
            <Users size={32} color="#52525b" />
        </View>
        <Text className="text-white text-xl font-bold mb-2">Usuário não encontrado</Text>
        <Text className="text-zinc-500 text-center mb-8">
          O perfil pode estar privado ou não existir mais.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-zinc-800 px-8 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* === HEADER COM GRADIENTE === */}
        <View className="relative">
            <LinearGradient
                colors={['#064e3b', '#022c22', '#000000']} // Verde Esmeralda escuro para preto
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="h-64 w-full pt-12 px-4"
            >
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="w-10 h-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            {/* === INFO DO PERFIL (Sobreposto) === */}
            <View className="px-6 -mt-24">
                <View className="items-center">
                    {/* Avatar */}
                    <View className="relative shadow-2xl shadow-black">
                        <View className="w-32 h-32 rounded-full p-1 bg-black">
                            <Image
                                source={{ uri: profile.image || `https://ui-avatars.com/api/?name=${profile.name}&background=10b981&color=fff` }}
                                className="w-full h-full rounded-full bg-zinc-800"
                            />
                        </View>
                        {profile.role === 'ADMIN' && (
                            <View className="absolute bottom-2 right-2 bg-blue-500 p-1.5 rounded-full border-4 border-black">
                                <Shield size={14} color="white" fill="white" />
                            </View>
                        )}
                    </View>

                    {/* Nome e Bio */}
                    <Text className="text-white text-2xl font-bold mt-4 text-center">{profile.name}</Text>
                    <Text className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-1 mb-4">
                        {profile.role === 'ADMIN' ? 'Administrador' : 'Leitor'}
                    </Text>

                    {profile.about && (
                        <Text className="text-zinc-400 text-center text-sm leading-5 mb-6 px-4">
                            {profile.about}
                        </Text>
                    )}

                    {/* Botão Seguir */}
                    <TouchableOpacity 
                        onPress={handleFollowToggle}
                        className={`px-8 py-3 rounded-full flex-row items-center gap-2 ${
                            isFollowing ? 'bg-zinc-800 border border-zinc-700' : 'bg-emerald-600'
                        }`}
                    >
                        {isFollowing ? (
                            <>
                                <UserCheck size={18} color="#a1a1aa" />
                                <Text className="text-zinc-300 font-bold">Seguindo</Text>
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} color="white" />
                                <Text className="text-white font-bold">Seguir</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* === STATS === */}
                <View className="flex-row justify-between bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl mt-8 mb-6">
                    <StatItem value={profile._count.books} label="Livros" icon={BookOpen} />
                    <View className="w-[1px] bg-zinc-800" />
                    <StatItem value={profile._count.followers} label="Seguidores" icon={Users} />
                    <View className="w-[1px] bg-zinc-800" />
                    <StatItem value={profile._count.following} label="Seguindo" icon={Eye} />
                </View>
            </View>
        </View>

        {/* === INSÍGNIAS === */}
        {profile.displayedInsigniaIds && profile.displayedInsigniaIds.length > 0 && (
            <View className="mb-8 px-6">
                <View className="flex-row items-center gap-2 mb-4">
                    <Trophy size={18} color="#fbbf24" />
                    <Text className="text-zinc-200 font-bold text-lg">Conquistas</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {profile.displayedInsigniaIds.map((id, i) => (
                        <View key={i} className="mr-3 w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-xl items-center justify-center">
                            <Text className="text-2xl">🏅</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        )}

        {/* === BIBLIOTECA === */}
        <View className="px-6">
            <View className="flex-row items-center gap-2 mb-4">
                <BookOpen size={18} color="#10b981" />
                <Text className="text-zinc-200 font-bold text-lg">Biblioteca Pública</Text>
                <View className="bg-zinc-800 px-2 py-0.5 rounded text-xs">
                    <Text className="text-zinc-400 text-xs">{profile.books.length}</Text>
                </View>
            </View>

            {profile.books.length === 0 ? (
                <View className="items-center py-10 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                    <BookOpen size={32} color="#3f3f46" />
                    <Text className="text-zinc-500 mt-3">Nenhum livro visível</Text>
                </View>
            ) : (
                <View className="gap-3">
                    {profile.books.map((book) => (
                        <View key={book.id} className="flex-row bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                            {/* Capa */}
                            <View className="w-12 h-16 bg-zinc-800 rounded shadow-sm overflow-hidden mr-3">
                                {book.coverUrl ? (
                                    <Image source={{ uri: book.coverUrl }} className="w-full h-full" />
                                ) : (
                                    <View className="flex-1 items-center justify-center"><BookOpen size={12} color="#52525b"/></View>
                                )}
                            </View>
                            
                            {/* Info & Progresso */}
                            <View className="flex-1 justify-center">
                                <Text className="text-zinc-200 font-bold text-sm mb-1" numberOfLines={1}>{book.title}</Text>
                                <Text className="text-zinc-500 text-xs mb-2" numberOfLines={1}>{book.author || "Autor desconhecido"}</Text>
                                
                                {/* Barra de Progresso */}
                                <View className="flex-row items-center gap-2">
                                    <View className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <View 
                                            className="h-full bg-emerald-600 rounded-full" 
                                            style={{ width: `${book.progress || 0}%` }} 
                                        />
                                    </View>
                                    <Text className="text-zinc-400 text-[10px] font-medium w-8 text-right">{book.progress}%</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>

      </ScrollView>
    </View>
  );
}

// Subcomponente de Estatísticas para limpeza
const StatItem = ({ value, label, icon: Icon }: any) => (
    <View className="items-center flex-1">
        <Icon size={20} color="#10b981" style={{ marginBottom: 4, opacity: 0.8 }} />
        <Text className="text-white font-bold text-lg">{value}</Text>
        <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{label}</Text>
    </View>
);