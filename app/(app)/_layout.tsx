import { Tabs } from 'expo-router';
import React from 'react';
import { StandardTabBar } from './_components/ui/TabBar/StandardTabBar'; 

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <StandardTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true, 
        animation: 'shift',
      }}
    >
      {/* --- ABAS VISÍVEIS --- */}
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="social" options={{ title: 'Social' }} />
      <Tabs.Screen name="community" options={{ title: 'Communities' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />

      {/* --- ROTAS INTERNAS (HIDDEN) --- */}

      {/* CORREÇÃO: Agora referenciamos a PASTA games (o _layout dela) */}
      <Tabs.Screen 
        name="games" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' } // Garante que a TabBar suma em TODAS as telas de games
        }} 
      />

      <Tabs.Screen 
        name="writer" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false 
        }} 
      />

      <Tabs.Screen 
        name="read/[bookId]/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      {/* Chat e Shop mantidos iguais... */}
      <Tabs.Screen name="chat/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="chat/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="chat/settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="product/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="shop/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="shop/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="shop/create" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="users/[id]" options={{ href: null }} />
      <Tabs.Screen name="social/create" options={{ href: null }} />
    </Tabs>
  );
}