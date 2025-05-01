// stores/TranslationStore.js
import { create } from 'zustand';
import AsyncStorageUtils from '../utils/AsyncStorage';
import ApiService from '../services/ApiService';
import Constants from '../utils/Constants';
import Helpers from '../utils/Helpers';

const BASE_URL = Constants.API_URL;

const useTranslationStore = create((set, get) => ({
  recentTextTranslations: [],
  recentVoiceTranslations: [],
  savedTextTranslations: [],
  savedVoiceTranslations: [],
  guestTranslations: [],
  isLoading: false,
  error: null,

  fetchTranslations: async (user) => {
    try {
      set({ isLoading: true, error: null });
      const textResponse = await ApiService.get(
        '/translations/text',
        user.signed_session_id
      );
      if (!textResponse.success) {
        throw new Error(textResponse.error);
      }
      const textTranslations = textResponse.data;

      const voiceResponse = await ApiService.get(
        '/translations/voice',
        user.signed_session_id
      );
      if (!voiceResponse.success) {
        throw new Error(voiceResponse.error);
      }
      const voiceTranslations = voiceResponse.data;

      set({
        savedTextTranslations: textTranslations,
        savedVoiceTranslations: voiceTranslations,
        recentTextTranslations: textTranslations.slice(-5),
        recentVoiceTranslations: voiceTranslations.slice(-5),
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  clearTranslations: async (user) => {
    try {
      set({ isLoading: true, error: null });
      const response = await ApiService.delete(
        '/translations',
        user.signed_session_id
      );
      if (!response.success) {
        throw new Error(response.error);
      }
      set({
        savedTextTranslations: [],
        savedVoiceTranslations: [],
        recentTextTranslations: [],
        recentVoiceTranslations: [],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  clearGuestTranslations: async () => {
    try {
      set({ isLoading: true, error: null });
      await AsyncStorageUtils.removeItem('guestTranslations');
      set({ guestTranslations: [], isLoading: false });
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  addTextTranslation: async (translation, isGuest, sessionId) => {
    if (isGuest) {
      const currentTranslations = get().guestTranslations;
      const updatedTranslations = [...currentTranslations, { ...translation, type: translation.type || 'text' }];
      set({ guestTranslations: updatedTranslations });
      await AsyncStorageUtils.setItem('guestTranslations', updatedTranslations);
    } else {
      try {
        set({ isLoading: true, error: null });
        const response = await ApiService.post(
          '/translations/text',
          translation,
          sessionId
        );
        if (!response.success) {
          throw new Error(response.error);
        }
        // Fetch the updated translations to get the server-generated id
        const fetchResponse = await ApiService.get('/translations/text', sessionId);
        if (!fetchResponse.success) {
          throw new Error(fetchResponse.error);
        }
        const updatedTranslations = fetchResponse.data;
        set((state) => ({
          recentTextTranslations: updatedTranslations.slice(-5),
          savedTextTranslations: updatedTranslations,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage = Helpers.handleError(error);
        set({ error: errorMessage, isLoading: false });
        throw new Error(errorMessage);
      }
    }
  },

  addVoiceTranslation: async (translation, isGuest, sessionId) => {
    if (isGuest) {
      const currentTranslations = get().guestTranslations;
      const updatedTranslations = [...currentTranslations, { ...translation, type: translation.type || 'voice' }];
      set({ guestTranslations: updatedTranslations });
      await AsyncStorageUtils.setItem('guestTranslations', updatedTranslations);
    } else {
      try {
        set({ isLoading: true, error: null });
        const response = await ApiService.post(
          '/translations/voice',
          translation,
          sessionId
        );
        if (!response.success) {
          throw new Error(response.error);
        }
        // Fetch the updated translations to get the server-generated id
        const fetchResponse = await ApiService.get('/translations/voice', sessionId);
        if (!fetchResponse.success) {
          throw new Error(fetchResponse.error);
        }
        const updatedTranslations = fetchResponse.data;
        set((state) => ({
          recentVoiceTranslations: updatedTranslations.slice(-5),
          savedVoiceTranslations: updatedTranslations,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage = Helpers.handleError(error);
        set({ error: errorMessage, isLoading: false });
        throw new Error(errorMessage);
      }
    }
  },

  incrementGuestTranslationCount: async (type) => {
    try {
      const key = `guest_${type}_count`;
      const currentCount = (await AsyncStorageUtils.getItem(key)) || 0;
      const newCount = parseInt(currentCount, 10) + 1;
      await AsyncStorageUtils.setItem(key, newCount.toString());
    } catch (error) {
      const errorMessage = `Failed to increment ${type} count: ${error.message}`;
      set({ error: errorMessage });
      console.error(errorMessage);
    }
  },

  getGuestTranslationCount: () => ({
    total: async () => {
      try {
        const guestTranslations = JSON.parse(await AsyncStorageUtils.getItem('guestTranslations')) || [];
        return guestTranslations.length;
      } catch (err) {
        return 0;
      }
    },
    incrementGuestTranslationCount: async (type) => {
      try {
        const key = `guest_${type}_count`;
        const currentCount = (await AsyncStorageUtils.getItem(key)) || 0;
        const newCount = parseInt(currentCount, 10) + 1;
        await AsyncStorageUtils.setItem(key, newCount.toString());
      } catch (err) {
        console.error('Failed to increment guest translation count:', err);
      }
    },
  }),
}));

export default useTranslationStore;