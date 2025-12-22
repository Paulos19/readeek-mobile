import React from 'react';
import { View, ActivityIndicator, StatusBar, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReader, THEMES } from './_hooks/useReader';
import { generateReaderHTML } from './_utils/htmlGenerator';
import { ReaderMenu } from './_components/ReaderMenu';
import { HighlightMenu } from './_components/HighlightMenu';

export default function ReaderPage() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  
  // Instanciamos o Hook com toda a lógica
  const { state, actions, refs } = useReader(bookId);

  // Loading State
  if (state.isLoading || !state.bookBase64) {
    return (
        <View className="flex-1 bg-zinc-950 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-zinc-500 mt-4">Abrindo biblioteca...</Text>
        </View>
    );
  }

  // Geração do HTML (Certifique-se que o htmlGenerator.ts foi atualizado conforme passo anterior)
  const html = generateReaderHTML({
      bookBase64: state.bookBase64,
      initialLocation: state.initialLocation,
      highlights: state.highlights,
      theme: THEMES[state.currentTheme],
      fontSize: state.fontSize
  });

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      {/* Esconde a StatusBar para leitura imersiva quando o menu está fechado.
         Animação 'fade' ou 'slide' para suavidade.
      */}
      <StatusBar 
        hidden={!state.menuVisible} 
        barStyle={state.currentTheme === 'light' || state.currentTheme === 'sepia' ? 'dark-content' : 'light-content'}
        showHideTransition="fade"
      />

      {/* Componente Core do Leitor */}
      <WebView 
        ref={refs.webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: THEMES[state.currentTheme].bg }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false} // Importante: O scroll é interno do HTML/EPUB.js
        bounces={false}
        onMessage={actions.handleMessage}
      />

      {/* Menu Unificado (Header + Bottom Sheet com Abas) */}
      <ReaderMenu 
          visible={state.menuVisible}
          expanded={state.menuExpanded}
          activeTab={state.activeTab}
          theme={THEMES[state.currentTheme]}
          fontSize={state.fontSize}
          toc={state.toc}
          highlights={state.highlights}
          // Ações
          onToggleExpand={() => actions.setMenuExpanded(!state.menuExpanded)}
          onSetTab={actions.setActiveTab}
          onChangeFont={actions.changeFontSize}
          onChangeTheme={actions.changeTheme}
          onSelectChapter={actions.goToChapter}
          onDeleteHighlight={actions.removeHighlight} // Passamos a função direta do hook
          onClose={actions.toggleMenu}
      />

      {/* Menu Flutuante de Seleção de Texto (Aparece apenas ao selecionar) */}
      <HighlightMenu 
          visible={!!state.selection} 
          onClose={() => actions.setSelection(null)}
          onSelectColor={actions.addHighlight}
      />

    </SafeAreaView>
  );
}