// components/NavigationBar.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Constants from '../utils/Constants';

const NavigationBar = ({ navigation, title, isDarkMode }) => {
  const handleBack = () => {
    navigation.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.PRIMARY }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back">
        <FontAwesome name="arrow-left" size={24} color={isDarkMode ? '#fff' : Constants.COLORS.CARD} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : Constants.COLORS.CARD }]} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Constants.SPACING.MEDIUM,
    paddingHorizontal: Constants.SPACING.SECTION,
    paddingTop: Constants.SPACING.SECTION + 20, // Account for status bar
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: Constants.SPACING.MEDIUM,
  },
  title: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
});

export default NavigationBar;