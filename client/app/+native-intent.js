import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorageUtils from '../utils/AsyncStorage';
import { useSession } from '../utils/ctx';

export default function NativeIntentHandler() {
  const router = useRouter();
  const { clearSession } = useSession(); // this must exist in your ctx

  useEffect(() => {
    const resetSession = async () => {
      await AsyncStorageUtils.removeItem('signed_session_id');
      await AsyncStorageUtils.removeItem('user');
      clearSession?.(); // optional safety
    };

    const deepLinkToTab = async (path, queryParams) => {
      if (path === 'login' || path === 'register') {
        await resetSession(); // force guest mode
      }

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
    };

    const handleUrl = ({ url }) => {
      try {
        const { path, queryParams } = Linking.parse(url);
        if (path) {
          deepLinkToTab(path, queryParams);
        }
      } catch (err) {
        console.error('Error handling deep link:', err);
        router.push('/(drawer)/(tabs)');
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) handleUrl({ url });
      })
      .catch((err) => {
        console.error('Error getting initial URL:', err);
      });

    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [router]);

  return null;
}
