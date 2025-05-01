import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable, FlatList, Image, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useTranslationStore from '../../../stores/TranslationStore';
import TranslationService from '../../../services/TranslationService';
import LanguageSearch from '../../../components/LanguageSearch';
import Toast from '../../../components/Toast';
import Constants from '../../../utils/Constants';
import Helpers from '../../../utils/Helpers';
import useThemeStore from '../../../stores/ThemeStore';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const CameraTranslationScreen = () => {
  const { t, locale } = useTranslation();
  const { session } = useSession();
  const { addTextTranslation, getGuestTranslationCount } = useTranslationStore();
  const { isDarkMode } = useThemeStore();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [sourceLang, setSourceLang] = useState(session?.preferences?.defaultFromLang || '');
  const [targetLang, setTargetLang] = useState(session?.preferences?.defaultToLang || '');
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');
  const [languageError, setLanguageError] = useState(''); // For language mismatch notice
  const [toastVisible, setToastVisible] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translationSaved, setTranslationSaved] = useState(false);
  const [translationData, setTranslationData] = useState(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  // Request camera and gallery permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      // Camera permission
      if (!permission) return;
      if (!permission.granted) {
        const { status } = await requestPermission();
        if (status === 'granted') {
          setHasCameraPermission(true);
        } else {
          setHasCameraPermission(false);
          setError(t('error') + ': Camera permission not granted. Please enable it in your device settings.');
          setToastVisible(true);
        }
      } else {
        setHasCameraPermission(true);
      }

      // Gallery permission
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryPermission.status === 'granted') {
        setHasGalleryPermission(true);
      } else {
        setHasGalleryPermission(false);
        setError(t('error') + ': Gallery permission not granted. Please enable it in your device settings.');
        setToastVisible(true);
      }
    };
    checkPermissions();
  }, [permission, requestPermission, t]);

  const startCamera = () => {
    setError('');
    setLanguageError('');
    if (hasCameraPermission !== true) {
      setError(t('error') + ': Camera permission not granted');
      setToastVisible(true);
      return;
    }
    if (!sourceLang || !targetLang) {
      setError(t('error') + ': Source and target languages are required');
      setToastVisible(true);
      return;
    }

    setIsTranslating(true);
  };

  const goBackToMain = () => {
    setIsTranslating(false);
    setError('');
    setLanguageError('');
  };

  const capturePhoto = async () => {
    try {
      const camera = cameraRef.current;
      if (camera) {
        console.log('Camera ref is available, attempting to capture photo');
        const photo = await camera.takePictureAsync({ quality: 0.5 });
        console.log('Photo captured successfully:', photo.uri);
        setCapturedPhotoUri(photo.uri);
        setIsTranslating(false);
        processCapturedPhoto(photo.uri);
      } else {
        console.error('Camera ref is null');
        setError(t('error') + ': Camera not available. Please try again.');
        setToastVisible(true);
        setIsTranslating(false);
      }
    } catch (err) {
      console.error('Photo capture error:', err);
      setError(t('error') + ': Failed to capture photo. Please try again.');
      setToastVisible(true);
      setIsTranslating(false);
    }
  };

  const selectPhotoFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.IMAGE],
        quality: 0.5,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        console.log('Photo selected from gallery:', photoUri);
        setCapturedPhotoUri(photoUri);
        setIsTranslating(false);
        processCapturedPhoto(photoUri);
      }
    } catch (err) {
      console.error('Gallery selection error:', err);
      setError(t('error') + ': Failed to select photo from gallery. Please try again.');
      setToastVisible(true);
      setIsTranslating(false);
    }
  };

  const processCapturedPhoto = async (uri) => {
    setIsProcessing(true);
    setError('');
    setLanguageError('');
    try {
      const imageBase64 = await Helpers.fileToBase64(uri);

      // Extract text from the image using OpenAI's vision API
      const extractedTextResponse = await TranslationService.recognizeTextFromImage(imageBase64, session?.signed_session_id);
      if (!extractedTextResponse || !extractedTextResponse.text) {
        setOriginalText('');
        setTranslatedText('');
        setError(t('error') + ': No text detected in the image');
        setToastVisible(true);
        return;
      }

      const extractedText = extractedTextResponse.text;

      // Detect the language of the extracted text
      const detectResponse = await TranslationService.detectLanguage(extractedText, session?.signed_session_id);
      const detectedLang = detectResponse.detectedLang;

      let translatedText;
      if (sourceLang !== 'auto' && detectedLang !== sourceLang) {
        // Language mismatch: display the same text in both sections with a notice
        setOriginalText(extractedText);
        setTranslatedText(extractedText);
        setLanguageError(`The text appears to be in ${detectedLang}, but the source language was set to ${sourceLang}. Please select the correct source language.`);
      } else if (detectedLang === targetLang) {
        // If the detected language is the same as the target language, show the same text
        setOriginalText(extractedText);
        setTranslatedText(extractedText);
      } else {
        // Proceed with translation
        const translationResponse = await TranslationService.translateText(
          extractedText,
          targetLang,
          detectedLang,
          session?.signed_session_id
        );
        translatedText = translationResponse.translatedText;
        setOriginalText(extractedText);
        setTranslatedText(translatedText);
      }

      setTranslationData({
        id: Date.now().toString(),
        fromLang: detectedLang,
        toLang: targetLang,
        original_text: extractedText,
        translated_text: translatedText || extractedText,
        created_at: new Date().toISOString(),
        type: 'camera',
        imageUri: uri,
      });
    } catch (err) {
      console.error('Camera translation error:', err);
      let errorMessage = t('error') + ': Failed to process the image. Please try again.';
      if (err.message.includes('Network error')) {
        errorMessage = t('error') + ': Network error. Please check your connection and try again.';
      } else if (err.message.includes('No text detected')) {
        errorMessage = t('error') + ': No text detected in the image.';
      }
      setError(errorMessage);
      setToastVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!translationData) {
      Alert.alert(t('error'), t('error') + ': No translation to save');
      return;
    }

    if (!session) {
      const totalCount = await getGuestTranslationCount('total');
      if (totalCount >= Constants.GUEST_TRANSLATION_LIMIT) {
        Alert.alert(t('error'), t('guestLimit'));
        return;
      }
    }

    try {
      await addTextTranslation(translationData, !session, session?.signed_session_id);
      setTranslationSaved(true);
      Alert.alert(t('success'), t('saveSuccess'));
    } catch (err) {
      console.error('Failed to save translation:', err);
      setError(t('error') + ': Failed to save translation. Please try again.');
      setToastVisible(true);
    }
  };

  const handleDeleteTranslation = () => {
    setOriginalText('');
    setTranslatedText('');
    setTranslationSaved(false);
    setTranslationData(null);
    setCapturedPhotoUri(null);
    setError('');
    setLanguageError('');
  };

  // Handle tap-to-focus on the camera screen
  const handleCameraTap = async (event) => {
    if (cameraRef.current) {
      try {
        const { locationX, locationY } = event.nativeEvent;
        const focusPoint = {
          x: locationX / event.nativeEvent.layoutMeasurement.width,
          y: locationY / event.nativeEvent.layoutMeasurement.height,
        };
        await cameraRef.current.focus(focusPoint);
        console.log('Camera focused at:', focusPoint);
      } catch (err) {
        console.error('Error focusing camera:', err);
      }
    }
  };

  // Render the camera screen with capture, gallery, and back buttons
  const renderCameraScreen = () => (
    <View style={styles.cameraOverlay}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing="back"
        onPress={handleCameraTap} // Add tap-to-focus handler
      />
      {/* Language selection overlay */}
      <View style={styles.languageOverlay}>
        <View style={styles.languageContainer}>
          <View style={styles.languageSection}>
            <Text style={[styles.label, { color: Constants.COLORS.CARD }]}>{t('sourceLang')}</Text>
            <View style={styles.languageInputWrapper}>
              <LanguageSearch
                onSelectLanguage={(lang) => {
                  setSourceLang(lang);
                  setError('');
                  setLanguageError('');
                }}
                selectedLanguage={sourceLang}
              />
            </View>
          </View>
          <View style={styles.languageSection}>
            <Text style={[styles.label, { color: Constants.COLORS.CARD }]}>{t('targetLang')}</Text>
            <View style={styles.languageInputWrapper}>
              <LanguageSearch
                onSelectLanguage={(lang) => {
                  setTargetLang(lang);
                  setError('');
                  setLanguageError('');
                }}
                selectedLanguage={targetLang}
              />
            </View>
          </View>
        </View>
      </View>
      {/* Camera controls with back button */}
      <View style={styles.cameraControls}>
        <TouchableOpacity
          onPress={selectPhotoFromGallery}
          style={styles.galleryButton}
          accessibilityLabel="Select photo from gallery"
        >
          <FontAwesome name="image" size={24} color={Constants.COLORS.CARD} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={capturePhoto}
          style={styles.captureButton}
          accessibilityLabel="Capture photo and translate"
        >
          <FontAwesome name="camera" size={24} color={Constants.COLORS.CARD} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goBackToMain}
          style={styles.backButton}
          accessibilityLabel="Go back to main camera page"
        >
          <FontAwesome name="arrow-right" size={24} color={Constants.COLORS.CARD} />
        </TouchableOpacity>
      </View>
      {error ? <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text> : null}
    </View>
  );

  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.languageContainer}>
        <View style={styles.languageSection}>
          <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('sourceLang')}</Text>
          <View style={styles.languageInputWrapper}>
            <LanguageSearch
              onSelectLanguage={(lang) => {
                setSourceLang(lang);
                setError('');
                setLanguageError('');
              }}
              selectedLanguage={sourceLang}
            />
          </View>
        </View>
        <View style={styles.languageSection}>
          <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('targetLang')}</Text>
          <View style={styles.languageInputWrapper}>
            <LanguageSearch
              onSelectLanguage={(lang) => {
                setTargetLang(lang);
                setError('');
                setLanguageError('');
              }}
              selectedLanguage={targetLang}
            />
          </View>
        </View>
      </View>
      <View style={styles.imageContainer}>
        {capturedPhotoUri ? (
          <Image
            source={{ uri: capturedPhotoUri }}
            style={styles.capturedImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: isDarkMode ? '#444' : '#d3d3d3' }]}>
            <Text style={[styles.placeholderText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>Camera Preview Will Appear Here</Text>
            <Text style={[styles.noteText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              Note: Camera translation uses OpenAI's vision for text recognition.
            </Text>
          </View>
        )}
      </View>
      {isProcessing ? (
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} style={styles.loading} />
      ) : (
        <Pressable
          onPress={startCamera}
          style={({ pressed }) => [
            styles.cameraButton,
            { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY, opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Open camera preview"
        >
          <Text style={styles.cameraButtonLabel}>{t('camera')}</Text>
        </Pressable>
      )}
      {error ? <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text> : null}
      {(originalText || translatedText) && !isTranslating && !isProcessing ? (
        <View style={[styles.resultContainer, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD }]}>
          {languageError ? (
            <Text style={[styles.languageError, { color: Constants.COLORS.DESTRUCTIVE }]}>{languageError}</Text>
          ) : null}
          <Text style={[styles.resultLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('original')}</Text>
          <Text style={[styles.original, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{originalText}</Text>
          <Text style={[styles.resultLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('translated')}</Text>
          <Text style={[styles.translated, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{translatedText}</Text>
          <View style={styles.actionButtons}>
            <Pressable
              onPress={handleSaveTranslation}
              disabled={translationSaved || isProcessing}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: isDarkMode ? '#4CAF50' : '#4CAF50', opacity: pressed ? 0.7 : 1 },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Save translation"
            >
              <FontAwesome name="save" size={20} color={Constants.COLORS.CARD} style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>{t('save')}</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteTranslation}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: isDarkMode ? '#F44336' : '#F44336', opacity: pressed ? 0.7 : 1 },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Delete translation"
            >
              <FontAwesome name="trash" size={20} color={Constants.COLORS.CARD} style={styles.actionIcon} />
              <Text style={styles.deleteButtonLabel}>{t('deleteTranslation')}</Text>
            </Pressable>
          </View>
          {translationSaved ? (
            <Text style={[styles.savedMessage, { color: Constants.COLORS.SUCCESS }]}>{t('saveSuccess')}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (hasCameraPermission === null || hasGalleryPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} />
          <Text style={[styles.loadingText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
        <View style={styles.content}>
          <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{t('error')}: Camera permission not granted</Text>
          <Pressable
            onPress={async () => {
              const { status } = await requestPermission();
              setHasCameraPermission(status === 'granted');
            }}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY, opacity: pressed ? 0.7 : 1 },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Retry camera permission"
          >
            <Text style={styles.retryButtonLabel}>Retry Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
      {isTranslating ? renderCameraScreen() : (
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          data={[{ key: 'content' }]} // Single item to render the content
          renderItem={() => renderContent()}
          ListFooterComponent={<Toast message={error} visible={toastVisible} onHide={() => setToastVisible(false)} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Constants.SPACING.SECTION * 2,
  },
  content: {
    alignItems: 'center',
    padding: Constants.SPACING.SECTION,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Constants.SPACING.SECTION,
  },
  languageSection: {
    flex: 1,
    marginHorizontal: Constants.SPACING.SMALL,
    alignItems: 'center',
  },
  languageInputWrapper: {
    width: 150, // Fixed width for the LanguageSearch component
  },
  label: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 400, // Increased height for larger image box
    marginBottom: Constants.SPACING.SECTION,
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
    fontWeight: '600',
  },
  noteText: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    textAlign: 'center',
    marginTop: Constants.SPACING.MEDIUM,
  },
  cameraOverlay: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  languageOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: Constants.SPACING.SECTION,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    backgroundColor: Constants.COLORS.PRIMARY,
    borderRadius: 50,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryButton: {
    backgroundColor: Constants.COLORS.PRIMARY,
    borderRadius: 50,
    padding: 15,
  },
  backButton: {
    backgroundColor: Constants.COLORS.PRIMARY,
    borderRadius: 50,
    padding: 15,
  },
  cameraButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: Constants.SPACING.MEDIUM,
  },
  cameraButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  error: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginTop: Constants.SPACING.MEDIUM,
    marginBottom: Constants.SPACING.SECTION,
    textAlign: 'center',
  },
  languageError: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.MEDIUM,
    textAlign: 'center',
  },
  loading: {
    marginVertical: Constants.SPACING.MEDIUM,
  },
  loadingText: {
    marginTop: Constants.SPACING.MEDIUM,
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: Constants.SPACING.SECTION,
    padding: Constants.SPACING.SECTION,
    borderRadius: 12,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  resultLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  original: {
    fontSize: Constants.FONT_SIZES.BODY,
    marginBottom: Constants.SPACING.LARGE,
    lineHeight: 24,
  },
  translated: {
    fontSize: Constants.FONT_SIZES.BODY,
    marginBottom: Constants.SPACING.LARGE,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Constants.SPACING.MEDIUM,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionIcon: {
    marginRight: Constants.SPACING.SMALL,
  },
  actionButtonText: {
    color: Constants.COLORS.CARD,
    fontSize: Constants.FONT_SIZES.SECONDARY,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonLabel: {
    color: Constants.COLORS.CARD,
    fontSize: Constants.FONT_SIZES.SECONDARY,
  },
  savedMessage: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    color: Constants.COLORS.SUCCESS,
    marginTop: Constants.SPACING.MEDIUM,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: Constants.SPACING.MEDIUM,
  },
  retryButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
});

export default CameraTranslationScreen;