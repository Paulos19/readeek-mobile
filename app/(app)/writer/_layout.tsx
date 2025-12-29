import { Stack, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { View } from 'react-native';

export default function WriterLayout() {
  const navigation = useNavigation();

  // Esconder a TabBar (que pertence ao layout pai) quando entrar no Writer Studio
  useLayoutEffect(() => {
    // Pega o navegador pai (que é o Tabs) e esconde a barra
    const parent = navigation.getParent();
    parent?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    // Quando sair do Writer Studio (unmount), mostra a barra de novo
    return () => {
      parent?.setOptions({
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#27272a',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          display: 'flex' // Restaura
        }
      });
    };
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'slide_from_right'
        }} 
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="[draftId]/index" />
        <Stack.Screen name="[draftId]/editor/[chapterId]" />
      </Stack>
    </View>
  );
}