import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Plus, User, Trash2, X, Shield } from 'lucide-react-native';
import { api } from '../../../../../lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { WriterAlert } from '../../_components/WriterAlert';

interface Props {
    draftId: string;
    characters: any[];
    onRefresh: () => void;
}

export const CharactersTab = ({ draftId, characters, onRefresh }: Props) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [desc, setDesc] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await api.post('/mobile/writer/characters', {
                draftId, name, role, description: desc
            });
            setModalVisible(false);
            setName(''); setRole(''); setDesc('');
            onRefresh();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/mobile/writer/characters?id=${id}`);
            onRefresh();
        } catch (e) {}
    };

    return (
        <View className="flex-1">
            {/* Botão Adicionar */}
            <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                className="bg-zinc-900 border border-zinc-800 border-dashed p-4 rounded-xl flex-row items-center justify-center mb-6 active:bg-zinc-800"
            >
                <Plus color="#a1a1aa" size={20} />
                <Text className="text-zinc-400 font-bold ml-2">Criar Personagem</Text>
            </TouchableOpacity>

            {/* Lista */}
            {characters.length === 0 ? (
                <View className="items-center mt-10 opacity-50">
                    <User size={48} color="#3f3f46" />
                    <Text className="text-zinc-500 mt-4 font-medium">Nenhum personagem criado.</Text>
                </View>
            ) : (
                characters.map((char) => (
                    <View key={char.id} className="bg-zinc-900/80 p-4 rounded-2xl mb-3 border border-zinc-800 flex-row">
                        <View className="w-12 h-12 bg-indigo-500/20 rounded-full items-center justify-center border border-indigo-500/30 mr-4">
                            <Text className="text-indigo-300 font-bold text-lg">{char.name[0]}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-base">{char.name}</Text>
                            <Text className="text-indigo-400 text-xs font-bold uppercase mb-1">{char.role || 'Personagem'}</Text>
                            {char.description ? (
                                <Text className="text-zinc-500 text-xs leading-4" numberOfLines={2}>{char.description}</Text>
                            ) : null}
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(char.id)} className="p-2">
                            <Trash2 size={16} color="#71717a" />
                        </TouchableOpacity>
                    </View>
                ))
            )}

            {/* Modal de Criação */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
                    <View className="flex-1 bg-black/60" onTouchEnd={() => setModalVisible(false)} />
                    <View className="bg-zinc-950 border-t border-zinc-800 rounded-t-[32px] p-6 h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white font-black text-xl">Novo Personagem</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-zinc-900 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Nome</Text>
                            <TextInput 
                                value={name} onChangeText={setName} 
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-4 font-bold"
                                placeholder="Ex: Gandalf" placeholderTextColor="#52525b"
                            />

                            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Função / Papel</Text>
                            <TextInput 
                                value={role} onChangeText={setRole} 
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-4"
                                placeholder="Ex: Protagonista, Mago, Vilão" placeholderTextColor="#52525b"
                            />

                            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-1">Descrição</Text>
                            <TextInput 
                                value={desc} onChangeText={setDesc} multiline
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-6 min-h-[100px]"
                                placeholder="Traços físicos, personalidade..." placeholderTextColor="#52525b"
                                textAlignVertical="top"
                            />

                            <TouchableOpacity onPress={handleCreate} disabled={loading} className="mt-2">
                                <LinearGradient colors={['#4f46e5', '#3730a3']} className="p-4 rounded-xl items-center">
                                    <Text className="text-white font-bold uppercase tracking-widest">
                                        {loading ? 'Salvando...' : 'Salvar Personagem'}
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