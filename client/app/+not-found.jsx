// app/+not-found.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../utils/TranslationContext';
import { useRouter } from 'expo-router';
import Toast from '../components/Toast';
import Constants from '../utils/Constants';
import useThemeStore from '../stores/ThemeStore';

const NotFoundScreen = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const [toastVisible, setToastVisible] = useState(true);
  const router = useRouter();
  const errorMessage = `${t('error')}: 404 - ${t('pageNotFound')}`;

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
      <Text style={[styles.title, { color: Constants.COLORS.DESTRUCTIVE }]}>{t('error')}</Text>
      <Text style={[styles.description, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
        {t('pageNotFoundDescription')}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY }]}
        onPress={() => router.replace('/(drawer)/(tabs)')}
        accessibilityLabel="Go to home page"
      >
        <Text style={styles.buttonText}>{t('goToHome')}</Text>
      </TouchableOpacity>
      <Toast message={errorMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
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
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
    marginBottom: Constants.SPACING.SECTION,
    lineHeight: 24,
  },
  button: {
    paddingVertical: Constants.SPACING.MEDIUM,
    paddingHorizontal: Constants.SPACING.SECTION,
    borderRadius: 10,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
});

export default NotFoundScreen;