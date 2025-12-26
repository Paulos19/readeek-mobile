import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StatusBar, ActivityIndicator, FlatList, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, useFocusEffect } from 'expo-router';
import { Search, Plus, MapPin, Store, Coins, Bell, MessageCircle, ChevronRight, BookOpen, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
    api, 
    getMarketplaceFeed, 
    MarketplaceFeed, 
    MarketProduct,
    notificationService, // <--- Importado
    Notification         // <--- Importado
} from '../../../lib/api';
import { Book } from '../_types/book';
import { NotificationsSheet } from './_components/NotificationsSheet'; // <--- Importado

const { width } = Dimensions.get('window');

export default function MarketplaceScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<MarketplaceFeed | null>(null);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  
  // Estados de Notificação
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Carregamento de Dados (Feed + Notificações)
  const loadData = useCallback(async () => {
    try {
      const [marketData, booksResponse, notifData] = await Promise.all([
        getMarketplaceFeed(),
        api.get('/mobile/books').then(res => res.data).catch(() => []),
        notificationService.getAll() // <--- Busca notificações
      ]);
      
      setFeed(marketData);
      
      if (Array.isArray(booksResponse)) {
        setSuggestedBooks(booksResponse.slice(0, 5)); 
      }

      if (notifData) {
          setNotifications(notifData.notifications);
          setNotificationsCount(notifData.unreadCount);
      }

    } catch (error) {
      console.error("Erro ao carregar marketplace:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarrega sempre que a tela ganha foco (para atualizar badge de notificação)
  useFocusEffect(
    useCallback(() => {
        loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = async () => {
    setLoading(true);
    const data = await getMarketplaceFeed(search);
    setFeed(data);
    setLoading(false);
  };

  // Função para marcar como lida (chamada pelo Modal)
  const handleMarkAsRead = async (id?: string) => {
    // Atualização Otimista na UI
    if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setNotificationsCount(prev => Math.max(0, prev - 1));
    } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setNotificationsCount(0);
    }
    
    // Chamada API
    await notificationService.markAsRead(id);
  };

  // --- UI COMPONENTS ---

  const Header = () => (
    <View className="px-5 pt-2 pb-4 bg-black/80 z-10">
        {/* Top Bar */}
        <View className="flex-row justify-between items-center mb-4">
            <View>
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-0.5">Explore</Text>
                <Text className="text-white text-2xl font-black tracking-tight">Marketplace</Text>
            </View>
            
            <View className="flex-row items-center gap-3">
                {/* Botão Vender */}
                <TouchableOpacity 
                    onPress={() => router.push('/(app)/shop/create')}
                    className="bg-emerald-600 h-10 px-4 rounded-full flex-row items-center justify-center shadow-lg shadow-emerald-900/30"
                >
                    <Plus size={18} color="white" style={{marginRight: 4}} />
                    <Text className="text-white font-bold text-xs">Vender</Text>
                </TouchableOpacity>

                {/* Ícones de Ação */}
                <View className="flex-row gap-2 bg-zinc-900 p-1 rounded-full border border-zinc-800">
                    <Link href="/(app)/chat" asChild>
                        <TouchableOpacity className="w-9 h-9 items-center justify-center rounded-full bg-zinc-800">
                            <MessageCircle size={18} color="white" />
                        </TouchableOpacity>
                    </Link>
                    
                    {/* BOTÃO DE NOTIFICAÇÃO ATUALIZADO */}
                    <TouchableOpacity 
                        className="w-9 h-9 items-center justify-center rounded-full bg-zinc-800 relative"
                        onPress={() => setShowNotifications(true)}
                    >
                        <Bell size={18} color={notificationsCount > 0 ? "white" : "#71717a"} />
                        {notificationsCount > 0 && (
                            <View className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-zinc-900/80 rounded-2xl px-4 py-3 border border-zinc-800 shadow-sm">
            <Search size={20} color="#71717a" />
            <TextInput 
                placeholder="O que você procura hoje?" 
                placeholderTextColor="#71717a"
                className="flex-1 ml-3 text-white font-medium"
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
            />
        </View>
    </View>
  );

  const HeroBanner = () => (
    <View className="px-5 mb-8">
        <TouchableOpacity activeOpacity={0.9} className="w-full h-44 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/20">
            <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', '#000000']}
                className="absolute w-full h-full justify-end p-5"
            >
                <View className="flex-row items-center mb-2">
                    <View className="bg-purple-600 px-2 py-0.5 rounded text-xs mr-2">
                        <Text className="text-white text-[10px] font-bold">DESTAQUE</Text>
                    </View>
                    <Text className="text-zinc-300 text-xs">Clube do Livro</Text>
                </View>
                <Text className="text-white font-bold text-2xl w-2/3 leading-7">Encontre raridades e troque experiências.</Text>
            </LinearGradient>
        </TouchableOpacity>
    </View>
  );

  const SectionHeader = ({ title, icon: Icon, color, action }: any) => (
    <View className="px-5 flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
            <View className={`w-8 h-8 rounded-full items-center justify-center bg-zinc-900 border border-zinc-800`}>
                <Icon size={16} color={color} />
            </View>
            <Text className="text-white font-bold text-lg">{title}</Text>
        </View>
        {action && (
            <TouchableOpacity onPress={action} className="flex-row items-center">
                <Text className="text-zinc-500 text-xs font-bold mr-1">VER TUDO</Text>
                <ChevronRight size={14} color="#71717a" />
            </TouchableOpacity>
        )}
    </View>
  );

  const CreditProductCard = ({ product }: { product: MarketProduct }) => (
    <TouchableOpacity 
        className="mr-4 w-36 group"
        onPress={() => router.push(`/(app)/product/${product.id}` as any)}
    >
        <View className="w-36 h-48 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-2 relative">
            <Image 
                source={{ uri: product.images[0]?.url || 'https://via.placeholder.com/150' }}
                className="w-full h-full opacity-90"
                resizeMode="cover"
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute bottom-0 w-full h-1/2 justify-end p-3">
                <Text numberOfLines={1} className="text-amber-400 font-bold text-sm shadow-black">{product.price}</Text>
                <Text className="text-zinc-400 text-[10px] font-bold uppercase">Créditos</Text>
            </LinearGradient>
            <View className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                <Coins size={10} color="#fbbf24" />
            </View>
        </View>
        <Text numberOfLines={1} className="text-zinc-200 font-bold text-xs ml-1">{product.title}</Text>
    </TouchableOpacity>
  );

  const ShopAvatar = ({ shop }: { shop: any }) => (
    <Link href={`/(app)/shop/${shop.id}`} asChild>
        <TouchableOpacity className="mr-5 items-center">
            <View className="w-16 h-16 rounded-full p-0.5 border-2 border-purple-500/30 mb-2">
                <Image 
                    source={{ uri: shop.imageUrl || `https://ui-avatars.com/api/?name=${shop.name}` }}
                    className="w-full h-full rounded-full bg-zinc-800"
                />
            </View>
            <Text numberOfLines={1} className="text-zinc-300 text-[10px] font-bold w-20 text-center">{shop.name}</Text>
        </TouchableOpacity>
    </Link>
  );

  const BookSuggestionCard = ({ book }: { book: Book }) => (
    <TouchableOpacity 
        className="mr-3 w-28"
        onPress={() => router.push({ pathname: `/read/${book.id}`, params: { hasCover: book.coverUrl ? 'true' : 'false' } })}
    >
        <View className="w-28 h-40 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden mb-2 shadow-lg shadow-black/50">
            {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <View className="flex-1 items-center justify-center"><BookOpen size={24} color="#52525b" /></View>
            )}
        </View>
        <Text numberOfLines={1} className="text-white font-bold text-xs ml-0.5">{book.title}</Text>
        <Text numberOfLines={1} className="text-zinc-500 text-[10px] ml-0.5">{book.author}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1" edges={['top']}>
        
        <Header />

        {/* SHEET DE NOTIFICAÇÕES */}
        <NotificationsSheet 
            visible={showNotifications}
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={handleMarkAsRead}
        />

        {loading ? (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        ) : (
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />}
            >
                <HeroBanner />

                {/* 1. LOJA DE CRÉDITOS */}
                {feed?.creditShop && feed.creditShop.length > 0 && (
                    <View className="mb-8">
                        <SectionHeader title="Loja de Recompensas" icon={Coins} color="#fbbf24" action={() => {}} />
                        <FlatList 
                            horizontal
                            data={feed.creditShop}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => <CreditProductCard product={item} />}
                            contentContainerStyle={{ paddingHorizontal: 20 }}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* 2. LOJAS */}
                {feed?.shops && feed.shops.length > 0 && (
                    <View className="mb-8">
                        <SectionHeader title="Lojas Oficiais" icon={Store} color="#a855f7" />
                        <FlatList 
                            horizontal
                            data={feed.shops}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => <ShopAvatar shop={item} />}
                            contentContainerStyle={{ paddingHorizontal: 20 }}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* 3. SUGESTÕES DE LIVROS */}
                {suggestedBooks.length > 0 && (
                    <View className="mb-8">
                        <SectionHeader title="Para Ler Agora" icon={BookOpen} color="#3b82f6" />
                        <FlatList 
                            horizontal
                            data={suggestedBooks}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => <BookSuggestionCard book={item} />}
                            contentContainerStyle={{ paddingHorizontal: 20 }}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* 4. FEED DE PRODUTOS (Novidades) */}
                <View className="px-5">
                    <View className="flex-row items-center gap-2 mb-4">
                        <View className="w-8 h-8 rounded-full items-center justify-center bg-zinc-900 border border-zinc-800">
                            <Star size={16} color="#10b981" />
                        </View>
                        <Text className="text-white font-bold text-lg">Acabou de Chegar</Text>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        {feed?.recentDrops.map((product) => (
                            <TouchableOpacity 
                                key={product.id} 
                                className="w-[48%] mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                                onPress={() => router.push(`/(app)/product/${product.id}` as any)}
                            >
                                <Image 
                                    source={{ uri: product.images[0]?.url || 'https://via.placeholder.com/150' }}
                                    className="w-full h-40 bg-zinc-800"
                                    resizeMode="cover"
                                />
                                <View className="p-3">
                                    <Text numberOfLines={2} className="text-white font-bold text-sm h-10 leading-5">{product.title}</Text>
                                    <Text className="text-emerald-500 font-bold text-base mt-1">R$ {Number(product.price).toFixed(2)}</Text>
                                    
                                    <View className="flex-row items-center mt-2 opacity-60">
                                        <MapPin size={10} color="#a1a1aa" />
                                        <Text numberOfLines={1} className="text-zinc-400 text-[10px] ml-1 flex-1">{product.address}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {feed?.recentDrops.length === 0 && (
                        <View className="py-10 items-center">
                            <Text className="text-zinc-600">Nenhum produto novo por enquanto.</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}