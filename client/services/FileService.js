import * as FileSystem from 'expo-file-system';
import ApiService from './ApiService';

const FileService = {
  // ✅ Extract text from a file (PDF/DOCX) – send as Base64
  extractText: async (uri, signedSessionId = null) => {
    // המרה ל־Base64 לפני שליחה לשרת
    const base64Content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await ApiService.post(
      '/extract-text',
      { uri: base64Content }, // 👈 שליחת base64 במקום נתיב מקומי
      signedSessionId
    );
    if (response.success) {
      return response.data.text;
    }
    throw new Error(response.error || 'Failed to extract text from file');
  },

  generateDocx: async (text, signedSessionId) => {
    const response = await ApiService.post(
      '/generate-docx',
      { text },
      signedSessionId,
      { responseType: 'arraybuffer' }
    );
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to generate Word document');
  },
};

export default FileService;
