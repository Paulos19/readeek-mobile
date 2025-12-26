import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ShoppingBag, Coins, Play, BookOpen, ChevronRight, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Book } from '../_types/book';
import { getMyConversations } from '../../../lib/api'; // Import para buscar mensagens

interface GreetingHeaderProps {
  user: {
    name: string | null;
    image: string | null;
    credits?: number;
  } | null;
  lastReadBook?: Book | null;
  onContinueReading?: (book: Book) => void;
}

export const GreetingHeader = ({ user, lastReadBook, onContinueReading }: GreetingHeaderProps) => {
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // --- LÓGICA DE SAUDAÇÃO E NOTIFICAÇÕES ---
  useEffect(() => {
    // 1. Define Saudação
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    // 2. Busca mensagens não lidas
    checkUnreadMessages();
  }, []);

  const checkUnreadMessages = async () => {
    try {
      const conversations = await getMyConversations();
      // Exemplo: Conta conversas com mensagens não lidas (ajuste conforme retorno real da sua API)
      // Se sua API não retorna 'unreadCount', você pode implementar essa lógica no backend
      // Por enquanto, vamos assumir que queremos mostrar se houver conversas ativas
      const count = conversations.length > 0 ? 0 : 0; 
      // OBS: Substitua por `conversations.filter(c => c.unread).length` quando tiver essa flag
      setUnreadCount(count);
    } catch (error) {
      console.log('Erro ao buscar notificações');
    }
  };

  if (!user) return null;

  const displayName = user.name ? user.name.split(' ')[0] : 'Leitor';

  // Componente de Texto Gradiente
  const GradientText = ({ text, style }: { text: string, style?: any }) => (
    <MaskedView
      maskElement={<Text className="text-3xl font-black text-white" style={style}>{text}</Text>}
    >
      <LinearGradient
        colors={['#ffffff', '#34d399', '#10b981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text className="text-3xl font-black opacity-0" style={style}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );

  return (
    <View className="pt-6 pb-4">
      {/* === CABEÇALHO: PERFIL, ECONOMIA E CHAT === */}
      <View className="px-6 flex-row justify-between items-start mb-8">
        
        {/* LADO ESQUERDO: Avatar + Saudação */}
        <Link href="/(app)/profile" asChild>
            <TouchableOpacity className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="relative w-14 h-14 rounded-full border-2 border-emerald-500/20 p-0.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-zinc-900">
                    <Image 
                        source={{ uri: user.image || `https://ui-avatars.com/api/?name=${displayName}&background=065f46&color=fff` }} 
                        className="w-full h-full rounded-full"
                    />
                    {/* Indicador Online */}
                    <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
                </View>
                <View className="flex-1">
                    <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] mb-0.5">
                        {greeting}
                    </Text>
                    <GradientText text={displayName} />
                </View>
            </TouchableOpacity>
        </Link>

        {/* LADO DIREITO: Ações (Créditos, Chat, Shop) */}
        <View className="flex-row gap-2.5 mt-1.5">
            {/* Créditos */}
            <View className="flex-row items-center bg-zinc-900/80 px-3 h-9 rounded-full border border-zinc-800">
                <Coins size={12} color="#fbbf24" style={{ marginRight: 6 }} />
                <Text className="text-amber-400 font-bold text-xs">{user.credits ?? 0}</Text>
            </View>

            {/* Chat (NOVO) */}
            <Link href="/(app)/chat" asChild>
                <TouchableOpacity className="w-9 h-9 bg-zinc-900/80 rounded-full items-center justify-center border border-zinc-800 active:bg-zinc-800 relative">
                    <MessageCircle size={16} color="white" />
                    {unreadCount > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 min-w-[16px] h-[16px] rounded-full items-center justify-center border-2 border-zinc-950 px-[2px]">
                            <Text className="text-white text-[8px] font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Link>

            {/* Shop */}
            <Link href="/(app)/shop" asChild>
                <TouchableOpacity className="w-9 h-9 bg-zinc-900/80 rounded-full items-center justify-center border border-zinc-800 active:bg-zinc-800">
                    <ShoppingBag size={16} color="white" />
                </TouchableOpacity>
            </Link>
        </View>
      </View>

      {/* === CARD "CONTINUAR LENDO" === */}
      <View className="px-6">
        {lastReadBook ? (
            <TouchableOpacity 
                activeOpacity={0.95}
                onPress={() => onContinueReading && onContinueReading(lastReadBook)}
                className="w-full h-44 rounded-[32px] overflow-hidden relative shadow-2xl shadow-emerald-900/20 border border-white/5"
            >
                {/* 1. Imagem de Fundo (Capa com Blur) */}
                <Image 
                    source={{ uri: lastReadBook.coverUrl || undefined }}
                    className="absolute w-full h-full opacity-40 scale-150"
                    blurRadius={30}
                />
                
                {/* 2. Overlay Escuro */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#09090b']}
                    className="absolute w-full h-full"
                />

                {/* 3. Conteúdo do Card */}
                <View className="flex-1 flex-row items-center p-5">
                    {/* Capa Física */}
                    <View className="shadow-2xl shadow-black/80 mr-5">
                        <Image 
                            source={{ uri: lastReadBook.coverUrl || undefined }}
                            className="w-24 h-36 rounded-xl border border-white/10"
                            resizeMode="cover"
                        />
                    </View>

                    {/* Informações e Controles */}
                    <View className="flex-1 justify-center h-full py-1 pr-12">
                        <View className="flex-row items-center mb-2">
                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                                Em andamento
                            </Text>
                        </View>

                        <Text numberOfLines={2} className="text-white font-bold text-xl leading-6 mb-1 shadow-black">
                            {lastReadBook.title}
                        </Text>
                        <Text numberOfLines={1} className="text-zinc-400 text-xs font-medium mb-4">
                            {lastReadBook.author || "Autor Desconhecido"}
                        </Text>

                        {/* Barra de Progresso */}
                        <View>
                            <View className="flex-row justify-between mb-1.5">
                                <Text className="text-zinc-300 text-[10px] font-bold">{Math.round(lastReadBook.progress || 0)}%</Text>
                            </View>
                            <View className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                <LinearGradient
                                    colors={['#10b981', '#34d399']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="h-full rounded-full"
                                    style={{ width: `${lastReadBook.progress || 0}%` }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Botão Play Flutuante (Absolute) */}
                    <View className="absolute bottom-4 right-4 bg-emerald-500 w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20">
                        <Play size={20} color="white" fill="white" style={{ marginLeft: 3 }} />
                    </View>
                </View>
            </TouchableOpacity>
        ) : (
            // Placeholder (Estante Vazia)
            <Link href="/(app)/library" asChild>
                <TouchableOpacity className="w-full h-32 bg-zinc-900/50 border-2 border-zinc-800 border-dashed rounded-[24px] items-center justify-center flex-row gap-3 active:bg-zinc-900/80">
                    <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                        <BookOpen size={18} color="#71717a" />
                    </View>
                    <View>
                        <Text className="text-zinc-300 font-bold text-base">Sua estante está vazia</Text>
                        <Text className="text-zinc-500 text-xs">Toque para começar uma nova leitura</Text>
                    </View>
                    <ChevronRight size={20} color="#52525b" />
                </TouchableOpacity>
            </Link>
        )}
      </View>
    </View>
  );
};