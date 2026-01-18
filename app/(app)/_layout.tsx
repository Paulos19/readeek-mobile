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
      {/* --- ABAS PRINCIPAIS (Visíveis na Barra Inferior) --- */}
      <Tabs.Screen 
        name="dashboard" 
        options={{ title: 'Dashboard' }} 
      />
      
      <Tabs.Screen 
        name="library" 
        options={{ title: 'Library' }} 
      />

      <Tabs.Screen 
        name="social" 
        options={{ title: 'Social' }} 
      />

      <Tabs.Screen 
        name="community" 
        options={{ title: 'Communities' }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile' }} 
      />

      {/* --- ROTAS GAMES (Imersivas - Sem TabBar) --- */}
      <Tabs.Screen 
        name="games/index" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' } 
        }} 
      />

      <Tabs.Screen 
        name="games/create" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' } 
        }} 
      />

      <Tabs.Screen 
        name="games/[id]/play" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' }
        }} 
      />

      {/* --- ROTAS SHOP --- */}
      <Tabs.Screen 
        name="shop/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="shop/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="shop/create" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="product/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />

      {/* --- ROTAS WRITER (Editor) --- */}
      <Tabs.Screen 
        name="writer" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' } 
        }} 
      />

      {/* --- ROTAS READER (Leitura) --- */}
      <Tabs.Screen 
        name="read/[bookId]/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      {/* --- ROTAS CHAT --- */}
      <Tabs.Screen 
        name="chat/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="chat/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="chat/settings" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />

      {/* --- OUTRAS ROTAS --- */}
      <Tabs.Screen 
        name="users/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="social/create" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      {/* Sub-rotas do Dashboard (opcional, para garantir que não apareçam duplicadas ou com comportamento errado) */}
      <Tabs.Screen name="dashboard/settings/page" options={{ href: null }} />
      <Tabs.Screen name="dashboard/library/page" options={{ href: null }} />
      <Tabs.Screen name="dashboard/highlights/page" options={{ href: null }} />

    </Tabs>
  );
}