import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';

import { socialService } from 'lib/api';
import { SocialPostCard } from './_components/social/SocialPostCard';
import { UniversalCommentsModal } from './_components/social/UniversalCommentsModal';

export default function SocialFeed() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para Modal de Comentários
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const fetchFeed = async () => {
    try {
      const data = await socialService.getFeed();
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recarrega sempre que a tela ganha foco (ex: volta do create post)
  useFocusEffect(
    useCallback(() => {
        fetchFeed();
    }, [])
  );

  const handleDeletePost = async (id: string) => {
    try {
        await socialService.deletePost(id);
        setPosts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
        // Tratar erro
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} className="flex-1">
        
        {/* HEADER SIMPLES (Tipo Instagram) */}
        <View className="px-4 py-3 border-b border-zinc-900 flex-row justify-between items-center bg-black">
            <Text className="text-white font-black text-xl tracking-tighter">readeek</Text>
            {/* Poderia ter ícones de DM ou notificações aqui */}
        </View>

        {loading ? (
            <View className="flex-1 items-center justify-center"><ActivityIndicator color="#10b981" /></View>
        ) : (
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <SocialPostCard 
                        post={item} 
                        onOpenComments={() => setSelectedPostId(item.id)}
                        onDelete={handleDeletePost}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeed(); }} tintColor="#10b981" />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        )}

        {/* FAB para criar post */}
        <TouchableOpacity 
            onPress={() => router.push('/(app)/social/create')}
            className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-full items-center justify-center shadow-lg shadow-emerald-900"
            activeOpacity={0.9}
        >
            <Plus color="white" size={28} />
        </TouchableOpacity>

        {/* Modal de Comentários Global */}
        <UniversalCommentsModal 
            visible={!!selectedPostId}
            postId={selectedPostId!}
            onClose={() => setSelectedPostId(null)}
            // Injeção de dependências para usar a API Social
            fetchCommentsFn={socialService.getComments}
            createCommentFn={socialService.createComment}
            toggleLikeFn={socialService.toggleCommentLike}
            searchMentionsFn={socialService.searchUsers}
        />
      </SafeAreaView>
    </View>
  );
}