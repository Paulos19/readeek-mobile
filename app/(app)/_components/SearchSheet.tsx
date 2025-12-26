import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Search, X, User, BookOpen, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../../lib/api'; 

interface SearchResult {
    id: string;
    type: 'USER' | 'BOOK';
    title: string;
    subtitle?: string;
    image?: string | null;
}

interface SearchSheetProps {
  visible: boolean;
  onClose: () => void;
  topOffset?: number;
}

export function SearchSheet({ visible, onClose, topOffset = 110 }: SearchSheetProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
        setResults([]);
        return;
    }

    const timer = setTimeout(async () => {
        setLoading(true);
        try {
            // Chama a nova API Global criada
            const res = await api.get('/mobile/global/search', { params: { q: query } });
            setResults(res.data);
        } catch (e) {
            console.log("Erro na busca", e);
        } finally {
            setLoading(false);
        }
    }, 600); // Debounce de 600ms para não floodar a API

    return () => clearTimeout(timer);
  }, [query]);

  if (!visible) return null;

  const handleSelect = (item: SearchResult) => {
      onClose();
      // Redirecionamento baseado no tipo
      if (item.type === 'USER') {
          router.push(`/(app)/profile/${item.id}` as any);
      } else if (item.type === 'BOOK') {
          router.push({
            pathname: `/read/${item.id}`,
            params: { hasCover: item.image ? 'true' : 'false', title: item.title, author: item.subtitle }
          } as any);
      }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity 
            activeOpacity={1} 
            style={{ 
                position: 'absolute', 
                top: topOffset, 
                alignSelf: 'center',
                width: '90%', 
                backgroundColor: '#18181b', // zinc-900
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#27272a', // zinc-800
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
                zIndex: 60,
                padding: 16
            }}
        >
            {/* Input de Busca */}
            <View className="flex-row items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 mb-2">
                <Search size={20} color="#a1a1aa" />
                <TextInput 
                    placeholder="Buscar livros, usuários..."
                    placeholderTextColor="#52525b"
                    className="flex-1 ml-3 text-white font-medium text-base"
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <X size={16} color="#71717a" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Resultados */}
            <View className="min-h-[60px] max-h-80">
                {loading ? (
                    <View className="py-6 items-center">
                        <ActivityIndicator color="#10b981" />
                    </View>
                ) : results.length > 0 ? (
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {results.map((item, idx) => (
                            <TouchableOpacity 
                                key={`${item.type}-${item.id}-${idx}`}
                                onPress={() => handleSelect(item)}
                                className="flex-row items-center py-3 border-b border-zinc-800/50 last:border-0 active:bg-zinc-800/50 rounded-lg px-2"
                            >
                                <View className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden items-center justify-center mr-3 border border-zinc-700">
                                    {item.image ? (
                                        <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        item.type === 'USER' ? <User size={18} color="#a1a1aa" /> : <BookOpen size={18} color="#a1a1aa" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-zinc-200 font-bold text-sm" numberOfLines={1}>{item.title}</Text>
                                    <Text className="text-zinc-500 text-xs" numberOfLines={1}>{item.subtitle}</Text>
                                </View>
                                <View className="bg-zinc-900 rounded-full p-1">
                                    <ChevronRight size={14} color="#3f3f46" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : query.length > 0 ? (
                    <View className="py-4 items-center">
                        <Text className="text-zinc-600 text-xs">Nenhum resultado encontrado para "{query}".</Text>
                    </View>
                ) : (
                    <View className="py-4 items-center">
                        <Text className="text-zinc-700 text-xs">Digite para pesquisar em todo o banco de dados.</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}