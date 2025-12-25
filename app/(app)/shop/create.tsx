import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, Store, DollarSign, Package } from 'lucide-react-native';
import { getMyShop, createShop, createProduct, ShopData } from '../../../lib/api';

export default function CreateShopItemScreen() {
  const router = useRouter();
  
  // Estados de Controle
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myShop, setMyShop] = useState<ShopData | null>(null);

  // Estados dos Formulários
  const [image, setImage] = useState<string | null>(null);
  
  // Form Loja
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');

  // Form Produto
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodAddress, setProdAddress] = useState('');
  const [isCredits, setIsCredits] = useState(false); // Toggle BRL/Credits

  useEffect(() => {
    checkShopStatus();
  }, []);

  const checkShopStatus = async () => {
    const shop = await getMyShop();
    setMyShop(shop);
    setLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4], // Quadrado para loja, pode ajustar para produto
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreateShop = async () => {
    if (!shopName) return Alert.alert("Erro", "Nome da loja é obrigatório");
    
    setSubmitting(true);
    try {
      const newShop = await createShop(shopName, shopDesc, image || undefined);
      setMyShop(newShop);
      setImage(null); // Limpa imagem para o próximo form
      Alert.alert("Sucesso", "Sua loja foi criada! Agora adicione seu primeiro produto.");
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar loja.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!prodTitle || !prodPrice || !prodAddress) return Alert.alert("Erro", "Preencha os campos obrigatórios");
    if (!image) return Alert.alert("Atenção", "Adicione uma foto do produto");

    setSubmitting(true);
    try {
      await createProduct({
        title: prodTitle,
        description: prodDesc,
        price: prodPrice,
        currency: isCredits ? 'CREDITS' : 'BRL',
        address: prodAddress,
        stock: "1",
        imageUri: image,
      });
      
      Alert.alert("Sucesso", "Produto publicado!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao publicar produto.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#10b981" /></View>;
  }

  // --- RENDERIZAÇÃO: MODO CRIAÇÃO DE LOJA ---
  if (!myShop) {
    return (
      <ScrollView className="flex-1 bg-black px-6" contentContainerStyle={{paddingVertical: 40}}>
        <Stack.Screen options={{ title: 'Criar Loja', headerBackTitle: 'Voltar' }} />
        
        <View className="items-center mb-8">
            <View className="w-20 h-20 bg-emerald-900/30 rounded-full items-center justify-center mb-4 border border-emerald-500/30">
                <Store size={32} color="#10b981" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">Abra sua Loja</Text>
            <Text className="text-zinc-400 text-center mt-2">
                Para começar a vender no Readeek, você precisa configurar um perfil de loja. É rápido!
            </Text>
        </View>

        {/* Upload Logo */}
        <TouchableOpacity onPress={pickImage} className="self-center mb-8">
            <View className="w-32 h-32 bg-zinc-900 rounded-full border-2 border-dashed border-zinc-700 items-center justify-center overflow-hidden">
                {image ? (
                    <Image source={{ uri: image }} className="w-full h-full" />
                ) : (
                    <View className="items-center">
                        <Camera size={24} color="#71717a" />
                        <Text className="text-zinc-500 text-xs mt-2">Logo da Loja</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>

        <View className="gap-4">
            <View>
                <Text className="text-zinc-400 mb-2 font-bold ml-1">Nome da Loja</Text>
                <TextInput 
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                    placeholder="Ex: Livraria do Paulo"
                    placeholderTextColor="#52525b"
                    value={shopName}
                    onChangeText={setShopName}
                />
            </View>

            <View>
                <Text className="text-zinc-400 mb-2 font-bold ml-1">Descrição (Opcional)</Text>
                <TextInput 
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white h-24"
                    placeholder="Conte um pouco sobre o que você vende..."
                    placeholderTextColor="#52525b"
                    multiline
                    textAlignVertical="top"
                    value={shopDesc}
                    onChangeText={setShopDesc}
                />
            </View>

            <TouchableOpacity 
                onPress={handleCreateShop}
                disabled={submitting}
                className={`w-full py-4 rounded-xl items-center mt-4 ${submitting ? 'bg-zinc-800' : 'bg-emerald-600'}`}
            >
                {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Criar Loja</Text>}
            </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- RENDERIZAÇÃO: MODO NOVO PRODUTO ---
  return (
    <ScrollView className="flex-1 bg-black px-6" contentContainerStyle={{paddingVertical: 20}}>
      <Stack.Screen options={{ title: 'Novo Anúncio', headerBackTitle: 'Cancelar' }} />

      <Text className="text-zinc-500 font-bold uppercase text-xs mb-4">Loja: {myShop.name}</Text>

      {/* Upload Imagem Produto */}
      <TouchableOpacity onPress={pickImage} className="mb-6">
          <View className="w-full h-64 bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 items-center justify-center overflow-hidden">
              {image ? (
                  <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
              ) : (
                  <View className="items-center">
                      <Camera size={32} color="#52525b" />
                      <Text className="text-zinc-500 mt-3 font-medium">Adicionar Foto</Text>
                  </View>
              )}
          </View>
      </TouchableOpacity>

      <View className="gap-5 pb-10">
          <View>
              <Text className="text-zinc-300 font-bold mb-2 ml-1">Título do Anúncio</Text>
              <TextInput 
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-bold"
                  placeholder="O que você está vendendo?"
                  placeholderTextColor="#52525b"
                  value={prodTitle}
                  onChangeText={setProdTitle}
              />
          </View>

          <View className="flex-row gap-4">
              <View className="flex-1">
                  <Text className="text-zinc-300 font-bold mb-2 ml-1">Preço</Text>
                  <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4">
                      {isCredits ? <Package size={18} color="#fbbf24" /> : <Text className="text-emerald-500 font-bold">R$</Text>}
                      <TextInput 
                          className="flex-1 py-3 text-white ml-2 font-bold"
                          placeholder="0,00"
                          placeholderTextColor="#52525b"
                          keyboardType="numeric"
                          value={prodPrice}
                          onChangeText={setProdPrice}
                      />
                  </View>
              </View>

              <View className="items-center justify-center">
                  <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-2">Moeda</Text>
                  <View className="flex-row items-center gap-2">
                      <Text className={`text-xs font-bold ${!isCredits ? 'text-emerald-500' : 'text-zinc-600'}`}>BRL</Text>
                      <Switch 
                        value={isCredits} 
                        onValueChange={setIsCredits}
                        trackColor={{ false: '#3f3f46', true: '#3f3f46' }}
                        thumbColor={isCredits ? '#fbbf24' : '#10b981'}
                      />
                      <Text className={`text-xs font-bold ${isCredits ? 'text-amber-400' : 'text-zinc-600'}`}>Créditos</Text>
                  </View>
              </View>
          </View>

          <View>
              <Text className="text-zinc-300 font-bold mb-2 ml-1">Endereço de Origem</Text>
              <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4">
                  <MapPin size={18} color="#71717a" />
                  <TextInput 
                      className="flex-1 py-3 text-white ml-2"
                      placeholder="Cidade, Estado (Obrigatório)"
                      placeholderTextColor="#52525b"
                      value={prodAddress}
                      onChangeText={setProdAddress}
                  />
              </View>
              <Text className="text-zinc-600 text-xs ml-1 mt-1">Necessário para calcular frete ou combinar entrega.</Text>
          </View>

          <View>
              <Text className="text-zinc-300 font-bold mb-2 ml-1">Descrição</Text>
              <TextInput 
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white h-32"
                  placeholder="Detalhes sobre o estado do produto, autor, ano..."
                  placeholderTextColor="#52525b"
                  multiline
                  textAlignVertical="top"
                  value={prodDesc}
                  onChangeText={setProdDesc}
              />
          </View>

          <TouchableOpacity 
              onPress={handleCreateProduct}
              disabled={submitting}
              className={`w-full py-4 rounded-xl items-center mt-2 ${submitting ? 'bg-zinc-800' : 'bg-emerald-600'}`}
          >
              {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Publicar Anúncio</Text>}
          </TouchableOpacity>
      </View>
    </ScrollView>
  );
}