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

      {/* --- ROTAS OCULTAS / INTERNAS --- */}

      {/* CORREÇÃO 1: Rota da Lista de Games (Marketplace) */}
      {/* O nome deve ser 'games/index' pois não há layout intermediário */}
      <Tabs.Screen 
        name="games/index" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' } // Remove a barra para imersão total
        }} 
      />

      {/* CORREÇÃO 2: Rota do Player de Games */}
      {/* Precisamos garantir que o Player também não mostre a TabBar */}
      <Tabs.Screen 
        name="games/[id]/play" 
        options={{ 
          href: null, 
          headerShown: false,
          tabBarStyle: { display: 'none' }
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
      
      {/* Chat */}
      <Tabs.Screen 
        name="chat/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="chat/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="chat/settings" // É bom registrar todas as rotas conhecidas se quiser controlar a tabbar
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />

      {/* Shop e Produtos */}
       <Tabs.Screen 
        name="product/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="shop/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="shop/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      <Tabs.Screen 
        name="shop/create" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />

      {/* Outras rotas internas listadas no erro */}
      <Tabs.Screen name="users/[id]" options={{ href: null }} />
      <Tabs.Screen name="social/create" options={{ href: null }} />
    </Tabs>
  );
}