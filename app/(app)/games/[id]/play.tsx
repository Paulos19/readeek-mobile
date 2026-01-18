import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { X, RotateCw } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { gameService } from '../../../../lib/api';
import { Game } from '../../_types/game';

export default function GamePlayer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [game, setGame] = useState<Game | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGame();
    return () => {
      // Reseta orientação ao sair
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [id]);

  const loadGame = async () => {
    try {
      // Precisamos de uma rota para pegar o HTML completo (que não vem na lista)
      // Vou assumir que você vai criar um endpoint GET /games/[id] ou usar o getAll filtrado
      // Para simplificar, vou assumir que o getAll já traz o básico, mas precisamos do HTML
      // Se não tiver endpoint específico, você pode usar o array local, mas o ideal é fetch individual
      
      // MOCK TEMPORÁRIO até criarmos o endpoint 'getOne' com HTML
      // Na prática, você deve criar: router.get('/mobile/games/:id') no backend
      
      // Por enquanto, vou simular que pegamos o game e o HTML via API:
      const fullGame = await gameService.getById(id as string); 
      
      if (fullGame) {
        setGame(fullGame);
        setHtmlContent(fullGame.htmlContent || '<h1>Erro ao carregar jogo</h1>');
        
        // Ajusta Orientação
        if (fullGame.orientation === 'LANDSCAPE') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-zinc-500 mt-4 text-xs font-bold uppercase tracking-widest">Carregando Cartucho...</Text>
      </View>
    );
  }

  if (!game || !htmlContent) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Jogo não encontrado.</Text>
        <TouchableOpacity onPress={handleExit} className="mt-4 bg-zinc-800 px-4 py-2 rounded-full">
            <Text className="text-white">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />

      {/* WebView do Jogo */}
      <WebView 
        source={{ html: htmlContent }}
        style={{ flex: 1, backgroundColor: '#000' }}
        scrollEnabled={false} // Jogos geralmente não tem scroll da página
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        originWhitelist={['*']}
      />

      {/* Botão Flutuante de Sair (Discreto) */}
      <View className="absolute top-4 right-4 flex-row gap-2 opacity-50 hover:opacity-100">
         <TouchableOpacity 
            onPress={loadGame}
            className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/10 backdrop-blur-md"
         >
            <RotateCw size={20} color="white" />
         </TouchableOpacity>

         <TouchableOpacity 
            onPress={handleExit}
            className="w-10 h-10 bg-red-500/40 rounded-full items-center justify-center border border-white/10 backdrop-blur-md"
         >
            <X size={24} color="white" />
         </TouchableOpacity>
      </View>
    </View>
  );
}