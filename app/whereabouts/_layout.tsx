/**
 * Whereabouts Stack Layout
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LightColors, DarkColors, BrandColors } from '@/src/constants/theme';

export default function WhereaboutsLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: BrandColors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="create-quarter"
        options={{
          title: 'Create Quarter',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="quick-update"
        options={{
          title: 'Quick Update',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="templates"
        options={{
          title: 'Templates',
        }}
      />
      <Stack.Screen
        name="quarter/[id]"
        options={{
          title: 'Quarter Details',
        }}
      />
    </Stack>
  );
}
