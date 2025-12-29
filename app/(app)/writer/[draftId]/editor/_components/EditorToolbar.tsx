import React from 'react';
import { View, TouchableOpacity, ScrollView, Text } from 'react-native';
import { Bold, Italic, Heading1, Heading2, Quote, List, Minus } from 'lucide-react-native';

interface EditorToolbarProps {
  onInsert: (tag: string, wrapper?: string) => void;
}

export const EditorToolbar = ({ onInsert }: EditorToolbarProps) => {
  const tools = [
    { icon: Bold, label: 'Negrito', action: () => onInsert('**', '**') },
    { icon: Italic, label: 'Itálico', action: () => onInsert('_', '_') },
    { icon: Heading1, label: 'Título', action: () => onInsert('# ', '') },
    { icon: Heading2, label: 'Sub-capítulo', action: () => onInsert('## ', '') }, // Sub-capítulos
    { icon: Quote, label: 'Citação', action: () => onInsert('> ', '') },
    { icon: List, label: 'Lista', action: () => onInsert('- ', '') },
    { icon: Minus, label: 'Separador', action: () => onInsert('\n---\n', '') },
  ];

  return (
    <View className="h-12 bg-zinc-900 border-t border-zinc-800 flex-row items-center px-2 w-full">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
        {tools.map((tool, index) => (
          <TouchableOpacity 
            key={index}
            onPress={tool.action}
            className="w-10 h-10 items-center justify-center mr-1 rounded-lg active:bg-zinc-800"
          >
            <tool.icon size={20} color="#e4e4e7" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};