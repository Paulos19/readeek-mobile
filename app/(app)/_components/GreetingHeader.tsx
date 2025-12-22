import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  name: string | null;
  image?: string | null;
}

export const GreetingHeader = ({ name, image }: Props) => {
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const displayName = name ? name.split(' ')[0] : 'Leitor';
  const initial = displayName[0]?.toUpperCase() || 'L';

  return (
    <View className="px-6 pt-2 mb-6">
      <LinearGradient
        colors={['#065f46', '#022c22']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        className="w-full p-6 rounded-[32px] border border-emerald-500/20 relative overflow-hidden shadow-2xl shadow-emerald-900/40"
      >
        {/* Efeitos de Luz (Glow) */}
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
        <View className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />

        <View className="flex-row justify-between items-center z-10">
          <View>
            <Text className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">
              {greetingText},
            </Text>
            <Text className="text-white font-black text-3xl leading-9 drop-shadow-sm">
              {displayName}
            </Text>
          </View>

          <View className="w-14 h-14 rounded-full border-2 border-emerald-500/30 p-0.5 bg-black/20 shadow-lg">
            <View className="w-full h-full rounded-full overflow-hidden bg-zinc-800 items-center justify-center">
              {image ? (
                <Image 
                  source={{ uri: image }} 
                  className="w-full h-full" 
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-emerald-600">
                  <Text className="text-white font-bold text-xl">{initial}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};