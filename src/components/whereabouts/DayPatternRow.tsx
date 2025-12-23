/**
 * DayPatternRow Component
 * A single row in the weekly pattern builder for one day
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common';
import { LocationSelector } from './LocationSelector';
import { TimeRangePicker } from './TimeRangePicker';
import {
  DayOfWeek,
  DaySlotPattern,
  SlotLocationType,
  LocationWithSchedule,
} from '@/src/types';
import {
  BrandColors,
  SemanticColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';

interface DayPatternRowProps {
  day: DayOfWeek;
  pattern: DaySlotPattern;
  onChange: (pattern: DaySlotPattern) => void;
  homeLocation: LocationWithSchedule | null;
  trainingLocation: LocationWithSchedule | null;
  gymLocation: LocationWithSchedule | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onCopy?: () => void;
  compact?: boolean;
  disabled?: boolean;
  validationError?: string;
}

// Location type colors for visual distinction
const LOCATION_COLORS = {
  home: '#2196F3', // Blue
  training: '#4CAF50', // Green
  gym: '#FF9800', // Orange
};

// Day labels
const DAY_LABELS: Record<DayOfWeek, { full: string; short: string }> = {
  monday: { full: 'Monday', short: 'Mon' },
  tuesday: { full: 'Tuesday', short: 'Tue' },
  wednesday: { full: 'Wednesday', short: 'Wed' },
  thursday: { full: 'Thursday', short: 'Thu' },
  friday: { full: 'Friday', short: 'Fri' },
  saturday: { full: 'Saturday', short: 'Sat' },
  sunday: { full: 'Sunday', short: 'Sun' },
};

/**
 * Get location hours for a specific day
 */
const getLocationHours = (
  location: LocationWithSchedule | null,
  day: DayOfWeek
): { start: string; end: string } | null => {
  if (!location) return null;

  const startKey = `${day}_start` as keyof LocationWithSchedule;
  const endKey = `${day}_end` as keyof LocationWithSchedule;

  const start = location[startKey] as string;
  const end = location[endKey] as string;

  if (!start || !end) return null;

  return { start, end };
};

/**
 * Check if a location is available on a given day
 */
const isLocationAvailable = (
  location: LocationWithSchedule | null,
  day: DayOfWeek
): boolean => {
  const hours = getLocationHours(location, day);
  return hours !== null && hours.start !== '' && hours.end !== '';
};

