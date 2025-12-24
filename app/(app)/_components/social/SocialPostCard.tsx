import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Heart, MessageSquare, MoreHorizontal, BookOpen, Quote, Share2, Bookmark } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { socialService } from 'lib/api';
import { useAuthStore } from 'stores/useAuthStore';

const { width } = Dimensions.get('window');

export const SocialPostCard = ({ post, onOpenComments, onDelete }: { post: any, onOpenComments: () => void, onDelete: (id: string) => void }) => {
  const { user } = useAuthStore();
  
  // Normalização do autor
  const author = post.author || post.user || {};
  const authorId = author.id || post.userId;
  
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post._count?.reactions || 0);

  const isOwner = user?.id === authorId; 

  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try { await socialService.toggleLike(post.id); } 
    catch(e) { setLiked(prevLiked); setLikesCount(prevCount); }
  };

  const handleDelete = () => {
    Alert.alert("Excluir", "Deseja apagar este post?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: () => onDelete(post.id) }
    ]);
  };

  const isExcerpt = post.type === 'EXCERPT';

  return (
    <View className="bg-black mb-4 border-b border-zinc-900 pb-2">
      {/* HEADER: User Info */}
      <View className="flex-row justify-between items-center px-3 py-3">
        <View className="flex-row items-center gap-3">
           <View className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              {author.image ? 
                <Image source={{ uri: author.image }} className="w-full h-full" /> : 
                <View className="items-center justify-center flex-1"><Text className="text-zinc-500 font-bold">{author.name?.[0]}</Text></View>
              }
           </View>
           <View>
              <Text className="text-white font-bold text-sm">{author.name || 'Usuário'}</Text>
              <Text className="text-zinc-500 text-[10px]">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}</Text>
           </View>
        </View>
        {isOwner && (
            <TouchableOpacity onPress={handleDelete} className="p-1">
                <MoreHorizontal size={20} color="#71717a" />
            </TouchableOpacity>
        )}
      </View>

      {/* TIPO 1: Post com Imagem Grande */}
      {post.imageUrl && (
          <View className="w-full bg-zinc-900 mb-2">
              <Image 
                source={{ uri: post.imageUrl }} 
                style={{ width: width, height: width }} 
                resizeMode="cover"
              />
          </View>
      )}

      {/* TIPO 2: Citação (Layout Especial) */}
      {isExcerpt && post.book ? (
         <View className="px-3 mb-2">
            <View className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex-row gap-4">
                 <View className="w-16 h-24 bg-zinc-800 rounded-md overflow-hidden shadow-sm">
                    {post.book.coverUrl ? <Image source={{ uri: post.book.coverUrl }} className="w-full h-full" resizeMode="cover" /> : null}
                 </View>
                 <View className="flex-1 justify-center">
                    <Quote size={16} color="#10b981" className="mb-1 opacity-80" />
                    <Text className="text-zinc-200 text-sm italic font-serif leading-5">"{post.content}"</Text>
                    <Text className="text-zinc-500 text-xs font-bold mt-2">— {post.book.title}</Text>
                 </View>
            </View>
         </View>
      ) : (
         /* Conteúdo de Texto Normal */
         <View className="px-3 mb-2">
             <Text className="text-white text-sm leading-5">
                 {/* Se tiver imagem, mostra legenda normal. Se não, mostra texto maior. */}
                 {post.imageUrl ? (
                    <Text><Text className="font-bold">{author.name}</Text> {post.content}</Text>
                 ) : (
                    <Text className="text-base font-normal">{post.content}</Text>
                 )}
             </Text>
         </View>
      )}

      {/* WIDGET DO LIVRO (Mostra a capa se não for Excerpt e tiver livro vinculado) */}
      {post.book && !isExcerpt && (
        <View className="px-3 mb-3">
            <View className="flex-row bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 items-center gap-3">
                <View className="w-10 h-14 bg-zinc-800 rounded overflow-hidden">
                    {post.book.coverUrl ? (
                        <Image source={{ uri: post.book.coverUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="flex-1 items-center justify-center"><BookOpen size={12} color="#52525b"/></View>
                    )}
                </View>
                <View className="flex-1">
                    <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-0.5">Lendo</Text>
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>{post.book.title}</Text>
                    <Text className="text-zinc-400 text-xs" numberOfLines={1}>{post.book.author}</Text>
                </View>
                <TouchableOpacity className="bg-zinc-800 p-2 rounded-full">
                     <Bookmark size={16} color="#10b981" />
                </TouchableOpacity>
            </View>
        </View>
      )}

      {/* ACTIONS */}
      <View className="px-3 flex-row items-center gap-4 mb-2">
        <TouchableOpacity onPress={handleLike}>
            <Heart size={26} color={liked ? "#ef4444" : "white"} fill={liked ? "#ef4444" : "transparent"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenComments}>
            <MessageSquare size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity className="ml-auto">
             <Share2 size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* LIKES COUNT */}
      <View className="px-3">
         <Text className="text-white font-bold text-xs">{likesCount} curtidas</Text>
      </View>

      {/* VIEW ALL COMMENTS */}
      {(post._count?.comments > 0) && (
        <TouchableOpacity onPress={onOpenComments} className="px-3 mt-1">
            <Text className="text-zinc-500 text-sm">Ver todos os {post._count.comments} comentários</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};