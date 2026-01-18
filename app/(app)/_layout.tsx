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
      {/* --- ROTAS PRINCIPAIS (Visíveis na TabBar) --- */}
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

      {/* --- ROTAS OCULTAS DA TABBAR (Imersivas) --- */}

      {/* 1. Games (Correção do Bug de Redirecionamento) */}
      <Tabs.Screen 
        name="games" 
        options={{ 
          href: null, // Não exibe botão na barra
          headerShown: false,
          tabBarStyle: { display: 'none' } // Remove a barra fisicamente para imersão total
        }} 
      />

      {/* 2. Writer (Editor) */}
      <Tabs.Screen 
        name="writer" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false 
        }} 
      />

      {/* 3. Leitor de Livros */}
      <Tabs.Screen 
        name="read/[bookId]/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      {/* 4. Chat (Lista e Detalhe) */}
      <Tabs.Screen 
        name="chat/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="chat/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />

      {/* 5. Marketplace e Produtos */}
       <Tabs.Screen 
        name="product/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="shop/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
    </Tabs>
  );
}