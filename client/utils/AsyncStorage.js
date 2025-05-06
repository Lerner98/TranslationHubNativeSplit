import AsyncStorage from '@react-native-async-storage/async-storage';

const isSerializable = (value) => {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
};

const AsyncStorageUtils = {
  // 🔍 Get an item from AsyncStorage
  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      const msg = `AsyncStorage.getItem('${key}') failed: ${error.message}`;
      console.error(msg);
      throw new Error(msg);
    }
  },

  // 💾 Set an item in AsyncStorage (Safe serialization)
  setItem: async (key, value) => {
    try {
      if (!isSerializable(value)) {
        throw new Error(`Value for key '${key}' is not serializable.`);
      }

      const serialized = JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
    } catch (error) {
      const msg = `AsyncStorage.setItem('${key}') failed: ${error.message}`;
      console.error(msg);
      throw new Error(msg);
    }
  },

  // ❌ Remove an item from AsyncStorage
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      const msg = `AsyncStorage.removeItem('${key}') failed: ${error.message}`;
      console.error(msg);
      throw new Error(msg);
    }
  },

  // 🧹 Clear all AsyncStorage
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      const msg = `AsyncStorage.clear() failed: ${error.message}`;
      console.error(msg);
      throw new Error(msg);
    }
  },
};

export default AsyncStorageUtils;
