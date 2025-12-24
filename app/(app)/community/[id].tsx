import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Share, Image, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, FileText, Settings, Plus, Share2, Crown, UserX, MessageSquare, Heart, Download, Users } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { communityService } from 'lib/api';
import { useAuthStore } from 'stores/useAuthStore';

// Componente de Abas
const Tabs = ({ active, onChange, isOwner }: { active: string, onChange: (t: string) => void, isOwner: boolean }) => (
  <View className="flex-row border-b border-zinc-800 mb-4 px-4">
    {['feed', 'files', 'settings'].map((tab) => {
      if (tab === 'settings' && !isOwner) return null;
      
      const labels: Record<string, string> = { feed: 'Feed', files: 'Arquivos', settings: 'Admin' };
      const isActive = active === tab;
      
      return (
        <TouchableOpacity 
          key={tab} 
          onPress={() => onChange(tab)}
          className={`mr-6 py-3 items-center ${isActive ? 'border-b-2 border-emerald-500' : ''}`}
        >
          <Text className={`${isActive ? 'text-emerald-500 font-bold' : 'text-zinc-500 font-medium'}`}>
            {labels[tab]}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function CommunityHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  
  // Estados de Segurança e Acesso
  const [isMember, setIsMember] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [joining, setJoining] = useState(false);

  // Carregamento Inicial
  const fetchData = async () => {
    if (!id) return;
    try {
      const res = await communityService.getById(id);
      setData(res);
      
      // Verifica se o usuário logado está na lista de membros ou é o dono
      const membership = res.members?.find((m: any) => m.userId === user?.id);
      setIsMember(!!membership || res.ownerId === user?.id);

    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível carregar a comunidade");
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => { fetchData(); }, [id]);

  // Ações
  const handleJoin = async () => {
    if (!passwordInput.trim()) return Alert.alert("Atenção", "Digite a senha.");
    
    setJoining(true);
    try {
        await communityService.join(id!, passwordInput);
        Alert.alert("Sucesso", "Bem-vindo à comunidade!");
        setPasswordInput('');
        fetchData(); // Recarrega para liberar o acesso
    } catch (error: any) {
        Alert.alert("Acesso Negado", "Senha incorreta.");
    } finally {
        setJoining(false);
    }
  };

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip'],
        copyToCacheDirectory: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        try {
            await communityService.uploadFile(id!, file.uri, file.name, file.mimeType || 'application/pdf');
            Alert.alert("Enviado", "Arquivo compartilhado com a comunidade!");
            fetchData();
        } catch (e) {
            Alert.alert("Erro", "Falha no upload.");
        }
    }
  };

  const handleInvite = async () => {
    await Share.share({
        message: `Entre na minha comunidade "${data.name}" no Readeek!`,
    });
  };

  const handleMemberAction = async (memberId: string, action: 'BAN' | 'PROMOTE') => {
      try {
          await communityService.manageMember(id!, memberId, action);
          Alert.alert("Sucesso", `Membro ${action === 'BAN' ? 'removido' : 'promovido'}!`);
          fetchData();
      } catch (e) {
          Alert.alert("Erro", "Falha na ação.");
      }
  };

  if (loading) {
    return (
        <View className="flex-1 bg-zinc-950 justify-center items-center">
            <ActivityIndicator color="#10b981" />
        </View>
    );
  }

  if (!data) return null;

  const isOwner = data.ownerId === user?.id;
  const isPrivate = data.visibility === 'PRIVATE';
  const isLocked = isPrivate && !isMember;

  // --- TELA BLOQUEADA (Senha) ---
  if (isLocked) {
      return (
        <SafeAreaView className="flex-1 bg-zinc-950 px-6 justify-center items-center">
             <View className="w-20 h-20 bg-zinc-900 rounded-full items-center justify-center mb-6 border border-zinc-800">
                <Lock size={32} color="#ef4444" />
             </View>
             
             <Text className="text-white text-2xl font-bold text-center mb-2">{data.name}</Text>
             <Text className="text-zinc-500 text-center mb-8">
                Esta comunidade é privada. Digite a senha para entrar.
             </Text>
             
             <TextInput 
                placeholder="Senha de acesso"
                placeholderTextColor="#71717a"
                secureTextEntry
                className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white mb-4 text-center font-bold"
                value={passwordInput}
                onChangeText={setPasswordInput}
             />
             
             <TouchableOpacity 
                onPress={handleJoin}
                disabled={joining}
                className="w-full bg-emerald-600 py-4 rounded-xl items-center mb-4"
             >
                {joining ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Entrar</Text>}
             </TouchableOpacity>

             <TouchableOpacity onPress={() => router.back()}>
                 <Text className="text-zinc-500 font-medium">Voltar</Text>
             </TouchableOpacity>
        </SafeAreaView>
      );
  }

  // --- TELA DA COMUNIDADE (Logado) ---
  return (
    <View className="flex-1 bg-zinc-950">
      <SafeAreaView edges={['top']} className="z-10 bg-zinc-950/80 absolute top-0 w-full">
         {/* Header Flutuante Transparente */}
         <View className="px-4 py-3 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="bg-black/40 p-2 rounded-full backdrop-blur-md">
                <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            
            <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleInvite} className="bg-black/40 p-2 rounded-full backdrop-blur-md">
                    <Share2 color="#10b981" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpload} className="bg-emerald-600 p-2 rounded-full shadow-lg shadow-emerald-900/50">
                    <Plus color="white" size={20} />
                </TouchableOpacity>
            </View>
         </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981"/>}
      >
        
        {/* BANNER DA COMUNIDADE */}
        <View className="w-full h-64 bg-zinc-900 relative mb-4">
            {data.coverUrl ? (
                <Image 
                    source={{ uri: data.coverUrl }} 
                    className="w-full h-full" 
                    resizeMode="cover"
                />
            ) : (
                <View className="w-full h-full items-center justify-center bg-zinc-800">
                    <Users size={64} color="#3f3f46" />
                </View>
            )}
            {/* Gradiente Overlay */}
            <View className="absolute inset-0 bg-black/30" />
            <View className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
            
            {/* Info Sobreposta ao Banner */}
            <View className="absolute bottom-4 left-4 right-4">
                <Text className="text-white font-black text-3xl mb-1 shadow-black/50 shadow-lg">{data.name}</Text>
                <View className="flex-row items-center gap-2">
                    <Text className="text-zinc-300 text-xs bg-black/40 px-2 py-1 rounded-md backdrop-blur-md">
                        {data._count?.members || 0} membros
                    </Text>
                    <Text className="text-zinc-300 text-xs bg-black/40 px-2 py-1 rounded-md backdrop-blur-md uppercase font-bold">
                        {data.visibility === 'PRIVATE' ? 'Privada' : 'Pública'}
                    </Text>
                </View>
            </View>
        </View>

        <View className="px-4 mb-2">
             <Text className="text-zinc-400 text-sm leading-5 mb-4">{data.description || "Sem descrição."}</Text>
        </View>

        <Tabs active={activeTab} onChange={setActiveTab} isOwner={isOwner} />

        <View className="px-4">
            
            {/* 1. ABA FEED */}
            {activeTab === 'feed' && (
            <View>
                {data.posts?.length === 0 ? (
                    <Text className="text-zinc-500 text-center mt-8 italic">Nenhuma discussão iniciada.</Text>
                ) : (
                    data.posts?.map((post: any) => (
                        <View key={post.id} className="bg-zinc-900 mb-4 p-4 rounded-xl border border-zinc-800">
                            <View className="flex-row items-center mb-3">
                                <View className="h-8 w-8 rounded-full bg-emerald-900/50 items-center justify-center mr-3 border border-emerald-500/20">
                                    <Text className="text-emerald-400 font-bold">{post.author.name?.[0]}</Text>
                                </View>
                                <View>
                                    <Text className="text-zinc-200 font-semibold text-sm">{post.author.name}</Text>
                                    <Text className="text-zinc-500 text-[10px]">
                                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-zinc-300 text-sm leading-5 mb-3">{post.content}</Text>
                            
                            <View className="flex-row gap-4 border-t border-zinc-800 pt-3">
                                <View className="flex-row items-center gap-1">
                                    <Heart size={14} color="#52525b" />
                                    <Text className="text-zinc-500 text-xs">{post._count?.reactions || 0}</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <MessageSquare size={14} color="#52525b" />
                                    <Text className="text-zinc-500 text-xs">{post._count?.comments || 0}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>
            )}

            {/* 2. ABA ARQUIVOS (Estudos) */}
            {activeTab === 'files' && (
                <View>
                    <TouchableOpacity 
                        onPress={handleUpload}
                        className="flex-row items-center justify-center bg-zinc-900 border border-dashed border-zinc-700 p-6 rounded-xl mb-6"
                    >
                        <FileText color="#10b981" size={24} />
                        <Text className="text-zinc-300 ml-3 font-medium">Adicionar PDF ou EPUB</Text>
                    </TouchableOpacity>

                    <Text className="text-white font-bold text-lg mb-4">Materiais Disponíveis</Text>
                    
                    {data.files?.length > 0 ? data.files.map((file: any) => (
                        <View key={file.id} className="flex-row items-center bg-zinc-900 p-3 rounded-xl mb-3 border border-zinc-800">
                            <View className="w-10 h-10 bg-zinc-800 rounded-lg items-center justify-center mr-3">
                                <FileText size={20} color="#a1a1aa" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-zinc-200 font-medium text-sm" numberOfLines={1}>{file.title}</Text>
                                <Text className="text-zinc-500 text-[10px] uppercase">{file.fileType}</Text>
                            </View>
                            <TouchableOpacity className="p-2 bg-zinc-800 rounded-full">
                                <Download size={18} color="#10b981" />
                            </TouchableOpacity>
                        </View>
                    )) : (
                        <Text className="text-zinc-500 text-center mt-4">Nenhum arquivo compartilhado ainda.</Text>
                    )}
                </View>
            )}

            {/* 3. ABA CONFIGURAÇÕES (Apenas Dono) */}
            {activeTab === 'settings' && isOwner && (
                <View>
                    <Text className="text-white font-bold mb-4 text-lg">Gerenciar Membros</Text>
                    {data.members?.map((m: any) => (
                        <View key={m.userId} className="flex-row items-center justify-between bg-zinc-900 p-3 rounded-lg mb-2 border border-zinc-800">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700">
                                    <Text className="text-zinc-400 text-xs font-bold">{m.user.name?.[0]}</Text>
                                </View>
                                <View>
                                    <Text className="text-zinc-200 text-sm font-medium">{m.user.name}</Text>
                                    {m.role === 'HONORARY_MEMBER' && <Text className="text-yellow-500 text-[10px]">Honorário</Text>}
                                </View>
                            </View>

                            {m.userId !== user?.id && (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity 
                                        onPress={() => handleMemberAction(m.userId, 'PROMOTE')}
                                        className="bg-zinc-800 p-2 rounded-md"
                                    >
                                        <Crown size={16} color="#facc15" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleMemberAction(m.userId, 'BAN')}
                                        className="bg-red-500/10 p-2 rounded-md border border-red-500/20"
                                    >
                                        <UserX size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}