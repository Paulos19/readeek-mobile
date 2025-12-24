import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Lock, Unlock, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { communityService } from 'lib/api';

export default function CreateCommunity() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Formato Banner
      quality: 0.7,
    });

    if (!result.canceled) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("Erro", "O nome é obrigatório.");
    if (isPrivate && !password.trim()) return Alert.alert("Erro", "Comunidades privadas precisam de senha.");

    setLoading(true);
    try {
      await communityService.create({
        name,
        description,
        visibility: isPrivate ? 'private' : 'public',
        password,
        coverUri: coverUri || undefined
      });
      
      Alert.alert("Sucesso", "Comunidade criada!");
      router.back();
      router.replace('/(app)/community'); // Recarrega a lista se possível ou apenas volta
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar comunidade.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <SafeAreaView edges={['top']}>
        <View className="px-4 py-3 flex-row items-center border-b border-zinc-800">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg">Nova Comunidade</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Banner Upload */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8} className="mb-6">
            {coverUri ? (
                <View className="w-full h-40 rounded-xl overflow-hidden border border-zinc-700 relative">
                    <Image source={{ uri: coverUri }} className="w-full h-full" resizeMode="cover" />
                    <View className="absolute inset-0 bg-black/30 items-center justify-center">
                        <Camera color="white" size={32} />
                    </View>
                </View>
            ) : (
                <View className="w-full h-40 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 items-center justify-center">
                    <Upload color="#71717a" size={32} />
                    <Text className="text-zinc-500 mt-2 font-medium">Adicionar Capa (Banner)</Text>
                    <Text className="text-zinc-600 text-xs">Recomendado 16:9</Text>
                </View>
            )}
        </TouchableOpacity>

        {/* Nome */}
        <View className="mb-4">
            <Text className="text-zinc-400 mb-2 font-bold">Nome da Comunidade</Text>
            <TextInput 
                value={name}
                onChangeText={setName}
                placeholder="Ex: Clube do Terror"
                placeholderTextColor="#52525b"
                className="bg-zinc-900 p-4 rounded-xl text-white border border-zinc-800 focus:border-emerald-500"
            />
        </View>

        {/* Descrição */}
        <View className="mb-6">
            <Text className="text-zinc-400 mb-2 font-bold">Descrição</Text>
            <TextInput 
                value={description}
                onChangeText={setDescription}
                placeholder="Sobre o que vamos conversar?"
                placeholderTextColor="#52525b"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-zinc-900 p-4 rounded-xl text-white border border-zinc-800 min-h-[100px] focus:border-emerald-500"
            />
        </View>

        {/* Privacidade */}
        <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-6">
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                    {isPrivate ? <Lock size={20} color="#ef4444" /> : <Unlock size={20} color="#10b981" />}
                    <Text className="text-white font-bold text-base">Comunidade Privada</Text>
                </View>
                <Switch 
                    value={isPrivate} 
                    onValueChange={setIsPrivate}
                    trackColor={{ false: "#3f3f46", true: "#ef4444" }}
                    thumbColor="white"
                />
            </View>
            <Text className="text-zinc-500 text-xs mb-4">
                {isPrivate 
                    ? "Apenas membros com a senha poderão entrar e ver o conteúdo." 
                    : "Qualquer pessoa pode entrar e participar das discussões."}
            </Text>

            {isPrivate && (
                <TextInput 
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Defina uma senha de acesso"
                    placeholderTextColor="#71717a"
                    secureTextEntry
                    className="bg-zinc-950 p-3 rounded-lg text-white border border-zinc-700"
                />
            )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl items-center flex-row justify-center ${loading ? 'bg-emerald-800' : 'bg-emerald-600'}`}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className="text-white font-bold text-lg">Criar Comunidade</Text>
            )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}