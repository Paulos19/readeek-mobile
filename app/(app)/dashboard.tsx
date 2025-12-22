// app/(app)/dashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Crown, TrendingUp, Users, BookOpen, Download, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// API & Libs
import { api } from 'lib/api';
import { fileManager } from 'lib/files';
import { useAuthStore } from 'stores/useAuthStore';

// IMPORTANTE: Importando do local centralizado
import { Book, UserRole } from './_types/book';

// Componentes UI
import { HeroBanner } from './_components/HeroBanner';
import { GreetingHeader } from './_components/GreetingHeader';

export default function Dashboard() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- BUSCA DE DADOS ---
  const fetchBooks = async () => {
    try {
      // 1. Pega livros do Backend
      const response = await api.get('/mobile/books');
      const apiBooks = response.data;

      // 2. Hidrata com dados locais (Download e Progresso)
      const processedBooks: Book[] = await Promise.all(apiBooks.map(async (book: any) => {
        const isDownloaded = await fileManager.checkBookExists(book.id);
        
        // Tratamento de segurança para o Role (Garante que é ADMIN ou USER)
        const rawRole = book.userRole || 'USER';
        const safeRole: UserRole = (rawRole === 'ADMIN' || rawRole === 'USER') ? rawRole : 'USER';

        // Mock seguro para o Owner caso a API não envie completo
        const mockOwner = book.owner || { 
            id: book.userId || 'unknown', 
            name: book.userName || 'Readeek', 
            image: book.userImage || null,
            role: safeRole
        };

        // Sync Reverso (Nuvem -> Local)
        if (book.currentLocation) {
             const localCfi = await AsyncStorage.getItem(`@progress:${book.id}`);
             // Se a nuvem estiver diferente do local, atualizamos o local (assumindo nuvem mais recente)
             if (book.currentLocation !== localCfi) {
                 await AsyncStorage.setItem(`@progress:${book.id}`, book.currentLocation);
             }
        }

        return {
          ...book,
          owner: mockOwner,
          downloadsCount: book.downloadsCount || 0,
          isDownloaded,
          isDownloading: false,
          downloadProgress: 0,
          progress: book.progress || 0
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

  useEffect(() => { fetchBooks(); }, []);

  // --- FILTROS INTELIGENTES (UseMemo) ---
  const { featuredBooks, rankingBooks, communityBooks, myBooks } = useMemo(() => {
    // Meus Livros: Baixados ou iniciados
    const my = allBooks.filter(b => b.isDownloaded || b.progress > 0);
    
    // Destaques: Apenas ADMINS (Removemos o check de OWNER que causava erro)
    const featured = allBooks.filter(b => b.owner?.role === 'ADMIN');
    
    // Comunidade: O resto (excluindo os que eu já baixei e os de admins)
    const community = allBooks.filter(b => !b.isDownloaded && b.owner?.role !== 'ADMIN');
    
    // Ranking: Ordenado por downloads
    const ranking = [...allBooks].sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0)).slice(0, 5);

    return { featuredBooks: featured, rankingBooks: ranking, communityBooks: community, myBooks: my };
  }, [allBooks]);


  // --- GERENCIAMENTO DE DOWNLOADS ---
  const updateBookState = (id: string, updates: Partial<Book>) => {
    setAllBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleBookPress = async (book: Book) => {
    if (book.isDownloaded) {
      router.push(`/read/${book.id}`);
    } else {
      // Inicia Download
      try {
        updateBookState(book.id, { isDownloading: true });
        
        await fileManager.downloadBook(book.filePath, book.id, (progress) => {
           updateBookState(book.id, { downloadProgress: progress });
        });

        updateBookState(book.id, { isDownloading: false, isDownloaded: true });
        Alert.alert("Sucesso", "Livro adicionado à sua estante offline!");
      } catch (error) {
        Alert.alert("Erro", "Falha ao baixar o livro.");
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
             
             {/* Overlay de Download */}
             {book.isDownloading && (
                 <View className="absolute inset-0 bg-black/70 items-center justify-center">
                    <ActivityIndicator color="#10b981" />
                    <Text className="text-white text-[10px] font-bold mt-1">{Math.round(book.downloadProgress)}%</Text>
                 </View>
             )}

             {/* Indicador de Downloaded */}
             {!book.isDownloading && !book.isDownloaded && (
                <View className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur-sm">
                   <Download size={12} color="white" />
                </View>
             )}
        </View>
        <Text className="text-zinc-200 font-bold text-sm leading-4 mb-0.5" numberOfLines={2}>{book.title}</Text>
        <Text className="text-zinc-500 text-xs" numberOfLines={1}>{book.author}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient Fixo */}
      <View className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none">
        <LinearGradient colors={['#022c22', '#000000']} className="w-full h-full opacity-60" />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView 
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        >
            {/* 1. Header Premium */}
            <GreetingHeader name={user?.name || null} image={user?.image} />

            {/* 2. Banner de Destaques (Editor's Choice) */}
            <HeroBanner 
              books={featuredBooks.length > 0 ? featuredBooks.slice(0, 5) : allBooks.slice(0, 3)} 
              onPress={handleBookPress} 
            />

            {/* 3. Minha Estante (Livros Baixados/Lendo) */}
            {myBooks.length > 0 && (
                <View>
                    <SectionTitle title="Minha Estante" icon={BookOpen} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                        {myBooks.map((book) => (
                             <TouchableOpacity 
                                key={book.id}
                                onPress={() => handleBookPress(book)}
                                className="mr-4 w-28"
                             >
                                <View className="h-40 w-full rounded-xl bg-zinc-800 overflow-hidden mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-900/20 relative">
                                    {book.coverUrl && <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />}
                                    
                                    {/* Barra de Progresso */}
                                    <View className="absolute bottom-0 w-full h-1 bg-zinc-900">
                                        <View className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${book.progress}%` }} />
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
                            {/* Número do Ranking */}
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
    </View>
  );
}