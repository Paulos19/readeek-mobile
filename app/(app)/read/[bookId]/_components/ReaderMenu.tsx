import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { 
  ArrowLeft, ChevronUp, ChevronDown, Type, List, Highlighter, 
  Sun, Moon, Plus, Minus, X, Trash2, LayoutGrid, Bookmark, Share2 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Highlight } from '../../../../../lib/api';
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
    expanded: boolean;
    activeTab: 'settings' | 'chapters' | 'highlights';
    theme: any;
    fontSize: number;
    toc: any[];
    previews: Record<string, string>;
    highlights: Highlight[];
    progress: number;
    title: string;
    onToggleExpand: (isExpanded: boolean) => void;
    onSetTab: (tab: 'settings' | 'chapters' | 'highlights') => void;
    onChangeFont: (delta: number) => void;
    onChangeTheme: (theme: any) => void;
    onSelectChapter: (href: string) => void;
    onDeleteHighlight: (cfi: string, id: string) => void;
    onShareHighlight: (highlight: Highlight) => void; // New prop for sharing
    onClose: () => void;
}

export const ReaderMenu = ({
    expanded, activeTab, theme, fontSize, toc, previews, highlights, progress, title,
    onToggleExpand, onSetTab, onChangeFont, onChangeTheme, onSelectChapter, onDeleteHighlight, onShareHighlight, onClose
}: Props) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const height = useSharedValue(MINIMIZED_HEIGHT);

    useEffect(() => {
        height.value = withTiming(expanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT, {
            duration: 350,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [expanded]);

    const handleTabPress = (tab: 'settings' | 'chapters' | 'highlights') => {
        onSetTab(tab);
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

    // --- RENDERERS ---

    const renderSettings = () => (
        <View className="p-6 space-y-8">
            <View className="bg-zinc-800/50 p-6 rounded-2xl flex-row items-center justify-between border border-white/5 mb-6">
                <TouchableOpacity onPress={() => onChangeFont(-10)} className="w-14 h-14 bg-zinc-700/50 rounded-xl items-center justify-center active:bg-zinc-600 border border-white/5">
                    <Minus color="#fff" size={28}/>
                </TouchableOpacity>
                <Text className="text-white font-black text-3xl tracking-widest">{fontSize}%</Text>
                <TouchableOpacity onPress={() => onChangeFont(10)} className="w-14 h-14 bg-zinc-700/50 rounded-xl items-center justify-center active:bg-zinc-600 border border-white/5">
                    <Plus color="#fff" size={28}/>
                </TouchableOpacity>
            </View>
            
            <View className="flex-row gap-4">
                {['light', 'sepia', 'dark'].map((t) => {
                    const isSelected = (theme.ui === 'dark' ? t === 'dark' : (theme.ui === 'light' && theme.name.toLowerCase() === t)) || (t === 'sepia' && theme.bg === '#f6f1d1') || (t === 'light' && theme.bg === '#ffffff');
                    return (
                        <TouchableOpacity key={t} onPress={() => onChangeTheme(t)} className={`flex-1 py-6 rounded-2xl border-2 items-center justify-center ${isSelected ? 'border-emerald-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-900/50'}`}>
                             {t === 'light' && <Sun size={24} color={isSelected ? '#10b981' : '#71717a'} />}
                             {t === 'dark' && <Moon size={24} color={isSelected ? '#10b981' : '#71717a'} />}
                             {t === 'sepia' && <Type size={24} color={isSelected ? '#10b981' : '#71717a'} />}
                             <Text className={`mt-3 font-bold text-xs uppercase tracking-wider ${isSelected ? 'text-emerald-500' : 'text-zinc-500'}`}>{t}</Text>
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
            renderItem={({ item, index }) => {
                const previewText = previews ? previews[item.href] : null;
                
                return (
                    <TouchableOpacity onPress={() => onSelectChapter(item.href)} className="flex-1 aspect-[3/4] bg-zinc-800/30 rounded-2xl border border-white/5 p-5 justify-between active:bg-zinc-800/80 overflow-hidden relative group">
                        <View className="absolute top-2 right-3 opacity-20">
                            <Text className="text-5xl font-black text-white italic -mr-2 -mt-2">{index + 1}</Text>
                        </View>
                        
                        <View>
                            <Text className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-2">CAPÍTULO {index + 1}</Text>
                            <Text className="text-zinc-100 font-bold text-lg leading-6 mb-2" numberOfLines={2}>
                                {item.label ? item.label.trim() : `Seção ${index + 1}`}
                            </Text>
                        </View>

                        <View>
                            {previewText ? (
                                <Text className="text-zinc-500 text-xs leading-4 font-medium" numberOfLines={3}>
                                    {previewText}
                                </Text>
                            ) : (
                                <View className="space-y-1.5 opacity-20">
                                    <View className="h-2 bg-white w-full rounded-full" />
                                    <View className="h-2 bg-white w-5/6 rounded-full" />
                                    <View className="h-2 bg-white w-4/6 rounded-full" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                )
            }}
            ListEmptyComponent={<Text className="text-zinc-500 text-center p-8 mt-10">Nenhum capítulo encontrado.</Text>}
        />
    );

    const renderHighlights = () => (
        <FlatList
            data={highlights} 
            keyExtractor={(i) => i.id} 
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            renderItem={({ item }) => {
                const colorMap: any = { 'yellow': '#facc15', 'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e', 'purple': '#c084fc' };
                const displayColor = colorMap[item.color] || item.color || '#facc15';
                
                return (
                    <View className="mb-4 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-sm">
                        <View className="flex-row">
                            {/* Color Strip */}
                            <View style={{ width: 6, backgroundColor: displayColor }} />
                            
                            <View className="flex-1 p-4">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-row items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md self-start">
                                        <Bookmark size={10} color={displayColor} fill={displayColor} />
                                        <Text style={{ color: displayColor }} className="text-[10px] font-bold uppercase tracking-wider">
                                            Destaque
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-zinc-300 font-serif text-base leading-6 mb-4 selection:bg-white/10">
                                    "{item.text.trim()}"
                                </Text>

                                {/* Action Buttons */}
                                <View className="flex-row gap-3 pt-3 border-t border-zinc-800/50">
                                    <TouchableOpacity 
                                        onPress={() => onShareHighlight(item)} 
                                        className="flex-1 flex-row items-center justify-center gap-2 bg-indigo-500/10 py-2.5 rounded-xl border border-indigo-500/20 active:bg-indigo-500/20"
                                    >
                                        <Share2 size={16} color="#818cf8" />
                                        <Text className="text-indigo-400 text-xs font-bold uppercase">Postar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        onPress={() => onDeleteHighlight(item.cfiRange, item.id)} 
                                        className="w-10 items-center justify-center bg-zinc-800 rounded-xl border border-zinc-700 active:bg-red-500/10 active:border-red-500/30"
                                    >
                                        <Trash2 color="#71717a" size={16} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                );
            }}
            ListEmptyComponent={
                <View className="items-center justify-center p-10 mt-10 opacity-50">
                    <Highlighter size={64} color="#52525b" />
                    <Text className="text-zinc-500 text-center mt-6 font-medium">
                        Selecione um texto no livro para{'\n'}criar uma nota.
                    </Text>
                </View>
            }
        />
    );

    return (
        <>
            {/* Floating Header (Progress) */}
            <View 
                style={{ 
                    paddingTop: Math.max(insets.top, 20) + 10,
                    paddingBottom: 20 
                }}
                className="absolute top-0 left-0 right-0 bg-zinc-950/95 flex-col justify-end px-5 z-50 border-b border-white/5 backdrop-blur-xl shadow-2xl"
            >
                <View className="flex-row items-center justify-between mb-5">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800 active:bg-zinc-800">
                        <ArrowLeft color="#e4e4e7" size={20} />
                    </TouchableOpacity>
                    
                    <View className="flex-1 mx-4 items-center">
                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-0.5">Lendo Agora</Text>
                        <Text className="text-white text-sm font-bold text-center" numberOfLines={1}>{title}</Text>
                    </View>
                    
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800 active:bg-zinc-800">
                        <X color="#e4e4e7" size={20} />
                    </TouchableOpacity>
                </View>
                
                <View className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800/50">
                    <View className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${Math.round(progress * 100)}%` }} />
                </View>
                <View className="flex-row justify-between mt-2 px-1">
                    <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Início</Text>
                    <Text className="text-[10px] text-emerald-500 font-black">{Math.round(progress * 100)}% CONCLUÍDO</Text>
                </View>
            </View>

            {/* Expandable Bottom Menu */}
            <Animated.View className={`absolute bottom-0 left-0 right-0 bg-zinc-950 rounded-t-[32px] shadow-2xl z-50 border-t border-white/10 overflow-hidden`} style={animatedStyle}>
                
                <GestureDetector gesture={panGesture}>
                    <View className="w-full h-10 items-center justify-center bg-zinc-900/50 active:bg-zinc-900">
                        <View className="w-12 h-1.5 bg-zinc-700/30 rounded-full" />
                    </View>
                </GestureDetector>

                {!expanded && (
                    <View className="px-8 pb-8 pt-2 flex-row justify-between items-center h-[130px]">
                        <TouchableOpacity onPress={() => handleTabPress('settings')} className="items-center gap-2 group">
                            <View className="w-16 h-16 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800 group-active:border-emerald-500/50 group-active:bg-emerald-500/10 transition-all">
                                <Type color="#e4e4e7" size={28} />
                            </View>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Ajustes</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => handleTabPress('chapters')} className="items-center gap-2 group">
                            <View className="w-16 h-16 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800 group-active:border-emerald-500/50 group-active:bg-emerald-500/10 transition-all">
                                <List color="#e4e4e7" size={28} />
                            </View>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Capítulos</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => handleTabPress('highlights')} className="items-center gap-2 group">
                            <View className="w-16 h-16 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800 group-active:border-emerald-500/50 group-active:bg-emerald-500/10 transition-all">
                                <Highlighter color="#e4e4e7" size={28} />
                            </View>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Notas</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {expanded && (
                    <View className="flex-1 bg-zinc-950">
                        <View className="flex-row border-b border-white/5 px-4 pt-2">
                            {[{ id: 'settings', label: 'Visual', icon: Type }, { id: 'chapters', label: 'Índice', icon: List }, { id: 'highlights', label: 'Notas', icon: Highlighter }].map((tab) => (
                                <TouchableOpacity 
                                    key={tab.id} 
                                    onPress={() => onSetTab(tab.id as any)} 
                                    className={`flex-1 flex-row items-center justify-center py-4 gap-2 rounded-t-xl transition-all ${activeTab === tab.id ? 'bg-zinc-900 border-b-2 border-emerald-500' : 'opacity-50'}`}
                                >
                                    <tab.icon size={16} color={activeTab === tab.id ? '#10b981' : '#a1a1aa'} />
                                    <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === tab.id ? 'text-white' : 'text-zinc-500'}`}>{tab.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-1 bg-zinc-900">
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