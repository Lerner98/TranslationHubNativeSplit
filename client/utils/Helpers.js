import Constants from './Constants';
import * as FileSystem from 'expo-file-system';

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
    if (error?.response) {
      return error.response.data?.error || 'An error occurred while processing your request.';
    }
    if (error?.request) {
      return 'Network error: Please check your internet connection and try again.';
    }
    return error?.message || 'An unexpected error occurred.';
  },

  // Convert a file to Base64
  fileToBase64: async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error('Failed to convert file to Base64: ' + (error?.message || 'Unknown error'));
    }
  },

  // Validate file size and type
  validateFile: (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Unsupported file type. Please upload a .txt, .docx, or .pdf file.';
    }

    if (file.size > Constants.MAX_FILE_SIZE) {
      return 'File size exceeds the limit of 25 MB.';
    }

    return null;
  },
};

export default Helpers;
