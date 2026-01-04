import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  FadeInDown,
  Easing 
} from 'react-native-reanimated';
import { Feather } from 'lucide-react-native';

export function Logo() {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Mantemos a pulsação sutil para dar vida
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="items-center justify-center mb-10">
      <Animated.View 
        entering={FadeInDown.duration(800).springify()}
        style={[animatedIconStyle]}
        className="items-center justify-center mb-4 relative w-32 h-32"
      >
        {/* CAMADA 1: A Pena (Branca e Suave) */}
        <View className="absolute rotate-[-12deg] top-0 -right-2 opacity-60 z-0">
             <Feather size={85} color="#ffffff" strokeWidth={1.5} />
        </View>

        {/* CAMADA 2: O 'R' com efeito de Borda e Brilho */}
        <View className="relative z-10">
            {/* Simulação de Borda (Outline) Verde usando deslocamento */}
            <Text className="absolute text-7xl font-black text-emerald-500 tracking-tighter" style={{ transform: [{translateX: -1}, {translateY: -1}] }}>R</Text>
            <Text className="absolute text-7xl font-black text-emerald-500 tracking-tighter" style={{ transform: [{translateX: 1}, {translateY: -1}] }}>R</Text>
            <Text className="absolute text-7xl font-black text-emerald-500 tracking-tighter" style={{ transform: [{translateX: -1}, {translateY: 1}] }}>R</Text>
            <Text className="absolute text-7xl font-black text-emerald-500 tracking-tighter" style={{ transform: [{translateX: 1}, {translateY: 1}] }}>R</Text>

            {/* R Principal: Branco Cintilante */}
            <Text 
              className="text-7xl font-black text-white tracking-tighter"
              style={{ 
                // Glow branco para o efeito "Cintilante"
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15
              }}
            >
              R
            </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(800)}>
        <Text className="text-4xl font-bold text-white tracking-tighter text-center">
          Readeek<Text className="text-emerald-500">.</Text>
        </Text>
        <Text className="text-zinc-400 text-center mt-2 text-base font-medium">
          Sua comunidade literária
        </Text>
      </Animated.View>
    </View>
  );
}