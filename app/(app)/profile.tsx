import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ScrollView, 
  Modal, TextInput, ActivityIndicator, Alert, Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker'; // Importar ImagePicker
import { 
  LogOut, User as UserIcon, Settings, ChevronRight, 
  Lock, Shield, Mail, Edit3, X, Save, Camera 
} from 'lucide-react-native';

import { useAuthStore } from 'stores/useAuthStore';
import { profileService } from 'lib/api';

// ... (Componentes SettingItem e SectionHeader mantêm-se iguais) ...
const SettingItem = ({ icon: Icon, label, value, onPress, isDestructive = false }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="flex-row items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 active:bg-zinc-800"
  >
    <View className="flex-row items-center gap-3">
      <View className={`p-2 rounded-lg ${isDestructive ? 'bg-red-500/10' : 'bg-zinc-800'}`}>
        <Icon size={18} color={isDestructive ? '#ef4444' : '#a1a1aa'} />
      </View>
      <Text className={`${isDestructive ? 'text-red-500' : 'text-zinc-200'} font-medium`}>
        {label}
      </Text>
    </View>
    <View className="flex-row items-center gap-2">
      {value && <Text className="text-zinc-500 text-sm">{value}</Text>}
      <ChevronRight size={16} color="#52525b" />
    </View>
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider px-4 mt-6 mb-2">
    {title}
  </Text>
);

