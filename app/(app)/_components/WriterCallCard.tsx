import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Sparkles, 
  PenTool, 
  Clock, 
  FileText, 
  Plus, 
  LayoutGrid, 
  ArrowRight 
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../../lib/api';

interface Draft {
  id: string;
  title: string;
  coverUrl?: string;
  updatedAt: string;
  _count: {
    chapters: number;
  };
}

export const WriterCallCard = () => {
  const router = useRouter();
  const [latestDraft, setLatestDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchLatestDraft();
    }, [])
  );

  const fetchLatestDraft = async () => {
    try {
      const res = await api.get('/mobile/writer/drafts');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const sorted = res.data.sort((a: Draft, b: Draft) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setLatestDraft(sorted[0]);
      } else {
        setLatestDraft(null);
      }
    } catch (error) {
      console.log('Erro ao buscar drafts:', error);
    } finally {
      // Pequeno delay artificial se for muito rápido, para evitar "flicker", 
      // ou remova se preferir instantâneo.
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch (e) {
      return 'recentemente';
    }
  };

  // --- SKELETON LOADING (UX Melhorada) ---
  if (loading) {
    return (
      <View className="mx-6 mt-6 mb-2 h-[140px] bg-zinc-900/50 rounded-[24px] border border-zinc-800 overflow-hidden">
        <View className="flex-1 p-4 flex-row gap-4 items-center opacity-50">
           <View className="h-24 w-16 bg-zinc-700 rounded-lg animate-pulse" />
           <View className="flex-1 gap-3">
              <View className="h-4 w-3/4 bg-zinc-700 rounded animate-pulse" />
              <View className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse" />
           </View>
        </View>
      </View>
    );
  }

  // --- CENÁRIO: TEM DRAFT (HUB DE ESCRITA) ---
  if (latestDraft) {
    return (
      <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut}>
        <View className="mx-6 mt-6 mb-2">
          
          {/* Header do Card - Título da Seção + Link para Index */}
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center gap-2">
              <Sparkles size={14} color="#818cf8" />
              <Text className="text-zinc-100 font-semibold text-sm tracking-wide">
                Writer Studio
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/writer' as any)}
              className="flex-row items-center gap-1 active:opacity-70"
            >
              <Text className="text-zinc-400 text-xs font-medium">Ver todos</Text>
              <LayoutGrid size={12} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Card Principal - Foco no Resume */}
          <LinearGradient
            colors={['#18181b', '#111113']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            className="rounded-[24px] p-[1px] border border-zinc-800 shadow-xl shadow-black/40"
          >
            <View className="bg-zinc-900/40 rounded-[24px] overflow-hidden">
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push(`/writer/${latestDraft.id}` as any)}
                className="p-4 flex-row gap-4"
              >
                {/* Coluna da Capa */}
                <View className="relative">
                  <View className="h-28 w-20 rounded-xl bg-zinc-800 shadow-lg border border-zinc-700/50 overflow-hidden">
                    {latestDraft.coverUrl ? (
                      <Image source={{ uri: latestDraft.coverUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="flex-1 items-center justify-center bg-zinc-800">
                          <FileText size={24} color="#6366f1" opacity={0.5} />
                      </View>
                    )}
                  </View>
                  {/* Badge Caps */}
                  <View className="absolute -bottom-2 -right-2 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-full shadow-sm">
                     <Text className="text-[9px] text-zinc-300 font-bold">
                        {latestDraft._count?.chapters || 0} caps
                     </Text>
                  </View>
                </View>

                {/* Coluna de Info + Ações */}
                <View className="flex-1 justify-between py-1">
                  <View>
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        Em progresso
                      </Text>
                    </View>
                    
                    <Text className="text-zinc-50 font-bold text-lg leading-6 mb-1" numberOfLines={2}>
                      {latestDraft.title}
                    </Text>
                    
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={11} color="#71717a" />
                      <Text className="text-zinc-500 text-[11px]">
                        Editado {getRelativeTime(latestDraft.updatedAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Botão de Ação Primária */}
                  <View className="self-end flex-row items-center bg-indigo-600/10 px-3 py-2 rounded-full border border-indigo-500/20 gap-2">
                    <Text className="text-indigo-400 text-xs font-bold">Continuar</Text>
                    <PenTool size={12} color="#818cf8" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Ação Secundária (Footer do Card) - Criar Novo Rápido */}
              <View className="bg-black/20 border-t border-white/5 px-4 py-2.5 flex-row items-center justify-between">
                 <Text className="text-zinc-500 text-[10px] font-medium">
                   Quer começar algo novo?
                 </Text>
                 <TouchableOpacity 
                   onPress={() => router.push('/writer/create' as any)} // Assumindo rota de criação direta ou vai para index
                   className="flex-row items-center gap-1.5 active:opacity-60"
                 >
                    <Plus size={12} color="#e4e4e7" />
                    <Text className="text-zinc-300 text-[11px] font-semibold">Novo Livro</Text>
                 </TouchableOpacity>
              </View>

            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  }

  // --- CENÁRIO: SEM DRAFTS (Card de Onboarding) ---
  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => router.push('/writer' as any)} 
        className="mx-6 mt-6 mb-2 shadow-2xl shadow-indigo-500/10"
      >
        <LinearGradient
          colors={['#312e81', '#1e1b4b']} 
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          className="rounded-[24px] p-[1px] border border-indigo-400/30"
        >
          <View className="bg-zinc-950/20 p-5 rounded-[23px] relative overflow-hidden min-h-[140px] justify-center">
              
              {/* Background Effects */}
              <View className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
              
              <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                      <View className="flex-row items-center mb-3 bg-indigo-500/20 self-start px-2.5 py-1 rounded-full border border-indigo-500/30">
                          <Sparkles size={11} color="#c7d2fe" style={{ marginRight: 5 }} />
                          <Text className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">
                            Comece a Escrever
                          </Text>
                      </View>
                      
                      <Text className="text-white font-bold text-xl leading-6 mb-1.5">
                          Tire sua ideia do papel
                      </Text>
                      <Text className="text-indigo-200/70 text-xs leading-4">
                          Crie, publique e alcance leitores.
                      </Text>
                  </View>

                  <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/20">
                      <ArrowRight size={24} color="#fff" />
                  </View>
              </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};