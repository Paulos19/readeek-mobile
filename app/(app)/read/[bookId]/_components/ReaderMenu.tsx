import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { 
  ArrowLeft, ChevronUp, ChevronDown, Type, List, Highlighter, 
  Sun, Moon, Plus, Minus, X, Trash2, LayoutGrid, Bookmark 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Highlight } from 'lib/api';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    runOnJS,
    Easing 
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MINIMIZED_HEIGHT = 180;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.85;

interface Props {
    visible: boolean;
    expanded: boolean;
    activeTab: 'settings' | 'chapters' | 'highlights';
    theme: any;
    fontSize: number;
    toc: any[];
    highlights: Highlight[];
    progress: number;
    title: string;
    onToggleExpand: (isExpanded: boolean) => void;
    onSetTab: (tab: 'settings' | 'chapters' | 'highlights') => void;
    onChangeFont: (delta: number) => void;
    onChangeTheme: (theme: any) => void;
    onSelectChapter: (href: string) => void;
    onDeleteHighlight: (cfi: string, id: string) => void;
    onClose: () => void;
}

export const ReaderMenu = ({
    visible, expanded, activeTab, theme, fontSize, toc, highlights, progress, title,
    onToggleExpand, onSetTab, onChangeFont, onChangeTheme, onSelectChapter, onDeleteHighlight, onClose
}: Props) => {
    const router = useRouter();
    
    // Animação de Altura
    const height = useSharedValue(MINIMIZED_HEIGHT);

    useEffect(() => {
        height.value = withTiming(expanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT, {
            duration: 350,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [expanded]);

    // Função auxiliar para garantir que a aba abra e expanda
    const handleTabPress = (tab: 'settings' | 'chapters' | 'highlights') => {
        onSetTab(tab);
        // Força a expansão explicitamente
        onToggleExpand(true);
    };

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            const newHeight = expanded 
                ? EXPANDED_HEIGHT - e.translationY 
                : MINIMIZED_HEIGHT - e.translationY;
            
            if (newHeight > MINIMIZED_HEIGHT * 0.8 && newHeight < EXPANDED_HEIGHT * 1.05) {
                height.value = newHeight;
            }
        })
        .onEnd((e) => {
            if (height.value > SCREEN_HEIGHT * 0.4 || e.velocityY < -500) {
                height.value = withTiming(EXPANDED_HEIGHT, { duration: 300 });
                runOnJS(onToggleExpand)(true);
            } else {
                height.value = withTiming(MINIMIZED_HEIGHT, { duration: 300 });
                runOnJS(onToggleExpand)(false);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

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
                    const isSelected = (theme.ui === 'dark' ? t === 'dark' : (theme.ui === 'light' && theme.name.toLowerCase() === t)) || 
                                     (t === 'sepia' && theme.bg === '#f6f1d1') || (t === 'light' && theme.bg === '#ffffff');
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
            key={2}
            numColumns={2}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
            columnWrapperStyle={{ gap: 12 }}
            keyExtractor={(i, index) => index.toString()}
            renderItem={({ item, index }) => (
                <TouchableOpacity 
                    onPress={() => onSelectChapter(item.href)} 
                    className="flex-1 aspect-[3/4] bg-zinc-800/50 rounded-lg border border-white/5 p-4 justify-between active:bg-zinc-700/50 overflow-hidden relative"
                >
                    <View className="absolute top-2 right-2 opacity-10">
                        <Text className="text-4xl font-serif font-bold text-white">{index + 1}</Text>
                    </View>
                    <View className="space-y-1 opacity-20">
                        <View className="h-1 bg-white w-full rounded-full" />
                        <View className="h-1 bg-white w-5/6 rounded-full" />
                        <View className="h-1 bg-white w-4/6 rounded-full" />
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Capítulo {index + 1}</Text>
                        <Text className="text-zinc-200 font-serif text-sm font-medium leading-tight" numberOfLines={3}>
                            {item.label ? item.label.trim() : `Parte ${index + 1}`}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-zinc-500 text-center p-8">Sem sumário disponível.</Text>}
        />
    );

    const renderHighlights = () => (
        <FlatList
            data={highlights}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
                const colorMap: any = { 'yellow': '#facc15', 'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e' };
                const displayColor = colorMap[item.color] || item.color || '#facc15';

                return (
                    <View className="mb-3 p-3 rounded-lg bg-zinc-900/50 border border-white/5 flex-row gap-3 items-start">
                        <View className="mt-1" style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: displayColor }} />
                        <View className="flex-1">
                            <Text className="text-zinc-300 font-serif italic text-sm leading-5 mb-2">"{item.text.trim()}"</Text>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center gap-1">
                                    <Bookmark size={10} color={displayColor} />
                                    <Text className="text-zinc-600 text-[10px] uppercase font-bold">Marcador</Text>
                                </View>
                                <TouchableOpacity onPress={() => onDeleteHighlight(item.cfiRange, item.id)} className="p-1.5 bg-red-500/10 rounded border border-red-500/20">
                                    <Trash2 color="#ef4444" size={14} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            }}
            ListEmptyComponent={<View className="items-center justify-center p-8"><Highlighter size={40} color="#52525b" /><Text className="text-zinc-500 text-center mt-4">Nenhum destaque salvo.</Text></View>}
        />
    );

    return (
        <>
            {/* Header Fixo */}
            <View className="absolute top-0 left-0 right-0 h-28 bg-zinc-950/90 flex-col justify-end px-4 pb-4 z-50 border-b border-white/5 backdrop-blur-md">
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-800/50 rounded-full"><ArrowLeft color="white" size={20} /></TouchableOpacity>
                    
                    <Text className="text-zinc-200 text-sm font-semibold text-center flex-1 mx-2" numberOfLines={1}>
                        {title}
                    </Text>

                    <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800/50 rounded-full"><X color="white" size={20} /></TouchableOpacity>
                </View>
                
                <View className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <View 
                        className="bg-emerald-500 h-full rounded-full" 
                        style={{ width: `${Math.round(progress * 100)}%` }} 
                    />
                </View>
                <View className="flex-row justify-between mt-1">
                    <Text className="text-[10px] text-zinc-500 font-bold uppercase">Progresso</Text>
                    <Text className="text-[10px] text-emerald-500 font-bold">{Math.round(progress * 100)}% Lido</Text>
                </View>
            </View>

            {/* Bottom Sheet Animado */}
            <Animated.View 
                className={`absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl shadow-2xl z-50 border-t border-white/10 overflow-hidden`}
                style={animatedStyle}
            >
                {/* Handle - Área de arraste restrita ao topo */}
                <GestureDetector gesture={panGesture}>
                    <View className="w-full h-8 items-center justify-center border-b border-white/5 bg-zinc-800/30">
                        <View className="w-12 h-1 bg-zinc-600/50 rounded-full mb-1" />
                        {expanded ? <ChevronDown size={14} color="#71717a" /> : <ChevronUp size={14} color="#71717a" />}
                    </View>
                </GestureDetector>

                {/* Conteúdo Minimizado (Tabs Rápidas) - Clicar aqui agora expande o menu */}
                {!expanded && (
                    <View className="p-6 flex-row justify-around items-center h-[140px]">
                        <TouchableOpacity 
                            onPress={() => handleTabPress('settings')} 
                            className="items-center gap-2 p-2"
                        >
                            <View className="w-14 h-14 bg-zinc-800/80 rounded-2xl items-center justify-center border border-white/5 active:bg-zinc-700">
                                <Type color="#e4e4e7" size={24} />
                            </View>
                            <Text className="text-zinc-500 text-xs font-bold">Ajustes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => handleTabPress('chapters')} 
                            className="items-center gap-2 p-2"
                        >
                            <View className="w-14 h-14 bg-zinc-800/80 rounded-2xl items-center justify-center border border-white/5 active:bg-zinc-700">
                                <LayoutGrid color="#e4e4e7" size={24} />
                            </View>
                            <Text className="text-zinc-500 text-xs font-bold">Capítulos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => handleTabPress('highlights')} 
                            className="items-center gap-2 p-2"
                        >
                            <View className="w-14 h-14 bg-zinc-800/80 rounded-2xl items-center justify-center border border-white/5 active:bg-zinc-700">
                                <Highlighter color="#e4e4e7" size={24} />
                            </View>
                            <Text className="text-zinc-500 text-xs font-bold">Destaques</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Conteúdo Expandido - Rola livremente */}
                {expanded && (
                    <View className="flex-1">
                        <View className="flex-row border-b border-white/5">
                            {[
                                { id: 'settings', label: 'Ajustes', icon: Type }, 
                                { id: 'chapters', label: 'Capítulos', icon: LayoutGrid }, 
                                { id: 'highlights', label: 'Marcadores', icon: Highlighter }
                            ].map((tab) => (
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
        </>
    );
};