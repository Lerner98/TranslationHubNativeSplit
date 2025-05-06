// app/(drawer)/saves.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Pressable } from 'react-native';
import { IconButton, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from '../../utils/TranslationContext';
import { useSession } from '../../utils/ctx';
import useTranslationStore from '../../stores/TranslationStore';
import Toast from '../../components/Toast';
import { useRouter } from 'expo-router';
import Constants from '../../utils/Constants';
import Helpers from '../../utils/Helpers';
import useThemeStore from '../../stores/ThemeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const retry = async (fn, retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      __DEV__ && console.log(`Retry attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const TranslationItem = ({ item, isDarkMode, onDelete, t, locale }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const onDeletePress = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    onDelete(item.id, () => setIsDeleting(false));
  };

  return (
    <View style={[styles.translationItem, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD }]}>
      <View style={[styles.translationContent]}>
        <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}> 
          {t('original', { defaultValue: 'Original Text' })}: {item.original_text}
        </Text>
        <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}> 
          {t('translated', { defaultValue: 'Translated Text' })}: {item.translated_text}
        </Text>
        <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}> 
          {t('createdAt', { defaultValue: 'Created At' })}: {Helpers.formatDate(item.created_at, locale)}
        </Text>
      </View>
      <Pressable
        onPress={onDeletePress}
        style={({ pressed }) => [styles.deleteButtonWrapper, { opacity: pressed ? 0.7 : 1 }]}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        accessibilityLabel="Delete translation"
      >
        <FontAwesome name="trash" size={24} color={Constants.COLORS.DESTRUCTIVE} />
      </Pressable>
    </View>
  );
};

const SavesScreen = () => {
  const { t, locale } = useTranslation();
  const { session } = useSession();
  const {
    savedTextTranslations,
    guestTranslations,
    fetchTranslations,
    clearTranslations,
    clearGuestTranslations,
    isLoading,
    error,
  } = useTranslationStore();
  const setTranslationStore = useTranslationStore.setState;
  const { isDarkMode } = useThemeStore();
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadTranslations = async () => {
      if (session && isMounted) {
        try {
          await fetchTranslations(session);
        } catch (err) {
          if (isMounted) {
            setTranslationStore({ error: t('error') + ': ' + Helpers.handleError(err) });
            setToastVisible(true);
          }
        }
      }
    };
    loadTranslations();
    return () => { isMounted = false; };
  }, [session, fetchTranslations, t]);

  const handleDeleteTranslation = (id, onComplete) => {
    Alert.alert(
      t('deleteTranslation', { defaultValue: 'Delete Translation' }),
      t('areYouSure', { defaultValue: 'Are you sure?' }),
      [
        { text: t('cancel', { defaultValue: 'Cancel' }), style: 'cancel', onPress: onComplete },
        {
          text: t('delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            try {
              if (session) {
                const translation = savedTextTranslations.find((item) => item.id === id);
                if (translation) {
                  try {
                    await retry(() =>
                      fetch(`${Constants.API_URL}/translations/delete/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${session.signed_session_id}` },
                      })
                    );
                  } catch (serverErr) {
                    setToastVisible(true);
                    setTranslationStore({ error: t('error') + ': Failed to delete from server. Removed locally.' });
                  }
                  setTranslationStore((state) => ({
                    savedTextTranslations: state.savedTextTranslations.filter((item) => item.id !== id),
                  }));
                  await fetchTranslations(session);
                }
              } else {
                const updated = guestTranslations.filter((item) => item.id !== id);
                setTranslationStore({ guestTranslations: updated });
                await AsyncStorage.setItem('guestTranslations', JSON.stringify(updated));
              }
            } catch (err) {
              setTranslationStore({ error: t('error') + ': ' + Helpers.handleError(err) });
              setToastVisible(true);
            } finally {
              onComplete();
            }
          },
        },
      ]
    );
  };

  const handleClearTranslations = async () => {
    Alert.alert(
      t('clearTranslations', { defaultValue: 'Clear Translations' }),
      t('areYouSure', { defaultValue: 'Are you sure?' }),
      [
        { text: t('cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('clear', { defaultValue: 'Clear' }),
          style: 'destructive',
          onPress: async () => {
            try {
              if (session) {
                await clearTranslations(session);
                setTranslationStore({ savedTextTranslations: [] });
                await fetchTranslations(session);
              } else {
                await clearGuestTranslations();
                setTranslationStore({ guestTranslations: [] });
                await AsyncStorage.setItem('guestTranslations', JSON.stringify([]));
              }
            } catch (err) {
              setTranslationStore({ error: t('error') + ': ' + Helpers.handleError(err) });
              setToastVisible(true);
            }
          },
        },
      ]
    );
  };

  const translations = session ? savedTextTranslations : guestTranslations.filter(item => item.type === 'text');

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
      {isLoading && (
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} style={styles.loading} />
      )}
      <FlatList
        data={translations}
        renderItem={({ item }) => (
          <TranslationItem item={item} isDarkMode={isDarkMode} onDelete={handleDeleteTranslation} t={t} locale={locale} />
        )}
        keyExtractor={(item, index) => `${item.id || index}`}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Go back"
              >
                <FontAwesome name="chevron-left" size={24} color={isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT} />
              </Pressable>
              <Text style={[styles.title, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>
                {t('saves', { defaultValue: 'Saved Translations' })}
              </Text>
              <View style={styles.placeholder} />
            </View>
            {translations.length > 0 && (
              <Pressable
                onPress={handleClearTranslations}
                style={({ pressed }) => [
                  styles.clearButton,
                  { backgroundColor: Constants.COLORS.DESTRUCTIVE, opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Clear all translations"
              >
                <Text style={styles.clearButtonLabel}>{t('clearTranslations', { defaultValue: 'Clear Translations' })}</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading && (
            <Text style={[styles.noTranslations, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}> 
              {t('noTranslations', { defaultValue: 'No saved translations found.' })}
            </Text>
          )
        }
        contentContainerStyle={styles.scrollContent}
      />
      <Toast message={error} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: Constants.SPACING.SECTION,
    paddingBottom: Constants.SPACING.SECTION * 2,
  },
  header: {
    marginBottom: Constants.SPACING.SECTION,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Constants.SPACING.LARGE,
  },
  backButton: {
    padding: Constants.SPACING.SMALL,
  },
  title: {
    fontSize: Constants.FONT_SIZES.TITLE,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 24,
  },
  clearButton: {
    width: '80%',
    paddingVertical: Constants.SPACING.MEDIUM,
    paddingHorizontal: Constants.SPACING.LARGE,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  translationItem: {
    flexDirection: 'row',
    padding: Constants.SPACING.LARGE,
    borderRadius: 12,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  translationContent: {
    flex: 1,
  },
  translationText: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.SMALL,
    lineHeight: 20,
  },
  deleteButtonWrapper: {
    padding: Constants.SPACING.SMALL,
  },
  noTranslations: {
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
    marginTop: Constants.SPACING.SECTION,
  },
  loading: {
    marginVertical: Constants.SPACING.SECTION,
  },
});

export default SavesScreen;
