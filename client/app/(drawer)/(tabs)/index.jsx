// app/(drawer)/(tabs)/index.jsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useThemeStore from '../../../stores/ThemeStore';
import { useRouter } from 'expo-router';
import Constants from '../../../utils/Constants';

const HomeScreen = () => {
  const { t } = useTranslation();
  const { session } = useSession();
  const { isDarkMode } = useThemeStore();
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    console.log('HomeScreen mounted');
    isMounted.current = true;

    return () => {
      console.log('HomeScreen unmounted');
      isMounted.current = false;
    };
  }, []);

  const welcomeMessage = session
    ? `Hello, ${session.email.split('@')[0]}!`
    : t('welcomeGuest');

  const handleTextVoicePress = () => {
    console.log('Navigating to Text & Voice Translation');
    if (isMounted.current) {
      router.navigate('/text-voice');
    }
  };

  const handleFilePress = () => {
    console.log('Navigating to File Translation');
    if (isMounted.current) {
      router.navigate('/file');
    }
  };

  const handleASLPress = () => {
    console.log('Navigating to ASL Translation');
    if (isMounted.current) {
      router.navigate('/asl');
    }
  };

  const handleCameraPress = () => {
    console.log('Navigating to Camera Translation');
    if (isMounted.current) {
      router.navigate('/camera');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Text style={[styles.welcomeText, { color: isDarkMode ? '#FFF' : '#212121' }]}>
            {welcomeMessage}
          </Text>
          <Text style={[styles.descriptionText, { color: isDarkMode ? '#CCC' : '#424242' }]}>
            {t('welcomeMessage')}
          </Text>
        </View>
        <View style={styles.buttonGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleTextVoicePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.gridButtonText}>{t('textVoiceTranslation')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleFilePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.gridButtonText}>{t('fileTranslation')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleASLPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.gridButtonText}>{t('aslTranslation')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleCameraPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.gridButtonText}>{t('cameraTranslation')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Constants.SPACING.SECTION,
    paddingBottom: 80, // Space for tab bar
  },
  heroSection: {
    marginBottom: Constants.SPACING.SECTION,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(30,136,229,0.1)', // Subtle overlay
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Constants.SPACING.MEDIUM,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridButton: {
    width: '48%',
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    marginBottom: Constants.SPACING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gridButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;