import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Animated from 'react-native-reanimated';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';

// IMPORTANTE: Você precisará implementar a função 'register' na sua API e Store.
// import { useAuthStore } from 'stores/useAuthStore'; 
import { useKeyboardShift } from '_hooks/useKeyboardShift';
import { AuthInput } from './_components/auth/AuthInput';
import { AuthButton } from './_components/auth/AuthButton';

export default function SignUpScreen() {
  const router = useRouter();
  // const { register, isLoading } = useAuthStore(); // Descomente quando implementar na store
  const [isLoading, setIsLoading] = useState(false); // Estado local temporário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const keyboardAnimatedStyle = useKeyboardShift();

  const handleRegister = async () => {
    if (!name || !email || !password) {
        Alert.alert("Atenção", "Preencha todos os campos para continuar.");
        return;
    }

    setIsLoading(true);
    try {
      // TODO: Chamar sua API de registro aqui.
      // Ex: await register(name, email, password);
      
      // Simulação de delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert("Sucesso!", "Conta criada. Faça login para continuar.", [
          { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
       Alert.alert("Erro", "Não foi possível criar a conta.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" />

      {/* Botão Voltar */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-12 left-8 z-10 p-2 bg-zinc-900 rounded-full"
      >
        <ArrowLeft size={24} color="white" />
      </TouchableOpacity>
      
      <Animated.ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-8"
        keyboardShouldPersistTaps="handled"
        style={keyboardAnimatedStyle}
      >
        <View className="mb-10 mt-20">
            <Text className="text-white font-black text-4xl">Crie sua conta</Text>
            <Text className="text-zinc-500 text-lg mt-2">Entre para a comunidade Readeek.</Text>
        </View>

        <View>
             <AuthInput
                icon={User}
                placeholder="Nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
            />
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

            <View className="mt-6">
                <AuthButton 
                    title="Cadastrar"
                    onPress={handleRegister}
                    isLoading={isLoading}
                />
            </View>
        </View>

        <View className="flex-row justify-center mt-8 items-center">
            <Text className="text-zinc-500">Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-emerald-500 font-bold p-2">Entrar</Text>
            </TouchableOpacity>
        </View>

      </Animated.ScrollView>
    </View>
  );
}