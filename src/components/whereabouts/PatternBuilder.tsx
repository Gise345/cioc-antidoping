/**
 * PatternBuilder Component
 * The core UI for building weekly whereabouts patterns
 *
 * Features:
 * - Visual weekly pattern builder with 7 day rows
 * - Location selector (Home/Training/Gym) with availability checking
 * - Time slot picker for 60-minute WADA compliance slots
 * - Quick copy actions (all days, weekdays, weekends)
 * - Per-day copy menu with specific day selection
 * - Real-time validation with visual feedback
 * - Compact mode for smaller displays
 * - Location legend with color coding
 * - Pattern completion statistics
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Card, Spacer, Divider } from '@/src/components/common';
import { DayPatternRow } from './DayPatternRow';
import { LocationSelector } from './LocationSelector';
import { TimeRangePicker } from './TimeRangePicker';
import {
  WeeklyPattern,
  DaySlotPattern,
  DayOfWeek,
  LocationWithSchedule,
  SlotLocationType,
  PatternCopyTarget,
} from '@/src/types';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PatternBuilderProps {
  value: WeeklyPattern;
  onChange: (pattern: WeeklyPattern) => void;
  homeLocation: LocationWithSchedule | null;
  trainingLocation: LocationWithSchedule | null;
  gymLocation: LocationWithSchedule | null;
  disabled?: boolean;
  showQuickActions?: boolean;
  compact?: boolean;
  onSaveAsTemplate?: (name: string) => void;
  showSaveTemplate?: boolean;
  validationErrors?: Record<string, string>;
}

interface DayValidation {
  valid: boolean;
  error?: string;
  warning?: string;
}

interface PatternStats {
  completedDays: number;
  homeCount: number;
  trainingCount: number;
  gymCount: number;
  validDays: number;
  invalidDays: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Location type colors for visual distinction
const LOCATION_COLORS = {
  home: '#2196F3',     // Blue
  training: '#4CAF50', // Green
  gym: '#FF9800',      // Orange
};

const LOCATION_ICONS: Record<SlotLocationType, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  training: 'fitness-outline',
  gym: 'barbell-outline',
};

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const WEEKENDS: DayOfWeek[] = ['saturday', 'sunday'];

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
 * Default pattern for a new day
 */
const DEFAULT_DAY_PATTERN: DaySlotPattern = {
  location_type: 'home',
  time_start: '06:00',
  time_end: '07:00',
};

/**
 * Empty pattern (for clear operations)
 */
const EMPTY_DAY_PATTERN: DaySlotPattern = {
  location_type: 'home',
  time_start: '',
  time_end: '',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a default weekly pattern
 */
export const createDefaultPattern = (): WeeklyPattern => ({
  monday: { ...DEFAULT_DAY_PATTERN },
  tuesday: { ...DEFAULT_DAY_PATTERN },
  wednesday: { ...DEFAULT_DAY_PATTERN },
  thursday: { ...DEFAULT_DAY_PATTERN },
  friday: { ...DEFAULT_DAY_PATTERN },
  saturday: { ...DEFAULT_DAY_PATTERN },
  sunday: { ...DEFAULT_DAY_PATTERN },
});

/**
 * Convert time string (HH:mm) to minutes from midnight
 */
const timeToMinutes = (time: string): number => {
  if (!time) return -1;
  const parts = time.split(':');
  if (parts.length !== 2) return -1;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
};

/**
 * Add minutes to a time string
 */
const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const totalMinutes = timeToMinutes(time);
  if (totalMinutes === -1) return '';
  const newTotal = totalMinutes + minutesToAdd;
  const hours = Math.floor(newTotal / 60);
  const minutes = newTotal % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Calculate minutes difference between two times
 */
const calculateMinutesDiff = (start: string, end: string): number => {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === -1 || endMinutes === -1) return -1;
  return endMinutes - startMinutes;
};

/**
 * Check if time is within a range
 */
const isTimeInRange = (time: string, rangeStart: string, rangeEnd: string): boolean => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(rangeStart);
  const endMinutes = timeToMinutes(rangeEnd);

  if (timeMinutes === -1 || startMinutes === -1 || endMinutes === -1) return false;

  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

/**
 * Validate a single day's pattern
 */
