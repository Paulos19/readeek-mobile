import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Image as ImageIcon, Send, Quote, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../../../lib/api';

interface Highlight {
    id: string;
    text: string;
    color: string;
    cfiRange: string;
}

interface Props {
    visible: boolean;
    highlight: Highlight | null;
    bookTitle: string;
    onClose: () => void;
}

export const HighlightShareModal = ({ visible, highlight, bookTitle, onClose }: Props) => {
    const [caption, setCaption] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);

    if (!visible || !highlight) return null;

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handlePost = async () => {
        if (!caption.trim() && !imageUri) {
            Alert.alert("Atenção", "Escreva algo sobre esse trecho.");
            return;
        }

        setPosting(true);
        try {
            const formData = new FormData();
            formData.append('content', caption);
            formData.append('type', 'EXCERPT'); // Tipo específico para citações
            formData.append('bookTitle', bookTitle);
            formData.append('quoteText', highlight.text);
            
            if (imageUri) {
                const filename = imageUri.split('/').pop() || 'share.jpg';
                // @ts-ignore
                formData.append('file', { uri: imageUri, name: filename, type: 'image/jpeg' });
            }

            await api.post('/mobile/social/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert("Sucesso", "Compartilhado no feed!");
            setCaption('');
            setImageUri(null);
            onClose();
        } catch (error) {
            Alert.alert("Erro", "Não foi possível postar.");
        } finally {
            setPosting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800 h-[85%]">
                        
                        {/* Header */}
                        <View className="px-6 py-4 border-b border-zinc-800 flex-row justify-between items-center">
                            <Text className="text-white font-bold text-lg">Compartilhar Trecho</Text>
                            <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
                                <X size={20} color="#a1a1aa" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-6 flex-1">
                            {/* Input do Usuário */}
                            <TextInput 
                                placeholder="O que você achou desse trecho?"
                                placeholderTextColor="#71717a"
                                multiline
                                value={caption}
                                onChangeText={setCaption}
                                className="text-zinc-200 text-base mb-6 min-h-[60px]"
                                textAlignVertical="top"
                            />

                            {/* Preview do Card de Citação */}
                            <View className="bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 relative min-h-[200px] justify-center shadow-lg">
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} className="absolute inset-0 w-full h-full opacity-40" resizeMode="cover" />
                                ) : (
                                    <LinearGradient 
                                        colors={['#3f3f46', '#18181b']} 
                                        className="absolute inset-0 w-full h-full opacity-50"
                                    />
                                )}
                                
                                <View className="p-6 relative z-10">
                                    <Quote size={24} color="#10b981" style={{ marginBottom: 12, opacity: 0.8 }} />
                                    <Text className="text-white font-serif italic text-lg leading-7 shadow-black shadow-md">
                                        "{highlight.text.length > 150 ? highlight.text.substring(0, 150) + '...' : highlight.text}"
                                    </Text>
                                    <Text className="text-zinc-400 text-xs font-bold mt-4 uppercase tracking-widest text-right">
                                        — {bookTitle}
                                    </Text>
                                </View>
                            </View>

                            {/* Botões de Mídia */}
                            <View className="flex-row mt-6 gap-3">
                                <TouchableOpacity 
                                    onPress={pickImage} 
                                    className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border border-dashed ${imageUri ? 'border-red-500/30 bg-red-500/10' : 'border-zinc-700 bg-zinc-800'}`}
                                >
                                    {imageUri ? (
                                        <>
                                            <Trash2 size={18} color="#ef4444" />
                                            <Text className="text-red-400 font-bold ml-2">Remover Foto</Text>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={18} color="#e4e4e7" />
                                            <Text className="text-zinc-300 font-bold ml-2">Adicionar Fundo</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="p-6 border-t border-zinc-800 bg-zinc-900 pb-10">
                            <TouchableOpacity 
                                onPress={handlePost}
                                disabled={posting}
                                className={`w-full py-4 rounded-xl flex-row items-center justify-center ${posting ? 'bg-zinc-700' : 'bg-emerald-600'}`}
                            >
                                {posting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Send size={20} color="white" />
                                        <Text className="text-white font-bold text-base ml-2">Publicar no Feed</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};