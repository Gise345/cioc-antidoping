/**
 * Location Card Component
 * Display location with icon, address, and actions
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common';
import { PressableCard } from '@/src/components/common/Card';
import { LocationTypeIcon } from './LocationTypeIcon';
import { LocationWithId } from '@/src/store/slices/locationsSlice';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
  LocationColors,
} from '@/src/constants/theme';
import { LOCATION_TYPE_LABELS, formatAddress, getShortAddress } from '@/src/constants/caymanLocations';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LocationCardProps {
  location: LocationWithId;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  showActions?: boolean;
  showUsageCount?: boolean;
  compact?: boolean;
}

export function LocationCard({
  location,
  onPress,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = true,
  showUsageCount = true,
  compact = false,
}: LocationCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  const handlePress = () => {
    if (onPress) onPress();
    else if (onEdit) onEdit();
  };

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.compactContainer,
          {
            backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <LocationTypeIcon type={location.type} size="small" />
        <View style={styles.compactContent}>
          <Text variant="body" numberOfLines={1}>
            {location.name}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={1}>
            {getShortAddress(location.address)}
          </Text>
        </View>
        {location.is_default && (
          <Ionicons name="star" size={16} color={BrandColors.secondary} />
        )}
      </Pressable>
    );
  }

  return (
    <PressableCard
      style={styles.card}
      onPress={handlePress}
      padding="medium"
    >
      <View style={styles.content}>
        <LocationTypeIcon type={location.type} size="medium" />

        <View style={styles.info}>
          <View style={styles.header}>
            <Text variant="h6" numberOfLines={1} style={styles.name}>
              {location.name}
            </Text>
            {location.is_default && (
              <View style={styles.defaultBadge}>
                <Ionicons name="star" size={14} color={BrandColors.secondary} />
                <Text variant="caption" customColor={BrandColors.secondary}>
                  Default
                </Text>
              </View>
            )}
          </View>

          <Text variant="caption" color="secondary" numberOfLines={2}>
            {formatAddress(location.address)}
          </Text>

          <View style={styles.meta}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${LocationColors[location.type]}15` },
              ]}
            >
              <Text
                variant="caption"
                customColor={LocationColors[location.type]}
              >
                {LOCATION_TYPE_LABELS[location.type]}
              </Text>
            </View>

            {showUsageCount && location.usage_count > 0 && (
              <Text variant="caption" color="tertiary">
                Used {location.usage_count} time{location.usage_count !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {location.additional_info && (
            <View style={styles.additionalInfo}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
              <Text variant="caption" color="tertiary" numberOfLines={1} style={styles.additionalText}>
                {location.additional_info}
              </Text>
            </View>
          )}
        </View>

        {showActions && (
          <View style={styles.actions}>
            {onSetDefault && !location.is_default && (
              <Pressable
                onPress={onSetDefault}
                hitSlop={8}
                style={styles.actionButton}
              >
                <Ionicons name="star-outline" size={20} color={colors.textTertiary} />
              </Pressable>
            )}
            {onEdit && (
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                style={styles.actionButton}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.textTertiary} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color={SemanticColors.error} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    flex: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  additionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  additionalText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
});

export default LocationCard;
