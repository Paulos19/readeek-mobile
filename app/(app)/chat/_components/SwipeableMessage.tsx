import React from 'react';
import { View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Reply } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onReply: () => void;
  isMe: boolean;
}

const THRESHOLD = 60;

export function SwipeableMessage({ children, onReply, isMe }: SwipeableMessageProps) {
  const translateX = useSharedValue(0);
  const hasTriggered = useSharedValue(false);

  const triggerReply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReply();
  };

  // Nova Sintaxe do Gesture Handler v2
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Só ativa se mover horizontalmente
    .onUpdate((event) => {
      // Limita o movimento: só permite arrastar para a direita (0 a 100)
      // Se quiser permitir swipe em mensagens enviadas por mim, ajuste aqui
      const x = event.translationX;
      
      // Bloqueia swipe para esquerda
      if (x < 0) {
        translateX.value = 0;
        return;
      }

      translateX.value = Math.min(x, 100);

      if (translateX.value > THRESHOLD && !hasTriggered.value) {
        hasTriggered.value = true;
        runOnJS(triggerReply)();
      }
      
      if (translateX.value <= THRESHOLD && hasTriggered.value) {
        hasTriggered.value = false;
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      hasTriggered.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(translateX.value, [0, THRESHOLD], [0.5, 1.2], Extrapolate.CLAMP);
    const opacity = interpolate(translateX.value, [0, 20], [0, 1], Extrapolate.CLAMP);
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View className="justify-center relative w-full">
      {/* Ícone de Resposta (Fundo) */}
      <Animated.View style={[{ position: 'absolute', left: 20, zIndex: -1 }, iconStyle]}>
        <View className="bg-zinc-800 w-8 h-8 rounded-full items-center justify-center border border-zinc-700">
            <Reply size={16} color="white" />
        </View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}