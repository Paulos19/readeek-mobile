import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
}

export const AuthButton = ({ title, isLoading, ...props }: AuthButtonProps) => {
  return (
    <TouchableOpacity activeOpacity={0.9} {...props} disabled={isLoading}>
      <LinearGradient
        colors={['#10b981', '#059669']} // emerald-500 -> emerald-700
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        className="w-full py-4 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/20"
        style={{ opacity: isLoading ? 0.7 : 1 }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg uppercase tracking-wider">
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};