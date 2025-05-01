// app/loading.jsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from '../utils/TranslationContext';
import Constants from '../utils/Constants';
import useThemeStore from '../stores/ThemeStore';

const LoadingScreen = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
      <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} />
      <Text style={[styles.loadingText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{t('loading')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Constants.SPACING.MEDIUM,
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default LoadingScreen;