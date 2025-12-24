import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Share, Image, RefreshControl, StatusBar, Modal, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, FileText, Plus, Share2, Crown, UserX, MessageSquare, Heart, Download, Users, Send, MoreHorizontal, X, Reply } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { communityService } from 'lib/api';
import { useAuthStore } from 'stores/useAuthStore';

// --- COMPONENTES UI BÁSICOS ---
const HeaderButton = ({ icon: Icon, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md items-center justify-center border border-white/10">
        <Icon color="white" size={20} />
    </TouchableOpacity>
);

const TabButton = ({ label, active, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className={`px-5 py-2 rounded-full mr-2 border ${active ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}>
        <Text className={`font-bold text-sm ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</Text>
    </TouchableOpacity>
);

// --- ITEM DE COMENTÁRIO (Card Aprimorado) ---
const CommentItem = ({ comment, onReply, onLike }: any) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(comment._count?.reactions || 0);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount((prev: number) => liked ? prev - 1 : prev + 1);
        onLike(comment.id);
    };

    return (
        <View className="mb-4 flex-row gap-3">
            <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700">
                {comment.author.image ? 
                    <Image source={{ uri: comment.author.image }} className="w-full h-full rounded-full" /> : 
                    <Text className="text-zinc-400 font-bold text-xs">{comment.author.name?.[0]}</Text>
                }
            </View>
            <View className="flex-1">
                <View className="bg-zinc-900 p-3 rounded-2xl rounded-tl-none border border-zinc-800/60">
                    <View className="flex-row justify-between mb-1">
                        <Text className="text-emerald-500 font-bold text-xs">{comment.author.name}</Text>
                        <Text className="text-zinc-600 text-[10px]">{formatDistanceToNow(new Date(comment.createdAt), { locale: ptBR })}</Text>
                    </View>
                    <Text className="text-zinc-300 text-sm leading-5">
                        {/* Renderização simples de menção (destaque visual) */}
                        {comment.content.split(' ').map((word: string, i: number) => 
                            word.startsWith('@') ? <Text key={i} className="text-emerald-400 font-bold">{word} </Text> : <Text key={i}>{word} </Text>
                        )}
                    </Text>
                </View>
                
                {/* Ações do Comentário */}
                <View className="flex-row gap-4 mt-1.5 ml-2">
                    <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1">
                        <Text className={`text-[10px] font-bold ${liked ? 'text-red-400' : 'text-zinc-500'}`}>Curtir ({likesCount})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onReply(comment)} className="flex-row items-center gap-1">
                        <Text className="text-zinc-500 text-[10px] font-bold">Responder</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// --- MODAL DE COMENTÁRIOS COM MENÇÃO ---
const CommentsModal = ({ visible, onClose, post, communityId }: any) => {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any>(null); // Comentário pai

    // Estado do Sistema de Menção
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [membersList, setMembersList] = useState<any[]>([]);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible && post) {
            setLoading(true);
            communityService.getComments(post.id)
                .then(setComments)
                .finally(() => setLoading(false));
        }
    }, [visible, post]);

    // Lógica de Detecção do @
    const handleTextChange = (text: string) => {
        setNewComment(text);
        
        const words = text.split(' ');
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith('@') && lastWord.length > 1) {
            const query = lastWord.substring(1); // Remove o @
            setMentionQuery(query);
            setShowMentions(true);
            fetchMembers(query);
        } else {
            setShowMentions(false);
        }
    };

    const fetchMembers = async (query: string) => {
        try {
            const results = await communityService.searchMembers(communityId, query);
            setMembersList(results);
        } catch (e) {}
    };

    const handleSelectMember = (member: any) => {
        const words = newComment.split(' ');
        words.pop(); // Remove o texto parcial do @
        const textWithMention = `${words.join(' ')} @${member.name} `;
        setNewComment(textWithMention);
        setShowMentions(false);
    };

    const handleSend = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            // Envia parentId se estiver respondendo a alguém
            const addedComment = await communityService.createComment(
                post.id, 
                newComment, 
                replyingTo ? replyingTo.id : undefined
            );
            setComments(prev => [...prev, addedComment]);
            setNewComment('');
            setReplyingTo(null);
        } catch (e) {
            Alert.alert("Erro", "Não foi possível comentar.");
        } finally {
            setSending(false);
        }
    };

    const handleReply = (comment: any) => {
        setReplyingTo(comment);
        setNewComment(`@${comment.author.name} `); // Pré-preenche
        inputRef.current?.focus();
    };

    const handleCommentLike = async (commentId: string) => {
        try { await communityService.toggleCommentLike(commentId); } catch (e) {}
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-zinc-900 h-[85%] rounded-t-3xl overflow-hidden flex-1 relative">
                        {/* Header */}
                        <View className="flex-row justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900 z-10">
                            <Text className="text-white font-bold text-lg">Comentários</Text>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full"><X size={20} color="white" /></TouchableOpacity>
                        </View>

                        {/* Lista */}
                        {loading ? (
                            <View className="flex-1 items-center justify-center"><ActivityIndicator color="#10b981" /></View>
                        ) : (
                            <FlatList
                                data={comments}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                renderItem={({ item }) => (
                                    <CommentItem comment={item} onReply={handleReply} onLike={handleCommentLike} />
                                )}
                            />
                        )}

                        {/* DROPDOWN DE MENÇÕES (Flutuante) */}
                        {showMentions && membersList.length > 0 && (
                            <View className="absolute bottom-20 left-4 right-4 bg-zinc-800 rounded-xl border border-zinc-700 shadow-2xl z-50 max-h-40">
                                <FlatList 
                                    data={membersList}
                                    keyboardShouldPersistTaps="handled"
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            onPress={() => handleSelectMember(item)}
                                            className="flex-row items-center p-3 border-b border-zinc-700/50"
                                        >
                                            <View className="w-6 h-6 rounded-full bg-emerald-900 items-center justify-center mr-3">
                                                <Text className="text-emerald-400 text-xs font-bold">{item.name?.[0]}</Text>
                                            </View>
                                            <Text className="text-white font-medium">{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}

                        {/* Input Area */}
                        <View className="p-4 border-t border-zinc-800 bg-zinc-900 pb-8">
                            {replyingTo && (
                                <View className="flex-row justify-between items-center bg-zinc-800/50 p-2 px-3 rounded-lg mb-2">
                                    <Text className="text-zinc-400 text-xs">Respondendo a <Text className="font-bold text-emerald-400">{replyingTo.author.name}</Text></Text>
                                    <TouchableOpacity onPress={() => setReplyingTo(null)}><X size={14} color="#71717a" /></TouchableOpacity>
                                </View>
                            )}
                            <View className="flex-row items-center bg-zinc-950 rounded-2xl px-4 border border-zinc-800">
                                <TextInput
                                    ref={inputRef}
                                    placeholder="Escreva uma resposta... (@ para marcar)"
                                    placeholderTextColor="#52525b"
                                    className="flex-1 text-white py-3 min-h-[48px]"
                                    value={newComment}
                                    onChangeText={handleTextChange}
                                    multiline
                                />
                                <TouchableOpacity onPress={handleSend} disabled={sending} className="ml-2">
                                    {sending ? <ActivityIndicator size="small" color="#10b981"/> : <Send size={20} color={newComment ? "#10b981" : "#52525b"} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// --- PÁGINA PRINCIPAL (Mantida estrutura anterior, apenas passando communityId para o Modal) ---
export default function CommunityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  
  // Auth
  const [passwordInput, setPasswordInput] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const res = await communityService.getById(id);
      setData(res);
    } catch (e) {
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    try {
        const newPost = await communityService.createPost(id!, postContent);
        setData((prev: any) => ({ ...prev, posts: [newPost, ...(prev.posts || [])] }));
        setPostContent('');
    } catch (e) { Alert.alert("Erro", "Falha ao postar."); } finally { setPosting(false); }
  };

  const handlePostLike = async (post: any) => {
      // Simples toggle visual no post principal seria implementado aqui, 
      // mas como o PostItem gerencia seu estado interno, não precisamos recarregar tudo.
  };

  // Funções de Join, Upload e MemberAction permanecem iguais...
  // (Omitidas para brevidade pois já foram fornecidas na resposta anterior, foquei na mudança do Modal)
  
  // ... resto do código da tela principal ...

  if (loading) return <View className="flex-1 bg-zinc-950 items-center justify-center"><ActivityIndicator color="#10b981"/></View>;
  if (!data) return null;

  const isOwner = data.currentUserRole === 'OWNER';
  const canUpload = isOwner || data.currentUserRole === 'HONORARY_MEMBER';

  // Componente de Post Simples para a lista
  const PostCard = ({ post }: any) => {
      const [liked, setLiked] = useState(false);
      return (
        <View className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800/50">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row gap-3">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden items-center justify-center border border-zinc-700">
                        <Text className="text-emerald-500 font-bold">{post.author.name?.[0]}</Text>
                    </View>
                    <View>
                        <Text className="text-zinc-200 font-bold text-sm">{post.author.name}</Text>
                        <Text className="text-zinc-500 text-xs">{formatDistanceToNow(new Date(post.createdAt), { locale: ptBR })}</Text>
                    </View>
                </View>
            </View>
            <Text className="text-zinc-300 text-sm leading-6 mb-4">{post.content}</Text>
            <View className="flex-row gap-6 pt-3 border-t border-zinc-800/50">
                <TouchableOpacity onPress={() => communityService.toggleLike(post.id)} className="flex-row items-center gap-2">
                    <Heart size={18} color="#71717a" />
                    <Text className="text-zinc-500 text-xs font-medium">{post._count?.reactions || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedPost(post)} className="flex-row items-center gap-2">
                    <MessageSquare size={18} color="#71717a" />
                    <Text className="text-zinc-500 text-xs font-medium">{post._count?.comments || 0}</Text>
                </TouchableOpacity>
            </View>
        </View>
      );
  };

  if (data.isLocked) {
      // Retorna tela de bloqueio (código igual anterior)
      return <View className="flex-1 bg-zinc-950 items-center justify-center"><Text className="text-white">Bloqueado</Text></View>; 
  }

  return (
    <View className="flex-1 bg-zinc-950">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {/* Header */}
        <View style={{ paddingTop: insets.top + 10 }} className="absolute top-0 left-0 right-0 z-50 px-4 flex-row justify-between items-center pointer-events-box-none">
            <HeaderButton icon={ArrowLeft} onPress={() => router.back()} />
            <View className="flex-row gap-3">
                <HeaderButton icon={Share2} onPress={() => Share.share({ message: data.name })} />
                {canUpload && (
                    <TouchableOpacity onPress={() => {}} className="h-10 px-4 rounded-full bg-emerald-600 items-center justify-center shadow-lg shadow-emerald-900/50 border border-emerald-500/20">
                        <View className="flex-row items-center gap-1"><Plus size={18} color="white" /><Text className="text-white font-bold text-xs">Material</Text></View>
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Banner e Info */}
            <View className="w-full h-96 relative justify-end">
                {data.coverUrl ? <Image source={{ uri: data.coverUrl }} className="absolute w-full h-full" resizeMode="cover" /> : <View className="absolute w-full h-full bg-zinc-900" />}
                <LinearGradient colors={['transparent', '#09090b']} className="absolute inset-0" />
                <View className="px-5 pb-6">
                    <Text className="text-white font-black text-4xl mb-2">{data.name}</Text>
                    <Text className="text-zinc-300 text-sm mb-4">{data.description}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="px-5 flex-row mb-6">
                <TabButton label="Feed" active={activeTab === 'feed'} onPress={() => setActiveTab('feed')} />
                <TabButton label="Arquivos" active={activeTab === 'files'} onPress={() => setActiveTab('files')} />
                {isOwner && <TabButton label="Admin" active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />}
            </View>

            <View className="px-5 min-h-[400px]">
                {activeTab === 'feed' && (
                    <View>
                        {/* Input Post */}
                        <View className="bg-zinc-900 p-4 rounded-2xl mb-6 border border-zinc-800">
                            <TextInput 
                                placeholder="Participe..." 
                                placeholderTextColor="#52525b" 
                                multiline 
                                value={postContent} 
                                onChangeText={setPostContent} 
                                className="text-white text-base max-h-24" 
                            />
                            {postContent.length > 0 && (
                                <TouchableOpacity onPress={handleCreatePost} disabled={posting} className="bg-emerald-600 px-4 py-2 rounded-full self-end mt-2">
                                    <Text className="text-white font-bold text-xs">Publicar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {data.posts?.map((post: any) => <PostCard key={post.id} post={post} />)}
                    </View>
                )}
                {/* Outras abas omitidas para brevidade */}
            </View>
        </ScrollView>

        {/* MODAL INTEGRADO COM MENÇÃO E LIKES */}
        <CommentsModal 
            visible={!!selectedPost} 
            post={selectedPost} 
            communityId={id} // Passando o ID da comunidade para a busca de membros
            onClose={() => setSelectedPost(null)} 
        />
    </View>
  );
}