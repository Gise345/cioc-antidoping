/**
 * Root Layout
 * Main navigation structure with Redux-powered auth flow
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LightColors, DarkColors, BrandColors } from '@/src/constants/theme';
import {
  store,
  persistor,
  useAppDispatch,
  useAppSelector,
  initializeAuth,
  selectIsAuthenticated,
  selectIsInitialized,
  selectRequiresPasswordChange,
  selectUserProfile,
} from '@/src/store';

// Prevent splash screen auto-hide, but with safety timeout
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen might already be hidden
});

// Force hide splash screen after 5 seconds no matter what
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {});
}, 5000);

export const unstable_settings = {
  // Use index as the initial route - it handles auth redirects
  initialRouteName: 'index',
};

// Custom navigation themes
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BrandColors.primary,
    background: LightColors.background,
    card: LightColors.card,
    text: LightColors.textPrimary,
    border: LightColors.border,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: BrandColors.primary,
    background: DarkColors.background,
    card: DarkColors.card,
    text: DarkColors.textPrimary,
    border: DarkColors.border,
  },
};

/**
 * Loading screen shown during auth initialization
 */
function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={BrandColors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

/**
 * Auth flow handler - manages navigation based on auth state
 */
function AuthFlowHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const [initStarted, setInitStarted] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectIsInitialized);
  const requiresPasswordChange = useAppSelector(selectRequiresPasswordChange);
  const userProfile = useAppSelector(selectUserProfile);

  // Initialize auth on mount with timeout
  useEffect(() => {
    if (initStarted) return;
    setInitStarted(true);

    console.log('[Auth] Starting initialization...');

    const init = async () => {
      try {
        await dispatch(initializeAuth()).unwrap();
        console.log('[Auth] Initialization complete');
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    // Timeout - if init takes too long, continue anyway
    const timeout = setTimeout(() => {
      console.warn('[Auth] Init timeout - continuing without full init');
      setInitTimeout(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);

    init().finally(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, [dispatch, initStarted]);

  // Handle auth state changes and navigation
  useEffect(() => {
    if (!isInitialized && !initTimeout) return;

    const inAuthGroup = segments[0] === 'auth';
    const onFirstLoginScreen = segments[1] === 'first-login';
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[Auth] Not authenticated, redirecting to login');
      router.replace('/auth/login');
    } else if (isAuthenticated && requiresPasswordChange && !onFirstLoginScreen) {
      console.log('[Auth] Password change required, redirecting to first-login');
      router.replace('/auth/first-login');
    } else if (isAuthenticated && !requiresPasswordChange && inAuthGroup) {
      // Wait for userProfile to be loaded before redirecting
      if (!userProfile) {
        console.log('[Auth] Waiting for user profile to load...');
        return;
      }
      // Redirect based on user role
      if (isAdmin) {
        console.log('[Auth] Admin authenticated, redirecting to admin dashboard');
        router.replace('/admin/dashboard');
      } else {
        console.log('[Auth] Athlete authenticated, redirecting to home');
        router.replace('/(tabs)/home');
      }
    }
  }, [isAuthenticated, isInitialized, initTimeout, requiresPasswordChange, userProfile, segments, router]);

  // Show loading while initializing (but with timeout fallback)
  if (!isInitialized && !initTimeout) {
    return <LoadingScreen message="Initializing..." />;
  }

  return <>{children}</>;
}

// Custom Paper themes
const CustomPaperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BrandColors.primary,
    secondary: BrandColors.secondary,
    background: LightColors.background,
    surface: LightColors.card,
  },
};

const CustomPaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: BrandColors.primary,
    secondary: BrandColors.secondary,
    background: DarkColors.background,
    surface: DarkColors.card,
  },
};

/**
 * Navigation layout - wrapped with theme provider
 */
function NavigationLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const paperTheme = colorScheme === 'dark' ? CustomPaperDarkTheme : CustomPaperLightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <AuthFlowHandler>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
          {/* Index - Entry point */}
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          {/* Auth Stack */}
          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />

          {/* Main App Tabs */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          {/* Modals */}
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
            }}
          />

          {/* Whereabouts Sub-screens (if needed outside tabs) */}
          <Stack.Screen
            name="whereabouts"
            options={{
              headerShown: false,
            }}
          />

          {/* Locations Sub-screens */}
          <Stack.Screen
            name="locations"
            options={{
              headerShown: false,
            }}
          />

          {/* Admin screens */}
          <Stack.Screen
            name="admin"
            options={{
              headerShown: false,
            }}
          />
          </Stack>
        </AuthFlowHandler>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}

/**
 * Root Layout - Redux Provider wrapper
 */
export default function RootLayout() {
  const [persistTimeout, setPersistTimeout] = useState(false);

  // Add timeout for PersistGate - if it takes too long, render anyway
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[RootLayout] PersistGate timeout - rendering without persistence');
      setPersistTimeout(true);
    }, 3000); // 3 second timeout for persist

    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      {persistTimeout ? (
        // Render without waiting for persistence
        <NavigationLayout />
      ) : (
        <PersistGate loading={<LoadingScreen message="Loading app data..." />} persistor={persistor}>
          <NavigationLayout />
        </PersistGate>
      )}
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});
