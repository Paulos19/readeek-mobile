import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Book } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useReadingStore } from 'stores/useReadingStore';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onPress: () => void;
}

export const CenterBookButton = ({ onPress }: Props) => {
  const { lastRead } = useReadingStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [lastRead?.id, lastRead?.cover]);

  const scale = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1) }],
  }));

  const coverUri = lastRead?.cover ?? undefined;
  const hasValidCover = !!coverUri && !imageError;
  const progress = lastRead?.progress || 0;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
      // Removemos o posicionamento absoluto daqui pois o pai (CustomTabBar) 
      // agora controla a posição exata para alinhar com a cavidade
    >
      <Animated.View 
        style={[scale, {
          shadowColor: "#000", 
          shadowOffset: { width: 0, height: 8 }, 
          shadowOpacity: 0.5, 
          shadowRadius: 12,
          elevation: 10,
        }]}
      >
        <View className="w-[52px] h-[78px] rounded-md overflow-hidden bg-zinc-800 border border-zinc-700/50 relative">
          
          {hasValidCover ? (
            <>
              <Image 
                source={{ uri: coverUri }} 
                className="w-full h-full"
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)']}
                className="absolute inset-0"
              />
            </>
          ) : (
            <View className="w-full h-full bg-zinc-800 flex-row">
              <View className="w-1.5 h-full bg-zinc-700" />
              <View className="flex-1 items-center justify-center bg-zinc-800">
                 <Book size={24} color={lastRead ? "#10b981" : "#52525b"} />
              </View>
               <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                className="absolute inset-0"
              />
            </View>
          )}

          {progress > 0 && (
             <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-900/50">
                <View 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${progress}%` }} 
                />
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};