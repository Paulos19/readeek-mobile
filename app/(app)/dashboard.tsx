import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendingUp, Users, BookOpen, Download, CheckCircle2, WifiOff, Trophy, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// API & Libs
import { api, registerDownload, getRanking, RankingUser } from '../../lib/api';
import { fileManager } from '../../lib/files';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNetworkStatus } from './_hooks/useNetworkStatus';

// Tipos
import { Book, UserRole } from './_types/book';

// Componentes UI
import { HeroBanner } from './_components/HeroBanner';
import { GreetingHeader } from './_components/GreetingHeader';
import { BookDetailsModal } from './_components/BookDetailsModal';
import { RankingCard } from './_components/RankingCard'; 

// --- COMPONENTES AUXILIARES ---

const SectionTitle = React.memo(({ title, icon: Icon, color = "#10b981", onPress }: { title: string, icon: any, color?: string, onPress?: () => void }) => (
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
));

const BookCardSmall = React.memo(({ book, onPress }: { book: Book, onPress: (book: Book) => void }) => (
    <TouchableOpacity onPress={() => onPress(book)} activeOpacity={0.7} className="mr-4 w-32 group">
        <View className="w-32 h-48 rounded-xl bg-zinc-800 overflow-hidden mb-2 relative border border-white/5 shadow-md">
             {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
             ) : (
                <View className="w-full h-full items-center justify-center bg-zinc-800"><BookOpen color="#52525b" /></View>
             )}
             
             {book.isDownloading && (
                 <View className="absolute inset-0 bg-black/70 items-center justify-center">
                    <ActivityIndicator color="#10b981" />
                    <Text className="text-white text-[10px] font-bold mt-1">{Math.round(book.downloadProgress || 0)}%</Text>
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
));

// --- DASHBOARD ---

export default function Dashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { isConnected } = useNetworkStatus();

  // Estados
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [topUsers, setTopUsers] = useState<RankingUser[]>([]); 
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- BUSCA DE DADOS ---
  const fetchBooks = useCallback(async () => {
    if (!user) return;
    if (isConnected === false) {
        setLoading(false);
        return;
    }

    try {
      // Adiciona timestamp para evitar cache da API
      const response = await api.get(`/mobile/books?_t=${Date.now()}`);
      const apiBooks = Array.isArray(response.data) ? response.data : [];

      const processedBooks: Book[] = await Promise.all(apiBooks.map(async (book: any) => {
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

        // --- LÓGICA DE SINCRONIZAÇÃO DE PROGRESSO ---
        // Recupera dados locais para garantir que o "Em andamento" esteja atualizado
        let localCfi = null;
        let localTimestamp = 0;

        if (book.userId === user?.id) {
             try {
                 // Recupera CFI
                 localCfi = await AsyncStorage.getItem(`@progress:${book.id}`);
                 
                 // Recupera timestamp de última leitura local (importante para ordenação)
                 const tsStr = await AsyncStorage.getItem(`@last_read:${book.id}`);
                 localTimestamp = tsStr ? parseInt(tsStr, 10) : 0;
                 
                 // Se o local for diferente do cloud, atualiza o objeto localmente para exibição imediata
                 if (localCfi && localCfi !== book.currentLocation) {
                     // Aqui assumimos que o local é o mais recente se a API ainda não atualizou
                     // Você poderia adicionar lógica de timestamp aqui se o backend também retornar timestamp de leitura
                 }
             } catch (e) { /* silent */ }
        }

        // Data de atualização: Usa a mais recente entre a API e o Local
        const apiDate = book.updatedAt ? new Date(book.updatedAt).getTime() : 0;
        const finalDate = new Date(Math.max(apiDate, localTimestamp));

        return {
          ...book,
          owner: mockOwner,
          downloadsCount: book.downloadsCount || 0,
          description: book.description || null,
          isDownloaded,
          isDownloading: false,
          downloadProgress: 0,
          progress: (book.userId === user?.id) ? (book.progress || 0) : 0, 
          currentLocation: localCfi || book.currentLocation, // Prioriza local se existir, senão API
          updatedAt: finalDate // Usa data combinada para ordenação correta
        };
      }));

      setAllBooks(processedBooks);
    } catch (error: any) {
      if (error.response?.status !== 401) {
          console.error("Erro ao carregar dashboard:", error);
      }
    } finally {
      setLoading(false); 
    }
  }, [user, isConnected]);

  const loadTopRanking = async () => {
    try {
        const data = await getRanking();
        if (Array.isArray(data)) {
            setTopUsers(data.slice(0, 5));
        }
    } catch (error) {
        console.error("Erro ao carregar ranking", error);
    }
  };

  // --- ATUALIZAÇÃO AUTOMÁTICA AO VOLTAR PARA TELA ---
  useFocusEffect(
    useCallback(() => {
        if (user) {
            // Força atualização ao focar
            fetchBooks();
            loadTopRanking();
        }
    }, [user, fetchBooks])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBooks(), loadTopRanking()]);
    setRefreshing(false);
  };

  // Filtros Memoized
  const { featuredBooks, rankingBooks, communityBooks, myBooks } = useMemo<{
    featuredBooks: Book[];
    rankingBooks: Book[];
    communityBooks: Book[];
    myBooks: Book[];
  }>(() => {
    if (!user) return { featuredBooks: [], rankingBooks: [], communityBooks: [], myBooks: [] };

    // Meus livros: baixados ou com progresso
    const my = allBooks.filter(b => b.isDownloaded || (b.userId === user?.id && b.progress > 0));
    
    // Destaques (Admins)
    const featured = allBooks.filter(b => b.owner?.role === 'ADMIN');
    
    // Comunidade (Resto)
    const community = allBooks.filter(b => !b.isDownloaded && b.owner?.role !== 'ADMIN' && b.userId !== user?.id);
    
    // Ranking (Mais baixados)
    const ranking = [...allBooks].sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0)).slice(0, 5);

    return { featuredBooks: featured, rankingBooks: ranking, communityBooks: community, myBooks: my };
  }, [allBooks, user]);

  // Lógica de "Último Livro" (Header)
  const lastReadBook = useMemo(() => {
    if (!user || allBooks.length === 0) return null;
    
    // 1. Filtra livros do usuário com progresso
    const startedBooks = allBooks.filter(b => b.userId === user.id && b.progress > 0);
    
    // 2. Ordena pela data de atualização (mais recente primeiro)
    startedBooks.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Decrescente
    });
    
    return startedBooks.length > 0 ? startedBooks[0] : null;
  }, [allBooks, user]);


  // --- HANDLERS ---

  const updateBookState = (id: string, updates: Partial<Book>) => {
    setAllBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (selectedBook?.id === id) {
        setSelectedBook(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleBookPress = useCallback((book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  }, []);

  const handleContinueReading = useCallback(async (book: Book) => {
      // Atualiza timestamp local para garantir que ele suba no ranking ao voltar
      await AsyncStorage.setItem(`@last_read:${book.id}`, Date.now().toString());

      router.push({
        pathname: `/read/${book.id}`,
        params: { 
            author: book.author || '',
            hasCover: book.coverUrl ? 'true' : 'false'
        }
      });
  }, [router]);

  const handleModalAction = async (book: Book) => {
    if (book.isDownloaded) {
      setModalVisible(false);
      handleContinueReading(book);
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

  // --- RENDERIZAÇÃO ---

  // UI OFFLINE
  if (isConnected === false) { 
    return (
        <View className="flex-1 bg-zinc-950">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{flexGrow: 1}}>
                    {/* Header Offline Simplificado */}
                    <View className="px-6 pt-2 pb-6 flex-row items-center gap-3">
                         <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700">
                            <Text className="text-white font-bold text-lg">{user?.name?.[0]}</Text>
                         </View>
                         <View>
                            <Text className="text-zinc-400 text-xs">Modo Offline</Text>
                            <Text className="text-white font-bold text-lg">{user?.name?.split(' ')[0]}</Text>
                         </View>
                    </View>
                    
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

  // UI LOADING (Tela Preta Limpa)
  if (loading && allBooks.length === 0) {
      return (
          <View className="flex-1 bg-black items-center justify-center">
              <ActivityIndicator size="large" color="#10b981" />
              <Text className="text-zinc-500 text-xs mt-4 animate-pulse">Sincronizando biblioteca...</Text>
          </View>
      );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient Sutil */}
      <View className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none">
        <LinearGradient colors={['#022c22', '#000000']} className="w-full h-full opacity-60" />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView 
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        >
            {/* 1. Header com "Continuar Lendo" */}
            <GreetingHeader 
                user={user} 
                lastReadBook={lastReadBook} 
                onContinueReading={handleContinueReading}
            />

            {/* 2. Banner de Destaques */}
            <HeroBanner 
              books={featuredBooks.length > 0 ? featuredBooks.slice(0, 5) : allBooks.slice(0, 3)} 
              onPress={handleBookPress} 
            />

            {/* 3. Ranking de Leitores (Se houver dados) */}
            {topUsers.length > 0 && (
                <View className="mt-6 mb-2">
                    <View className="px-6 flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center gap-2">
                            <Trophy size={20} color="#fbbf24" />
                            <Text className="text-white font-bold text-xl tracking-tight">Top Leitores</Text>
                        </View>
                        <Link href="/(app)/ranking" asChild>
                            <TouchableOpacity className="flex-row items-center">
                                <Text className="text-emerald-500 font-bold text-xs uppercase mr-1">Ver Ranking</Text>
                                <ChevronRight size={16} color="#10b981" />
                            </TouchableOpacity>
                        </Link>
                    </View>

                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24 }} // Alinhamento com o Header (px-6 = 24)
                        snapToAlignment="start"
                        decelerationRate="fast"
                    >
                        {topUsers.map((user, index) => (
                            <RankingCard key={user.id} user={user} position={index + 1} />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* 4. Minha Estante (Livros restantes) */}
            {myBooks.length > 0 && (
                <View>
                    <SectionTitle title="Minha Estante" icon={BookOpen} />
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={{ paddingHorizontal: 24 }} // Alinhamento corrigido
                        snapToAlignment="start"
                        decelerationRate="fast"
                    >
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

            {/* 5. Mais Baixados */}
            <View>
                <SectionTitle title="Mais Baixados" icon={TrendingUp} color="#facc15" />
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingHorizontal: 24 }} // Alinhamento corrigido
                    snapToAlignment="start"
                    decelerationRate="fast"
                >
                    {rankingBooks.map((book, index) => (
                        <View key={book.id} className="mr-4 relative">
                            <Text className="absolute -left-2 -bottom-4 text-[80px] font-black text-white/5 z-0 leading-none">
                                {index + 1}
                            </Text>
                            <BookCardSmall book={book} onPress={handleBookPress} />
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* 6. Comunidade */}
            <View>
                <SectionTitle title="Comunidade" icon={Users} color="#60a5fa" />
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingHorizontal: 24 }} // Alinhamento corrigido
                    snapToAlignment="start"
                    decelerationRate="fast"
                >
                    {communityBooks.map((book) => (
                        <BookCardSmall key={book.id} book={book} onPress={handleBookPress} />
                    ))}
                    {communityBooks.length === 0 && (
                        <Text className="text-zinc-500 italic">Tudo atualizado por aqui.</Text>
                    )}
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