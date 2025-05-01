import ApiService from '../services/ApiService';

const TranslationService = {
  // Translate text
  translateText: async (text, targetLang, sourceLang = 'auto', signedSessionId) => {
    const response = await ApiService.post(
      '/translate',
      { text, targetLang, sourceLang },
      signedSessionId
    );
    if (response.success) {
      return response.data; // Expected: { translatedText, detectedLang }
    }
    throw new Error(response.error || 'Failed to translate text');
  },

  // Detect the language of the given text
  detectLanguage: async (text, signedSessionId) => {
    const response = await ApiService.post(
      '/translate',
      { text, targetLang: 'en', sourceLang: 'auto' },
      signedSessionId
    );
    if (response.success) {
      return { detectedLang: response.data.detectedLang };
    }
    throw new Error(response.error || 'Failed to detect language');
  },

  // Transliterate text from sourceLang to targetLang script
  transliterateText: async (text, sourceLang, targetLang, signedSessionId) => {
    const response = await ApiService.post(
      '/transliterate',
      { text, sourceLang, targetLang },
      signedSessionId
    );
    if (response.success) {
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
    if (response.success) {
      return response.data.translatedText;
    }
    throw new Error(response.error || 'Failed to translate file');
  },

  // ✅ Speech-to-Text using audio file upload
  speechToText: async (audioUri, sourceLang, signedSessionId) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    });
    formData.append('sourceLang', sourceLang);

    const response = await ApiService.uploadForm('/speech-to-text', formData, signedSessionId);
    if (response.success) {
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
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to generate speech');
  },

  // Recognize text from image
  recognizeTextFromImage: async (imageBase64, signedSessionId) => {
    const response = await ApiService.post(
      '/recognize-text',
      { imageBase64 },
      signedSessionId
    );
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to recognize text from image');
  },

  // Recognize ASL gesture
  recognizeASL: async (imageBase64, signedSessionId) => {
    const response = await ApiService.post(
      '/recognize-asl',
      { imageBase64 },
      signedSessionId
    );
    if (response.success) {
      return response.data.text;
    }
    throw new Error(response.error || 'Failed to recognize ASL gesture');
  },

  // Search languages (no token required)
  searchLanguages: async (query = '*') => {
    const url = `/languages?query=${encodeURIComponent(query)}`;
    const response = await ApiService.get(url, null);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to search languages');
  },
};

export default TranslationService;
