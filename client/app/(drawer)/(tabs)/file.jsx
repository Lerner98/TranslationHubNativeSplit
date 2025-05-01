// app/(drawer)/(tabs)/file.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useTranslationStore from '../../../stores/TranslationStore';
import TranslationService from '../../../services/TranslationService';
import FileService from '../../../services/FileService';
import LanguageSearch from '../../../components/LanguageSearch';
import Toast from '../../../components/Toast';
import Constants from '../../../utils/Constants';
import Helpers from '../../../utils/Helpers';
import useThemeStore from '../../../stores/ThemeStore';
import { useRouter } from 'expo-router';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

const FileTranslationScreen = () => {
  const { t } = useTranslation();
  const { session } = useSession();
  const { addTextTranslation } = useTranslationStore();
  const { isDarkMode } = useThemeStore();
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState(session?.preferences?.defaultToLang || '');
  const [translatedFileUri, setTranslatedFileUri] = useState(null);
  const [fileFormat, setFileFormat] = useState('');
  const router = useRouter();

  const pickDocument = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (!session) {
        Alert.alert(
          t('error'),
          t('error') + ': You must be logged in to translate files. Would you like to log in now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log In', onPress: () => router.push('/(auth)/login') },
          ]
        );
        setIsLoading(false);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({ type: Constants.SUPPORTED_FILE_TYPES });
      if (!result.assets || result.assets.length === 0) {
        setError(t('error') + ': No file selected');
        setToastVisible(true);
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      const validationError = Helpers.validateFile({ type: file.mimeType, size: file.size });
      if (validationError) {
        setError(t('error') + ': ' + validationError);
        setToastVisible(true);
        setIsLoading(false);
        return;
      }

      setFileName(file.name);
      const ext = file.name.split('.').pop().toLowerCase();

      const fileContent = await FileService.extractText(file.uri, session.signed_session_id);
      const translated = await TranslationService.translateFile(fileContent, targetLang, session.signed_session_id);

      await addTextTranslation({
        id: Date.now().toString(),
        fromLang: 'auto',
        toLang: targetLang,
        original_text: fileContent,
        translated_text: translated,
        created_at: new Date().toISOString(),
        type: 'file',
      }, false, session.signed_session_id);

      let path = '';
      let mimeType = 'text/plain';

      if (ext === 'docx') {
        const buffer = await FileService.generateDocx(translated, session.signed_session_id);
        path = `${FileSystem.documentDirectory}translated_${Date.now()}.docx`;
        await FileSystem.writeAsStringAsync(path, Buffer.from(buffer).toString('base64'), {
          encoding: FileSystem.EncodingType.Base64,
        });
        setFileFormat('docx');
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (ext === 'pdf') {
        // fallback save as txt for now
        path = `${FileSystem.documentDirectory}translated_${Date.now()}.txt`;
        await FileSystem.writeAsStringAsync(path, translated, { encoding: FileSystem.EncodingType.UTF8 });
        setFileFormat('txt');
      } else {
        path = `${FileSystem.documentDirectory}translated_${Date.now()}.txt`;
        await FileSystem.writeAsStringAsync(path, translated, { encoding: FileSystem.EncodingType.UTF8 });
        setFileFormat('txt');
      }

      setTranslatedFileUri(path);
    } catch (err) {
      console.error('File picker or translation error:', err);
      setError(t('error') + ': ' + Helpers.handleError(err));
      setToastVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTranslatedFile = async () => {
    if (translatedFileUri) {
      try {
        const mime =
          fileFormat === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'text/plain';

        await Sharing.shareAsync(translatedFileUri, {
          mimeType: mime,
          dialogTitle: 'Download Translated File',
        });
      } catch (err) {
        console.error('Download error:', err);
        setError(t('error') + ': Failed to download file');
        setToastVisible(true);
      }
    } else {
      setError(t('error') + ': No translated file available');
      setToastVisible(true);
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('targetLang')}</Text>
      <LanguageSearch onSelectLanguage={setTargetLang} selectedLanguage={targetLang} />
      <Pressable onPress={pickDocument} disabled={isLoading || !targetLang} style={({ pressed }) => [styles.button, { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={styles.buttonLabel}>{t('pickDocument')}</Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text> : null}
      {isLoading && <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} style={styles.loading} />}
      {fileName ? (
        <View style={[styles.fileContainer, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD }]}>
          <Text style={[styles.fileLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>Selected File:</Text>
          <Text style={[styles.fileName, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{fileName}</Text>
        </View>
      ) : null}
      {translatedFileUri && (
        <Pressable onPress={downloadTranslatedFile} style={({ pressed }) => [styles.downloadButton, { backgroundColor: isDarkMode ? '#444' : Constants.COLORS.SUCCESS, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={styles.downloadButtonLabel}>Download Translated File</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
      <FlatList data={[1]} keyExtractor={(item) => item.toString()} renderItem={() => renderContent()} contentContainerStyle={styles.scrollContent} />
      <Toast message={error} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: Constants.SPACING.SECTION },
  content: { flex: 1, justifyContent: 'center' },
  label: { fontSize: Constants.FONT_SIZES.BODY, fontWeight: 'bold', marginBottom: Constants.SPACING.MEDIUM, letterSpacing: 0.5 },
  error: { fontSize: Constants.FONT_SIZES.SECONDARY, marginTop: Constants.SPACING.MEDIUM, marginBottom: Constants.SPACING.SECTION, textAlign: 'center' },
  loading: { marginVertical: Constants.SPACING.SECTION },
  fileContainer: { marginTop: Constants.SPACING.SECTION, padding: Constants.SPACING.LARGE, borderRadius: 12, shadowColor: Constants.COLORS.SHADOW, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  fileLabel: { fontSize: Constants.FONT_SIZES.BODY, fontWeight: 'bold', marginBottom: Constants.SPACING.MEDIUM, letterSpacing: 0.5 },
  fileName: { fontSize: Constants.FONT_SIZES.BODY, lineHeight: 24 },
  button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginTop: Constants.SPACING.MEDIUM, alignItems: 'center' },
  buttonLabel: { fontSize: Constants.FONT_SIZES.BODY, fontWeight: 'bold', color: Constants.COLORS.CARD },
  downloadButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginTop: Constants.SPACING.MEDIUM, alignItems: 'center' },
  downloadButtonLabel: { fontSize: Constants.FONT_SIZES.BODY, fontWeight: 'bold', color: Constants.COLORS.CARD },
});

export default FileTranslationScreen;
