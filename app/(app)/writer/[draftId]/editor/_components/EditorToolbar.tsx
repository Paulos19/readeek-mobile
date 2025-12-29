import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, Pressable, ScrollView, Image } from 'react-native';
import { 
  Bold, Italic, Underline, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, 
  MoreHorizontal, Check, Type, Sparkles, Image as ImageIcon, Trash2 
} from 'lucide-react-native';

export type ThemeType = 'dark' | 'light' | 'sepia';

const TEXT_COLORS = [
    { label: 'Padrão', value: '' },
    { label: 'Preto', value: '#000000' },
    { label: 'Branco', value: '#ffffff' },
    { label: 'Cinza', value: '#52525b' },
    { label: 'Azul', value: '#3b82f6' },
    { label: 'Sépia', value: '#433422' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Vermelho', value: '#ef4444' },
];

interface EditorToolbarProps {
  onFormat: (type: string) => void;
  activeFormats: string[]; 
  onThemeChange: (theme: ThemeType) => void;
  currentTheme: ThemeType;
  onAiFix: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  backgroundImage: string | null;
  onTextColorChange: (color: string) => void;
  customTextColor: string;
}

export function EditorToolbar({ 
  onFormat, 
  activeFormats = [],
  onThemeChange, 
  currentTheme,
  onAiFix,
  onPickImage,
  onRemoveImage,
  backgroundImage,
  onTextColorChange,
  customTextColor
}: EditorToolbarProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const hasWallpaper = !!backgroundImage;

  const getIconColor = (isActive: boolean) => {
    if (isActive) return '#10b981'; // Emerald-500
    // Se tiver wallpaper, forçamos ícones claros ou escuros dependendo do contraste, 
    // mas geralmente branco/cinza claro funciona melhor em overlays.
    if (hasWallpaper) return isActive ? '#10b981' : '#f4f4f5'; 
    
    switch(currentTheme) {
        case 'light': return '#18181b'; 
        case 'sepia': return '#5b4636'; 
        default: return '#e4e4e7'; 
    }
  };

  // Estilo do Container Principal
  const containerStyle = hasWallpaper 
    ? 'bg-transparent border-t-0 pb-5' // Flutuante
    : currentTheme === 'light' ? 'bg-white border-zinc-200' 
    : currentTheme === 'sepia' ? 'bg-[#f4ecd8] border-[#eaddc5]' 
    : 'bg-zinc-900 border-zinc-800';

  // Estilo das "Cápsulas" (Cards flutuantes para os botões)
  const capsuleStyle = hasWallpaper
    ? 'bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 mx-1 px-1'
    : 'px-1'; // Sem estilo especial se não tiver wallpaper

  const FormatBtn = ({ type, icon: Icon, size = 22 }: any) => {
    const isActive = activeFormats.includes(type);
    if (!Icon) return null;

    return (
      <TouchableOpacity 
        onPress={() => onFormat(type)} 
        className={`p-2 rounded-lg mx-0.5 ${isActive ? 'bg-white/20' : ''}`}
      >
        <Icon size={size} color={getIconColor(isActive)} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View className={`w-full flex-row items-center z-50 ${containerStyle}`}>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
        >
            {/* Grupo IA */}
            <View className={hasWallpaper ? `mr-2 ${capsuleStyle}` : "mr-2"}>
                <TouchableOpacity 
                    onPress={onAiFix}
                    className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30"
                >
                    <Sparkles size={22} color="#818cf8" />
                </TouchableOpacity>
            </View>

            {/* Grupo Formatação Texto */}
            <View className={`flex-row items-center ${capsuleStyle}`}>
                <FormatBtn type="bold" icon={Bold} />
                <FormatBtn type="italic" icon={Italic} />
                <FormatBtn type="underline" icon={Underline} />
            </View>

            {/* Separador (apenas visual se não tiver wallpaper) */}
            {!hasWallpaper && <View className="w-[1px] h-6 bg-zinc-500/30 mx-2" />}

            {/* Grupo Cabeçalhos */}
            <View className={`flex-row items-center ml-2 ${capsuleStyle}`}>
                <FormatBtn type="h1" icon={Heading1} size={24} />
                <FormatBtn type="h2" icon={Heading2} size={24} />
                <FormatBtn type="p" icon={Type} size={20} />
            </View>

            {/* Grupo Listas */}
            <View className={`flex-row items-center ml-2 ${capsuleStyle}`}>
                <FormatBtn type="unorderedList" icon={List} />
                <FormatBtn type="orderedList" icon={ListOrdered} />
                <FormatBtn type="blockquote" icon={Quote} />
            </View>

        </ScrollView>

        {/* Botão Menu */}
        <View className={hasWallpaper ? "mr-4" : `border-l pl-2 pr-4 py-3 ${currentTheme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
             <TouchableOpacity 
                onPress={() => setMenuVisible(true)}
                className={hasWallpaper ? "p-2 bg-black/40 rounded-full border border-white/10" : ""}
             >
                <MoreHorizontal size={22} color={getIconColor(false)} />
             </TouchableOpacity>
        </View>
      </View>

      {/* MODAL DE PERSONALIZAÇÃO */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60" onPress={() => setMenuVisible(false)}>
            <View className="absolute bottom-24 right-4 w-72 bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-2xl">
                
                {/* 1. Papel de Parede */}
                <Text className="text-zinc-500 text-xs font-bold uppercase mb-3 ml-1">Papel de Parede</Text>
                <View className="flex-row items-center gap-3 mb-4">
                    <TouchableOpacity 
                        onPress={onPickImage}
                        className="flex-1 bg-zinc-800 p-3 rounded-lg flex-row items-center justify-center gap-2 active:bg-zinc-700"
                    >
                        <ImageIcon size={16} color="#e4e4e7" />
                        <Text className="text-zinc-200 text-xs font-medium">Trocar Fundo</Text>
                    </TouchableOpacity>
                    
                    {backgroundImage && (
                        <TouchableOpacity 
                            onPress={onRemoveImage}
                            className="bg-red-500/10 p-3 rounded-lg flex-row items-center justify-center"
                        >
                            <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>

                <View className="h-[1px] bg-zinc-800 mb-4" />

                {/* 2. Cor da Fonte */}
                <Text className="text-zinc-500 text-xs font-bold uppercase mb-3 ml-1">Cor do Texto</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {TEXT_COLORS.map((color) => (
                        <TouchableOpacity 
                            key={color.label}
                            onPress={() => onTextColorChange(color.value)}
                            className="mr-3 items-center gap-1"
                        >
                            <View 
                                style={{ backgroundColor: color.value || '#71717a' }} 
                                className={`w-8 h-8 rounded-full border-2 justify-center items-center ${customTextColor === color.value ? 'border-emerald-500' : 'border-zinc-700'}`}
                            >
                                {customTextColor === color.value && <Check size={12} color={color.value === '#ffffff' ? '#000' : '#fff'} />}
                                {color.value === '' && <View className="w-[2px] h-8 bg-red-500 rotate-45 absolute" />}
                            </View>
                            <Text className="text-zinc-500 text-[10px]">{color.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View className="h-[1px] bg-zinc-800 mb-4" />

                {/* 3. Temas Padrão (Base) */}
                <Text className="text-zinc-500 text-xs font-bold uppercase mb-3 ml-1">Tema Base</Text>
                <View className="flex-row gap-3 justify-between">
                    <ThemeOption label="Dark" color="#18181b" active={currentTheme === 'dark'} onPress={() => onThemeChange('dark')} />
                    <ThemeOption label="Light" color="#ffffff" active={currentTheme === 'light'} onPress={() => onThemeChange('light')} />
                    <ThemeOption label="Sépia" color="#f4ecd8" active={currentTheme === 'sepia'} onPress={() => onThemeChange('sepia')} />
                </View>
            </View>
        </Pressable>
      </Modal>
    </>
  );
}

function ThemeOption({ label, color, active, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} className="items-center gap-2">
            <View style={{ backgroundColor: color }} className={`w-12 h-12 rounded-full border-2 justify-center items-center ${active ? 'border-emerald-500' : 'border-zinc-700'}`}>
                {active && <Check size={16} color={label === 'Light' || label === 'Sépia' ? '#000' : '#fff'} />}
            </View>
            <Text className="text-zinc-400 text-[10px]">{label}</Text>
        </TouchableOpacity>
    );
}