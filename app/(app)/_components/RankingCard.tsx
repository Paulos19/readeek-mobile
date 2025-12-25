import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { RankingUser } from '../../../lib/api';

interface RankingCardProps {
  user: RankingUser;
  position: number;
}

export const RankingCard = ({ user, position }: RankingCardProps) => {
  let medalColor = "#71717a";
  if (position === 1) medalColor = "#fbbf24";
  if (position === 2) medalColor = "#9ca3af";
  if (position === 3) medalColor = "#b45309";

  return (
    <Link href={`/(app)/users/${user.id}`} asChild>
      <TouchableOpacity className="mr-4 items-center w-28">
        <View className="relative mb-2">
          <View className={`w-20 h-20 rounded-full border-2 p-1 ${position <= 3 ? 'border-emerald-500' : 'border-zinc-800'}`}>
             <Image 
                source={{ uri: user.image || `https://ui-avatars.com/api/?name=${user.name}` }} 
                className="w-full h-full rounded-full bg-zinc-800"
             />
          </View>
          
          <View 
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full items-center justify-center border-2 border-black"
            style={{ backgroundColor: position <= 3 ? medalColor : '#27272a' }}
          >
            <Text className="text-white font-bold text-xs">{position}º</Text>
          </View>
        </View>

        <Text numberOfLines={1} className="text-white font-bold text-sm text-center mb-0.5">
            {user.name}
        </Text>
        <View className="flex-row items-center bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
            <Trophy size={10} color="#fbbf24" style={{ marginRight: 4 }} />
            {/* ATUALIZADO AQUI: user.score */}
            <Text className="text-zinc-400 text-[10px] font-bold">{user.score} pts</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};