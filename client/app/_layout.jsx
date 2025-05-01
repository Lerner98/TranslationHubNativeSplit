// app/_layout.jsx
import React, { useState, useEffect } from 'react';
import { Stack, Drawer } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { DefaultTheme, DarkTheme } from 'react-native-paper';
import { TranslationProvider, useTranslation } from '../utils/TranslationContext';
import useThemeStore from '../stores/ThemeStore';
import { SessionProvider, useSession } from '../utils/ctx';
import Toast from '../components/Toast';
import ErrorBoundaryWrapper from '../components/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import Constants from '../utils/Constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const RootLayoutInner = () => {
  const { isDarkMode, initializeTheme, isLoading: themeLoading, error: themeError } = useThemeStore();
  const { session, isLoading: sessionLoading, error: sessionError } = useSession();
  const { error: translationError } = useTranslation();
  const [appIsReady, setAppIsReady] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeTheme();
        setAppIsReady(true);
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setAppIsReady(true);
      }
    };
    initializeApp();
  }, [initializeTheme]);

  useEffect(() => {
    if (appIsReady && !sessionLoading) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, sessionLoading]);

  useEffect(() => {
    if (themeError || sessionError || translationError) {
      setToastVisible(true);
    }
  }, [themeError, sessionError, translationError]);

  const theme = isDarkMode ? DarkTheme : DefaultTheme;

  if (!appIsReady || sessionLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}
        accessibilityLabel="Loading app"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} />
      </View>
    );
  }

  if (themeError || sessionError || translationError) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}
        accessibilityLabel="Error loading app"
        accessibilityLiveRegion="assertive"
      >
        <Toast message={themeError || sessionError || translationError} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <ErrorBoundaryWrapper>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(drawer)" />
        </Stack>
      </ErrorBoundaryWrapper>
    </PaperProvider>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <TranslationProvider>
            <RootLayoutInner />
          </TranslationProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.SPACING.SECTION,
  },
});