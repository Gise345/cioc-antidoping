/**
 * Main Tab Layout
 * Bottom tab navigation for the main app
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, LightColors, DarkColors, Spacing, Shadows } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAdmin } from '@/src/hooks/useAdmin';

/**
 * Custom tab button with haptic feedback
 */
function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (Platform.OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAdmin();

  // Calculate tab bar height including safe area
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: Spacing.xs,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.sm,
          ...Shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="whereabouts"
        options={{
          title: 'Whereabouts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Admin Tab - Only visible for admin/super_admin users */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? '/admin/dashboard' : null, // Hide tab for non-admin users
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'shield' : 'shield-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
