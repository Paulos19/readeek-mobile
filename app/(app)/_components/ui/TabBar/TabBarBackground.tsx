import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  height: number;
}

export const TabBarBackground = ({ height }: Props) => {
  const { width } = useWindowDimensions();
  
  const CENTER_WIDTH = 74; 
  const CURVE_DEPTH = 32;

  // Recalcula o path se a largura da tela mudar
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
    <View className="absolute bottom-0 w-full" style={{ height: height + CURVE_DEPTH }}>
      <Svg width={width} height={height + CURVE_DEPTH} style={{ position: 'absolute', bottom: 0 }}>
        <Defs>
          <LinearGradient id="tabGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#18181b" stopOpacity="1" />
            <Stop offset="1" stopColor="#09090b" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path 
            d={path} 
            fill="url(#tabGradient)" 
            stroke="#27272a" 
            strokeWidth={1}
        />
      </Svg>
    </View>
  );
};