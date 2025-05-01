// components/ErrorBoundary.jsx
import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from '../utils/TranslationContext';
import { useRouter } from 'expo-router';
import Constants from '../utils/Constants';
import useThemeStore from '../stores/ThemeStore';
import Toast from './Toast';

// Functional wrapper to use hooks within a class component
const ErrorBoundaryWrapper = ({ children }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDarkMode } = useThemeStore();

  return <ErrorBoundary t={t} router={router} isDarkMode={isDarkMode}>{children}</ErrorBoundary>;
};

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    fadeAnim: new Animated.Value(0),
    toastVisible: false,
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ toastVisible: true });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.hasError && !prevState.hasError) {
      Animated.timing(this.state.fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, toastVisible: false });
    this.props.router.replace('/(drawer)/(tabs)');
  };

  render() {
    const { t, isDarkMode } = this.props;

    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
          <Animated.View style={{ opacity: this.state.fadeAnim }}>
            <Text style={[styles.title, { color: Constants.COLORS.DESTRUCTIVE }]}>{t('error')}</Text>
            <Text style={[styles.message, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>Something went wrong.</Text>
            <Text style={[styles.description, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY }]} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>{t('goToHome')}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Toast message={errorMessage} visible={this.state.toastVisible} onHide={() => this.setState({ toastVisible: false })} />
        </View>
      );
    }

    return this.props.children;
  }
}

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
  message: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    fontWeight: '600',
    marginBottom: Constants.SPACING.MEDIUM,
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

export default ErrorBoundaryWrapper;