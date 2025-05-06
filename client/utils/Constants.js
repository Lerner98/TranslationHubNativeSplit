const Constants = {
  // 🌐 API Base URL (Update this per environment)
  API_URL: 'http://192.168.1.26:3000',

  // ⚙️ API Configuration
  API_TIMEOUT: 10000, // in milliseconds
  TOAST_DURATION: 3000, // in milliseconds

  // 📁 Upload Settings
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25 MB
  SUPPORTED_FILE_TYPES: [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],

  // 👤 Guest Access Limits
  GUEST_ASL_FILE_TRANSLATION_LIMIT: 10,

  // 🎨 Color Palette
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

  // 🔠 Typography
  FONT_SIZES: {
    TITLE: 28,
    SUBTITLE: 20,
    BODY: 16,
    SECONDARY: 14,
    SMALL: 12,
  },

  // 📏 Spacing
  SPACING: {
    SMALL: 5,
    MEDIUM: 10,
    LARGE: 15,
    SECTION: 20,
  },
};

export default Constants;
