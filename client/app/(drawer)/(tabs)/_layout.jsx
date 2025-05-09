// app/(drawer)/(tabs)/_layout.jsx
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from '../../../utils/TranslationContext';
import useThemeStore from '../../../stores/ThemeStore';
import { FontAwesome } from '@expo/vector-icons';
import Constants from '../../../utils/Constants';
import { Pressable, Text, View, StyleSheet } from 'react-native';

const getSafeMessage = (msg) => {
  if (typeof msg === 'string') return msg;
  if (msg?.message) return msg.message;
  try {
    return JSON.stringify(msg);
  } catch {
    return '[Invalid Message]';
  }
};

export default function TabLayout() {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    console.log('TabsLayout mounted');
    return () => {
      console.log('TabsLayout unmounted');
    };
  }, []);

  const header = ({ navigation, options }) => {
    const toggleDrawer = () => {
      navigation.openDrawer();
    };

    return (
      <View style={[styles.headerContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <Pressable onPress={toggleDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesome name="bars" size={24} color={isDarkMode ? '#E0E0E0' : '#212121'} />
        </Pressable>
        <Text style={[styles.headerText, { color: isDarkMode ? '#E0E0E0' : '#212121' }]}>
          {String(options?.title || '')}
        </Text>
        <View style={styles.placeholder} />
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#333333' : '#E0E0E0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: isDarkMode ? '#1E88E5' : '#1976D2',
        tabBarInactiveTintColor: isDarkMode ? '#B0B0B0' : '#757575',
        tabBarLabelStyle: {
          fontSize: Constants.FONT_SIZES.SMALL,
          fontWeight: '600',
          marginBottom: Constants.SPACING.SMALL,
        },
        header: header,
        unmountOnBlur: false,
        lazy: false,
        tabBarAllowFontScaling: false,
      }}
      sceneContainerStyle={{
        backgroundColor: isDarkMode ? '#121212' : '#F5F5F5',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: String(t('welcomeMessageHeader')),
          tabBarLabel: String(t('home')),
          tabBarAccessibilityLabel: "Go to Home tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="text-voice"
        options={{
          title: String(t('textVoiceTranslation')),
          tabBarLabel: String(t('textVoiceTranslation')),
          tabBarAccessibilityLabel: "Go to Text and Voice Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="microphone" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="file"
        options={{
          title: String(t('fileTranslation')),
          tabBarLabel: String(t('fileTranslation')),
          tabBarAccessibilityLabel: "Go to File Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asl"
        options={{
          title: String(t('aslTranslation')),
          tabBarLabel: String(t('aslTranslation')),
          tabBarAccessibilityLabel: "Go to ASL Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="hand-o-right" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: String(t('cameraTranslation')),
          tabBarLabel: String(t('cameraTranslation')),
          tabBarAccessibilityLabel: "Go to Camera Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="camera" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Constants.SPACING.SECTION,
    borderBottomWidth: 1,
    borderBottomColor: Constants.COLORS.SECONDARY_TEXT,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
});