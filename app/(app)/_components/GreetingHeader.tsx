import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// URL BASE DA SUA API (Mesma do lib/api.ts)
const API_URL = 'https://readeek.vercel.app'; 

interface Props {
  name: string | null;
  image?: string | null;
}

export const GreetingHeader = ({ name, image }: Props) => {
  // ... lógica de saudação (mantida) ...
  const greetingText = useMemo(() => { /* ... */ return 'Olá'; }, []);
  const displayName = name ? name.split(' ')[0] : 'Leitor';
  const initial = displayName[0]?.toUpperCase() || 'L';

  // --- CORREÇÃO DA IMAGEM ---
  const getAvatarSource = (imgUrl?: string | null) => {
    if (!imgUrl) return null;
    
    // Se for URL completa (Google/Github), usa direto
    if (imgUrl.startsWith('http')) return { uri: imgUrl };
    
    // Se for relativa (/avatars/...), concatena com a API
    // Obs: Se for SVG, o Image do RN pode não renderizar. 
    // Idealmente use PNGs ou uma lib como react-native-svg com SvgUri.
    // Mas para corrigir o caminho relativo:
    return { uri: `${API_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}` };
  };

  const imageSource = getAvatarSource(image);

  return (
    <View className="px-6 pt-2 mb-6">
      <LinearGradient
        colors={['#065f46', '#022c22']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        className="w-full p-6 rounded-[32px] border border-emerald-500/20 relative overflow-hidden shadow-2xl shadow-emerald-900/40"
      >
        {/* ... Background effects ... */}

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
              {imageSource ? (
                <Image 
                  source={imageSource} 
                  className="w-full h-full" 
                  resizeMode="cover"
                  // Adicionando um fallback caso a imagem falhe (ex: SVG não suportado)
                  onError={(e) => console.log("Erro imagem:", e.nativeEvent.error)}
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