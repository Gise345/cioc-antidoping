/**
 * Map Preview Component
 * Placeholder for displaying location on a map
 * TODO: Implement Google Maps/MapView integration
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common';
import { AddressDocument } from '@/src/types/firestore';
import {
  BrandColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MapPreviewProps {
  address?: AddressDocument;
  latitude?: number;
  longitude?: number;
  height?: number;
  onPress?: () => void;
  showDirectionsButton?: boolean;
  onDirectionsPress?: () => void;
}

/**
 * Map Preview - Placeholder Implementation
 *
 * This is a placeholder component. Full Google Maps integration will be added later.
 * For now, it shows a placeholder with location info.
 *
 * Future implementation will include:
 * - react-native-maps integration
 * - Interactive map with marker
 * - Zoom controls
 * - Directions integration
 * - Static map image fallback
 */
export function MapPreview({
  address,
  latitude,
  longitude,
  height = 150,
  onPress,
  showDirectionsButton = false,
  onDirectionsPress,
}: MapPreviewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  const hasCoordinates = latitude !== undefined && longitude !== undefined;

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handleDirections = () => {
    if (onDirectionsPress) {
      onDirectionsPress();
    } else if (hasCoordinates) {
      // TODO: Open in Maps app
      console.log('Open directions to:', latitude, longitude);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.surfaceVariant,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Placeholder map background */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.gridLines}>
          {[...Array(6)].map((_, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.gridLineH,
                { top: `${(i + 1) * 15}%`, backgroundColor: colors.border },
              ]}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLineV,
                { left: `${(i + 1) * 11}%`, backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>

        {/* Center marker */}
        <View style={styles.markerContainer}>
          <View style={[styles.marker, { backgroundColor: BrandColors.primary }]}>
            <Ionicons name="location" size={24} color="#FFFFFF" />
          </View>
          <View style={[styles.markerShadow, { backgroundColor: BrandColors.primary }]} />
        </View>
      </View>

      {/* Address info overlay */}
      {address && (
        <View style={[styles.infoOverlay, { backgroundColor: colors.overlay }]}>
          <View style={styles.infoContent}>
            <Ionicons name="location" size={16} color="#FFFFFF" />
            <Text variant="caption" customColor="#FFFFFF" numberOfLines={1} style={styles.addressText}>
              {address.street}, {address.city}
            </Text>
          </View>
        </View>
      )}

      {/* Coordinates badge */}
      {hasCoordinates && (
        <View style={[styles.coordsBadge, { backgroundColor: colors.surface }]}>
          <Text variant="caption" color="tertiary">
            {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Directions button */}
      {showDirectionsButton && (
        <Pressable
          onPress={handleDirections}
          style={[styles.directionsButton, { backgroundColor: BrandColors.primary }]}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Text variant="caption" customColor="#FFFFFF">
            Directions
          </Text>
        </Pressable>
      )}

      {/* Placeholder message */}
      {!hasCoordinates && !address && (
        <View style={styles.placeholderMessage}>
          <Ionicons name="map-outline" size={32} color={colors.textTertiary} />
          <Text variant="caption" color="tertiary" center>
            Map preview unavailable
          </Text>
          <Text variant="caption" color="tertiary" center>
            Add address to see location
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.5,
  },
  markerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    transform: [{ translateX: -20 }, { translateY: -40 }],
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerShadow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: -6,
    opacity: 0.3,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addressText: {
    flex: 1,
  },
  coordsBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    opacity: 0.9,
  },
  directionsButton: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  placeholderMessage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});

export default MapPreview;
