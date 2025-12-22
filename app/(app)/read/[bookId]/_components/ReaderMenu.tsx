import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { 
  ArrowLeft, ChevronUp, ChevronDown, Type, List, Highlighter, 
  Sun, Moon, Plus, Minus, X, Trash2, ChevronRight 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Highlight } from 'lib/api';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    runOnJS 
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MINIMIZED_HEIGHT = 180;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75;

interface Props {
    visible: boolean;
    expanded: boolean;
    activeTab: 'settings' | 'chapters' | 'highlights';
    theme: any;
    fontSize: number;
    toc: any[];
    highlights: Highlight[];
    onToggleExpand: (isExpanded: boolean) => void;
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
    
    // Animação de Altura
    const height = useSharedValue(MINIMIZED_HEIGHT);

    // Sincroniza estado externo (expanded) com animação
    useEffect(() => {
        height.value = withSpring(expanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT, {
            damping: 15,
            stiffness: 120
        });
    }, [expanded]);

    // Gesto de Arrastar (Pan)
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            // Permite arrastar para cima ou para baixo
            const newHeight = expanded 
                ? EXPANDED_HEIGHT - e.translationY 
                : MINIMIZED_HEIGHT - e.translationY;
            
            // Limites físicos
            if (newHeight > MINIMIZED_HEIGHT * 0.8 && newHeight < EXPANDED_HEIGHT * 1.1) {
                height.value = newHeight;
            }
        })
        .onEnd((e) => {
            // Lógica de "Snap" (decidir se abre ou fecha)
            if (height.value > SCREEN_HEIGHT * 0.4 || e.velocityY < -500) {
                height.value = withSpring(EXPANDED_HEIGHT, { damping: 15 });
                runOnJS(onToggleExpand)(true);
            } else {
                height.value = withSpring(MINIMIZED_HEIGHT, { damping: 15 });
                runOnJS(onToggleExpand)(false);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value
    }));

    if (!visible) return null;

    // --- RENDERERS ---

    const renderSettings = () => (
        <View className="p-4 space-y-6">
            <View className="bg-zinc-800/80 p-4 rounded-xl flex-row items-center justify-between border border-white/10 mb-6">
                <TouchableOpacity onPress={() => onChangeFont(-10)} className="w-12 h-12 bg-zinc-700/80 rounded-lg items-center justify-center active:bg-zinc-600">
                    <Minus color="#fff" size={24}/>
                </TouchableOpacity>
                <Text className="text-white font-bold text-2xl tracking-widest">{fontSize}%</Text>
                <TouchableOpacity onPress={() => onChangeFont(10)} className="w-12 h-12 bg-zinc-700/80 rounded-lg items-center justify-center active:bg-zinc-600">
                    <Plus color="#fff" size={24}/>
                </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
                {['light', 'sepia', 'dark'].map((t) => {
                    // Correção da Lógica de Seleção
                    const isActive = theme.ui === 'dark' ? t === 'dark' : (theme.ui === 'light' && theme.name.toLowerCase() === t);
                    // Fallback simples se os nomes não baterem exatamente (ex: Sepia vs Sépia)
                    const isSepia = t === 'sepia' && theme.bg === '#f6f1d1';
                    const isLight = t === 'light' && theme.bg === '#ffffff';
                    const isDark = t === 'dark' && theme.bg === '#09090b';
                    
                    const isSelected = isSepia || isLight || isDark;

                    return (
                        <TouchableOpacity 
                            key={t} 
                            onPress={() => onChangeTheme(t)}
                            className={`flex-1 py-4 rounded-xl border-2 items-center justify-center ${isSelected ? 'border-emerald-500 bg-zinc-800/90' : 'border-zinc-800 bg-zinc-900/50'}`}
                        >
                             {t === 'light' && <Sun size={20} color={isSelected ? '#10b981' : '#71717a'} />}
                             {t === 'dark' && <Moon size={20} color={isSelected ? '#10b981' : '#71717a'} />}
                             {t === 'sepia' && <Type size={20} color={isSelected ? '#10b981' : '#71717a'} />}
                             <Text className={`mt-2 font-bold capitalize ${isSelected ? 'text-emerald-500' : 'text-zinc-500'}`}>{t}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderChapters = () => (
        <FlatList
            data={toc}
            keyExtractor={(i, index) => index.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSelectChapter(item.href)} className="p-4 border-b border-white/5 flex-row justify-between items-center active:bg-white/5">
                    <Text className="text-zinc-300 font-medium flex-1 text-base">{item.label.trim()}</Text>
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
                <View className="p-4 border-b border-white/5 bg-zinc-900/30">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-4 pl-3 border-l-[3px]" style={{ borderColor: item.color || '#facc15' }}>
                            <Text className="text-zinc-300 italic text-base leading-6">"{item.text.trim()}"</Text>
                        </View>
                        <TouchableOpacity onPress={() => onDeleteHighlight(item.cfiRange, item.id)} className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <Trash2 color="#ef4444" size={18} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            ListEmptyComponent={<View className="items-center justify-center p-8"><Highlighter size={40} color="#52525b" /><Text className="text-zinc-500 text-center mt-4">Nenhum destaque salvo.</Text></View>}
        />
    );

    return (
        <>
            {/* Header Fixo */}
            <View className="absolute top-0 left-0 right-0 h-24 bg-zinc-950/90 flex-row items-end justify-between px-4 pb-4 z-50 border-b border-white/5 backdrop-blur-md">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-800/50 rounded-full"><ArrowLeft color="white" size={20} /></TouchableOpacity>
                <Text className="text-zinc-400 text-sm font-medium pb-2">Menu de Leitura</Text>
                <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800/50 rounded-full"><X color="white" size={20} /></TouchableOpacity>
            </View>

            {/* Bottom Sheet Animado e Arrastável */}
            <GestureDetector gesture={panGesture}>
                <Animated.View 
                    className={`absolute bottom-0 left-0 right-0 bg-zinc-900/95 rounded-t-3xl shadow-2xl z-50 border-t border-white/10 backdrop-blur-xl overflow-hidden`}
                    style={animatedStyle}
                >
                    {/* Handle */}
                    <View className="w-full h-8 items-center justify-center border-b border-white/5 bg-zinc-900/50">
                        <View className="w-12 h-1 bg-zinc-600/50 rounded-full mb-1" />
                        {expanded ? <ChevronDown size={14} color="#71717a" /> : <ChevronUp size={14} color="#71717a" />}
                    </View>

                    {/* Conteúdo Minimizado (Ícones) - Some suavemente ao expandir */}
                    {!expanded && (
                        <View className="p-6 flex-row justify-around items-center">
                            <TouchableOpacity onPress={() => { onSetTab('settings'); onToggleExpand(true); }} className="items-center gap-2">
                                <View className="w-14 h-14 bg-zinc-800/80 rounded-2xl items-center justify-center border border-white/5 active:bg-zinc-700"><Type color="#e4e4e7" size={24} /></View>
                                <Text className="text-zinc-500 text-xs font-bold">Ajustes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { onSetTab('chapters'); onToggleExpand(true); }} className="items-center gap-2">
                                <View className="w-14 h-14 bg-zinc-800/80 rounded-2xl items-center justify-center border border-white/5 active:bg-zinc-700"><List color="#e4e4e7" size={24} /></View>
                                <Text className="text-zinc-500 text-xs font-bold">Capítulos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { onSetTab('highlights'); onToggleExpand(true); }} className="items-center gap-2">
                                <View className="w-14 h-14 bg-zinc-800/80 rounded-2xl items-center justify-center border border-white/5 active:bg-zinc-700"><Highlighter color="#e4e4e7" size={24} /></View>
                                <Text className="text-zinc-500 text-xs font-bold">Destaques</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Conteúdo Expandido (Abas) */}
                    {expanded && (
                        <View className="flex-1">
                            <View className="flex-row border-b border-white/5">
                                {[{ id: 'settings', label: 'Ajustes', icon: Type }, { id: 'chapters', label: 'Capítulos', icon: List }, { id: 'highlights', label: 'Destaques', icon: Highlighter }].map((tab) => (
                                    <TouchableOpacity 
                                        key={tab.id}
                                        onPress={() => onSetTab(tab.id as any)}
                                        className={`flex-1 flex-row items-center justify-center py-4 gap-2 ${activeTab === tab.id ? 'border-b-2 border-emerald-500 bg-white/5' : ''}`}
                                    >
                                        <tab.icon size={16} color={activeTab === tab.id ? '#10b981' : '#71717a'} />
                                        <Text className={`${activeTab === tab.id ? 'text-emerald-500 font-bold' : 'text-zinc-500'}`}>{tab.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View className="flex-1 bg-zinc-950/30">
                                {activeTab === 'settings' && renderSettings()}
                                {activeTab === 'chapters' && renderChapters()}
                                {activeTab === 'highlights' && renderHighlights()}
                            </View>
                        </View>
                    )}
                </Animated.View>
            </GestureDetector>
        </>
    );
};