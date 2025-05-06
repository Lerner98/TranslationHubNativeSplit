import { create } from 'zustand';
import AsyncStorageUtils from '../utils/AsyncStorage';
import ApiService from '../services/ApiService';
import Constants from '../utils/Constants';
import Helpers from '../utils/Helpers';

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

      const [textRes, voiceRes] = await Promise.all([
        ApiService.get('/translations/text', user.signed_session_id),
        ApiService.get('/translations/voice', user.signed_session_id),
      ]);

      if (!textRes.success || !voiceRes.success) {
        throw new Error(textRes.error || voiceRes.error);
      }

      set({
        savedTextTranslations: textRes.data,
        savedVoiceTranslations: voiceRes.data,
        recentTextTranslations: textRes.data.slice(-5),
        recentVoiceTranslations: voiceRes.data.slice(-5),
        isLoading: false,
      });
    } catch (err) {
      const msg = Helpers.handleError(err);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  clearTranslations: async (user) => {
    try {
      set({ isLoading: true, error: null });
      const response = await ApiService.delete('/translations', user.signed_session_id);
      if (!response.success) throw new Error(response.error);

      set({
        savedTextTranslations: [],
        savedVoiceTranslations: [],
        recentTextTranslations: [],
        recentVoiceTranslations: [],
        isLoading: false,
      });
    } catch (err) {
      const msg = Helpers.handleError(err);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  clearGuestTranslations: async () => {
    try {
      set({ isLoading: true, error: null });
      await AsyncStorageUtils.removeItem('guestTranslations');
      set({ guestTranslations: [], isLoading: false });
    } catch (err) {
      const msg = Helpers.handleError(err);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  addTextTranslation: async (translation, isGuest, sessionId) => {
    if (isGuest) {
      const updated = [...get().guestTranslations, { ...translation, type: 'text' }];
      set({ guestTranslations: updated });
      await AsyncStorageUtils.setItem('guestTranslations', updated);
    } else {
      try {
        set({ isLoading: true, error: null });
        const res = await ApiService.post('/translations/text', translation, sessionId);
        if (!res.success) throw new Error(res.error);

        const fetch = await ApiService.get('/translations/text', sessionId);
        if (!fetch.success) throw new Error(fetch.error);

        set({
          recentTextTranslations: fetch.data.slice(-5),
          savedTextTranslations: fetch.data,
          isLoading: false,
        });
      } catch (err) {
        const msg = Helpers.handleError(err);
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    }
  },

  addVoiceTranslation: async (translation, isGuest, sessionId) => {
    if (isGuest) {
      const updated = [...get().guestTranslations, { ...translation, type: 'voice' }];
      set({ guestTranslations: updated });
      await AsyncStorageUtils.setItem('guestTranslations', updated);
    } else {
      try {
        set({ isLoading: true, error: null });
        const res = await ApiService.post('/translations/voice', translation, sessionId);
        if (!res.success) throw new Error(res.error);

        const fetch = await ApiService.get('/translations/voice', sessionId);
        if (!fetch.success) throw new Error(fetch.error);

        set({
          recentVoiceTranslations: fetch.data.slice(-5),
          savedVoiceTranslations: fetch.data,
          isLoading: false,
        });
      } catch (err) {
        const msg = Helpers.handleError(err);
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    }
  },

  incrementGuestTranslationCount: async (type) => {
    try {
      const key = `guest_${type}_count`;
      const current = parseInt(await AsyncStorageUtils.getItem(key) || '0', 10);
      await AsyncStorageUtils.setItem(key, (current + 1).toString());
    } catch (err) {
      const msg = `Failed to increment ${type} count: ${err.message}`;
      set({ error: msg });
      console.error(msg);
    }
  },

  getGuestTranslationCount: async (type) => {
    if (type === 'total') {
      try {
        const guest = await AsyncStorageUtils.getItem('guestTranslations');
        return guest?.length || 0;
      } catch {
        return 0;
      }
    }

    try {
      const count = await AsyncStorageUtils.getItem(`guest_${type}_count`);
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  },
}));

export default useTranslationStore;