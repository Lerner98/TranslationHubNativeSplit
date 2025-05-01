// app/(auth)/register.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from '../../utils/TranslationContext';
import { useSession } from '../../utils/ctx';
import Toast from '../../components/Toast';
import { useRouter } from 'expo-router';
import Constants from '../../utils/Constants';
import useThemeStore from '../../stores/ThemeStore';
import { FontAwesome } from '@expo/vector-icons';

const RegisterScreen = () => {
  const { t } = useTranslation();
  const { register, isAuthLoading, error: sessionError } = useSession();
  const { isDarkMode } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // Add state for success message
  const router = useRouter();

  const handleRegister = async () => {
    setError('');
    setSuccessMessage('');
    if (!email || !password) {
      setError(t('error') + ': Email and password are required');
      setToastVisible(true);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('error') + ': ' + t('invalidEmail'));
      setToastVisible(true);
      return;
    }
    if (password.length < 6) {
      setError(t('error') + ': ' + t('passwordTooShort'));
      setToastVisible(true);
      return;
    }
    try {
      await register(email, password);
      setSuccessMessage(t('success') + ': Registration successful! Please log in.');
      setToastVisible(true);
      setTimeout(() => {
        router.replace('/(auth)/login'); // Simplified route
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('error') + ': ' + err.message);
      setToastVisible(true);
    }
  };

  const goBack = () => {
    router.replace('/welcome');
  };

  const goToLogin = () => {
    console.log('Navigating to login screen');
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1F1C2C' : '#F0F2F5' }]}>
      {/* Header with only the back arrow */}
      <View style={styles.headerContainer}>
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <FontAwesome name="arrow-left" size={24} color={isDarkMode ? '#E0E0E0' : '#333'} />
        </Pressable>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.formContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF' }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#FFF' : '#333' }]}>{t('register')}</Text>

          {isAuthLoading && (
            <ActivityIndicator
              size="large"
              color={isDarkMode ? '#FFF' : Constants.COLORS.PRIMARY}
              style={styles.loading}
            />
          )}

          <Text style={[styles.label, { color: isDarkMode ? '#AAA' : '#555' }]}>{t('email')}</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? '#3A3A3C' : '#F5F5F5', color: isDarkMode ? '#FFF' : '#333' },
            ]}
            placeholder={t('email')}
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isAuthLoading}
            accessibilityLabel="Email input"
          />

          <Text style={[styles.label, { color: isDarkMode ? '#AAA' : '#555' }]}>{t('password')}</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? '#3A3A3C' : '#F5F5F5', color: isDarkMode ? '#FFF' : '#333' },
            ]}
            placeholder={t('password')}
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry
            editable={!isAuthLoading}
            accessibilityLabel="Password input"
          />

          <Pressable
            onPress={handleRegister}
            disabled={isAuthLoading}
            style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Register button"
          >
            <Text style={styles.buttonLabel}>{t('register')}</Text>
          </Pressable>

          <Pressable
            onPress={goToLogin}
            disabled={isAuthLoading}
            style={({ pressed }) => [styles.switchButton, { opacity: pressed ? 0.8 : 1 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go to login screen"
          >
            <Text style={styles.switchText}>{t('login')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Toast
        message={successMessage || error || sessionError}
        visible={toastVisible}
        onHide={() => {
          setToastVisible(false);
          setSuccessMessage('');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  loading: {
    marginBottom: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: Constants.COLORS.PRIMARY,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  switchButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    marginVertical: 10,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
    color: Constants.COLORS.PRIMARY,
  },
});

export default RegisterScreen;