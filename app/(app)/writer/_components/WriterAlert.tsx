import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export type WriterAlertType = 'success' | 'error' | 'info';

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
      case 'success': return <CheckCircle2 size={40} color="#34d399" />;
      case 'error': return <AlertCircle size={40} color="#f87171" />;
      default: return <Info size={40} color="#818cf8" />;
    }
  };

  const getGradient = (): [string, string] => {
    switch (type) {
      case 'success': return ['rgba(6, 78, 59, 0.9)', 'rgba(2, 44, 34, 0.95)'];
      case 'error': return ['rgba(127, 29, 29, 0.9)', 'rgba(69, 10, 10, 0.95)'];
      default: return ['rgba(49, 46, 129, 0.9)', 'rgba(30, 27, 75, 0.95)'];
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View className="flex-1 justify-center items-center px-6 bg-black/80">
        <Animated.View entering={ZoomIn.duration(200).springify()} style={{ width: '100%' }}>
          
          {/* Borda Gradient */}
          <LinearGradient
            colors={type === 'error' ? ['#ef4444', '#7f1d1d'] : ['#6366f1', '#4338ca']}
            start={{x:0, y:0}} end={{x:1, y:1}}
            style={{ borderRadius: 32, padding: 1 }}
          >
            <View className="bg-zinc-950 rounded-[31px] overflow-hidden">
                {/* Header Decorativo */}
                <LinearGradient
                    colors={getGradient()}
                    className="h-24 items-center justify-center pt-4"
                >
                    <View className="bg-black/20 p-3 rounded-full border border-white/10 backdrop-blur-md shadow-xl">
                        {getIcon()}
                    </View>
                </LinearGradient>

                <View className="p-6 items-center">
                    <Text className="text-white font-black text-xl text-center mb-2 tracking-tight">
                        {title}
                    </Text>
                    <Text className="text-zinc-400 text-center mb-8 leading-5 font-medium text-sm">
                        {message}
                    </Text>

                    <View className="flex-row w-full space-x-3 gap-3">
                        {!singleButton && (
                            <TouchableOpacity 
                                onPress={onCancel}
                                activeOpacity={0.8}
                                className="flex-1 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center"
                            >
                                <Text className="text-zinc-400 font-bold text-sm">{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            onPress={onConfirm || onCancel}
                            activeOpacity={0.8}
                            className="flex-1"
                        >
                            <LinearGradient
                                colors={type === 'error' ? ['#dc2626', '#991b1b'] : ['#4f46e5', '#3730a3']}
                                className="py-4 rounded-2xl items-center justify-center shadow-lg"
                            >
                                <Text className="text-white font-bold text-sm tracking-wide uppercase">
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