import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { LucideIcon, Eye, EyeOff } from 'lucide-react-native';
import clsx from 'clsx';

interface AuthInputProps extends TextInputProps {
  icon: LucideIcon;
  isPassword?: boolean;
}

export const AuthInput = ({ icon: Icon, isPassword = false, className, ...props }: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = isPassword && !showPassword;

  return (
    <View className={clsx("flex-row items-center bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-3.5 mb-4 focus:border-emerald-500/50 transition-colors", className)}>
      <Icon size={20} color="#71717a" className="mr-3" />
      <TextInput
        className="flex-1 text-white text-base font-medium"
        placeholderTextColor="#52525b"
        secureTextEntry={isSecure}
        autoCapitalize="none"
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
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