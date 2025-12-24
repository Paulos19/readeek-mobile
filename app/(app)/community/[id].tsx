import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquare, Heart } from 'lucide-react-native';
import { communityService } from 'lib/api';
import { Community, CommunityPost } from '../_types/community';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CommunityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<(Community & { posts: CommunityPost[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    communityService.getById(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
        <View className="flex-1 bg-zinc-950 justify-center items-center">
            <ActivityIndicator color="#10b981" />
        </View>
    );
  }

  if (!data) return null;

  return (
    <View className="flex-1 bg-zinc-950">
        <SafeAreaView edges={['top']}>
            {/* Header Simples */}
            <View className="px-4 py-2 flex-row items-center border-b border-zinc-800 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <View>
                    <Text className="text-white font-bold text-lg">{data.name}</Text>
                    <Text className="text-zinc-500 text-xs">{data._count?.members} membros</Text>
                </View>
            </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Info Card */}
            <View className="bg-zinc-900 p-4 rounded-xl mb-6 border border-zinc-800">
                <Text className="text-zinc-300 leading-5">{data.description}</Text>
            </View>

            <Text className="text-white font-bold text-lg mb-4">Discussões Recentes</Text>

            {/* Posts List */}
            {data.posts.map(post => (
                <View key={post.id} className="bg-zinc-900 mb-4 p-4 rounded-xl border border-zinc-800">
                    <View className="flex-row items-center mb-3">
                        <View className="h-8 w-8 rounded-full bg-emerald-900 items-center justify-center overflow-hidden mr-3">
                            {post.author.image ? (
                                <Image source={{ uri: post.author.image }} className="h-full w-full" />
                            ) : (
                                <Text className="text-emerald-400 font-bold">{post.author.name?.[0]}</Text>
                            )}
                        </View>
                        <View>
                            <Text className="text-white font-semibold text-sm">{post.author.name}</Text>
                            <Text className="text-zinc-500 text-[10px]">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                            </Text>
                        </View>
                    </View>
                    
                    <Text className="text-zinc-300 text-sm mb-4 leading-5">{post.content}</Text>

                    <View className="flex-row gap-6 border-t border-zinc-800 pt-3">
                        <View className="flex-row items-center gap-2">
                            <Heart size={16} color="#71717a" />
                            <Text className="text-zinc-500 text-xs">{post._count.reactions}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <MessageSquare size={16} color="#71717a" />
                            <Text className="text-zinc-500 text-xs">{post._count.comments}</Text>
                        </View>
                    </View>
                </View>
            ))}
        </ScrollView>
    </View>
  );
}