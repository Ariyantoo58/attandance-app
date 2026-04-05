import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log('Project ID not found in app config');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })).data;
    console.log('Expo Push Token (APK):', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};

export const saveTokenToBackend = async (token) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken || !token) return;

    await axios.patch(`${API_BASE_URL}/notifications/push-token`, 
      { token }, 
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    console.log('Push token saved to backend successfully');
  } catch (error) {
    console.error('Error saving push token to backend:', error.response?.data || error.message);
  }
};

export const setupNotificationListeners = () => {
  // Listener for when a notification is received while the app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification Received:', notification);
  });

  // Listener for when a user interacts with a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification Response:', response);
  });

  return { notificationListener, responseListener };
};
