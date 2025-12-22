import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Download, BookOpen, Trash2, LogOut } from 'lucide-react-native';

import { api } from 'lib/api';
import { fileManager } from 'lib/files';
import { useAuthStore } from 'stores/useAuthStore';

// Tipagem alinhada com o retorno da API e Schema do Prisma
interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  progress: number;       // Inteiro (0-100)
  filePath: string;       // URL do EPUB
  currentLocation: string | null; // CFI para o sync
}

// Extensão para controle de estado local da interface
interface BookWithStatus extends Book {
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuthStore();
  const [books, setBooks] = useState<BookWithStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Função auxiliar para atualizar o estado de um livro específico na lista
  const updateBookStatus = (id: string, updates: Partial<BookWithStatus>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const fetchBooks = async () => {
    try {
      // 1. Busca lista de livros do Backend
      const response = await api.get('/mobile/books');
      const apiBooks: Book[] = response.data;

      // 2. Processa cada livro para verificar download e sincronia
      const booksWithStatus = await Promise.all(apiBooks.map(async (book) => {
        // Verifica se o arquivo físico existe
        const isDownloaded = await fileManager.checkBookExists(book.id);
        
        // --- LÓGICA DE SYNC REVERSO (Nuvem -> Local) ---
        // Se a API trouxe uma localização (CFI), verificamos o storage local
        if (book.currentLocation) {
             const localCfi = await AsyncStorage.getItem(`@progress:${book.id}`);
             
             // Se a nuvem tem uma posição diferente da local, assumimos que a nuvem é mais recente
             // (Ex: Usuário leu na web e abriu o app agora)
             if (book.currentLocation !== localCfi) {
                 await AsyncStorage.setItem(`@progress:${book.id}`, book.currentLocation);
                 console.log(`[Dashboard] Sync Aplicado para '${book.title}':`, book.currentLocation.substring(0, 15) + "...");
                 
                 // Opcional: Atualizar também a porcentagem local se o backend mandar
                 if (book.progress > 0) {
                    await AsyncStorage.setItem(`@percent:${book.id}`, (book.progress / 100).toString());
                 }
             }
        }

        return {
          ...book,
          isDownloaded,
          isDownloading: false,
          downloadProgress: 0
        };
      }));

      setBooks(booksWithStatus);
    } catch (error) {
      console.error("Erro ao buscar livros:", error);
      Alert.alert("Erro", "Não foi possível carregar sua biblioteca.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  // Carrega ao montar
  useEffect(() => {
    fetchBooks();
  }, []);

  const handleBookPress = async (book: BookWithStatus) => {
    if (book.isDownloaded) {
      // Se já baixou, abre o leitor
      router.push(`/read/${book.id}`);
    } else {
      // Se não, inicia download
      try {
        updateBookStatus(book.id, { isDownloading: true, downloadProgress: 0 });
        
        await fileManager.downloadBook(book.filePath, book.id, (progress) => {
           updateBookStatus(book.id, { downloadProgress: progress });
        });

        updateBookStatus(book.id, { isDownloading: false, isDownloaded: true });
        Alert.alert("Sucesso", "Livro baixado e pronto para leitura offline!");
      } catch (error) {
        Alert.alert("Erro", "Falha ao baixar o livro. Verifique sua conexão.");
        updateBookStatus(book.id, { isDownloading: false });
      }
    }
  };

  const handleDelete = async (bookId: string) => {
    Alert.alert("Remover download", "Deseja remover este livro do dispositivo? O progresso de leitura será mantido.", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Remover", 
        style: "destructive", 
        onPress: async () => {
          await fileManager.deleteBook(bookId);
          updateBookStatus(bookId, { isDownloaded: false });
        }
      }
    ]);
  };

  const renderBook = ({ item }: { item: BookWithStatus }) => (
    <View className="bg-zinc-900 mb-4 rounded-xl overflow-hidden flex-row border border-zinc-800">
      <TouchableOpacity 
        className="flex-row flex-1"
        onPress={() => handleBookPress(item)}
        activeOpacity={0.7}
      >
        {/* Capa do Livro */}
        <View className="w-24 h-36 bg-zinc-800 items-center justify-center relative">
          {item.coverUrl ? (
            <Image 
              source={{ uri: item.coverUrl }} 
              className="w-full h-full" 
              resizeMode="cover" 
            />
          ) : (
            <Text className="text-zinc-500 text-xs text-center p-2 font-bold uppercase">
              {item.title.substring(0, 20)}
            </Text>
          )}
          
          {/* Overlay de Download em andamento */}
          {item.isDownloading && (
            <View className="absolute inset-0 bg-black/70 items-center justify-center">
               <Text className="text-white text-xs font-bold mb-1">{Math.round(item.downloadProgress)}%</Text>
               <ActivityIndicator size="small" color="#10b981" />
            </View>
          )}
        </View>

        {/* Informações do Livro */}
        <View className="flex-1 p-4 justify-between">
          <View>
            <Text className="text-white font-bold text-lg leading-tight mb-1" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-zinc-400 text-sm" numberOfLines={1}>
              {item.author || 'Autor desconhecido'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            {/* Barra de Progresso */}
            <View className="flex-1 mr-4">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-zinc-500 text-xs">Progresso</Text>
                    <Text className="text-emerald-400 text-xs font-bold">{item.progress || 0}%</Text>
                </View>
                <View className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <View 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${item.progress || 0}%` }} 
                    />
                </View>
            </View>

            {/* Ícone de Ação (Download / Ler) */}
            <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center">
                {item.isDownloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : item.isDownloaded ? (
                    <BookOpen size={16} color="#10b981" /> // Verde se baixado
                ) : (
                    <Download size={16} color="#71717a" /> // Cinza se precisa baixar
                )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Botão de Excluir Download (só aparece se estiver baixado) */}
      {item.isDownloaded && (
        <TouchableOpacity 
            onPress={() => handleDelete(item.id)}
            className="w-12 bg-red-500/10 items-center justify-center border-l border-zinc-800 active:bg-red-500/20"
        >
            <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950 px-4 pt-4" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-zinc-400 text-sm">Olá, {user?.name?.split(' ')[0] || 'Leitor'}</Text>
          <Text className="text-white text-2xl font-bold">Sua Leitura</Text>
        </View>
        <TouchableOpacity 
          onPress={signOut} 
          className="p-2 bg-zinc-900 rounded-full border border-zinc-800"
        >
            <LogOut size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      {/* Lista de Livros */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#10b981" 
              colors={["#10b981"]}
              progressBackgroundColor="#18181b"
            />
        }
        ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <BookOpen size={48} color="#27272a" />
              <Text className="text-zinc-500 text-center mt-4">
                Você ainda não tem livros na sua conta.
              </Text>
              <Text className="text-zinc-600 text-center text-sm mt-2 px-8">
                Adicione livros através da plataforma web para vê-los aqui.
              </Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}