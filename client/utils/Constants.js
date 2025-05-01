// utils/Constants.js
const Constants = {
  // API Base URL
  API_URL: 'http://192.168.1.26:3000', // Update to the correct server address

  // Guest Translation Limit for ASL and File translations only
  GUEST_ASL_FILE_TRANSLATION_LIMIT: 10,

  // File Upload Limits
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25 MB in bytes

  // Supported File Types for Upload
  SUPPORTED_FILE_TYPES: [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],

  // API Timeout (in milliseconds)
  API_TIMEOUT: 10000,

  // Toast Duration (in milliseconds)
  TOAST_DURATION: 3000,

  // Color Palette
  COLORS: {
    PRIMARY: '#007AFF',
    DESTRUCTIVE: '#FF3B30',
    SUCCESS: '#28a745',
    BACKGROUND: '#f5f5f5',
    CARD: '#fff',
    TEXT: '#333',
    SECONDARY_TEXT: '#666',
    SHADOW: '#000',
  },

  // Typography
  FONT_SIZES: {
    TITLE: 28,
    SUBTITLE: 20,
    BODY: 16,
    SECONDARY: 14,
    SMALL: 12,
  },

  // Spacing
  SPACING: {
    SMALL: 5,
    MEDIUM: 10,
    LARGE: 15,
    SECTION: 20,
  },
};

export default Constants;