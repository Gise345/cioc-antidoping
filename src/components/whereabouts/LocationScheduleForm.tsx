/**
 * LocationScheduleForm Component
 * Reusable component for weekly schedule input
 * Allows setting start/end times for each day of the week
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Divider, useTheme } from 'react-native-paper';
import { Text } from '../common';
import { WeekDayTimePicker } from './WeekDayTimePicker';
import { LocationWithSchedule } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { DAYS_OF_WEEK } from '../../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface LocationScheduleFormProps {
  value: LocationWithSchedule;
  onChange: (value: LocationWithSchedule) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

type DayKey = typeof DAYS_OF_WEEK[number];

// ============================================================================
// COMPONENT
// ============================================================================

export const LocationScheduleForm: React.FC<LocationScheduleFormProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false,
}) => {
  const theme = useTheme();

  // Get time values for a specific day
  const getDayTimes = useCallback(
    (day: DayKey) => ({
      start: value[`${day}_start` as keyof LocationWithSchedule] as string || '',
      end: value[`${day}_end` as keyof LocationWithSchedule] as string || '',
    }),
    [value]
  );

  // Handle time change for a specific day
  const handleDayTimeChange = useCallback(
    (day: DayKey, start: string, end: string) => {
      onChange({
        ...value,
        [`${day}_start`]: start,
        [`${day}_end`]: end,
      });
    },
    [value, onChange]
  );

  // Copy Monday times to all days
  const copyMondayToAll = useCallback(() => {
    const mondayTimes = getDayTimes('monday');
    const updates: Partial<LocationWithSchedule> = {};

    DAYS_OF_WEEK.forEach((day) => {
      updates[`${day}_start` as keyof LocationWithSchedule] = mondayTimes.start as never;
      updates[`${day}_end` as keyof LocationWithSchedule] = mondayTimes.end as never;
    });

    onChange({ ...value, ...updates });
  }, [value, onChange, getDayTimes]);

  // Copy Monday times to weekdays only
  const copyToWeekdays = useCallback(() => {
    const mondayTimes = getDayTimes('monday');
    const weekdays: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const updates: Partial<LocationWithSchedule> = {};

    weekdays.forEach((day) => {
      updates[`${day}_start` as keyof LocationWithSchedule] = mondayTimes.start as never;
      updates[`${day}_end` as keyof LocationWithSchedule] = mondayTimes.end as never;
    });

    onChange({ ...value, ...updates });
  }, [value, onChange, getDayTimes]);

  // Copy Saturday times to weekends
  const copyToWeekends = useCallback(() => {
    const saturdayTimes = getDayTimes('saturday');
    const weekends: DayKey[] = ['saturday', 'sunday'];
    const updates: Partial<LocationWithSchedule> = {};

    weekends.forEach((day) => {
      updates[`${day}_start` as keyof LocationWithSchedule] = saturdayTimes.start as never;
      updates[`${day}_end` as keyof LocationWithSchedule] = saturdayTimes.end as never;
    });

    onChange({ ...value, ...updates });
  }, [value, onChange, getDayTimes]);

  // Clear all times
  const clearAll = useCallback(() => {
    const updates: Partial<LocationWithSchedule> = {};

    DAYS_OF_WEEK.forEach((day) => {
      updates[`${day}_start` as keyof LocationWithSchedule] = '' as never;
      updates[`${day}_end` as keyof LocationWithSchedule] = '' as never;
    });

    onChange({ ...value, ...updates });
  }, [value, onChange]);

  // Get error for a specific day
  const getDayError = useCallback(
    (day: DayKey): string | undefined => {
      return errors[`${day}_start`] || errors[`${day}_end`] || errors[`${day}_time`];
    },
    [errors]
  );

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Weekly Schedule"
        subtitle="Set your availability for each day"
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardSubtitle}
      />

      <Card.Content>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsLabel}>Quick Actions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Button
              mode="outlined"
              compact
              onPress={copyMondayToAll}
              disabled={disabled || !getDayTimes('monday').start}
              style={styles.quickActionButton}
              labelStyle={styles.quickActionLabel}
            >
              Copy Mon to All
            </Button>
            <Button
              mode="outlined"
              compact
              onPress={copyToWeekdays}
              disabled={disabled || !getDayTimes('monday').start}
              style={styles.quickActionButton}
              labelStyle={styles.quickActionLabel}
            >
              Weekdays Only
            </Button>
            <Button
              mode="outlined"
              compact
              onPress={copyToWeekends}
              disabled={disabled || !getDayTimes('saturday').start}
              style={styles.quickActionButton}
              labelStyle={styles.quickActionLabel}
            >
              Weekends Only
            </Button>
            <Button
              mode="outlined"
              compact
              onPress={clearAll}
              disabled={disabled}
              style={[styles.quickActionButton, styles.clearButton]}
              labelStyle={styles.quickActionLabel}
            >
              Clear All
            </Button>
          </ScrollView>
        </View>

        <Divider style={styles.divider} />

        {/* Schedule Table Header */}
        <View style={styles.headerRow}>
          <View style={styles.dayColumn}>
            <Text style={styles.headerText}>Day</Text>
          </View>
          <View style={styles.timeColumn}>
            <Text style={styles.headerText}>Start Time</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.timeColumn}>
            <Text style={styles.headerText}>End Time</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Day Rows */}
        {DAYS_OF_WEEK.map((day, index) => {
          const times = getDayTimes(day);
          const dayError = getDayError(day);

          return (
            <View key={day}>
              <View style={styles.dayRow}>
                <WeekDayTimePicker
                  day={day}
                  startTime={times.start}
                  endTime={times.end}
                  onChange={(start, end) => handleDayTimeChange(day, start, end)}
                  error={dayError}
                  disabled={disabled}
                />
              </View>
              {index < DAYS_OF_WEEK.length - 1 && (
                <Divider style={styles.rowDivider} />
              )}
            </View>
          );
        })}

        {/* General error message */}
        {errors.schedule && (
          <Text style={styles.generalError}>{errors.schedule}</Text>
        )}
      </Card.Content>
    </Card>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    marginVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  quickActions: {
    marginBottom: SPACING.md,
  },
  quickActionsLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  quickActionButton: {
    marginRight: SPACING.sm,
    borderColor: COLORS.primary,
  },
  quickActionLabel: {
    fontSize: 11,
  },
  clearButton: {
    borderColor: COLORS.error,
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  dayColumn: {
    width: 50,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  spacer: {
    width: 24,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  rowDivider: {
    marginVertical: SPACING.xs,
    opacity: 0.3,
  },
  generalError: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default LocationScheduleForm;
