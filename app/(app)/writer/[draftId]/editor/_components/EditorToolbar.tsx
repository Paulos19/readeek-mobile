import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, Pressable, ScrollView } from 'react-native';
import { 
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Quote, 
  MoreHorizontal, Check, Type, Sparkles, Image as ImageIcon, Trash2 
} from 'lucide-react-native';

export type ThemeType = 'dark' | 'light' | 'sepia';

// LISTA DE FONTES
const FONTS = [
    { label: 'Merriweather', value: "'Merriweather', serif", type: 'Serif' },
    { label: 'Roboto', value: "'Roboto', sans-serif", type: 'Sans' },
    { label: 'Lora', value: "'Lora', serif", type: 'Serif' },
    { label: 'Crimson', value: "'Crimson Text', serif", type: 'Serif' },
    { label: 'Open Sans', value: "'Open Sans', sans-serif", type: 'Sans' },
    { label: 'Courier', value: "'Courier Prime', monospace", type: 'Mono' },
];

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
  onPickImage: () => void;   // Para upload de fundo (modal)
  onInsertImage: () => void; // Para inserir no texto (toolbar principal)
  onRemoveImage: () => void;
  backgroundImage: string | null;
  onTextColorChange: (color: string) => void;
  customTextColor: string;
  onFontChange: (font: string) => void;
  currentFont: string;
}

