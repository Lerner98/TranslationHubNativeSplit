// app/+html.jsx
import { ScrollView } from 'react-native';
import Constants from '../utils/Constants';
import useThemeStore from '../stores/ThemeStore';
import { useTranslation } from '../utils/TranslationContext';

export default function CustomHTML({ children, ...props }) {
  const { isDarkMode } = useThemeStore();
  const { locale } = useTranslation();

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="TranslationHub - Translate text, voice, files, and more in real-time." />
        <meta name="keywords" content="translation, language, text, voice, file, camera, ASL, multilingual" />
        <meta name="author" content="TranslationHub Team" />
        <meta property="og:title" content="TranslationHub" />
        <meta property="og:description" content="Translate text, voice, files, and more in real-time with TranslationHub." />
        <meta property="og:type" content="website" />
        <title>TranslationHub</title>
        <link rel="icon" href="/favicon.ico" />
        <style>
          {`
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              background-color: ${isDarkMode ? '#222' : Constants.COLORS.BACKGROUND};
              color: ${isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT};
            }
            * {
              box-sizing: border-box;
            }
          `}
        </style>
      </head>
      <body>
        <ScrollView {...props}>{children}</ScrollView>
      </body>
    </html>
  );
}