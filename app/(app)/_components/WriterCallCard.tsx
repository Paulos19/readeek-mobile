import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Sparkles, PenTool, ChevronRight, Clock, FileText, Plus } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

  // Atualiza sempre que a tela ganha foco (ex: voltou do editor)
  useFocusEffect(
    useCallback(() => {
      fetchLatestDraft();
    }, [])
  );

  const fetchLatestDraft = async () => {
    try {
      // Busca os drafts ordenados (assumindo que a API retorna lista)
      const res = await api.get('/mobile/writer/drafts');
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Ordena no front por garantia (mais recente primeiro)
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
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Editado agora mesmo';
    if (diffHours < 24) return `Editado há ${diffHours}h`;
    if (diffDays === 1) return 'Editado ontem';
    return `Editado em ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
  };

  if (loading) {
    return (
        <View className="mx-6 mt-6 mb-2 h-28 bg-zinc-900/50 rounded-[24px] border border-zinc-800 justify-center items-center">
            <ActivityIndicator color="#6366f1" />
        </View>
    );
  }

  // --- CENÁRIO 1: CONTINUAR ESCREVENDO (EXISTE DRAFT) ---
  if (latestDraft) {
    return (
      <Animated.View entering={FadeIn.duration(500)}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => router.push(`/writer/${latestDraft.id}` as any)} 
          className="mx-6 mt-6 mb-2 shadow-2xl shadow-indigo-500/10"
        >
          <LinearGradient
            colors={['#18181b', '#0f0f11']} // Fundo dark sóbrio
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            className="rounded-[24px] p-[1px] overflow-hidden border border-zinc-700/50"
          >
            <View className="bg-zinc-900/90 p-4 rounded-[23px] relative flex-row items-center gap-4">
               
               {/* Capa do Livro */}
               <View className="h-20 w-14 rounded-lg bg-zinc-800 shadow-md border border-zinc-700 overflow-hidden relative">
                  {latestDraft.coverUrl ? (
                      <Image source={{ uri: latestDraft.coverUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                      <View className="flex-1 items-center justify-center bg-indigo-900/30">
                          <FileText size={20} color="#6366f1" />
                      </View>
                  )}
                  {/* Badge de Progresso (Capítulos) */}
                  <View className="absolute bottom-0 w-full bg-black/60 py-0.5 items-center">
                      <Text className="text-[8px] text-white font-bold">{latestDraft._count?.chapters || 0} caps.</Text>
                  </View>
               </View>

               {/* Informações */}
               <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <Text className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Em Progresso</Text>
                  </View>
                  
                  <Text className="text-white font-bold text-lg leading-5 mb-1.5" numberOfLines={1}>
                      {latestDraft.title}
                  </Text>
                  
                  <View className="flex-row items-center gap-1.5">
                      <Clock size={12} color="#71717a" />
                      <Text className="text-zinc-500 text-xs font-medium">
                          {formatDate(latestDraft.updatedAt)}
                      </Text>
                  </View>
               </View>

               {/* Botão de Ação */}
               <View className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center">
                  <PenTool size={18} color="#e4e4e7" />
               </View>

            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // --- CENÁRIO 2: NOVO PROJETO (SEM DRAFTS) ---
  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => router.push('/writer' as any)} 
        className="mx-6 mt-6 mb-2 shadow-xl shadow-indigo-500/20"
      >
        <LinearGradient
          colors={['#312e81', '#1e1b4b']} // Indigo Vibrante
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          className="rounded-[24px] p-[1px] overflow-hidden border border-indigo-500/40"
        >
          <View className="bg-black/20 p-5 rounded-[23px] relative overflow-hidden">
              
              {/* Background Decor */}
              <View className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl" />
              <View className="absolute -left-4 -bottom-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />

              <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                      <View className="flex-row items-center mb-2 bg-indigo-500/20 self-start px-2 py-0.5 rounded-full border border-indigo-500/30">
                          <Sparkles size={10} color="#a5b4fc" style={{ marginRight: 4 }} />
                          <Text className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Estúdio Criativo</Text>
                      </View>
                      
                      <Text className="text-white font-bold text-xl leading-6 mb-1">
                          Tire sua ideia do papel
                      </Text>
                      <Text className="text-indigo-200/80 text-xs font-medium leading-4">
                          Escreva, publique e monetize sua obra.
                      </Text>
                  </View>

                  <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg shadow-white/20">
                      <Plus size={24} color="#312e81" strokeWidth={3} />
                  </View>
              </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};