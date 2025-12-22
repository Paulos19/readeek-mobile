import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Sun, Moon, Type } from 'lucide-react-native';
import { THEMES } from '../_hooks/useReader';

interface Props {
    visible: boolean;
    onClose: () => void;
    fontSize: number;
    currentTheme: string;
    onChangeFont: (delta: number) => void;
    onChangeTheme: (theme: 'dark' | 'light' | 'sepia') => void;
}

export const SettingsModal = ({ visible, onClose, fontSize, currentTheme, onChangeFont, onChangeTheme }: Props) => {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
          <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/40 justify-end">
              <View className="bg-zinc-900 p-6 rounded-t-3xl border-t border-zinc-800" onStartShouldSetResponder={() => true}>
                  <Text className="text-white font-bold text-lg mb-6">Aparência</Text>
                  
                  <View className="flex-row items-center justify-between mb-8 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                      <TouchableOpacity onPress={() => onChangeFont(-10)} className="p-2 px-4"><Text className="text-zinc-400 font-bold text-xl">A-</Text></TouchableOpacity>
                      <Text className="text-white font-bold">{fontSize}%</Text>
                      <TouchableOpacity onPress={() => onChangeFont(10)} className="p-2 px-4"><Text className="text-white font-bold text-2xl">A+</Text></TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between gap-4">
                      {Object.entries(THEMES).map(([key, theme]) => (
                          <TouchableOpacity
                              key={key}
                              onPress={() => onChangeTheme(key as any)}
                              className={`flex-1 p-4 rounded-xl border-2 items-center ${currentTheme === key ? 'border-emerald-500' : 'border-zinc-800'}`}
                              style={{ backgroundColor: theme.bg }}
                          >
                              <View className="flex-row items-center gap-2">
                                  {key === 'light' ? <Sun size={16} color={theme.text} /> : 
                                   key === 'dark' ? <Moon size={16} color={theme.text} /> : 
                                   <Type size={16} color={theme.text} />}
                                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>{theme.name}</Text>
                              </View>
                          </TouchableOpacity>
                      ))}
                  </View>
              </View>
          </TouchableOpacity>
      </Modal>
    );
};