import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from 'stores/useAuthStore'; // Ajuste o import conforme sua estrutura
import { LogOut, User as UserIcon } from 'lucide-react-native';

export default function Profile() {
  const { user, signOut } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-zinc-950 p-6">
      <Text className="text-white text-2xl font-bold mb-8">Meu Perfil</Text>

      <View className="flex-row items-center mb-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <View className="w-16 h-16 bg-zinc-800 rounded-full items-center justify-center mr-4 border border-zinc-700 overflow-hidden">
           {user?.image ? (
             <Image source={{ uri: user.image }} className="w-full h-full" />
           ) : (
             <UserIcon size={32} color="#52525b" />
           )}
        </View>
        <View>
          <Text className="text-white text-lg font-bold">{user?.name || 'Leitor'}</Text>
          <Text className="text-zinc-500 text-sm">{user?.email}</Text>
        </View>
      </View>

      <TouchableOpacity 
        onPress={signOut}
        className="flex-row items-center bg-red-500/10 p-4 rounded-xl border border-red-500/20 active:opacity-70"
      >
        <LogOut size={20} color="#ef4444" />
        <Text className="text-red-500 font-bold ml-3">Sair da Conta</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}