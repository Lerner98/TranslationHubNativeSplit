import * as FileSystem from 'expo-file-system';
import ApiService from './ApiService';

const FileService = {
  // Extract text from a file (PDF/DOCX) – sent as Base64
  extractText: async (uri, signedSessionId = null) => {
    try {
      const base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await ApiService.post(
        '/extract-text',
        { uri: base64Content }, // Send base64 instead of file path
        signedSessionId
      );

      if (response.success && response.data?.text) {
        return response.data.text;
      }
      throw new Error(response.error || 'Failed to extract text from file');
    } catch (err) {
      throw new Error(err.message || 'File extraction failed');
    }
  },

  // Generate downloadable Word document (DOCX)
  generateDocx: async (text, signedSessionId) => {
    try {
      const response = await ApiService.post(
        '/generate-docx',
        { text },
        signedSessionId,
        { responseType: 'arraybuffer' }
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to generate Word document');
    } catch (err) {
      throw new Error(err.message || 'Document generation failed');
    }
  },
};

export default FileService;
