import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Mail, Lock, User, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';

import { useAuthStore } from '../stores/useAuthStore'; // Assumindo que você adicionará 'register' aqui
import { useKeyboardShift } from '../_hooks/useKeyboardShift';
import { AuthInput } from './_components/auth/AuthInput';
import { AuthButton } from './_components/auth/AuthButton';

export default function SignUpScreen() {
  const router = useRouter();
  // const { register, isLoading } = useAuthStore(); 
  const [isLoading, setIsLoading] = useState(false); 

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState({ 
    name: '', email: '', password: '', confirmPassword: '', general: '' 
  });

  const keyboardAnimatedStyle = useKeyboardShift();

  const validate = () => {
    let isValid = true;
    let newErrors = { name: '', email: '', password: '', confirmPassword: '', general: '' };

    if (!name.trim()) { newErrors.name = 'Nome é obrigatório'; isValid = false; }
    if (!email.trim()) { newErrors.email = 'E-mail é obrigatório'; isValid = false; }
    
    if (!password) { 
      newErrors.password = 'Senha é obrigatória'; isValid = false; 
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo de 6 caracteres'; isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors(e => ({...e, general: ''}));

    try {
      // Exemplo de chamada: await register(name, email, password);
      // Simulação:
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sucesso
      // router.replace('/(app)/dashboard'); ou redirecionar para login
      router.back(); 
      
    } catch (error: any) {
      setErrors(prev => ({ 
        ...prev, 
        general: error.message || "Falha ao criar conta. Tente outro e-mail." 
      }));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Botão Voltar Absoluto para UX Fácil */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-14 left-6 z-10 w-10 h-10 items-center justify-center bg-zinc-900/80 rounded-full border border-zinc-800"
      >
        <ArrowLeft size={20} color="white" />
      </TouchableOpacity>
      
      <Animated.ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={keyboardAnimatedStyle}
      >
        <Animated.View entering={FadeInDown.duration(800)} className="mb-8 mt-16">
            <Text className="text-white font-black text-4xl tracking-tight">Crie sua conta</Text>
            <Text className="text-zinc-500 text-lg mt-2">Junte-se à comunidade Readeek.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800)} className="space-y-4">
            
            {/* Nome */}
            <View>
              <AuthInput
                icon={User}
                placeholder="Nome completo"
                value={name}
                onChangeText={(t) => { setName(t); setErrors(e => ({...e, name: ''})); }}
                autoCapitalize="words"
                error={!!errors.name}
              />
              {errors.name && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.name}</Text>}
            </View>

            {/* Email */}
            <View>
              <AuthInput
                icon={Mail}
                placeholder="E-mail"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors(e => ({...e, email: ''})); }}
                autoCapitalize="none"
                error={!!errors.email}
              />
              {errors.email && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.email}</Text>}
            </View>

            {/* Senha */}
            <View>
              <AuthInput
                icon={Lock}
                placeholder="Senha"
                isPassword
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors(e => ({...e, password: ''})); }}
                error={!!errors.password}
              />
              {errors.password && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.password}</Text>}
            </View>

            {/* Confirmar Senha */}
            <View>
              <AuthInput
                icon={CheckCircle}
                placeholder="Confirmar Senha"
                isPassword
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({...e, confirmPassword: ''})); }}
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.confirmPassword}</Text>}
            </View>

            {/* Erro Geral */}
            {errors.general ? (
              <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex-row items-center gap-2 mt-2">
                <AlertCircle size={16} color="#ef4444" />
                <Text className="text-red-500 text-xs flex-1 font-medium">{errors.general}</Text>
              </View>
            ) : null}

            <View className="mt-6">
                <AuthButton 
                    title="CADASTRAR"
                    onPress={handleRegister}
                    isLoading={isLoading}
                />
            </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(800)} className="flex-row justify-center mt-8 items-center pb-8">
            <Text className="text-zinc-500">Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-emerald-500 font-bold p-2">Entrar</Text>
            </TouchableOpacity>
        </Animated.View>

      </Animated.ScrollView>
    </View>
  );
}