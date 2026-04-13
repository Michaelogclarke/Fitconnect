import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function SpotifyAuthScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate back to the profile tab once the session is completed
    router.replace('/(tabs)/profile');
  }, []);

  return null;
}
