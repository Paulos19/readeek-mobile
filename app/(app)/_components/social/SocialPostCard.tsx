import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Heart, MessageSquare, Quote, MoreHorizontal, Trophy, Trash2, BookOpen } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { socialService } from 'lib/api';
import { useAuthStore } from 'stores/useAuthStore'; // Importe para checar ID

export const SocialPostCard = ({ post, onComment, onDelete }: { post: any, onComment: () => void, onDelete: (id: string) => void }) => {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post._count?.reactions || 0);

  const isOwner = user?.id === post.userId; // Verifica se sou o dono

  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try { await socialService.toggleLike(post.id); } catch(e) { setLiked(prevLiked); setLikesCount(prevCount); }
  };

  const handleOptions = () => {
    if (!isOwner) return;

    Alert.alert(
        "Opções do Post",
        "O que deseja fazer?",
        [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Excluir Post", 
                style: "destructive", 
                onPress: () => {
                    Alert.alert("Tem certeza?", "Essa ação não pode ser desfeita.", [
                        { text: "Não", style: "cancel" },
                        { text: "Sim, excluir", onPress: () => onDelete(post.id) }
                    ])
                } 
            }
        ]
    );
  };

  const isExcerpt = post.type === 'EXCERPT';
  const isChallenge = post.type === 'CHALLENGE';

  return (
    <View className="bg-zinc-900 border-b border-zinc-800 p-4 mb-2">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row gap-3">
           <View className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 items-center justify-center">
              {post.user.image ? <Image source={{ uri: post.user.image }} className="w-full h-full" /> : <Text className="text-zinc-500 font-bold">{post.user.name?.[0]}</Text>}
           </View>
           <View>
              <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-sm">{post.user.name}</Text>
                  {isChallenge && <View className="bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex-row items-center gap-1"><Trophy size={10} color="#fbbf24" /><Text className="text-amber-500 text-[10px] font-bold uppercase">Desafio</Text></View>}
              </View>
              <Text className="text-zinc-500 text-[10px]">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}</Text>
           </View>
        </View>
        
        {/* Botão de Opções (Visível apenas para o dono) */}
        {isOwner && (
            <TouchableOpacity onPress={handleOptions} className="p-1">
                <MoreHorizontal size={20} color="#52525b" />
            </TouchableOpacity>
        )}
      </View>

      {/* Se tiver livro mencionado (mas não for citação direta), mostra badge */}
      {post.book && !isExcerpt && (
          <View className="flex-row items-center mb-2 bg-zinc-950/50 self-start px-2 py-1 rounded-md border border-zinc-800">
              <BookOpen size={12} color="#10b981" className="mr-1" />
              <Text className="text-zinc-400 text-xs italic">Lendo: {post.book.title}</Text>
          </View>
      )}

      {isExcerpt && post.book ? (
          <View className="flex-row bg-zinc-950 p-3 rounded-xl border border-zinc-800 mb-3 gap-3">
              <View className="w-16 h-24 bg-zinc-800 rounded-md overflow-hidden shadow-sm">
                  {post.book.coverUrl ? <Image source={{ uri: post.book.coverUrl }} className="w-full h-full" resizeMode="cover" /> : <View className="flex-1 items-center justify-center"><Quote size={16} color="#52525b"/></View>}
              </View>
              <View className="flex-1 justify-center">
                  <Quote size={16} color="#10b981" className="mb-1 opacity-80" />
                  <Text className="text-zinc-300 text-sm italic font-serif leading-5 mb-2">"{post.content}"</Text>
                  <Text className="text-zinc-500 text-xs font-bold">— {post.book.title}</Text>
              </View>
          </View>
      ) : (
          <Text className="text-zinc-200 text-sm leading-6 mb-3 font-normal">{post.content}</Text>
      )}

      <View className="flex-row gap-6 mt-1">
        <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-2">
            <Heart size={20} color={liked ? "#ef4444" : "#71717a"} fill={liked ? "#ef4444" : "transparent"} />
            <Text className={`text-xs font-medium ${liked ? 'text-red-400' : 'text-zinc-500'}`}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} className="flex-row items-center gap-2">
            <MessageSquare size={20} color="#71717a" />
            <Text className="text-zinc-500 text-xs font-medium">{post._count?.comments || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};