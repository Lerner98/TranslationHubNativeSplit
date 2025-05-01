// app/utils/TranslationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorageUtils from './AsyncStorage';
import { I18n } from 'i18n-js';

const i18n = new I18n();

// Set translations and fallback
const translations = {
  en: {
    welcome: 'Welcome to TranslationHub',
    welcomeGuest: 'Welcome, Guest!',
    welcomeMessage: 'TranslationHub helps you translate text, voice, files, and more in real-time.',
    welcomeMessageHeader: 'Your Gateway to Seamless Translation', // Added for tabs
    login: 'Login',
    register: 'Register',
    goToHome: 'Go to Home',
    email: 'Email',
    password: 'Password',
    error: 'Error',
    guestLimit: 'Guest limit reached (10 translations). Please log in to continue.',
    sourceLang: 'Source Language',
    targetLang: 'Target Language',
    original: 'Original Text',
    translated: 'Translated Text',
    translate: 'Translate',
    speak: 'Speak',
    stopSpeaking: 'Stop Speaking',
    save: 'Save',
    saveSuccess: 'Translation saved successfully!',
    recentHistory: 'Recent History',
    createdAt: 'Created At',
    history: 'History', // Added for drawer
    home: 'Home', // Added for drawer and tabs
    settings: 'Settings', // Added for drawer and Profile screen
    profile: 'Profile', // Added for drawer and Profile screen
    noTranslations: 'No translations found.',
    clearTranslations: 'Clear Translations',
    areYouSure: 'Are you sure?',
    cancel: 'Cancel',
    clear: 'Clear',
    success: 'Success',
    translationsCleared: 'Translations cleared successfully!',
    preferences: 'Preferences',
    savePreferences: 'Save Preferences',
    preferencesSaved: 'Preferences saved successfully!',
    notifications: 'Notifications',
    appLanguage: 'App Language',
    darkMode: 'Dark Mode',
    changePassword: 'Change Password',
    enableTwoStep: 'Enable Two-Step Verification',
    comingSoon: 'Coming Soon',
    comingSoonMessage: 'This feature will be implemented soon.',
    security: 'Security',
    about: 'About',
    signOut: 'Sign Out',
    goToSettings: 'Go to Settings',
    deleteTranslation: 'Delete Translation',
    delete: 'Delete',
    pickDocument: 'Pick Document',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    loading: 'Loading...',
    textVoiceTranslation: 'Text/Voice', // Added for tabs
    fileTranslation: 'File', // Added for tabs
    aslTranslation: 'ASL', // Added for tabs
    cameraTranslation: 'Camera', // Added for tabs
    noLanguagesFound: 'No languages found',
    pageNotFound: 'Page Not Found',
    pageNotFoundDescription: 'The page you are looking for does not exist or has been moved.',
    searchLanguages: 'Search languages',
  },
  he: {
    welcome: 'ברוכים הבאים ל-TranslationHub',
    welcomeGuest: 'ברוך הבא, אורח!',
    welcomeMessage: 'TranslationHub עוזר לך לתרגם טקסט, קול, קבצים ועוד בזמן אמת.',
    welcomeMessageHeader: 'שער שלך לתרגום חלק',
    login: 'התחבר',
    register: 'הירשם',
    goToHome: 'חזור לדף הבית',
    email: 'דוא"ל',
    password: 'סיסמה',
    error: 'שגיאה',
    guestLimit: 'הגעת למגבלת האורחים (10 תרגומים). אנא התחבר כדי להמשיך.',
    sourceLang: 'שפת מקור',
    targetLang: 'שפת יעד',
    original: 'טקסט מקורי',
    translated: 'טקסט מתורגם',
    translate: 'תרגם',
    speak: 'דבר',
    stopSpeaking: 'הפסק לדבר',
    save: 'שמור',
    saveSuccess: 'התרגום נשמר בהצלחה!',
    recentHistory: 'היסטוריה אחרונה',
    createdAt: 'נוצר ב',
    history: 'היסטוריה', // Added for drawer
    home: 'בית', // Added for drawer and tabs
    settings: 'הגדרות', // Added for drawer and Profile screen
    profile: 'פרופיל', // Added for drawer and Profile screen
    noTranslations: 'לא נמצאו תרגומים.',
    clearTranslations: 'נקה תרגומים',
    areYouSure: 'האם אתה בטוח?',
    cancel: 'בטל',
    clear: 'נקה',
    success: 'הצלחה',
    translationsCleared: 'התרגומים נוקו בהצלחה!',
    preferences: 'העדפות',
    savePreferences: 'שמור העדפות',
    preferencesSaved: 'ההעדפות נשמרו בהצלחה!',
    notifications: 'התראות',
    appLanguage: 'שפת האפליקציה',
    darkMode: 'מצב כהה',
    changePassword: 'שנה סיסמה',
    enableTwoStep: 'הפעל אימות דו-שלבי',
    comingSoon: 'בקרוב',
    comingSoonMessage: 'תכונה זו תיושם בקרוב.',
    security: 'אבטחה',
    about: 'אודות',
    signOut: 'התנתק',
    goToSettings: 'עבור להגדרות',
    deleteTranslation: 'מחק תרגום',
    delete: 'מחק',
    pickDocument: 'בחר מסמך',
    startCamera: 'הפעל מצלמה',
    stopCamera: 'עצור מצלמה',
    loading: 'טוען...',
    textVoiceTranslation: 'טקסט/קול', // Added for tabs
    fileTranslation: 'קובץ', // Added for tabs
    aslTranslation: 'שפת סימנים', // Added for tabs
    cameraTranslation: 'מצלמה', // Added for tabs
    noLanguagesFound: 'לא נמצאו שפות',
    pageNotFound: 'הדף לא נמצא',
    pageNotFoundDescription: 'הדף שאתה מחפש אינו קיים או הועבר.',
    searchLanguages: 'חפש שפות',
  },
};

i18n.translations = translations;
i18n.fallbacks = true;

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [locale, setLocale] = useState('en'); // Set default locale synchronously
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeLocale = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const savedLocale = await AsyncStorageUtils.getItem('locale');
        if (savedLocale) {
          setLocale(savedLocale);
        }
      } catch (error) {
        console.error('Failed to initialize locale:', error);
        setError('Failed to initialize locale');
      } finally {
        setIsLoading(false);
      }
    };
    initializeLocale();
  }, []);

  useEffect(() => {
    i18n.locale = locale;
  }, [locale]);

  const t = (key, options = {}) => {
    // Use the defaultValue from options if provided, otherwise fall back to the key
    const translation = i18n.t(key, { ...options, locale });
    return translation === `[missing "${locale}.${key}" translation]` ? (options.defaultValue || key) : translation;
  };

  const changeLocale = async (newLocale) => {
    try {
      setError(null);
      await AsyncStorageUtils.setItem('locale', newLocale);
      setLocale(newLocale);
    } catch (error) {
      console.error('Failed to change locale:', error);
      setError('Failed to change locale');
    }
  };

  // Render children only after locale is initialized
  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <TranslationContext.Provider value={{ t, locale, changeLocale, isLoading, error }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};