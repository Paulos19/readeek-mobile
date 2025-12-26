import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ScrollView, 
  Modal, TextInput, ActivityIndicator, Alert, Switch, StatusBar, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  LogOut, Settings, ChevronRight, Lock, Shield, 
  Edit3, X, Save, Camera, Book, Star, Users, 
  CreditCard, LayoutGrid, Eye, EyeOff, KeyRound,
  MessageSquare, Plus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '../../stores/useAuthStore';
import { profileService, getProfileStats, toggleFollowUser, api } from '../../lib/api';

const { width } = Dimensions.get('window');

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ label, value, icon: Icon }: any) => (
  <View className="items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 flex-1 mx-1 shadow-sm">
    <Icon size={16} color="#71717a" className="mb-1" />
    <Text className="text-white font-black text-xl">{value}</Text>
    <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{label}</Text>
  </View>
);

export default function ProfileScreen() {
  const { user, signOut, updateUser, token } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [suggestions, setSuggestions] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  // Modais e Forms
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isPublic, setIsPublic] = useState(user?.profileVisibility === 'PUBLIC');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '' });

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, booksRes, feedRes] = await Promise.all([
        getProfileStats(),
        api.get('/mobile/books'),
        api.get('/mobile/social/feed')
      ]);

      if (statsRes) {
        setStats(statsRes.stats);
        setSuggestions(statsRes.suggestions || []);
      }

      // FILTRO: Apenas livros adicionados por este usuário
      const myOwnedBooks = (booksRes.data || []).filter((b: any) => b.userId === user?.id);
      setUserBooks(myOwnedBooks);
      
      // FILTRO: Meus posts
      const myPosts = (feedRes.data || []).filter((p: any) => p.userId === user?.id);
      setUserPosts(myPosts);

    } catch (e: any) {
      if (e.response?.status === 401) {
        signOut();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
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
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HEADER */}
        <View className="h-[280px] relative">
          <LinearGradient colors={['#064e3b', '#022c22', '#000000']} className="absolute inset-0 h-56" />
          
          <View className="px-6 flex-row justify-between items-center mt-12">
            <Text className="text-white font-black text-2xl tracking-tighter">Conta</Text>
            <TouchableOpacity 
              onPress={() => setShowEditProfile(true)}
              className="bg-white/10 p-2.5 rounded-full border border-white/10"
            >
              <Settings size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-0 left-0 right-0 px-6 items-center">
              <View className="relative shadow-2xl shadow-emerald-500/40">
                <Image 
                  source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${user?.name}` }} 
                  className="w-28 h-28 rounded-[35px] border-4 border-black bg-zinc-900"
                />
                <View className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-2 border-black" />
              </View>
              
              <Text className="text-white text-2xl font-black mt-3 tracking-tight">{user?.name}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-zinc-500 font-bold">@{user?.email?.split('@')[0]}</Text>
                <View className="bg-emerald-500/10 px-2 py-0.5 rounded-md ml-2 border border-emerald-500/20">
                  <Text className="text-emerald-500 text-[10px] font-black uppercase">{stats?.role || 'USER'}</Text>
                </View>
              </View>
          </View>
        </View>

        {/* CARD DE CRÉDITOS REDESENHADO (BORDA SIMÉTRICA) */}
        <View className="px-6 mt-8">
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/shop')}>
                <LinearGradient
                    colors={['#1e1b12', '#0c0a09']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 32, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)' }}
                    className="flex-row items-center p-6 shadow-2xl"
                >
                    <View style={{ borderRadius: 20 }} className="w-14 h-14 bg-amber-500/10 items-center justify-center mr-5 border border-amber-500/20">
                        <CreditCard size={28} color="#fbbf24" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-amber-500/60 text-[10px] font-black uppercase tracking-[3px] mb-1">Saldo Readeek</Text>
                        <View className="flex-row items-end">
                            <Text className="text-white font-black text-3xl tracking-tighter">{stats?.credits || 0}</Text>
                            <Text className="text-zinc-500 font-bold text-xs ml-2 mb-1.5">Créditos</Text>
                        </View>
                    </View>
                    <View className="bg-amber-500 w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-amber-500/40">
                        <Plus size={20} color="black" strokeWidth={3} />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* MÉTRICAS */}
        <View className="flex-row justify-between px-5 mt-6">
          <StatCard label="Seguidores" value={stats?._count?.followers || 0} icon={Users} />
          <StatCard label="Seguindo" value={stats?._count?.following || 0} icon={Users} />
          <StatCard label="Posts" value={userPosts.length} icon={MessageSquare} />
        </View>

        {/* TABS */}
        <View className="mt-10 px-6">
          <View className="flex-row bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 mb-8">
            <TouchableOpacity 
              onPress={() => setActiveTab('content')}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeTab === 'content' ? 'bg-zinc-800' : ''}`}
            >
              <LayoutGrid size={18} color={activeTab === 'content' ? 'white' : '#71717a'} />
              <Text className={`font-bold ml-2 ${activeTab === 'content' ? 'text-white' : 'text-zinc-500'}`}>Estante</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('settings')}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeTab === 'settings' ? 'bg-zinc-800' : ''}`}
            >
              <Shield size={18} color={activeTab === 'settings' ? 'white' : '#71717a'} />
              <Text className={`font-bold ml-2 ${activeTab === 'settings' ? 'text-white' : 'text-zinc-500'}`}>Privacidade</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'content' ? (
            <View>
               <View className="mb-10">
                    <Text className="text-white font-black text-xl tracking-tight mb-5 ml-1">Meus Livros</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {userBooks.length > 0 ? userBooks.map((book: any) => (
                            <TouchableOpacity key={book.id} className="mr-5 w-28" onPress={() => router.push(`/read/${book.id}` as any)}>
                                <View className="w-28 h-40 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg">
                                    <Image source={{ uri: book.coverUrl }} className="w-full h-full" resizeMode="cover" />
                                </View>
                                <Text className="text-zinc-200 text-[11px] mt-2 font-black px-1" numberOfLines={1}>{book.title}</Text>
                            </TouchableOpacity>
                        )) : (
                            <View className="bg-zinc-900/40 p-10 rounded-[35px] border border-zinc-800 border-dashed items-center w-[280px]">
                                <Book size={32} color="#3f3f46" />
                                <Text className="text-zinc-500 text-sm mt-3 font-bold text-center">Nenhum livro adicionado.</Text>
                            </View>
                        )}
                    </ScrollView>
               </View>

               <View className="mb-10">
                    <Text className="text-white font-black text-xl mb-5 ml-1 tracking-tight">Atividade</Text>
                    {userPosts.slice(0, 3).map((post: any) => (
                        <View key={post.id} className="bg-zinc-900/50 p-6 rounded-[32px] border border-zinc-800 mb-4">
                            <Text className="text-zinc-300 text-sm leading-6">{post.content}</Text>
                        </View>
                    ))}
               </View>
            </View>
          ) : (
            <View>
               <View className="bg-zinc-900 rounded-[35px] border border-zinc-800 overflow-hidden shadow-2xl">
                 <TouchableOpacity onPress={() => setShowChangePassword(true)} className="flex-row items-center p-6 border-b border-zinc-800">
                   <View className="w-10 h-10 rounded-2xl bg-zinc-800 items-center justify-center mr-4 border border-zinc-700"><KeyRound size={18} color="#a1a1aa" /></View>
                   <Text className="text-zinc-200 font-bold">Alterar Senha</Text>
                   <View className="flex-1" /><ChevronRight size={18} color="#3f3f46" />
                 </TouchableOpacity>

                 <View className="flex-row items-center p-6">
                   <View className="w-10 h-10 rounded-2xl bg-zinc-800 items-center justify-center mr-4 border border-zinc-700"><Shield size={18} color="#a1a1aa" /></View>
                   <View className="flex-1">
                     <Text className="text-zinc-200 font-bold">Visibilidade</Text>
                     <Text className="text-zinc-600 text-[10px] font-black uppercase">Perfil {isPublic ? 'Público' : 'Privado'}</Text>
                    </View>
                   <Switch value={isPublic} onValueChange={(v) => { setIsPublic(v); handleUpdateProfile(); }} trackColor={{ false: '#27272a', true: '#10b981' }} />
                 </View>
               </View>

               <TouchableOpacity onPress={() => Alert.alert("Sair", "Encerrar sessão?", [{text: "Não"}, {text: "Sair", style: 'destructive', onPress: signOut}])}
                className="mt-10 flex-row items-center justify-center p-6 bg-red-500/5 rounded-[35px] border border-red-500/10">
                 <LogOut size={20} color="#ef4444" />
                 <Text className="text-red-500 font-black ml-3 uppercase tracking-widest text-xs">Encerrar Sessão</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Text className="text-center text-zinc-800 text-[10px] mt-20 font-black uppercase tracking-[6px]">READEEK MOBILE v1.2</Text>
      </ScrollView>

      {/* MODAL EDITAR PERFIL */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-black">
          <View className="flex-row justify-between items-center p-6 border-b border-zinc-900">
            <Text className="text-white text-xl font-black tracking-tighter">Editar Perfil</Text>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}><X size={24} color="white" /></TouchableOpacity>
          </View>
          <ScrollView className="px-6 pt-10">
            <TouchableOpacity onPress={handlePickImage} className="items-center mb-12">
                <Image source={{ uri: selectedImage || user?.image || `https://ui-avatars.com/api/?name=${user?.name}` }} className="w-32 h-32 rounded-[45px] bg-zinc-900 border border-zinc-800" />
                <View className="absolute bottom-0 right-1/3 bg-emerald-500 p-2.5 rounded-2xl border-4 border-black"><Camera size={20} color="white" /></View>
            </TouchableOpacity>
            <TextInput value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor="#3f3f46" className="bg-zinc-900 text-white p-5 rounded-[25px] border border-zinc-800 mb-6 font-bold" />
            <TextInput value={about} onChangeText={setAbout} multiline placeholder="Bio" placeholderTextColor="#3f3f46" className="bg-zinc-900 text-white p-5 rounded-[25px] border border-zinc-800 min-h-[140px]" />
            <TouchableOpacity onPress={handleUpdateProfile} className="bg-white p-5 rounded-[30px] mt-12 flex-row justify-center items-center active:opacity-90"><Text className="text-black font-black uppercase">Salvar Perfil</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL SENHA */}
      <Modal visible={showChangePassword} animationType="fade" transparent>
        <View className="flex-1 bg-black/95 justify-center px-6">
          <View className="bg-zinc-900 p-8 rounded-[45px] border border-zinc-800 shadow-2xl">
            <Text className="text-white text-2xl font-black mb-6 text-center">Segurança</Text>
            <TextInput placeholder="Senha Atual" secureTextEntry value={passwords.current} onChangeText={(t) => setPasswords(p => ({...p, current: t}))} placeholderTextColor="#3f3f46" className="bg-black text-white p-5 rounded-[25px] border border-zinc-800 mb-4" />
            <TextInput placeholder="Nova Senha" secureTextEntry value={passwords.next} onChangeText={(t) => setPasswords(p => ({...p, next: t}))} placeholderTextColor="#3f3f46" className="bg-black text-white p-5 rounded-[25px] border border-zinc-800 mb-6" />
            <TouchableOpacity onPress={async () => { try { await profileService.changePassword(passwords.current, passwords.next); Alert.alert("Sucesso", "Senha alterada!"); setShowChangePassword(false); } catch(e) { Alert.alert("Erro", "Senha incorreta."); } }} className="bg-white p-5 rounded-[25px] items-center"><Text className="text-black font-black uppercase">Confirmar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowChangePassword(false)} className="mt-4 items-center"><Text className="text-zinc-500 font-bold">Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}