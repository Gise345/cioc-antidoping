/**
 * Location Type Icon Component
 * Display appropriate icon based on location type
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationType } from '@/src/types/firestore';
import { LocationColors, Spacing } from '@/src/constants/theme';

interface LocationTypeIconProps {
  type: LocationType;
  size?: 'small' | 'medium' | 'large';
  showBackground?: boolean;
  style?: ViewStyle;
}

const iconMap: Record<LocationType, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  training: 'fitness',
  gym: 'barbell',
  competition: 'trophy',
  work: 'briefcase',
  school: 'school',
  hotel: 'bed',
  other: 'location',
};

const sizeMap = {
  small: { icon: 16, container: 32 },
  medium: { icon: 24, container: 48 },
  large: { icon: 32, container: 64 },
};

export function LocationTypeIcon({
  type,
  size = 'medium',
  showBackground = true,
  style,
}: LocationTypeIconProps) {
  const color = LocationColors[type] || LocationColors.other;
  const { icon: iconSize, container: containerSize } = sizeMap[size];

  if (!showBackground) {
    return (
      <Ionicons
        name={iconMap[type]}
        size={iconSize}
        color={color}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: `${color}15`,
        },
        style,
      ]}
    >
      <Ionicons
        name={iconMap[type]}
        size={iconSize}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LocationTypeIcon;
