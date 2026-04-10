import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.log('Skipping push registration: Not a physical device');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save the token to your Supabase profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('Error saving push token to Supabase:', error.message);
    } else {
      console.log('✅ Push token successfully synced to Supabase');
    }
    
    return token;
  } catch (e) {
    console.error('Failed to get push token:', e);
  }
}

// CRITICAL: This fixes the "Missing default export" warning
export default registerForPushNotificationsAsync;