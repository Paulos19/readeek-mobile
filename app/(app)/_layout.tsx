import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { StandardTabBar } from './_components/ui/TabBar/StandardTabBar'; // Ajuste o caminho se necessário

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <StandardTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Oculta a tab bar quando o teclado abre (opcional, mas bom para UX de chat)
        tabBarHideOnKeyboard: true, 
        animation: 'shift',
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{ title: 'Dashboard' }} 
      />
      
      <Tabs.Screen 
        name="library" 
        options={{ title: 'Library' }} 
      />

      {/* NOVA ROTA SOCIAL (CENTRAL) */}
      <Tabs.Screen 
        name="social" 
        options={{ title: 'Social' }} 
      />

      {/* Rota de Comunidades (Lista) */}
      <Tabs.Screen 
        name="community" 
        options={{ title: 'Communities' }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile' }} 
      />

      {/* Rotas ocultas da TabBar (Detail Pages) */}
      <Tabs.Screen 
        name="read/[bookId]/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
    </Tabs>
  );
}