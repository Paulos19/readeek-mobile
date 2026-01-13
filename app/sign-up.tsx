import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Keyboard, 
  Platform, 
  Dimensions, 
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withRepeat,
  withSequence,
  Easing, 
  interpolate, 
  FadeIn, 
  FadeInDown, 
  FadeOut,
  interpolateColor
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// API (Mockada ou Real)
import { api } from '../lib/api'; 

const { width, height } = Dimensions.get('window');

// --- TIPOS ---
type Step = 'NAME' | 'EMAIL' | 'PASSWORD' | 'SUCCESS';

// --- CONFIGURAÇÃO VISUAL ---
const STEPS_CONFIG = {
  NAME: {
    title: 'Quem é você?',
    subtitle: 'Seu nome será sua identidade na comunidade.',
    lottie: require('../assets/lottie/user-identity.json'), // Coloque seu arquivo aqui
    placeholder: 'Nome Completo'
  },
  EMAIL: {
    title: 'Seu melhor e-mail',
    subtitle: 'Para onde devemos enviar atualizações e acessos?',
    lottie: require('../assets/lottie/email-open.json'),
    placeholder: 'exemplo@readeek.com'
  },
  PASSWORD: {
    title: 'Crie uma senha',
    subtitle: 'Use pelo menos 8 caracteres para sua segurança.',
    lottie: require('../assets/lottie/secure-lock.json'),
    placeholder: '••••••••'
  },
  SUCCESS: {
    title: 'Tudo pronto!',
    subtitle: 'Sua jornada literária começa agora.',
    lottie: require('../assets/lottie/success-confetti.json'),
    placeholder: ''
  }
};

// --- COMPONENTE: LIVING BACKGROUND (Aurora Sutil) ---
const LivingBackground = () => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const styleBlob1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [-50, 50]) },
      { translateY: interpolate(t.value, [0, 1], [-50, 20]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.2]) },
    ],
    opacity: 0.4
  }));

  const styleBlob2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [50, -50]) },
      { translateY: interpolate(t.value, [0, 1], [100, 0]) },
      { scale: interpolate(t.value, [0, 1], [1.2, 1]) },
    ],
    opacity: 0.3
  }));

  return (
    <View className="absolute inset-0 bg-zinc-950 overflow-hidden">
      {/* Blob Superior Esquerdo (Emerald) */}
      <Animated.View 
        style={[styleBlob1]}
        className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-emerald-900/40 blur-[90px]" 
      />
      {/* Blob Inferior Direito (Indigo/Purple) */}
      <Animated.View 
        style={[styleBlob2]}
        className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-900/40 blur-[100px]" 
      />
    </View>
  );
};

