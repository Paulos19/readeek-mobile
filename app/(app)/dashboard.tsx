import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendingUp, Users, BookOpen, Download, CheckCircle2, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// API & Libs
import { api, registerDownload } from 'lib/api';
import { fileManager } from 'lib/files';
import { useAuthStore } from 'stores/useAuthStore';
import { useNetworkStatus } from './_hooks/useNetworkStatus';

// Tipos
import { Book, UserRole } from './_types/book';

// Componentes UI
import { HeroBanner } from './_components/HeroBanner';
import { GreetingHeader } from './_components/GreetingHeader';
import { BookDetailsModal } from './_components/BookDetailsModal';

export default function Dashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { isConnected } = useNetworkStatus();

  // Estados
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true); // <--- NOVO ESTADO DE LOADING
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- BUSCA DE DADOS ---
  const fetchBooks = async () => {
    // Se estiver offline, cancela o loading e retorna
    if (isConnected === false) {
        setLoading(false);
        return;
    }

    try {
      const response = await api.get('/mobile/books');
      
      // Validação de segurança: garante que é um array
      const apiBooks = Array.isArray(response.data) ? response.data : [];

      const processedBooks: Book[] = await Promise.all(apiBooks.map(async (book: any) => {
        // Proteção contra falhas no fileManager
        let isDownloaded = false;
        try { isDownloaded = await fileManager.checkBookExists(book.id); } catch (e) {}
        
        const rawRole = book.userRole || 'USER';
        const safeRole: UserRole = (rawRole === 'ADMIN' || rawRole === 'USER') ? rawRole : 'USER';

        const mockOwner = { 
            id: book.userId || 'unknown', 
            name: book.userName || 'Readeek', 
            image: book.userImage || null,
            role: safeRole
        };

        // Sync Reverso (Apenas se online e for meu livro)
        let localCfi = null;
        if (book.currentLocation && book.userId === user?.id) {
              try {
                  localCfi = await AsyncStorage.getItem(`@progress:${book.id}`);
                  if (book.currentLocation !== localCfi) {
                      await AsyncStorage.setItem(`@progress:${book.id}`, book.currentLocation);
                      localCfi = book.currentLocation;
                  }
              } catch (e) {
                  console.warn("Erro no sync de progresso:", e);
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
          progress: (book.userId === user?.id) ? (book.progress || 0) : 0, 
          currentLocation: localCfi
        };
      }));

      setAllBooks(processedBooks);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      // Opcional: Mostrar um toast de erro aqui
    } finally {
      setLoading(false); // <--- Garante que o loading pare sempre
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  useEffect(() => { 
      setLoading(true); 
      fetchBooks(); 
  }, [user, isConnected]); 

  // Filtros Memoized
  const { featuredBooks, rankingBooks, communityBooks, myBooks } = useMemo(() => {
    const my = allBooks.filter(b => b.isDownloaded || (b.userId === user?.id && b.progress > 0));
    const featured = allBooks.filter(b => b.owner?.role === 'ADMIN');
    const community = allBooks.filter(b => !b.isDownloaded && b.owner?.role !== 'ADMIN' && b.userId !== user?.id);
    const ranking = [...allBooks].sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0)).slice(0, 5);

    return { featuredBooks: featured, rankingBooks: ranking, communityBooks: community, myBooks: my };
  }, [allBooks, user]);


  // --- UI OFFLINE ---
  if (isConnected === false) { // Verifica explicitamente false (evita null inicial)
    return (
        <View className="flex-1 bg-zinc-950">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{flexGrow: 1}}>
                    <GreetingHeader name={user?.name || 'Leitor'} image={user?.image} />
                    
                    <View className="flex-1 px-6 items-center justify-center -mt-20">
                        <View className="w-full bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl items-center shadow-lg">
                            <View className="w-20 h-20 bg-zinc-950 rounded-full items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                                <WifiOff size={32} color="#ef4444" />
                            </View>
                            
                            <Text className="text-white font-black text-2xl text-center mb-2">
                                Você está offline
                            </Text>
                            <Text className="text-zinc-400 text-center text-base mb-8 leading-6">
                                O feed, rankings e downloads estão indisponíveis. Mas não se preocupe, seus livros baixados estão prontos.
                            </Text>

                            <TouchableOpacity 
                                className="w-full bg-emerald-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-emerald-900/20"
                                onPress={() => router.push('/(app)/library')}
                                activeOpacity={0.8}
                            >
                                <BookOpen size={20} color="white" style={{ marginRight: 10 }} />
                                <Text className="text-white font-bold text-lg uppercase tracking-wide">
                                    Ir para Biblioteca
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
  }

  // --- UI LOADING INICIAL ---
  if (loading && allBooks.length === 0) {
      return (
          <View className="flex-1 bg-black items-center justify-center">
              <ActivityIndicator size="large" color="#10b981" />
              <Text className="text-zinc-500 text-xs mt-4">Carregando sua biblioteca...</Text>
          </View>
      );
  }

  // --- UI ONLINE (NORMAL) ---

  const updateBookState = (id: string, updates: Partial<Book>) => {
    setAllBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (selectedBook?.id === id) {
        setSelectedBook(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const handleModalAction = async (book: Book) => {
    if (book.isDownloaded) {
      setModalVisible(false);
      router.push({
        pathname: `/read/${book.id}`,
        params: { 
            author: book.author || '',
            hasCover: book.coverUrl ? 'true' : 'false'
        }
      });
    } else {
      try {
        updateBookState(book.id, { isDownloading: true });
        
        const targetBookId = await registerDownload(book.id);
        if (!targetBookId) throw new Error("Falha ao obter ID do livro.");

        await fileManager.downloadBook(book.filePath, targetBookId, (progress) => {
           updateBookState(book.id, { downloadProgress: progress });
        });

        Alert.alert("Sucesso", "Livro adicionado à sua biblioteca!");
        setModalVisible(false);
        onRefresh();

      } catch (error) {
        Alert.alert("Erro", "Falha ao baixar o livro. Verifique sua conexão.");
        updateBookState(book.id, { isDownloading: false });
      }
    }
  };

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
            <GreetingHeader name={user?.name || null} image={user?.image} />

            <HeroBanner 
              books={featuredBooks.length > 0 ? featuredBooks.slice(0, 5) : allBooks.slice(0, 3)} 
              onPress={handleBookPress} 
            />

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

      <BookDetailsModal 
        visible={modalVisible}
        book={selectedBook}
        onClose={() => setModalVisible(false)}
        onAction={handleModalAction}
      />
    </View>
  );
}