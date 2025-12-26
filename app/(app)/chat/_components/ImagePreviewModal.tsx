import React, { useState } from 'react';
import { View, Modal, Image, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { X, Download } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ visible, imageUrl, onClose }: ImagePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  if (!imageUrl) return null;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // 1. CORREÇÃO PRINCIPAL: Passar 'true' para pedir apenas permissão de ESCRITA
      // Isso evita o erro de "AUDIO permission not declared" no Android
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      
      if (status !== 'granted') {
        Alert.alert("Permissão negada", "Vá em Configurações > Permissões e habilite o acesso à galeria.");
        setSaving(false);
        return;
      }

      // 2. Definir nome do arquivo seguro
      const timestamp = new Date().getTime();
      const fileExtension = imageUrl.includes('.png') ? '.png' : '.jpg';
      const fileName = `readeek_${timestamp}${fileExtension}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // 3. Baixar para o Cache Local
      const downloadRes = await FileSystem.downloadAsync(imageUrl, fileUri);

      if (downloadRes.status !== 200) {
        throw new Error("Falha no download da imagem");
      }

      // 4. Salvar na Galeria
      await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
      
      Alert.alert("Sucesso", "Imagem salva na sua galeria!");

    } catch (error) {
      console.error("Erro detalhado ao salvar:", error);
      Alert.alert("Erro", "Não foi possível salvar a imagem. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/95 justify-center items-center relative">
        
        {/* Header Actions */}
        <View 
            className="absolute top-0 w-full flex-row justify-between items-center px-4 z-50"
            style={{ paddingTop: insets.top + 10 }}
        >
            <TouchableOpacity 
                onPress={onClose}
                className="w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/20"
            >
                <X size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={handleSave}
                disabled={saving}
                className="bg-white/10 px-4 py-2 rounded-full border border-white/20 flex-row items-center gap-2"
            >
                {saving ? <ActivityIndicator size="small" color="white" /> : (
                    <>
                        <Download size={20} color="white" />
                        <Text className="text-white font-bold text-xs">Salvar</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>

        {/* Imagem Central */}
        <Image 
            source={{ uri: imageUrl }} 
            className="w-full h-full" 
            resizeMode="contain"
        />
        
      </View>
    </Modal>
  );
}