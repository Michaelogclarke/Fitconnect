import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function registerPushToken(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge:  true,
      }),
    });
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name:              'FitConnect',
        importance:        Notifications.AndroidImportance.MAX,
        vibrationPattern:  [0, 250, 250, 250],
        lightColor:        '#81ecff',
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', user.id);
  } catch {}
}

export async function sendPushNotification(
  recipientId: string,
  title:       string,
  body:        string,
): Promise<void> {
  try {
    await supabase.functions.invoke('send-push', {
      body: { recipientId, title, body },
    });
  } catch {}
}

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_declined'
  | 'trainer_invite'
  | 'trainer_request'
  | 'trainer_accepted';

export async function insertNotification(
  userId: string,
  type:   NotificationType,
  title:  string,
  body:   string,
  data:   Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabase.from('notifications').insert({ user_id: userId, type, title, body, data });
  } catch {}
}
