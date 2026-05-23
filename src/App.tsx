import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import useLoadFonts from './hooks/useLoadFonts';

SplashScreen.preventAutoHideAsync();

const RawEyeTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ADC6FF',
    background: '#131313',
    card: '#131313',
    text: '#E4E2E1',
    border: '#2C2C2C',
    notification: '#FFB4AB',
  },
};

export default function App() {
  const { fontsLoaded, fontError } = useLoadFonts();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root} onLayout={onLayoutRootView}>
        <ErrorBoundary fallbackMessage="RENDER PIPELINE FAILURE">
          <NavigationContainer theme={RawEyeTheme}>
            <RootNavigator />
          </NavigationContainer>
        </ErrorBoundary>
        <StatusBar style="light" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
