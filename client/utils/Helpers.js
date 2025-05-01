// utils/Helpers.js
import Constants from './Constants';
import * as FileSystem from 'expo-file-system';

// Removed import of useTranslation since it can't be used in a utility file

const Helpers = {
  // Format a date to a readable string
  formatDate: (dateString, locale) => {
    const date = new Date(dateString);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Handle API errors and return a user-friendly message
  handleError: (error) => {
    if (error.response) {
      return error.response.data?.error || 'An error occurred while processing your request.';
    } else if (error.request) {
      return 'Network error: Please check your internet connection and try again.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  },

  // Convert a file to Base64
  fileToBase64: async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error('Failed to convert file to Base64: ' + error.message);
    }
  },

  // Validate file size and type
  validateFile: (file) => {
    if (!Constants.SUPPORTED_FILE_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload a .txt, .docx, or .pdf file.';
    }
    if (file.size > Constants.MAX_FILE_SIZE) {
      return 'File size exceeds the limit of 25 MB.';
    }
    return null;
  },
};

export default Helpers;