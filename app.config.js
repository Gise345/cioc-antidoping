/**
 * Expo App Configuration
 * Single source of truth for app configuration
 */

export default {
  expo: {
    name: 'cioc-antidoping',
    slug: 'cioc-antidoping',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'ciocantidoping',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      package: 'com.giselle345.ciocantidoping',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-updates',
    ],
    experiments: {
      typedRoutes: true,
    },
    updates: {
      url: 'https://u.expo.dev/fc1dd794-1ab6-4960-8b86-b21297bdc1fc',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      router: {},
      eas: {
        projectId: 'fc1dd794-1ab6-4960-8b86-b21297bdc1fc',
      },
      // Firebase configuration from EAS secrets
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      // Feature flags
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
      enableCrashlytics: process.env.EXPO_PUBLIC_ENABLE_CRASHLYTICS === 'true',
    },
    owner: 'giselle345',
  },
};
