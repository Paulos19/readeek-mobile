import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Keyboard, Platform, 
  Dimensions, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, useAnimatedKeyboard,
  Easing, interpolate, FadeIn, FadeInDown, FadeOut 
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { ArrowLeft, ArrowRight, Check, KeyRound, Mail, Lock } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { api } from '../lib/api'; 

const { width } = Dimensions.get('window');

type Step = 'EMAIL' | 'CODE' | 'NEW_PASSWORD' | 'SUCCESS';

const STEPS_CONFIG = {
  EMAIL: {
    title: 'Recuperar Acesso',
    subtitle: 'Digite seu e-mail para receber o código.',
    lottie: require('../assets/lottie/email-open.json'), 
    placeholder: 'exemplo@readeek.com'
  },
  CODE: {
    title: 'Verifique o Código',
    subtitle: 'Enviamos um código de 6 dígitos para você.',
    lottie: require('../assets/lottie/secure-lock.json'),
    placeholder: '000000'
  },
  NEW_PASSWORD: {
    title: 'Nova Senha',
    subtitle: 'Crie uma senha forte e segura.',
    lottie: require('../assets/lottie/user-identity.json'),
    placeholder: '••••••••'
  },
  SUCCESS: {
    title: 'Senha Redefinida!',
    subtitle: 'Você já pode fazer login novamente.',
    lottie: require('../assets/lottie/success-confetti.json'),
    placeholder: ''
  }
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const keyboard = useAnimatedKeyboard();

  // Estados
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', code: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  
  const stepsKeys: Step[] = ['EMAIL', 'CODE', 'NEW_PASSWORD', 'SUCCESS'];
  const currentStepKey = stepsKeys[stepIndex];
  const config = STEPS_CONFIG[currentStepKey];

  // Animações
  const buttonWidth = useSharedValue(140); 
  const buttonRadius = useSharedValue(12);
  const textOpacity = useSharedValue(1);

  // Efeito Teclado no Botão
  useEffect(() => {
    const smoothConfig = { duration: 300, easing: Easing.out(Easing.quad) };
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      buttonWidth.value = withTiming(56, smoothConfig); 
      buttonRadius.value = withTiming(28, smoothConfig); 
      textOpacity.value = withTiming(0, { duration: 150 });
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      buttonWidth.value = withTiming(140, smoothConfig);
      buttonRadius.value = withTiming(12, smoothConfig);
      textOpacity.value = withTiming(1, { duration: 300 });
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Auto-foco na transição
  useEffect(() => {
    if (stepIndex < 3) {
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
        Keyboard.dismiss();
    }
  }, [stepIndex]);

  // --- LÓGICA DE VALIDAÇÃO E API ---
  const validateAndNext = async () => {
    setError('');
    
    // Passo 1: Solicitar Código
    if (currentStepKey === 'EMAIL') {
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        handleError('E-mail inválido');
        return;
      }
      setLoading(true);
      try {
        await api.post('/mobile/auth/forgot-password/request', { email: formData.email.toLowerCase().trim() });
        nextStep();
      } catch (e) {
        handleError('Erro ao enviar e-mail. Tente novamente.');
      } finally { setLoading(false); }
    } 
    
    // Passo 2: Validar Código
    else if (currentStepKey === 'CODE') {
      if (formData.code.length < 6) {
        handleError('Código deve ter 6 dígitos');
        return;
      }
      setLoading(true);
      try {
        await api.post('/mobile/auth/forgot-password/verify', { 
            email: formData.email.toLowerCase().trim(), 
            code: formData.code 
        });
        nextStep();
      } catch (e) {
        handleError('Código inválido ou expirado.');
      } finally { setLoading(false); }
    }

    // Passo 3: Resetar Senha
    else if (currentStepKey === 'NEW_PASSWORD') {
      if (formData.password.length < 6) {
        handleError('Mínimo 6 caracteres');
        return;
      }
      setLoading(true);
      try {
        await api.post('/mobile/auth/forgot-password/reset', {
            email: formData.email.toLowerCase().trim(),
            code: formData.code,
            newPassword: formData.password
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStepIndex(3); // Success
        setTimeout(() => router.replace('/login'), 3500);
      } catch (e) {
        handleError('Erro ao redefinir senha.');
      } finally { setLoading(false); }
    }
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex(p => p + 1);
  };

  const handleError = (msg: string) => {
    setError(msg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else router.back();
  };

  // --- STYLES ---
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }],
    paddingBottom: keyboard.height.value > 0 ? 0 : 20 
  }));

  const rButtonStyle = useAnimatedStyle(() => ({
    width: buttonWidth.value,
    borderRadius: buttonRadius.value,
  }));

  const rTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    display: textOpacity.value === 0 ? 'none' : 'flex'
  }));

  // Render Tela de Sucesso
  if (currentStepKey === 'SUCCESS') {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <LottieView source={config.lottie} autoPlay loop={false} style={{ width: 300, height: 300 }} />
        <Animated.View entering={FadeInDown.delay(300)}>
            <Text className="text-white text-3xl font-bold text-center mt-4">Senha Alterada!</Text>
            <Text className="text-zinc-400 text-center mt-2">Redirecionando para login...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 pt-14 px-6 flex-row items-center z-50">
        <TouchableOpacity onPress={goBack} className="p-2 -ml-2 rounded-full active:bg-white/10">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1 flex-row h-1 bg-zinc-800/50 ml-4 rounded-full overflow-hidden gap-1">
            {[0, 1, 2].map(i => (
                <View key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-emerald-500' : 'bg-transparent'}`} />
            ))}
        </View>
      </View>

      <Animated.View style={[animatedContainerStyle]} className="flex-1 flex-col justify-between pt-32">
        
        {/* Top Content */}
        <View className="flex-1 px-8 justify-center items-start">
            <Animated.View 
                key={`lottie-${stepIndex}`}
                entering={FadeIn.duration(400)} 
                exiting={FadeOut.duration(200)}
                className="mb-8 self-center"
            >
                <LottieView source={config.lottie} autoPlay loop style={{ width: 140, height: 140 }} />
            </Animated.View>

            <Animated.View key={`text-${stepIndex}`} entering={FadeInDown.duration(400)} className="w-full">
                <Text className="text-white text-3xl font-bold mb-2 tracking-tight">{config.title}</Text>
                <Text className="text-zinc-400 text-lg">{config.subtitle}</Text>
            </Animated.View>
        </View>

        {/* Input Area */}
        <View className="px-6 pb-8 pt-2 w-full">
            {error ? (
                <Animated.View entering={FadeInDown} className="absolute -top-10 left-6 right-6">
                    <Text className="text-red-400 font-medium text-sm text-center">{error}</Text>
                </Animated.View>
            ) : null}

            <View className="flex-row items-end gap-4">
                <View className="flex-1 border-b border-zinc-700 pb-2 mb-1">
                    <Text className="text-[10px] text-emerald-500 uppercase font-bold mb-1">
                        {currentStepKey === 'EMAIL' ? 'E-mail' : currentStepKey === 'CODE' ? 'Código (6 Dígitos)' : 'Nova Senha'}
                    </Text>

                    <TextInput
                        ref={inputRef}
                        className="text-white text-2xl font-medium p-0 leading-tight"
                        placeholder={config.placeholder}
                        placeholderTextColor="#52525b"
                        value={
                            currentStepKey === 'EMAIL' ? formData.email : 
                            currentStepKey === 'CODE' ? formData.code : formData.password
                        }
                        onChangeText={(t) => {
                            setError('');
                            if (currentStepKey === 'EMAIL') setFormData({...formData, email: t});
                            else if (currentStepKey === 'CODE') setFormData({...formData, code: t.replace(/[^0-9]/g, '').slice(0, 6)}); // Só números, max 6
                            else setFormData({...formData, password: t});
                        }}
                        keyboardType={currentStepKey === 'EMAIL' ? 'email-address' : currentStepKey === 'CODE' ? 'number-pad' : 'default'}
                        autoCapitalize="none"
                        secureTextEntry={currentStepKey === 'NEW_PASSWORD'}
                        onSubmitEditing={validateAndNext}
                        returnKeyType="next"
                        selectionColor="#10b981"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity activeOpacity={0.8} onPress={validateAndNext} disabled={loading}>
                    <Animated.View style={[rButtonStyle]} className="h-[56px] bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-900/40 flex-row">
                        {loading ? (
                            <ActivityIndicator color="#09090b" />
                        ) : (
                            <>
                                <Animated.Text style={[rTextStyle]} className="text-zinc-950 font-bold text-base uppercase mr-2" numberOfLines={1}>
                                    {stepIndex === 2 ? 'Finalizar' : 'Próximo'}
                                </Animated.Text>
                                <ArrowRight size={24} color="#09090b" strokeWidth={2.5} />
                            </>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </View>

      </Animated.View>
    </View>
  );
}