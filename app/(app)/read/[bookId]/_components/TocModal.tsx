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
    previews: Record<string, string>; // Objeto com os textos extraídos (chave = href)
    onSelectChapter: (href: string) => void;
}

export const TocModal = ({ visible, onClose, toc, previews, onSelectChapter }: Props) => {
    
    // Renderiza cada linha do capítulo
    const renderItem = ({ item, index }: { item: TocItem, index: number }) => {
        // Tenta buscar o texto de preview correspondente a este capítulo
        const previewText = previews ? previews[item.href] : null;

        return (
            <TouchableOpacity 
                onPress={() => onSelectChapter(item.href)}
                activeOpacity={0.7}
                className="py-4 px-5 border-b border-zinc-800 active:bg-zinc-800/50"
            >
                <View className="flex-row justify-between items-start mb-1">
                    <Text 
                        className="text-zinc-200 font-bold text-base flex-1 mr-4" 
                        numberOfLines={1}
                    >
                        {item.label.trim()}
                    </Text>
                    
                    {/* Indicador numérico discreto */}
                    <Text className="text-zinc-600 text-[10px] font-medium mt-1">
                        #{index + 1}
                    </Text>
                </View>

                {/* Exibição do Conteúdo */}
                {previewText ? (
                    <Text 
                        className="text-zinc-500 text-xs leading-5" 
                        numberOfLines={2}
                    >
                        {previewText}...
                    </Text>
                ) : (
                    // Skeleton Loader (Barrinhas cinzas enquanto carrega o texto)
                    <View className="mt-2 opacity-20">
                        <View className="h-2 w-3/4 bg-zinc-600 rounded-full mb-1" />
                        <View className="h-2 w-1/2 bg-zinc-600 rounded-full" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent 
            onRequestClose={onClose}
        >
            {/* Overlay Escuro */}
            <View className="flex-1 bg-black/60">
                
                {/* Container do Modal (Estilo Bottom Sheet Expandido) */}
                <View className="flex-1 bg-zinc-900 mt-20 rounded-t-[32px] overflow-hidden shadow-2xl shadow-black border-t border-zinc-800">
                    
                    {/* Header do Modal */}
                    <View className="px-6 py-5 border-b border-zinc-800 flex-row justify-between items-center bg-zinc-900 z-10">
                        <View>
                            <Text className="text-white font-black text-2xl">Índice</Text>
                            <Text className="text-zinc-500 text-xs mt-0.5 font-medium">
                                {toc.length} {toc.length === 1 ? 'seção encontrada' : 'seções encontradas'}
                            </Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={onClose} 
                            className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700 active:bg-zinc-700"
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