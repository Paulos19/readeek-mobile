import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Image as ImageIcon, Trash2, X, Settings2, Mic, Square, Paperclip, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import Animated, { useAnimatedStyle, useAnimatedKeyboard, FadeInDown, FadeOutDown } from 'react-native-reanimated';

// Imports de Lógica
import { getMessages, sendMessage, deleteMessages, Message, getMyConversations } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useAlert } from '../../_context/AlertContext';
import { useThemeStore } from '../../../stores/useThemeStore';

// Componentes
import { AudioBubble } from './_components/AudioBubble';
import { SwipeableMessage } from './_components/SwipeableMessage';
import { FileBubble } from './_components/FileBubble';
import { ImagePreviewModal } from './_components/ImagePreviewModal';
import { AttachmentPreviewModal, AttachmentType } from './_components/AttachmentPreviewModal';

const useKeyboardShiftWithOffset = () => {
  const keyboard = useAnimatedKeyboard();
  return useAnimatedStyle(() => {
    const shiftY = -keyboard.height.value;
    return { transform: [{ translateY: shiftY }] };
  });
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();
  
  const { wallpaper, myBubbleColor, otherBubbleColor } = useThemeStore();

  const keyboardAnimatedStyle = useKeyboardShiftWithOffset();
  const flatListRef = useRef<FlatList>(null);
  
  // Estados
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<{ name: string; image: string | null } | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Modais
  const [showAttachments, setShowAttachments] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [tempAttachment, setTempAttachment] = useState<AttachmentType | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Audio
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

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
    } else if (!otherUser) {
        try {
            const convs = await getMyConversations();
            const curr = convs.find(c => c.id === id);
            if (curr) setOtherUser(curr.participants.find(p => p.id !== user?.id) || null);
        } catch(e) {}
    }
    setLoading(false);
  };

  const refreshMessages = async () => {
    if (!id || isSelectionMode) return; 
    const data = await getMessages(id);
    if (data.length !== messages.length) setMessages(data);
  };

  const handleSend = async (text?: string, imageUri?: string, audioUri?: string, fileAsset?: any) => {
    if ((!text?.trim() && !imageUri && !audioUri && !fileAsset) || !id) return;
    
    setSending(true);
    setInputText('');
    const currentReply = replyingTo; 
    setReplyingTo(null);
    setShowAttachments(false);

    try {
      await sendMessage(id, text || '', imageUri, audioUri, currentReply?.id, fileAsset);
      await refreshMessages();
      setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error("Erro ao enviar", error);
      showAlert({ title: "Erro", description: "Falha ao enviar.", buttons: [{ text: "OK", style: "cancel" }]});
      if (text) setInputText(text);
      if (currentReply) setReplyingTo(currentReply);
    } finally {
      setSending(false);
    }
  };

  const confirmSendAttachment = (caption: string, attachment: AttachmentType) => {
    setTempAttachment(null);
    
    if (attachment.type === 'IMAGE') {
        handleSend(caption, attachment.uri); 
    } else {
        handleSend(caption, undefined, undefined, {
            uri: attachment.uri,
            name: attachment.name || 'file',
            mimeType: attachment.mimeType || 'application/octet-stream',
            size: attachment.size
        });
    }
  };

  const pickImage = async () => {
    setShowAttachments(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
        setTempAttachment({
            type: 'IMAGE',
            uri: result.assets[0].uri
        });
    }
  };

  const pickDocument = async () => {
    setShowAttachments(false);
    try {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const file = result.assets[0];
            setTempAttachment({
                type: 'FILE',
                uri: file.uri,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size
            });
        }
    } catch (err) { console.log("Erro doc picker", err); }
  };

  // ... (Funções de Audio, Delete, etc. mantidas iguais para economizar espaço)
  const startRecording = async () => { try { if (permissionResponse?.status !== 'granted') { const permission = await requestPermission(); if (permission.status !== 'granted') { showAlert({ title: "Permissão necessária", description: "Permita o uso do microfone.", buttons: [{text: "OK", style: "cancel"}] }); return; } } await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true }); const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY); setRecording(recording); setIsRecording(true); setRecordingDuration(0); recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000); } catch (err) { console.error('Failed start rec', err); } };
  const stopRecording = async () => { if (!recording) return; setIsRecording(false); if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); await recording.stopAndUnloadAsync(); const uri = recording.getURI(); setRecording(null); if (uri) handleSend(undefined, undefined, uri); };
  const handleLongPress = (msgId: string, senderId: string) => { Keyboard.dismiss(); setIsSelectionMode(true); toggleSelection(msgId); };
  const handlePressMessage = (msgId: string) => { if (isSelectionMode) toggleSelection(msgId); };
  const toggleSelection = (msgId: string) => { setSelectedIds(prev => { const n = new Set(prev); if(n.has(msgId)) n.delete(msgId); else n.add(msgId); if(n.size===0) setIsSelectionMode(false); return n; }); };
  const handleDeleteSelected = () => { const selectedMessages = messages.filter(m => selectedIds.has(m.id)); const hasOthers = selectedMessages.some(m => m.senderId !== user?.id); showAlert({ title: "Apagar?", description: `Apagar ${selectedIds.size} mensagens?${hasOthers ? ' (De outros só apaga para você)' : ''}`, buttons: [ { text: "Cancelar", style: "cancel" }, (!hasOthers ? { text: "Para Todos", style: "destructive", onPress: () => confirmDelete('EVERYONE') } : null), { text: "Para Mim", style: "default", onPress: () => confirmDelete('ME') } ].filter(Boolean) as any }); };
  const confirmDelete = async (type: 'ME' | 'EVERYONE') => { const ids = Array.from(selectedIds); setMessages(p => p.filter(m => !selectedIds.has(m.id))); setIsSelectionMode(false); setSelectedIds(new Set()); try { await deleteMessages(ids, type); await refreshMessages(); } catch(e) { loadChatData(); } };
  const formatDuration = (seconds: number) => { const m = Math.floor(seconds/60); const s = seconds%60; return `${m}:${s<10?'0':''}${s}`; };

  // --- RENDERIZAÇÃO DA MENSAGEM (ATUALIZADA PARA CARD) ---
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    const isSelected = selectedIds.has(item.id);
    const bubbleColor = isMe ? myBubbleColor : otherBubbleColor;
    
    // Verifica se é um card de imagem (Imagem + Opcional Texto)
    const isImageCard = item.type === 'IMAGE' && item.imageUrl;

    const MessageContent = (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleLongPress(item.id, item.senderId)}
        onPress={() => handlePressMessage(item.id)}
        className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}
      >
        <View 
            className={`max-w-[85%] rounded-2xl overflow-hidden relative ${isSelected ? 'border-2 border-white/50' : ''}`}
        >
            {isSelected && <View className="absolute inset-0 bg-black/40 z-20" />}
            
            <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar (apenas se não for eu e não for o card de imagem para ficar alinhado embaixo) */}
                {!isMe && !isImageCard && !item.audioUrl && !item.fileUrl && (
                    <Image source={{ uri: item.sender.image || `https://ui-avatars.com/api/?name=${item.sender.name}` }} className="w-8 h-8 rounded-full mr-2 self-end mb-1" />
                )}
                
                <View 
                    className={`
                        ${isImageCard ? 'p-0 pb-1' : 'px-3 py-2'} 
                        rounded-2xl 
                        ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}
                    `}
                    style={{ backgroundColor: bubbleColor }}
                >
                    {/* QUOTED MESSAGE (Padding extra se for imagem para não colar) */}
                    {item.replyTo && (
                        <View className={`mb-1 rounded-lg bg-black/20 border-l-4 border-white/40 ${isImageCard ? 'm-2' : ''} p-2`}>
                            <Text className="text-emerald-300 text-[10px] font-bold mb-0.5">{item.replyTo.sender.name || 'Usuário'}</Text>
                            <Text numberOfLines={1} className="text-white/80 text-xs">
                                {item.replyTo.type === 'AUDIO' ? '🎵 Mensagem de voz' : item.replyTo.type === 'FILE' ? '📄 Arquivo' : item.replyTo.type === 'IMAGE' ? '📷 Foto' : item.replyTo.content}
                            </Text>
                        </View>
                    )}

                    {/* --- CONTEÚDO: IMAGEM (CARD) --- */}
                    {isImageCard && (
                        <TouchableOpacity onPress={() => setViewingImage(item.imageUrl || null)} activeOpacity={0.95}>
                            {/* Imagem full width do container */}
                            <Image 
                                source={{ uri: item.imageUrl! }} 
                                className="w-64 h-80 bg-zinc-800" 
                                resizeMode="cover" 
                            />
                        </TouchableOpacity>
                    )}

                    {/* --- CONTEÚDO: ÁUDIO --- */}
                    {item.type === 'AUDIO' && item.audioUrl && (
                         <AudioBubble uri={item.audioUrl} isMe={isMe} tintColor={bubbleColor} />
                    )}

                    {/* --- CONTEÚDO: ARQUIVO --- */}
                    {item.type === 'FILE' && item.fileUrl && (
                        <FileBubble url={item.fileUrl} fileName={item.fileName || 'Arquivo'} fileSize={item.fileSize || 0} isMe={isMe} />
                    )}

                    {/* --- CONTEÚDO: TEXTO / LEGENDA --- */}
                    {item.content && (
                        <View className={isImageCard ? "px-3 pb-1 pt-2" : ""}>
                            <Text className={`text-white text-base leading-5`}>
                                {item.content}
                            </Text>
                        </View>
                    )}

                    {/* HORA (Posicionamento inteligente) */}
                    <View className={isImageCard ? "px-3 pb-1" : ""}>
                         <Text className={`text-[10px] mt-0.5 text-right text-white/60 ${isImageCard ? '' : ''}`}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
      </TouchableOpacity>
    );

    return (
        <SwipeableMessage isMe={isMe} onReply={() => setReplyingTo(item)}>
            {MessageContent}
        </SwipeableMessage>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* HEADER */}
      <SafeAreaView edges={['top']} className={`border-b z-20 shadow-sm ${isSelectionMode ? 'bg-emerald-900 border-emerald-800' : 'bg-zinc-900 border-zinc-800'}`}>
        <View className="px-4 py-3 flex-row items-center justify-between h-[60px]">
            {isSelectionMode ? (
                <View className="flex-row items-center flex-1 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="mr-4"><X size={24} color="white" /></TouchableOpacity>
                        <Text className="text-white font-bold text-lg">{selectedIds.size}</Text>
                    </View>
                    <TouchableOpacity onPress={handleDeleteSelected}><Trash2 size={24} color="#f87171" /></TouchableOpacity>
                </View>
            ) : (
                <>
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 rounded-full active:bg-zinc-800"><ChevronLeft size={28} color="white" /></TouchableOpacity>
                        <TouchableOpacity className="flex-row items-center flex-1 active:opacity-70">
                            <Image source={{ uri: otherUser?.image || `https://ui-avatars.com/api/?name=${otherUser?.name || 'User'}` }} className="w-10 h-10 rounded-full bg-zinc-700 border border-zinc-600" />
                            <View className="ml-3">
                                <Text className="text-white font-bold text-base" numberOfLines={1}>{otherUser?.name || 'Usuário'}</Text>
                                <Text className="text-emerald-500 text-xs font-medium">Online</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(app)/chat/settings')} className="p-2 rounded-full bg-zinc-800 active:bg-zinc-700"><Settings2 size={20} color="white" /></TouchableOpacity>
                </>
            )}
        </View>
      </SafeAreaView>

      {/* MODAIS */}
      <ImagePreviewModal visible={!!viewingImage} imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
      <AttachmentPreviewModal visible={!!tempAttachment} attachment={tempAttachment} onClose={() => setTempAttachment(null)} onSend={confirmSendAttachment} themeColor={myBubbleColor} />

      {/* MENU ANEXOS */}
      {showAttachments && (
        <>
            <TouchableOpacity activeOpacity={1} onPress={() => setShowAttachments(false)} className="absolute inset-0 z-40 bg-black/30" />
            <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOutDown.duration(150)} className="absolute bottom-24 left-4 z-50 bg-zinc-800 rounded-2xl p-4 shadow-2xl border border-zinc-700 w-48">
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-3 ml-1">Anexar</Text>
                <TouchableOpacity onPress={pickDocument} className="flex-row items-center p-2 rounded-lg active:bg-zinc-700 mb-1">
                    <View className="w-8 h-8 rounded-full bg-indigo-500/20 items-center justify-center mr-3"><FileText size={18} color="#6366f1" /></View>
                    <Text className="text-white font-medium">Documento</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickImage} className="flex-row items-center p-2 rounded-lg active:bg-zinc-700">
                    <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center mr-3"><ImageIcon size={18} color="#a855f7" /></View>
                    <Text className="text-white font-medium">Galeria</Text>
                </TouchableOpacity>
            </Animated.View>
        </>
      )}

      {/* CONTEÚDO */}
      <Animated.View style={[{ flex: 1 }, keyboardAnimatedStyle]}>
        <View className="flex-1 bg-black overflow-hidden relative" onTouchStart={() => !isSelectionMode && Keyboard.dismiss()}>
            {wallpaper && <Image source={{ uri: wallpaper }} className="absolute inset-0 w-full h-full opacity-60" resizeMode="cover" />}
            {loading ? <View className="flex-1 justify-center items-center"><ActivityIndicator color={myBubbleColor} /></View> : 
                <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={item => item.id} inverted contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }} showsVerticalScrollIndicator={false} />
            }
        </View>

        {replyingTo && !isSelectionMode && (
            <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(200)} className="px-2 pb-1 bg-transparent">
                <View className="bg-zinc-900 border border-zinc-700 rounded-t-2xl rounded-b-lg p-3 flex-row items-center justify-between shadow-lg mx-2">
                    <View className="flex-1 border-l-4 border-emerald-500 pl-3 py-1">
                        <Text className="text-emerald-500 font-bold text-xs mb-0.5">Respondendo a {replyingTo.senderId === user?.id ? 'você' : otherUser?.name || 'usuário'}</Text>
                        <Text numberOfLines={1} className="text-zinc-400 text-sm">{replyingTo.type === 'AUDIO' ? 'Mensagem de voz' : replyingTo.type === 'FILE' ? 'Arquivo' : replyingTo.type === 'IMAGE' ? 'Imagem' : replyingTo.content}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyingTo(null)} className="bg-zinc-800 p-1.5 rounded-full"><X size={16} color="#a1a1aa" /></TouchableOpacity>
                </View>
            </Animated.View>
        )}

        {!isSelectionMode && (
            <View className="px-2 pt-1 flex-row items-end gap-2 bg-transparent" style={{ paddingBottom: Platform.OS === 'ios' ? 10 : 10 }}>
                <View className="flex-1 bg-zinc-900 rounded-3xl flex-row items-end border border-zinc-800 px-1 py-1 min-h-[48px]">
                    {!isRecording && (
                        <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowAttachments(!showAttachments); }} className={`w-10 h-10 items-center justify-center rounded-full mb-0.5 ${showAttachments ? 'bg-zinc-800' : ''}`}>
                            {showAttachments ? <X size={22} color="#a1a1aa" /> : <Paperclip size={20} color="#a1a1aa" style={{ transform: [{ rotate: '-45deg' }] }} />}
                        </TouchableOpacity>
                    )}
                    {isRecording ? (
                        <View className="flex-1 h-10 flex-row items-center ml-2">
                            <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                            <Text className="text-red-400 font-bold text-base">{formatDuration(recordingDuration)}</Text>
                            <Text className="text-zinc-500 text-xs ml-auto mr-4 uppercase tracking-widest">Gravando...</Text>
                        </View>
                    ) : (
                        <TextInput className="flex-1 text-white text-base max-h-32 px-2 py-2.5" placeholder="Mensagem" placeholderTextColor="#71717a" value={inputText} onChangeText={setInputText} multiline textAlignVertical="center" />
                    )}
                    {!isRecording && <TouchableOpacity onPress={pickImage} className="w-10 h-10 items-center justify-center rounded-full mb-0.5"><ImageIcon size={22} color="#a1a1aa" /></TouchableOpacity>}
                </View>
                
                <TouchableOpacity onPress={inputText.trim() ? () => handleSend(inputText) : (isRecording ? stopRecording : startRecording)} disabled={sending} activeOpacity={0.8} className="w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-black/50 mb-0.5" style={{ backgroundColor: isRecording ? '#ef4444' : (inputText.trim() ? myBubbleColor : '#059669'), transform: [{ scale: isRecording ? 1.1 : 1 }] }}>
                    {sending ? <ActivityIndicator size="small" color="white" /> : inputText.trim() ? <Send size={20} color="white" style={{ marginLeft: 2 }} /> : isRecording ? <Square size={16} color="white" fill="white" /> : <Mic size={22} color="white" />}
                </TouchableOpacity>
            </View>
        )}
      </Animated.View>
    </View>
  );
}