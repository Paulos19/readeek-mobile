import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendingUp, Users, BookOpen, CheckCircle2, WifiOff, Trophy, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// API & Libs
import { api, registerDownload, getRanking, RankingUser } from '../../lib/api';
import { fileManager } from '../../lib/files';
import { useAuthStore } from '../../stores/useAuthStore';
import { useReadingStore } from '../../stores/useReadingStore'; // Store Global de Leitura
import { useNetworkStatus } from './_hooks/useNetworkStatus';

// Tipos
import { Book, UserRole } from './_types/book';

// Componentes UI
import { HeroBanner } from './_components/HeroBanner';
import { GreetingHeader } from './_components/GreetingHeader';
import { BookDetailsModal } from './_components/BookDetailsModal';
import { RankingCard } from './_components/RankingCard';
import { WriterCallCard } from './_components/WriterCallCard';

// --- SUB-COMPONENTES MEMOIZADOS ---

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
    <TouchableOpacity onPress={() => onPress(book)} activeOpacity={0.7} className="mr-4 w-28 group">
        <View className="h-40 w-full rounded-xl bg-zinc-800 overflow-hidden mb-2 border border-white/10 shadow-lg relative">
            {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <View className="w-full h-full items-center justify-center bg-zinc-900"><BookOpen color="#52525b" /></View>
            )}

            {/* Barra de Progresso */}
            {(book.progress || 0) > 0 && (
                <View className="absolute bottom-0 w-full h-1 bg-zinc-950/50">
                    <View className="h-full bg-emerald-500" style={{ width: `${book.progress}%` }} />
                </View>
            )}

            {/* Overlay de Download */}
            {book.isDownloading && (
                <View className="absolute inset-0 bg-black/80 items-center justify-center">
                    <ActivityIndicator color="#10b981" size="small" />
                </View>
            )}

            {/* Ícone de Baixado */}
            {!book.isDownloading && book.isDownloaded && (
                <View className="absolute top-1 right-1 bg-black/60 p-1 rounded-full backdrop-blur-sm">
                    <CheckCircle2 size={10} color="#10b981" />
                </View>
            )}
        </View>
        
        <Text className="text-zinc-200 text-xs font-bold leading-4 pl-0.5" numberOfLines={2}>{book.title}</Text>
        <Text className="text-zinc-500 text-[10px] pl-0.5 mt-0.5" numberOfLines={1}>{book.author}</Text>
    </TouchableOpacity>
));

// --- DASHBOARD PRINCIPAL ---

