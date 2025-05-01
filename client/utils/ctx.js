// utils/ctx.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorageUtils from './AsyncStorage';
import ApiService from '../services/ApiService';
import Helpers from './Helpers';

const SessionContext = createContext({
  session: null,
  preferences: {
    defaultFromLang: null,
    defaultToLang: null,
  },
  isLoading: true,
  isAuthLoading: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  register: async () => {},
  setPreferences: async () => {},
});

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [preferences, setPreferencesState] = useState({
    defaultFromLang: null,
    defaultToLang: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userData = await AsyncStorageUtils.getItem('user');
        const preferencesData = await AsyncStorageUtils.getItem('preferences');
        if (userData) {
          setSession(userData);
        }
        if (preferencesData) {
          setPreferencesState(preferencesData);
        }
      } catch (err) {
        setError(Helpers.handleError(err));
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const signIn = async (email, password) => {
    try {
      setIsAuthLoading(true);
      setError(null);
      const response = await ApiService.post('/login', { email, password }, null);
      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }
      const user = response.data.user;
      await AsyncStorageUtils.setItem('user', user);
      await AsyncStorageUtils.setItem('signed_session_id', response.data.token);
      setSession(user);
      setPreferencesState({
        defaultFromLang: user.defaultFromLang,
        defaultToLang: user.defaultToLang,
      });
    } catch (err) {
      const errorMessage = Helpers.handleError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsAuthLoading(true);
      setError(null);
      const token = await AsyncStorageUtils.getItem('signed_session_id');
      const response = await ApiService.post('/logout', {}, token);
      if (!response.success) {
        throw new Error(response.error || 'Logout failed');
      }
      await AsyncStorageUtils.removeItem('user');
      await AsyncStorageUtils.removeItem('signed_session_id');
      await AsyncStorageUtils.removeItem('preferences');
      setSession(null);
      setPreferencesState({ defaultFromLang: null, defaultToLang: null });
    } catch (err) {
      const errorMessage = Helpers.handleError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      setIsAuthLoading(true);
      setError(null);
      const response = await ApiService.post('/register', { email, password }, null);
      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }
      // Set default preferences for the new user
      const defaultPreferences = { defaultFromLang: 'en', defaultToLang: 'he' };
      await AsyncStorageUtils.setItem('preferences', defaultPreferences);
      setPreferencesState(defaultPreferences);
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const setPreferences = async (prefs) => {
    try {
      setIsAuthLoading(true);
      setError(null);
      const token = await AsyncStorageUtils.getItem('signed_session_id');
      const response = await ApiService.post('/preferences', prefs, token);
      if (!response.success) {
        throw new Error(response.error || 'Failed to set preferences');
      }
      await AsyncStorageUtils.setItem('preferences', prefs);
      setPreferencesState(prefs);
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{ session, preferences, isLoading, isAuthLoading, error, signIn, signOut, register, setPreferences }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};