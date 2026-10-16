import {
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/baloo-2';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useMusic } from '@/audio/sound';
import { CatalogProvider } from '@/state/catalog';
import { ProgressProvider } from '@/state/progress';

// Keep the splash screen up until the fonts are ready, so text never flashes in the wrong font.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    LilitaOne_400Regular,
  });
  useMusic('town'); // the background tune (silent when grown-ups switched music off)

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProgressProvider>
        <CatalogProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </CatalogProvider>
      </ProgressProvider>
    </GestureHandlerRootView>
  );
}
