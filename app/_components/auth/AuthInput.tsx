// app/_components/auth/AuthInput.tsx
import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { LucideIcon, Eye, EyeOff } from 'lucide-react-native';

interface AuthInputProps extends TextInputProps {
  icon: LucideIcon;
  isPassword?: boolean;
}

export const AuthInput = ({ icon: Icon, isPassword = false, ...props }: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = isPassword && !showPassword;

  return (
    <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 mb-4 focus:border-emerald-500/50">
      <Icon size={20} color="#71717a" style={{ marginRight: 12 }} />
      <TextInput
        className="flex-1 text-white text-base"
        placeholderTextColor="#52525b"
        secureTextEntry={isSecure}
        autoCapitalize="none"
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
          {showPassword ? (
            <EyeOff size={20} color="#71717a" />
          ) : (
            <Eye size={20} color="#71717a" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};