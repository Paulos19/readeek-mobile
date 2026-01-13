import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  withDelay,
  FadeInDown,
  ZoomIn,
  Easing 
} from 'react-native-reanimated';

// Componente isolado para letra animada (Performance + Organização)
const AnimatedLetter = ({ char, index }: { char: string; index: number }) => {
  return (
    <Animated.Text
      entering={FadeInDown.delay(index * 60).springify().damping(12)}
      className="text-6xl font-black text-white tracking-tighter"
      style={{
        // Sombra suave apenas para separar do fundo preto, sem poluir
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
      }}
    >
      {char}
    </Animated.Text>
  );
};

export function Logo() {
  const dotScale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    // Animação de "Respiração" do Ponto (Idle State)
    // Começa após a entrada inicial (delay de 1.5s)
    dotOpacity.value = withDelay(
        1500,
        withRepeat(
            withSequence(
                withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        )
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }]
  }));

  const brandName = "Readeek".split("");

  return (
    <View className="items-center justify-center mb-16 mt-10">
      
      {/* Container da Marca */}
      <View className="flex-row items-baseline justify-center">
        
        {/* Renderização das Letras em Sequência */}
        {brandName.map((char, index) => (
          <AnimatedLetter key={`${char}-${index}`} char={char} index={index} />
        ))}

        {/* O Ponto (The Dot) - Minimalista e Vivo */}
        <Animated.View 
          entering={ZoomIn.delay(brandName.length * 60 + 200).springify()}
          style={[dotStyle]}
          className="ml-1 h-3 w-3 rounded-full bg-emerald-500"
        />
      </View>

      {/* Subtítulo Clean - Espaçamento Generoso (Tracking Widest) */}
      <Animated.Text 
        entering={FadeInDown.delay(1000).duration(800)}
        className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-3"
      >
        Social Reader
      </Animated.Text>

    </View>
  );
}