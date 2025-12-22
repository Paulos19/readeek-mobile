import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native'; // Opcional: ícone para enriquecer o header

// URL BASE DA SUA API
const API_URL = 'https://readeek.vercel.app'; 

interface Props {
  name: string | null;
  image?: string | null;
}

export const GreetingHeader = ({ name, image }: Props) => {
  const router = useRouter();

  // 1. Lógica de Saudação Dinâmica
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const displayName = name ? name.split(' ')[0] : 'Leitor';
  const initial = displayName[0]?.toUpperCase() || 'L';

  // 2. Tratamento da Imagem
  const getAvatarSource = (imgUrl?: string | null) => {
    if (!imgUrl) return null;
    
    // URL externa completa
    if (imgUrl.startsWith('http')) return { uri: imgUrl };
    
    // URL relativa (Assets locais ou API)
    return { uri: `${API_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}` };
  };

  const imageSource = getAvatarSource(image);

  // 3. Ação de Navegação
  const handleProfilePress = () => {
    // router.navigate muda para a Tab existente em vez de empilhar uma nova tela
    router.navigate('profile'); 
  };

  return (
    <View className="px-6 pt-2 mb-6">
      <LinearGradient
        colors={['#065f46', '#022c22']} // Emerald 800 -> 950
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
        className="w-full p-6 rounded-[32px] border border-emerald-500/20 relative overflow-hidden shadow-2xl shadow-emerald-900/40"
      >
        {/* Efeitos de Fundo (Decorativos) */}
        <View className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
        <View className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-400/5 rounded-full blur-2xl" />

        <View className="flex-row justify-between items-center z-10">
          <View>
            <Text className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">
              {greetingText},
            </Text>
            <Text className="text-white font-black text-3xl leading-9 drop-shadow-sm">
              {displayName}
            </Text>
          </View>

          {/* Área Interativa do Avatar */}
          <TouchableOpacity 
            onPress={handleProfilePress}
            activeOpacity={0.8}
            className="w-14 h-14 rounded-full border-2 border-emerald-500/30 p-0.5 bg-black/20 shadow-lg"
          >
            <View className="w-full h-full rounded-full overflow-hidden bg-zinc-800 items-center justify-center">
              {imageSource ? (
                <Image 
                  source={imageSource} 
                  className="w-full h-full" 
                  resizeMode="cover"
                  onError={(e) => console.log("Erro imagem:", e.nativeEvent.error)}
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-emerald-600">
                  <Text className="text-white font-bold text-xl">{initial}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};