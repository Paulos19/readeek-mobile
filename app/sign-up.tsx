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
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  useAnimatedKeyboard,
  Easing, 
  interpolate, 
  FadeIn, 
  FadeInDown, 
  FadeOut
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// API
import { api } from '../lib/api'; 

const { width } = Dimensions.get('window');

// --- TIPOS ---
type Step = 'NAME' | 'EMAIL' | 'PASSWORD' | 'SUCCESS';

// --- CONFIGURAÇÃO ---
const STEPS_CONFIG = {
  NAME: {
    title: 'Quem é você?',
    subtitle: 'Como você quer ser chamado?',
    lottie: require('../assets/lottie/user-identity.json'),
    placeholder: 'Seu nome'
  },
  EMAIL: {
    title: 'Seu e-mail',
    subtitle: 'Para onde enviamos novidades?',
    lottie: require('../assets/lottie/email-open.json'),
    placeholder: 'exemplo@email.com'
  },
  PASSWORD: {
    title: 'Senha segura',
    subtitle: 'Mínimo de 8 caracteres.',
    lottie: require('../assets/lottie/secure-lock.json'),
    placeholder: '••••••••'
  },
  SUCCESS: {
    title: 'Tudo pronto!',
    subtitle: 'Sua jornada começa agora.',
    lottie: require('../assets/lottie/success-confetti.json'),
    placeholder: ''
  }
};

// --- BACKGROUND ---
const LivingBackground = () => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const styleBlob1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [-20, 20]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.1]) },
    ],
    opacity: 0.3
  }));

  const styleBlob2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [20, -20]) },
      { scale: interpolate(t.value, [0, 1], [1.1, 1]) },
    ],
    opacity: 0.2
  }));

  return (
    <View className="absolute inset-0 bg-zinc-950 overflow-hidden pointer-events-none">
      <Animated.View style={[styleBlob1]} className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-emerald-900/30 blur-[120px]" />
      <Animated.View style={[styleBlob2]} className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-900/30 blur-[120px]" />
    </View>
  );
};

