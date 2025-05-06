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
      }, Constants.TOAST_DURATION);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, onHide]);

  const getSafeMessage = () => {
    try {
      if (!message) return '';
      if (typeof message === 'string') return message;
      if (message instanceof Error && message.message) return message.message;
      if (React.isValidElement(message)) return '[Invalid React element passed as message]';
      if (Array.isArray(message)) return '[Array passed as message]';
      return JSON.stringify(message);
    } catch {
      return '[Unrenderable message]';
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{getSafeMessage()}</Text>
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
