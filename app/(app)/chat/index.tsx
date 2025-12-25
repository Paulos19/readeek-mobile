import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyConversations, Conversation } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
        loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const data = await getMyConversations();
    setConversations(data);
    setLoading(false);
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    // Identificar o outro participante
    const otherUser = item.participants.find(p => p.id !== user?.id) || item.participants[0];
    const lastMsg = item.messages[0];

    return (
      <TouchableOpacity 
        className="flex-row items-center p-4 border-b border-zinc-900 bg-black active:bg-zinc-900"
        onPress={() => router.push(`/(app)/chat/${item.id}` as any)}
      >
        <Image 
            source={{ uri: otherUser?.image || `https://ui-avatars.com/api/?name=${otherUser?.name}` }}
            className="w-14 h-14 rounded-full bg-zinc-800"
        />
        <View className="flex-1 ml-4 justify-center">
            <View className="flex-row justify-between mb-1">
                <Text className="text-white font-bold text-base">{otherUser?.name}</Text>
                {lastMsg && (
                    <Text className="text-zinc-500 text-xs">
                        {new Date(lastMsg.createdAt).toLocaleDateString()}
                    </Text>
                )}
            </View>
            
            {/* Contexto do Produto */}
            {item.product && (
                <Text className="text-emerald-500 text-xs font-bold mb-0.5">
                    Negociando: {item.product.title}
                </Text>
            )}

            <Text numberOfLines={1} className="text-zinc-400 text-sm">
                {lastMsg ? lastMsg.content : 'Inicie a conversa...'}
            </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        <View className="px-5 py-4 border-b border-zinc-900">
            <Text className="text-white text-2xl font-bold">Mensagens</Text>
        </View>

        {loading ? (
            <View className="flex-1 justify-center items-center"><ActivityIndicator color="#10b981" /></View>
        ) : (
            <FlatList 
                data={conversations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center mt-20">
                        <Text className="text-zinc-500">Nenhuma conversa iniciada.</Text>
                    </View>
                }
            />
        )}
      </SafeAreaView>
    </View>
  );
}