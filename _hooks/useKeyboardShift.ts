import { Platform } from 'react-native';
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

/**
 * Hook Sênior para mover a tela suavemente com o teclado.
 * Usa a API nativa do Reanimated para performance máxima (UI Thread).
 */
export const useKeyboardShift = () => {
  const keyboard = useAnimatedKeyboard();

  const animatedContainerStyle = useAnimatedStyle(() => {
    // No Android, o comportamento de "adjustResize" no manifest já cuida de muito disso,
    // mas para garantir consistência e o efeito "smooth", aplicamos uma translação.
    // O valor 0.8 é um fator de amortecimento para não subir *tanto* quanto o teclado,
    // mantendo o topo da tela visível se possível. Ajuste conforme gosto.
    const shiftFactor = Platform.OS === 'ios' ? 1 : 0.8;
    
    return {
      // Movemos a view para cima (Y negativo) baseado na altura do teclado
      transform: [{ translateY: -keyboard.height.value * shiftFactor }],
    };
  });

  return animatedContainerStyle;
};