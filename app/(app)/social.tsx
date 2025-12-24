import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, RefreshControl, StatusBar, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, X, Trophy, PenTool } from 'lucide-react-native';
import { useAuthStore } from 'stores/useAuthStore';
import { socialService } from 'lib/api';
import { SocialPostCard } from './_components/social/SocialPostCard';

const SocialHeader = ({ user, content, setContent, postType, setPostType, openBookSelector, selectedBook, setSelectedBook, handleCreatePost, isPosting }: any) => {
    return (
        <View className="p-4 border-b border-zinc-800 bg-zinc-950">
            <View className="flex-row gap-3">
                <View className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden items-center justify-center border border-zinc-700">
                    {user?.image ? <Image source={{ uri: user.image }} className="w-full h-full" /> : <Text className="text-zinc-500 font-bold">{user?.name?.[0]}</Text>}
                </View>
                <View className="flex-1">
                    {/* Seletor de Modo (Tipo de Post) */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 flex-row">
                        <TouchableOpacity onPress={() => setPostType('POST')} className={`px-3 py-1 rounded-full border mr-2 ${postType === 'POST' ? 'bg-zinc-800 border-zinc-700' : 'border-transparent'}`}>
                            <Text className={`text-xs font-bold ${postType === 'POST' ? 'text-white' : 'text-zinc-500'}`}>Pensamento</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setPostType('EXCERPT')} className={`px-3 py-1 rounded-full border mr-2 flex-row items-center gap-1 ${postType === 'EXCERPT' ? 'bg-emerald-900/30 border-emerald-500/50' : 'border-transparent'}`}>
                            <BookOpen size={10} color={postType === 'EXCERPT' ? '#34d399' : '#71717a'} />
                            <Text className={`text-xs font-bold ${postType === 'EXCERPT' ? 'text-emerald-400' : 'text-zinc-500'}`}>Citar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setPostType('CHALLENGE')} className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${postType === 'CHALLENGE' ? 'bg-amber-900/30 border-amber-500/50' : 'border-transparent'}`}>
                            <Trophy size={10} color={postType === 'CHALLENGE' ? '#fbbf24' : '#71717a'} />
                            <Text className={`text-xs font-bold ${postType === 'CHALLENGE' ? 'text-amber-400' : 'text-zinc-500'}`}>Desafio</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Input */}
                    <TextInput 
                        placeholder={postType === 'EXCERPT' ? "Digite o trecho..." : postType === 'CHALLENGE' ? "Lance um desafio literário!" : "O que você está pensando?"}
                        placeholderTextColor="#71717a"
                        multiline
                        value={content}
                        onChangeText={setContent}
                        className="text-white text-base min-h-[60px] pt-0 mb-2"
                        textAlignVertical="top"
                    />

                    {/* Área de Seleção de Livro (Funciona em TODOS os modos) */}
                    {selectedBook ? (
                        <View className="flex-row items-center bg-zinc-900 p-2 rounded-lg border border-zinc-800 mb-2">
                            <BookOpen size={16} color="#10b981" className="mr-2" />
                            <Text className="text-zinc-300 text-xs flex-1 font-medium" numberOfLines={1}>{selectedBook.title}</Text>
                            <TouchableOpacity onPress={() => setSelectedBook(null)}><X size={14} color="#ef4444" /></TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={openBookSelector} className="flex-row items-center mb-2 self-start">
                            <BookOpen size={16} color="#71717a" className="mr-2" />
                            <Text className="text-zinc-500 text-xs font-bold underline">Marcar um livro {postType === 'EXCERPT' && '(Obrigatório)'}</Text>
                        </TouchableOpacity>
                    )}

                    <View className="flex-row justify-end">
                        <TouchableOpacity onPress={handleCreatePost} disabled={content.length === 0 || isPosting} className={`px-5 py-2 rounded-full ${content.length > 0 ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
                            <Text className={`${content.length > 0 ? 'text-white' : 'text-zinc-500'} font-bold text-xs`}>{isPosting ? "Enviando..." : "Publicar"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function SocialFeed() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'POST' | 'EXCERPT' | 'CHALLENGE'>('POST');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [myBooks, setMyBooks] = useState<any[]>([]);

  const fetchFeed = async () => {
    try {
      const data = await socialService.getFeed();
      setPosts(data);
    } catch (e) { console.error(e); } finally { setRefreshing(false); }
  };

  useEffect(() => { fetchFeed(); }, []);

  const openBookSelector = async () => {
      setShowBookSelector(true);
      if (myBooks.length === 0) {
          try {
            const books = await socialService.getMyBooks();
            setMyBooks(books);
          } catch(e) {}
      }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) return Alert.alert("Ops", "Escreva algo!");
    // Validação: Citação EXIGE livro
    if (postType === 'EXCERPT' && !selectedBook) return Alert.alert("Atenção", "Para fazer uma citação, selecione o livro.");

    setIsPosting(true);
    try {
        const newPost = await socialService.createPost(content, postType, selectedBook?.id);
        // Adiciona ao topo e adiciona flag 'isLiked: false'
        setPosts(prev => [{...newPost, isLiked: false, _count: { reactions: 0, comments: 0 }}, ...prev]);
        setContent('');
        setPostType('POST');
        setSelectedBook(null);
    } catch (e) {
        Alert.alert("Erro", "Falha ao publicar. Tente novamente.");
    } finally { setIsPosting(false); }
  };

  const handleDeletePost = async (postId: string) => {
      try {
          await socialService.deletePost(postId);
          setPosts(prev => prev.filter(p => p.id !== postId)); // Remove da lista localmente
          Alert.alert("Sucesso", "Post removido.");
      } catch (e) {
          Alert.alert("Erro", "Não foi possível remover o post.");
      }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#09090b" />
        <View className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex-row items-center justify-between">
            <Text className="text-white font-black text-xl tracking-tight">Social</Text>
        </View>

        <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
                <SocialHeader 
                    user={user} content={content} setContent={setContent} postType={postType} setPostType={setPostType}
                    openBookSelector={openBookSelector} selectedBook={selectedBook} setSelectedBook={setSelectedBook}
                    handleCreatePost={handleCreatePost} isPosting={isPosting}
                />
            }
            renderItem={({ item }) => (
                <SocialPostCard 
                    post={item} 
                    onComment={() => Alert.alert("Comentários", "Em breve")} 
                    onDelete={handleDeletePost} // Passa a função de deletar
                />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeed(); }} tintColor="#10b981" />}
            ListEmptyComponent={<View className="p-8 items-center mt-10"><PenTool size={48} color="#3f3f46" /><Text className="text-zinc-500 text-center mt-4">Nenhuma postagem no momento.</Text></View>}
        />

        <Modal visible={showBookSelector} animationType="slide" transparent onRequestClose={() => setShowBookSelector(false)}>
            <View className="flex-1 bg-black/80 justify-end">
                <View className="bg-zinc-900 h-[60%] rounded-t-3xl overflow-hidden">
                    <View className="p-4 border-b border-zinc-800 flex-row justify-between items-center">
                        <Text className="text-white font-bold text-lg">Selecione o Livro</Text>
                        <TouchableOpacity onPress={() => setShowBookSelector(false)}><X size={24} color="#71717a"/></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {myBooks.map((book) => (
                            <TouchableOpacity key={book.id} onPress={() => { setSelectedBook(book); setShowBookSelector(false); }} className="flex-row items-center mb-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                <View className="w-10 h-14 bg-zinc-800 rounded mr-3 overflow-hidden">
                                    {book.coverUrl && <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />}
                                </View>
                                <View><Text className="text-white font-bold text-sm">{book.title}</Text><Text className="text-zinc-500 text-xs">{book.author}</Text></View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </SafeAreaView>
  );
}