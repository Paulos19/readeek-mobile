import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, 
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Book, Sparkles, X, ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '../../../stores/useAuthStore';
import { api } from '../../../lib/api';
import { WriterAlert, WriterAlertType } from './_components/WriterAlert';

export default function CreateDraftScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Controle do Alerta Customizado
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    type: WriterAlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false, type: 'info', title: '', message: ''
  });

  const showAlert = (type: WriterAlertType, title: string, message: string, onConfirm?: () => void) => {
    setAlertState({ visible: true, type, title, message, onConfirm });
  };

  const closeAlert = () => setAlertState(prev => ({ ...prev, visible: false }));

  const handleCreate = async () => {
    Keyboard.dismiss();
    
    if (!title.trim()) {
      return showAlert('error', 'Título Ausente', 'Toda grande história precisa de um nome. Como se chamará a sua?');
    }
    
    if ((user?.credits || 0) < 15) {
      return showAlert('error', 'Créditos Insuficientes', 'Você precisa de 15 créditos para abrir uma nova sala de criação.');
    }

    showAlert(
        'info', 
        'Confirmar Criação', 
        `Deseja gastar 15 créditos para iniciar o projeto "${title}"?`,
        async () => {
            // Callback de confirmação
            closeAlert();
            try {
                setLoading(true);
                const res = await api.post('/mobile/writer/drafts/create', {
                    title,
                    genre,
                    synopsis
                });

                if (user) updateUser({ ...user, credits: user.credits - 15 });

                // Redireciona direto, sem segundo alerta (mais fluido)
                router.replace(`/writer/${res.data.id}` as any);

            } catch (error: any) {
                setTimeout(() => { // Timeout para evitar conflito de modais
                    showAlert('error', 'Ops!', error.response?.data?.error || "Falha ao criar o livro.");
                }, 300);
            } finally {
                setLoading(false);
            }
        }
    );
  };

  // Input Customizado com Animação de Foco
  const CustomInput = ({ 
    label, value, onChangeText, placeholder, multiline = false, id, icon: Icon 
  }: any) => {
    const isFocused = focusedInput === id;
    
    return (
      <View className="mb-5">
        <Text className={`text-xs font-bold uppercase mb-2 ml-1 tracking-wider ${isFocused ? 'text-indigo-400' : 'text-zinc-500'}`}>
          {label}
        </Text>
        <View 
          className={`
            bg-zinc-900/80 border rounded-2xl flex-row items-start
            ${isFocused ? 'border-indigo-500 bg-zinc-900' : 'border-zinc-800'}
          `}
          style={{ 
            shadowColor: isFocused ? '#6366f1' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: isFocused ? 5 : 0
          }}
        >
            <View className="pt-4 pl-4">
                <Icon size={18} color={isFocused ? '#818cf8' : '#52525b'} />
            </View>
            <TextInput 
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#3f3f46"
                onFocus={() => setFocusedInput(id)}
                onBlur={() => setFocusedInput(null)}
                className={`flex-1 p-4 text-white font-medium text-base ${multiline ? 'min-h-[120px] pt-3.5' : 'h-14'}`}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoCapitalize={id === 'title' ? 'words' : 'sentences'}
            />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* Elementos de Fundo */}
      <View className="absolute top-0 left-0 right-0 h-[400px]">
        <LinearGradient colors={['#312e81', '#000']} className="w-full h-full opacity-60" />
      </View>

      <WriterAlert 
        {...alertState} 
        onCancel={closeAlert} 
        singleButton={alertState.type === 'success' || alertState.type === 'error'}
      />

      {/* Header de Navegação */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4 z-10">
        <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/10 backdrop-blur-md"
        >
            <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        
        <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md">
            <Text className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
                Saldo: {user?.credits || 0} CR
            </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título da Página */}
          <View className="items-center mb-8 mt-2">
            <View className="w-20 h-20 bg-indigo-500/20 rounded-3xl items-center justify-center border border-indigo-500/50 mb-4 shadow-2xl shadow-indigo-500/30 transform -rotate-6">
              <Sparkles color="#818cf8" size={32} />
            </View>
            <Text className="text-white font-black text-3xl text-center tracking-tighter">
                Novo Universo
            </Text>
            <Text className="text-zinc-400 text-sm text-center mt-1 w-2/3">
                Preencha os detalhes básicos para começar a sua obra.
            </Text>
          </View>

          {/* Formulário */}
          <View>
            <CustomInput 
              id="title"
              label="Título da Obra"
              icon={Book}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: As Crónicas de Readeek"
            />

            <CustomInput 
              id="genre"
              label="Gênero Literário"
              icon={Feather}
              value={genre}
              onChangeText={setGenre}
              placeholder="Ex: Fantasia, Sci-Fi..."
            />

            <CustomInput 
              id="synopsis"
              label="Sinopse / Ideia Inicial"
              icon={Feather}
              value={synopsis}
              onChangeText={setSynopsis}
              placeholder="Sobre o que é a sua história?"
              multiline
            />
          </View>

          {/* Botão de Ação */}
          <TouchableOpacity 
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.8}
            className="mt-6 shadow-lg shadow-indigo-500/20"
          >
            <LinearGradient
              colors={['#4f46e5', '#3730a3']}
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              className="p-5 rounded-2xl items-center flex-row justify-center border border-white/10"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-black text-base tracking-widest uppercase mr-2">
                    Iniciar Projeto
                  </Text>
                  <View className="bg-black/20 px-2 py-0.5 rounded ml-2">
                    <Text className="text-indigo-200 text-[10px] font-bold">-15 CR</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}