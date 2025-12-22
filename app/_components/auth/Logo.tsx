import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export const Logo = () => {
  return (
    <View className="items-center justify-center mb-12">
       {/* DISCLAIMER SÊNIOR: 
         Para o efeito exato de "caneta se misturando ao contorno do R", 
         você PRECISA de um SVG desenhado por um designer.
         
         Este código abaixo é uma representação conceitual usando SVG programático 
         para ilustrar a ideia de uma pena (PenTool) atrás de um 'R'.
       */}
      <View className="relative w-32 h-32 items-center justify-center">
        {/* Fundo Sutil da Pena */}
        <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="none" className="absolute opacity-20 scale-150">
             <Path 
                d="M15.707 2.293a1 1 0 0 0-1.414 0l-9.586 9.586a1 1 0 0 0 0 1.414l9.586 9.586a1 1 0 0 0 1.414 0l9.586-9.586a1 1 0 0 0 0-1.414l-9.586-9.586zM15 4l8 8l-8 8l-8-8l8-8z" 
                fill="#10b981" 
             />
        </Svg>
        
        {/* O "R" de Readeek */}
        <Text className="text-white font-black text-7xl tracking-tighter drop-shadow-2xl" style={{
             textShadowColor: 'rgba(16, 185, 129, 0.5)',
             textShadowOffset: { width: 0, height: 4 },
             textShadowRadius: 10
        }}>
            R
        </Text>

      </View>
      <Text className="text-emerald-500 font-bold text-2xl -mt-4 tracking-[0.2em] uppercase">Readeek</Text>
      <Text className="text-zinc-500 text-sm">Sua leitura, elevado.</Text>
    </View>
  );
};