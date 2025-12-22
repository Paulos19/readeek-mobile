import React from 'react';
import { View, ActivityIndicator, StatusBar, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useReader, THEMES } from './_hooks/useReader';
import { generateReaderHTML } from './_utils/htmlGenerator';
import { ReaderMenu } from './_components/ReaderMenu';
import { HighlightMenu } from './_components/HighlightMenu';

export default function ReaderPage() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { state, actions, refs, gestures } = useReader(bookId);

  if (state.isLoading || !state.bookBase64) {
    return (
        <View className="flex-1 bg-zinc-950 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-zinc-500 mt-4">Carregando livro...</Text>
        </View>
    );
  }

  const html = generateReaderHTML({
      bookBase64: state.bookBase64,
      initialLocation: state.initialLocation,
      highlights: state.highlights,
      theme: THEMES[state.currentTheme],
      fontSize: state.fontSize
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
          <StatusBar 
            hidden={!state.menuVisible} 
            barStyle={state.currentTheme === 'light' || state.currentTheme === 'sepia' ? 'dark-content' : 'light-content'}
            showHideTransition="fade"
            translucent
            backgroundColor="transparent"
          />

          <GestureDetector gesture={gestures.pinchGesture}>
              <View style={{ flex: 1 }}>
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
                  />
              </View>
          </GestureDetector>

          <ReaderMenu 
              visible={state.menuVisible}
              expanded={state.menuExpanded}
              activeTab={state.activeTab}
              theme={THEMES[state.currentTheme]}
              fontSize={state.fontSize}
              toc={state.toc}
              highlights={state.highlights}
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

          <HighlightMenu 
              visible={!!state.selection} 
              onClose={() => actions.setSelection(null)}
              onSelectColor={actions.addHighlight}
          />
        </SafeAreaView>
    </GestureHandlerRootView>
  );
}