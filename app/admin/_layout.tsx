/**
 * Admin Stack Layout
 * Navigation layout for admin screens
 * Protected route - only accessible by admin users
 */

import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LightColors, DarkColors } from '@/src/constants/theme';
import { useAdmin } from '@/src/hooks/useAdmin';
import { LoadingState } from '@/src/components/common';

export default function AdminLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const router = useRouter();
  const { isAdmin } = useAdmin();

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      console.log('[Admin] Access denied - redirecting to home');
      router.replace('/(tabs)/home');
    }
  }, [isAdmin, router]);

  // Show loading while checking permissions
  if (!isAdmin) {
    return <LoadingState message="Checking permissions..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.textPrimary,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Admin Dashboard',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="athletes"
        options={{
          title: 'Manage Athletes',
        }}
      />
      <Stack.Screen
        name="create-athlete"
        options={{
          title: 'Create Athlete',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="athlete/[id]"
        options={{
          title: 'Athlete Details',
        }}
      />
      <Stack.Screen
        name="athlete-dashboard/[id]"
        options={{
          title: 'Athlete Dashboard View',
        }}
      />
      <Stack.Screen
        name="manage-admins"
        options={{
          title: 'Manage Admins',
        }}
      />
    </Stack>
  );
}
