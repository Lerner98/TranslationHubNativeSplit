// app / _layout.jsx
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
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
import AsyncStorageUtils from '../utils/AsyncStorage';
import ApiService from '../services/ApiService';

SplashScreen.preventAutoHideAsync();

const RootLayoutInner = () => {
  const { isDarkMode, initializeTheme, isLoading: themeLoading, error: themeError } = useThemeStore();
  const { session, isLoading: sessionLoading, error: sessionError, clearError } = useSession();
  const { error: translationError } = useTranslation();
  const [appIsReady, setAppIsReady] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeTheme();
      } catch (err) {
        console.error('Failed to initialize app:', err);
      } finally {
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

  useEffect(() => {
    const validateSession = async () => {
      const token = await AsyncStorageUtils.getItem('signed_session_id');
      if (!token) return;
      const response = await ApiService.get('/validate-session', token);
      if (!response.success) {
        console.warn('Session expired or invalid, logging out...');
        await AsyncStorageUtils.removeItem('signed_session_id');
        await AsyncStorageUtils.removeItem('user');
      }
    };
    const interval = setInterval(validateSession, 15000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <PaperProvider theme={theme}>
      <ErrorBoundaryWrapper>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(drawer)" />
        </Stack>
        {(themeError || sessionError || translationError) && (
          <Toast
            message={String(themeError || sessionError || translationError || 'Unknown error')}
            visible={toastVisible}
            onHide={() => {
              setToastVisible(false);
              clearError();
            }}
          />
        )}
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
});