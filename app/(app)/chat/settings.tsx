import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Image as ImageIcon, Check, RotateCcw, Trash2, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../../stores/useThemeStore';

// Paletas (Mantidas igual)
const COLOR_PALETTES = [
  { name: 'Original', mine: '#059669', other: '#27272a' },
  { name: 'Oceano', mine: '#0ea5e9', other: '#1e293b' },
  { name: 'Roxo', mine: '#9333ea', other: '#2e1065' },
  { name: 'Rosa', mine: '#db2777', other: '#4a044e' },
  { name: 'Laranja', mine: '#f97316', other: '#431407' },
  { name: 'Minimal', mine: '#52525b', other: '#18181b' },
];

export default function ChatSettingsScreen() {
  const router = useRouter();
  const { wallpaper, myBubbleColor, otherBubbleColor, updateTheme, resetTheme } = useThemeStore();

  // Estados locais para edição (Draft)
  const [draftWallpaper, setDraftWallpaper] = useState<string | null>(wallpaper);
  const [draftMine, setDraftMine] = useState(myBubbleColor);
  const [draftOther, setDraftOther] = useState(otherBubbleColor);
  const [saving, setSaving] = useState(false);

  // Verifica se houve mudanças para habilitar o botão salvar
  const hasChanges = 
    draftWallpaper !== wallpaper || 
    draftMine !== myBubbleColor || 
    draftOther !== otherBubbleColor;

  const pickWallpaper = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setDraftWallpaper(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        await updateTheme(draftMine, draftOther, draftWallpaper);
        Alert.alert("Sucesso", "Tema atualizado!");
        router.back();
    } catch (error) {
        Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
        setSaving(false);
    }
  };

  const handleReset = () => {
    setDraftWallpaper(null);
    setDraftMine('#059669');
    setDraftOther('#27272a');
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="flex-1">
        {/* Header com Ação de Salvar */}
        <View className="px-4 py-4 flex-row items-center justify-between border-b border-zinc-900 bg-zinc-950 z-10">
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1 rounded-full bg-zinc-900">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white font-bold text-xl">Personalização</Text>
            </View>
            
            {hasChanges && (
                <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={saving}
                    className="bg-emerald-600 px-4 py-2 rounded-full flex-row items-center gap-2"
                >
                    {saving ? <ActivityIndicator size="small" color="white" /> : (
                        <>
                            <Save size={16} color="white" />
                            <Text className="text-white font-bold text-xs">Salvar</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            
            {/* --- PRÉVIA --- */}
            <View className="h-80 w-full relative mb-6">
                <ImageBackground 
                    source={draftWallpaper ? { uri: draftWallpaper } : undefined}
                    className="w-full h-full bg-zinc-900 justify-center px-4 py-6"
                    resizeMode="cover"
                >
                    {!draftWallpaper && (
                        <Text className="text-zinc-600 text-center absolute self-center top-10">Sem Papel de Parede</Text>
                    )}

                    {/* Mockup Balões */}
                    <View className="w-full gap-3">
                        <View className="flex-row items-end self-start max-w-[80%]">
                            <View className="w-8 h-8 rounded-full bg-zinc-700 mr-2" />
                            <View className="px-4 py-3 rounded-2xl rounded-tl-none" style={{ backgroundColor: draftOther }}>
                                <Text className="text-white text-sm">Visualizando alterações...</Text>
                            </View>
                        </View>

                        <View className="flex-row items-end self-end max-w-[80%]">
                            <View className="px-4 py-3 rounded-2xl rounded-tr-none" style={{ backgroundColor: draftMine }}>
                                <Text className="text-white text-sm">Cores selecionadas!</Text>
                                <View className="flex-row justify-end mt-1 items-center gap-1">
                                    <Text className="text-[10px] text-white/70">10:42</Text>
                                    <Check size={12} color="white" />
                                </View>
                            </View>
                        </View>
                    </View>
                </ImageBackground>

                {/* Controles Wallpaper */}
                <View className="absolute bottom-4 right-4 flex-row gap-2">
                    {draftWallpaper && (
                        <TouchableOpacity 
                            onPress={() => setDraftWallpaper(null)}
                            className="bg-red-500/80 p-3 rounded-full backdrop-blur-sm"
                        >
                            <Trash2 size={20} color="white" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        onPress={pickWallpaper}
                        className="bg-black/60 p-3 rounded-full border border-white/20 backdrop-blur-sm flex-row items-center gap-2"
                    >
                        <ImageIcon size={20} color="white" />
                        <Text className="text-white font-bold text-xs">Alterar Fundo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- PALETAS --- */}
            <View className="px-6">
                <Text className="text-zinc-400 font-bold uppercase text-xs mb-4 tracking-widest">Esquema de Cores</Text>
                
                <View className="flex-row flex-wrap gap-4 justify-between">
                    {COLOR_PALETTES.map((palette) => {
                        const isSelected = draftMine === palette.mine;
                        return (
                            <TouchableOpacity 
                                key={palette.name}
                                onPress={() => { setDraftMine(palette.mine); setDraftOther(palette.other); }}
                                className={`w-[47%] p-3 rounded-xl border-2 ${isSelected ? 'border-white bg-zinc-800' : 'border-zinc-800 bg-zinc-900'} mb-2`}
                            >
                                <View className="flex-row justify-between mb-2">
                                    <Text className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{palette.name}</Text>
                                    {isSelected && <Check size={16} color="#10b981" />}
                                </View>
                                <View className="flex-row gap-2">
                                    <View className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: palette.other }} />
                                    <View className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: palette.mine }} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity 
                    onPress={handleReset}
                    className="mt-8 flex-row items-center justify-center p-4 rounded-xl border border-zinc-800"
                >
                    <RotateCcw size={18} color="#71717a" style={{ marginRight: 8 }} />
                    <Text className="text-zinc-400 font-bold">Restaurar Padrão</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}