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
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeTranslate = (key, fallback = '') => {
    const value = t(key);
    return typeof value === 'string' ? value : fallback;
  };

  const welcomeMessage = session
    ? `Hello, ${session.email.split('@')[0]}!`
    : safeTranslate('welcomeGuest', 'Welcome, Guest!');

  const handleTextVoicePress = () => {
    if (isMounted.current) router.navigate('/text-voice');
  };

  const handleFilePress = () => {
    if (isMounted.current) router.navigate('/file');
  };

  const handleASLPress = () => {
    if (isMounted.current) router.navigate('/asl');
  };

  const handleCameraPress = () => {
    if (isMounted.current) router.navigate('/camera');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Text style={[styles.welcomeText, { color: isDarkMode ? '#FFF' : '#212121' }]}>
            {welcomeMessage}
          </Text>
          <Text style={[styles.descriptionText, { color: isDarkMode ? '#CCC' : '#424242' }]}>
            {safeTranslate('welcomeMessage', 'Welcome to the app')}
          </Text>
        </View>
        <View style={styles.buttonGrid}>
          <Pressable style={({ pressed }) => [
            styles.gridButton,
            { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
          ]} onPress={handleTextVoicePress}>
            <Text style={styles.gridButtonText}>
              {safeTranslate('textVoiceTranslation', 'Text/Voice')}
            </Text>
          </Pressable>

          <Pressable style={({ pressed }) => [
            styles.gridButton,
            { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
          ]} onPress={handleFilePress}>
            <Text style={styles.gridButtonText}>
              {safeTranslate('fileTranslation', 'File')}
            </Text>
          </Pressable>

          <Pressable style={({ pressed }) => [
            styles.gridButton,
            { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
          ]} onPress={handleASLPress}>
            <Text style={styles.gridButtonText}>
              {safeTranslate('aslTranslation', 'ASL')}
            </Text>
          </Pressable>

          <Pressable style={({ pressed }) => [
            styles.gridButton,
            { backgroundColor: isDarkMode ? '#1E88E5' : '#1976D2', opacity: pressed ? 0.8 : 1 },
          ]} onPress={handleCameraPress}>
            <Text style={styles.gridButtonText}>
              {safeTranslate('cameraTranslation', 'Camera')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    padding: Constants.SPACING.SECTION,
    paddingBottom: 80,
  },
  heroSection: {
    marginBottom: Constants.SPACING.SECTION,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(30,136,229,0.1)',
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