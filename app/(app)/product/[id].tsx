import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar, Dimensions, Share } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PinIcon, MapPin, Share2, MessageCircle, ShoppingBag, BookOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getProductDetails, ProductDetailsResponse } from '../../../lib/api';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [data, setData] = useState<ProductDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    setLoading(true);
    const response = await getProductDetails(id);
    setData(response);
    setLoading(false);
  };

  const handleShare = async () => {
    if (!data?.product) return;
    try {
      await Share.share({
        message: `Olha esse produto que encontrei no Readeek: ${data.product.title}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleBuy = () => {
    // Implementaremos o Chat na próxima fase
    alert("Redirecionando para o Chat com o vendedor...");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!data || !data.product) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Produto não encontrado.</Text>
      </View>
    );
  }

  const { product, relatedProducts, communityBooks } = data;
  const isCredits = product.currency === 'CREDITS';

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* === GALERIA DE IMAGENS === */}
        <View className="relative h-96 w-full bg-zinc-900">
            <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const slide = Math.ceil(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                    setActiveImageIndex(slide);
                }}
            >
                {product.images.length > 0 ? product.images.map((img) => (
                    <Image 
                        key={img.id}
                        source={{ uri: img.url }}
                        style={{ width: width, height: 384 }}
                        resizeMode="cover"
                    />
                )) : (
                    <View style={{ width: width, height: 384 }} className="items-center justify-center">
                        <ShoppingBag size={64} color="#3f3f46" />
                    </View>
                )}
            </ScrollView>
            
            {/* Header Flutuante */}
            <View className="absolute top-0 left-0 right-0 pt-12 px-4 flex-row justify-between items-center">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
                    <PinIcon size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
                    <Share2 size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Dots Indicadores */}
            {product.images.length > 1 && (
                <View className="absolute bottom-4 w-full flex-row justify-center gap-2">
                    {product.images.map((_, i) => (
                        <View 
                            key={i} 
                            className={`h-2 rounded-full ${i === activeImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} 
                        />
                    ))}
                </View>
            )}
        </View>

        {/* === INFORMAÇÕES DO PRODUTO === */}
        <View className="px-5 pt-6">
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <Text className="text-white font-bold text-2xl leading-7">{product.title}</Text>
                    <View className="flex-row items-center mt-2 opacity-70">
                        <MapPin size={14} color="#a1a1aa" />
                        <Text className="text-zinc-400 text-xs ml-1">{product.address}</Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className={`font-black text-xl ${isCredits ? 'text-amber-400' : 'text-emerald-500'}`}>
                        {isCredits ? product.price : `R$ ${Number(product.price).toFixed(2)}`}
                    </Text>
                    <Text className="text-zinc-500 text-[10px] font-bold uppercase">
                        {isCredits ? 'Créditos' : 'Reais'}
                    </Text>
                </View>
            </View>

            <View className="h-[1px] bg-zinc-800 my-6" />

            {/* VENDEDOR */}
            <TouchableOpacity 
                className="flex-row items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800"
                onPress={() => router.push(`/(app)/users/${product.shop.owner.id}` as any)}
            >
                <Image 
                    source={{ uri: product.shop.imageUrl || product.shop.owner.image || 'https://via.placeholder.com/50' }}
                    className="w-12 h-12 rounded-full bg-zinc-800"
                />
                <View className="ml-3 flex-1">
                    <Text className="text-zinc-400 text-xs">Vendido por</Text>
                    <Text className="text-white font-bold text-base">{product.shop.name}</Text>
                </View>
                <PinIcon size={20} color="#52525b" />
            </TouchableOpacity>

            <View className="mt-6">
                <Text className="text-white font-bold text-lg mb-2">Descrição</Text>
                <Text className="text-zinc-400 leading-6">{product.description}</Text>
            </View>
        </View>

        {/* === SUGESTÕES DE PRODUTOS === */}
        {relatedProducts.length > 0 && (
            <View className="mt-10">
                <Text className="text-white font-bold text-lg px-5 mb-4">Você também pode gostar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {relatedProducts.map((item) => (
                        <TouchableOpacity 
                            key={item.id}
                            className="mr-4 w-32"
                            onPress={() => router.push(`/(app)/shop/product/${item.id}` as any)}
                        >
                            <Image 
                                source={{ uri: item.images[0]?.url }} 
                                className="w-32 h-32 rounded-xl bg-zinc-800 mb-2"
                            />
                            <Text numberOfLines={1} className="text-zinc-300 font-bold text-xs">{item.title}</Text>
                            <Text className="text-emerald-500 font-bold text-xs">R$ {Number(item.price).toFixed(2)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        )}

        {/* === SUGESTÕES DE LIVROS DA COMUNIDADE === */}
        {communityBooks.length > 0 && (
            <View className="mt-8">
                <Text className="text-white font-bold text-lg px-5 mb-4">Leia também na Comunidade</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {communityBooks.map((book) => (
                        <TouchableOpacity 
                            key={book.id}
                            className="mr-4 w-28"
                            onPress={() => router.push({ pathname: `/read/${book.id}`, params: { hasCover: book.coverUrl ? 'true' : 'false' } })}
                        >
                            <View className="w-28 h-40 rounded-xl bg-zinc-800 mb-2 overflow-hidden border border-zinc-700">
                                {book.coverUrl ? (
                                    <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <View className="flex-1 items-center justify-center"><BookOpen size={20} color="#52525b" /></View>
                                )}
                            </View>
                            <Text numberOfLines={1} className="text-zinc-300 font-bold text-xs">{book.title}</Text>
                            <Text numberOfLines={1} className="text-zinc-500 text-[10px]">{book.author}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        )}

      </ScrollView>

      {/* === FOOTER DE AÇÃO === */}
      <View className="absolute bottom-0 w-full bg-zinc-900 border-t border-zinc-800 px-5 py-4 pb-8 flex-row items-center gap-3">
        <TouchableOpacity 
            className="w-14 h-14 bg-zinc-800 rounded-2xl items-center justify-center border border-zinc-700"
            onPress={() => alert("Chat em desenvolvimento")}
        >
            <MessageCircle size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
            className="flex-1 h-14 bg-emerald-600 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            onPress={handleBuy}
        >
            <ShoppingBag size={20} color="white" />
            <Text className="text-white font-bold text-lg">
                {isCredits ? 'Trocar Agora' : 'Adquirir'}
            </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}