export function DayPatternRow({
  day,
  pattern,
  onChange,
  homeLocation,
  trainingLocation,
  gymLocation,
  isExpanded = true,
  onToggleExpand,
  onCopy,
  compact = false,
  disabled = false,
  validationError,
}: DayPatternRowProps) {
  // Get color for current location type
  const locationColor = LOCATION_COLORS[pattern.location_type];
  // Determine which locations are available for this day
  const homeAvailable = isLocationAvailable(homeLocation, day);
  const trainingAvailable = isLocationAvailable(trainingLocation, day);
  const gymAvailable = isLocationAvailable(gymLocation, day);

  // Get hours for the selected location
  const selectedLocationHours = useMemo(() => {
    switch (pattern.location_type) {
      case 'home':
        return getLocationHours(homeLocation, day);
      case 'training':
        return getLocationHours(trainingLocation, day);
      case 'gym':
        return getLocationHours(gymLocation, day);
      default:
        return null;
    }
  }, [pattern.location_type, day, homeLocation, trainingLocation, gymLocation]);

  // Check if current selection is valid
  const isSelectedLocationAvailable = useMemo(() => {
    switch (pattern.location_type) {
      case 'home':
        return homeAvailable;
      case 'training':
        return trainingAvailable;
      case 'gym':
        return gymAvailable;
      default:
        return false;
    }
  }, [pattern.location_type, homeAvailable, trainingAvailable, gymAvailable]);

  // Handle location type change
  const handleLocationChange = (locationType: SlotLocationType) => {
    // Get new location hours
    let newHours: { start: string; end: string } | null = null;
    switch (locationType) {
      case 'home':
        newHours = getLocationHours(homeLocation, day);
        break;
      case 'training':
        newHours = getLocationHours(trainingLocation, day);
        break;
      case 'gym':
        newHours = getLocationHours(gymLocation, day);
        break;
    }

    // Default to 06:00-07:00 if location has valid hours
    let defaultStart = '06:00';
    let defaultEnd = '07:00';

    if (newHours) {
      const minHour = parseInt(newHours.start.split(':')[0], 10);
      const maxHour = parseInt(newHours.end.split(':')[0], 10);

      // Adjust default times if outside location hours
      if (minHour > 6 || maxHour < 7) {
        defaultStart = newHours.start;
        defaultEnd = `${(minHour + 1).toString().padStart(2, '0')}:00`;
      }
    }

    onChange({
      ...pattern,
      location_type: locationType,
      time_start: defaultStart,
      time_end: defaultEnd,
    });
  };

  // Handle time change
  const handleTimeChange = (start: string, end: string) => {
    onChange({
      ...pattern,
      time_start: start,
      time_end: end,
    });
  };

  // Format time for compact display
  const formatTimeCompact = () => {
    if (!pattern.time_start || !pattern.time_end) return 'Not set';
    const startHour = parseInt(pattern.time_start.split(':')[0], 10);
    const suffix = startHour < 12 ? 'AM' : 'PM';
    const displayHour = startHour <= 12 ? startHour : startHour - 12;
    return `${displayHour}-${displayHour + 1}${suffix}`;
  };

  // Compact view (collapsed)
  if (compact || !isExpanded) {
    return (
      <Pressable
        style={[
          styles.compactContainer,
          !isSelectedLocationAvailable && styles.containerWarning,
          validationError && styles.containerError,
        ]}
        onPress={onToggleExpand}
        disabled={disabled}
      >
        {/* Color indicator for location type */}
        <View style={[styles.locationIndicator, { backgroundColor: locationColor }]} />

        <View style={styles.compactDaySection}>
          <Text variant="label" bold>
            {DAY_LABELS[day].short}
          </Text>
        </View>

        <View style={styles.compactContentSection}>
          <View style={[styles.compactLocationBadge, { backgroundColor: `${locationColor}20` }]}>
            <Ionicons
              name={
                pattern.location_type === 'home'
                  ? 'home-outline'
                  : pattern.location_type === 'training'
                  ? 'fitness-outline'
                  : 'barbell-outline'
              }
              size={14}
              color={locationColor}
            />
            <Text variant="caption" customColor={locationColor}>
              {pattern.location_type.charAt(0).toUpperCase() + pattern.location_type.slice(1)}
            </Text>
          </View>

          <Text variant="bodySmall" color="secondary">
            {formatTimeCompact()}
          </Text>
        </View>

        {/* Status Icons */}
        {validationError ? (
          <Ionicons name="alert-circle" size={18} color={SemanticColors.error} />
        ) : !isSelectedLocationAvailable ? (
          <Ionicons name="warning" size={18} color={SemanticColors.warning} />
        ) : (
          <Ionicons name="checkmark-circle" size={18} color={SemanticColors.success} />
        )}

        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </Pressable>
    );
  }

  // Expanded view
  return (
    <View
      style={[
        styles.container,
        !isSelectedLocationAvailable && styles.containerWarning,
        validationError && styles.containerError,
      ]}
    >
      {/* Color indicator for location type */}
      <View style={[styles.expandedLocationIndicator, { backgroundColor: locationColor }]} />

      {/* Day Header */}
      <Pressable style={styles.dayHeader} onPress={onToggleExpand} disabled={disabled}>
        <View style={styles.dayLabelContainer}>
          <Text variant="h6">{DAY_LABELS[day].full}</Text>
          {validationError ? (
            <View style={styles.errorBadge}>
              <Ionicons name="alert-circle" size={14} color={SemanticColors.error} />
              <Text variant="caption" customColor={SemanticColors.error}>
                {validationError}
              </Text>
            </View>
          ) : !isSelectedLocationAvailable ? (
            <View style={styles.warningBadge}>
              <Ionicons name="warning" size={14} color={SemanticColors.warning} />
              <Text variant="caption" customColor={SemanticColors.warning}>
                Location unavailable
              </Text>
            </View>
          ) : (
            <View style={styles.validBadge}>
              <Ionicons name="checkmark-circle" size={14} color={SemanticColors.success} />
              <Text variant="caption" customColor={SemanticColors.success}>
                Valid
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {/* Copy Button */}
          {onCopy && (
            <Pressable
              style={styles.copyButton}
              onPress={onCopy}
              hitSlop={8}
              disabled={disabled}
            >
              <Ionicons name="copy-outline" size={18} color={BrandColors.primary} />
            </Pressable>
          )}

          {onToggleExpand && (
            <Ionicons name="chevron-up" size={20} color="#6B7280" />
          )}
        </View>
      </Pressable>

      {/* Location Selection */}
      <View style={styles.section}>
        <Text variant="label" color="secondary" style={styles.sectionLabel}>
          Location
        </Text>
        <LocationSelector
          value={pattern.location_type}
          onChange={handleLocationChange}
          homeAvailable={homeAvailable}
          trainingAvailable={trainingAvailable}
          gymAvailable={gymAvailable}
          disabled={disabled}
        />
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <TimeRangePicker
          label="60-Minute Slot"
          startTime={pattern.time_start}
          endTime={pattern.time_end}
          onChange={handleTimeChange}
          minTime={selectedLocationHours?.start || '05:00'}
          maxTime={selectedLocationHours?.end || '23:00'}
          disabled={disabled}
          error={
            validationError ||
            (!isSelectedLocationAvailable
              ? `${pattern.location_type.charAt(0).toUpperCase() + pattern.location_type.slice(1)} is not available on ${DAY_LABELS[day].full}`
              : undefined)
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  containerWarning: {
    borderColor: SemanticColors.warning,
    backgroundColor: SemanticColors.warningBackground,
  },
  containerError: {
    borderColor: SemanticColors.error,
    backgroundColor: SemanticColors.errorBackground,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  locationIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  expandedLocationIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  compactDaySection: {
    width: 40,
    marginLeft: Spacing.sm,
  },
  compactContentSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  compactLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  dayLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  copyButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: SemanticColors.warningBackground,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: SemanticColors.errorBackground,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: SemanticColors.successBackground,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  section: {
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
});

export default DayPatternRow;
