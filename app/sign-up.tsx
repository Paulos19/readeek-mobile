import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring, withTiming, interpolateColor, useSharedValue } from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, Check, X, Eye, EyeOff, Mail, User, Lock, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '../stores/useAuthStore'; // Vamos precisar expandir o store depois
import { api } from '../lib/api'; // Acesso direto para o registro se não estiver no store ainda

// --- Tipos & Interfaces ---
type Step = 'NAME' | 'EMAIL' | 'PASSWORD';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Componente: Barra de Progresso ---
const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((step + 1) / total, { duration: 500 });
  }, [step]);

  const style = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="h-1 bg-zinc-900 w-full rounded-full overflow-hidden mt-4">
      <Animated.View style={style} className="h-full bg-emerald-500 rounded-full" />
    </View>
  );
};

// --- Componente: Medidor de Força de Senha ---
const PasswordStrengthMeter = ({ password }: { password: string }) => {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const score = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  // Cores baseadas no score (0-4)
  const getStrengthColor = () => {
    switch(score) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-red-400';
      case 2: return 'bg-orange-400';
      case 3: return 'bg-yellow-400';
      case 4: return 'bg-emerald-500';
      default: return 'bg-zinc-800';
    }
  };

  const getLabel = () => {
    switch(score) {
      case 1: return 'Muito fraca';
      case 2: return 'Fraca';
      case 3: return 'Média';
      case 4: return 'Forte e segura';
      default: return 'Muito curta';
    }
  };

  return (
    <Animated.View entering={FadeInDown} className="mt-3">
      <View className="flex-row gap-1 h-1 mb-2">
        {[1, 2, 3, 4].map((index) => (
          <View 
            key={index} 
            className={`flex-1 rounded-full transition-all duration-300 ${index <= score ? getStrengthColor() : 'bg-zinc-800'}`} 
          />
        ))}
      </View>
      <Text className="text-zinc-500 text-xs text-right font-medium">
        {getLabel()}
      </Text>
    </Animated.View>
  );
};

