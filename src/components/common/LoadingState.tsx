/**
 * Loading State Components
 * Skeleton screens and loading indicators
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {
  LightColors,
  DarkColors,
  BrandColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  const shimmerValue = useSharedValue(0);

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton for text lines
interface SkeletonTextProps {
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonText({ lines = 3, style }: SkeletonTextProps) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={14}
          style={index < lines - 1 ? { marginBottom: Spacing.sm } : undefined}
        />
      ))}
    </View>
  );
}

// Skeleton for cards
export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={BorderRadius.full} />
        <View style={skeletonStyles.cardHeaderText}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <SkeletonText lines={2} style={{ marginTop: Spacing.md }} />
    </View>
  );
}

// Skeleton for list items
export function SkeletonListItem() {
  return (
    <View style={skeletonStyles.listItem}>
      <Skeleton width={40} height={40} borderRadius={BorderRadius.md} />
      <View style={skeletonStyles.listItemText}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  );
}

// Skeleton for quarter card
export function SkeletonQuarterCard() {
  return (
    <View style={skeletonStyles.quarterCard}>
      <View style={skeletonStyles.quarterHeader}>
        <Skeleton width={80} height={20} />
        <Skeleton width={60} height={24} borderRadius={BorderRadius.full} />
      </View>
      <Skeleton
        width="100%"
        height={8}
        borderRadius={4}
        style={{ marginVertical: Spacing.md }}
      />
      <View style={skeletonStyles.quarterFooter}>
        <Skeleton width={100} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: LightColors.border,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  listItemText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  quarterCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: LightColors.border,
    marginBottom: Spacing.md,
  },
  quarterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quarterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

// ============================================================================
// LOADING INDICATOR COMPONENTS
// ============================================================================

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
}

export function LoadingIndicator({
  size = 'large',
  color,
  message,
  style,
}: LoadingIndicatorProps) {
  return (
    <View style={[loadingStyles.container, style]}>
      <ActivityIndicator
        size={size}
        color={color ?? BrandColors.primary}
      />
      {message && (
        <Text
          variant="body"
          color="secondary"
          style={loadingStyles.message}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

// Full screen loading overlay
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={loadingStyles.overlay}>
      <View style={loadingStyles.overlayContent}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        {message && (
          <Text
            variant="body"
            color="primary"
            style={loadingStyles.overlayMessage}
          >
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  message: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  overlayMessage: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

// ============================================================================
// LOADING STATE (Full Screen)
// ============================================================================

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  return (
    <View style={[loadingStateStyles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={BrandColors.primary} />
      <Text variant="body" color="secondary" style={loadingStateStyles.message}>
        {message}
      </Text>
    </View>
  );
}

const loadingStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  message: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

// ============================================================================
// REFRESH CONTROL
// ============================================================================

export { RefreshControl } from 'react-native';
