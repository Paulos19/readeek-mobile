import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, BookOpen, Star } from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Book } from '../_types/book';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 40; // Margem lateral de 20px
const ITEM_HEIGHT = 420; // Banner vertical imponente

interface Props {
  books: Book[];
  onPress: (book: Book) => void;
}

export const HeroBanner = ({ books, onPress }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-Play
  useEffect(() => {
    if (books.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % books.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 8000); // Tempo um pouco maior para apreciar a capa
    return () => clearInterval(interval);
  }, [activeIndex, books]);

  const renderItem = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => onPress(item)}
      className="mr-4 rounded-[32px] overflow-hidden relative bg-zinc-900 shadow-2xl shadow-black border border-zinc-800"
      style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT }}
    >
        {/* Fundo da Capa (Full Bleed) */}
        {item.coverUrl ? (
            <ImageBackground
                source={{ uri: item.coverUrl }}
                className="w-full h-full justify-end"
                resizeMode="cover"
            >
                {/* Gradiente de Legibilidade (Pesado embaixo, leve em cima) */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)', '#000000']}
                    locations={[0, 0.4, 1]}
                    className="absolute inset-0"
                />
            </ImageBackground>
        ) : (
            <View className="w-full h-full bg-zinc-800 items-center justify-center">
                <BookOpen size={64} color="#3f3f46" />
                <LinearGradient
                    colors={['transparent', '#000000']}
                    className="absolute inset-0"
                />
            </View>
        )}

        {/* Conteúdo Sobreposto */}
        <View className="p-6 pb-8 absolute bottom-0 w-full">
            
            {/* Badge de Destaque */}
            <Animated.View entering={FadeInDown.delay(100)} className="flex-row items-center gap-2 mb-3">
                <View className="bg-emerald-500/90 px-3 py-1 rounded-full flex-row items-center shadow-lg shadow-emerald-500/20">
                    <Sparkles size={10} color="white" style={{ marginRight: 4 }} />
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">Em Destaque</Text>
                </View>
                {/* Gênero (Opcional, se tiver no objeto book) */}
                <View className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                    <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Fantasia</Text>
                </View>
            </Animated.View>

            {/* Título e Autor */}
            <Animated.View entering={FadeInDown.delay(200)}>
                <Text 
                    className="text-white font-black text-4xl leading-10 mb-2 shadow-black shadow-lg" 
                    numberOfLines={2}
                    style={{ textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}
                >
                    {item.title}
                </Text>
                <Text className="text-zinc-300 font-medium text-base mb-6 opacity-90">
                    Por <Text className="text-white font-bold">{item.author || "Autor Desconhecido"}</Text>
                </Text>
            </Animated.View>

            {/* Botão de Ação */}
            <Animated.View entering={FadeInDown.delay(300)} className="flex-row items-center gap-4">
                <View className="flex-1 bg-white h-12 rounded-2xl flex-row items-center justify-center shadow-xl shadow-black/50">
                    <Text className="text-black font-black text-sm uppercase tracking-wide">Ler Agora</Text>
                </View>
                
                {/* Botão Favoritar/Info (Opcional) */}
                <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/10 backdrop-blur-md">
                    <Star size={20} color="white" />
                </View>
            </Animated.View>

        </View>
    </TouchableOpacity>
  );

  if (!books || books.length === 0) return null;

  return (
    <View className="mb-10 mt-2">
      <FlatList
        ref={flatListRef}
        data={books}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={ITEM_WIDTH + 16} // Largura + Margin
        decelerationRate="fast"
        onMomentumScrollEnd={(ev) => {
          const index = Math.round(ev.nativeEvent.contentOffset.x / (ITEM_WIDTH + 16));
          setActiveIndex(index);
        }}
      />
      
      {/* Indicadores de Paginação (Dots) */}
      <View className="flex-row justify-center gap-2 mt-5">
        {books.map((_, i) => (
          <View 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-8 bg-white' : 'w-1.5 bg-zinc-700'
            }`} 
          />
        ))}
      </View>
    </View>
  );
};