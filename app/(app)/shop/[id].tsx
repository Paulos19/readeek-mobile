import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronRightCircle, MapPin, Store } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getShopById, ShopDetails, MarketProduct } from '../../../lib/api';

export default function ShopDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShop();
  }, [id]);

  const loadShop = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getShopById(id);
    setShop(data);
    setLoading(false);
  };

  const renderProduct = ({ item }: { item: MarketProduct }) => (
    <TouchableOpacity 
        className="w-[48%] mb-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        onPress={() => router.push(`/(app)/product/${item.id}` as any)}
    >
        <Image 
            source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/150' }}
            className="w-full h-40 bg-zinc-800"
            resizeMode="cover"
        />
        <View className="p-3">
            <Text numberOfLines={1} className="text-white font-bold text-sm">{item.title}</Text>
            <View className="flex-row items-center justify-between mt-1">
                <Text className={item.currency === 'CREDITS' ? "text-amber-400 font-bold text-xs" : "text-emerald-500 font-bold text-xs"}>
                    {item.currency === 'CREDITS' ? `${item.price} Créditos` : `R$ ${item.price}`}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
  );

  if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#10b981" /></View>;
  if (!shop) return <View className="flex-1 bg-black justify-center items-center"><Text className="text-zinc-500">Loja não encontrada</Text></View>;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-4 py-2 flex-row items-center border-b border-zinc-900 pb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <ChevronRightCircle size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>{shop.name}</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Capa / Perfil da Loja */}
            <View className="items-center py-8 bg-zinc-900/30 border-b border-zinc-900">
                <View className="w-24 h-24 rounded-full border-2 border-emerald-600 p-1 mb-3">
                    <Image 
                        source={{ uri: shop.imageUrl || `https://ui-avatars.com/api/?name=${shop.name}` }}
                        className="w-full h-full rounded-full bg-zinc-800"
                    />
                </View>
                <Text className="text-2xl font-bold text-white mb-1">{shop.name}</Text>
                
                <TouchableOpacity 
                    className="flex-row items-center bg-zinc-800 px-3 py-1 rounded-full mt-2"
                    onPress={() => router.push(`/(app)/users/${shop.owner.id}` as any)}
                >
                    <Text className="text-zinc-400 text-xs mr-1">Gerenciado por</Text>
                    <Text className="text-white text-xs font-bold">{shop.owner.name}</Text>
                </TouchableOpacity>

                {shop.description && (
                    <Text className="text-zinc-400 text-center px-8 mt-4 text-sm leading-5">
                        {shop.description}
                    </Text>
                )}
            </View>

            {/* Lista de Produtos */}
            <View className="p-4">
                <View className="flex-row items-center gap-2 mb-4">
                    <Store size={18} color="#10b981" />
                    <Text className="text-white font-bold text-lg">Produtos Disponíveis</Text>
                </View>

                {shop.products.length === 0 ? (
                    <Text className="text-zinc-500 text-center mt-10 italic">Nenhum produto à venda no momento.</Text>
                ) : (
                    <FlatList
                        data={shop.products}
                        renderItem={renderProduct}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        scrollEnabled={false} // Scroll controlado pelo pai
                    />
                )}
            </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}