/**
 * Auth Stack Layout
 * Navigation layout for authentication screens
 *
 * Note: Self-registration has been removed. Athletes are created by admins.
 * Only login and forgot-password screens are available.
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LightColors, DarkColors } from '@/src/constants/theme';

export default function AuthLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Forgot Password',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="first-login"
        options={{
          title: 'Change Password',
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back - password change is mandatory
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
