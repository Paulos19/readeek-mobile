import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary'; // Preparado para o futuro se quiser botões secundários
}

export const AuthButton = ({ 
  title, 
  onPress, 
  isLoading = false, 
  variant = 'primary' 
}: AuthButtonProps) => {
  
  const baseStyle = "w-full py-4 items-center justify-center flex-row shadow-sm active:opacity-90";
  // MUDANÇA AQUI: rounded-full substitui rounded-2xl ou rounded-lg
  const roundedStyle = "rounded-full"; 
  
  const variantStyle = variant === 'primary' 
    ? "bg-emerald-500 shadow-emerald-500/20" 
    : "bg-zinc-800 border border-zinc-700";

  const textStyle = variant === 'primary'
    ? "text-white font-bold text-lg tracking-wide"
    : "text-zinc-300 font-bold text-lg tracking-wide";

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isLoading}
      activeOpacity={0.8}
      className={`${baseStyle} ${roundedStyle} ${variantStyle} ${isLoading ? 'opacity-70' : ''}`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? "#fff" : "#a1a1aa"} />
      ) : (
        <Text className={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};