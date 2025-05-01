// utils/AsyncStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const AsyncStorageUtils = {
  // Get an item from AsyncStorage
  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value == null) return null;
      try {
        return JSON.parse(value);
      } catch (parseError) {
        // Handle non-JSON values (e.g., strings like 'dark' for theme)
        return value;
      }
    } catch (error) {
      const errorMessage = `Error getting item from AsyncStorage (${key}): ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Set an item in AsyncStorage
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      const errorMessage = `Error setting item in AsyncStorage (${key}): ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Remove an item from AsyncStorage
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      const errorMessage = `Error removing item from AsyncStorage (${key}): ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Clear all items from AsyncStorage
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      const errorMessage = `Error clearing AsyncStorage: ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
};

export default AsyncStorageUtils;