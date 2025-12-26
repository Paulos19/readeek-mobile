import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StatusBar, Text, ToastAndroid, Platform, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useReader, THEMES } from './_hooks/useReader';
import { generateReaderHTML } from './_utils/htmlGenerator';
import { ReaderMenu } from './_components/ReaderMenu';
import { HighlightMenu } from './_components/HighlightMenu';
import { repairBookMetadata } from 'lib/api';

export default function ReaderPage() {
  const { bookId, author, hasCover, title } = useLocalSearchParams<{ bookId: string, author?: string, hasCover?: string, title?: string }>();
  const { state, actions, refs, gestures } = useReader(bookId);

  useEffect(() => {
    const checkAndRepairMetadata = async () => {
      const needsCheck = !hasCover || hasCover === 'false' || !author || author === 'Autor desconhecido';

      if (needsCheck) {
         const updatedBook = await repairBookMetadata(bookId);
         if (updatedBook && Platform.OS === 'android') {
            ToastAndroid.show('Informações do livro atualizadas!', ToastAndroid.LONG);
         }
      }
    };
    if (bookId) checkAndRepairMetadata();
  }, [bookId, author, hasCover]);

  const html = useMemo(() => {
      if (!state.bookBase64) return '';
      return generateReaderHTML({
          bookBase64: state.bookBase64,
          initialLocation: state.initialLocation,
          highlights: state.highlights,
          theme: THEMES[state.currentTheme],
          fontSize: state.fontSize
      });
  }, [state.bookBase64]); 

  if (state.isLoading || !state.bookBase64) {
    return (
        <View className="flex-1 bg-zinc-950 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-zinc-500 mt-4">Carregando livro...</Text>
        </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
          <StatusBar 
            hidden={!state.menuVisible} 
            barStyle={state.currentTheme === 'light' || state.currentTheme === 'sepia' ? 'dark-content' : 'light-content'}
            translucent
            backgroundColor="transparent"
          />

          <GestureDetector gesture={gestures.pinchGesture}>
              <View style={{ flex: 1, position: 'relative' }}>
                  
                  {/* Laterais Invisíveis para Navegação */}
                  <Pressable 
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '20%', zIndex: 10, backgroundColor: 'transparent' }}
                    onPress={actions.prevPage}
                  />
                  <Pressable 
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '20%', zIndex: 10, backgroundColor: 'transparent' }}
                    onPress={actions.nextPage}
                  />

                  <WebView 
                    ref={refs.webviewRef}
                    originWhitelist={['*']}
                    source={{ html }}
                    style={{ flex: 1, backgroundColor: THEMES[state.currentTheme].bg }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scrollEnabled={false}
                    bounces={false}
                    onMessage={actions.handleMessage}
                    onLoadEnd={actions.onWebViewLoaded} // <--- AQUI ESTÁ O GATILHO DA CORREÇÃO
                  />
              </View>
          </GestureDetector>

          {state.menuVisible && (
              <ReaderMenu 
                  expanded={state.menuExpanded}
                  activeTab={state.activeTab}
                  theme={THEMES[state.currentTheme]}
                  fontSize={state.fontSize}
                  toc={state.toc}
                  highlights={state.highlights}
                  progress={state.progress}
                  title={title || "Livro"}
                  onToggleExpand={(val) => {
                      if (typeof val === 'boolean') actions.setMenuExpanded(val);
                      else actions.setMenuExpanded(!state.menuExpanded);
                  }}
                  onSetTab={actions.setActiveTab}
                  onChangeFont={(delta) => actions.changeFontSize(state.fontSize + delta)}
                  onChangeTheme={actions.changeTheme}
                  onSelectChapter={actions.goToChapter}
                  onDeleteHighlight={actions.removeHighlight}
                  onClose={actions.toggleMenu}
              />
          )}

          <HighlightMenu 
              visible={!!state.selection} 
              onClose={() => actions.setSelection(null)}
              onSelectColor={actions.addHighlight}
          />
        </SafeAreaView>
    </GestureHandlerRootView>
  );
}