import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, 
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Keyboard 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Book, Sparkles, X } from 'lucide-react-native';
import { useAuthStore } from '../../../stores/useAuthStore';
import { api } from '../../../lib/api';
import { WriterAlert } from './_components/WriterAlert'; // Importe o alerta

export default function CreateDraftScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  
  // Estado para controlar qual input está focado (para o estilo visual)
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Estados do Alerta
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false, type: 'info', title: '', message: ''
  });

  const showAlert = (type: 'success' | 'error' | 'info', title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({ visible: true, type, title, message, onConfirm });
  };

  const handleCreate = async () => {
    Keyboard.dismiss();
    
    if (!title.trim()) {
      return showAlert('error', 'Título Obrigatório', 'Por favor, dê um nome à sua obra.');
    }
    
    if ((user?.credits || 0) < 15) {
      return showAlert('error', 'Saldo Insuficiente', 'Você precisa de 15 créditos para iniciar um novo projeto.');
    }

    try {
      setLoading(true);
      const res = await api.post('/mobile/writer/drafts/create', {
        title,
        genre,
        synopsis
      });

      if (user) {
        updateUser({ ...user, credits: user.credits - 15 });
      }

      // Sucesso
      showAlert('success', 'Projeto Criado!', 'Seu universo foi inicializado com sucesso.', () => {
        setAlertConfig(prev => ({...prev, visible: false})); // Fecha o modal
        router.replace(`/writer/${res.data.id}` as any);
      });

    } catch (error: any) {
      showAlert('error', 'Erro', error.response?.data?.error || "Falha ao criar o livro.");
    } finally {
      setLoading(false);
    }
  };

  // Componente de Input Reutilizável com Estilo de Foco
  const CustomInput = ({ 
    label, value, onChangeText, placeholder, multiline = false, id 
  }: any) => {
    const isFocused = focusedInput === id;
    return (
      <View className="mb-6">
        <Text className={`text-xs font-bold uppercase mb-2 ml-1 ${isFocused ? 'text-indigo-400' : 'text-zinc-500'}`}>
          {label}
        </Text>
        <View 
          className={`bg-zinc-900 border rounded-2xl transition-all ${isFocused ? 'border-indigo-500 shadow-sm shadow-indigo-500/20' : 'border-zinc-800'}`}
        >
          <TextInput 
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#52525b"
            onFocus={() => setFocusedInput(id)}
            onBlur={() => setFocusedInput(null)}
            className={`p-4 text-white font-medium ${multiline ? 'min-h-[120px] text-top' : 'h-14'}`}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={{ fontSize: 16 }}
          />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* Background Decorativo Fixo */}
      <LinearGradient colors={['#312e81', '#000']} className="h-80 absolute w-full top-0" />
      
      <WriterAlert 
        {...alertConfig} 
        onCancel={() => setAlertConfig(p => ({...p, visible: false}))} 
        singleButton={alertConfig.type === 'success'}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header de Navegação */}
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="mt-8 mb-6 w-10 h-10 bg-zinc-900/50 rounded-full items-center justify-center border border-white/10"
          >
            <X color="white" size={20} />
          </TouchableOpacity>

          {/* Cabeçalho Visual */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-indigo-500/20 rounded-3xl items-center justify-center border border-indigo-500/50 mb-4 shadow-xl shadow-indigo-500/40 transform rotate-3">
              <Sparkles color="#818cf8" size={32} />
            </View>
            <Text className="text-white font-black text-3xl text-center tracking-tight">Nova Obra</Text>
            <View className="bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-500/30 mt-3">
              <Text className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
                Custo: 15 Créditos
              </Text>
            </View>
          </View>

          {/* Formulário */}
          <View className="bg-zinc-950/50 p-1 rounded-3xl">
            <CustomInput 
              id="title"
              label="Título da Obra"
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: As Crónicas de Readeek"
            />

            <CustomInput 
              id="genre"
              label="Gênero Literário"
              value={genre}
              onChangeText={setGenre}
              placeholder="Ex: Fantasia, Sci-Fi..."
            />

            <CustomInput 
              id="synopsis"
              label="Sinopse Breve"
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
            className="mt-8"
          >
            <LinearGradient
              colors={['#4f46e5', '#4338ca']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              className="p-5 rounded-2xl items-center flex-row justify-center shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Book color="white" size={20} style={{ marginRight: 10 }} />
                  <Text className="text-white font-black text-base tracking-wide uppercase">
                    Confirmar Criação
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <Text className="text-zinc-600 text-center text-xs mt-6 font-medium">
            Seu saldo atual: <Text className="text-zinc-400">{user?.credits} CR</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}