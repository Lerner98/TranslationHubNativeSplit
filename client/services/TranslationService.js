import ApiService from '../services/ApiService';

const TranslationService = {
  // Translate text
  translateText: async (text, targetLang, sourceLang = 'auto', signedSessionId) => {
    const response = await ApiService.post(
      '/translate',
      { text, targetLang, sourceLang },
      signedSessionId
    );
    if (response.success && response.data) {
      return response.data; // { translatedText, detectedLang }
    }
    throw new Error(response.error || 'Failed to translate text');
  },

  // Detect language
  detectLanguage: async (text, signedSessionId) => {
    const response = await ApiService.post(
      '/translate',
      { text, targetLang: 'en', sourceLang: 'auto' },
      signedSessionId
    );
    if (response.success && response.data?.detectedLang) {
      return { detectedLang: response.data.detectedLang };
    }
    throw new Error(response.error || 'Failed to detect language');
  },

  // Transliterate
  transliterateText: async (text, sourceLang, targetLang, signedSessionId) => {
    const response = await ApiService.post(
      '/transliterate',
      { text, sourceLang, targetLang },
      signedSessionId
    );
    if (response.success && response.translatedText) {
      return response.translatedText;
    }
    throw new Error(response.error || 'Failed to transliterate text');
  },

  // Translate file content
  translateFile: async (fileContent, targetLang, signedSessionId) => {
    const response = await ApiService.post(
      '/translate',
      { text: fileContent, targetLang, sourceLang: 'auto' },
      signedSessionId
    );
    if (response.success && response.data?.translatedText) {
      return response.data.translatedText;
    }
    throw new Error(response.error || 'Failed to translate file');
  },

  // Speech-to-Text
  speechToText: async (audioUri, sourceLang, signedSessionId) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    });
    formData.append('sourceLang', sourceLang);

    const response = await ApiService.uploadForm('/speech-to-text', formData, signedSessionId);
    if (response.success && response.data) {
      return response.data.text || '';
    }
    throw new Error(response.error || 'Failed to transcribe speech');
  },

  // Text-to-Speech
  textToSpeech: async (text, language, signedSessionId) => {
    const response = await ApiService.post(
      '/text-to-speech',
      { text, language },
      signedSessionId,
      { responseType: 'arraybuffer' }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to generate speech');
  },

  // Image → Text
  recognizeTextFromImage: async (imageBase64, signedSessionId) => {
    const response = await ApiService.post(
      '/recognize-text',
      { imageBase64 },
      signedSessionId
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to recognize text from image');
  },

  // ASL Recognition
  recognizeASL: async (imageBase64, signedSessionId) => {
    const response = await ApiService.post(
      '/recognize-asl',
      { imageBase64 },
      signedSessionId
    );
    if (response.success && response.data?.text) {
      return response.data.text;
    }
    throw new Error(response.error || 'Failed to recognize ASL gesture');
  },

  // Search languages (public)
  searchLanguages: async (query = '*') => {
    const url = `/languages?query=${encodeURIComponent(query)}`;
    const response = await ApiService.get(url, null);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to search languages');
  },
};

export default TranslationService;
