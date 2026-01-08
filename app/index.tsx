/**
 * App Index
 * Redirects to the appropriate screen based on auth state
 */

import { Redirect } from 'expo-router';
import { useAppSelector, selectIsAuthenticated, selectIsInitialized } from '@/src/store';
import { View, ActivityIndicator } from 'react-native';
import { BrandColors } from '@/src/constants/theme';

export default function Index() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectIsInitialized);

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/login" />;
}
