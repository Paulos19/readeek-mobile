import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Trophy, Download } from 'lucide-react-native';
import { Book } from '../_types/book';

interface Props {
    book: Book;
    position: number;
    onPress: (book: Book) => void;
}

export const RankingCard = ({ book, position, onPress }: Props) => {
    let badgeColor = 'text-zinc-400';
    let iconColor = '#a1a1aa';
    
    if (position === 1) { badgeColor = 'text-yellow-400'; iconColor = '#facc15'; }
    if (position === 2) { badgeColor = 'text-gray-300'; iconColor = '#d4d4d8'; }
    if (position === 3) { badgeColor = 'text-amber-600'; iconColor = '#d97706'; }

    return (
        <TouchableOpacity 
            onPress={() => onPress(book)}
            activeOpacity={0.7}
            className="flex-row items-center bg-zinc-900/50 p-3 rounded-2xl mb-3 border border-white/5"
        >
            {/* Posição */}
            <View className="w-8 items-center justify-center mr-3">
                {position <= 3 ? <Trophy size={20} color={iconColor} /> : <Text className="text-zinc-500 font-bold text-lg">#{position}</Text>}
            </View>

            {/* Capa Pequena */}
            <View className="w-12 h-16 rounded-lg bg-zinc-800 overflow-hidden mr-3">
                 {book.coverUrl && <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />}
            </View>

            {/* Info */}
            <View className="flex-1">
                <Text className="text-white font-bold text-sm" numberOfLines={1}>{book.title}</Text>
                <Text className="text-zinc-500 text-xs" numberOfLines={1}>{book.author}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                    <Download size={10} color="#10b981" />
                    <Text className="text-emerald-500 text-[10px] font-bold">{book.downloadsCount || 0} downloads</Text>
                </View>
            </View>

            {/* Badge de Posição */}
            <View className="px-3">
                <Text className={`font-black text-xl italic ${badgeColor}`}>{position}</Text>
            </View>
        </TouchableOpacity>
    );
};