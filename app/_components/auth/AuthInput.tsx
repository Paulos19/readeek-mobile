import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { LucideIcon, Eye, EyeOff } from 'lucide-react-native';

interface AuthInputProps extends TextInputProps {
  icon: LucideIcon;
  isPassword?: boolean;
  error?: boolean; // Adicionado aqui para corrigir o erro de tipo
}

export const AuthInput = ({ icon: Icon, isPassword = false, error = false, ...props }: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = isPassword && !showPassword;

  return (
    <View 
      className={`flex-row items-center bg-zinc-900 border rounded-2xl px-4 py-4 mb-2 
      ${error ? 'border-red-500' : 'border-zinc-800 focus:border-emerald-500/50'}`}
    >
      <Icon 
        size={20} 
        color={error ? "#ef4444" : "#71717a"} 
        style={{ marginRight: 12 }} 
      />
      
      <TextInput
        className="flex-1 text-white text-base"
        placeholderTextColor="#52525b"
        secureTextEntry={isSecure}
        autoCapitalize="none"
        cursorColor={error ? "#ef4444" : "#10b981"}
        {...props}
      />

      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
          {showPassword ? (
            <EyeOff size={20} color={error ? "#ef4444" : "#71717a"} />
          ) : (
            <Eye size={20} color={error ? "#ef4444" : "#71717a"} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};