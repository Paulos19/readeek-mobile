import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  height: number;
  width: number;
}

export const TabBarBackground = ({ height, width }: Props) => {
  // Configuração da curva central
  const CENTER_WIDTH = 74; 
  const CURVE_DEPTH = 32; // Profundidade da "cavidade"

  // O path agora usa a prop 'width' passada, não a largura total da tela
  const path = `
    M0,0 
    L${(width - CENTER_WIDTH) / 2 - 20},0
    C${(width - CENTER_WIDTH) / 2 - 10},0 ${(width - CENTER_WIDTH) / 2},${CURVE_DEPTH * 0.2} ${(width - CENTER_WIDTH) / 2},${CURVE_DEPTH * 0.6}
    Q${width / 2},${CURVE_DEPTH * 1.4} ${(width + CENTER_WIDTH) / 2},${CURVE_DEPTH * 0.6}
    C${(width + CENTER_WIDTH) / 2},${CURVE_DEPTH * 0.2} ${(width + CENTER_WIDTH) / 2 + 10},0 ${(width + CENTER_WIDTH) / 2 + 20},0
    L${width},0 
    L${width},${height} 
    L0,${height} 
    Z
  `;

  return (
    <View style={{ height: height + CURVE_DEPTH, width: width }}>
      <Svg width={width} height={height + CURVE_DEPTH} style={{ position: 'absolute', top: 0 }}>
        <Defs>
          <LinearGradient id="tabGradient" x1="0" y1="0" x2="0" y2="1">
            {/* Gradiente sutil para dar volume */}
            <Stop offset="0" stopColor="#18181b" stopOpacity="1" />
            <Stop offset="1" stopColor="#09090b" stopOpacity="1" /> 
          </LinearGradient>
        </Defs>
        <Path 
            d={path} 
            fill="url(#tabGradient)" 
            stroke="#27272a" // Borda sutil zinc-800
            strokeWidth={1}
        />
      </Svg>
    </View>
  );
};