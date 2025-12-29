import { Stack, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { View, Platform } from 'react-native';

export default function WriterLayout() {
  const navigation = useNavigation();

  // Lógica para esconder a TabBar do pai ((app)) enquanto estiver neste contexto
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' } // Esconde a barra
      });
    }

    return () => {
      // Restaura a barra quando sair do Writer Studio
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            display: 'flex',
            backgroundColor: '#09090b',
            borderTopColor: '#27272a',
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
          }
        });
      }
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
        <Stack.Screen 
          name="create" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom' 
          }} 
        />
        <Stack.Screen name="[draftId]/index" />
        <Stack.Screen name="[draftId]/editor/[chapterId]" />
      </Stack>
    </View>
  );
}