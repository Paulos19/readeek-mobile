import React from 'react';
import { View, Text } from 'react-native';
import { Users } from 'lucide-react-native';

export default function Community() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center p-6">
      <View className="bg-zinc-900 p-8 rounded-full mb-6 border border-zinc-800">
        <Users size={64} color="#10b981" />
      </View>
      <Text className="text-white text-2xl font-bold mb-2">Comunidade</Text>
      <Text className="text-zinc-500 text-center">
        Em breve você poderá compartilhar suas leituras e interagir com outros leitores.
      </Text>
    </View>
  );
}