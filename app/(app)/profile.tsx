import React, { useEffect, useState } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ScrollView, 
  Modal, TextInput, ActivityIndicator, Alert, Switch, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  LogOut, Settings, ChevronRight, Lock, Shield, 
  Edit3, X, Save, Camera, Book, Star, Users, 
  CreditCard, LayoutGrid, Eye, EyeOff, KeyRound, ArrowRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';

import { useAuthStore } from '../../stores/useAuthStore';
import { profileService, getProfileStats, toggleFollowUser } from '../../lib/api';

// --- COMPONENTES AUXILIARES ---
const StatCard = ({ label, value, icon: Icon }: any) => (
  <View className="items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 flex-1 mx-1 shadow-sm">
    <Icon size={16} color="#71717a" className="mb-1" />
    <Text className="text-white font-black text-xl">{value}</Text>
    <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{label}</Text>
  </View>
);

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  // Forms
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isPublic, setIsPublic] = useState(user?.profileVisibility === 'PUBLIC');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await getProfileStats();
      setStats(data.stats);
      setSuggestions(data.suggestions);
    } catch (e: any) {
      if (e.response?.status === 401) {
        signOut();
        router.replace('/login');
      }
    } finally { setLoading(false); }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const updatedUser = await profileService.update({
        name, about,
        profileVisibility: isPublic ? 'PUBLIC' : 'PRIVATE',
        image: selectedImage || undefined
      });
      updateUser(updatedUser);
      Alert.alert("Sucesso", "Perfil atualizado!");
      setShowEditProfile(false);
      loadData();
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar.");
    } finally { setLoading(false); }
  };

  if (loading && !stats) return (
    <View className="flex-1 bg-black items-center justify-center">
      <ActivityIndicator size="large" color="#10b981" />
      <Text className="text-zinc-500 mt-4 font-medium">Carregando perfil...</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View className="h-[340px] relative">
          <LinearGradient colors={['#064e3b', '#022c22', '#000000']} className="absolute inset-0 h-72" />
          
          <View className="px-6 flex-row justify-between items-center mt-12">
            <Text className="text-white font-black text-2xl tracking-tighter">Conta</Text>
            <TouchableOpacity onPress={() => setShowEditProfile(true)} className="bg-white/10 p-2.5 rounded-full border border-white/10">
              <Settings size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-0 left-0 right-0 px-6 items-center">
            <Animated.View entering={FadeInDown.delay(200)} className="items-center">
              <View className="relative">
                <Image 
                  source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${user?.name}` }} 
                  className="w-32 h-32 rounded-[40px] border-4 border-black bg-zinc-900"
                />
                <View className="absolute -bottom-1 -right-1 bg-emerald-500 w-8 h-8 rounded-full border-4 border-black items-center justify-center">
                   <View className="w-2 h-2 rounded-full bg-white" />
                </View>
              </View>
              <Text className="text-white text-3xl font-black mt-4 tracking-tight">{user?.name}</Text>
              <Text className="text-zinc-500 font-bold">@{user?.email?.split('@')[0]}</Text>
              
              <View className="mt-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{stats?.role || 'MEMBRO'}</Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* MÉTRIQUES */}
        <Animated.View entering={FadeIn.delay(400)} className="flex-row justify-between px-5 mt-8">
          <StatCard label="Seguidores" value={stats?._count?.followers || 0} icon={Users} />
          <StatCard label="Seguindo" value={stats?._count?.following || 0} icon={Users} />
          <StatCard label="Livros" value={stats?._count?.books || 0} icon={Book} />
        </Animated.View>

        {/* BIO & CRÉDITOS */}
        <View className="px-6 mt-8">
          <View className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 mb-6 flex-row items-center">
             <View className="w-12 h-12 bg-amber-500/10 rounded-2xl items-center justify-center mr-4">
                <CreditCard size={24} color="#fbbf24" />
             </View>
             <View className="flex-1">
                <Text className="text-zinc-500 text-[10px] font-black uppercase">Saldo Readeek</Text>
                <Text className="text-white font-black text-xl">{stats?.credits || 0} Créditos</Text>
             </View>
             <TouchableOpacity className="bg-zinc-800 p-2 rounded-xl">
                <ArrowRight size={16} color="#fbbf24" />
             </TouchableOpacity>
          </View>

          <Text className="text-zinc-400 text-center leading-5 text-sm italic px-4">
            "{user?.about || 'Apaixonado por livros e novas histórias...'}"
          </Text>
        </View>

        {/* TABS */}
        <View className="mt-10 px-6">
          <View className="flex-row bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800 mb-6">
            <TouchableOpacity onPress={() => setActiveTab('content')} className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeTab === 'content' ? 'bg-zinc-800' : ''}`}>
              <LayoutGrid size={18} color={activeTab === 'content' ? 'white' : '#71717a'} />
              <Text className={`font-bold ml-2 ${activeTab === 'content' ? 'text-white' : 'text-zinc-500'}`}>Estante</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('settings')} className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeTab === 'settings' ? 'bg-zinc-800' : ''}`}>
              <Shield size={18} color={activeTab === 'settings' ? 'white' : '#71717a'} />
              <Text className={`font-bold ml-2 ${activeTab === 'settings' ? 'text-white' : 'text-zinc-500'}`}>Segurança</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'content' ? (
            <Animated.View entering={FadeInRight}>
               <TouchableOpacity onPress={() => router.push('/library' as any)} className="flex-row items-center bg-zinc-900 p-5 rounded-3xl border border-zinc-800 mb-3">
                 <View className="w-12 h-12 bg-emerald-500/20 rounded-2xl items-center justify-center mr-4"><Book size={24} color="#10b981" /></View>
                 <View className="flex-1"><Text className="text-white font-bold text-lg">Minha Biblioteca</Text><Text className="text-zinc-500 text-xs">Acesse seus EPUBs salvos</Text></View>
                 <ChevronRight size={20} color="#3f3f46" />
               </TouchableOpacity>
               
               <TouchableOpacity onPress={() => router.push('/(app)/dashboard/highlights' as any)} className="flex-row items-center bg-zinc-900 p-5 rounded-3xl border border-zinc-800 mb-8">
                 <View className="w-12 h-12 bg-amber-500/20 rounded-2xl items-center justify-center mr-4"><Star size={24} color="#fbbf24" /></View>
                 <View className="flex-1"><Text className="text-white font-bold text-lg">Destaques</Text><Text className="text-zinc-500 text-xs">Citações e anotações</Text></View>
                 <ChevronRight size={20} color="#3f3f46" />
               </TouchableOpacity>
               
               <Text className="text-zinc-500 font-black text-[10px] uppercase tracking-[3px] mb-4 ml-1">Quem seguir</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                 {suggestions.map((item: any) => (
                   <View key={item.id} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 mr-4 items-center w-36">
                     <Image source={{ uri: item.image || `https://ui-avatars.com/api/?name=${item.name}` }} className="w-14 h-14 rounded-2xl bg-zinc-800" />
                     <Text className="text-white font-bold text-xs mt-3" numberOfLines={1}>{item.name}</Text>
                     <TouchableOpacity onPress={() => toggleFollowUser(item.id).then(() => loadData())} className="mt-3 bg-white py-1.5 px-4 rounded-full">
                       <Text className="text-black font-black text-[10px]">SEGUIR</Text>
                     </TouchableOpacity>
                   </View>
                 ))}
               </ScrollView>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInRight}>
               <View className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                 <TouchableOpacity onPress={() => setShowChangePassword(true)} className="flex-row items-center p-5 border-b border-zinc-800">
                   <KeyRound size={20} color="#a1a1aa" /><Text className="text-zinc-200 font-bold ml-4">Alterar Senha</Text>
                   <View className="flex-1" /><ChevronRight size={18} color="#3f3f46" />
                 </TouchableOpacity>
                 <View className="flex-row items-center p-5">
                   <Shield size={20} color="#a1a1aa" />
                   <View className="ml-4 flex-1"><Text className="text-zinc-200 font-bold">Perfil Visível</Text><Text className="text-zinc-500 text-[10px]">Público para outros leitores</Text></View>
                   <Switch value={isPublic} onValueChange={(v) => { setIsPublic(v); handleUpdateProfile(); }} trackColor={{ true: '#10b981' }} />
                 </View>
               </View>

               <TouchableOpacity onPress={() => Alert.alert("Sair", "Deseja encerrar sessão?", [{text: "Não"}, {text: "Sair", style: 'destructive', onPress: () => { signOut(); router.replace('/login'); }}])}
                className="mt-10 flex-row items-center justify-center p-5 bg-red-500/10 rounded-3xl border border-red-500/20">
                 <LogOut size={20} color="#ef4444" /><Text className="text-red-500 font-black ml-3">DESCONECTAR</Text>
               </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* MODAL EDITAR PERFIL */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-zinc-950">
          <View className="flex-row justify-between items-center p-6 border-b border-zinc-900">
            <Text className="text-white text-xl font-black">Meu Perfil</Text>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}><X size={24} color="white" /></TouchableOpacity>
          </View>
          <ScrollView className="px-6 pt-8">
            <View className="items-center mb-10">
              <TouchableOpacity onPress={handlePickImage} className="relative">
                <Image source={{ uri: selectedImage || user?.image || `https://ui-avatars.com/api/?name=${user?.name}` }} className="w-32 h-32 rounded-[45px] bg-zinc-900" />
                <View className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-2xl border-4 border-zinc-950"><Camera size={20} color="white" /></View>
              </TouchableOpacity>
            </View>
            <Text className="text-zinc-500 text-[10px] font-black uppercase mb-2 ml-1">Nome Público</Text>
            <TextInput value={name} onChangeText={setName} placeholderTextColor="#3f3f46" className="bg-zinc-900 text-white p-5 rounded-2xl border border-zinc-800 mb-6 font-bold" />
            
            <Text className="text-zinc-500 text-[10px] font-black uppercase mb-2 ml-1">Bio / Status</Text>
            <TextInput value={about} onChangeText={setAbout} multiline placeholder="Conte algo sobre você..." placeholderTextColor="#3f3f46" className="bg-zinc-900 text-white p-5 rounded-2xl border border-zinc-800 min-h-[120px]" />
            
            <TouchableOpacity onPress={handleUpdateProfile} className="bg-emerald-500 p-5 rounded-3xl mt-10 shadow-lg flex-row justify-center items-center">
              <Save size={20} color="black" /><Text className="text-black font-black ml-2">SALVAR ALTERAÇÕES</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL ALTERAR SENHA */}
      <Modal visible={showChangePassword} animationType="fade" transparent>
        <View className="flex-1 bg-black/90 justify-center px-6">
          <View className="bg-zinc-900 p-8 rounded-[40px] border border-zinc-800">
            <Text className="text-white text-2xl font-black mb-2 text-center">Segurança</Text>
            <Text className="text-zinc-500 text-center mb-8 text-sm">Atualize sua senha de acesso</Text>
            
            <TextInput placeholder="Senha Atual" secureTextEntry value={passwords.current} onChangeText={(t) => setPasswords(p => ({...p, current: t}))} placeholderTextColor="#3f3f46" className="bg-black text-white p-5 rounded-2xl border border-zinc-800 mb-4" />
            <TextInput placeholder="Nova Senha" secureTextEntry value={passwords.next} onChangeText={(t) => setPasswords(p => ({...p, next: t}))} placeholderTextColor="#3f3f46" className="bg-black text-white p-5 rounded-2xl border border-zinc-800 mb-6" />

            <TouchableOpacity onPress={async () => {
              try {
                await profileService.changePassword(passwords.current, passwords.next);
                Alert.alert("Sucesso", "Senha alterada!");
                setShowChangePassword(false);
              } catch(e) { Alert.alert("Erro", "Senha atual incorreta."); }
            }} className="bg-white p-5 rounded-3xl items-center">
              <Text className="text-black font-black">CONFIRMAR TROCA</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowChangePassword(false)} className="mt-4 items-center">
              <Text className="text-zinc-500 font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}