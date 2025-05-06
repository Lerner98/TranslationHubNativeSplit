import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useSession } from '../../utils/ctx';
import useThemeStore from '../../stores/ThemeStore';
import Constants from '../../utils/Constants';
import Toast from '../../components/Toast';

export default function AuthLayout() {
  const { session, isLoading, isAuthLoading, error: sessionError, signOut, clearError } = useSession();
  const { isDarkMode } = useThemeStore();
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();

  const resetAppSession = async () => {
    await signOut();
    router.replace('/welcome');
  };

  useEffect(() => {
    if (sessionError) {
      setToastVisible(true);
    }
  }, [sessionError]);

  useEffect(() => {
    if (!isLoading && !isAuthLoading && session) {
      const hasValidToken = !!session?.signed_session_id;
      const isCorrupted = !hasValidToken;
  
      if (isCorrupted) {
        console.warn('Fake session detected - clearing..');
        resetAppSession();
      }
    }
  }, [session, isLoading, isAuthLoading]);

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

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
      {sessionError && (
        <Toast
          message={sessionError}
          visible={toastVisible}
          onHide={() => {
            setToastVisible(false);
            clearError(); // Clear sessionError to allow Stack to remain mounted
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});