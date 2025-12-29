import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2, X } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

type AlertType = 'success' | 'error' | 'info';

interface WriterAlertProps {
  visible: boolean;
  type: AlertType;
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
      case 'success': return <CheckCircle2 size={48} color="#34d399" />;
      case 'error': return <AlertCircle size={48} color="#f87171" />;
      default: return <AlertCircle size={48} color="#818cf8" />;
    }
  };

  const getColors = (): [string, string] => {
    switch (type) {
      case 'success': return ['#064e3b', '#022c22'];
      case 'error': return ['#7f1d1d', '#450a0a'];
      default: return ['#312e81', '#1e1b4b'];
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        <Animated.View entering={ZoomIn.duration(300)} className="w-full">
          <LinearGradient
            colors={getColors()}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            className="rounded-[32px] p-[1px] border border-white/10"
          >
            <View className="bg-zinc-950/90 rounded-[31px] p-6 items-center">
              <View className="mb-4 bg-white/5 p-4 rounded-full border border-white/5">
                {getIcon()}
              </View>

              <Text className="text-white font-black text-xl text-center mb-2">{title}</Text>
              <Text className="text-zinc-400 text-center mb-8 leading-5 font-medium">{message}</Text>

              <View className="flex-row w-full space-x-3">
                {!singleButton && (
                  <TouchableOpacity 
                    onPress={onCancel}
                    className="flex-1 py-3.5 rounded-xl border border-zinc-700 bg-zinc-900 items-center"
                  >
                    <Text className="text-zinc-400 font-bold">{cancelText}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  onPress={onConfirm || onCancel}
                  className={`flex-1 py-3.5 rounded-xl items-center ${type === 'error' ? 'bg-red-900/50 border border-red-800' : 'bg-indigo-600'}`}
                >
                  <Text className={`font-bold ${type === 'error' ? 'text-red-200' : 'text-white'}`}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};