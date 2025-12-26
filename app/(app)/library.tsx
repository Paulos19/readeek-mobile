import React, { useCallback, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Image, 
  RefreshControl, 
  TextInput,
  StatusBar,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import { 
  Plus, 
  BookOpen, 
  Search, 
  MoreVertical, 
  Download,
  Book,
  WifiOff,
  Trash2,
  X,
  Smartphone
} from 'lucide-react-native';

import { useAuthStore } from '../../stores/useAuthStore';
import { api, uploadBook, deleteBook } from '../../lib/api';
import { fileManager } from '../../lib/files';
import { Book as BookType } from '../../app/(app)/_types/book';
import { useNetworkStatus } from './_hooks/useNetworkStatus';

const CARD_HEIGHT = 120;

// --- COMPONENTES AUXILIARES ---

const FilterChip = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`px-4 py-1.5 rounded-full mr-2 border ${active ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}
  >
    <Text className={`${active ? 'text-white font-bold' : 'text-zinc-400'} text-xs`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const EmptyState = ({ isOffline }: { isOffline: boolean }) => (
  <View className="items-center justify-center mt-20 px-10">
    <View className="bg-zinc-900/50 p-6 rounded-full mb-6 border border-zinc-800">
      <Book size={48} color="#27272a" />
    </View>
    <Text className="text-zinc-300 font-bold text-lg mb-2 text-center">
        {isOffline ? "Nenhum livro baixado" : "Sua estante está vazia"}
    </Text>
    <Text className="text-zinc-500 text-sm text-center leading-relaxed">
      {isOffline 
        ? "Você precisa baixar livros quando estiver online para lê-los aqui." 
        : "Que tal começar uma nova aventura? Importe seus EPUBs ou baixe livros da comunidade."}
    </Text>
  </View>
);

// Modal de Opções do Livro
const BookOptionsModal = ({ 
  visible, 
  book, 
  onClose, 
  onDeleteLocal, 
  onDeleteRemote, 
  canDeleteRemote 
}: { 
  visible: boolean, 
  book: BookType | null, 
  onClose: () => void, 
  onDeleteLocal: () => void,
  onDeleteRemote: () => void,
  canDeleteRemote: boolean
}) => {
  if (!book) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        className="flex-1 bg-black/60 justify-end" 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View className="bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800">
          <View className="flex-row items-center justify-between mb-6 border-b border-zinc-800 pb-4">
            <View className="flex-1 mr-4">
                <Text className="text-white font-bold text-lg" numberOfLines={1}>{book.title}</Text>
                <Text className="text-zinc-500 text-sm">{book.author || 'Autor Desconhecido'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full">
                <X size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Opção 1: Remover Download */}
          {book.isDownloaded && (
            <TouchableOpacity 
                onPress={() => { onDeleteLocal(); onClose(); }}
                className="flex-row items-center p-4 bg-zinc-800 rounded-xl mb-3 active:bg-zinc-700"
            >
                <View className="w-10 h-10 rounded-full bg-orange-500/10 items-center justify-center mr-4">
                    <Smartphone size={20} color="#f97316" />
                </View>
                <View>
                    <Text className="text-zinc-200 font-bold text-base">Remover do Dispositivo</Text>
                    <Text className="text-zinc-500 text-xs">Libera espaço, mantém na nuvem</Text>
                </View>
            </TouchableOpacity>
          )}

          {/* Opção 2: Excluir da Biblioteca (Apenas Dono/Admin) */}
          {canDeleteRemote && (
            <TouchableOpacity 
                onPress={() => { onDeleteRemote(); onClose(); }}
                className="flex-row items-center p-4 bg-red-500/10 rounded-xl mb-2 active:bg-red-500/20 border border-red-500/20"
            >
                <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center mr-4">
                    <Trash2 size={20} color="#ef4444" />
                </View>
                <View>
                    <Text className="text-red-400 font-bold text-base">Excluir Permanentemente</Text>
                    <Text className="text-red-500/60 text-xs">Apaga para todos os usuários</Text>
                </View>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// --- TELA PRINCIPAL ---

export default function Library() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isConnected } = useNetworkStatus();
  
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'downloaded' | 'reading'>('all');

  // Estado para o Modal de Opções
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchLibrary = async () => {
    try {
      const localBookIds = await fileManager.getDownloadedBooks();

      if (isConnected) {
        // --- MODO ONLINE ---
        const response = await api.get('/mobile/books');
        const allBooks: BookType[] = response.data;

        const processedBooks = allBooks.map(b => ({
            ...b,
            isDownloaded: localBookIds.includes(b.id)
        }));

        // Filtra para mostrar apenas livros relevantes para o usuário na biblioteca
        const myLibrary = processedBooks.filter(b => 
          b.userId === user?.id || b.isDownloaded || (b.progress && b.progress > 0)
        );

        setBooks(myLibrary);

      } else {
        // --- MODO OFFLINE ---
        const offlineLibrary = await Promise.all(localBookIds.map(async (bookId) => {
            const coverPath = `${FileSystem.documentDirectory}books/${bookId}/cover.jpg`;
            const coverInfo = await FileSystem.getInfoAsync(coverPath);
            
            const offlineBook: BookType = {
              id: bookId,
              title: 'Livro Baixado', // Idealmente persistir metadados localmente para ter título real
              author: 'Offline',
              coverUrl: coverInfo.exists ? coverPath : null,
              progress: 0,
              userId: user?.id || '',
              isDownloaded: true,
              description: 'Disponível offline',
              filePath: fileManager.getLocalBookUri(bookId),
              currentLocation: null,
              isDownloading: false,
              downloadProgress: 0,
              downloadsCount: 0,
              owner: undefined,
              updatedAt: undefined
            };

            return offlineBook;
        }));
        
        setBooks(offlineLibrary);
      }

    } catch (error) {
      console.error("Erro ao carregar biblioteca", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLibrary();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchLibrary();
    }, [isConnected])
  );

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (book.author || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === 'downloaded') return book.isDownloaded;
      if (activeFilter === 'reading') return (book.progress || 0) > 0 && (book.progress || 0) < 100;
      
      return true;
    });
  }, [books, searchQuery, activeFilter]);

  const handleAddBook = async () => {
    if (!isConnected) {
        Alert.alert("Offline", "Conecte-se para importar novos livros.");
        return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];
      
      Alert.alert(
        "Importar Livro",
        `Adicionar "${file.name}"?`,
        [
          { text: "Não", style: "cancel" },
          { 
            text: "Sim", 
            onPress: async () => {
              setIsUploading(true);
              const uploadResult = await uploadBook(file.uri, file.name, file.mimeType || 'application/epub+zip');
              setIsUploading(false);

              if (uploadResult.success) {
                onRefresh();
              } else {
                 Alert.alert("Erro", "Falha no upload.");
              }
            } 
          }
        ]
      );
    } catch (err) {
      setIsUploading(false);
    }
  };

  const openOptions = (book: BookType) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  // Ação 1: Remover do dispositivo local
  const handleDeleteLocal = async () => {
    if (!selectedBook) return;
    try {
        await fileManager.deleteBook(selectedBook.id);
        Alert.alert("Removido", "O livro foi removido deste dispositivo.");
        onRefresh();
    } catch (e) {
        Alert.alert("Erro", "Não foi possível remover o arquivo.");
    }
  };

  // Ação 2: Deletar da nuvem (API)
  const handleDeleteRemote = async () => {
    if (!selectedBook) return;
    
    Alert.alert(
        "Tem certeza?",
        "Isso apagará o livro permanentemente para todos.",
        [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Apagar", 
                style: "destructive",
                onPress: async () => {
                    const success = await deleteBook(selectedBook.id);
                    if (success) {
                        Alert.alert("Sucesso", "Livro excluído.");
                        onRefresh();
                    } else {
                        Alert.alert("Erro", "Falha ao excluir.");
                    }
                }
            }
        ]
    );
  };

  const renderBookItem = ({ item }: { item: BookType }) => (
    <TouchableOpacity 
      className="flex-row bg-zinc-900 mb-4 rounded-2xl overflow-hidden border border-white/5 shadow-sm"
      activeOpacity={0.7}
      style={{ height: CARD_HEIGHT }}
      onPress={() => router.push({ 
        pathname: `/read/${item.id}`, 
        params: { 
            title: item.title,
            author: item.author || '', 
            hasCover: item.coverUrl ? 'true' : 'false' 
        } 
      })}
    >
      <View className="w-24 h-full bg-zinc-800 relative">
        {item.coverUrl ? (
          <Image source={{ uri: item.coverUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center bg-zinc-800">
            <BookOpen size={28} color="#52525b" />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} className="absolute inset-0" />
        {item.isDownloaded && (
           <View className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-full p-1">
              <Download size={10} color="#10b981" />
           </View>
        )}
      </View>

      <View className="flex-1 p-4 justify-between">
        <View>
          <View className="flex-row justify-between items-start">
            <Text className="text-zinc-100 font-bold text-base leading-5 mb-1 flex-1 mr-2" numberOfLines={2}>
              {item.title}
            </Text>
            
            {/* Botão de Opções (3 pontos) */}
            <TouchableOpacity 
                onPress={(e) => {
                    e.stopPropagation(); // Evita abrir o livro ao clicar no menu
                    openOptions(item);
                }} 
                className="p-1 -mr-2 -mt-2"
                hitSlop={15}
            >
                <MoreVertical size={18} color="#71717a" />
            </TouchableOpacity>
          </View>
          <Text className="text-zinc-400 text-xs font-medium" numberOfLines={1}>
            {item.author || "Autor Desconhecido"}
          </Text>
        </View>

        <View>
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-zinc-500">
                    {(item.progress || 0) > 0 ? `${Math.round(item.progress || 0)}% lido` : 'Não iniciado'}
                </Text>
            </View>
            <View className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <View className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.progress || 0}%` }} />
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <View className="absolute top-0 left-0 right-0 h-96 opacity-20 pointer-events-none">
         <LinearGradient colors={['#10b981', 'transparent']} className="w-full h-full" />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-0.5">Sua Coleção</Text>
              <View className="flex-row items-center">
                  <Text className="text-white text-3xl font-bold tracking-tight mr-3">Biblioteca</Text>
                  {!isConnected && (
                      <View className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 flex-row items-center">
                          <WifiOff size={10} color="#ef4444" style={{marginRight: 4}}/>
                          <Text className="text-zinc-400 text-[10px] font-bold">OFFLINE</Text>
                      </View>
                  )}
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={handleAddBook}
              disabled={isUploading || !isConnected}
              className={`w-12 h-12 rounded-full items-center justify-center border border-zinc-700 bg-zinc-800 ${!isConnected ? 'opacity-30' : 'active:bg-zinc-700'}`}
            >
              {isUploading ? <ActivityIndicator color="#10b981" size="small" /> : <Plus size={24} color="#fff" />}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 mb-4">
            <Search size={18} color="#71717a" className="mr-3" />
            <TextInput 
              placeholder="Buscar..." 
              placeholderTextColor="#71717a"
              className="flex-1 text-white text-base leading-5 p-0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View className="flex-row mb-2">
            <FilterChip label="Todos" active={activeFilter === 'all'} onPress={() => setActiveFilter('all')} />
            <FilterChip label="Baixados" active={activeFilter === 'downloaded'} onPress={() => setActiveFilter('downloaded')} />
            <FilterChip label="Lendo" active={activeFilter === 'reading'} onPress={() => setActiveFilter('reading')} />
          </View>
        </View>

        {loading ? (
           <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#10b981" /></View>
        ) : (
          <FlatList
            data={filteredBooks}
            keyExtractor={item => item.id}
            renderItem={renderBookItem}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />
            }
            ListEmptyComponent={<EmptyState isOffline={!isConnected} />}
          />
        )}
      </SafeAreaView>

      {/* Modal de Ações */}
      <BookOptionsModal 
        visible={modalVisible}
        book={selectedBook}
        onClose={() => setModalVisible(false)}
        onDeleteLocal={handleDeleteLocal}
        onDeleteRemote={handleDeleteRemote}
        // Permite deletar remotamente se o usuário for o dono ou Admin
        canDeleteRemote={isConnected && (selectedBook?.userId === user?.id || user?.role === 'ADMIN')}
      />
    </View>
  );
}