export default function SignUpModern() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  // Estados
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  // Estado do Teclado
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const stepsKeys: Step[] = ['NAME', 'EMAIL', 'PASSWORD', 'SUCCESS'];
  const currentStepKey = stepsKeys[stepIndex];
  const config = STEPS_CONFIG[currentStepKey];

  // --- ANIMAÇÕES ---
  const buttonWidth = useSharedValue(width - 48); // Largura inicial (padding 24px * 2)
  const buttonRadius = useSharedValue(16);
  const contentOpacity = useSharedValue(1); // Opacidade do texto do botão

  // --- CONTROLE DE TECLADO & BOTÃO MORPHING ---
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      () => {
        setKeyboardVisible(true);
        // Transforma em bola
        buttonWidth.value = withSpring(64, { damping: 15 }); // Tamanho da bola
        buttonRadius.value = withSpring(32); // Totalmente redondo
        contentOpacity.value = withTiming(0, { duration: 100 }); // Esconde texto "Continuar"
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', 
      () => {
        setKeyboardVisible(false);
        // Volta ao normal
        buttonWidth.value = withSpring(width - 48, { damping: 15 });
        buttonRadius.value = withSpring(16);
        contentOpacity.value = withTiming(1, { duration: 200 }); // Mostra texto
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Foca o input ao trocar de passo
  useEffect(() => {
    if (stepIndex < 3) {
      // Pequeno delay para a animação de transição acontecer primeiro
      setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
    } else {
        Keyboard.dismiss();
    }
  }, [stepIndex]);

  // --- LÓGICA DE NEGÓCIO ---
  const validateAndNext = async () => {
    setError('');
    let isValid = false;

    // Validações Simples
    if (currentStepKey === 'NAME') {
      if (formData.name.trim().length < 3) {
        setError('Nome muito curto.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else isValid = true;
    } 
    else if (currentStepKey === 'EMAIL') {
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('E-mail inválido.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else isValid = true;
    }
    else if (currentStepKey === 'PASSWORD') {
      if (formData.password.length < 6) {
        setError('Mínimo 6 caracteres.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else isValid = true;
    }

    if (isValid) {
      if (currentStepKey === 'PASSWORD') {
        await handleSubmit();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStepIndex(p => p + 1);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulação ou Chamada Real
      await api.post('/mobile/auth/register', {
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStepIndex(3); // Vai para SUCCESS
      
      // Espera a animação de confetti antes de sair
      setTimeout(() => {
        router.replace({ pathname: '/login', params: { registeredEmail: formData.email } });
      }, 3000);

    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.response?.data?.error || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else router.back();
  };

  // --- ESTILOS ANIMADOS ---
  const buttonStyle = useAnimatedStyle(() => ({
    width: buttonWidth.value,
    borderRadius: buttonRadius.value,
  }));

  const textButtonStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    position: 'absolute', // Para não ocupar espaço quando invisível e permitir centralização do ícone
  }));

  const arrowButtonStyle = useAnimatedStyle(() => ({
    // O ícone aparece quando o texto desaparece (inverso)
    opacity: interpolate(contentOpacity.value, [0, 1], [1, 0]),
    transform: [{ scale: interpolate(contentOpacity.value, [0, 1], [1, 0.5]) }]
  }));

  // Renderização da Tela de Sucesso
  if (currentStepKey === 'SUCCESS') {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <LivingBackground />
        <LottieView
          source={config.lottie}
          autoPlay
          loop={false}
          style={{ width: 300, height: 300 }}
        />
        <Animated.View entering={FadeInDown.delay(500)}>
            <Text className="text-white text-3xl font-black text-center mt-4">Conta Criada!</Text>
            <Text className="text-zinc-400 text-center mt-2">Preparando seu ambiente...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <LivingBackground />

      {/* Header Fixo */}
      <View className="pt-14 px-6 flex-row items-center">
        <TouchableOpacity onPress={goBack} className="p-2 -ml-2 rounded-full active:bg-white/10">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        
        {/* Barra de Progresso Minimalista */}
        <View className="flex-1 flex-row h-1 bg-zinc-800 ml-4 rounded-full overflow-hidden gap-1">
            {[0, 1, 2].map(i => (
                <View 
                    key={i} 
                    className={`flex-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-emerald-500' : 'bg-transparent'}`} 
                />
            ))}
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
            
            {/* Animação do Mascote (Lottie) */}
            <Animated.View 
                key={`lottie-${stepIndex}`} // Força re-render para reiniciar animação
                entering={FadeIn.duration(600)} 
                exiting={FadeOut.duration(200)}
                className="items-center mb-8 h-40 justify-center"
            >
                <LottieView
                    source={config.lottie}
                    autoPlay
                    loop
                    style={{ width: 180, height: 180 }}
                />
            </Animated.View>

            {/* Textos e Inputs */}
            <Animated.View 
                key={`text-${stepIndex}`}
                entering={FadeInDown.springify()}
                className="w-full"
            >
                <Text className="text-white text-3xl font-black mb-2">{config.title}</Text>
                <Text className="text-zinc-400 text-base mb-8">{config.subtitle}</Text>

                <View className={`border-b-2 py-2 flex-row items-center ${error ? 'border-red-500' : 'border-zinc-700 focus:border-emerald-500'}`}>
                    <TextInput
                        ref={inputRef}
                        className="flex-1 text-white text-2xl font-medium"
                        placeholder={config.placeholder}
                        placeholderTextColor="#52525b"
                        value={currentStepKey === 'NAME' ? formData.name : currentStepKey === 'EMAIL' ? formData.email : formData.password}
                        onChangeText={(t) => {
                            setError('');
                            if (currentStepKey === 'NAME') setFormData({...formData, name: t});
                            else if (currentStepKey === 'EMAIL') setFormData({...formData, email: t});
                            else setFormData({...formData, password: t});
                        }}
                        autoCapitalize={currentStepKey === 'NAME' ? 'words' : 'none'}
                        keyboardType={currentStepKey === 'EMAIL' ? 'email-address' : 'default'}
                        secureTextEntry={currentStepKey === 'PASSWORD'}
                        onSubmitEditing={validateAndNext}
                        returnKeyType="next"
                    />
                </View>
                
                {/* Mensagem de Erro Inline */}
                {error ? (
                    <Animated.Text entering={FadeIn} className="text-red-500 mt-2 font-bold">{error}</Animated.Text>
                ) : null}

            </Animated.View>
        </View>

        {/* --- MORPHING BUTTON --- */}
        <View className="items-center pb-8 pt-4">
            <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={validateAndNext}
                disabled={loading}
            >
                <Animated.View 
                    style={[buttonStyle]}
                    className={`h-16 bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden relative`}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <>
                            {/* Texto (Visível quando teclado fechado) */}
                            <Animated.Text 
                                style={[textButtonStyle]} 
                                className="text-zinc-950 font-black text-lg tracking-wide uppercase"
                            >
                                {stepIndex === 2 ? 'Finalizar' : 'Continuar'}
                            </Animated.Text>

                            {/* Ícone (Visível quando teclado aberto ou transição) */}
                            {/* Usamos absolute para garantir que ele esteja centralizado no círculo */}
                            <Animated.View style={[arrowButtonStyle, { position: 'absolute' }]}>
                                {stepIndex === 2 ? (
                                    <Check size={28} color="#09090b" strokeWidth={3} />
                                ) : (
                                    <ArrowRight size={28} color="#09090b" strokeWidth={3} />
                                )}
                            </Animated.View>
                        </>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}