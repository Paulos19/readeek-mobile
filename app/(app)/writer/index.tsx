import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, 
  Dimensions, StatusBar, RefreshControl, ImageBackground 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, BookOpen, FileText, Clock, Sparkles, PenTool, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../../lib/api';
import { WriterAlert } from './_components/WriterAlert';

const { width } = Dimensions.get('window');

// Definição de Tipos para o Rascunho
interface Draft {
  id: string;
  title: string;
  genre?: string;
  status: 'DRAFT' | 'PUBLISHED';
  coverUrl?: string;
  updatedAt: string;
  _count: {
    chapters: number;
  };
}

export default function WriterStudioScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para o Alerta Personalizado
  const [alertVisible, setAlertVisible] = useState(false);

  // Recarrega os dados sempre que a tela ganha foco (ao voltar da criação)
  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [])
  );

  const loadDrafts = async () => {
    try {
      const res = await api.get('/mobile/writer/drafts');
      setDrafts(res.data);
    } catch (error) {
      console.error("Erro ao carregar drafts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDrafts();
  };

  const handleCreateConfirm = () => {
    setAlertVisible(false);
    // Pequeno delay para a animação do modal fechar
    setTimeout(() => {
        router.push('/writer/create');
    }, 200);
  };

  // --- COMPONENTES DE UI ---

  // Placeholder de Capa (Caso não tenha imagem)
  const CoverPlaceholder = ({ title }: { title: string }) => (
    <LinearGradient
      colors={['#4f46e5', '#312e81']} // Indigo Gradient
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      className="w-full h-full justify-center items-center p-2"
    >
      <BookOpen size={24} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', top: 10, right: 10 }} />
      <Text 
        className="text-white font-serif font-bold text-center text-lg leading-tight" 
        numberOfLines={3}
      >
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </Text>
      <View className="absolute bottom-2 left-2 border border-white/20 px-1.5 py-0.5 rounded">
        <Text className="text-[8px] text-white/60 font-bold uppercase">RE A D E E K</Text>
      </View>
    </LinearGradient>
  );

  const renderDraftItem = ({ item, index }: { item: Draft, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()} 
      className="mb-4"
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push(`/writer/${item.id}`)}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex-row shadow-lg shadow-black/50"
        style={{ height: 140 }}
      >
        {/* LADO ESQUERDO: CAPA */}
        <View className="w-28 h-full bg-zinc-800 relative">
          {item.coverUrl ? (
             <ImageBackground 
                source={{ uri: item.coverUrl }} 
                className="w-full h-full" 
                resizeMode="cover"
             >
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} className="absolute inset-0" />
             </ImageBackground>
          ) : (
             <CoverPlaceholder title={item.title} />
          )}
        </View>

        {/* LADO DIREITO: DETALHES */}
        <View className="flex-1 p-4 justify-between bg-zinc-900/50">
          <View>
             <View className="flex-row justify-between items-start">
                <View className={`px-2 py-0.5 rounded-md mb-2 self-start ${item.status === 'PUBLISHED' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-800 border border-zinc-700'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.status === 'PUBLISHED' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {item.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                    </Text>
                </View>
                <ChevronRight size={16} color="#52525b" />
             </View>
             
             <Text className="text-white font-bold text-lg leading-6" numberOfLines={2}>
                {item.title}
             </Text>
             <Text className="text-zinc-500 text-xs font-medium mt-1">
                {item.genre || 'Fantasia Geral'}
             </Text>
          </View>

          {/* RODAPÉ DO CARD */}
          <View className="flex-row items-center gap-4 border-t border-zinc-800/50 pt-3 mt-2">
             <View className="flex-row items-center gap-1.5">
                <FileText size={12} color="#818cf8" />
                <Text className="text-zinc-400 text-xs font-medium">
                    {item._count?.chapters || 0} <Text className="text-zinc-600">capítulos</Text>
                </Text>
             </View>
             
             <View className="flex-row items-center gap-1.5">
                <Clock size={12} color="#71717a" />
                <Text className="text-zinc-400 text-xs font-medium">
                    {new Date(item.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </Text>
             </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* HEADER FIXO */}
      <View className="absolute top-0 w-full z-10">
         <LinearGradient 
            colors={['#000', 'rgba(0,0,0,0.8)', 'transparent']} 
            className="h-32 absolute w-full top-0" 
         />
         <View className="px-6 pt-14 pb-4 flex-row justify-between items-end">
            <View>
                <Text className="text-zinc-400 font-medium text-xs uppercase tracking-widest mb-1">
                    Writer Studio
                </Text>
                <Text className="text-white font-black text-3xl tracking-tight">
                    Minhas Obras
                </Text>
            </View>

            <TouchableOpacity 
                onPress={() => setAlertVisible(true)}
                activeOpacity={0.7}
                className="bg-indigo-600 w-12 h-12 rounded-full items-center justify-center border border-indigo-400 shadow-lg shadow-indigo-500/30"
            >
                <Plus color="white" size={26} strokeWidth={2.5} />
            </TouchableOpacity>
         </View>
      </View>

      {/* CONTEÚDO PRINCIPAL */}
      <View className="flex-1 pt-32">
        {loading ? (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator color="#6366f1" size="large" />
                <Text className="text-zinc-500 text-xs mt-4">Carregando estúdio...</Text>
            </View>
        ) : (
            <FlatList
                data={drafts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }}
                renderItem={renderDraftItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
                ListEmptyComponent={
                    <Animated.View 
                        entering={FadeInDown.springify()} 
                        className="items-center justify-center py-20 opacity-80"
                    >
                        <View className="bg-zinc-900/50 p-6 rounded-full border border-zinc-800 mb-6 relative">
                            <Sparkles size={24} color="#fbbf24" style={{ position: 'absolute', top: 0, right: 0 }} />
                            <PenTool size={48} color="#6366f1" />
                        </View>
                        <Text className="text-white font-bold text-xl text-center mb-2">
                            Sua jornada começa aqui
                        </Text>
                        <Text className="text-zinc-400 text-center text-sm px-10 leading-6">
                            Você ainda não tem livros criados.{"\n"}Toque no botão <Text className="font-bold text-indigo-400">+</Text> acima para iniciar sua obra-prima.
                        </Text>
                    </Animated.View>
                }
            />
        )}
      </View>

      {/* ALERTA PERSONALIZADO */}
      <WriterAlert 
        visible={alertVisible}
        type="info"
        title="Nova História"
        message="Você está prestes a iniciar um novo livro. Isso consumirá 15 Créditos da sua conta de Escritor. Deseja continuar?"
        confirmText="Criar (-15 CR)"
        cancelText="Voltar"
        onConfirm={handleCreateConfirm}
        onCancel={() => setAlertVisible(false)}
      />
    </View>
  );
}