// app/+native-intent.js
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function NativeIntentHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = ({ url }) => {
      try {
        const { path, queryParams } = Linking.parse(url);
        if (path) {
          switch (path) {
            case 'login':
              router.push('/(auth)/login');
              break;
            case 'register':
              router.push('/(auth)/register');
              break;
            case 'translate':
              if (queryParams?.text) {
                router.push({
                  pathname: '/(drawer)/(tabs)/text-voice',
                  params: { text: queryParams.text },
                });
              } else {
                router.push('/(drawer)/(tabs)/text-voice');
              }
              break;
            default:
              router.push('/(drawer)/(tabs)');
              break;
          }
        }
      } catch (err) {
        console.error('Error handling deep link:', err);
        router.push('/(drawer)/(tabs)');
      }
    };

    // Handle initial URL when the app is opened
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleUrl({ url });
      })
      .catch((err) => {
        console.error('Error getting initial URL:', err);
      });

    // Add event listener for incoming URLs
    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}