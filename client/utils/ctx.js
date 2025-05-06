import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorageUtils from './AsyncStorage';
import ApiService from '../services/ApiService';
import Helpers from './Helpers';
import { router } from 'expo-router';

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
  resetSession: async () => {},
  resetSessionButKeepPreferences: async () => {},
  register: async () => {},
  setPreferences: async () => {},
  clearError: () => {},
  isLoggingIn: false,
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
  const [lastLoginTime, setLastLoginTime] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userData = await AsyncStorageUtils.getItem('user');
        const token = await AsyncStorageUtils.getItem('signed_session_id');
        let preferencesData = null;

        if (userData && userData.id && token) {
          const response = await ApiService.get('/validate-session', token);
          if (response.success) {
            setSession({ ...userData, signed_session_id: token });
            preferencesData = await AsyncStorageUtils.getItem('preferences');
          } else {
            await resetSession();
            preferencesData = await AsyncStorageUtils.getItem('preferences');
          }
        } else {
          await resetSessionButKeepPreferences();
          preferencesData = await AsyncStorageUtils.getItem('preferences');
        }

        if (preferencesData) setPreferencesState(preferencesData);
      } catch (err) {
        setError(Helpers.handleError(err));
        await resetSessionButKeepPreferences();
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const token = await AsyncStorageUtils.getItem('signed_session_id');
        // Removed: console.log('Validating session with token:', token);
        if (!token) {
          // Removed: console.warn('No session token found, skipping validation');
          return;
        }

        const response = await ApiService.get('/validate-session', token);
        console.log('Session validation response:', response);

        if (!response.success) {
          const now = Date.now();
          if (lastLoginTime && now - lastLoginTime < 30000) {
            console.warn('Session validation failed shortly after login, ignoring...');
            return;
          }
          if (isLoggingIn) {
            console.warn('Session validation failed during login attempt, skipping navigation...');
            await resetSession();
            return;
          }
          console.warn('Session expired or invalid. Resetting...');
          await resetSession();
          router.replace('/welcome');
        }
      } catch (err) {
        console.error('Error during session validation:', err);
      }
    };

    const timer = setTimeout(() => {
      validateSession();
      const interval = setInterval(validateSession, 15000);
      return () => clearInterval(interval);
    }, 5000);

    return () => clearTimeout(timer);
  }, [lastLoginTime, isLoggingIn]);

  const resetSession = async () => {
    await AsyncStorageUtils.removeItem('user');
    await AsyncStorageUtils.removeItem('signed_session_id');
    await AsyncStorageUtils.removeItem('preferences');

    setSession(null);
    setPreferencesState({ defaultFromLang: null, defaultToLang: null });
  };

  const resetSessionButKeepPreferences = async () => {
    await AsyncStorageUtils.removeItem('signed_session_id');
    setSession(null);
  };

  const signIn = async (email, password) => {
    try {
      setIsLoggingIn(true);
      setIsAuthLoading(true);
      setError(null);

      const response = await ApiService.post('/login', { email, password });

      if (!response.success || !response.data || !response.data.token || !response.data.user) {
        throw new Error(response?.error || 'Login failed');
      }

      const { user, token } = response.data;
      console.log('Login successful, user:', user);
      console.log('Setting session token:', token);

      await AsyncStorageUtils.setItem('user', user);
      await AsyncStorageUtils.setItem('signed_session_id', token);

      setSession({ ...user, signed_session_id: token });
      setPreferencesState({
        defaultFromLang: user.defaultFromLang || null,
        defaultToLang: user.defaultToLang || null,
      });

      setLastLoginTime(Date.now());
    } catch (err) {
      await resetSessionButKeepPreferences();
      const msg = Helpers.handleError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
      setIsLoggingIn(false);
    }
  };

  const signOut = async () => {
    try {
      setIsAuthLoading(true);
      setError(null);

      const token = await AsyncStorageUtils.getItem('signed_session_id');
      const response = await ApiService.post('/logout', {}, token);
      if (!response.success) throw new Error(response.error || 'Logout failed');

      await resetSession();
      router.replace('/welcome');
    } catch (err) {
      const msg = Helpers.handleError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      setIsAuthLoading(true);
      setError(null);

      const response = await ApiService.post('/register', { email, password });
      if (!response.success) throw new Error(response.error || 'Registration failed');

      const defaultPrefs = { defaultFromLang: 'en', defaultToLang: 'he' };
      await AsyncStorageUtils.setItem('preferences', defaultPrefs);
      setPreferencesState(defaultPrefs);
    } catch (err) {
      const msg = Helpers.handleError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const setPreferences = async (prefs) => {
    try {
      setIsAuthLoading(true);
      setError(null);

      const token = await AsyncStorageUtils.getItem('signed_session_id');
      const user = await AsyncStorageUtils.getItem('user');

      if (token && user?.id) {
        const response = await ApiService.post('/preferences', prefs, token);
        if (!response.success) throw new Error(response.error || 'Failed to update preferences');
      }

      await AsyncStorageUtils.setItem('preferences', prefs);
      setPreferencesState(prefs);
    } catch (err) {
      const msg = Helpers.handleError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        preferences,
        isLoading,
        isAuthLoading,
        error,
        signIn,
        signOut,
        resetSession,
        resetSessionButKeepPreferences,
        register,
        setPreferences,
        clearError,
        isLoggingIn,
      }}
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