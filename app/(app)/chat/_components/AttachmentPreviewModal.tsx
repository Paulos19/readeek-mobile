import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Send, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type AttachmentType = {
  type: 'IMAGE' | 'FILE';
  uri: string;
  name?: string;
  mimeType?: string;
  size?: number;
};

interface AttachmentPreviewModalProps {
  visible: boolean;
  attachment: AttachmentType | null;
  onClose: () => void;
  onSend: (text: string, attachment: AttachmentType) => void;
  themeColor: string; // Para manter a cor do tema do usuário
}

export function AttachmentPreviewModal({ visible, attachment, onClose, onSend, themeColor }: AttachmentPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState('');

  if (!attachment) return null;

  const handleSend = () => {
    onSend(caption, attachment);
    setCaption(''); // Limpa para a próxima
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black relative"
      >
        {/* Header (Botão Fechar) */}
        <View 
            className="absolute top-0 left-0 z-50 p-4"
            style={{ marginTop: insets.top }}
        >
            <TouchableOpacity 
                onPress={onClose}
                className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"
            >
                <X size={24} color="white" />
            </TouchableOpacity>
        </View>

        {/* --- ÁREA DE CONTEÚDO (PREVIEW) --- */}
        <View className="flex-1 justify-center items-center bg-zinc-950">
            {attachment.type === 'IMAGE' ? (
                <Image 
                    source={{ uri: attachment.uri }} 
                    className="w-full h-full" 
                    resizeMode="contain"
                />
            ) : (
                // Preview de Arquivo Genérico
                <View className="items-center p-8 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <View className="w-24 h-24 bg-zinc-800 rounded-full items-center justify-center mb-4 border border-zinc-700">
                        <FileText size={48} color="#a1a1aa" />
                    </View>
                    <Text className="text-white font-bold text-xl text-center mb-1">
                        {attachment.name || 'Documento'}
                    </Text>
                    <Text className="text-zinc-500 text-sm">
                        {attachment.size ? (attachment.size / 1024 / 1024).toFixed(2) + ' MB' : 'Arquivo'}
                    </Text>
                </View>
            )}
        </View>

        {/* --- BARRA DE LEGENDA --- */}
        <View 
            className="bg-black/80 px-4 pt-4 border-t border-zinc-800 absolute bottom-0 w-full"
            style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20 }}
        >
            <View className="flex-row items-end gap-3">
                <TextInput
                    className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-3xl border border-zinc-800 min-h-[50px] max-h-32 text-base"
                    placeholder="Adicionar legenda..."
                    placeholderTextColor="#71717a"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    textAlignVertical="center"
                    autoFocus={attachment.type === 'FILE'} // Foca se for arquivo
                />
                
                <TouchableOpacity 
                    onPress={handleSend}
                    className="w-12 h-12 rounded-full items-center justify-center mb-0.5 shadow-lg shadow-black"
                    style={{ backgroundColor: themeColor }}
                >
                    <Send size={22} color="white" style={{ marginLeft: 3 }} />
                </TouchableOpacity>
            </View>
        </View>

      </KeyboardAvoidingView>
    </Modal>
  );
}