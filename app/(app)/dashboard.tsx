import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, StatusBar, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrendingUp, Users, BookOpen, Download, CheckCircle2, WifiOff, Trophy, ChevronRight, Sparkles } from 'lucide-react-native';
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
import { GreetingHeader } from './_components/GreetingHeader'; // Agora usa o componente completo
import { BookDetailsModal } from './_components/BookDetailsModal';
import { RankingCard } from './_components/RankingCard';
import { WriterCallCard } from './_components/WriterCallCard';

const { width } = Dimensions.get('window');

// --- COMPONENTES VISUAIS ---

const SectionHeader = React.memo(({ title, subtitle, icon: Icon, color = "#10b981", onPress }: { title: string, subtitle?: string, icon?: any, color?: string, onPress?: () => void }) => (
    <View className="px-6 flex-row items-end justify-between mb-5 mt-8">
        <View>
            <View className="flex-row items-center gap-2 mb-1">
                {Icon && <Icon size={18} color={color} />}
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{subtitle || 'Seção'}</Text>
            </View>
            <Text className="text-white font-black text-2xl tracking-tight leading-7">{title}</Text>
        </View>
        {onPress && (
            <TouchableOpacity onPress={onPress} className="bg-zinc-800/50 px-3 py-1.5 rounded-full flex-row items-center border border-zinc-700">
                <Text className="text-zinc-300 text-xs font-bold mr-1">Ver todos</Text>
                <ChevronRight size={12} color="#d4d4d8" />
            </TouchableOpacity>
        )}
    </View>
));

const ModernBookCard = React.memo(({ book, onPress, showProgress = true }: { book: Book, onPress: (book: Book) => void, showProgress?: boolean }) => (
    <TouchableOpacity onPress={() => onPress(book)} activeOpacity={0.8} className="mr-4 w-[140px]">
        <View className="w-[140px] h-[210px] rounded-2xl bg-zinc-800 overflow-hidden mb-3 relative border border-zinc-700/50 shadow-xl shadow-black/50">
            {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <View className="w-full h-full items-center justify-center bg-zinc-800 relative">
                    <LinearGradient colors={['#27272a', '#18181b']} className="absolute inset-0" />
                    <BookOpen color="#52525b" size={40} />
                    <Text className="text-zinc-500 text-xs text-center px-2 mt-2 font-medium" numberOfLines={3}>{book.title}</Text>
                </View>
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} className="absolute bottom-0 w-full h-1/3" />
            
            {showProgress && (book.progress || 0) > 0 && (
                <View className="absolute bottom-0 w-full h-1.5 bg-zinc-900/50">
                    <View className="h-full bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${book.progress}%` }} />
                </View>
            )}

            {book.isDownloading && (
                <View className="absolute inset-0 bg-black/60 backdrop-blur-[2px] items-center justify-center">
                    <ActivityIndicator color="#10b981" size="large" />
                    <Text className="text-emerald-400 text-xs font-black mt-2">{Math.round(book.downloadProgress || 0)}%</Text>
                </View>
            )}

            <View className="absolute top-2 right-2 flex-row gap-1">
                {!book.isDownloading && book.isDownloaded ? (
                    <View className="bg-emerald-500/20 p-1.5 rounded-full border border-emerald-500/30 backdrop-blur-md">
                        <CheckCircle2 size={10} color="#34d399" strokeWidth={3} />
                    </View>
                ) : !book.isDownloading && (
                    <View className="bg-black/40 p-1.5 rounded-full backdrop-blur-md">
                        <Download size={10} color="white" />
                    </View>
                )}
            </View>
        </View>
        <Text className="text-white font-bold text-sm leading-5" numberOfLines={2}>{book.title}</Text>
        <Text className="text-zinc-500 text-xs font-medium mt-0.5" numberOfLines={1}>{book.author}</Text>
    </TouchableOpacity>
));