export default function Profile() {
  const { user, signOut, updateUser } = useAuthStore();
  
  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Edit Profile Form
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isPublic, setIsPublic] = useState(user?.profileVisibility === 'PUBLIC');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Estado para nova imagem
  
  const [loading, setLoading] = useState(false);

  // Password Form
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // --- FUNÇÃO DE ESCOLHER FOTO ---
  const handlePickImage = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Avatar quadrado
            quality: 0.8,   // Compressão leve
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    } catch (error) {
        Alert.alert("Erro", "Não foi possível abrir a galeria.");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      // Envia os dados (se selectedImage existir, a API trata como upload)
      const updatedUser = await profileService.update({
        name,
        about,
        profileVisibility: isPublic ? 'PUBLIC' : 'PRIVATE',
        image: selectedImage || undefined // Só envia se tiver selecionado uma nova
      });
      
      // Atualiza a store global com os dados que retornaram do backend (incluindo a nova URL do blob)
      updateUser(updatedUser);
      
      Alert.alert("Sucesso", "Perfil atualizado!");
      setShowEditProfile(false);
      setSelectedImage(null); // Reseta a seleção temporária

    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  // ... (handleChangePassword mantém-se igual) ...
  const handleChangePassword = async () => {
    if (!currentPass || !newPass) return Alert.alert("Erro", "Preencha todos os campos");
    try {
      setLoading(true);
      await profileService.changePassword(currentPass, newPass);
      Alert.alert("Sucesso", "Senha alterada com sucesso!");
      setShowChangePassword(false);
      setCurrentPass('');
      setNewPass('');
    } catch (error) {
      Alert.alert("Erro", "Senha atual incorreta ou erro no servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* HEADER */}
        <View className="bg-zinc-900 pt-16 pb-8 px-6 rounded-b-[32px] border-b border-zinc-800">
          <View className="items-center">
            {/* AVATAR COM EDIT BUTTON */}
            <View className="w-24 h-24 bg-zinc-800 rounded-full items-center justify-center border-4 border-zinc-950 mb-4 overflow-hidden relative shadow-xl">
               {user?.image ? (
                 <Image source={{ uri: user.image }} className="w-full h-full" />
               ) : (
                 <UserIcon size={40} color="#52525b" />
               )}
               <TouchableOpacity 
                 className="absolute bottom-0 w-full bg-black/60 py-1 items-center"
                 onPress={() => setShowEditProfile(true)}
               >
                 <Edit3 size={12} color="white" />
               </TouchableOpacity>
            </View>

            <Text className="text-white text-2xl font-bold">{user?.name || 'Leitor'}</Text>
            <Text className="text-zinc-500 text-sm mb-4">{user?.email}</Text>
            
            <View className="flex-row gap-2">
                <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Text className="text-emerald-500 text-xs font-bold">{user?.credits || 0} Créditos</Text>
                </View>
                <View className="bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                    <Text className="text-zinc-400 text-xs font-bold capitalize">{user?.role === 'ADMIN' ? 'Admin' : 'Leitor'}</Text>
                </View>
            </View>
          </View>
        </View>

        {/* SETTINGS GROUPS (Igual ao anterior) */}
        <View className="mt-6">
          <SectionHeader title="Conta" />
          <View className="mx-4 rounded-xl overflow-hidden">
            <SettingItem 
              icon={UserIcon} 
              label="Editar Perfil" 
              value="Nome, Foto, Bio" 
              onPress={() => setShowEditProfile(true)} 
            />
            <SettingItem 
              icon={Shield} 
              label="Privacidade" 
              value={isPublic ? 'Público' : 'Privado'} 
              onPress={() => setShowEditProfile(true)} 
            />
          </View>
          {/* ... Restante dos itens ... */}
           <SectionHeader title="Segurança" />
          <View className="mx-4 rounded-xl overflow-hidden">
            <SettingItem 
              icon={Lock} 
              label="Alterar Senha" 
              onPress={() => setShowChangePassword(true)} 
            />
          </View>

          <SectionHeader title="Sessão" />
          <View className="mx-4 rounded-xl overflow-hidden">
            <SettingItem 
              icon={LogOut} 
              label="Sair da Conta" 
              isDestructive 
              onPress={() => {
                Alert.alert("Sair", "Tem certeza que deseja sair?", [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Sair", style: 'destructive', onPress: signOut }
                ])
              }} 
            />
          </View>
        </View>
      </ScrollView>

      {/* --- MODAL EDITAR PERFIL --- */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-zinc-950">
          <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
            <Text className="text-white text-lg font-bold">Editar Perfil</Text>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <X size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          
          <ScrollView className="p-6">
            
            {/* SELEÇÃO DE FOTO DENTRO DO MODAL */}
            <View className="items-center mb-8">
                <TouchableOpacity onPress={handlePickImage} className="relative">
                    <View className="w-28 h-28 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800 overflow-hidden">
                        {/* Mostra a imagem selecionada temporariamente OU a atual do usuário */}
                        {selectedImage ? (
                            <Image source={{ uri: selectedImage }} className="w-full h-full" />
                        ) : user?.image ? (
                            <Image source={{ uri: user.image }} className="w-full h-full" />
                        ) : (
                            <UserIcon size={40} color="#52525b" />
                        )}
                    </View>
                    <View className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-full border-4 border-zinc-950">
                        <Camera size={16} color="white" />
                    </View>
                </TouchableOpacity>
                <Text className="text-zinc-500 text-xs mt-2">Toque para alterar a foto</Text>
            </View>

            {/* FORMULÁRIO DE TEXTO */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2 font-medium">Nome de Exibição</Text>
              <TextInput 
                value={name}
                onChangeText={setName}
                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 focus:border-emerald-500"
                placeholderTextColor="#52525b"
              />
            </View>

            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2 font-medium">Sobre mim</Text>
              <TextInput 
                value={about}
                onChangeText={setAbout}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 focus:border-emerald-500 min-h-[100px]"
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor="#52525b"
              />
            </View>

            <View className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-8">
               <View>
                 <Text className="text-white font-medium">Perfil Público</Text>
                 <Text className="text-zinc-500 text-xs">Outros usuários podem ver suas estantes</Text>
               </View>
               <Switch 
                 value={isPublic} 
                 onValueChange={setIsPublic} 
                 trackColor={{ false: '#3f3f46', true: '#10b981' }}
                 thumbColor="#fff"
               />
            </View>

            <TouchableOpacity 
              onPress={handleUpdateProfile}
              disabled={loading}
              className="bg-emerald-500 p-4 rounded-xl flex-row justify-center items-center active:opacity-90"
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Save size={20} color="white" />
                  <Text className="text-white font-bold ml-2">Salvar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Change Password (Mantido igual) */}
      <Modal visible={showChangePassword} animationType="slide" transparent>
        {/* ... (código do modal de senha igual ao anterior) ... */}
         <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-zinc-900 rounded-t-[32px] p-6 h-[60%]">
             <View className="w-12 h-1 bg-zinc-700 rounded-full self-center mb-6" />
             <Text className="text-white text-xl font-bold mb-6">Alterar Senha</Text>
             
             <View className="gap-4">
               <View>
                 <Text className="text-zinc-400 text-sm mb-2">Senha Atual</Text>
                 <TextInput 
                    value={currentPass}
                    onChangeText={setCurrentPass}
                    secureTextEntry
                    className="bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800"
                 />
               </View>
               
               <View>
                 <Text className="text-zinc-400 text-sm mb-2">Nova Senha</Text>
                 <TextInput 
                    value={newPass}
                    onChangeText={setNewPass}
                    secureTextEntry
                    className="bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800"
                 />
               </View>

               <TouchableOpacity 
                  onPress={handleChangePassword}
                  disabled={loading}
                  className="bg-emerald-500 p-4 rounded-xl items-center mt-4"
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Atualizar Senha</Text>}
               </TouchableOpacity>
               
               <TouchableOpacity onPress={() => setShowChangePassword(false)} className="p-4 items-center">
                 <Text className="text-zinc-500 font-medium">Cancelar</Text>
               </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}