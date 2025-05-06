import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useTranslation } from '../utils/TranslationContext';
import { useSession } from '../utils/ctx';
import useLanguageStore from '../stores/LanguageStore';
import Constants from '../utils/Constants';
import useThemeStore from '../stores/ThemeStore';
import { useFocusEffect } from 'expo-router';

const LanguageSearch = ({ onSelectLanguage, selectedLanguage }) => {
  const { t } = useTranslation();
  const { session } = useSession();
  const { languages, fetchLanguages, isLoading, error } = useLanguageStore();
  const { isDarkMode } = useThemeStore();

  const [displayValue, setDisplayValue] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLanguageName, setSelectedLanguageName] = useState('');

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (error) {
      console.error('Language fetch error:', error);
      return;
    }
    if (languages.length > 0) {
      setFilteredLanguages(languages.slice(0, 8));
      if (selectedLanguage) {
        const selectedLang = languages.find((lang) => lang.code === selectedLanguage);
        if (selectedLang) {
          setSelectedLanguageName(selectedLang.name);
          setDisplayValue(selectedLang.name);
        }
      }
    }
  }, [languages, error, selectedLanguage]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsDropdownOpen(false);
        setDisplayValue(selectedLanguageName);
      };
    }, [selectedLanguageName])
  );

  const handleSearchChange = (text) => {
    setDisplayValue(text);
    setIsDropdownOpen(true);
    const normalized = text.toLowerCase();
    const filtered = languages
      .filter((lang) => lang.name.toLowerCase().startsWith(normalized))
      .slice(0, 8);
    setFilteredLanguages(text ? filtered : languages.slice(0, 8));
  };

  const handleSelectLanguage = (lang) => {
    setDisplayValue(lang.name);
    setSelectedLanguageName(lang.name);
    setFilteredLanguages(languages.slice(0, 8));
    onSelectLanguage(lang.code);
    setIsDropdownOpen(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setDisplayValue('');
    setIsDropdownOpen(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD,
              color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT,
            },
          ]}
          placeholder={t('searchLanguages')}
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          value={displayValue}
          onChangeText={handleSearchChange}
          onFocus={handleFocus}
          accessibilityLabel="Search languages"
        />
      </View>

      {error ? (
        <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text>
      ) : isLoading ? (
        <ActivityIndicator
          size="small"
          color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY}
          style={styles.loading}
        />
      ) : isDropdownOpen ? (
        <View style={styles.dropdownContainer}>
          {filteredLanguages.length === 0 ? (
            <Text
              style={[
                styles.noResults,
                {
                  color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT,
                },
              ]}
            >
              {t('noLanguagesFound')}
            </Text>
          ) : (
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    {
                      backgroundColor: isDarkMode ? '#444' : Constants.COLORS.CARD,
                    },
                  ]}
                  onPress={() => handleSelectLanguage(item)}
                  accessibilityLabel={`Select language ${item.name}`}
                >
                  <Text
                    style={[
                      styles.itemText,
                      {
                        color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.list}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Constants.SPACING.MEDIUM,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: Constants.SPACING.MEDIUM,
    borderRadius: 10,
    fontSize: Constants.FONT_SIZES.BODY,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  list: {
    maxHeight: 200,
    borderRadius: 8,
    backgroundColor: Constants.COLORS.CARD,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  item: {
    padding: Constants.SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: Constants.FONT_SIZES.BODY,
  },
  error: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    textAlign: 'center',
    marginBottom: Constants.SPACING.MEDIUM,
  },
  noResults: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    textAlign: 'center',
    marginBottom: Constants.SPACING.MEDIUM,
  },
  loading: {
    marginBottom: Constants.SPACING.MEDIUM,
  },
});

export default LanguageSearch;
