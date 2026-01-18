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
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [id]);

  const loadGame = async () => {
    setLoading(true);
    try {
      const fullGame = await gameService.getById(id as string); 
      
      if (fullGame) {
        setGame(fullGame);
        
        // Tratamento do HTML
        let rawHtml = fullGame.htmlContent || '<h1>Erro: Jogo sem conteúdo</h1>';
        
        // Se não tiver estrutura básica de HTML, injetamos um esqueleto
        if (!rawHtml.toLowerCase().includes('<html')) {
            rawHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                    <style>
                        body { margin: 0; padding: 0; background-color: #000; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
                    </style>
                </head>
                <body>
                    ${rawHtml}
                </body>
                </html>
            `;
        } 
        // Se tem HTML mas falta viewport (comum em imports simples), injetamos para não ficar minúsculo
        else if (!rawHtml.includes('viewport')) {
             rawHtml = rawHtml.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
        }

        setHtmlContent(rawHtml);
        
        // Trava Orientação
        if (fullGame.orientation === 'LANDSCAPE') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar jogo:", e);
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
        <Text className="text-white font-bold mb-2">Jogo não encontrado</Text>
        <TouchableOpacity onPress={handleExit} className="bg-zinc-800 px-6 py-3 rounded-full border border-zinc-700">
            <Text className="text-white font-bold">Voltar para Arcade</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />

      <WebView 
        key={id as string} // Força recriação se o ID mudar
        source={{ 
            html: htmlContent, 
            baseUrl: '' // <--- CRÍTICO: Permite que o Android renderize o conteúdo corretamente
        }}
        style={{ flex: 1, backgroundColor: '#000' }}
        containerStyle={{ flex: 1 }}
        
        // Configurações Web
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        scrollEnabled={false}
        
        // Configurações Android
        androidLayerType="hardware" // Aceleração de GPU para Canvas
        mixedContentMode="always"
        textZoom={100}

        // Loader interno do WebView
        startInLoadingState={true}
        renderLoading={() => (
            <View className="absolute inset-0 bg-black items-center justify-center z-10">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        )}
        
        // Debug
        onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
        }}
      />

      {/* Controles Flutuantes */}
      <View className="absolute top-6 right-6 flex-row gap-3">
         <TouchableOpacity 
            activeOpacity={0.7}
            onPress={loadGame}
            className="w-10 h-10 bg-black/60 rounded-full items-center justify-center border border-white/20 backdrop-blur-md shadow-lg"
         >
            <RotateCw size={18} color="white" />
         </TouchableOpacity>

         <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleExit}
            className="w-10 h-10 bg-red-600/80 rounded-full items-center justify-center border border-white/20 backdrop-blur-md shadow-lg"
         >
            <X size={20} color="white" />
         </TouchableOpacity>
      </View>
    </View>
  );
}