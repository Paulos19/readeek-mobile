import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate 
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';

interface TabIconProps {
  isFocused: boolean;
  Icon: LucideIcon;
  color: string;
}

export const TabIcon = ({ isFocused, Icon, color }: TabIconProps) => {
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withSpring(isFocused ? 1 : 0, {
      mass: 1,
      damping: 20,
      stiffness: 120,
    });
  }, [isFocused]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(focusAnim.value, [0, 1], [0, -4]) },
      { scale: interpolate(focusAnim.value, [0, 1], [1, 1.15]) }
    ],
  }));

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focusAnim.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(focusAnim.value, [0, 1], [0.5, 1]) }]
  }));

  return (
    <View className="items-center justify-center h-full w-16">
      <Animated.View 
        style={bgAnimatedStyle}
        className="absolute w-12 h-12 rounded-2xl bg-emerald-500/20" 
      />

      <Animated.View style={iconAnimatedStyle}>
        <Icon 
          size={26} 
          color={isFocused ? color : '#a1a1aa'} 
          strokeWidth={isFocused ? 2.5 : 2}
        />
      </Animated.View>
    </View>
  );
};