// --- DASHBOARD PRINCIPAL ---

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

    // --- CARREGAMENTO ---
    const fetchBooks = useCallback(async () => {
        if (!user) return;
        if (isConnected === false) { setLoading(false); return; }

        try {
            const response = await api.get(`/mobile/books?_t=${Date.now()}`);
            const apiBooks = Array.isArray(response.data) ? response.data : [];

            const processedBooks: Book[] = await Promise.all(apiBooks.map(async (book: any) => {
                let isDownloaded = false;
                try { isDownloaded = await fileManager.checkBookExists(book.id); } catch (e) { }

                const rawRole = book.userRole || 'USER';
                const safeRole: UserRole = (rawRole === 'ADMIN' || rawRole === 'USER') ? rawRole : 'USER';

                let localCfi = null;
                let localTimestamp = 0;
                let localProgress = book.progress || 0;

                if (book.userId === user?.id) {
                    try {
                        localCfi = await AsyncStorage.getItem(`@progress:${book.id}`);
                        const tsStr = await AsyncStorage.getItem(`@last_read:${book.id}`);
                        const pctStr = await AsyncStorage.getItem(`@percent:${book.id}`);
                        localTimestamp = tsStr ? parseInt(tsStr, 10) : 0;
                        if (pctStr) {
                            const pct = parseFloat(pctStr);
                            if (pct * 100 > localProgress) localProgress = pct * 100;
                        }
                    } catch (e) { }
                }

                const apiDate = book.updatedAt ? new Date(book.updatedAt).getTime() : 0;
                const finalDate = new Date(Math.max(apiDate, localTimestamp));

                return {
                    ...book,
                    owner: { id: book.userId || 'unknown', name: book.userName || 'Readeek', image: book.userImage || null, role: safeRole },
                    downloadsCount: book.downloadsCount || 0,
                    description: book.description || null,
                    isDownloaded,
                    isDownloading: false,
                    downloadProgress: 0,
                    progress: localProgress,
                    currentLocation: localCfi || book.currentLocation,
                    updatedAt: finalDate
                };
            }));

            setAllBooks(processedBooks);
        } catch (error: any) {
            if (error.response?.status !== 401) console.error("Erro dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [user, isConnected]);

    const loadTopRanking = async () => {
        try {
            const data = await getRanking();
            if (Array.isArray(data)) setTopUsers(data.slice(0, 5));
        } catch (error) { }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchBooks();
                loadTopRanking();
            }
        }, [user, fetchBooks])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        // Não precisamos recarregar notificações aqui, o GreetingHeader faz isso sozinho
        await Promise.all([fetchBooks(), loadTopRanking()]);
        setRefreshing(false);
    };

    // --- FILTROS & LÓGICA ---
    const { featuredBooks, rankingBooks, communityBooks, myBooks } = useMemo(() => {
        if (!user) return { featuredBooks: [], rankingBooks: [], communityBooks: [], myBooks: [] };
        const my = allBooks.filter(b => b.isDownloaded || (b.userId === user?.id && b.progress > 0));
        const featured = allBooks.filter(b => b.owner?.role === 'ADMIN');
        const community = allBooks.filter(b => !b.isDownloaded && b.owner?.role !== 'ADMIN' && b.userId !== user?.id);
        const ranking = [...allBooks].sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0)).slice(0, 5);
        return { featuredBooks: featured, rankingBooks: ranking, communityBooks: community, myBooks: my };
    }, [allBooks, user]);

    const lastReadBook = useMemo(() => {
        if (!user || allBooks.length === 0) return null;
        const startedBooks = allBooks.filter(b => b.userId === user.id && b.progress > 0);
        startedBooks.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });
        return startedBooks.length > 0 ? startedBooks[0] : null;
    }, [allBooks, user]);

    const updateBookState = (id: string, updates: Partial<Book>) => {
        setAllBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        if (selectedBook?.id === id) setSelectedBook(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleBookPress = useCallback((book: Book) => {
        setSelectedBook(book);
        setModalVisible(true);
    }, []);

    const handleContinueReading = useCallback(async (book: any) => {
        await AsyncStorage.setItem(`@last_read:${book.id}`, Date.now().toString());
        router.push({ pathname: `/read/${book.id}`, params: { author: book.author || '', hasCover: book.coverUrl ? 'true' : 'false' } });
    }, [router]);

    const handleModalAction = async (book: Book) => {
        if (book.isDownloaded) {
            setModalVisible(false);
            handleContinueReading(book);
        } else {
            try {
                updateBookState(book.id, { isDownloading: true });
                const targetBookId = await registerDownload(book.id);
                if (!targetBookId) throw new Error("Falha ao obter ID.");
                await fileManager.downloadBook(book.filePath, targetBookId, (progress) => {
                    updateBookState(book.id, { downloadProgress: progress });
                });
                Alert.alert("Sucesso", "Livro adicionado à sua biblioteca!");
                setModalVisible(false);
                onRefresh();
            } catch (error) {
                Alert.alert("Erro", "Falha ao baixar.");
                updateBookState(book.id, { isDownloading: false });
            }
        }
    };

    // --- RENDERIZAÇÃO ---

    if (isConnected === false) {
        return (
            <View className="flex-1 bg-zinc-950 items-center justify-center p-6">
                <WifiOff size={48} color="#ef4444" className="mb-4" />
                <Text className="text-white font-black text-2xl text-center">Modo Offline</Text>
                <Text className="text-zinc-400 text-center mt-2 mb-8">Conecte-se à internet para ver novidades. Seus livros baixados estão na biblioteca.</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/library')} className="bg-emerald-600 px-8 py-3 rounded-full">
                    <Text className="text-white font-bold">Ir para Biblioteca</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading && allBooks.length === 0) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-zinc-500 text-xs mt-4 animate-pulse">Carregando estante...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <View className="absolute top-0 left-0 right-0 h-[500px]">
                <LinearGradient colors={['#1e1b4b', '#000000']} className="w-full h-full opacity-40" />
            </View>

            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
                >
                    {/* O GreetingHeader agora contém o Header + Continue Reading */}
                    <GreetingHeader
                        user={user}
                        lastReadBook={lastReadBook}
                        onContinueReading={handleContinueReading}
                    />

                    {/* Destaques (Hero) */}
                    <View className="mt-2">
                        <HeroBanner
                            books={featuredBooks.length > 0 ? featuredBooks.slice(0, 5) : allBooks.slice(0, 3)}
                            onPress={handleBookPress}
                        />
                    </View>

                    {/* Minha Estante */}
                    {myBooks.length > 0 && (
                        <View>
                            <SectionHeader 
                                title="Minha Biblioteca" 
                                subtitle="Continue de onde parou" 
                                icon={BookOpen} 
                                color="#818cf8"
                                onPress={() => router.push('/(app)/library')}
                            />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                {myBooks.map((book) => (
                                    <ModernBookCard key={book.id} book={book} onPress={handleBookPress} showProgress />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* CTA para Escritores */}
                    <View className="mt-8 mb-4">
                        <WriterCallCard />
                    </View>

                    {/* Ranking */}
                    {topUsers.length > 0 && (
                        <View className="relative">
                            <LinearGradient 
                                colors={['transparent', 'rgba(251, 191, 36, 0.05)', 'transparent']} 
                                start={{x:0, y:0}} end={{x:1, y:0}}
                                className="absolute inset-0 h-full w-full"
                            />
                            <SectionHeader 
                                title="Hall da Fama" 
                                subtitle="Leitores mais ativos" 
                                icon={Trophy} 
                                color="#fbbf24"
                                onPress={() => router.push('/(app)/ranking')} 
                            />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                {topUsers.map((user, index) => (
                                    <RankingCard key={user.id} user={user} position={index + 1} />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Tendências */}
                    <View>
                        <SectionHeader title="Em Alta" subtitle="Tendências da semana" icon={TrendingUp} color="#f472b6" />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                            {rankingBooks.map((book, index) => (
                                <View key={book.id} className="mr-4 relative">
                                    <Text className="absolute -left-4 -bottom-6 text-[90px] font-black text-white/5 z-0 leading-none italic">
                                        {index + 1}
                                    </Text>
                                    <ModernBookCard book={book} onPress={handleBookPress} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Comunidade */}
                    <View>
                        <SectionHeader 
                            title="Comunidade" 
                            subtitle="Obras de autores independentes" 
                            icon={Users} 
                            color="#34d399" 
                            onPress={() => router.push('/(app)/community')}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                            {communityBooks.length > 0 ? (
                                communityBooks.map((book) => (
                                    <ModernBookCard key={book.id} book={book} onPress={handleBookPress} />
                                ))
                            ) : (
                                <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-[300px] flex-row items-center gap-4">
                                    <Sparkles size={24} color="#71717a" />
                                    <Text className="text-zinc-500 text-sm flex-1">
                                        Você explorou tudo! Novas obras da comunidade aparecerão aqui em breve.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
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