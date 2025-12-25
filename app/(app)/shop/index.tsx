import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StatusBar, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Search, Plus, MapPin, Store, Coins } from 'lucide-react-native';
import { getMarketplaceFeed, MarketplaceFeed, MarketProduct } from '../../../lib/api';

export default function MarketplaceScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<MarketplaceFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getMarketplaceFeed();
    setFeed(data);
    setLoading(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    const data = await getMarketplaceFeed(search);
    setFeed(data);
    setLoading(false);
  };

  // --- Componentes Internos de UI ---

  const ProductCard = ({ product, isCredit = false }: { product: MarketProduct, isCredit?: boolean }) => (
    <TouchableOpacity 
        className="mr-4 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden w-40"
        onPress={() => router.push(`/(app)/shop/product/${product.id}` as any)} // Rota futura
    >
        <Image 
            source={{ uri: product.images[0]?.url || 'https://via.placeholder.com/150' }}
            className="w-full h-40 bg-zinc-800"
            resizeMode="cover"
        />
        <View className="p-3">
            <Text numberOfLines={1} className="text-white font-bold text-sm">{product.title}</Text>
            
            {/* Preço */}
            <View className="flex-row items-center mt-1">
                {isCredit ? (
                    <>
                        <Coins size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                        <Text className="text-amber-400 font-bold text-xs">{product.price} Créditos</Text>
                    </>
                ) : (
                    <Text className="text-emerald-500 font-bold text-sm">R$ {product.price}</Text>
                )}
            </View>

            {/* Localização (Se não for loja de créditos) */}
            {!isCredit && (
                <View className="flex-row items-center mt-2 opacity-60">
                    <MapPin size={10} color="#a1a1aa" />
                    <Text numberOfLines={1} className="text-zinc-400 text-[10px] ml-1">{product.address}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
  );

  const ShopCard = ({ shop }: { shop: any }) => (
    <TouchableOpacity className="mr-4 items-center">
        <View className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden mb-2">
            <Image 
                source={{ uri: shop.imageUrl || `https://ui-avatars.com/api/?name=${shop.name}` }}
                className="w-full h-full"
            />
        </View>
        <Text numberOfLines={1} className="text-zinc-300 text-xs font-bold w-20 text-center">{shop.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        
        {/* HEADER & SEARCH */}
        <View className="px-5 py-4 border-b border-zinc-900">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-2xl font-bold">Marketplace</Text>
                <TouchableOpacity 
                    onPress={() => router.push('/(app)/shop/create')}
                    className="bg-emerald-600 p-2 rounded-full"
                >
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                <Search size={20} color="#71717a" />
                <TextInput 
                    placeholder="Buscar livros, produtos..." 
                    placeholderTextColor="#71717a"
                    className="flex-1 ml-3 text-white font-medium"
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
            </View>
        </View>

        {loading ? (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* 1. LOJA DE CRÉDITOS (Recompensas) */}
                {feed?.creditShop && feed.creditShop.length > 0 && (
                    <View className="mt-6">
                        <View className="px-5 flex-row items-center gap-2 mb-4">
                            <Coins size={20} color="#fbbf24" />
                            <Text className="text-amber-400 font-bold text-lg">Troque seus Créditos</Text>
                        </View>
                        <FlatList 
                            horizontal
                            data={feed.creditShop}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => <ProductCard product={item} isCredit />}
                            contentContainerStyle={{ paddingHorizontal: 20 }}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* 2. LOJAS EM DESTAQUE */}
                {feed?.shops && feed.shops.length > 0 && (
                    <View className="mt-8">
                        <View className="px-5 flex-row items-center gap-2 mb-4">
                            <Store size={20} color="#a855f7" />
                            <Text className="text-white font-bold text-lg">Lojas Parceiras</Text>
                        </View>
                        <FlatList 
                            horizontal
                            data={feed.shops}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => <ShopCard shop={item} />}
                            contentContainerStyle={{ paddingHorizontal: 20 }}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* 3. RECENTES (Feed Principal) */}
                <View className="mt-8 px-5">
                    <Text className="text-white font-bold text-lg mb-4">Novidades na Comunidade</Text>
                    <View className="flex-row flex-wrap justify-between">
                        {feed?.recentDrops.map((product) => (
                            <View key={product.id} className="w-[48%] mb-4">
                                <TouchableOpacity 
                                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden w-full pb-3"
                                    onPress={() => router.push(`/(app)/shop/product/${product.id}` as any)}
                                >
                                    <Image 
                                        source={{ uri: product.images[0]?.url || 'https://via.placeholder.com/150' }}
                                        className="w-full h-44 bg-zinc-800"
                                        resizeMode="cover"
                                    />
                                    <View className="p-3">
                                        <Text numberOfLines={2} className="text-white font-bold text-sm h-10">{product.title}</Text>
                                        <Text className="text-emerald-500 font-bold text-lg mt-1">R$ {Number(product.price).toFixed(2)}</Text>
                                        
                                        <View className="flex-row items-center mt-2 opacity-60">
                                            <MapPin size={12} color="#a1a1aa" />
                                            <Text numberOfLines={1} className="text-zinc-400 text-xs ml-1 flex-1">{product.address}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                    {feed?.recentDrops.length === 0 && (
                        <Text className="text-zinc-500 text-center mt-4">Nenhum produto encontrado.</Text>
                    )}
                </View>

            </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}