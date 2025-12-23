/**
 * Locations Stack Layout
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LightColors, DarkColors, BrandColors } from '@/src/constants/theme';

export default function LocationsLayout() {
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
        name="index"
        options={{
          title: 'My Locations',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Location',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Location',
        }}
      />
    </Stack>
  );
}
