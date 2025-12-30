import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  withTiming, 
  useAnimatedStyle, 
  useSharedValue, 
} from 'react-native-reanimated';

export type WriterAlertType = 'success' | 'error' | 'info' | 'confirm';

interface WriterAlertProps {
  visible: boolean;
  type: WriterAlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  singleButton?: boolean;
}

export const WriterAlert = ({
  visible,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  singleButton = false
}: WriterAlertProps) => {
  
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={38} color="#34d399" />;
      case 'error':   return <AlertCircle size={38} color="#f87171" />;
      case 'confirm': return <HelpCircle size={38} color="#818cf8" />;
      default:        return <Info size={38} color="#818cf8" />;
    }
  };

  // Definição de cores para os botões e bordas
  const colors = {
    error: {
      border: ['#ef4444', '#7f1d1d'],
      button: ['#dc2626', '#991b1b'],
      header: ['rgba(127, 29, 29, 0.8)', 'rgba(69, 10, 10, 0.9)']
    },
    success: {
      border: ['#10b981', '#064e3b'],
      button: ['#059669', '#064e3b'],
      header: ['rgba(6, 78, 59, 0.8)', 'rgba(2, 44, 34, 0.9)']
    },
    confirm: {
      border: ['#6366f1', '#3730a3'],
      button: ['#4f46e5', '#3730a3'],
      header: ['rgba(49, 46, 129, 0.8)', 'rgba(30, 27, 75, 0.9)']
    },
    info: {
      border: ['#3f3f46', '#18181b'],
      button: ['#27272a', '#09090b'],
      header: ['rgba(24, 24, 27, 0.8)', 'rgba(9, 9, 11, 0.9)']
    }
  }[type];

  return (
    <Modal transparent visible={visible} statusBarTranslucent animationType="none">
      <View className="flex-1 justify-center items-center px-8">
        
        {/* Backdrop suave */}
        <Animated.View 
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          className="absolute inset-0 bg-black/70"
        >
          <Pressable className="flex-1" onPress={onCancel} />
        </Animated.View>

        {/* Card Alerta com entrada suave de escala e fade */}
        <Animated.View 
          entering={FadeIn.duration(300).delay(100)}
          exiting={FadeOut.duration(200)}
          className="w-full"
        >
          <LinearGradient
            colors={colors.border as [string, string, ...string[]]}
            start={{x:0, y:0}} end={{x:1, y:1}}
            style={{ borderRadius: 28, padding: 1 }}
          >
            <View className="bg-zinc-950 rounded-[27px] overflow-hidden shadow-2xl">
                
                {/* Header Visual */}
                <LinearGradient
                    colors={colors.header as [string, string, ...string[]]}
                    className="h-28 items-center justify-center"
                >
                    <View className="bg-black/30 p-4 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
                        {getIcon()}
                    </View>
                </LinearGradient>

                <View className="p-7 items-center">
                    <Text className="text-white font-bold text-xl text-center mb-2 tracking-tight">
                        {title}
                    </Text>
                    <Text className="text-zinc-400 text-center mb-8 leading-5 text-sm px-2">
                        {message}
                    </Text>

                    <View className="flex-row w-full gap-3">
                        {!singleButton && (
                            <TouchableOpacity 
                                onPress={onCancel}
                                activeOpacity={0.7}
                                className="flex-1"
                            >
                                <LinearGradient
                                  colors={['#27272a', '#18181b']} // Gradiente sóbrio para o cancelar
                                  className="py-3.5 rounded-2xl items-center justify-center border border-zinc-800"
                                >
                                  <Text className="text-zinc-400 font-bold text-xs uppercase tracking-widest">
                                    {cancelText}
                                  </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            onPress={onConfirm || onCancel}
                            activeOpacity={0.85}
                            className="flex-1"
                        >
                            <LinearGradient
                                colors={colors.button as [string, string, ...string[]]}
                                start={{x:0, y:0}} end={{x:0, y:1}}
                                className="py-3.5 rounded-2xl items-center justify-center shadow-lg"
                            >
                                <Text className="text-white font-black text-xs tracking-widest uppercase">
                                    {confirmText}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};