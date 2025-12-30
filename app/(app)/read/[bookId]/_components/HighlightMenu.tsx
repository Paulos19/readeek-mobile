import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { X, Check, Trash2, Copy } from 'lucide-react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    FadeInDown, 
    FadeOutDown 
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

// Paleta de Cores Disponíveis
const COLORS = [
    { id: 'yellow', value: '#facc15', label: 'Amarelo' },
    { id: 'green', value: '#4ade80', label: 'Verde' },
    { id: 'blue', value: '#60a5fa', label: 'Azul' },
    { id: 'purple', value: '#c084fc', label: 'Roxo' },
    { id: 'red', value: '#f87171', label: 'Vermelho' },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelectColor: (color: string) => void;
    selectedText?: string; // Opcional, para copiar
}

export const HighlightMenu = ({ visible, onClose, onSelectColor, selectedText }: Props) => {
    
    if (!visible) return null;

    const handleCopy = async () => {
        if (selectedText) {
            await Clipboard.setStringAsync(selectedText);
            onClose();
        }
    };

    return (
        <Animated.View 
            entering={FadeInDown.springify().damping(15)}
            exiting={FadeOutDown.duration(200)}
            style={{
                position: 'absolute',
                bottom: 40, // Flutuando acima do menu inferior
                alignSelf: 'center',
                width: width * 0.9,
                zIndex: 100,
            }}
        >
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 flex-row items-center justify-between">
                
                {/* Botão Fechar/Cancelar */}
                <TouchableOpacity 
                    onPress={onClose}
                    className="w-10 h-10 items-center justify-center bg-zinc-800 rounded-full border border-zinc-700 mr-2"
                >
                    <X size={18} color="#71717a" />
                </TouchableOpacity>

                {/* Seletor de Cores */}
                <View className="flex-1 flex-row justify-center gap-3">
                    {COLORS.map((color) => (
                        <TouchableOpacity
                            key={color.id}
                            onPress={() => onSelectColor(color.id)}
                            activeOpacity={0.7}
                            style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 16, 
                                backgroundColor: color.value,
                                borderWidth: 2,
                                borderColor: '#18181b', // Cor de fundo para contraste
                                shadowColor: color.value,
                                shadowOpacity: 0.5,
                                shadowRadius: 4,
                                elevation: 5
                            }}
                        />
                    ))}
                </View>

                {/* Ações Extras (Copiar) */}
                <View className="flex-row gap-2 ml-2 pl-2 border-l border-zinc-800">
                    <TouchableOpacity 
                        onPress={handleCopy}
                        className="w-10 h-10 items-center justify-center"
                    >
                        <Copy size={18} color="#a1a1aa" />
                    </TouchableOpacity>
                </View>

            </View>
            
            {/* Seta Decorativa (Opcional) */}
            <View className="self-center -mt-[1px]">
                <View style={{ 
                    width: 0, height: 0, 
                    backgroundColor: 'transparent', 
                    borderStyle: 'solid', 
                    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8, 
                    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#18181b' 
                }} />
            </View>
        </Animated.View>
    );
};