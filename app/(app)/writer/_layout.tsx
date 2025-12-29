import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function WriterLayout() {
  // A lógica de esconder a TabBar foi movida para app/(app)/_layout.tsx
  // Isso garante performance e evita "layout shifts".

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