export function EditorToolbar({ 
  onFormat, 
  activeFormats = [],
  onThemeChange, 
  currentTheme,
  onAiFix,
  onPickImage,
  onInsertImage,
  onRemoveImage,
  backgroundImage,
  onTextColorChange,
  customTextColor,
  onFontChange,
  currentFont
}: EditorToolbarProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const hasWallpaper = !!backgroundImage;

  const getIconColor = (isActive: boolean) => {
    if (isActive) return '#10b981'; // Emerald-500
    if (hasWallpaper) return '#f4f4f5'; // White-ish
    
    switch(currentTheme) {
        case 'light': return isActive ? '#10b981' : '#18181b'; 
        case 'sepia': return isActive ? '#b45309' : '#5b4636'; 
        default: return isActive ? '#10b981' : '#e4e4e7'; 
    }
  };

  const containerStyle = hasWallpaper 
    ? 'bg-transparent border-t-0 pb-5' 
    : currentTheme === 'light' ? 'bg-white border-zinc-200' 
    : currentTheme === 'sepia' ? 'bg-[#f4ecd8] border-[#eaddc5]' 
    : 'bg-zinc-900 border-zinc-800';

  const capsuleStyle = hasWallpaper
    ? 'bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 mx-1 px-1'
    : 'px-1';

  // Componente de Botão Otimizado
  const FormatBtn = ({ type, icon: Icon, size = 20 }: any) => {
    const isActive = activeFormats.includes(type);
    if (!Icon) return null;

    return (
      <TouchableOpacity 
        onPress={() => onFormat(type)} 
        // Adiciona feedback visual imediato
        activeOpacity={0.6}
        className={`p-2.5 rounded-xl mx-0.5 items-center justify-center ${isActive ? (hasWallpaper ? 'bg-white/20' : 'bg-zinc-800/50') : ''}`}
      >
        <Icon size={size} color={getIconColor(isActive)} strokeWidth={isActive ? 2.5 : 2} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View className={`w-full flex-row items-center z-50 border-t ${containerStyle}`}>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            // --- CORREÇÃO IMPORTANTE: Permite clique enquanto teclado está aberto ---
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}
        >
            
            {/* Botão IA */}
            <View className={hasWallpaper ? `mr-2 ${capsuleStyle}` : "mr-2"}>
                <TouchableOpacity 
                    onPress={onAiFix} 
                    className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 active:bg-indigo-500/20"
                >
                    <Sparkles size={20} color="#818cf8" />
                </TouchableOpacity>
            </View>

            {/* Grupo 1: Estilo de Texto */}
            <View className={`flex-row items-center ${capsuleStyle}`}>
                <FormatBtn type="bold" icon={Bold} />
                <FormatBtn type="italic" icon={Italic} />
                <FormatBtn type="underline" icon={Underline} />
            </View>

            {!hasWallpaper && <View className="w-[1px] h-5 bg-zinc-500/20 mx-2" />}

            {/* Grupo 2: Cabeçalhos */}
            <View className={`flex-row items-center ml-1 ${capsuleStyle}`}>
                <FormatBtn type="h1" icon={Heading1} size={22} />
                <FormatBtn type="h2" icon={Heading2} size={22} />
            </View>

            {/* Grupo 3: Inserções (Imagem) - NOVO */}
            <View className={`flex-row items-center ml-2 ${capsuleStyle}`}>
                 <TouchableOpacity 
                    onPress={onInsertImage}
                    className="p-2.5 rounded-xl mx-0.5 items-center justify-center"
                 >
                    <ImageIcon size={20} color={getIconColor(false)} />
                 </TouchableOpacity>
            </View>

            {/* Grupo 4: Listas e Citações */}
            <View className={`flex-row items-center ml-2 ${capsuleStyle}`}>
                <FormatBtn type="unorderedList" icon={List} />
                <FormatBtn type="orderedList" icon={ListOrdered} />
                <FormatBtn type="blockquote" icon={Quote} />
            </View>
        </ScrollView>

        {/* Botão Mais (Configurações) */}
        <View className={hasWallpaper ? "mr-4" : `border-l pl-2 pr-4 py-3 ${currentTheme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
             <TouchableOpacity 
                onPress={() => setMenuVisible(true)}
                className={hasWallpaper ? "p-2 bg-black/40 rounded-full border border-white/10" : "p-1"}
             >
                <MoreHorizontal size={22} color={getIconColor(false)} />
             </TouchableOpacity>
        </View>
      </View>

      {/* MODAL DE PERSONALIZAÇÃO */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable className="flex-1 bg-black/60" onPress={() => setMenuVisible(false)}>
            <View className="absolute bottom-24 right-4 w-80 bg-zinc-900 rounded-2xl border border-zinc-800 p-5 shadow-2xl">
                
                {/* 1. SELETOR DE FONTE */}
                <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-3 ml-1 tracking-widest">Tipografia</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    className="mb-5 pb-2"
                    keyboardShouldPersistTaps="always"
                >
                    {FONTS.map((font) => {
                        const isSelected = currentFont === font.value;
                        return (
                            <TouchableOpacity 
                                key={font.label}
                                onPress={() => onFontChange(font.value)}
                                className={`mr-2 px-3 py-2 rounded-lg border ${isSelected ? 'bg-indigo-500/20 border-indigo-500' : 'bg-zinc-800 border-zinc-700'}`}
                            >
                                <Text className={`text-sm mb-0.5 ${isSelected ? 'text-indigo-400 font-bold' : 'text-zinc-300'}`}>
                                    {font.label}
                                </Text>
                                <Text className="text-[9px] text-zinc-500 uppercase">{font.type}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>

                <View className="h-[1px] bg-zinc-800 mb-4" />

                {/* 2. Cor da Fonte */}
                <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-3 ml-1 tracking-widest">Cor do Texto</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    className="mb-4"
                    keyboardShouldPersistTaps="always"
                >
                    {TEXT_COLORS.map((color) => (
                        <TouchableOpacity 
                            key={color.label}
                            onPress={() => onTextColorChange(color.value)}
                            className="mr-3 items-center"
                        >
                            <View 
                                style={{ backgroundColor: color.value || '#71717a' }} 
                                className={`w-9 h-9 rounded-full border-2 justify-center items-center ${customTextColor === color.value ? 'border-indigo-500' : 'border-zinc-700'}`}
                            >
                                {customTextColor === color.value && <Check size={14} color={color.value === '#ffffff' ? '#000' : '#fff'} />}
                                {color.value === '' && <View className="w-[2px] h-9 bg-red-500/80 rotate-45 absolute" />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View className="h-[1px] bg-zinc-800 mb-4" />

                {/* 3. Papel de Parede */}
                <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-3 ml-1 tracking-widest">Ambiente</Text>
                <View className="flex-row items-center gap-3 mb-5">
                    <TouchableOpacity onPress={onPickImage} className="flex-1 bg-zinc-800 p-3 rounded-xl flex-row items-center justify-center gap-2 border border-zinc-700 active:bg-zinc-700">
                        <ImageIcon size={16} color="#e4e4e7" />
                        <Text className="text-zinc-200 text-xs font-medium">Trocar Fundo</Text>
                    </TouchableOpacity>
                    {backgroundImage && (
                        <TouchableOpacity onPress={onRemoveImage} className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 active:bg-red-500/20">
                            <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* 4. Tema Base */}
                <View className="flex-row gap-3 justify-between bg-zinc-950/50 p-2 rounded-xl">
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
        <TouchableOpacity onPress={onPress} className="items-center gap-2 flex-1" activeOpacity={0.7}>
            <View style={{ backgroundColor: color }} className={`w-full h-10 rounded-lg border-2 justify-center items-center ${active ? 'border-indigo-500' : 'border-zinc-700'}`}>
                {active && <Check size={16} color={label === 'Light' || label === 'Sépia' ? '#000' : '#fff'} />}
            </View>
            <Text className={`text-[10px] font-medium ${active ? 'text-indigo-400' : 'text-zinc-500'}`}>{label}</Text>
        </TouchableOpacity>
    );
}