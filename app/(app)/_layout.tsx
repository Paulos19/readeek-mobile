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

      {/* --- CORREÇÃO AQUI --- */}
      {/* Registramos o Writer para sumir com a TabBar de forma declarativa */}
      <Tabs.Screen 
        name="writer" 
        options={{ 
          href: null, // Não cria botão na barra
          tabBarStyle: { display: 'none' }, // Remove a barra fisicamente
          headerShown: false 
        }} 
      />

      {/* Rotas ocultas da TabBar (Detail Pages) */}
      <Tabs.Screen 
        name="read/[bookId]/index" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      {/* Outras rotas que não devem ter tab bar (ex: chat, shop details) devem seguir esse padrão */}
      <Tabs.Screen 
        name="chat/[id]" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
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