import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, FlatList, ViewToken } from 'react-native';
import { useRouter } from 'expo-router';
// 1. CORREÇÃO DA IMPORTAÇÃO DO REANIMATED
// Importamos 'SharedValue' diretamente como tipo, não de dentro de 'Animated'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing, 
  interpolateColor,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown,
  SharedValue // <--- Importado diretamente aqui
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { ArrowRight, Check } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CONFIGURAÇÃO DOS SLIDES (ASSETS LOCAIS) ---
const SLIDES = [
  {
    id: '1',
    title: 'Leitura Sem Limites',
    description: 'Sua biblioteca definitiva. Importe EPUBs, personalize sua experiência e sincronize seu progresso em qualquer lugar.',
    // 2. USO DE REQUIRE PARA ARQUIVOS LOCAIS
    lottie: require('../assets/lottie/reading.json'), 
    color: '#10b981', // Emerald
  },
  {
    id: '2',
    title: 'Conecte-se com Histórias',
    description: 'A leitura deixa de ser solitária. Participe de comunidades, compartilhe destaques e debata teorias com outros leitores.',
    lottie: require('../assets/lottie/community.json'),
    color: '#818cf8', // Indigo
  },
  {
    id: '3',
    title: 'Crie e Conquiste',
    description: 'Use o Writer Studio com IA para escrever suas obras. Publique, venda no marketplace e ganhe insignias exclusivas.',
    lottie: require('../assets/lottie/writer.json'),
    color: '#fbbf24', // Amber
  },
];

// --- COMPONENTE DE FUNDO ANIMADO (Aurora Effect) ---
// 3. TIPAGEM CORRETA DO SHAREDVALUE
const AnimatedBackground = ({ scrollX }: { scrollX: SharedValue<number> }) => {
  const { width } = useWindowDimensions();
  
  // Orbs flutuantes
  const orb1Scale = useSharedValue(1);
  const orb2TranslateY = useSharedValue(0);

  // Animação contínua dos orbs (Respiração)
  React.useEffect(() => {
    orb1Scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2TranslateY.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => {
    // Interpola a cor de fundo baseada no slide atual
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, width, width * 2],
      ['#09090b', '#1e1b4b', '#2a1205'] // Zinc -> Indigo Dark -> Amber Dark/Brown
    );
    return { backgroundColor };
  });

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ scale: orb1Scale.value }],
    opacity: 0.3,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2TranslateY.value }],
    opacity: 0.2,
  }));

  return (
    <Animated.View style={[bgStyle]} className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Orb 1 - Dinâmico */}
      <Animated.View 
        style={[orb1Style]}
        className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-emerald-500/20 blur-[100px]" 
      />
      
      {/* Orb 2 - Dinâmico */}
      <Animated.View 
        style={[orb2Style]}
        className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[120px]" 
      />

      {/* Orb 3 - Base Estática para profundidade */}
      <View className="absolute bottom-0 w-full h-[300px] bg-gradient-to-t from-black to-transparent" />
    </Animated.View>
  );
};

// --- COMPONENTE DO SLIDE INDIVIDUAL ---
const OnboardingItem = ({ item, index, scrollX }: { item: typeof SLIDES[0], index: number, scrollX: SharedValue<number> }) => {
  const { width } = useWindowDimensions();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    // Efeito de Parallax no conteúdo
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [width * 0.5, 0, -width * 0.5],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolation.CLAMP
    )

    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  });

  return (
    <View style={{ width }} className="items-center justify-center px-8">
      <Animated.View style={animatedStyle} className="items-center w-full">
        
        {/* Lottie Container com Glow */}
        <View className="relative w-full aspect-square max-w-[320px] items-center justify-center mb-10">
            {/* Glow atrás do Lottie */}
            <View className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-75" />
            
            <LottieView
                source={item.lottie} // Passamos o require() diretamente aqui
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
            />
        </View>

        {/* Textos com Tipografia Moderna */}
        <Text className="text-white text-4xl font-black text-center leading-[1.1] tracking-tight mb-4 shadow-lg shadow-black/50">
          {item.title}
        </Text>
        <Text className="text-zinc-400 text-lg text-center font-medium leading-relaxed px-2">
          {item.description}
        </Text>

      </Animated.View>
    </View>
  );
};

// --- PAGINAÇÃO (DOTS) ---
const Paginator = ({ data, scrollX }: { data: typeof SLIDES, scrollX: SharedValue<number> }) => {
  const { width } = useWindowDimensions();

  return (
    <View className="flex-row h-16 justify-center items-center gap-3">
      {data.map((_, i) => {
        const animatedDotStyle = useAnimatedStyle(() => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const widthDot = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            Extrapolation.CLAMP
          );

          const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.3, 1, 0.3],
            Extrapolation.CLAMP
          );

          const backgroundColor = interpolateColor(
             scrollX.value,
             inputRange,
             ['#52525b', '#10b981', '#52525b'] // Zinc -> Emerald -> Zinc
          );

          return { width: widthDot, opacity, backgroundColor };
        });

        return (
          <Animated.View
            key={i.toString()}
            style={[animatedDotStyle]}
            className="h-2 rounded-full"
          />
        );
      })}
    </View>
  );
};

// --- TELA PRINCIPAL ---
export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  // Manipulador de Scroll Animado
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Atualizar índice atual
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0] && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
      // Feedback suave apenas se realmente mudou
      Haptics.selectionAsync(); 
    }
  }, []);

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Finalizar Onboarding
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        await AsyncStorage.setItem('@onboarding_completed', 'true');
        // Redireciona para login
        router.replace('/login'); 
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSkip = () => {
     router.replace('/login');
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      
      {/* Fundo Animado Independente */}
      <AnimatedBackground scrollX={scrollX} />

      {/* Carrossel de Slides */}
      <View className="flex-1 pt-20">
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={({ item, index }) => <OnboardingItem item={item} index={index} scrollX={scrollX} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
        />
      </View>

      {/* Footer Controls */}
      <View className="px-8 pb-12 pt-4 justify-between h-[150px]">
        
        {/* Dots */}
        <Paginator data={SLIDES} scrollX={scrollX} />

        {/* Botões de Ação */}
        <View className="w-full">
            {currentIndex === SLIDES.length - 1 ? (
                // Botão "Começar" (Último Slide)
                <Animated.View entering={FadeInDown.springify()} className="w-full">
                    <TouchableOpacity
                        onPress={handleNext}
                        className="w-full bg-emerald-500 h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-900/40"
                        activeOpacity={0.8}
                    >
                        <Text className="text-zinc-950 font-black text-xl mr-2 tracking-wide">COMEÇAR</Text>
                        <Check size={24} color="#09090b" strokeWidth={3.5} />
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                // Botões de Navegação (Next / Skip)
                <View className="flex-row justify-between items-center px-2">
                    <TouchableOpacity onPress={handleSkip} className="py-4">
                        <Text className="text-zinc-500 font-bold text-base tracking-wide">Pular</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={handleNext}
                        className="w-16 h-16 bg-zinc-100 rounded-full items-center justify-center shadow-lg"
                        activeOpacity={0.8}
                    >
                         <ArrowRight size={28} color="#000" strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
      </View>
    </View>
  );
}