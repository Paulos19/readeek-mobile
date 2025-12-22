import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Star } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Book } from '../_types/book';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 48; // Full width minus padding

interface Props {
  books: Book[];
  onPress: (book: Book) => void;
}

export const HeroBanner = ({ books, onPress }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Efeito de Auto-Play Suave
  useEffect(() => {
    if (books.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % books.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeIndex, books]);

  const renderItem = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => onPress(item)}
      className="mr-4 rounded-[32px] overflow-hidden relative shadow-lg shadow-black/50 border border-white/5 bg-zinc-900"
      style={{ width: ITEM_WIDTH, height: 200 }}
    >
      {/* Imagem de Fundo Desfocada */}
      {item.coverUrl && (
        <Image 
          source={{ uri: item.coverUrl }} 
          className="absolute inset-0 w-full h-full opacity-40 blur-sm" 
          resizeMode="cover"
        />
      )}
      
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', '#022c22']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="flex-1 flex-row p-6 items-center">
        <View className="flex-1 pr-4 justify-center">
          <View className="bg-emerald-500/20 self-start px-2.5 py-1 rounded-full mb-3 border border-emerald-500/30 flex-row items-center gap-1.5">
            <Sparkles size={10} color="#6ee7b7" />
            <Text className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Destaque</Text>
          </View>
          
          <Text className="text-white font-black text-2xl leading-7 mb-1 drop-shadow-md" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-zinc-300 font-medium text-sm mb-4" numberOfLines={1}>
            {item.author || "Autor Desconhecido"}
          </Text>

          <View className="bg-white/10 self-start px-4 py-2 rounded-xl border border-white/10">
            <Text className="text-white font-bold text-xs">Ler Agora</Text>
          </View>
        </View>

        <Animated.View entering={FadeInUp.delay(200)} className="shadow-2xl shadow-black/80">
          {item.coverUrl ? (
            <Image 
              source={{ uri: item.coverUrl }} 
              className="w-24 h-36 rounded-lg border border-white/20" 
              resizeMode="cover"
            />
          ) : (
            <View className="w-24 h-36 bg-zinc-800 rounded-lg items-center justify-center border border-white/10">
               <Star color="#52525b" />
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );

  if (books.length === 0) return null;

  return (
    <View className="mb-8">
      <FlatList
        ref={flatListRef}
        data={books}
        renderItem={renderItem}
        horizontal
        pagingEnabled // Snap perfeito
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        onMomentumScrollEnd={(ev) => {
          const index = Math.round(ev.nativeEvent.contentOffset.x / ITEM_WIDTH);
          setActiveIndex(index);
        }}
      />
      
      {/* Paginação (Dots) */}
      <View className="flex-row justify-center gap-1.5 mt-4">
        {books.map((_, i) => (
          <View 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-zinc-800'
            }`} 
          />
        ))}
      </View>
    </View>
  );
};