import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

export const WriterCallCard = () => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => router.push('/writer' as any)} 
      className="mx-6 mt-6 mb-2 shadow-xl shadow-indigo-500/20"
    >
      <LinearGradient
        colors={['#312e81', '#1e1b4b']} // Indigo escuro elegante
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        className="rounded-[24px] p-[1px] overflow-hidden border border-indigo-500/30"
      >
        <View className="bg-black/40 p-5 rounded-[23px] relative">
            {/* Background Decor */}
            <View className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            <View className="absolute -left-4 -bottom-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />

            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-2">
                        <Sparkles size={14} color="#818cf8" style={{ marginRight: 6 }} />
                        <Text className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Estúdio Criativo</Text>
                    </View>
                    <Text className="text-white font-bold text-lg leading-6 mb-1">
                        Escreva a sua história
                    </Text>
                    <Text className="text-zinc-400 text-xs font-medium leading-4">
                        Crie livros, publique e ganhe créditos.
                    </Text>
                </View>

                <View className="w-10 h-10 bg-indigo-500 rounded-full items-center justify-center shadow-lg shadow-indigo-500/40 border border-indigo-400/50">
                    <Feather name="edit-3" size={18} color="white" />
                </View>
            </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};