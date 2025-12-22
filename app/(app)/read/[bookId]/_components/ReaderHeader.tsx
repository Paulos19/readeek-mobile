import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ArrowLeft, List, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Props {
    visible: boolean;
    onToggleToc: () => void;
    onToggleSettings: () => void;
}

export const ReaderHeader = ({ visible, onToggleToc, onToggleSettings }: Props) => {
    const router = useRouter();
    if (!visible) return null;

    return (
        <View className="absolute top-0 left-0 right-0 h-24 bg-black/80 flex-row items-end pb-4 px-4 justify-between z-40 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
                <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <View className="flex-row gap-4">
                 <TouchableOpacity onPress={onToggleToc} className="p-2">
                    <List color="white" size={24} />
                </TouchableOpacity>
                 <TouchableOpacity onPress={onToggleSettings} className="p-2">
                    <Settings color="white" size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );
};