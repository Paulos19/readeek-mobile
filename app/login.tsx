import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Animated from 'react-native-reanimated';
import { Mail, Lock } from 'lucide-react-native';

import { useAuthStore } from 'stores/useAuthStore';
import { AuthInput } from './_components/auth/AuthInput';
import { AuthButton } from './_components/auth/AuthButton';
import { Logo } from './_components/auth/Logo';
import { useKeyboardShift } from '_hooks/useKeyboardShift';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const keyboardStyle = useKeyboardShift();

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert("Campos vazios", "Por favor, preencha e-mail e senha.");
        return;
    }

    try {
      await signIn(email, password);
      router.replace('/(app)/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Erro no Login", "Verifique suas credenciais e tente novamente.");
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
      <Animated.ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
        keyboardShouldPersistTaps="handled"
        style={[keyboardStyle]}
      >
        <Logo />

        <View className="w-full">
            <AuthInput
                icon={Mail}
                placeholder="E-mail"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCorrect={false}
            />
            
            <AuthInput
                icon={Lock}
                placeholder="Senha"
                isPassword
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity className="self-end mb-8" activeOpacity={0.7}>
                <Text className="text-zinc-500 text-sm">Esqueceu a senha?</Text>
            </TouchableOpacity>

            <AuthButton 
                title="ENTRAR"
                onPress={handleLogin}
                isLoading={isLoading}
            />
        </View>

        <View className="flex-row justify-center mt-12 items-center">
            <Text className="text-zinc-500">Ainda não tem conta? </Text>
            <Link href="/register" asChild>
                <TouchableOpacity>
                    <Text className="text-emerald-500 font-bold p-2">Criar agora</Text>
                </TouchableOpacity>
            </Link>
        </View>

      </Animated.ScrollView>
    </View>
  );
}