import React from 'react';
import { View, Text, Modal, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur'; // Se não tiver expo-blur, use View com opacidade
import { X, User, Download, BookOpen, Clock, FileText } from 'lucide-react-native';
import { Book } from '../_types/book';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onAction: (book: Book) => void;
}

export const BookDetailsModal = ({ visible, book, onClose, onAction }: Props) => {
  if (!book) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Fundo Escuro com Blur */}
        <TouchableOpacity 
            activeOpacity={1} 
            onPress={onClose}
            className="absolute inset-0 bg-black/80"
        />

        {/* Conteúdo do Modal */}
        <View className="bg-zinc-900 rounded-t-[32px] border-t border-zinc-800 h-[85%] overflow-hidden relative">
            
            {/* Imagem de Fundo (Blur) */}
            <Image 
                source={{ uri: book.coverUrl || undefined }} 
                className="absolute top-0 left-0 right-0 h-64 opacity-20"
                blurRadius={10}
            />
            <LinearGradient
                colors={['transparent', '#18181b']}
                className="absolute top-0 left-0 right-0 h-64"
            />

            {/* Header com Botão Fechar */}
            <View className="flex-row justify-end p-6 z-10">
                <TouchableOpacity onPress={onClose} className="bg-black/40 p-2 rounded-full">
                    <X color="#fff" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 -mt-10" showsVerticalScrollIndicator={false}>
                {/* Capa e Título */}
                <View className="flex-row gap-6 mb-8 items-end">
                    <View className="shadow-2xl shadow-black">
                        <Image 
                            source={{ uri: book.coverUrl || undefined }} 
                            className="w-32 h-48 rounded-xl border border-white/10 bg-zinc-800"
                            resizeMode="cover"
                        />
                    </View>
                    <View className="flex-1 pb-2">
                        <Text className="text-white font-bold text-2xl mb-1 leading-7">
                            {book.title}
                        </Text>
                        <Text className="text-zinc-400 text-base font-medium">
                            {book.author || "Autor Desconhecido"}
                        </Text>
                        
                        {/* Tags / Stats */}
                        <View className="flex-row flex-wrap gap-2 mt-3">
                            {(book.downloadsCount || 0) > 0 && (
                                <View className="bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 flex-row items-center gap-1">
                                    <Download size={10} color="#10b981" />
                                    <Text className="text-emerald-500 text-[10px] font-bold">
                                        {book.downloadsCount} Downloads
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Seção: Enviado Por */}
                <View className="bg-zinc-800/50 p-4 rounded-2xl mb-6 border border-zinc-700/50 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center overflow-hidden border border-zinc-600">
                            {book.owner?.image ? (
                                <Image source={{ uri: book.owner.image }} className="w-full h-full" />
                            ) : (
                                <User size={20} color="#a1a1aa" />
                            )}
                        </View>
                        <View>
                            <Text className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Enviado por</Text>
                            <Text className="text-white font-semibold text-sm">
                                {book.owner?.name || "Anônimo"}
                            </Text>
                        </View>
                    </View>
                    <View className="bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
                        <Text className="text-zinc-400 text-[10px] font-bold">
                            {book.owner?.role === 'ADMIN' ? 'ADMINISTRADOR' : 'MEMBRO'}
                        </Text>
                    </View>
                </View>

                {/* Sinopse / Descrição */}
                <View className="mb-24">
                    <Text className="text-white font-bold text-lg mb-3">Sobre o livro</Text>
                    <Text className="text-zinc-400 text-base leading-6">
                        {book.description || "Este livro não possui uma descrição disponível. Baixe para descobrir o conteúdo!"}
                    </Text>
                </View>
            </ScrollView>

            {/* Footer Fixo com Ação */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-900 border-t border-zinc-800">
                <TouchableOpacity 
                    onPress={() => onAction(book)}
                    activeOpacity={0.8}
                    className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg ${
                        book.isDownloaded ? 'bg-zinc-800 border border-zinc-700' : 'bg-emerald-600'
                    }`}
                >
                    {book.isDownloaded ? (
                        <>
                            <BookOpen size={20} color="white" />
                            <Text className="text-white font-bold text-lg">Ler Agora</Text>
                        </>
                    ) : (
                        <>
                            {book.isDownloading ? (
                                <Text className="text-white font-bold text-lg">Baixando...</Text>
                            ) : (
                                <>
                                    <Download size={20} color="white" />
                                    <Text className="text-white font-bold text-lg">Baixar Livro</Text>
                                </>
                            )}
                        </>
                    )}
                </TouchableOpacity>
            </View>

        </View>
      </View>
    </Modal>
  );
};