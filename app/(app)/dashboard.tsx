import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendingUp, Users, BookOpen, Download, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// API & Libs
import { api, registerDownload } from 'lib/api';
import { fileManager } from 'lib/files';
import { useAuthStore } from 'stores/useAuthStore';

// Tipos
import { Book, UserRole } from './_types/book';

// Componentes UI
import { HeroBanner } from './_components/HeroBanner';
import { GreetingHeader } from './_components/GreetingHeader';
import { BookDetailsModal } from './_components/BookDetailsModal';

export default function Dashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Estados de Dados
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados de UI (Modal)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- BUSCA DE DADOS ---
  const fetchBooks = async () => {
    try {
      // 1. Pega livros do Backend
      const response = await api.get('/mobile/books');
      const apiBooks = response.data;

      const processedBooks: Book[] = await Promise.all(apiBooks.map(async (book: any) => {
        // Verifica se existe fisicamente no dispositivo
        const isDownloaded = await fileManager.checkBookExists(book.id);
        
        // Tratamento seguro do Role
        const rawRole = book.userRole || 'USER';
        const safeRole: UserRole = (rawRole === 'ADMIN' || rawRole === 'USER') ? rawRole : 'USER';

        const mockOwner = { 
            id: book.userId || 'unknown', 
            name: book.userName || 'Readeek', 
            image: book.userImage || null,
            role: safeRole
        };

        // LÓGICA DE PROTEÇÃO DE PROGRESSO:
        // Se o livro é meu (userId bate com o logado), tento sincronizar o progresso.
        // Se é de outro, mostro 0 (a menos que já tenha baixado, aí o backend já deve ter retornado o meu clone).
        
        let localCfi = null;

        if (book.currentLocation) {
             localCfi = await AsyncStorage.getItem(`@progress:${book.id}`);
             
             // Sync Reverso apenas se o livro for meu
             if (book.userId === user?.id) {
                if (book.currentLocation !== localCfi) {
                    await AsyncStorage.setItem(`@progress:${book.id}`, book.currentLocation);
                    localCfi = book.currentLocation;
                }
             }
        }

        return {
          ...book,
          owner: mockOwner,
          downloadsCount: book.downloadsCount || 0,
          description: book.description || null,
          isDownloaded,
          isDownloading: false,
          downloadProgress: 0,
          // Se não for meu, zero o progresso visualmente
          progress: (book.userId === user?.id) ? (book.progress || 0) : 0, 
          currentLocation: localCfi
        };
      }));

      setAllBooks(processedBooks);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  useEffect(() => { fetchBooks(); }, [user]); // Recarrega se mudar o utilizador

  // --- FILTROS INTELIGENTES ---
  const { featuredBooks, rankingBooks, communityBooks, myBooks } = useMemo(() => {
    // Minha Estante: Livros baixados OU livros meus que já iniciei
    const my = allBooks.filter(b => b.isDownloaded || (b.userId === user?.id && b.progress > 0));
    
    // Destaques: Apenas ADMINS
    const featured = allBooks.filter(b => b.owner?.role === 'ADMIN');
    
    // Comunidade: O resto (excluindo os que já baixei e os de admins)
    // Nota: filtramos b.userId !== user?.id para não mostrar meus próprios livros na aba comunidade
    const community = allBooks.filter(b => !b.isDownloaded && b.owner?.role !== 'ADMIN' && b.userId !== user?.id);
    
    // Ranking: Ordenado por downloads
    const ranking = [...allBooks].sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0)).slice(0, 5);

    return { featuredBooks: featured, rankingBooks: ranking, communityBooks: community, myBooks: my };
  }, [allBooks, user]);


  // --- AÇÕES ---
  
  // Atualiza estado local de um livro (barra de progresso, status)
  const updateBookState = (id: string, updates: Partial<Book>) => {
    setAllBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (selectedBook?.id === id) {
        setSelectedBook(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // 1. Ao clicar no Card -> Abre Modal
  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  // 2. Ação Principal do Modal (Baixar ou Ler)
  const handleModalAction = async (book: Book) => {
    if (book.isDownloaded) {
      setModalVisible(false);
      router.push(`/read/${book.id}`);
    } else {
      // PROCESSO DE DOWNLOAD
      try {
        updateBookState(book.id, { isDownloading: true });
        
        // A. Regista na API e obtém o ID CORRETO (pode ser um clone novo ou o mesmo ID)
        const targetBookId = await registerDownload(book.id);
        
        if (!targetBookId) throw new Error("Falha ao obter ID do livro.");

        // B. Baixa o ficheiro usando o NOVO ID como nome de destino
        // (A origem continua sendo book.filePath)
        await fileManager.downloadBook(book.filePath, targetBookId, (progress) => {
           updateBookState(book.id, { downloadProgress: progress });
        });

        Alert.alert("Sucesso", "Livro adicionado à sua biblioteca!");
        setModalVisible(false);

        // C. REFRESH IMPORTANTE:
        // Recarregamos a lista para que a API retorne o novo registo (clone) 
        // e o livro apareça corretamente na "Minha Estante" com o progresso pessoal.
        onRefresh();

      } catch (error) {
        Alert.alert("Erro", "Falha ao baixar o livro. Verifique sua conexão.");
        updateBookState(book.id, { isDownloading: false });
      }
    }
  };

  // --- UI HELPERS ---
  const SectionTitle = ({ title, icon: Icon, color = "#10b981", onPress }: any) => (
      <View className="px-6 flex-row items-center justify-between mb-4 mt-8">
          <View className="flex-row items-center gap-2">
              <Icon size={20} color={color} />
              <Text className="text-white font-bold text-xl tracking-tight">{title}</Text>
          </View>
          {onPress && (
            <TouchableOpacity onPress={onPress}>
              <Text className="text-zinc-500 text-xs font-bold uppercase">Ver tudo</Text>
            </TouchableOpacity>
          )}
      </View>
  );

  const BookCardSmall = ({ book }: { book: Book }) => (
    <TouchableOpacity 
        onPress={() => handleBookPress(book)}
        activeOpacity={0.7}
        className="mr-4 w-32 group"
    >
        <View className="w-32 h-48 rounded-xl bg-zinc-800 overflow-hidden mb-2 relative border border-white/5 shadow-md">
             {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
             ) : (
                <View className="w-full h-full items-center justify-center bg-zinc-800"><BookOpen color="#52525b" /></View>
             )}
             
             {book.isDownloading && (
                 <View className="absolute inset-0 bg-black/70 items-center justify-center">
                    <ActivityIndicator color="#10b981" />
                    <Text className="text-white text-[10px] font-bold mt-1">{Math.round(book.downloadProgress)}%</Text>
                 </View>
             )}

             {!book.isDownloading && !book.isDownloaded && (
                <View className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur-sm">
                   <Download size={12} color="white" />
                </View>
             )}
        </View>
        <Text className="text-zinc-200 font-bold text-sm leading-4 mb-0.5" numberOfLines={2}>{book.title}</Text>
        
        <View className="flex-row items-center justify-between">
            <Text className="text-zinc-500 text-xs flex-1" numberOfLines={1}>{book.author}</Text>
            {(book.downloadsCount ?? 0) > 0 && (
                <View className="flex-row items-center gap-0.5 ml-1">
                    <Download size={8} color="#71717a" />
                    <Text className="text-[10px] text-zinc-500">{book.downloadsCount}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none">
        <LinearGradient colors={['#022c22', '#000000']} className="w-full h-full opacity-60" />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView 
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        >
            {/* 1. Header com Saudação e Avatar Corrigido */}
            <GreetingHeader name={user?.name || null} image={user?.image} />

            {/* 2. Banner de Destaques */}
            <HeroBanner 
              books={featuredBooks.length > 0 ? featuredBooks.slice(0, 5) : allBooks.slice(0, 3)} 
              onPress={handleBookPress} 
            />

            {/* 3. Minha Estante */}
            {myBooks.length > 0 && (
                <View>
                    <SectionTitle title="Minha Estante" icon={BookOpen} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                        {myBooks.map((book) => (
                             <TouchableOpacity key={book.id} onPress={() => handleBookPress(book)} className="mr-4 w-28">
                                <View className="h-40 w-full rounded-xl bg-zinc-800 overflow-hidden mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-900/20 relative">
                                    {book.coverUrl && <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />}
                                    
                                    <View className="absolute bottom-0 w-full h-1 bg-zinc-900">
                                        <View className="h-full bg-emerald-500" style={{ width: `${book.progress}%` }} />
                                    </View>
                                    
                                    {book.isDownloaded && (
                                        <View className="absolute top-1 right-1 bg-emerald-500/90 rounded-full p-0.5">
                                            <CheckCircle2 size={10} color="white" />
                                        </View>
                                    )}
                                </View>
                                <Text className="text-zinc-300 text-xs font-medium pl-0.5" numberOfLines={1}>{book.title}</Text>
                             </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* 4. Top Downloads */}
            <View>
                <SectionTitle title="Mais Baixados" icon={TrendingUp} color="#facc15" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                    {rankingBooks.map((book, index) => (
                        <View key={book.id} className="mr-4 relative">
                            <Text className="absolute -left-2 -bottom-4 text-[80px] font-black text-white/5 z-0 leading-none">
                                {index + 1}
                            </Text>
                            <BookCardSmall book={book} />
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* 5. Comunidade */}
            <View>
                <SectionTitle title="Comunidade" icon={Users} color="#60a5fa" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                    {communityBooks.map((book) => <BookCardSmall key={book.id} book={book} />)}
                    {communityBooks.length === 0 && <Text className="text-zinc-500 italic ml-6">Tudo atualizado por aqui.</Text>}
                </ScrollView>
            </View>

            <View className="h-8" />
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Detalhes do Livro */}
      <BookDetailsModal 
        visible={modalVisible}
        book={selectedBook}
        onClose={() => setModalVisible(false)}
        onAction={handleModalAction}
      />
    </View>
  );
}