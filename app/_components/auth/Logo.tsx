import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from 'lucide-react-native'; 

export const Logo = () => {
  return (
    <View className="items-center justify-center mb-12">
      <View className="relative items-center justify-center w-40 h-40">
        
        {/* Camada da Pena */}
        <View 
            className="absolute opacity-30 transform -rotate-[25deg] translate-x-2 translate-y-4"
        >
            <Feather 
                size={150} 
                color="#10b981" 
                fill="rgba(16, 185, 129, 0.1)" 
                strokeWidth={1.5}
            />
        </View>
        
        {/* Camada do R */}
        <Text 
            className="text-white font-black text-[110px] leading-none tracking-tighter z-10"
            style={{ 
                textShadowColor: 'rgba(0, 0, 0, 0.6)',
                textShadowOffset: { width: 4, height: 4 },
                textShadowRadius: 12,
            }}
        >
            R
        </Text>
      </View>
      
      {/* Texto Inferior */}
      <View className="items-center -mt-2">
        <Text className="text-emerald-500 font-bold text-3xl tracking-[0.25em] uppercase drop-shadow-sm">
            Readeek
        </Text>
        <View className="h-[1px] w-12 bg-emerald-500/50 my-2" />
        <Text className="text-zinc-400 text-xs font-medium tracking-[0.2em] uppercase">
            Sua leitura, elevada.
        </Text>
      </View>
    </View>
  );
};