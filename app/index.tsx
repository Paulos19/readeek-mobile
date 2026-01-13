import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  interpolateColor
} from 'react-native-reanimated';
import { Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight, XCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Ajuste os imports conforme seus aliases (stores/ ou ../stores/)
import { useAuthStore } from '../stores/useAuthStore'; 
import { Logo } from './_components/auth/Logo';
import { useKeyboardShift } from '../_hooks/useKeyboardShift';

// --- Componente Local SmartInput (Para validação visual rica) ---
const SmartInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  icon: Icon, 
  isPassword = false, 
  isValid = false,
  hasError = false,
  errorMessage = '',
  keyboardType = 'default',
  onSubmit = () => {}
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  // Animação da cor da borda
  const borderColorProgress = useSharedValue(0);

  useEffect(() => {
    // 0 = normal, 1 = focused, 2 = error, 3 = valid
    let target = 0;
    if (hasError) target = 2;
    else if (isFocused) target = 1;
    else if (isValid && value.length > 0) target = 3;
    
    borderColorProgress.value = withTiming(target, { duration: 200 });
  }, [isFocused, hasError, isValid]);

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      borderColorProgress.value,
      [0, 1, 2, 3],
      ['#27272a', '#10b981', '#ef4444', '#10b981'] // zinc-800 -> emerald -> red -> emerald
    );
    return { borderColor };
  });

  return (
    <View className="mb-4">
      <Animated.View 
        style={[animatedStyle, { borderWidth: 1 }]}
        className="flex-row items-center bg-zinc-900/80 rounded-2xl px-4 h-14"
      >
        <Icon 
          size={20} 
          color={hasError ? '#ef4444' : (isFocused || isValid ? '#10b981' : '#71717a')} 
        />
        
        <TextInput
          className="flex-1 text-white ml-3 text-base font-medium h-full"
          placeholder={placeholder}
          placeholderTextColor="#52525b"
          secureTextEntry={isPassword && !showPass}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onSubmitEditing={onSubmit}
        />

        <View className="flex-row items-center gap-2">
          {/* Check Verde de Sucesso */}
          {value.length > 0 && !hasError && !isPassword && isValid && (
             <CheckCircle2 size={18} color="#10b981" />
          )}
          
          {/* Ícone de Erro */}
          {hasError && <XCircle size={18} color="#ef4444" />}

          {/* Toggle de Senha */}
          {isPassword && (
            <TouchableOpacity onPress={() => setShowPass(!showPass)} className="p-1">
              {showPass ? <EyeOff size={20} color="#71717a" /> : <Eye size={20} color="#71717a" />}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {/* Mensagem de Erro Inline */}
      {hasError && errorMessage ? (
        <Animated.Text 
          entering={FadeInDown} 
          className="text-red-500 text-xs ml-2 mt-1 font-medium"
        >
          {errorMessage}
        </Animated.Text>
      ) : null}
    </View>
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn } = useAuthStore();
  
  // Estados Locais
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de Erro Granulares
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const shakeX = useSharedValue(0);
  const keyboardAnimatedStyle = useKeyboardShift();

  // Auto-fill se vier do registro (parâmetros de rota)
  useEffect(() => {
    if (params?.registeredEmail) setEmail(params.registeredEmail as string);
  }, [params]);

  // Validador Visual em Tempo Real (Regex Simples)
  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordFilled = password.length >= 1;

  // Função de Tremor (Feedback Tátil/Visual)
  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleLogin = async () => {
    // 1. Limpa erros anteriores e teclado
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    Keyboard.dismiss();

    // 2. Validação local antes de chamar a API
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Digite seu e-mail');
      hasError = true;
    } else if (!isEmailValid) {
      setEmailError('E-mail inválido');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Digite sua senha');
      hasError = true;
    }

    if (hasError) {
      triggerShake();
      return;
    }

    // 3. Processo de Login Seguro
    setIsLoading(true);
    try {
      await signIn(email, password);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // O redirecionamento geralmente é automático via listener no _layout
      // mas podemos forçar se necessário:
      router.replace('/(app)/dashboard'); 

    } catch (error: any) {
      // 4. Tratamento de Erro Inteligente (Não reseta os inputs!)
      console.log("Erro de Login:", error.message);
      
      const msg = error.message || "Falha ao entrar";
      
      // Tenta categorizar o erro para mostrar no campo certo
      if (msg.toLowerCase().includes("senha") || msg.toLowerCase().includes("password")) {
         setPasswordError("Senha incorreta");
      } else if (msg.toLowerCase().includes("usuário") || msg.toLowerCase().includes("email")) {
         setEmailError("E-mail não encontrado");
      } else {
         setGeneralError("E-mail ou senha incorretos.");
      }

      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Estilo animado para o formulário tremer
  const formShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }]
  }));

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      
      <Animated.ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}
        className="px-8"
        keyboardShouldPersistTaps="handled"
        style={keyboardAnimatedStyle}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-10">
          <Logo />
        </View>

        <Animated.View 
          style={[formShakeStyle]} 
          entering={FadeInDown.delay(200).duration(800)}
          className="w-full"
        >

          {/* Inputs Inteligentes */}
          <SmartInput
            placeholder="E-mail"
            value={email}
            onChangeText={(t: string) => { setEmail(t); setEmailError(''); setGeneralError(''); }}
            icon={Mail}
            keyboardType="email-address"
            isValid={isEmailValid}
            hasError={!!emailError}
            errorMessage={emailError}
          />

          <SmartInput
            placeholder="Senha"
            value={password}
            onChangeText={(t: string) => { setPassword(t); setPasswordError(''); setGeneralError(''); }}
            icon={Lock}
            isPassword
            isValid={isPasswordFilled}
            hasError={!!passwordError}
            errorMessage={passwordError}
            onSubmit={handleLogin}
          />

          {/* Erro Geral (Ex: Rede) */}
          {generalError ? (
            <Animated.View 
              entering={FadeInDown} 
              className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex-row items-center gap-3 mb-4"
            >
              <AlertCircle size={18} color="#ef4444" />
              <Text className="text-red-400 text-sm font-medium flex-1">{generalError}</Text>
            </Animated.View>
          ) : null}

          {/* Botão Esqueci Senha */}
          <View className="flex-row justify-end mb-6">
            <TouchableOpacity>
              <Text className="text-zinc-500 font-medium text-sm">Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>

          {/* Botão Principal */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-900/20 
              ${isLoading ? 'bg-zinc-800' : 'bg-emerald-500'}`}
            activeOpacity={0.8}
          >
            {isLoading ? (
               <ActivityIndicator color="#10b981" />
            ) : (
              <>
                <Text className="text-zinc-950 font-bold text-lg mr-2">Entrar</Text>
                <ArrowRight size={20} color="#09090b" strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>

        </Animated.View>

        {/* Footer */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(800)} 
          className="flex-row justify-center mt-10 items-center"
        >
            <Text className="text-zinc-500 text-base">Novo por aqui? </Text>
            <Link href="/sign-up" asChild>
                <TouchableOpacity>
                    <Text className="text-emerald-500 font-bold text-base p-2">Criar conta</Text>
                </TouchableOpacity>
            </Link>
        </Animated.View>

      </Animated.ScrollView>
    </View>
  );
}