export default function Dashboard() {
    const { user } = useAuthStore();
    const { lastRead, setLastRead } = useReadingStore(); // Zustand para persistência e atualização instantânea
    const router = useRouter();
    const { isConnected } = useNetworkStatus();

    // Estados Locais
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [topUsers, setTopUsers] = useState<RankingUser[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // --- FETCH DATA ---
    const fetchBooks = useCallback(async () => {
        if (!user) return;
        if (isConnected === false) { setLoading(false); return; }

        try {
            const response = await api.get(`/mobile/books?_t=${Date.now()}`);
            const apiBooks = Array.isArray(response.data) ? response.data : [];

            const processedBooks: Book[] = await Promise.all(apiBooks.map(async (book: any) => {
                let isDownloaded = false;
                try { isDownloaded = await fileManager.checkBookExists(book.id); } catch (e) { }

                // Sincronização de Progresso Local vs Cloud
                let localProgress = book.progress || 0;
                let localCfi = book.currentLocation;
                
                // Timestamp local para saber qual foi realmente o último lido no dispositivo
                let localLastReadTime = 0;

                if (book.userId === user.id) {
                    const storedCfi = await AsyncStorage.getItem(`@progress:${book.id}`);
                    const storedPct = await AsyncStorage.getItem(`@percent:${book.id}`);
                    const storedTime = await AsyncStorage.getItem(`@last_read:${book.id}`);
                    
                    if (storedTime) localLastReadTime = parseInt(storedTime, 10);

                    if (storedCfi) localCfi = storedCfi;
                    if (storedPct) {
                        const pct = parseFloat(storedPct);
                        // Se o local for maior que o da nuvem, usa o local na UI
                        if (pct * 100 > localProgress) localProgress = pct * 100;
                    }
                }

                return {
                    ...book,
                    owner: {
                        id: book.userId || 'unknown',
                        name: book.userName || 'Readeek',
                        image: book.userImage || null,
                        role: book.userRole || 'USER'
                    },
                    downloadsCount: book.downloadsCount || 0,
                    isDownloaded,
                    isDownloading: false,
                    downloadProgress: 0,
                    progress: localProgress,
                    currentLocation: localCfi,
                    // Usa o timestamp mais recente entre API e Local para definir ordem
                    updatedAt: new Date(Math.max(new Date(book.updatedAt).getTime(), localLastReadTime))
                };
            }));

            setAllBooks(processedBooks);
            
            // --- ATUALIZA O HEADER (ZUSTAND) ---
            // Encontra o livro mais recente baseado na data combinada (local/cloud)
            const mostRecent = processedBooks
                .filter(b => b.userId === user.id && b.progress > 0)
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

            if (mostRecent) {
                setLastRead({
                    id: mostRecent.id,
                    title: mostRecent.title,
                    author: mostRecent.author || 'Autor Desconhecido',
                    progress: mostRecent.progress || 0,
                    coverUrl: mostRecent.coverUrl
                });
            }

        } catch (error: any) {
            console.error("Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    }, [user, isConnected, setLastRead]);

    const loadTopRanking = async () => {
        try {
            const data = await getRanking();
            if (Array.isArray(data)) setTopUsers(data.slice(0, 5));
        } catch (error) { console.error(error); }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchBooks();
                loadTopRanking();
            }
        }, [user])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchBooks(), loadTopRanking()]);
        setRefreshing(false);
    };

    // Filtros
    const { featuredBooks, rankingBooks, communityBooks, myBooks } = useMemo(() => {
        if (!user) return { featuredBooks: [], rankingBooks: [], communityBooks: [], myBooks: [] };

        const my = allBooks.filter(b => b.isDownloaded || (b.userId === user.id && b.progress > 0));
        const featured = allBooks.filter(b => b.owner?.role === 'ADMIN');
        const community = allBooks.filter(b => !b.isDownloaded && b.owner?.role !== 'ADMIN' && b.userId !== user.id);
        const ranking = [...allBooks].sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0)).slice(0, 5);

        return { featuredBooks: featured, rankingBooks: ranking, communityBooks: community, myBooks: my };
    }, [allBooks, user]);

    // Handlers
    const handleBookPress = useCallback((book: Book) => {
        setSelectedBook(book);
        setModalVisible(true);
    }, []);

    const handleContinueReading = useCallback(async (bookOrLastRead: any) => {
        const targetId = bookOrLastRead.id;
        if (!targetId) return;

        // Atualiza timestamp local para que ao voltar ele continue sendo o primeiro
        await AsyncStorage.setItem(`@last_read:${targetId}`, Date.now().toString());
        
        router.push(`/read/${targetId}`);
    }, [router]);

    const handleModalAction = async (book: Book) => {
        if (book.isDownloaded) {
            setModalVisible(false);
            handleContinueReading(book);
        } else {
            try {
                setAllBooks(prev => prev.map(b => b.id === book.id ? { ...b, isDownloading: true } : b));
                
                const targetBookId = await registerDownload(book.id);
                if (!targetBookId) throw new Error("ID inválido");

                await fileManager.downloadBook(book.filePath, targetBookId, (progress) => {
                    // Opcional: Atualizar progresso visualmente via state se desejar
                });

                Alert.alert("Sucesso", "Download concluído!");
                setModalVisible(false);
                onRefresh(); 
            } catch (error) {
                Alert.alert("Erro", "Falha no download.");
                setAllBooks(prev => prev.map(b => b.id === book.id ? { ...b, isDownloading: false } : b));
            }
        }
    };

    if (loading && allBooks.length === 0) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            
            {/* Background Ambient */}
            <View className="absolute top-0 left-0 right-0 h-[500px] pointer-events-none">
                <LinearGradient colors={['#064e3b', '#000000']} className="w-full h-full opacity-40" />
            </View>

            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
                >
                    {/* 1. Header (Integrado com Zustand para feedback imediato) */}
                    <GreetingHeader
                        user={user}
                        lastReadBook={lastRead} 
                        onContinueReading={() => lastRead && handleContinueReading(lastRead)}
                    />

                    {/* 2. Writer Call To Action (Novo posicionamento estratégico) */}
                    <WriterCallCard />

                    {/* 3. Hero Banner (Destaques) */}
                    <View className="mt-6">
                        <HeroBanner
                            books={featuredBooks.length > 0 ? featuredBooks.slice(0, 5) : allBooks.slice(0, 3)}
                            onPress={handleBookPress}
                        />
                    </View>

                    {/* 4. Minha Estante */}
                    {myBooks.length > 0 && (
                        <View>
                            <SectionTitle title="Minha Estante" icon={BookOpen} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                {myBooks.map((book) => (
                                    <BookCardSmall key={book.id} book={book} onPress={handleBookPress} />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* 5. Ranking */}
                    {rankingBooks.length > 0 && (
                        <View>
                            <SectionTitle title="Mais Baixados" icon={TrendingUp} color="#facc15" />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                {rankingBooks.map((book, index) => (
                                    <View key={book.id} className="mr-4 relative">
                                        <Text className="absolute -left-4 -bottom-6 text-[90px] font-black text-white/5 z-0 leading-none">
                                            {index + 1}
                                        </Text>
                                        <BookCardSmall book={book} onPress={handleBookPress} />
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* 6. Comunidade */}
                    <View>
                        <SectionTitle title="Comunidade" icon={Users} color="#60a5fa" />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                            {communityBooks.map((book) => (
                                <BookCardSmall key={book.id} book={book} onPress={handleBookPress} />
                            ))}
                            {communityBooks.length === 0 && (
                                <Text className="text-zinc-500 italic ml-6">Tudo atualizado por aqui.</Text>
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