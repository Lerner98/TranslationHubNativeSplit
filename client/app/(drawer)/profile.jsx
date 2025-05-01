// app/(drawer)/profile.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Pressable } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from '../../utils/TranslationContext';
import { useSession } from '../../utils/ctx';
import useThemeStore from '../../stores/ThemeStore';
import { useRouter } from 'expo-router';
import LanguageSearch from '../../components/LanguageSearch';
import Toast from '../../components/Toast';
import AsyncStorageUtils from '../../utils/AsyncStorage';
import Constants from '../../utils/Constants';
import Helpers from '../../utils/Helpers';
import { FontAwesome } from '@expo/vector-icons';

const ProfileScreen = () => {
  const { t, changeLocale } = useTranslation();
  const { session, signOut, preferences, setPreferences } = useSession();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default to English
  const [isDarkModeLocal, setIsDarkModeLocal] = useState(isDarkMode); // Local state for immediate UI update
  const [localPreferences, setLocalPreferences] = useState({
    defaultFromLang: preferences.defaultFromLang || '',
    defaultToLang: preferences.defaultToLang || '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [savedTranslations, setSavedTranslations] = useState([]);

  // Sync local dark mode state with global state
  useEffect(() => {
    setIsDarkModeLocal(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Load saved translations
        const savedTextTranslations = (await AsyncStorageUtils.getItem('textTranslations')) || [];
        const savedVoiceTranslations = (await AsyncStorageUtils.getItem('voiceTranslations')) || [];
        setSavedTranslations([...savedTextTranslations, ...savedVoiceTranslations]);

        const savedNotifications = await AsyncStorageUtils.getItem('notificationsEnabled');
        if (savedNotifications !== null) {
          setNotificationsEnabled(savedNotifications === 'true');
        }
      } catch (err) {
        setError(t('error') + ': ' + Helpers.handleError(err));
        setToastVisible(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [t]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  const handleLanguageChange = async (language) => {
    setSelectedLanguage(language);
    await changeLocale(language);
  };

  const handleSavePreferences = async () => {
    setError('');
    setIsLoading(true);
    try {
      await setPreferences(localPreferences);
      Alert.alert(t('success'), t('preferencesSaved'));
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(t('error') + ': ' + Helpers.handleError(err));
      setToastVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDarkMode = async () => {
    setIsDarkModeLocal((prev) => !prev); // Update local state immediately for UI responsiveness
    await toggleTheme(); // Update global state and persist to AsyncStorage
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorageUtils.setItem('notificationsEnabled', newValue.toString());
  };

  const handleClearTranslations = async () => {
    Alert.alert(
      t('clearTranslations'),
      t('areYouSure'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await AsyncStorageUtils.removeItem('textTranslations');
              await AsyncStorageUtils.removeItem('voiceTranslations');
              setSavedTranslations([]);
              Alert.alert(t('success'), t('translationsCleared'));
            } catch (err) {
              setError(t('error') + ': ' + Helpers.handleError(err));
              setToastVisible(true);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      {/* Header with back button */}
      <View style={[styles.headerContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesome name="arrow-left" size={24} color={isDarkMode ? '#E0E0E0' : '#212121'} />
        </Pressable>
        <Text style={[styles.headerText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>
          {session ? t('profile', { defaultValue: 'Profile' }) : t('settings', { defaultValue: 'Settings' })}
        </Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {session && (
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('profile')}</Text>
            <Text style={[styles.detailText, { color: isDarkMode ? '#B0B0B0' : '#424242' }]}>{t('email')}</Text>
            <Text style={[styles.detailValue, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{session.email}</Text>
          </View>
        )}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('preferences')}</Text>
          <View style={styles.option}>
            <Text style={[styles.optionText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('appLanguage')}</Text>
            <View style={styles.languageOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.languageButton,
                  selectedLanguage === 'en' && styles.selectedLanguageButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleLanguageChange('en')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.languageButtonText, selectedLanguage === 'en' && styles.selectedLanguageText]}>English</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.languageButton,
                  selectedLanguage === 'he' && styles.selectedLanguageButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleLanguageChange('he')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.languageButtonText, selectedLanguage === 'he' && styles.selectedLanguageText]}>Hebrew</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.option}>
            <Text style={[styles.optionText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('darkMode')}</Text>
            <Switch
              value={isDarkModeLocal}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkModeLocal ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          <View style={styles.option}>
            <Text style={[styles.optionText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('sourceLang')}</Text>
            <LanguageSearch
              onSelectLanguage={(lang) => setLocalPreferences({ ...localPreferences, defaultFromLang: lang })}
              selectedLanguage={localPreferences.defaultFromLang}
            />
          </View>
          <View style={styles.option}>
            <Text style={[styles.optionText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('targetLang')}</Text>
            <LanguageSearch
              onSelectLanguage={(lang) => setLocalPreferences({ ...localPreferences, defaultToLang: lang })}
              selectedLanguage={localPreferences.defaultToLang}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleSavePreferences}
            disabled={isLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.saveButtonText}>{t('savePreferences')}</Text>
          </Pressable>
        </View>
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('notifications')}</Text>
          <View style={styles.option}>
            <Text style={[styles.optionText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('notifications')}</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>
        {savedTranslations.length > 0 && (
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('clearTranslations')}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.clearButton,
                { backgroundColor: Constants.COLORS.DESTRUCTIVE, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleClearTranslations}
              disabled={isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearButtonText}>{t('clearTranslations')}</Text>
            </Pressable>
          </View>
        )}
        {session && (
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('security')}</Text>
            <Pressable style={styles.option}>
              <Text style={[styles.optionText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('changePassword')}</Text>
              <Text style={[styles.optionValue, { color: isDarkMode ? '#B0B0B0' : '#424242' }]}>{t('comingSoon')}</Text>
            </Pressable>
          </View>
        )}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Pressable style={styles.option}>
            <Text style={[styles.optionText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>{t('about')}</Text>
            <Text style={[styles.optionValue, { color: isDarkMode ? '#B0B0B0' : '#424242' }]}>{t('comingSoon')}</Text>
          </Pressable>
          {session && (
            <Pressable style={styles.option} onPress={handleSignOut}>
              <Text style={[styles.optionText, { color: Constants.COLORS.DESTRUCTIVE }]}>{t('signOut')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      {isLoading && <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} style={styles.loading} />}
      <Toast message={error} visible={toastVisible} onHide={() => setToastVisible(false)} />
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
    justifyContent: 'space-between',
    paddingHorizontal: Constants.SPACING.MEDIUM,
    paddingVertical: Constants.SPACING.LARGE,
    backgroundColor: '#121212', // Match ChatGPT's dark background
  },
  headerText: {
    fontSize: 20, // Slightly smaller to match ChatGPT's title size
    fontWeight: '600', // Slightly less bold to match ChatGPT's style
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF', // White text to match ChatGPT's dark mode
  },
  placeholder: {
    width: 24, // Matches the width of the back button for symmetry
  },
  scrollContent: {
    padding: Constants.SPACING.SECTION,
    paddingBottom: Constants.SPACING.SECTION * 2,
  },
  section: {
    borderRadius: 12,
    padding: Constants.SPACING.MEDIUM,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
  },
  detailText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Constants.SPACING.SMALL,
  },
  detailValue: {
    fontSize: 16,
    marginBottom: Constants.SPACING.MEDIUM,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Constants.SPACING.SMALL,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionValue: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  languageOptions: {
    flexDirection: 'row',
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#B0B0B0',
  },
  selectedLanguageButton: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#424242',
  },
  selectedLanguageText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginBottom: Constants.SPACING.LARGE,
  },
});

export default ProfileScreen;