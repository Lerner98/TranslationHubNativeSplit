import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '../stores/ThemeStore';
import Constants from '../utils/Constants';
import { useSession } from '../utils/ctx'; // ✅ נדרש לשימוש בפונקציה החדשה
import { useTranslation } from '../utils/TranslationContext';
import AsyncStorageUtils from '../utils/AsyncStorage';

const WelcomeScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const { t } = useTranslation();
  const { resetSessionButKeepPreferences } = useSession(); // ✅ שימוש בפונקציה החדשה

  // ✅ Translation safety fallback
  const safeTranslate = (key, fallback = '') => {
    try {
      const val = t(key);
      return typeof val === 'string' ? val : fallback;
    } catch {
      return fallback;
    }
  };

  // 🔒 Always clear ghost sessions
  useEffect(() => {
    const forceResetSession = async () => {
      try {
        await resetSessionButKeepPreferences(); // ✅ שימוש במקום removeItem ידני
      } catch (err) {
        console.warn('Session reset failed:', err?.message || err);
      }
    };
    forceResetSession();
  }, []);

  // 👤 Guest entry path
  const continueAsGuest = async () => {
    await resetSessionButKeepPreferences(); // ✅ אותו דבר גם כאן
    router.replace('/(drawer)/(tabs)');
  };


  const backgroundColor = isDarkMode ? '#121212' : '#F5F5F5';
  const titleColor = isDarkMode ? '#E0E0E0' : '#212121';

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      accessibilityLabel="Welcome screen"
    >
      <Text style={[styles.title, { color: titleColor }]}>
        {safeTranslate('welcome', 'TranslationHub')}
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2' }]}
        onPress={async () => {
          const token = await AsyncStorageUtils.getItem('signed_session_id');
          if (token) {
            Alert.alert(
              safeTranslate('activeSession', 'Session Detected'),
              safeTranslate('guestLimit', 'You are logged in. Continue as guest? This will log you out.'),
              [
                { text: safeTranslate('cancel', 'Cancel'), style: 'cancel' },
                { text: safeTranslate('continue', 'Continue as Guest'), onPress: continueAsGuest }
              ]
            );
          } else {
            continueAsGuest();
          }
        }}
        accessibilityLabel="Continue as guest"
      >
        <Text style={styles.buttonText}>{safeTranslate('continueGuest', 'Continue as Guest')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? '#388E3C' : '#2E7D32' }]}
        onPress={() => router.push('/(auth)/register')}
        accessibilityLabel="Register"
      >
        <Text style={styles.buttonText}>{safeTranslate('register', 'Sign Up')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? '#FBC02D' : '#F9A825' }]}
        onPress={() => router.push('/(auth)/login')}
        accessibilityLabel="Login"
      >
        <Text style={styles.buttonText}>{safeTranslate('login', 'Login')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.SPACING.SECTION,
  },
  title: {
    fontSize: Constants.FONT_SIZES.TITLE,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.SECTION * 2,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
