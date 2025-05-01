// app/stores/LanguageStore.js
import { create } from 'zustand';
import TranslationService from '../services/TranslationService';
import Helpers from '../utils/Helpers';

const useLanguageStore = create((set) => ({
  languages: [],
  isLoading: false,
  error: null,

  fetchLanguages: async () => {
    try {
      set({ isLoading: true, error: null });
      const languages = await TranslationService.searchLanguages(''); // Pass an empty query to fetch all languages
      set({ languages, isLoading: false });
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to fetch languages:', errorMessage);
    }
  },
}));

export default useLanguageStore;