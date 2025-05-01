import React, { useState, useEffect, useCallback, useMemo, forwardRef, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, Platform } from 'react-native';
import { IconButton, ActivityIndicator } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Memoized TextInput component using forwardRef to pass the ref to the TextInput
const MemoizedTextInput = forwardRef(({ value, onChangeText, style, placeholder, placeholderTextColor, multiline, numberOfLines, keyboardType, autoCapitalize, autoCorrect, textAlign, accessibilityLabel }, ref) => (
  <TextInput
    ref={ref}
    style={style}
    placeholder={placeholder}
    placeholderTextColor={placeholderTextColor}
    value={value}
    onChangeText={onChangeText}
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    autoCorrect={autoCorrect}
    textAlign={textAlign}
    accessibilityLabel={accessibilityLabel}
  />
));

// Separate component for the text/voice input and translation UI
const TextVoiceInput = React.memo(({ t, isDarkMode, session, sourceLang, setSourceLang, targetLang, setTargetLang, onAddTextTranslation, onAddVoiceTranslation, getGuestTranslationCount }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [translationSaved, setTranslationSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundObject, setSoundObject] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [translationData, setTranslationData] = useState(null);
  const textInputRef = React.useRef(null);
  const router = useRouter();
  const setTranslationStore = useTranslationStore.setState; // Access setState directly
  const { signOut } = useSession();
  const API_URL = Constants.API_URL; // Ensure this is defined in Constants

  // Reset toastVisible when error changes, ensuring toast is only shown for specific cases
  useEffect(() => {
    setToastVisible(false); // Reset toast visibility whenever error changes
  }, [error]);

  useEffect(() => {
    const checkAndRequestAudioPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
          if (alreadyGranted) {
            console.log('Audio permission already granted');
            setHasPermission(true);
            return;
          }

          console.log('Requesting audio permission...');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'TranslationHub needs access to your microphone to record audio.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setHasPermission(true);
            console.log('Audio permission status: granted');
          } else {
            setError(t('error') + ': Audio permission not granted. Please enable it in your device settings.');
            setToastVisible(true);
            setHasPermission(false);
            console.log('Audio permission status: denied');
          }
        } else {
          const { status } = await Audio.getPermissionsAsync();
          if (status === 'granted') {
            console.log('Audio permission already granted');
            setHasPermission(true);
            return;
          }

          console.log('Requesting audio permission...');
          const { status: newStatus } = await Audio.requestPermissionsAsync();
          console.log('Audio permission status:', newStatus);
          if (newStatus !== 'granted') {
            setError(t('error') + ': Audio permission not granted. Please enable it in your device settings.');
            setToastVisible(true);
            setHasPermission(false);
          } else {
            setHasPermission(true);
          }
        }
      } catch (err) {
        console.error('Failed to check/request audio permission:', err);
        setError(t('error') + ': Failed to request audio permission: ' + err.message);
        setToastVisible(true);
        setHasPermission(false);
      }
    };
    checkAndRequestAudioPermission();

    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [t]);

  const handleTextChange = useCallback((text) => {
    setInputText(text);
    setError('');
  }, []);

  const handleTranslate = async (textToTranslate = inputText, isVoice = false) => {
    setError('');
    setIsLoading(true);
    setTranslationSaved(false);
    setTranslationData(null);

    if (!textToTranslate.trim()) {
      setError(t('error') + ': Please enter text to translate');
      setIsLoading(false);
      return;
    }
    if (!sourceLang || !targetLang) {
      setError(t('error') + ': Please select source and target languages');
      setIsLoading(false);
      return;
    }

    const totalCount = await getGuestTranslationCount('total');
    if (!session && totalCount >= Constants.GUEST_TRANSLATION_LIMIT) {
      setError(t('guestLimit'));
      setIsLoading(false);
      return;
    }

    try {
      console.log('Translating text:', textToTranslate);
      // Pass an empty string as the token if the user is not logged in (guest mode)
      const token = session?.signed_session_id || '';
      const { translatedText: result, detectedLang } = await TranslationService.translateText(
        textToTranslate,
        targetLang,
        sourceLang,
        token
      );
      console.log('Translation result:', result, 'Detected language:', detectedLang);
      if (!result) {
        throw new Error('Translation failed');
      }
      setTranslatedText(result);

      // Store the translation data for manual saving
      const translation = {
        id: Date.now().toString(),
        fromLang: detectedLang,
        toLang: targetLang,
        original_text: textToTranslate,
        translated_text: result,
        created_at: new Date().toISOString(),
        type: isVoice ? 'voice' : 'text',
      };
      setTranslationData(translation);
    } catch (err) {
      console.error('Translation error:', err);
      const errorMessage = Helpers.handleError(err);
      if (errorMessage.includes('Invalid or expired session') && session) {
        // Session is invalid or expired, log the user out
        await signOut();
        setError(t('error') + ': Your session has expired. Please log in again.');
        setToastVisible(true);
      } else {
        setError(t('error') + ': ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHear = async () => {
    if (translatedText) {
      if (!session || !session.signed_session_id) {
        Alert.alert(
          t('error'),
          t('error') + ': You must be logged in to use text-to-speech. Please log in.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Log In',
              onPress: () => router.push('/(auth)/login'),
            },
          ]
        );
        return;
      }

      setIsSpeaking(true);
      try {
        const audioData = await TranslationService.textToSpeech(
          translatedText,
          targetLang,
          session?.signed_session_id
        );
        const audioUri = `${FileSystem.documentDirectory}speech-${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(audioUri, Buffer.from(audioData).toString('base64'), {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSoundObject(sound);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsSpeaking(false);
            FileSystem.deleteAsync(audioUri);
            setSoundObject(null);
          }
        });
      } catch (err) {
        console.error('Text-to-speech error:', err);
        const errorMessage = Helpers.handleError(err);
        if (errorMessage.includes('Invalid or expired session') && session) {
          // Session is invalid or expired, log the user out
          await signOut();
          setError(t('error') + ': Your session has expired. Please log in again.');
          setToastVisible(true);
        } else {
          setError(t('error') + ': ' + errorMessage);
        }
        setIsSpeaking(false);
      }
    } else {
      Alert.alert(t('error'), t('error') + ': No translated text to hear');
    }
  };

  const handleSave = async () => {
    if (!translatedText || !translationData) {
      Alert.alert(t('error'), t('error') + ': No translation to save');
      return;
    }

    if (isSaving) {
      console.log('Save operation already in progress, ignoring additional clicks');
      return;
    }

    if (!session) {
      const totalCount = await getGuestTranslationCount('total');
      if (totalCount >= Constants.GUEST_TRANSLATION_LIMIT) {
        Alert.alert(t('error'), t('guestLimit'));
        return;
      }
    }

    setIsSaving(true);
    try {
      if (session) {
        // For logged-in users, save to the server
        await onAddTextTranslation(translationData, false, session?.signed_session_id);
      } else {
        // For guest users, save to guestTranslations in the store and AsyncStorage
        setTranslationStore((state) => {
          const updatedGuestTranslations = [...state.guestTranslations, translationData];
          AsyncStorage.setItem('guestTranslations', JSON.stringify(updatedGuestTranslations));
          return { guestTranslations: updatedGuestTranslations };
        });
        await getGuestTranslationCount().incrementGuestTranslationCount('text');
      }

      setTranslationSaved(true);
      Alert.alert(t('success'), t('saveSuccess'));
    } catch (err) {
      console.error('Failed to save translation:', err);
      const errorMessage = Helpers.handleError(err);
      if (errorMessage.includes('Invalid or expired session') && session) {
        // Session is invalid or expired, log the user out
        await signOut();
        setError(t('error') + ': Your session has expired. Please log in again.');
        setToastVisible(true);
      } else {
        setError(t('error') + ': ' + errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startRecording = async () => {
    setError('');
    setTranslationSaved(false);

    if (!session || !session.signed_session_id) {
      console.log('User not logged in, redirecting to login');
      Alert.alert(
        t('error'),
        t('error') + ': You must be logged in to use speech-to-text. Please log in.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Log In',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
      return;
    }

    if (!hasPermission) {
      console.log('Audio permission not granted');
      Alert.alert(
        t('error'),
        t('error') + ': Audio permission not granted. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!sourceLang || !targetLang) {
      console.log('Source or target language not selected');
      setError(t('error') + ': Please select source and target languages');
      setToastVisible(true);
      return;
    }

    if (recording) {
      console.log('Cleaning up existing recording before starting a new one...');
      try {
        await recording.stopAndUnloadAsync();
      } catch (err) {
        console.error('Failed to clean up existing recording:', err);
      }
      setRecording(null);
    }

    try {
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        allowsRecordingAndroid: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      console.log('Audio mode set successfully');

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 2, // MediaRecorder.OutputFormat.MPEG_4
          audioEncoder: 3, // MediaRecorder.AudioEncoder.AAC
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: 'high',
          outputFormat: 'aac',
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };
      

      console.log('Attempting to create recording with options:', recordingOptions);
      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      console.log('Recording created:', newRecording);
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(t('error') + ': Failed to start recording: ' + err.message);
      if (err.message.includes('start failed')) {
        setError(t('error') + ': Recording failed. Please ensure no other apps are using the microphone and try again. If using an emulator, test on a physical device.');
      } else if (err.message.includes('Only one Recording object')) {
        setError(t('error') + ': Recording conflict detected. Please try again.');
      }
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupErr) {
          console.error('Failed to clean up recording after error:', cleanupErr);
        }
      }
      setRecording(null);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.log('No recording to stop');
      setIsRecording(false);
      setIsLoading(false);
      return;
    }
  
    setIsRecording(false);
    setIsLoading(true);
    setError('');
  
    try {
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      console.log('Recording status:', status);
      
      if (!status || status.durationMillis < 1000) {
        setError(t('error') + ': Recording too short. Please record at least 1 second.');
        setToastVisible(true);
        setRecording(null);
        setIsLoading(false);
        return;
      }
      
      const uri = recording.getURI();
      if (!uri || !uri.startsWith('file://')) {
        setError(t('error') + ': Invalid audio path. Please try again.');
        setToastVisible(true);
        setRecording(null);
        setIsLoading(false);
        return;
      }
      
  
      console.log('Preparing FormData for upload...');
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      });
      formData.append('sourceLang', sourceLang);
      
      
      console.log('Uploading file to server...');
      const response = await fetch(`${API_URL}/speech-to-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.signed_session_id}`,
          // אל תגדיר Content-Type ידנית – fetch יוסיף אותו בעצמו עם boundary
        },
        body: formData,
      });
      
      
      const text = await response.text();
      console.log('Raw response:', text);
  
      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonErr) {
        console.error('❌ Failed to parse response as JSON');
        throw new Error('Server returned non-JSON response. Raw response: ' + text);
      }
  
      console.log('Upload response:', result);
  
      if (!response.ok) {
        throw new Error(result.error || 'Failed to transcribe audio');
      }
  
      const transcribedText = result.text;
      console.log('Transcribed text:', transcribedText);
  
      if (!transcribedText) {
        throw new Error('Speech-to-text failed');
      }
  
      setInputText(transcribedText);
      await handleTranslate(transcribedText, true);
    } catch (err) {
      console.error('Failed to stop recording or transcribe:', err);
      const errorMessage = Helpers.handleError(err);
      if (errorMessage.includes('Invalid or expired session') && session) {
        await signOut();
        setError(t('error') + ': Your session has expired. Please log in again.');
        setToastVisible(true);
      } else {
        setError(t('error') + ': ' + errorMessage);
      }
    } finally {
      setRecording(null);
      setIsLoading(false);
    }
  };
  
  
  

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.languageContainer}>
            <View style={styles.languageSection}>
              <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('sourceLang')}</Text>
              <LanguageSearch
                onSelectLanguage={(lang) => {
                  setSourceLang(lang);
                  setError('');
                }}
                selectedLanguage={sourceLang}
              />
            </View>
            <View style={styles.languageSection}>
              <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('targetLang')}</Text>
              <LanguageSearch
                onSelectLanguage={(lang) => {
                  setTargetLang(lang);
                  setError('');
                }}
                selectedLanguage={targetLang}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('original')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD }]}>
              <MemoizedTextInput
                ref={textInputRef}
                value={inputText}
                onChangeText={handleTextChange}
                style={[styles.input, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD, color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}
                placeholder={t('original')}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                multiline
                numberOfLines={4}
                keyboardType="default"
                autoCapitalize="sentences"
                autoCorrect={false}
                textAlign="auto"
                accessibilityLabel="Enter text to translate"
              />
              <IconButton
                icon={isRecording ? 'microphone-off' : 'microphone'}
                size={24}
                onPress={isRecording ? stopRecording : startRecording}
                style={styles.microphoneButton}
                iconColor={isRecording ? Constants.COLORS.DESTRUCTIVE : (isDarkMode ? '#aaa' : Constants.COLORS.PRIMARY)}
                disabled={isLoading}
                accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleTranslate(inputText, false)}
            disabled={isLoading || isRecording}
            style={[styles.translateButton, { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY }]}
          >
            <Text style={styles.translateButtonLabel}>{t('translate')}</Text>
          </TouchableOpacity>

          {error ? <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text> : null}
          {isLoading ? <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} style={styles.loading} /> : null}

          {translatedText ? (
            <View style={[styles.resultContainer, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD }]}>
              <Text style={[styles.resultLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('original')}</Text>
              <Text style={[styles.original, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{inputText}</Text>
              <Text style={[styles.resultLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('translated')}</Text>
              <Text style={[styles.translated, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{translatedText}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={handleHear}
                  disabled={isLoading || isSpeaking}
                  style={[styles.actionButton, { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY }]}
                >
                  <FontAwesome name="volume-up" size={20} color={Constants.COLORS.CARD} style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>{t('hear')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={translationSaved || isLoading || isSaving}
                  style={[styles.actionButton, { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY }]}
                >
                  <FontAwesome name="save" size={20} color={Constants.COLORS.CARD} style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
              {translationSaved ? (
                <Text style={[styles.savedMessage, { color: Constants.COLORS.SUCCESS }]}>{t('saveSuccess')}</Text>
              ) : null}
            </View>
          ) : null}

          <Toast message={error} visible={toastVisible} onHide={() => setToastVisible(false)} />
        </View>
      </ScrollView>
    </View>
  );
});

const TextVoiceTranslationScreen = () => {
  const { t, locale } = useTranslation();
  const { session } = useSession();
  const { recentTextTranslations, recentVoiceTranslations, addTextTranslation, addVoiceTranslation, getGuestTranslationCount } = useTranslationStore();
  const { isDarkMode } = useThemeStore();
  const [sourceLang, setSourceLang] = useState(session?.preferences?.defaultFromLang || '');
  const [targetLang, setTargetLang] = useState(session?.preferences?.defaultToLang || '');
  const router = useRouter();

  const recentTranslations = useMemo(() => {
    return [...recentTextTranslations, ...recentVoiceTranslations].slice(-5);
  }, [recentTextTranslations, recentVoiceTranslations]);

  useEffect(() => {
    console.log("TOKEN:", session?.signed_session_id);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
      <FlatList
        data={recentTranslations}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <TextVoiceInput
            t={t}
            isDarkMode={isDarkMode}
            session={session}
            sourceLang={sourceLang}
            setSourceLang={setSourceLang}
            targetLang={targetLang}
            setTargetLang={setTargetLang}
            onAddTextTranslation={addTextTranslation}
            onAddVoiceTranslation={addVoiceTranslation}
            getGuestTranslationCount={getGuestTranslationCount}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.translationItem, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD }]}>
            <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {t('original')}: {item.original_text}
            </Text>
            <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {t('translated')}: {item.translated_text}
            </Text>
            <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {t('createdAt')}: {Helpers.formatDate(item.created_at, locale)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.scrollContent}
        ListFooterComponent={
          (recentTextTranslations.length > 0 || recentVoiceTranslations.length > 0) && (
            <View style={styles.historyContainer}>
              <Text style={[styles.historyTitle, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>
                {t('recentHistory')}
              </Text>
            </View>
          )
        }
        extraData={isDarkMode}
      />
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
    padding: Constants.SPACING.SECTION,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Constants.SPACING.SECTION,
  },
  languageSection: {
    flex: 1,
    marginHorizontal: Constants.SPACING.SMALL,
  },
  label: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: Constants.SPACING.SECTION,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    padding: Constants.SPACING.LARGE,
    borderRadius: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: Constants.FONT_SIZES.BODY,
  },
  microphoneButton: {
    marginRight: Constants.SPACING.MEDIUM,
    padding: 10,
  },
  translateButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: Constants.SPACING.SECTION,
    alignItems: 'center',
  },
  translateButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  error: {
    color: Constants.COLORS.DESTRUCTIVE,
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.LARGE,
    textAlign: 'center',
  },
  loading: {
    marginVertical: Constants.SPACING.SECTION,
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
  savedMessage: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    color: Constants.COLORS.SUCCESS,
    marginTop: Constants.SPACING.MEDIUM,
    textAlign: 'center',
  },
  historyContainer: {
    marginTop: Constants.SPACING.SECTION,
  },
  historyTitle: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  translationItem: {
    padding: Constants.SPACING.LARGE,
    borderRadius: 12,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  translationText: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.SMALL,
    lineHeight: 20,
  },
});

export default TextVoiceTranslationScreen;