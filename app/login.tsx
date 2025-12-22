// app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from 'stores/useAuthStore';

// Ícones (se tiver lucide-react-native instalado, se não use texto por enquanto)
// import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert("Erro", "Preencha todos os campos");
        return;
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert("Falha no login", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950 justify-center px-6">
      <StatusBar style="light" />
      
      <View className="items-center mb-12">
        {/* Logo Placeholder */}
        <View className="w-20 h-20 bg-emerald-500 rounded-2xl items-center justify-center mb-4">
            <Text className="text-3xl font-bold text-white">R</Text>
        </View>
        <Text className="text-3xl font-bold text-white">Readeek</Text>
        <Text className="text-zinc-400 mt-2 text-base">Sua leitura social, agora no bolso.</Text>
      </View>

      <View className="space-y-4">
        <View>
            <Text className="text-zinc-300 mb-2 font-medium">E-mail</Text>
            <TextInput
            placeholder="seu@email.com"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:border-emerald-500"
            />
        </View>

        <View>
            <Text className="text-zinc-300 mb-2 font-medium">Senha</Text>
            <TextInput
            placeholder="Sua senha secreta"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:border-emerald-500"
            />
        </View>

        <TouchableOpacity 
            onPress={handleLogin}
            disabled={isLoading}
            className={`w-full h-14 bg-emerald-600 rounded-xl items-center justify-center mt-6 shadow-lg shadow-emerald-900/20 ${isLoading ? 'opacity-70' : ''}`}
        >
            {isLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text className="text-white font-bold text-lg">Entrar</Text>
            )}
        </TouchableOpacity>
      </View>

      <View className="mt-8 flex-row justify-center">
        <Text className="text-zinc-400">Não tem uma conta? </Text>
        <TouchableOpacity>
            <Text className="text-emerald-400 font-bold">Cadastre-se na Web</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}