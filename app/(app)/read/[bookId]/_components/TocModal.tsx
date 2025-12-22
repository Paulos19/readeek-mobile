import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { X, ListX } from 'lucide-react-native';

// Interface para o item do índice (baseado no que o epub.js retorna)
interface TocItem {
    label: string;
    href: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    toc: TocItem[];
    onSelectChapter: (href: string) => void;
}

export const TocModal = ({ visible, onClose, toc, onSelectChapter }: Props) => {
    
    // Renderiza cada linha do capítulo
    const renderItem = ({ item, index }: { item: TocItem, index: number }) => (
        <TouchableOpacity 
            onPress={() => onSelectChapter(item.href)}
            activeOpacity={0.7}
            className="py-4 px-4 border-b border-zinc-800 active:bg-zinc-800/50"
        >
            <Text 
                className="text-zinc-300 font-medium text-base" 
                numberOfLines={1}
            >
                {item.label.trim()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent 
            onRequestClose={onClose}
        >
            {/* Overlay Escuro */}
            <View className="flex-1 bg-black/60">
                
                {/* Container do Modal (Bottom Sheet style, mas ocupando quase tudo) */}
                <View className="flex-1 bg-zinc-900 mt-24 rounded-t-3xl overflow-hidden shadow-2xl shadow-black">
                    
                    {/* Header do Modal */}
                    <View className="px-5 py-4 border-b border-zinc-800 flex-row justify-between items-center bg-zinc-900 z-10">
                        <View>
                            <Text className="text-white font-bold text-xl">Índice</Text>
                            <Text className="text-zinc-500 text-xs mt-0.5">
                                {toc.length} {toc.length === 1 ? 'capítulo' : 'capítulos'}
                            </Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={onClose} 
                            className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
                        >
                            <X color="#e4e4e7" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Lista de Capítulos */}
                    {toc.length > 0 ? (
                        <FlatList
                            data={toc}
                            keyExtractor={(item, index) => item.href + index} // href + index garante chave única
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={true}
                            indicatorStyle="white"
                        />
                    ) : (
                        // Estado Vazio (Caso o EPUB não tenha TOC legível)
                        <View className="flex-1 items-center justify-center p-8 opacity-50">
                            <ListX size={48} color="#71717a" />
                            <Text className="text-zinc-500 text-center mt-4 text-lg">
                                Sumário indisponível para este livro.
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};