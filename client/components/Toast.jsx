// components/Toast.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Constants from '../utils/Constants';

const Toast = ({ message, visible, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, onHide]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  messageContainer: {
    backgroundColor: Constants.COLORS.DESTRUCTIVE,
    padding: Constants.SPACING.MEDIUM,
    borderRadius: 10,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  messageText: {
    color: Constants.COLORS.CARD,
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Toast;