export default function SignUpWizard() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  // Estados
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState<string | null>(null);

  // Passos definidos
  const steps: Step[] = ['NAME', 'EMAIL', 'PASSWORD'];
  const currentStep = steps[stepIndex];

  // Focar no input ao mudar de passo
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400); // Pequeno delay para a animação
  }, [stepIndex]);

  // --- Lógica de Validação ---
  const validateStep = () => {
    setError(null);
    let isValid = false;

    switch (currentStep) {
      case 'NAME':
        if (formData.name.trim().split(' ').length < 2) {
          setError('Por favor, digite seu nome e sobrenome.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          isValid = true;
        }
        break;
      
      case 'EMAIL':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Este e-mail parece inválido.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          isValid = true;
        }
        break;

      case 'PASSWORD':
        if (formData.password.length < 8) {
          setError('A senha deve ter pelo menos 8 caracteres.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          isValid = true;
        }
        break;
    }

    if (isValid) {
      if (stepIndex < steps.length - 1) {
        setStepIndex(prev => prev + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        handleRegister();
      }
    }
  };

  // --- API Integration ---
  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Ajustando a chamada para o padrão da sua API (verificado no context)
      // Endpoint esperado: POST /mobile/auth/register (ou similar, baseado no login)
      // Como não tenho o endpoint exato de register no context, vou simular a estrutura correta:
      
      const response = await api.post('/mobile/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      // Sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-login ou redirecionar
      // router.replace('/(app)/dashboard'); 
      // Por boa prática de UX, mandamos para o login para confirmar que ele sabe a senha
      router.replace({ pathname: '/login', params: { registeredEmail: formData.email } });

    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.response?.data?.error || "Não foi possível criar a conta. Tente novamente.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renderização Dinâmica dos Inputs ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 'NAME':
        return (
          <Animated.View key="step1" entering={FadeInRight} exiting={FadeOutLeft} className="w-full">
            <View className="mb-6">
              <View className="w-12 h-12 bg-emerald-500/10 rounded-2xl items-center justify-center mb-4">
                <User size={24} color="#10b981" />
              </View>
              <Text className="text-white text-3xl font-bold">Como devemos te chamar?</Text>
              <Text className="text-zinc-400 text-base mt-2">Use seu nome real para que a comunidade te reconheça.</Text>
            </View>
            
            <TextInput
              ref={inputRef}
              className="text-white text-xl border-b border-zinc-700 py-4 w-full"
              placeholder="Nome e Sobrenome"
              placeholderTextColor="#52525b"
              autoCapitalize="words"
              value={formData.name}
              onChangeText={t => setFormData({...formData, name: t})}
              onSubmitEditing={validateStep}
              returnKeyType="next"
            />
          </Animated.View>
        );

      case 'EMAIL':
        return (
          <Animated.View key="step2" entering={FadeInRight} exiting={FadeOutLeft} className="w-full">
            <View className="mb-6">
              <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center mb-4">
                <Mail size={24} color="#3b82f6" />
              </View>
              <Text className="text-white text-3xl font-bold">Qual seu e-mail?</Text>
              <Text className="text-zinc-400 text-base mt-2">Enviaremos confirmações de compra e atualizações para lá.</Text>
            </View>

            <TextInput
              ref={inputRef}
              className="text-white text-xl border-b border-zinc-700 py-4 w-full"
              placeholder="seu@email.com"
              placeholderTextColor="#52525b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={t => setFormData({...formData, email: t})}
              onSubmitEditing={validateStep}
              returnKeyType="next"
            />
          </Animated.View>
        );

      case 'PASSWORD':
        return (
          <Animated.View key="step3" entering={FadeInRight} exiting={FadeOutLeft} className="w-full">
            <View className="mb-6">
              <View className="w-12 h-12 bg-purple-500/10 rounded-2xl items-center justify-center mb-4">
                <ShieldCheck size={24} color="#a855f7" />
              </View>
              <Text className="text-white text-3xl font-bold">Proteja sua conta</Text>
              <Text className="text-zinc-400 text-base mt-2">Crie uma senha forte com letras, números e símbolos.</Text>
            </View>

            <View className="relative">
              <TextInput
                ref={inputRef}
                className="text-white text-xl border-b border-zinc-700 py-4 w-full pr-10"
                placeholder="Senha"
                placeholderTextColor="#52525b"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={t => setFormData({...formData, password: t})}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-4"
              >
                {showPassword ? <EyeOff size={24} color="#71717a" /> : <Eye size={24} color="#71717a" />}
              </TouchableOpacity>
            </View>

            <PasswordStrengthMeter password={formData.password} />

            <TextInput
              className="text-white text-xl border-b border-zinc-700 py-4 w-full mt-4"
              placeholder="Confirmar Senha"
              placeholderTextColor="#52525b"
              secureTextEntry={!showPassword}
              value={formData.confirmPassword}
              onChangeText={t => setFormData({...formData, confirmPassword: t})}
              onSubmitEditing={validateStep}
              returnKeyType="done"
            />
          </Animated.View>
        );
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      
      {/* Header Fixo */}
      <View className="pt-14 px-6 pb-4">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={() => stepIndex > 0 ? setStepIndex(stepIndex - 1) : router.back()}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-zinc-900"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-zinc-500 font-medium">
             Passo {stepIndex + 1} de {steps.length}
          </Text>

          <View className="w-10" /> 
        </View>
        
        <ProgressBar step={stepIndex} total={steps.length} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-8 justify-center"
      >
        {/* Conteúdo do Wizard */}
        <View className="min-h-[300px] justify-center">
          {renderStepContent()}
        </View>

        {/* Alerta de Erro Customizado */}
        {error && (
          <Animated.View entering={FadeInDown} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex-row items-center gap-3 mt-4 mb-4">
            <View className="bg-red-500 rounded-full p-1">
              <X size={12} color="white" />
            </View>
            <Text className="text-red-400 flex-1 font-medium">{error}</Text>
          </Animated.View>
        )}

      </KeyboardAvoidingView>

      {/* Footer com Botão de Ação */}
      <View className="px-8 pb-10 pt-4 bg-zinc-950">
        <TouchableOpacity
          onPress={validateStep}
          disabled={isLoading}
          className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-900/20 
            ${isLoading ? 'bg-zinc-800' : 'bg-emerald-500'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#10b981" />
          ) : (
            <>
              <Text className="text-zinc-950 font-bold text-lg mr-2">
                {stepIndex === steps.length - 1 ? 'Criar Conta' : 'Continuar'}
              </Text>
              {stepIndex < steps.length - 1 && <ArrowRight size={20} color="#09090b" strokeWidth={3} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}