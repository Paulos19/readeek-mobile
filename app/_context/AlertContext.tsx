import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

// CORREÇÃO: Exportando os tipos para serem usados em outros arquivos
export type AlertStyle = 'default' | 'cancel' | 'destructive';

export type AlertButton = {
  text: string;
  style?: AlertStyle;
  onPress?: () => void;
};

type AlertOptions = {
  title: string;
  description?: string;
  buttons?: AlertButton[];
};

interface AlertContextData {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    setConfig(options);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => setConfig(null), 300);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      
      <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
        {/* Backdrop com blur simulado (escuro) */}
        <View className="flex-1 bg-black/80 justify-center items-center px-8">
            {visible && (
                <Animated.View 
                    entering={ZoomIn.duration(200)} 
                    exiting={ZoomOut.duration(150)}
                    className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-black"
                >
                    <Text className="text-white font-bold text-xl mb-2 text-center tracking-tight">
                        {config?.title}
                    </Text>
                    
                    {config?.description && (
                        <Text className="text-zinc-400 text-base text-center leading-6 mb-8">
                            {config.description}
                        </Text>
                    )}

                    <View className="gap-3">
                        {config?.buttons?.map((btn, index) => {
                            const isDestructive = btn.style === 'destructive';
                            const isCancel = btn.style === 'cancel';
                            
                            return (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        hideAlert();
                                        if (btn.onPress) btn.onPress();
                                    }}
                                    className={`w-full py-4 rounded-2xl items-center justify-center border ${
                                        isDestructive 
                                            ? 'bg-red-500/10 border-red-500/50' 
                                            : isCancel 
                                                ? 'bg-transparent border-zinc-700' 
                                                : 'bg-white border-white'
                                    }`}
                                >
                                    <Text className={`font-bold text-base ${
                                        isDestructive ? 'text-red-500' : isCancel ? 'text-zinc-400' : 'text-black'
                                    }`}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            )}
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};