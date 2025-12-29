import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons'; // Certifique-se de ter @expo/vector-icons
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/useAuthStore'; // Ajuste o caminho conforme sua estrutura
import { Sparkles } from 'lucide-react-native';

export const WriterCallCard = () => {
  const router = useRouter();
  const { user } = useAuthStore();

  const handlePress = () => {
    // Aqui verificaremos se ele já tem drafts ou se quer criar um novo
    // Por enquanto, vamos mandar para a lista de drafts
    router.push('/writer' as any);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} className="mx-6 mt-6 mb-2">
      <LinearGradient
        colors={['#4338ca', '#312e81', '#1e1b4b']} // Indigo to Deep Purple
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        className="p-1 rounded-[32px] shadow-2xl shadow-indigo-500/30"
      >
        <View className="bg-black/20 p-6 rounded-[28px] relative overflow-hidden">
            {/* Background Decor */}
            <View className="absolute -right-10 -top-10">
                <Feather name="feather" size={120} color="rgba(255,255,255,0.05)" />
            </View>

            <View className="flex-row justify-between items-start">
                <View className="bg-indigo-500/20 self-start px-3 py-1 rounded-full border border-indigo-400/30 mb-3 flex-row items-center">
                    <Sparkles size={12} color="#818cf8" style={{ marginRight: 6 }} />
                    <Text className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Readeek Studio</Text>
                </View>
            </View>

            <Text className="text-white font-black text-2xl tracking-tight leading-8 mb-2">
                Tem uma história{"\n"}para contar?
            </Text>
            <Text className="text-indigo-200 text-xs font-medium leading-5 w-3/4">
                Crie seu universo, desenvolva personagens e publique para o mundo.
            </Text>

            <View className="mt-5 flex-row items-center">
                <Text className="text-white font-bold text-xs mr-2">Começar a escrever</Text>
                <View className="bg-white/20 p-1 rounded-full">
                    <Feather name="arrow-right" size={14} color="white" />
                </View>
            </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};