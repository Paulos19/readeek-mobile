import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, Pressable, ScrollView } from 'react-native';
import { 
  Bold, Italic, Underline, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, 
  MoreHorizontal, Palette, Check 
} from 'lucide-react-native';

export type ThemeType = 'dark' | 'light' | 'sepia';

interface EditorToolbarProps {
  onFormat: (type: string) => void;
  activeFormats: string[]; // Lista de formatos ativos onde o cursor está
  onThemeChange: (theme: ThemeType) => void;
  currentTheme: ThemeType;
}

export function EditorToolbar({ 
  onFormat, 
  activeFormats = [],
  onThemeChange, 
  currentTheme,
}: EditorToolbarProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const getIconColor = (isActive: boolean) => {
    if (isActive) return '#10b981'; // Emerald-500 (Ativo)
    
    switch(currentTheme) {
        case 'light': return '#18181b'; 
        case 'sepia': return '#5b4636'; 
        default: return '#e4e4e7'; 
    }
  };

  const bgStyle = currentTheme === 'light' ? 'bg-white border-zinc-200' : 
                  currentTheme === 'sepia' ? 'bg-[#f4ecd8] border-[#eaddc5]' : 
                  'bg-zinc-900 border-zinc-800';

  // Componente de Botão para evitar repetição
  const FormatBtn = ({ type, icon: Icon, size = 22 }: any) => {
    const isActive = activeFormats.includes(type);
    return (
      <TouchableOpacity 
        onPress={() => onFormat(type)} 
        className={`p-2 rounded-lg ${isActive ? 'bg-black/10 dark:bg-white/10' : ''}`}
      >
        <Icon size={size} color={getIconColor(isActive)} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View className={`w-full border-t flex-row items-center shadow-lg z-50 ${bgStyle}`}>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' }}
        >
            <FormatBtn type="bold" icon={Bold} />
            <FormatBtn type="italic" icon={Italic} />
            <FormatBtn type="underline" icon={Underline} />
            
            <View className="w-[1px] h-6 bg-zinc-500/30 mx-1" />

            {/* Cabeçalhos */}
            <FormatBtn type="h1" icon={Heading1} />
            <FormatBtn type="h2" icon={Heading2} />
            <FormatBtn type="h3" icon={Heading3} />

            <View className="w-[1px] h-6 bg-zinc-500/30 mx-1" />

            <FormatBtn type="unorderedList" icon={List} />
            <FormatBtn type="orderedList" icon={ListOrdered} />
            <FormatBtn type="blockquote" icon={Quote} />

        </ScrollView>

        {/* Botão de Menu Fixo à Direita */}
        <View className={`border-l pl-2 pr-4 py-3 ${currentTheme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
             <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <MoreHorizontal size={22} color={getIconColor(false)} />
             </TouchableOpacity>
        </View>
      </View>

      {/* MODAL DE TEMAS */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60" onPress={() => setMenuVisible(false)}>
            <View className="absolute bottom-24 right-4 w-64 bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-2xl">
                <Text className="text-zinc-500 text-xs font-bold uppercase mb-3 ml-1">Aparência do Editor</Text>
                
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