const validateDayPattern = (
  day: DayOfWeek,
  pattern: DaySlotPattern,
  location: LocationWithSchedule | null
): DayValidation => {
  const dayLabel = DAY_LABELS[day].full;

  // No location type selected
  if (!pattern.location_type) {
    return { valid: false, error: 'Select a location' };
  }

  // No time set
  if (!pattern.time_start || !pattern.time_end) {
    return { valid: false, error: 'Enter time' };
  }

  // Check 60-minute duration
  const duration = calculateMinutesDiff(pattern.time_start, pattern.time_end);
  if (duration === -1) {
    return { valid: false, error: 'Invalid time format' };
  }
  if (duration !== 60) {
    return { valid: false, error: `Slot must be exactly 60 minutes (currently ${duration} minutes)` };
  }

  // Check within 05:00-23:00
  const startMinutes = timeToMinutes(pattern.time_start);
  const endMinutes = timeToMinutes(pattern.time_end);
  if (startMinutes < 300) { // 05:00
    return { valid: false, error: 'Time must be after 05:00' };
  }
  if (endMinutes > 1440) { // 24:00
    return { valid: false, error: 'Time must be before midnight' };
  }

  // Check location is set up
  if (!location) {
    return {
      valid: false,
      error: `${pattern.location_type.charAt(0).toUpperCase() + pattern.location_type.slice(1)} location not set up`
    };
  }

  // Check within location hours for this day
  const dayLower = day.toLowerCase() as DayOfWeek;
  const locationStartKey = `${dayLower}_start` as keyof LocationWithSchedule;
  const locationEndKey = `${dayLower}_end` as keyof LocationWithSchedule;
  const locationStart = location[locationStartKey] as string | undefined;
  const locationEnd = location[locationEndKey] as string | undefined;

  if (!locationStart || !locationEnd || locationStart === '' || locationEnd === '') {
    return {
      valid: false,
      error: `Location not available on ${dayLabel}s`
    };
  }

  const startInRange = isTimeInRange(pattern.time_start, locationStart, locationEnd);
  const endInRange = isTimeInRange(pattern.time_end, locationStart, locationEnd);

  if (!startInRange || !endInRange) {
    return {
      valid: false,
      error: `Location available ${locationStart}-${locationEnd} on ${dayLabel}s`,
    };
  }

  return { valid: true };
};

/**
 * Get location for a given type
 */
const getLocationForType = (
  type: SlotLocationType,
  homeLocation: LocationWithSchedule | null,
  trainingLocation: LocationWithSchedule | null,
  gymLocation: LocationWithSchedule | null
): LocationWithSchedule | null => {
  switch (type) {
    case 'home': return homeLocation;
    case 'training': return trainingLocation;
    case 'gym': return gymLocation;
    default: return null;
  }
};

// ============================================================================
// COPY DAY MODAL COMPONENT
// ============================================================================

interface CopyDayModalProps {
  visible: boolean;
  sourceDay: DayOfWeek;
  onCopy: (targetDays: DayOfWeek[]) => void;
  onClose: () => void;
}

