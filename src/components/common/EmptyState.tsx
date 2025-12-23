/**
 * Empty State Component
 * Display when no data is available
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LightColors,
  DarkColors,
  Spacing,
  IconSize,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  /** Icon name (Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Container style */
  style?: ViewStyle;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  description,
  actionText,
  onAction,
  style,
  compact = false,
}: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  return (
    <View
      style={[
        styles.container,
        compact && styles.compact,
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.backgroundSecondary },
          compact && styles.iconContainerCompact,
        ]}
      >
        <Ionicons
          name={icon}
          size={compact ? IconSize.lg : IconSize['2xl']}
          color={colors.textTertiary}
        />
      </View>

      <Text
        variant={compact ? 'h5' : 'h4'}
        center
        style={styles.title}
      >
        {title}
      </Text>

      {description && (
        <Text
          variant="body"
          color="secondary"
          center
          style={styles.description}
        >
          {description}
        </Text>
      )}

      {actionText && onAction && (
        <Button
          title={actionText}
          variant="primary"
          size={compact ? 'small' : 'medium'}
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  compact: {
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainerCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    maxWidth: 300,
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.sm,
  },
});

// Pre-configured empty states for common scenarios

export function NoLocationsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="location-outline"
      title="No Locations Yet"
      description="Add your common locations to quickly fill in your whereabouts schedule."
      actionText="Add Location"
      onAction={onAdd}
    />
  );
}

export function NoQuartersEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon="calendar-outline"
      title="No Quarters Filed"
      description="Start filing your whereabouts for the current quarter to stay compliant."
      actionText="Create Quarter"
      onAction={onCreate}
    />
  );
}

export function NoCompetitionsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="trophy-outline"
      title="No Competitions"
      description="Add upcoming competitions to automatically populate your whereabouts schedule."
      actionText="Add Competition"
      onAction={onAdd}
    />
  );
}

export function NoNotificationsEmpty() {
  return (
    <EmptyState
      icon="notifications-outline"
      title="All Caught Up"
      description="You have no new notifications."
      compact
    />
  );
}

export function SearchNoResultsEmpty({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon="search-outline"
      title="No Results"
      description={`No results found for "${query}". Try a different search term.`}
      actionText="Clear Search"
      onAction={onClear}
      compact
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Something Went Wrong"
      description={message ?? 'An error occurred. Please try again.'}
      actionText="Try Again"
      onAction={onRetry}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="You're Offline"
      description="Please check your internet connection and try again."
      actionText="Retry"
      onAction={onRetry}
    />
  );
}
