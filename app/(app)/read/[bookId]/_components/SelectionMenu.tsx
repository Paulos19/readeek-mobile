import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { X, BookOpen, Sparkles, Copy, Check } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { api } from '../../../../../lib/api';

const { width } = Dimensions.get('window');

const COLORS = [
    { id: 'yellow', value: '#facc15' },
    { id: 'green', value: '#4ade80' },
    { id: 'blue', value: '#60a5fa' },
    { id: 'purple', value: '#c084fc' },
    { id: 'red', value: '#f87171' },
];

interface Props {
    visible: boolean;
    text: string;
    onClose: () => void;
    onHighlight: (color: string) => void;
}

export const SelectionMenu = ({ visible, text, onClose, onHighlight }: Props) => {
    const [definition, setDefinition] = useState<string | null>(null);
    const [example, setExample] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && text) {
            fetchDefinition(text);
        } else {
            setDefinition(null);
            setExample(null);
        }
    }, [visible, text]);

    const fetchDefinition = async (query: string) => {
        setLoading(true);
        try {
            // Limita o texto para não estourar tokens da IA se selecionar uma página inteira
            const cleanText = query.length > 200 ? query.substring(0, 200) + "..." : query;
            
            const res = await api.post('/mobile/reader/ai/define', { text: cleanText });
            setDefinition(res.data.definition);
            setExample(res.data.example);
        } catch (e) {
            setDefinition("Não foi possível carregar a definição.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(text);
        // Opcional: Feedback visual
    };

    if (!visible) return null;

    return (
        <Animated.View 
            entering={FadeInUp.springify().damping(15)}
            exiting={FadeOutUp.duration(200)}
            style={{
                position: 'absolute',
                top: 50, // Logo abaixo do notch/status bar
                left: 10,
                right: 10,
                zIndex: 100,
            }}
        >
            <View className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Header: Texto Selecionado */}
                <View className="px-4 py-3 border-b border-zinc-800/50 flex-row justify-between items-start bg-zinc-900">
                    <View className="flex-1 mr-4">
                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-1">Selecionado</Text>
                        <Text className="text-white font-serif italic text-sm leading-5" numberOfLines={2}>
                            "{text}"
                        </Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity onPress={handleCopy} className="p-2 bg-zinc-800 rounded-full">
                            <Copy size={16} color="#a1a1aa" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full">
                            <X size={16} color="#a1a1aa" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Área IA: Dicionário/Contexto */}
                <View className="p-4 bg-zinc-900/50">
                    <View className="flex-row items-center gap-2 mb-2">
                        <Sparkles size={14} color="#818cf8" />
                        <Text className="text-indigo-400 text-xs font-bold uppercase">Readeek AI</Text>
                    </View>

                    {loading ? (
                        <View className="flex-row items-center gap-2 py-2">
                            <ActivityIndicator size="small" color="#818cf8" />
                            <Text className="text-zinc-500 text-xs">Consultando dicionário inteligente...</Text>
                        </View>
                    ) : (
                        <View>
                            <Text className="text-zinc-200 text-sm leading-5 mb-1">
                                {definition || "Selecione um texto para ver o significado."}
                            </Text>
                            {example && (
                                <Text className="text-zinc-500 text-xs italic mt-1 pl-2 border-l-2 border-zinc-700">
                                    Ex: {example}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Footer: Cores para Salvar */}
                <View className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex-row items-center justify-between">
                    <Text className="text-zinc-500 text-[10px] font-bold uppercase mr-3">Salvar Destaque</Text>
                    <View className="flex-row gap-3">
                        {COLORS.map((color) => (
                            <TouchableOpacity
                                key={color.id}
                                onPress={() => onHighlight(color.id)}
                                className="w-8 h-8 rounded-full items-center justify-center border-2 border-zinc-800"
                                style={{ backgroundColor: color.value }}
                            >
                                {/* Efeito de clique implícito */}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </View>
        </Animated.View>
    );
};