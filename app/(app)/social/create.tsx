import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Image as ImageIcon, Book, ChevronRight, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { socialService } from 'lib/api';

export default function CreateSocialPost() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Modal de seleção de livros
  const [showBookModal, setShowBookModal] = useState(false);
  const [myBooks, setMyBooks] = useState<any[]>([]);

  useEffect(() => {
      socialService.getMyBooks().then(setMyBooks).catch(() => {});
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
      if (!content.trim() && !imageUri) return Alert.alert("Ops", "Escreva algo ou escolha uma foto.");
      
      setLoading(true);
      try {
          await socialService.createPost({
              content,
              type: 'POST',
              bookId: selectedBook?.id,
              imageUri: imageUri || undefined
          });
          router.back();
      } catch (e) {
          Alert.alert("Erro", "Falha ao publicar.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* HEADER */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-zinc-800">
         <TouchableOpacity onPress={() => router.back()}>
            <X color="white" size={24} />
         </TouchableOpacity>
         <Text className="text-white font-bold text-lg">Nova Publicação</Text>
         <TouchableOpacity onPress={handlePost} disabled={loading || (!content && !imageUri)}>
            {loading ? <ActivityIndicator size="small" color="#10b981" /> : <Text className="text-emerald-500 font-bold text-base">Publicar</Text>}
         </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
         <View className="p-4 flex-row gap-3">
             {/* IMAGE PREVIEW OR PLACEHOLDER */}
             <TouchableOpacity onPress={pickImage} className="w-24 h-24 bg-zinc-900 rounded-lg border border-zinc-800 items-center justify-center overflow-hidden">
                {imageUri ? (
                    <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="items-center">
                        <ImageIcon color="#52525b" size={24} />
                        <Text className="text-zinc-600 text-[10px] mt-1">Foto</Text>
                    </View>
                )}
             </TouchableOpacity>

             <TextInput 
                placeholder="Escreva uma legenda..." 
                placeholderTextColor="#71717a"
                multiline
                className="flex-1 text-white text-base leading-6 pt-0"
                textAlignVertical="top"
                value={content}
                onChangeText={setContent}
             />
         </View>

         {/* OPTION: CITE BOOK */}
         <View className="mt-4 px-4">
             <Text className="text-zinc-500 font-bold text-xs uppercase mb-2 ml-1">Contexto</Text>
             <TouchableOpacity 
                onPress={() => setShowBookModal(true)}
                className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800"
             >
                <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-md bg-emerald-900/30 items-center justify-center">
                        <Book size={16} color="#10b981" />
                    </View>
                    <Text className={`text-base font-medium ${selectedBook ? 'text-white' : 'text-zinc-500'}`}>
                        {selectedBook ? selectedBook.title : "Marcar um livro"}
                    </Text>
                </View>
                {selectedBook ? (
                    <TouchableOpacity onPress={() => setSelectedBook(null)}>
                        <X size={20} color="#71717a"/>
                    </TouchableOpacity>
                ) : (
                    <ChevronRight size={20} color="#52525b" />
                )}
             </TouchableOpacity>
         </View>
      </ScrollView>

      {/* BOOK SELECTION MODAL */}
      <Modal visible={showBookModal} animationType="slide" presentationStyle="pageSheet">
          <View className="flex-1 bg-zinc-900">
             <View className="p-4 border-b border-zinc-800 flex-row justify-between">
                <Text className="text-white font-bold text-lg">Seus Livros</Text>
                <TouchableOpacity onPress={() => setShowBookModal(false)}><Text className="text-emerald-500">Fechar</Text></TouchableOpacity>
             </View>
             <FlatList
                data={myBooks}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        onPress={() => { setSelectedBook(item); setShowBookModal(false); }}
                        className="flex-row items-center p-3 mb-2 bg-zinc-950 rounded-xl border border-zinc-800"
                    >
                        {item.coverUrl ? (
                            <Image source={{ uri: item.coverUrl }} className="w-10 h-14 rounded-md mr-3" />
                        ) : (
                            <View className="w-10 h-14 bg-zinc-800 rounded-md mr-3 items-center justify-center"><Book size={16} color="#52525b"/></View>
                        )}
                        <Text className="text-white font-bold flex-1">{item.title}</Text>
                        {selectedBook?.id === item.id && <Check size={20} color="#10b981" />}
                    </TouchableOpacity>
                )}
             />
          </View>
      </Modal>

    </SafeAreaView>
  );
}