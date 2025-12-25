import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeftCircle, Send } from 'lucide-react-native';
import { getMessages, sendMessage, Message } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // ID da conversa
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
    // Polling simples para atualizar mensagens a cada 5s (substituto de socket.io por enquanto)
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadMessages = async () => {
    if (!id) return;
    const data = await getMessages(id);
    setMessages(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !id) return;
    
    const text = inputText;
    setInputText(''); // Limpa input otimista
    setSending(true);

    try {
      await sendMessage(id, text);
      await loadMessages(); // Recarrega para garantir ordem
    } catch (error) {
      console.error("Erro ao enviar", error);
      setInputText(text); // Devolve texto se falhar
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View className={`flex-row mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {!isMe && (
          <Image 
            source={{ uri: item.sender.image || `https://ui-avatars.com/api/?name=${item.sender.name}` }}
            className="w-8 h-8 rounded-full mr-2 self-end"
          />
        )}
        <View 
          className={`px-4 py-3 rounded-2xl max-w-[75%] ${
            isMe ? 'bg-emerald-600 rounded-tr-none' : 'bg-zinc-800 rounded-tl-none'
          }`}
        >
          <Text className="text-white text-base">{item.content}</Text>
          <Text className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-zinc-500'}`}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* HEADER */}
        <View className="px-4 py-3 border-b border-zinc-800 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <ChevronLeftCircle size={24} color="white" />
            </TouchableOpacity>
            <View>
                <Text className="text-white font-bold text-lg">Chat</Text>
                {/* Aqui poderíamos passar o nome do outro usuário via params para exibir no header */}
            </View>
        </View>

        {loading ? (
            <View className="flex-1 justify-center items-center"><ActivityIndicator color="#10b981" /></View>
        ) : (
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                inverted // Mensagens começam de baixo para cima
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
            />
        )}

        {/* INPUT AREA */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View className="p-4 border-t border-zinc-800 bg-black flex-row items-center gap-3">
                <TextInput 
                    className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-full border border-zinc-800"
                    placeholder="Digite sua mensagem..."
                    placeholderTextColor="#71717a"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity 
                    onPress={handleSend} 
                    disabled={sending || !inputText.trim()}
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                        inputText.trim() ? 'bg-emerald-600' : 'bg-zinc-800'
                    }`}
                >
                    {sending ? <ActivityIndicator size="small" color="white" /> : <Send size={20} color="white" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}