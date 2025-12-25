import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar, Dimensions, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MapPin, Share2, MessageCircle, ShoppingBag, BookOpen, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getProductDetails, ProductDetailsResponse, buyProductWithCredits } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Pegue a função de refreshUser se ela existir no seu store, senão apenas ignore
  // O importante aqui é ter o user para validações futuras se precisar
  const { user } = useAuthStore(); 
  
  const [data, setData] = useState<ProductDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
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

  const handleBuy = async () => {
    if (!data?.product) return;

    // Se for em Reais, mantém o fluxo futuro de chat
    if (data.product.currency !== 'CREDITS') {
        alert("O chat será aberto para negociar o pagamento em R$.");
        return;
    }

    // Lógica para CRÉDITOS
    Alert.alert(
        "Confirmar Troca",
        `Deseja trocar ${data.product.price} créditos por "${data.product.title}"?`,
        [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Confirmar", 
                onPress: async () => {
                    setPurchasing(true);
                    const result = await buyProductWithCredits(data.product.id);
                    setPurchasing(false);

                    if (result.success) {
                        Alert.alert("Parabéns!", "Item adquirido com sucesso! Combine a entrega no chat.");
                        // Recarrega para atualizar o estoque visualmente
                        loadProduct();
                    } else {
                        Alert.alert("Erro", result.error || "Não foi possível realizar a troca.");
                    }
                }
            }
        ]
    );
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
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-white">Produto não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-zinc-800 px-4 py-2 rounded-lg">
            <Text className="text-white">Voltar</Text>
        </TouchableOpacity>
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
            <View className="absolute top-0 left-0 right-0 pt-12 px-4 flex-row justify-between items-center z-10">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
                    <Ionicons name="arrow-back" size={24} color="white" />
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
                className="flex-row items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800 active:bg-zinc-800"
                // Redireciona para a página da loja (ou do perfil do dono se preferir)
                // Use a rota de loja se já tiver implementada: /(app)/shop/[shopId]
                // Se não, use a rota de usuário: /(app)/users/[userId]
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
                <Ionicons name="chevron-forward" size={20} color="#52525b" />
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
                            onPress={() => router.push(`/(app)/product/${item.id}` as any)}
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
            className="w-14 h-14 bg-zinc-800 rounded-2xl items-center justify-center border border-zinc-700 active:bg-zinc-700"
            onPress={() => alert("Chat em desenvolvimento")}
        >
            <MessageCircle size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
            className={`flex-1 h-14 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg active:opacity-90 ${
                isCredits ? 'bg-amber-500 shadow-amber-900/20' : 'bg-emerald-600 shadow-emerald-900/20'
            } ${product.stock <= 0 ? 'bg-zinc-700 opacity-50' : ''}`}
            onPress={handleBuy}
            disabled={purchasing || product.stock <= 0}
        >
            {purchasing ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <ShoppingBag size={20} color="white" />
                    <Text className="text-white font-bold text-lg">
                        {product.stock <= 0 ? 'Esgotado' : (isCredits ? 'Trocar Agora' : 'Adquirir')}
                    </Text>
                </>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}