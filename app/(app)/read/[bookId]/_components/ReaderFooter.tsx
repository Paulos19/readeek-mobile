import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onNext: () => void;
    onPrev: () => void;
}

export const ReaderFooter = ({ visible, onNext, onPrev }: Props) => {
    if (!visible) return null;

    return (
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/80 flex-row items-center justify-between px-8 z-40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <TouchableOpacity onPress={onPrev} className="p-4">
                <ChevronLeft color="white" size={28} />
            </TouchableOpacity>
            <Text className="text-zinc-500 text-xs">Leitura</Text>
            <TouchableOpacity onPress={onNext} className="p-4">
                <ChevronRight color="white" size={28} />
            </TouchableOpacity>
        </View>
    );
};