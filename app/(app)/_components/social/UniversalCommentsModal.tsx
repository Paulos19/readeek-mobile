import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentProps {
    visible: boolean;
    onClose: () => void;
    postId: string;
    fetchCommentsFn: (postId: string) => Promise<any[]>;
    createCommentFn: (postId: string, content: string, parentId?: string) => Promise<any>;
    toggleLikeFn: (commentId: string) => Promise<any>;
    searchMentionsFn: (query: string) => Promise<any[]>;
}

const CommentItem = ({ comment, onReply, onLike }: any) => {
    // Normalização: suporta tanto 'author' (comunidade) quanto 'user' (feed social)
    const author = comment.author || comment.user || {};
    
    // CORREÇÃO CRÍTICA: O banco retorna 'text', mas o front às vezes espera 'content'.
    // Usamos essa lógica para garantir que sempre tenha texto.
    const commentText = comment.content || comment.text || "";

    const [liked, setLiked] = useState(comment.isLiked || false);
    const [likesCount, setLikesCount] = useState(comment._count?.reactions || 0);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount((prev: number) => liked ? prev - 1 : prev + 1);
        onLike(comment.id);
    };

    return (
        <View className="mb-4 flex-row gap-3">
             <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700 overflow-hidden">
                {author.image ? 
                    <Image source={{ uri: author.image }} className="w-full h-full" /> : 
                    <Text className="text-zinc-400 font-bold text-xs">{author.name?.[0] || '?'}</Text>
                }
            </View>
            <View className="flex-1">
                <View className="bg-zinc-900 p-3 rounded-2xl rounded-tl-none border border-zinc-800/60">
                    <View className="flex-row justify-between mb-1">
                        <Text className="text-emerald-500 font-bold text-xs">{author.name || 'Usuário'}</Text>
                        <Text className="text-zinc-600 text-[10px]">
                            {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { locale: ptBR }) : 'Agora'}
                        </Text>
                    </View>
                    <Text className="text-zinc-300 text-sm leading-5">
                        {/* A renderização condicional agora usa commentText garantido */}
                        {commentText.split(' ').map((word: string, i: number) => 
                            word.startsWith('@') ? <Text key={i} className="text-emerald-400 font-bold">{word} </Text> : <Text key={i}>{word} </Text>
                        )}
                    </Text>
                </View>
                <View className="flex-row gap-4 mt-1.5 ml-2">
                    <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1">
                         <Heart size={10} color={liked ? "#ef4444" : "#71717a"} fill={liked ? "#ef4444" : "transparent"} />
                        <Text className={`font-bold ${liked ? 'text-red-400' : 'text-zinc-500'}`} style={{ fontSize: 10 }}>Curtir ({likesCount})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onReply(comment)}>
                        <Text className="text-zinc-500 text-[10px] font-bold">Responder</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export const UniversalCommentsModal = ({ visible, onClose, postId, fetchCommentsFn, createCommentFn, toggleLikeFn, searchMentionsFn }: CommentProps) => {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionList, setMentionList] = useState<any[]>([]);
    const [sending, setSending] = useState(false);
    
    const inputRef = useRef<TextInput>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visible && postId) {
            setLoading(true);
            fetchCommentsFn(postId)
                .then(data => {
                    // Garante que é um array antes de setar
                    setComments(Array.isArray(data) ? data : []);
                })
                .catch(err => console.log("Erro ao buscar comentários", err))
                .finally(() => setLoading(false));
        }
    }, [visible, postId]);

    const handleTextChange = (text: string) => {
        setNewComment(text);
        
        const words = text.split(' ');
        const lastWord = words[words.length - 1];

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (lastWord.startsWith('@') && lastWord.length > 1) {
            const query = lastWord.substring(1);
            setMentionQuery(query);
            
            if (query.length >= 2) {
                searchTimeout.current = setTimeout(() => {
                    setShowMentions(true);
                    searchMentionsFn(query)
                        .then(res => setMentionList(Array.isArray(res) ? res : []))
                        .catch(() => setShowMentions(false));
                }, 500);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const handleSelectMention = (user: any) => {
        const words = newComment.split(' ');
        words.pop(); 
        setNewComment(`${words.join(' ')} @${user.name} `);
        setShowMentions(false);
    };

    const handleSend = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const added = await createCommentFn(postId, newComment, replyingTo?.id);
            if (added) {
                setComments(prev => [...prev, added]);
            }
            setNewComment('');
            setReplyingTo(null);
        } catch (e) {
            Alert.alert("Erro", "Falha ao enviar comentário.");
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
             <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="flex-1 bg-black/80 justify-end">
                    <TouchableOpacity className="flex-1" onPress={onClose} />
                    <View className="bg-zinc-950 h-[80%] rounded-t-3xl border-t border-zinc-800 flex overflow-hidden">
                        <View className="p-4 border-b border-zinc-800 flex-row justify-between items-center bg-zinc-900">
                            <Text className="text-white font-bold text-lg">Comentários</Text>
                            <TouchableOpacity onPress={onClose} className="p-1 bg-zinc-800 rounded-full"><X color="white" size={20}/></TouchableOpacity>
                        </View>

                        {loading ? (
                            <View className="flex-1 items-center justify-center"><ActivityIndicator color="#10b981"/></View>
                        ) : (
                            <FlatList
                                data={comments}
                                keyExtractor={item => item.id || Math.random().toString()}
                                renderItem={({item}) => (
                                    <CommentItem 
                                        comment={item} 
                                        onReply={(c: any) => { 
                                            const name = c.author?.name || c.user?.name || 'User';
                                            setReplyingTo(c); 
                                            setNewComment(`@${name} `); 
                                            inputRef.current?.focus(); 
                                        }}
                                        onLike={toggleLikeFn}
                                    />
                                )}
                                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                ListEmptyComponent={<Text className="text-zinc-500 text-center mt-10">Nenhum comentário ainda.</Text>}
                            />
                        )}

                        {showMentions && mentionList.length > 0 && (
                            <View className="absolute bottom-24 left-4 right-4 bg-zinc-800 rounded-xl border border-zinc-700 shadow-xl z-50 max-h-40">
                                <FlatList
                                    data={mentionList}
                                    keyboardShouldPersistTaps="handled"
                                    keyExtractor={i => i.id}
                                    renderItem={({item}) => (
                                        <TouchableOpacity onPress={() => handleSelectMention(item)} className="p-3 border-b border-zinc-700/50 flex-row items-center gap-3">
                                            <View className="w-6 h-6 rounded-full bg-emerald-900 items-center justify-center"><Text className="text-emerald-400 font-bold text-xs">{item.name?.[0]}</Text></View>
                                            <Text className="text-zinc-200">{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}

                        <View className="p-4 bg-zinc-900 border-t border-zinc-800 pb-8">
                             {replyingTo && (
                                <View className="flex-row justify-between items-center bg-zinc-800/50 p-2 px-3 rounded-lg mb-2 border-l-2 border-emerald-500">
                                    <Text className="text-zinc-400 text-xs">Respondendo a <Text className="font-bold text-emerald-400">{replyingTo.author?.name || replyingTo.user?.name}</Text></Text>
                                    <TouchableOpacity onPress={() => setReplyingTo(null)}><X size={14} color="#71717a" /></TouchableOpacity>
                                </View>
                            )}
                            <View className="flex-row items-center bg-zinc-950 rounded-2xl px-4 border border-zinc-800">
                                <TextInput
                                    ref={inputRef}
                                    value={newComment}
                                    onChangeText={handleTextChange}
                                    placeholder="Adicione um comentário..."
                                    placeholderTextColor="#52525b"
                                    className="flex-1 text-white py-3 min-h-[48px]"
                                    multiline
                                />
                                <TouchableOpacity onPress={handleSend} disabled={sending} className="ml-2">
                                    {sending ? <ActivityIndicator size="small" color="#10b981"/> : <Send color={newComment ? "#10b981" : "#52525b"} size={20} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
             </KeyboardAvoidingView>
        </Modal>
    );
};