import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';

const COLORS = [
    { name: 'yellow', value: 'rgba(255, 255, 0, 0.4)', hex: '#facc15' },
    { name: 'green', value: 'rgba(0, 255, 0, 0.4)', hex: '#4ade80' },
    { name: 'blue', value: 'rgba(0, 0, 255, 0.4)', hex: '#60a5fa' },
    { name: 'pink', value: 'rgba(255, 0, 255, 0.4)', hex: '#f472b6' },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelectColor: (color: string) => void;
}

export const HighlightMenu = ({ visible, onClose, onSelectColor }: Props) => {
    if (!visible) return null;
    return (
        <View className="absolute bottom-10 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white font-bold">Destacar Seleção</Text>
                <TouchableOpacity onPress={onClose}><X size={20} color="#71717a" /></TouchableOpacity>
            </View>
            <View className="flex-row justify-around">
                {COLORS.map(color => (
                    <TouchableOpacity 
                        key={color.name}
                        onPress={() => onSelectColor(color.value)}
                        className="w-10 h-10 rounded-full border-2 border-zinc-700 items-center justify-center"
                        style={{ backgroundColor: color.hex }}
                    />
                ))}
            </View>
        </View>
    );
};