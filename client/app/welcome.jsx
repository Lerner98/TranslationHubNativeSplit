// app/welcome.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '../stores/ThemeStore';
import Constants from '../utils/Constants';

const WelcomeScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>TranslationHub</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2' }]}
        onPress={() => router.push('/(drawer)/(tabs)')}
      >
        <Text style={styles.buttonText}>Continue as Guest</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? '#388E3C' : '#2E7D32' }]}
        onPress={() => router.push('/(auth)/register')}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? '#FBC02D' : '#F9A825' }]}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.buttonText}>Login</Text>
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
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 40,
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;