import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity, ScrollView } from 'react-native';
import { X, Download, BookOpen } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Book } from '../_types/book';

interface Props {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onAction: (book: Book) => void;
}

export const BookDetailsModal = ({ visible, book, onClose, onAction }: Props) => {
  if (!book) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/80">
        <BlurView intensity={40} tint="dark" className="absolute inset-0" />
        
        <View className="bg-zinc-900 w-[85%] max-h-[80%] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl shadow-black flex-col">
          
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Header com Capa */}
            <View className="h-80 w-full relative">
                {book.coverUrl ? (
                    <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="w-full h-full bg-zinc-800 items-center justify-center"><BookOpen size={60} color="#52525b" /></View>
                )}
                <LinearGradient colors={['transparent', '#18181b']} className="absolute bottom-0 left-0 right-0 h-48" />
                
                <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full border border-white/10">
                    <X color="white" size={20} />
                </TouchableOpacity>
            </View>

            {/* Conteúdo */}
            <View className="px-6 pb-8 -mt-10 bg-zinc-900">
                <Text className="text-white font-bold text-3xl text-center leading-8 mb-2 drop-shadow-md">{book.title}</Text>
                <Text className="text-zinc-400 text-base text-center font-medium mb-6">{book.author || 'Autor Desconhecido'}</Text>

                {/* Status Grid */}
                <View className="flex-row justify-center gap-3 mb-8">
                    <View className="bg-zinc-800/50 px-4 py-3 rounded-2xl items-center border border-white/5 min-w-[90px]">
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Progresso</Text>
                        <Text className="text-emerald-400 font-bold text-lg">{book.progress}%</Text>
                    </View>
                    <View className="bg-zinc-800/50 px-4 py-3 rounded-2xl items-center border border-white/5 min-w-[90px]">
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Status</Text>
                        <Text className="text-white font-bold text-lg">{book.isDownloaded ? 'No Device' : 'Na Nuvem'}</Text>
                    </View>
                </View>

                {/* Descrição */}
                <View className="bg-zinc-800/30 p-4 rounded-2xl mb-8">
                    <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">Sobre a Obra</Text>
                    <Text className="text-zinc-300 text-sm leading-6">
                        {book.description || "Nenhuma descrição fornecida para este livro. Baixe agora para descobrir este conteúdo."}
                    </Text>
                </View>

                {/* Botão de Ação */}
                <TouchableOpacity 
                    onPress={() => onAction(book)}
                    activeOpacity={0.8}
                    disabled={book.isDownloading}
                    className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg ${
                        book.isDownloaded ? 'bg-zinc-800 border border-emerald-500/30' : 'bg-emerald-600 shadow-emerald-500/20'
                    }`}
                >
                    {book.isDownloaded ? (
                        <>
                            <BookOpen color="#10b981" fill="#10b981" size={20} />
                            <Text className="text-emerald-500 font-bold text-lg">Continuar Lendo</Text>
                        </>
                    ) : (
                        <>
                            {book.isDownloading ? (
                                <Text className="text-white font-bold text-lg opacity-80">Baixando...</Text>
                            ) : (
                                <>
                                    <Download color="white" size={20} />
                                    <Text className="text-white font-bold text-lg">Baixar para Biblioteca</Text>
                                </>
                            )}
                        </>
                    )}
                </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};