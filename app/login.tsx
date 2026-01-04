import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Mail, Lock, AlertCircle } from 'lucide-react-native';

import { useAuthStore } from '../stores/useAuthStore';
import { AuthInput } from './_components/auth/AuthInput';
import { AuthButton } from './_components/auth/AuthButton';
import { Logo } from './_components/auth/Logo';
import { useKeyboardShift } from '../_hooks/useKeyboardShift'; // Ajuste o caminho conforme necessário

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });

  const keyboardStyle = useKeyboardShift();

  const validate = () => {
    let isValid = true;
    let newErrors = { email: '', password: '', general: '' };

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail inválido';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await signIn(email, password);
      // Redirecionamento já é tratado na Store, mas por segurança:
      // router.replace('/(app)/dashboard'); 
    } catch (error: any) {
      // Mantemos os inputs preenchidos e mostramos o erro geral
      setErrors(prev => ({ 
        ...prev, 
        general: error.message || "Credenciais incorretas. Tente novamente." 
      }));
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" backgroundColor="#09090b" translucent />
      
      <Animated.ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={[keyboardStyle]}
      >
        <Logo />

        <Animated.View entering={FadeInDown.delay(300).duration(800)} className="w-full space-y-4">
          
          {/* Input Email */}
          <View>
            <AuthInput
                icon={Mail}
                placeholder="E-mail"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if(errors.email) setErrors(e => ({...e, email: ''}));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.email}
            />
            {errors.email ? <Text className="text-red-500 text-xs ml-1 mt-1 font-medium">{errors.email}</Text> : null}
          </View>
          
          {/* Input Senha */}
          <View>
            <AuthInput
                icon={Lock}
                placeholder="Senha"
                isPassword
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if(errors.password) setErrors(e => ({...e, password: ''}));
                }}
                error={!!errors.password}
            />
            {errors.password ? <Text className="text-red-500 text-xs ml-1 mt-1 font-medium">{errors.password}</Text> : null}
          </View>

          <TouchableOpacity className="self-end" activeOpacity={0.7}>
              <Text className="text-zinc-500 text-sm font-medium">Esqueceu a senha?</Text>
          </TouchableOpacity>

          {/* Erro Geral da API */}
          {errors.general ? (
            <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex-row items-center gap-2">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-red-500 text-xs flex-1 font-medium">{errors.general}</Text>
            </View>
          ) : null}

          <View className="pt-4">
            <AuthButton 
                title="ENTRAR"
                onPress={handleLogin}
                isLoading={isLoading}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(800)} className="flex-row justify-center mt-12 items-center">
            <Text className="text-zinc-500">Ainda não tem conta? </Text>
            <Link href="/sign-up" asChild>
                <TouchableOpacity>
                    <Text className="text-emerald-500 font-bold p-2">Criar agora</Text>
                </TouchableOpacity>
            </Link>
        </Animated.View>

      </Animated.ScrollView>
    </View>
  );
}