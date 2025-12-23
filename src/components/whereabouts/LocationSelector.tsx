/**
 * LocationSelector Component
 * Chip-based selector for choosing between home, training, and gym locations
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common';
import { SlotLocationType } from '@/src/types';
import {
  BrandColors,
  SemanticColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';

// Location type colors for visual distinction
const LOCATION_COLORS = {
  home: '#2196F3', // Blue
  training: '#4CAF50', // Green
  gym: '#FF9800', // Orange
};

interface LocationOption {
  type: SlotLocationType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  available: boolean;
  color: string;
  tooltip?: string;
}

interface LocationSelectorProps {
  value: SlotLocationType;
  onChange: (type: SlotLocationType) => void;
  homeAvailable: boolean;
  trainingAvailable: boolean;
  gymAvailable: boolean;
  gymSetUp?: boolean; // Whether gym location has been set up
  disabled?: boolean;
  compact?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  homeAvailable,
  trainingAvailable,
  gymAvailable,
  gymSetUp = true,
  disabled = false,
  compact = false,
}: LocationSelectorProps) {
  const options: LocationOption[] = [
    {
      type: 'home',
      label: 'Home',
      icon: 'home-outline',
      available: homeAvailable,
      color: LOCATION_COLORS.home,
    },
    {
      type: 'training',
      label: 'Training',
      icon: 'fitness-outline',
      available: trainingAvailable,
      color: LOCATION_COLORS.training,
    },
    {
      type: 'gym',
      label: 'Gym',
      icon: 'barbell-outline',
      available: gymAvailable,
      color: LOCATION_COLORS.gym,
      tooltip: !gymSetUp ? 'Set up gym location first' : undefined,
    },
  ];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {options.map((option) => {
        const isSelected = value === option.type;
        const isDisabled = disabled || !option.available;

        return (
          <Pressable
            key={option.type}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              { borderColor: option.color },
              isSelected && { backgroundColor: option.color, borderColor: option.color },
              isDisabled && styles.chipDisabled,
            ]}
            onPress={() => {
              if (!isDisabled) {
                onChange(option.type);
              }
            }}
            disabled={isDisabled}
          >
            <Ionicons
              name={option.icon}
              size={compact ? 16 : 18}
              color={
                isDisabled
                  ? '#9CA3AF'
                  : isSelected
                  ? '#FFFFFF'
                  : option.color
              }
            />
            <Text
              variant={compact ? 'caption' : 'bodySmall'}
              customColor={
                isDisabled
                  ? '#9CA3AF'
                  : isSelected
                  ? '#FFFFFF'
                  : option.color
              }
              style={styles.label}
            >
              {option.label}
            </Text>
            {!option.available && (
              <View style={styles.unavailableBadge}>
                <Ionicons name="close-circle" size={12} color={SemanticColors.error} />
              </View>
            )}
            {option.tooltip && isDisabled && (
              <View style={styles.tooltipContainer}>
                <Text variant="caption" customColor="#9CA3AF" style={styles.tooltipText}>
                  {option.tooltip}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  containerCompact: {
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  chipCompact: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  chipSelected: {
    // Colors are set inline now
  },
  chipDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  label: {
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  unavailableBadge: {
    marginLeft: Spacing.xs,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
  },
  tooltipText: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default LocationSelector;
