// app/(auth)/_layout.jsx
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useSession } from '../../utils/ctx';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import Constants from '../../utils/Constants';
import useThemeStore from '../../stores/ThemeStore';
import Toast from '../../components/Toast';

export default function AuthLayout() {
  const { session, isLoading, isAuthLoading, error: sessionError } = useSession();
  const { isDarkMode } = useThemeStore();
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (sessionError) {
      setToastVisible(true);
    }
  }, [sessionError]);

  useEffect(() => {
    if (!isLoading && !isAuthLoading && session) {
      router.replace('/(drawer)/(tabs)');
    }
  }, [session, isLoading, isAuthLoading, router]);

  if (isLoading || isAuthLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}
        accessibilityLabel="Loading authentication"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} />
      </View>
    );
  }

  if (sessionError) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}
        accessibilityLabel="Authentication error"
        accessibilityLiveRegion="assertive"
      >
        <Toast message={sessionError} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    );
  }

  if (session) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
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