const CopyDayModal = memo(function CopyDayModal({
  visible,
  sourceDay,
  onCopy,
  onClose,
}: CopyDayModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  const toggleDay = useCallback((day: DayOfWeek) => {
    if (day === sourceDay) return;
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, [sourceDay]);

  const handleCopy = useCallback(() => {
    onCopy(selectedDays);
    setSelectedDays([]);
    onClose();
  }, [selectedDays, onCopy, onClose]);

  const handleClose = useCallback(() => {
    setSelectedDays([]);
    onClose();
  }, [onClose]);

  const selectAll = useCallback(() => {
    setSelectedDays(DAYS_OF_WEEK.filter((d) => d !== sourceDay));
  }, [sourceDay]);

  const selectWeekdays = useCallback(() => {
    setSelectedDays(WEEKDAYS.filter((d) => d !== sourceDay));
  }, [sourceDay]);

  const selectWeekends = useCallback(() => {
    setSelectedDays(WEEKENDS.filter((d) => d !== sourceDay));
  }, [sourceDay]);

  const clearSelection = useCallback(() => {
    setSelectedDays([]);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[copyModalStyles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={copyModalStyles.header}>
          <Text variant="h4">Copy Pattern</Text>
          <Pressable onPress={handleClose} style={copyModalStyles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={24} color={LightColors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={copyModalStyles.content} showsVerticalScrollIndicator={false}>
          {/* Source Info */}
          <View style={copyModalStyles.sourceInfo}>
            <Ionicons name="copy-outline" size={20} color={BrandColors.primary} />
            <Text variant="body" style={copyModalStyles.sourceText}>
              Copy from <Text bold>{DAY_LABELS[sourceDay].full}</Text> to:
            </Text>
          </View>

          <Spacer size="medium" />

          {/* Quick Select Options */}
          <View style={copyModalStyles.quickSelect}>
            <Pressable style={copyModalStyles.quickSelectButton} onPress={selectAll}>
              <Ionicons name="checkmark-done-outline" size={16} color={BrandColors.primary} />
              <Text variant="bodySmall" customColor={BrandColors.primary}>
                All Days
              </Text>
            </Pressable>
            <Pressable style={copyModalStyles.quickSelectButton} onPress={selectWeekdays}>
              <Ionicons name="briefcase-outline" size={16} color={BrandColors.primary} />
              <Text variant="bodySmall" customColor={BrandColors.primary}>
                Weekdays
              </Text>
            </Pressable>
            <Pressable style={copyModalStyles.quickSelectButton} onPress={selectWeekends}>
              <Ionicons name="sunny-outline" size={16} color={BrandColors.primary} />
              <Text variant="bodySmall" customColor={BrandColors.primary}>
                Weekends
              </Text>
            </Pressable>
            <Pressable style={copyModalStyles.quickSelectButton} onPress={clearSelection}>
              <Ionicons name="close-outline" size={16} color={SemanticColors.error} />
              <Text variant="bodySmall" customColor={SemanticColors.error}>
                Clear
              </Text>
            </Pressable>
          </View>

          <Spacer size="medium" />

          {/* Day Checkboxes */}
          <View style={copyModalStyles.dayList}>
            {DAYS_OF_WEEK.map((day) => {
              const isSource = day === sourceDay;
              const isSelected = selectedDays.includes(day);
              const isWeekend = WEEKENDS.includes(day);

              return (
                <Pressable
                  key={day}
                  style={[
                    copyModalStyles.dayItem,
                    isSource && copyModalStyles.dayItemSource,
                    isSelected && copyModalStyles.dayItemSelected,
                  ]}
                  onPress={() => toggleDay(day)}
                  disabled={isSource}
                >
                  <Ionicons
                    name={isSource ? 'copy' : isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={
                      isSource
                        ? BrandColors.primary
                        : isSelected
                        ? SemanticColors.success
                        : '#9CA3AF'
                    }
                  />
                  <View style={copyModalStyles.dayLabelContainer}>
                    <Text
                      variant="body"
                      bold={isSource || isSelected}
                      style={copyModalStyles.dayLabel}
                    >
                      {DAY_LABELS[day].full}
                    </Text>
                    {isWeekend && (
                      <View style={copyModalStyles.weekendBadge}>
                        <Text variant="caption" customColor="#6B7280">
                          Weekend
                        </Text>
                      </View>
                    )}
                  </View>
                  {isSource && (
                    <View style={copyModalStyles.sourceBadge}>
                      <Text variant="caption" customColor={BrandColors.primary}>
                        Source
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[copyModalStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={copyModalStyles.footerInfo}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={SemanticColors.info}
            />
            <Text variant="caption" color="secondary" style={copyModalStyles.footerInfoText}>
              {selectedDays.length === 0
                ? 'Select at least one day to copy to'
                : `Will copy to ${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
          <View style={copyModalStyles.footerButtons}>
            <Button
              title="Cancel"
              variant="tertiary"
              onPress={handleClose}
              style={copyModalStyles.cancelButton}
            />
            <Button
              title={`Copy to ${selectedDays.length} Day${selectedDays.length !== 1 ? 's' : ''}`}
              onPress={handleCopy}
              disabled={selectedDays.length === 0}
              style={copyModalStyles.copyButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
});

const copyModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  sourceText: {
    marginLeft: Spacing.sm,
  },
  quickSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F3F4F6',
  },
  dayList: {
    gap: Spacing.sm,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  dayItemSource: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderColor: BrandColors.primary,
  },
  dayItemSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderColor: SemanticColors.success,
  },
  dayLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
    gap: Spacing.sm,
  },
  dayLabel: {},
  weekendBadge: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  sourceBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  footerInfoText: {
    marginLeft: Spacing.xs,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  copyButton: {
    flex: 2,
  },
});

// ============================================================================
// LOCATION LEGEND COMPONENT
// ============================================================================

interface LocationLegendProps {
  homeLocation: LocationWithSchedule | null;
  trainingLocation: LocationWithSchedule | null;
  gymLocation: LocationWithSchedule | null;
  compact?: boolean;
}

const LocationLegend = memo(function LocationLegend({
  homeLocation,
  trainingLocation,
  gymLocation,
  compact = false,
}: LocationLegendProps) {
  const locations = [
    { type: 'home' as SlotLocationType, label: 'Home', location: homeLocation },
    { type: 'training' as SlotLocationType, label: 'Training', location: trainingLocation },
    { type: 'gym' as SlotLocationType, label: 'Gym', location: gymLocation },
  ];

  return (
    <View style={[legendStyles.container, compact && legendStyles.containerCompact]}>
      {locations.map(({ type, label, location }) => (
        <View key={type} style={legendStyles.item}>
          <View style={[legendStyles.dot, { backgroundColor: LOCATION_COLORS[type] }]} />
          <Text variant={compact ? 'caption' : 'bodySmall'} color="secondary">
            {label}
          </Text>
          {!location && (
            <Ionicons name="alert-circle" size={12} color={SemanticColors.warning} />
          )}
        </View>
      ))}
    </View>
  );
});

const legendStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  containerCompact: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

// ============================================================================
// PATTERN STATS COMPONENT
// ============================================================================

interface PatternStatsProps {
  stats: PatternStats;
  compact?: boolean;
}

const PatternStatsDisplay = memo(function PatternStatsDisplay({
  stats,
  compact = false,
}: PatternStatsProps) {
  const allValid = stats.validDays === 7;
  const allComplete = stats.completedDays === 7;

  return (
    <View style={[statsStyles.container, compact && statsStyles.containerCompact]}>
      {/* Completion Progress */}
      <View style={statsStyles.progressSection}>
        <View style={statsStyles.progressHeader}>
          <Text variant="label" color="secondary">
            Pattern Completion
          </Text>
          <Text variant="label" customColor={allComplete ? SemanticColors.success : BrandColors.primary}>
            {stats.completedDays}/7 days
          </Text>
        </View>
        <View style={statsStyles.progressBar}>
          <View
            style={[
              statsStyles.progressFill,
              {
                width: `${(stats.completedDays / 7) * 100}%`,
                backgroundColor: allComplete ? SemanticColors.success : BrandColors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Validation Status */}
      <View style={statsStyles.validationSection}>
        {allValid ? (
          <View style={statsStyles.validBadge}>
            <Ionicons name="checkmark-circle" size={16} color={SemanticColors.success} />
            <Text variant="bodySmall" customColor={SemanticColors.success}>
              All days valid
            </Text>
          </View>
        ) : (
          <View style={statsStyles.invalidBadge}>
            <Ionicons name="alert-circle" size={16} color={SemanticColors.warning} />
            <Text variant="bodySmall" customColor={SemanticColors.warning}>
              {stats.invalidDays} day{stats.invalidDays !== 1 ? 's' : ''} need attention
            </Text>
          </View>
        )}
      </View>

      {/* Location Distribution */}
      {!compact && (
        <View style={statsStyles.distributionSection}>
          <Text variant="caption" color="tertiary" style={statsStyles.distributionLabel}>
            Location Distribution:
          </Text>
          <View style={statsStyles.distributionBar}>
            {stats.homeCount > 0 && (
              <View
                style={[
                  statsStyles.distributionSegment,
                  {
                    flex: stats.homeCount,
                    backgroundColor: LOCATION_COLORS.home,
                  },
                ]}
              />
            )}
            {stats.trainingCount > 0 && (
              <View
                style={[
                  statsStyles.distributionSegment,
                  {
                    flex: stats.trainingCount,
                    backgroundColor: LOCATION_COLORS.training,
                  },
                ]}
              />
            )}
            {stats.gymCount > 0 && (
              <View
                style={[
                  statsStyles.distributionSegment,
                  {
                    flex: stats.gymCount,
                    backgroundColor: LOCATION_COLORS.gym,
                  },
                ]}
              />
            )}
          </View>
          <View style={statsStyles.distributionLabels}>
            {stats.homeCount > 0 && (
              <Text variant="caption" customColor={LOCATION_COLORS.home}>
                Home: {stats.homeCount}
              </Text>
            )}
            {stats.trainingCount > 0 && (
              <Text variant="caption" customColor={LOCATION_COLORS.training}>
                Training: {stats.trainingCount}
              </Text>
            )}
            {stats.gymCount > 0 && (
              <Text variant="caption" customColor={LOCATION_COLORS.gym}>
                Gym: {stats.gymCount}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
});

const statsStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.md,
  },
  containerCompact: {
    padding: Spacing.sm,
  },
  progressSection: {
    marginBottom: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  validationSection: {
    marginBottom: Spacing.sm,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: SemanticColors.successBackground,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  invalidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: SemanticColors.warningBackground,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  distributionSection: {},
  distributionLabel: {
    marginBottom: Spacing.xs,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  distributionSegment: {
    height: '100%',
  },
  distributionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

// ============================================================================
// QUICK ACTION CHIP COMPONENT
// ============================================================================

interface QuickActionChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

const QuickActionChip = memo(function QuickActionChip({
  icon,
  label,
  onPress,
  disabled = false,
  variant = 'default',
}: QuickActionChipProps) {
  const color = variant === 'danger' ? SemanticColors.error : BrandColors.primary;

  return (
    <Pressable
      style={[
        chipStyles.container,
        disabled && chipStyles.disabled,
        variant === 'danger' && chipStyles.danger,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={16} color={disabled ? '#9CA3AF' : color} />
      <Text
        variant="bodySmall"
        customColor={disabled ? '#9CA3AF' : color}
        style={chipStyles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  danger: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  label: {
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
});

// ============================================================================
// MAIN PATTERN BUILDER COMPONENT
// ============================================================================

export function PatternBuilder({
  value,
  onChange,
  homeLocation,
  trainingLocation,
  gymLocation,
  disabled = false,
  showQuickActions = true,
  compact = false,
  onSaveAsTemplate,
  showSaveTemplate = true,
  validationErrors,
}: PatternBuilderProps) {
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(compact ? null : 'monday');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<DayOfWeek>('monday');

  // Calculate pattern statistics
  const patternStats = useMemo<PatternStats>(() => {
    let completedDays = 0;
    let homeCount = 0;
    let trainingCount = 0;
    let gymCount = 0;
    let validDays = 0;
    let invalidDays = 0;

    DAYS_OF_WEEK.forEach((day) => {
      const pattern = value[day];

      // Count completed days (has time set)
      if (pattern.time_start && pattern.time_end) {
        completedDays++;
      }

      // Count location types
      switch (pattern.location_type) {
        case 'home': homeCount++; break;
        case 'training': trainingCount++; break;
        case 'gym': gymCount++; break;
      }

      // Validate day
      const location = getLocationForType(pattern.location_type, homeLocation, trainingLocation, gymLocation);
      const validation = validateDayPattern(day, pattern, location);
      if (validation.valid) {
        validDays++;
      } else {
        invalidDays++;
      }
    });

    return {
      completedDays,
      homeCount,
      trainingCount,
      gymCount,
      validDays,
      invalidDays,
    };
  }, [value, homeLocation, trainingLocation, gymLocation]);

  // Per-day validation results (memoized)
  const dayValidations = useMemo<Record<DayOfWeek, DayValidation>>(() => {
    const validations: Record<string, DayValidation> = {};

    DAYS_OF_WEEK.forEach((day) => {
      const pattern = value[day];
      const location = getLocationForType(pattern.location_type, homeLocation, trainingLocation, gymLocation);
      validations[day] = validateDayPattern(day, pattern, location);
    });

    return validations as Record<DayOfWeek, DayValidation>;
  }, [value, homeLocation, trainingLocation, gymLocation]);

  // Handle individual day pattern change
  const handleDayChange = useCallback((day: DayOfWeek, pattern: DaySlotPattern) => {
    onChange({
      ...value,
      [day]: pattern,
    });
  }, [value, onChange]);

  // Copy Monday's pattern to all days
  const handleCopyMondayToAll = useCallback(() => {
    const mondayPattern = value.monday;
    onChange({
      monday: { ...mondayPattern },
      tuesday: { ...mondayPattern },
      wednesday: { ...mondayPattern },
      thursday: { ...mondayPattern },
      friday: { ...mondayPattern },
      saturday: { ...mondayPattern },
      sunday: { ...mondayPattern },
    });
    Alert.alert('Pattern Copied', "Monday's pattern has been copied to all days.");
  }, [value, onChange]);

  // Copy expanded day's pattern to weekdays
  const handleCopyToWeekdays = useCallback(() => {
    const sourceDay = expandedDay || 'monday';
    const sourcePattern = value[sourceDay];

    onChange({
      ...value,
      monday: { ...sourcePattern },
      tuesday: { ...sourcePattern },
      wednesday: { ...sourcePattern },
      thursday: { ...sourcePattern },
      friday: { ...sourcePattern },
    });

    Alert.alert(
      'Pattern Copied',
      `${DAY_LABELS[sourceDay].full}'s pattern has been copied to all weekdays.`
    );
  }, [value, expandedDay, onChange]);

  // Copy Saturday's pattern to weekends
  const handleCopyToWeekends = useCallback(() => {
    const saturdayPattern = value.saturday;
    onChange({
      ...value,
      saturday: { ...saturdayPattern },
      sunday: { ...saturdayPattern },
    });
    Alert.alert('Pattern Copied', "Saturday's pattern has been copied to Sunday.");
  }, [value, onChange]);

  // Clear all days to default
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Patterns',
      'Are you sure you want to reset all days to the default pattern?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            onChange(createDefaultPattern());
          },
        },
      ]
    );
  }, [onChange]);

  // Copy pattern to specific days (from modal)
  const handleCopyToSpecificDays = useCallback((targetDays: DayOfWeek[]) => {
    const sourcePattern = value[copySourceDay];
    const newPattern = { ...value };

    targetDays.forEach((day) => {
      newPattern[day] = { ...sourcePattern };
    });

    onChange(newPattern);

    Alert.alert(
      'Pattern Copied',
      `${DAY_LABELS[copySourceDay].full}'s pattern has been copied to ${targetDays.length} day${targetDays.length !== 1 ? 's' : ''}.`
    );
  }, [value, copySourceDay, onChange]);

  // Open copy modal for a specific day
  const handleOpenCopyModal = useCallback((day: DayOfWeek) => {
    setCopySourceDay(day);
    setShowCopyModal(true);
  }, []);

  // Toggle day expansion
  const handleToggleExpand = useCallback((day: DayOfWeek) => {
    setExpandedDay((current) => (current === day ? null : day));
  }, []);

  // Handle save as template
  const handleSaveAsTemplate = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Save as Template',
        'Enter a name for this template:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (name) => {
              if (name && name.trim() && onSaveAsTemplate) {
                onSaveAsTemplate(name.trim());
              }
            },
          },
        ],
        'plain-text',
        '',
        'default'
      );
    } else {
      // Android doesn't support Alert.prompt, would need custom modal
      if (onSaveAsTemplate) {
        onSaveAsTemplate('My Weekly Template');
      }
    }
  }, [onSaveAsTemplate]);

  // Check if all locations are set up
  const hasRequiredLocations = homeLocation !== null && trainingLocation !== null;

  // Show empty state if locations not set up
  if (!hasRequiredLocations) {
    return (
      <Card padding="large">
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="location-outline" size={48} color={SemanticColors.warning} />
          </View>
          <Text variant="h5" center>
            Set Up Locations First
          </Text>
          <Spacer size="small" />
          <Text variant="body" color="secondary" center style={styles.emptyStateText}>
            You need to set up your home and training locations before creating a weekly pattern.
          </Text>
          <Spacer size="medium" />
          <Button
            title="Go to Locations"
            variant="secondary"
            leftIcon={<Ionicons name="location" size={20} color={BrandColors.primary} />}
            onPress={() => {
              // Navigation would go here
            }}
          />
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={styles.headerInfo}>
          <Text variant={compact ? 'h6' : 'h5'}>Weekly Pattern</Text>
          {!compact && (
            <Text variant="caption" color="secondary">
              Set your 60-minute testing slot for each day
            </Text>
          )}
        </View>
      </View>

      {/* Location Legend */}
      <LocationLegend
        homeLocation={homeLocation}
        trainingLocation={trainingLocation}
        gymLocation={gymLocation}
        compact={compact}
      />

      {/* Pattern Stats */}
      <PatternStatsDisplay stats={patternStats} compact={compact} />

      {/* Quick Actions */}
      {showQuickActions && (
        <View style={[styles.quickActions, compact && styles.quickActionsCompact]}>
          <Text variant="label" color="secondary" style={styles.quickActionsLabel}>
            Quick Actions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            <QuickActionChip
              icon="copy-outline"
              label="Copy Monday to All"
              onPress={handleCopyMondayToAll}
              disabled={disabled}
            />
            <QuickActionChip
              icon="briefcase-outline"
              label="Copy to Weekdays"
              onPress={handleCopyToWeekdays}
              disabled={disabled}
            />
            <QuickActionChip
              icon="sunny-outline"
              label="Copy to Weekends"
              onPress={handleCopyToWeekends}
              disabled={disabled}
            />
            <QuickActionChip
              icon="trash-outline"
              label="Clear All"
              onPress={handleClearAll}
              disabled={disabled}
              variant="danger"
            />
          </ScrollView>
        </View>
      )}

      {/* Day Pattern Rows */}
      <View style={styles.daysContainer}>
        {DAYS_OF_WEEK.map((day) => {
          const validation = dayValidations[day];
          const externalError = validationErrors?.[day];

          return (
            <DayPatternRow
              key={day}
              day={day}
              pattern={value[day]}
              onChange={(pattern) => handleDayChange(day, pattern)}
              homeLocation={homeLocation}
              trainingLocation={trainingLocation}
              gymLocation={gymLocation}
              isExpanded={expandedDay === day}
              onToggleExpand={() => handleToggleExpand(day)}
              onCopy={() => handleOpenCopyModal(day)}
              disabled={disabled}
              compact={compact}
              validationError={externalError || (validation.valid ? undefined : validation.error)}
            />
          );
        })}
      </View>

      {/* Save as Template */}
      {showSaveTemplate && onSaveAsTemplate && !compact && (
        <View style={styles.saveTemplateSection}>
          <Button
            title="Save as Template"
            variant="secondary"
            onPress={handleSaveAsTemplate}
            leftIcon={<Ionicons name="bookmark-outline" size={20} color={BrandColors.primary} />}
            fullWidth
            disabled={disabled || patternStats.invalidDays > 0}
          />
          <Text variant="caption" color="tertiary" center style={styles.saveTemplateHint}>
            Save this pattern for future quarters
          </Text>
        </View>
      )}

      {/* Info Card */}
      {!compact && (
        <Card style={styles.infoCard} padding="medium">
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={SemanticColors.info} />
            <Text variant="label" customColor={SemanticColors.info} style={styles.infoTitle}>
              WADA Compliance
            </Text>
          </View>
          <Text variant="bodySmall" color="secondary">
            Each day requires a 60-minute slot where you can be available for testing.
            This pattern will be applied to all {patternStats.completedDays * 13 || 90} days of the quarter.
          </Text>
        </Card>
      )}

      {/* Copy Day Modal */}
      <CopyDayModal
        visible={showCopyModal}
        sourceDay={copySourceDay}
        onCopy={handleCopyToSpecificDays}
        onClose={() => setShowCopyModal(false)}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerCompact: {
    marginBottom: Spacing.sm,
  },
  headerInfo: {},
  quickActions: {
    marginBottom: Spacing.md,
  },
  quickActionsCompact: {
    marginBottom: Spacing.sm,
  },
  quickActionsLabel: {
    marginBottom: Spacing.sm,
  },
  quickActionsScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  daysContainer: {
    marginBottom: Spacing.md,
  },
  saveTemplateSection: {
    marginBottom: Spacing.md,
  },
  saveTemplateHint: {
    marginTop: Spacing.xs,
  },
  infoCard: {
    backgroundColor: SemanticColors.infoBackground,
    borderColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    marginLeft: Spacing.sm,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SemanticColors.warningBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    paddingHorizontal: Spacing.lg,
  },
});

export default PatternBuilder;
