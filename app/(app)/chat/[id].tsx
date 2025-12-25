import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Phone, Video } from 'lucide-react-native';
import { getMessages, sendMessage, Message, getMyConversations } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ name: string; image: string | null } | null>(null);

  useEffect(() => {
    loadChatData();
    const interval = setInterval(refreshMessages, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const loadChatData = async () => {
    if (!id) return;
    setLoading(true);
    
    const msgs = await getMessages(id);
    setMessages(msgs);

    if (msgs.length > 0) {
        const receivedMsg = msgs.find(m => m.senderId !== user?.id);
        if (receivedMsg) setOtherUser(receivedMsg.sender);
    } 
    
    if (!otherUser) {
        try {
            const conversations = await getMyConversations();
            const currentConv = conversations.find(c => c.id === id);
            if (currentConv) {
                const partner = currentConv.participants.find(p => p.id !== user?.id);
                if (partner) setOtherUser(partner);
            }
        } catch (e) {
            console.log("Erro ao carregar parceiro");
        }
    }

    setLoading(false);
  };

  const refreshMessages = async () => {
    if (!id) return;
    const data = await getMessages(id);
    if (data.length !== messages.length) {
        setMessages(data);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !id) return;
    
    const text = inputText;
    setInputText('');
    setSending(true);

    try {
      await sendMessage(id, text);
      await refreshMessages();
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error("Erro ao enviar", error);
      setInputText(text);
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
            className="w-8 h-8 rounded-full mr-2 self-end mb-1"
          />
        )}
        <View 
          className={`px-4 py-3 rounded-2xl max-w-[75%] ${
            isMe ? 'bg-emerald-600 rounded-tr-none' : 'bg-zinc-800 rounded-tl-none'
          }`}
        >
          <Text className="text-white text-base leading-5">{item.content}</Text>
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
      
      {/* HEADER FIXO */}
      <SafeAreaView edges={['top']} className="bg-zinc-900 border-b border-zinc-800 z-10 shadow-sm">
        <View className="px-4 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 rounded-full active:bg-zinc-800">
                    <ChevronLeft size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity className="flex-row items-center flex-1 active:opacity-70">
                    <View className="relative">
                        <Image 
                            source={{ uri: otherUser?.image || `https://ui-avatars.com/api/?name=${otherUser?.name || 'User'}` }}
                            className="w-10 h-10 rounded-full bg-zinc-700"
                        />
                        <View className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                    </View>
                    <View className="ml-3">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                            {otherUser?.name || 'Usuário'}
                        </Text>
                        <Text className="text-emerald-500 text-xs font-medium">Online agora</Text>
                    </View>
                </TouchableOpacity>
            </View>
            
            <View className="flex-row gap-4 mr-2">
                <TouchableOpacity><Phone size={20} color="#71717a" /></TouchableOpacity>
                <TouchableOpacity><Video size={20} color="#71717a" /></TouchableOpacity>
            </View>
        </View>
      </SafeAreaView>

      {/* ÁREA DE CONTEÚDO */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
      >
        <View className="flex-1 bg-black">
            {loading ? (
                <View className="flex-1 justify-center items-center"><ActivityIndicator color="#10b981" /></View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    inverted
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={Keyboard.dismiss} 
                />
            )}
        </View>

        {/* INPUT AREA */}
        <View className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex-row items-end gap-3 pb-6">
            <TextInput 
                className="flex-1 bg-black text-white px-4 py-3 rounded-2xl border border-zinc-800 min-h-[48px] max-h-32 text-base"
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#71717a"
                value={inputText}
                onChangeText={setInputText}
                multiline
                textAlignVertical="center"
            />
            {/* CORREÇÃO: Usando style para a cor dinâmica em vez de className */}
            <TouchableOpacity 
                onPress={handleSend} 
                disabled={sending || !inputText.trim()}
                className="w-12 h-12 rounded-full items-center justify-center mb-0.5"
                style={{ 
                    backgroundColor: inputText.trim() ? '#059669' : '#27272a', // emerald-600 ou zinc-800
                    shadowColor: inputText.trim() ? '#064e3b' : 'transparent',
                    shadowOpacity: 0.5,
                    shadowRadius: 5
                }}
            >
                {sending ? <ActivityIndicator size="small" color="white" /> : <Send size={20} color="white" style={{ marginLeft: 2 }} />}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}