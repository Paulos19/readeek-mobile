import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, FlatList } from 'react-native';
import { 
  ArrowLeft, ChevronUp, ChevronDown, Type, List, Highlighter, 
  Sun, Moon, Plus, Minus, X, Trash2, ChevronRight 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Highlight } from 'lib/api';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
    visible: boolean;
    expanded: boolean;
    activeTab: 'settings' | 'chapters' | 'highlights';
    theme: any;
    fontSize: number;
    toc: any[];
    highlights: Highlight[];
    onToggleExpand: () => void;
    onSetTab: (tab: 'settings' | 'chapters' | 'highlights') => void;
    onChangeFont: (delta: number) => void;
    onChangeTheme: (theme: any) => void;
    onSelectChapter: (href: string) => void;
    onDeleteHighlight: (cfi: string, id: string) => void;
    onClose: () => void;
}

export const ReaderMenu = ({
    visible, expanded, activeTab, theme, fontSize, toc, highlights,
    onToggleExpand, onSetTab, onChangeFont, onChangeTheme, onSelectChapter, onDeleteHighlight, onClose
}: Props) => {
    const router = useRouter();

    if (!visible) return null;

    // --- CONTEÚDO DAS ABAS ---

    const renderSettings = () => (
        <View className="p-4 space-y-6">
            <View className="bg-zinc-800 p-4 rounded-xl flex-row items-center justify-between">
                <TouchableOpacity onPress={() => onChangeFont(-10)} className="p-2 bg-zinc-700 rounded-lg"><Minus color="#fff" size={20}/></TouchableOpacity>
                <Text className="text-white font-bold text-xl">{fontSize}%</Text>
                <TouchableOpacity onPress={() => onChangeFont(10)} className="p-2 bg-zinc-700 rounded-lg"><Plus color="#fff" size={20}/></TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
                {['light', 'sepia', 'dark'].map((t) => (
                    <TouchableOpacity 
                        key={t} 
                        onPress={() => onChangeTheme(t)}
                        className={`flex-1 p-4 rounded-xl border-2 items-center ${theme.ui === t || (theme.ui === 'dark' && t === 'dark' && theme.bg === '#09090b') ? 'border-emerald-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-900'}`}
                    >
                         {t === 'light' && <Sun color="#fff" size={20} />}
                         {t === 'dark' && <Moon color="#fff" size={20} />}
                         {t === 'sepia' && <Type color="#f6f1d1" size={20} />}
                         <Text className="text-zinc-400 mt-2 capitalize">{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderChapters = () => (
        <FlatList
            data={toc}
            keyExtractor={(i, index) => index.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    onPress={() => onSelectChapter(item.href)}
                    className="p-4 border-b border-zinc-800 flex-row justify-between items-center active:bg-zinc-800"
                >
                    <Text className="text-zinc-300 font-medium flex-1">{item.label.trim()}</Text>
                    <ChevronRight color="#52525b" size={16} />
                </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-zinc-500 text-center p-8">Sem sumário disponível.</Text>}
        />
    );

    const renderHighlights = () => (
        <FlatList
            data={highlights}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
                <View className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-4 pl-2 border-l-4" style={{ borderColor: item.color || '#facc15' }}>
                            <Text className="text-zinc-300 italic text-sm leading-6">"{item.text.trim()}"</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => onDeleteHighlight(item.cfiRange, item.id)}
                            className="p-2 bg-zinc-800 rounded-lg"
                        >
                            <Trash2 color="#ef4444" size={16} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            ListEmptyComponent={
                <View className="items-center justify-center p-8">
                    <Highlighter size={40} color="#52525b" />
                    <Text className="text-zinc-500 text-center mt-4">Nenhum destaque salvo.</Text>
                </View>
            }
        />
    );

    return (
        <>
            {/* 1. HEADER (Sempre visível quando menu ativo) */}
            <View className="absolute top-0 left-0 right-0 h-24 bg-zinc-950/90 flex-row items-end justify-between px-4 pb-4 z-50 animate-in slide-in-from-top-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-zinc-400 text-sm font-medium pb-1" numberOfLines={1} style={{ maxWidth: 200 }}>
                    Opções de Leitura
                </Text>
                <TouchableOpacity onPress={onClose} className="p-2">
                    <X color="white" size={24} />
                </TouchableOpacity>
            </View>

            {/* 2. BOTTOM SHEET UNIFICADO */}
            <View 
                className={`absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl shadow-2xl z-50 transition-all duration-300 ease-in-out border-t border-zinc-800`}
                style={{ 
                    height: expanded ? SCREEN_HEIGHT * 0.75 : 180, // Altura dinâmica
                }}
            >
                {/* Handle / Gatilho de Arrastar */}
                <TouchableOpacity 
                    onPress={onToggleExpand}
                    activeOpacity={0.9}
                    className="w-full h-8 items-center justify-center border-b border-zinc-800/50"
                >
                    <View className="w-12 h-1.5 bg-zinc-700 rounded-full mb-1" />
                    {expanded ? <ChevronDown size={14} color="#71717a" /> : <ChevronUp size={14} color="#71717a" />}
                </TouchableOpacity>

                {/* Área de Controle Principal (Sempre visível) */}
                {!expanded && (
                    <View className="p-6 flex-row justify-around items-center">
                        <TouchableOpacity onPress={() => { onSetTab('settings'); onToggleExpand(); }} className="items-center gap-2">
                            <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center">
                                <Type color="#e4e4e7" size={24} />
                            </View>
                            <Text className="text-zinc-400 text-xs">Ajustes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { onSetTab('chapters'); onToggleExpand(); }} className="items-center gap-2">
                            <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center">
                                <List color="#e4e4e7" size={24} />
                            </View>
                            <Text className="text-zinc-400 text-xs">Capítulos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { onSetTab('highlights'); onToggleExpand(); }} className="items-center gap-2">
                            <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center">
                                <Highlighter color="#e4e4e7" size={24} />
                            </View>
                            <Text className="text-zinc-400 text-xs">Destaques</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Conteúdo Expandido */}
                {expanded && (
                    <View className="flex-1">
                        {/* Tab Bar Interna */}
                        <View className="flex-row border-b border-zinc-800">
                            {[
                                { id: 'settings', label: 'Ajustes', icon: Type },
                                { id: 'chapters', label: 'Capítulos', icon: List },
                                { id: 'highlights', label: 'Destaques', icon: Highlighter },
                            ].map((tab) => (
                                <TouchableOpacity 
                                    key={tab.id}
                                    onPress={() => onSetTab(tab.id as any)}
                                    className={`flex-1 flex-row items-center justify-center py-4 gap-2 ${activeTab === tab.id ? 'border-b-2 border-emerald-500 bg-zinc-800/50' : ''}`}
                                >
                                    <tab.icon size={16} color={activeTab === tab.id ? '#10b981' : '#71717a'} />
                                    <Text className={`${activeTab === tab.id ? 'text-emerald-500 font-bold' : 'text-zinc-500'}`}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Corpo da Aba */}
                        <View className="flex-1 bg-zinc-950">
                            {activeTab === 'settings' && renderSettings()}
                            {activeTab === 'chapters' && renderChapters()}
                            {activeTab === 'highlights' && renderHighlights()}
                        </View>
                    </View>
                )}
            </View>
        </>
    );
};