export default function SignUpFinal() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  
  // --- SOLUÇÃO DE TECLADO (ANDROID & iOS) ---
  // Acessa a altura do teclado diretamente da thread de UI
  const keyboard = useAnimatedKeyboard();

  // Move a tela inteira para cima baseado na altura do teclado
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      // translateY negativo move para cima
      transform: [{ translateY: -keyboard.height.value }],
      // Opcional: Adiciona um padding extra no bottom quando teclado abre para não colar demais
      paddingBottom: keyboard.height.value > 0 ? 0 : 20 
    };
  });

  // Estados
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const stepsKeys: Step[] = ['NAME', 'EMAIL', 'PASSWORD', 'SUCCESS'];
  const currentStepKey = stepsKeys[stepIndex];
  const config = STEPS_CONFIG[currentStepKey];

  // --- ANIMAÇÕES DO BOTÃO (SUAVES / TIMING) ---
  const buttonWidth = useSharedValue(140); 
  const buttonRadius = useSharedValue(12);
  const textOpacity = useSharedValue(1);

  useEffect(() => {
    const smoothConfig = { duration: 300, easing: Easing.out(Easing.quad) };

    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      // Vira bolinha
      buttonWidth.value = withTiming(56, smoothConfig); 
      buttonRadius.value = withTiming(28, smoothConfig); 
      textOpacity.value = withTiming(0, { duration: 150 });
    });
    
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      // Volta ao normal
      buttonWidth.value = withTiming(140, smoothConfig);
      buttonRadius.value = withTiming(12, smoothConfig);
      textOpacity.value = withTiming(1, { duration: 300 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (stepIndex < 3) {
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
        Keyboard.dismiss();
    }
  }, [stepIndex]);

  // --- LÓGICA ---
  const validateAndNext = async () => {
    setError('');
    let isValid = false;

    if (currentStepKey === 'NAME') {
      if (formData.name.trim().length < 3) {
        setError('Nome muito curto');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else isValid = true;
    } 
    else if (currentStepKey === 'EMAIL') {
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('E-mail inválido');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else isValid = true;
    }
    else if (currentStepKey === 'PASSWORD') {
      if (formData.password.length < 6) {
        setError('Mínimo 6 caracteres');
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
      await api.post('/mobile/auth/register', {
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStepIndex(3);
      
      setTimeout(() => {
        router.replace({ pathname: '/login', params: { registeredEmail: formData.email } });
      }, 3000);

    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.response?.data?.error || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else router.back();
  };

  // --- ESTILOS ANIMADOS ---
  const rButtonStyle = useAnimatedStyle(() => ({
    width: buttonWidth.value,
    borderRadius: buttonRadius.value,
  }));

  const rTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    display: textOpacity.value === 0 ? 'none' : 'flex'
  }));

  if (currentStepKey === 'SUCCESS') {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <LivingBackground />
        <LottieView source={config.lottie} autoPlay loop={false} style={{ width: 300, height: 300 }} />
        <Animated.View entering={FadeInDown.delay(300)}>
            <Text className="text-white text-3xl font-bold text-center mt-4">Conta Criada!</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      <LivingBackground />

      {/* Header Fixo no topo (z-index alto para não ser coberto) */}
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

      {/* CONTAINER PRINCIPAL ANIMADO:
         - Usa justify-between para separar (Topo) e (Base).
         - O estilo 'animatedContainerStyle' aplica a translação nativa do teclado.
         - Flex-1 garante que ocupe a tela toda.
      */}
      <Animated.View 
        style={[animatedContainerStyle]} 
        className="flex-1 flex-col justify-between pt-32" 
      >
            
        {/* ÁREA SUPERIOR: Título e Lottie */}
        <View className="flex-1 px-8 justify-center items-start">
            <Animated.View 
                key={`lottie-${stepIndex}`}
                entering={FadeIn.duration(400)} 
                exiting={FadeOut.duration(200)}
                className="mb-8 self-center"
            >
                <LottieView
                    source={config.lottie}
                    autoPlay
                    loop
                    style={{ width: 140, height: 140 }}
                />
            </Animated.View>

            <Animated.View 
                key={`text-${stepIndex}`}
                entering={FadeInDown.duration(400)}
                className="w-full"
            >
                <Text className="text-white text-3xl font-bold mb-2 tracking-tight">
                    {config.title}
                </Text>
                <Text className="text-zinc-400 text-lg">
                    {config.subtitle}
                </Text>
            </Animated.View>
        </View>

        {/* ÁREA INFERIOR: Input Inline + Botão Bolinha */}
        <View className="px-6 pb-8 pt-2 w-full bg-transparent">
            
            {/* Error Banner Flutuante */}
            {error ? (
                <Animated.View entering={FadeInDown} className="absolute -top-10 left-6 right-6">
                    <Text className="text-red-400 font-medium text-sm text-center">{error}</Text>
                </Animated.View>
            ) : null}

            <View className="flex-row items-end gap-4">
                
                {/* INPUT CLEAN / INLINE */}
                <View className="flex-1 border-b border-zinc-700 pb-2 mb-1">
                    {(currentStepKey === 'NAME' ? formData.name : currentStepKey === 'EMAIL' ? formData.email : formData.password).length > 0 && (
                        <Animated.Text entering={FadeIn} className="text-[10px] text-emerald-500 uppercase font-bold mb-1">
                            {currentStepKey === 'PASSWORD' ? 'Senha' : currentStepKey === 'EMAIL' ? 'E-mail' : 'Nome'}
                        </Animated.Text>
                    )}

                    <TextInput
                        ref={inputRef}
                        className="text-white text-2xl font-medium p-0 leading-tight"
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
                        autoCorrect={false}
                        selectionColor="#10b981"
                    />
                </View>

                {/* BOTÃO BOLINHA/PÍLULA SUAVE */}
                <TouchableOpacity 
                    activeOpacity={0.8} 
                    onPress={validateAndNext}
                    disabled={loading}
                >
                    <Animated.View 
                        style={[rButtonStyle]}
                        className="h-[56px] bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-900/40 flex-row"
                    >
                        {loading ? (
                            <ActivityIndicator color="#09090b" />
                        ) : (
                            <>
                                <Animated.Text 
                                    style={[rTextStyle]} 
                                    className="text-zinc-950 font-bold text-base uppercase mr-2"
                                    numberOfLines={1}
                                >
                                    {stepIndex === 2 ? 'Fim' : 'Próximo'}
                                </Animated.Text>
                                
                                {stepIndex === 2 ? (
                                    <Check size={24} color="#09090b" strokeWidth={2.5} />
                                ) : (
                                    <ArrowRight size={24} color="#09090b" strokeWidth={2.5} />
                                )}
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