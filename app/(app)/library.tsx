import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen } from 'lucide-react-native';

export default function Library() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center p-4">
      <View className="bg-zinc-900 p-6 rounded-full mb-4 border border-zinc-800">
        <BookOpen size={48} color="#10b981" />
      </View>
      <Text className="text-white text-xl font-bold mb-2">Sua Biblioteca</Text>
      <Text className="text-zinc-500 text-center">
        Seus livros baixados aparecerão aqui.
      </Text>
    </SafeAreaView>
  );
}