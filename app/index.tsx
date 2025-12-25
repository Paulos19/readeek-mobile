import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Animated from 'react-native-reanimated';
import { Mail, Lock } from 'lucide-react-native';

import { useAuthStore } from 'stores/useAuthStore';
import { useKeyboardShift } from '_hooks/useKeyboardShift';
import { Logo } from './_components/auth/Logo';
import { AuthInput } from './_components/auth/AuthInput';
import { AuthButton } from './_components/auth/AuthButton';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Hook mágico para o teclado
  const keyboardAnimatedStyle = useKeyboardShift();

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert("Oops", "Preencha todos os campos.");
        return;
    }
    try {
      await signIn(email, password);
      // Redirecionamento é tratado pelo signIn ou _layout, mas reforçamos aqui
      router.replace('/(app)/dashboard');
    } catch (error: any) {
       console.error(error);
       Alert.alert("Erro no Login", error.message || "Verifique suas credenciais.");
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" />
      
      {/* Usamos Animated.ScrollView para que toda a tela suba suavemente.
          O 'keyboardShouldPersistTaps="handled"' é crucial para conseguir clicar 
          no botão de login mesmo com o teclado aberto.
      */}
      <Animated.ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-8"
        keyboardShouldPersistTaps="handled"
        style={keyboardAnimatedStyle} // Aplica a animação aqui
      >
        <Logo />

        <View>
            <AuthInput
                icon={Mail}
                placeholder="E-mail"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <AuthInput
                icon={Lock}
                placeholder="Senha"
                isPassword
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity className="self-end mb-6">
                <Text className="text-zinc-500 text-sm">Esqueceu a senha?</Text>
            </TouchableOpacity>

            <AuthButton 
                title="Entrar"
                onPress={handleLogin}
                isLoading={isLoading}
            />
        </View>

        <View className="flex-row justify-center mt-8 items-center">
            <Text className="text-zinc-500">Não tem uma conta? </Text>
            {/* Link para a nova rota de registro */}
            <Link href="/sign-up" asChild>
                <TouchableOpacity>
                    <Text className="text-emerald-500 font-bold p-2">Crie agora</Text>
                </TouchableOpacity>
            </Link>
        </View>

      </Animated.ScrollView>
    </View>
  );
}