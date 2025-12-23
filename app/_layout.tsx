/**
 * Root Layout
 * Main navigation structure with Redux-powered auth flow
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
} from '@/src/store';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Ensure auth screens are used as the initial route when not authenticated
  initialRouteName: 'auth',
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
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={BrandColors.primary} />
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

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectIsInitialized);
  const requiresPasswordChange = useAppSelector(selectRequiresPasswordChange);

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(initializeAuth()).unwrap();
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
      } finally {
        // Hide splash screen after auth check
        await SplashScreen.hideAsync();
      }
    };

    init();
  }, [dispatch]);

  // Handle auth state changes and navigation
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const onFirstLoginScreen = segments[1] === 'first-login';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth screens
      console.log('[Auth] Not authenticated, redirecting to login');
      router.replace('/auth/login');
    } else if (isAuthenticated && requiresPasswordChange && !onFirstLoginScreen) {
      // User requires password change but not on first-login screen
      console.log('[Auth] Password change required, redirecting to first-login');
      router.replace('/auth/first-login');
    } else if (isAuthenticated && !requiresPasswordChange && inAuthGroup) {
      // Redirect to home if authenticated, no password change needed, and still in auth screens
      console.log('[Auth] Authenticated, redirecting to home');
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isInitialized, requiresPasswordChange, segments, router]);

  // Show loading while initializing
  if (!isInitialized) {
    return <LoadingScreen />;
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
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <NavigationLayout />
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightColors.background,
  },
});
