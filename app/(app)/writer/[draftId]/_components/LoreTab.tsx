import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Plus, Globe, Trash2, X, MapPin } from 'lucide-react-native';
import { api } from '../../../../../lib/api';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    draftId: string;
    lore: any[];
    onRefresh: () => void;
}

const CATEGORIES = ['Local', 'História', 'Magia', 'Item', 'Religião'];

export const LoreTab = ({ draftId, lore, onRefresh }: Props) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Local');
    const [content, setContent] = useState('');

    const handleCreate = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            await api.post('/mobile/writer/lore', {
                draftId, title, category, content
            });
            setModalVisible(false);
            setTitle(''); setContent('');
            onRefresh();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/mobile/writer/lore?id=${id}`);
            onRefresh();
        } catch (e) {}
    };

    return (
        <View className="flex-1">
            <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                className="bg-zinc-900 border border-zinc-800 border-dashed p-4 rounded-xl flex-row items-center justify-center mb-6 active:bg-zinc-800"
            >
                <Plus color="#a1a1aa" size={20} />
                <Text className="text-zinc-400 font-bold ml-2">Adicionar Elemento</Text>
            </TouchableOpacity>

            {lore.length === 0 ? (
                <View className="items-center mt-10 opacity-50">
                    <Globe size={48} color="#3f3f46" />
                    <Text className="text-zinc-500 mt-4 font-medium">Mundo vazio. Comece a criar.</Text>
                </View>
            ) : (
                lore.map((item) => (
                    <View key={item.id} className="bg-zinc-900/80 p-4 rounded-2xl mb-3 border border-zinc-800">
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className="text-white font-bold text-base">{item.title}</Text>
                                <View className="bg-zinc-800 self-start px-2 py-0.5 rounded-md mt-1">
                                    <Text className="text-zinc-400 text-[10px] font-bold uppercase">{item.category}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-1">
                                <Trash2 size={16} color="#71717a" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-zinc-500 text-xs leading-5" numberOfLines={3}>{item.content}</Text>
                    </View>
                ))
            )}

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
                    <View className="flex-1 bg-black/60" onTouchEnd={() => setModalVisible(false)} />
                    <View className="bg-zinc-950 border-t border-zinc-800 rounded-t-[32px] p-6 h-[75%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white font-black text-xl">World Building</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-zinc-900 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Título</Text>
                            <TextInput 
                                value={title} onChangeText={setTitle} 
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-4 font-bold"
                                placeholder="Ex: Reino de Aethelgard" placeholderTextColor="#52525b"
                            />

                            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Categoria</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity 
                                        key={cat} 
                                        onPress={() => setCategory(cat)}
                                        className={`mr-2 px-4 py-2 rounded-full border ${category === cat ? 'bg-indigo-600 border-indigo-500' : 'bg-zinc-900 border-zinc-800'}`}
                                    >
                                        <Text className={category === cat ? 'text-white font-bold' : 'text-zinc-500 font-medium'}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Detalhes</Text>
                            <TextInput 
                                value={content} onChangeText={setContent} multiline
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-6 min-h-[150px]"
                                placeholder="História, regras, localização..." placeholderTextColor="#52525b"
                                textAlignVertical="top"
                            />

                            <TouchableOpacity onPress={handleCreate} disabled={loading} className="mt-2">
                                <LinearGradient colors={['#4f46e5', '#3730a3']} className="p-4 rounded-xl items-center">
                                    <Text className="text-white font-bold uppercase tracking-widest">
                                        {loading ? 'Salvando...' : 'Salvar Elemento'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};