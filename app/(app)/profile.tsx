import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ScrollView, 
  Modal, TextInput, ActivityIndicator, Alert, Switch, StatusBar, FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  LogOut, Settings, ChevronRight, Shield, X, 
  Camera, Book, Users, LayoutGrid, 
  KeyRound, MessageSquare, Edit3, Search, Wifi
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Stores & Services
import { useAuthStore } from '../../stores/useAuthStore';
import { profileService, getProfileStats, toggleFollowUser, api } from '../../lib/api';

// --- TYPES ---
type TabOption = 'activity' | 'security';
type ModalType = 'none' | 'followers' | 'following' | 'posts';

// --- 1. COMPONENTES ATÔMICOS (ISOLADOS) ---

/**
 * ListModal: Modal genérico de alta performance para listagens com busca.
 */
const ListModal = React.memo(({ 
  visible, 
  title, 
  onClose, 
  data, 
  renderItem, 
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nada encontrado."
}: { 
  visible: boolean; 
  title: string; 
  onClose: () => void; 
  data: any[]; 
  renderItem: (item: any) => React.ReactElement; 
  searchPlaceholder?: string;
  emptyMessage?: string;
}) => {
  const [query, setQuery] = useState('');

  // Filtro local (Client-side)
  const filteredData = useMemo(() => {
    if (!query) return data;
    return data.filter(item => {
      const searchTarget = item.name || item.title || item.content || '';
      return searchTarget.toLowerCase().includes(query.toLowerCase());
    });
  }, [data, query]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-zinc-950">
        {/* Header Modal */}
        <View className="px-6 py-4 border-b border-zinc-900 flex-row justify-between items-center bg-zinc-950">
          <Text className="text-white font-black text-xl tracking-tight">{title}</Text>
          <TouchableOpacity onPress={onClose} className="bg-zinc-900 p-2 rounded-full">
            <X size={20} color="#e4e4e7" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="px-6 py-4">
          <View className="flex-row items-center bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-800">
            <Search size={18} color="#71717a" />
            <TextInput 
              placeholder={searchPlaceholder} 
              placeholderTextColor="#71717a"
              value={query}
              onChangeText={setQuery}
              className="flex-1 ml-3 text-white font-medium"
            />
          </View>
        </View>

        {/* Listagem */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderItem(item)}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 opacity-50">
              <Users size={40} color="#52525b" />
              <Text className="text-zinc-500 mt-4 font-bold">{emptyMessage}</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
});

/**
 * PremiumCreditCard: Design estilo "Infinite Black".
 */
const PremiumCreditCard = React.memo(({ credits, onPress }: { credits: number, onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.95} onPress={onPress} className="px-6 mb-10">
    <LinearGradient
      colors={['#18181b', '#09090b', '#000000']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      className="w-full h-52 rounded-[32px] p-6 justify-between border border-zinc-800 relative overflow-hidden shadow-2xl"
    >
      {/* Efeitos de textura */}
      <View className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
      <View className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full -ml-10 -mb-10 blur-2xl" />

      {/* Topo */}
      <View className="flex-row justify-between items-start">
        <View>
            <Text className="text-zinc-400 font-bold text-[10px] tracking-[4px] uppercase mb-1">Readeek</Text>
            <Text className="text-white font-black text-lg italic tracking-tighter">INFINITE</Text>
        </View>
        <Wifi size={24} color="#52525b" style={{ transform: [{ rotate: '90deg' }] }} />
      </View>

      {/* Chip */}
      <View className="flex-row items-center">
        <View className="w-12 h-9 rounded-lg bg-amber-200/20 border border-amber-300/30 mr-4 overflow-hidden relative justify-center items-center">
             <View className="w-full h-[1px] bg-black/20 absolute" />
             <View className="h-full w-[1px] bg-black/20 absolute" />
             <View className="w-6 h-4 rounded-sm border border-black/20" />
        </View>
        <Wifi size={16} color="transparent" /> 
      </View>

      {/* Rodapé */}
      <View className="flex-row justify-between items-end">
        <View>
             <Text className="text-zinc-500 text-[9px] font-bold uppercase mb-1 ml-1">Saldo Atual</Text>
             <Text className="text-white font-mono text-3xl font-black tracking-widest text-shadow">
                {credits.toLocaleString('pt-BR')} <Text className="text-emerald-500 text-sm">CR</Text>
             </Text>
        </View>
        
        <View className="items-end">
             <View className="flex-row">
                <View className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md -mr-3 border border-white/10" />
                <View className="w-8 h-8 rounded-full bg-emerald-500/80 backdrop-blur-md border border-white/10" />
             </View>
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
));

/**
 * ProfileHeader: Topo do perfil.
 */
const ProfileHeader = React.memo(({ user, onEditPress }: { user: any, onEditPress: () => void }) => (
  <View className="h-[280px] relative mb-6">
    <LinearGradient colors={['#064e3b', '#022c22', '#000000']} className="absolute inset-0 h-64" />
    
    <View className="px-6 flex-row justify-between items-center mt-14 z-10">
      <Text className="text-white font-black text-3xl tracking-tighter">Perfil</Text>
      <TouchableOpacity 
        onPress={onEditPress} 
        className="bg-zinc-800/80 p-3 rounded-full border border-zinc-700 backdrop-blur-md"
      >
        <Settings size={22} color="#e4e4e7" />
      </TouchableOpacity>
    </View>

    <View className="absolute -bottom-2 left-0 right-0 px-6 items-center z-20">
        <View className="relative shadow-2xl shadow-emerald-900/50">
          <Image 
            source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${user?.name}` }} 
            className="w-32 h-32 rounded-[40px] border-4 border-black bg-zinc-900"
          />
          <TouchableOpacity 
            onPress={onEditPress}
            className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-2xl border-4 border-black"
          >
            <Edit3 size={14} color="black" strokeWidth={3} />
          </TouchableOpacity>
        </View>
        <Text className="text-white text-2xl font-black mt-4 tracking-tight">{user?.name}</Text>
        <Text className="text-zinc-500 font-bold text-sm">@{user?.email?.split('@')[0]}</Text>
    </View>
  </View>
));

/**
 * StatCard: Botão interativo para abrir modais.
 */
const StatCard = React.memo(({ label, value, icon: Icon, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.7}
    className="items-center justify-center bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex-1 mx-1.5 min-h-[100px]"
  >
    <Icon size={18} color="#10b981" className="mb-2 opacity-80" />
    <Text className="text-white font-black text-2xl tracking-tighter">{value}</Text>
    <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{label}</Text>
  </TouchableOpacity>
));

/**
 * SecuritySection: Configurações de privacidade e senha.
 */
const SecuritySection = React.memo(({ 
  isPublic, 
  onToggleVisibility, 
  onChangePassword, 
  onSignOut 
}: any) => (
  <View className="mt-4">
     <View className="bg-zinc-900 rounded-[32px] border border-zinc-800 overflow-hidden">
       <TouchableOpacity 
          onPress={onChangePassword} 
          className="flex-row items-center p-5 border-b border-zinc-800 active:bg-zinc-800/50"
       >
         <View className="w-10 h-10 rounded-2xl bg-zinc-950 items-center justify-center mr-4 border border-zinc-800">
           <KeyRound size={18} color="#a1a1aa" />
         </View>
         <Text className="text-zinc-200 font-bold text-base flex-1">Alterar Senha</Text>
         <ChevronRight size={20} color="#3f3f46" />
       </TouchableOpacity>

       <View className="flex-row items-center p-5">
         <View className="w-10 h-10 rounded-2xl bg-zinc-950 items-center justify-center mr-4 border border-zinc-800">
           <Shield size={18} color={isPublic ? "#10b981" : "#a1a1aa"} />
         </View>
         <View className="flex-1 mr-4">
           <Text className="text-zinc-200 font-bold text-base">Visibilidade do Perfil</Text>
           <Text className="text-zinc-500 text-xs mt-0.5">
             Atualmente: <Text className={isPublic ? "text-emerald-500" : "text-zinc-400"}>
               {isPublic ? 'Público' : 'Privado'}
             </Text>
           </Text>
         </View>
         <Switch 
           value={isPublic} 
           onValueChange={onToggleVisibility} 
           trackColor={{ false: '#18181b', true: '#059669' }}
           thumbColor={'#ffffff'}
         />
       </View>
     </View>

     <TouchableOpacity 
       onPress={onSignOut}
       className="mt-8 flex-row items-center justify-center p-5 bg-red-500/10 rounded-[28px] border border-red-500/20 active:bg-red-500/20"
     >
       <LogOut size={20} color="#ef4444" />
       <Text className="text-red-500 font-black ml-3 uppercase tracking-widest text-xs">Encerrar Sessão</Text>
     </TouchableOpacity>

     <Text className="text-center text-zinc-800 text-[10px] mt-12 font-black uppercase tracking-[6px]">Readeek App</Text>
  </View>
));

// --- 2. ITEMS DE LISTA (RENDERERS) ---

const UserItem = ({ user, onFollow }: any) => (
  <View className="flex-row items-center bg-zinc-900/50 p-4 mb-3 rounded-2xl border border-zinc-800/50">
    <Image 
      source={{ uri: user.image || `https://ui-avatars.com/api/?name=${user.name}` }} 
      className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700" 
    />
    <View className="flex-1 ml-4">
      <Text className="text-white font-bold text-base">{user.name}</Text>
      <Text className="text-zinc-500 text-xs">@{user.name?.toLowerCase().replace(/\s/g, '')}</Text>
    </View>
    <TouchableOpacity onPress={() => onFollow(user.id)} className="bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
      <Text className="text-emerald-500 font-bold text-xs uppercase">Ver</Text>
    </TouchableOpacity>
  </View>
);

const PostItem = ({ post }: any) => (
  <View className="bg-zinc-900/50 p-5 mb-4 rounded-[24px] border border-zinc-800">
    <View className="flex-row mb-2">
      <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded-md overflow-hidden">
        {post.type || 'POST'}
      </Text>
      <Text className="text-zinc-500 text-[10px] ml-auto">{new Date(post.createdAt).toLocaleDateString()}</Text>
    </View>
    <Text className="text-zinc-200 text-sm leading-6 font-medium">{post.content}</Text>
    <View className="flex-row mt-4 border-t border-white/5 pt-3">
       <View className="flex-row items-center mr-4">
          <Users size={14} color="#52525b" />
          <Text className="text-zinc-500 text-xs ml-1.5 font-bold">{post._count?.comments || 0}</Text>
       </View>
       <View className="flex-row items-center">
          <MessageSquare size={14} color="#52525b" />
          <Text className="text-zinc-500 text-xs ml-1.5 font-bold">{post._count?.reactions || 0}</Text>
       </View>
    </View>
  </View>
);


// --- 3. TELA PRINCIPAL (ORQUESTRADOR) ---

export default function ProfileScreen() {
  const { user, signOut, updateUser, token } = useAuthStore();
  const router = useRouter();
  
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [stats, setStats] = useState<any>(null);
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // Listas Reais
  const [followersList, setFollowersList] = useState<any[]>([]); 
  const [followingList, setFollowingList] = useState<any[]>([]);

  // UI Control
  const [activeTab, setActiveTab] = useState<TabOption>('activity');
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  
  // Forms
  const [modalEdit, setModalEdit] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);
  const [isPublic, setIsPublic] = useState(user?.profileVisibility === 'PUBLIC');
  const [formName, setFormName] = useState(user?.name || '');
  const [formAbout, setFormAbout] = useState(user?.about || '');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '' });

  // Sync Effect
  useEffect(() => {
    if (user) {
      setFormName(user.name || '');
      setFormAbout(user.about || '');
      setIsPublic(user.profileVisibility === 'PUBLIC');
    }
  }, [user]);

  // Fetch Data (COM CHAMADAS REAIS DE API)
  const fetchData = useCallback(async () => {
    if (!token || !user?.id) return;
    try {
      // Executa chamadas em paralelo para performance
      const [statsRes, booksRes, followersRes, followingRes, postsRes] = await Promise.all([
        getProfileStats(),
        api.get('/mobile/books'),
        api.get(`/mobile/users/${user.id}/followers`), // API criada: Busca quem me segue
        api.get(`/mobile/users/${user.id}/following`), // API criada: Busca quem eu sigo
        api.get(`/mobile/social/posts?userId=${user.id}`) // API atualizada: Meus posts filtrados
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (statsRes?.suggestions) setSuggestions(statsRes.suggestions);

      // Livros (Mantendo filtro local pois endpoint retorna tudo)
      const myBooks = (booksRes.data || []).filter((b: any) => b.userId === user?.id);
      setUserBooks(myBooks);

      // Populando listas com dados reais
      setFollowersList(followersRes.data || []);
      setFollowingList(followingRes.data || []);
      setUserPosts(postsRes.data || []); // Já filtrado pelo backend

    } catch (e: any) {
      console.error("Erro ao carregar perfil:", e);
      if (e.response?.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, signOut]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handlers
  const handleTogglePrivacy = useCallback(async (value: boolean) => {
    const previous = isPublic;
    setIsPublic(value);
    try {
      const visibility = value ? 'PUBLIC' : 'PRIVATE';
      const updated = await profileService.update({ profileVisibility: visibility });
      updateUser(updated);
    } catch (error) {
      setIsPublic(previous);
      Alert.alert("Erro", "Falha de conexão.");
    }
  }, [isPublic, updateUser]);

  const handleSaveProfile = async () => {
    try {
      const updated = await profileService.update({
        name: formName, about: formAbout,
        profileVisibility: isPublic ? 'PUBLIC' : 'PRIVATE',
        image: formImage || undefined
      });
      updateUser(updated);
      setModalEdit(false);
      fetchData();
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (e) {
      Alert.alert("Erro", "Erro ao salvar.");
    }
  };

  const handleChangePassword = async () => {
    try {
      await profileService.changePassword(passwords.current, passwords.next);
      Alert.alert("Sucesso", "Senha alterada.");
      setModalPassword(false);
      setPasswords({ current: '', next: '' });
    } catch (e) {
      Alert.alert("Erro", "Verifique sua senha atual.");
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6,
    });
    if (!result.canceled) setFormImage(result.assets[0].uri);
  };

  if (loading && !stats) return (
    <View className="flex-1 bg-black items-center justify-center">
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* HEADER */}
        <ProfileHeader user={user} onEditPress={() => setModalEdit(true)} />

        {/* STATS GRID (Botões Interativos) */}
        <View className="flex-row justify-between px-4 mt-2 mb-8">
          <StatCard 
            label="Seguidores" 
            value={stats?._count?.followers || 0} 
            icon={Users} 
            onPress={() => setActiveModal('followers')}
          />
          <StatCard 
            label="Seguindo" 
            value={stats?._count?.following || 0} 
            icon={Users} 
            onPress={() => setActiveModal('following')}
          />
          <StatCard 
            label="Posts" 
            value={userPosts.length} 
            icon={MessageSquare} 
            onPress={() => setActiveModal('posts')}
          />
        </View>

        {/* CREDIT CARD "INFINITE" */}
        <PremiumCreditCard 
            credits={stats?.credits || 0} 
            onPress={() => router.push('/shop')} 
        />

        {/* TABS CONTROL */}
        <View className="px-6 mb-6">
            <View className="flex-row bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                <TouchableOpacity 
                    onPress={() => setActiveTab('activity')} 
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeTab === 'activity' ? 'bg-zinc-800' : ''}`}
                >
                    <LayoutGrid size={16} color={activeTab === 'activity' ? 'white' : '#71717a'} />
                    <Text className={`ml-2 font-bold text-xs ${activeTab === 'activity' ? 'text-white' : 'text-zinc-500'}`}>Atividade</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('security')} 
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeTab === 'security' ? 'bg-zinc-800' : ''}`}
                >
                    <Shield size={16} color={activeTab === 'security' ? 'white' : '#71717a'} />
                    <Text className={`ml-2 font-bold text-xs ${activeTab === 'security' ? 'text-white' : 'text-zinc-500'}`}>Segurança</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* TAB CONTENT */}
        <View className="px-6">
            {activeTab === 'activity' ? (
                <>
                    {/* ESTANTE */}
                    <View className="mb-8">
                        <Text className="text-white font-black text-lg mb-4 ml-1">Minha Estante</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {userBooks.length > 0 ? userBooks.map((book: any) => (
                                <TouchableOpacity key={book.id} className="mr-4 w-24" onPress={() => router.push(`/read/${book.id}` as any)}>
                                    <Image source={{ uri: book.coverUrl }} className="w-24 h-36 rounded-xl bg-zinc-800 border border-zinc-700" resizeMode="cover" />
                                    <Text className="text-zinc-400 text-[10px] mt-2 font-bold text-center" numberOfLines={1}>{book.title}</Text>
                                </TouchableOpacity>
                            )) : (
                                <View className="w-full bg-zinc-900/50 p-6 rounded-2xl border border-dashed border-zinc-800 items-center">
                                    <Book size={24} color="#52525b" />
                                    <Text className="text-zinc-500 text-xs font-bold mt-2">Nenhum livro iniciado</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    {/* SUGESTÕES (MANTIDO) */}
                    <View>
                        <Text className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">Sugestões para você</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {suggestions.map((item: any) => (
                                <View key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-4 mr-3 items-center w-32">
                                    <Image source={{ uri: item.image || `https://ui-avatars.com/api/?name=${item.name}` }} className="w-12 h-12 rounded-full bg-zinc-800" />
                                    <Text className="text-white font-bold text-[10px] mt-2 text-center" numberOfLines={1}>{item.name}</Text>
                                    <TouchableOpacity 
                                        onPress={() => toggleFollowUser(item.id).then(() => fetchData())}
                                        className="mt-3 bg-emerald-600 w-full py-2 rounded-full items-center"
                                    >
                                        <Text className="text-white font-black text-[8px] uppercase">Seguir</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </>
            ) : (
                <SecuritySection 
                    isPublic={isPublic}
                    onToggleVisibility={handleTogglePrivacy}
                    onChangePassword={() => setModalPassword(true)}
                    onSignOut={() => Alert.alert("Sair", "Tem certeza?", [{text: "Não"}, {text: "Sair", style: 'destructive', onPress: signOut}])}
                />
            )}
        </View>
      </ScrollView>

      {/* --- MODAIS DE LISTAGEM --- */}
      
      {/* 1. Modal de Seguidores */}
      <ListModal 
        visible={activeModal === 'followers'} 
        title="Seguidores" 
        onClose={() => setActiveModal('none')}
        data={followersList}
        emptyMessage="Você ainda não tem seguidores."
        renderItem={(item) => <UserItem user={item} onFollow={(id: string) => router.push(`/users/${id}` as any)} />}
      />

      {/* 2. Modal de Seguindo */}
      <ListModal 
        visible={activeModal === 'following'} 
        title="Seguindo" 
        onClose={() => setActiveModal('none')}
        data={followingList}
        emptyMessage="Você não segue ninguém."
        renderItem={(item) => <UserItem user={item} onFollow={(id: string) => router.push(`/users/${id}` as any)} />}
      />

      {/* 3. Modal de Posts */}
      <ListModal 
        visible={activeModal === 'posts'} 
        title="Meus Posts" 
        onClose={() => setActiveModal('none')}
        data={userPosts}
        searchPlaceholder="Buscar nos seus posts..."
        emptyMessage="Nenhum post publicado."
        renderItem={(item) => <PostItem post={item} />}
      />

      {/* --- MODAIS DE FORMULÁRIO --- */}
      
      <Modal visible={modalEdit} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-black">
          <View className="flex-row justify-between items-center p-6 border-b border-zinc-900">
            <Text className="text-white text-lg font-black">Editar Perfil</Text>
            <TouchableOpacity onPress={() => setModalEdit(false)} className="bg-zinc-900 p-2 rounded-full"><X size={20} color="white" /></TouchableOpacity>
          </View>
          <ScrollView className="p-6">
            <TouchableOpacity onPress={handlePickImage} className="items-center mb-10 self-center">
                <Image source={{ uri: formImage || user?.image || `https://ui-avatars.com/api/?name=${user?.name}` }} className="w-32 h-32 rounded-full bg-zinc-900 border border-zinc-800" />
                <View className="absolute bottom-0 right-0 bg-emerald-500 p-2.5 rounded-full border-4 border-black"><Camera size={18} color="white" /></View>
            </TouchableOpacity>
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-2">Nome</Text>
            <TextInput value={formName} onChangeText={setFormName} className="bg-zinc-900 text-white p-4 rounded-2xl border border-zinc-800 mb-6 font-bold" />
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2 ml-2">Bio</Text>
            <TextInput value={formAbout} onChangeText={setFormAbout} multiline className="bg-zinc-900 text-white p-4 rounded-2xl border border-zinc-800 min-h-[120px] mb-8" textAlignVertical="top"/>
            <TouchableOpacity onPress={handleSaveProfile} className="bg-white p-4 rounded-full items-center active:opacity-90"><Text className="text-black font-black uppercase">Salvar Alterações</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={modalPassword} animationType="fade" transparent>
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="bg-zinc-950 p-8 rounded-[32px] border border-zinc-800">
            <Text className="text-white text-xl font-black mb-6 text-center">Nova Senha</Text>
            <TextInput placeholder="Senha Atual" secureTextEntry value={passwords.current} onChangeText={(t) => setPasswords(p => ({...p, current: t}))} placeholderTextColor="#52525b" className="bg-black text-white p-4 rounded-xl border border-zinc-800 mb-3" />
            <TextInput placeholder="Nova Senha" secureTextEntry value={passwords.next} onChangeText={(t) => setPasswords(p => ({...p, next: t}))} placeholderTextColor="#52525b" className="bg-black text-white p-4 rounded-xl border border-zinc-800 mb-6" />
            <TouchableOpacity onPress={handleChangePassword} className="bg-emerald-500 p-4 rounded-xl items-center mb-3"><Text className="text-black font-bold uppercase text-xs">Confirmar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalPassword(false)} className="p-2 items-center"><Text className="text-zinc-500 font-bold text-xs">Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}