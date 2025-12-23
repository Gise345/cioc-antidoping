/**
 * WeekDayTimePicker Component
 * Single day time range picker with start and end time inputs
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '../common';
import { COLORS, SPACING } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface WeekDayTimePickerProps {
  day: string;
  startTime: string;
  endTime: string;
  onChange: (start: string, end: string) => void;
  error?: string;
  disabled?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse HH:mm time string to Date object
 */
const parseTimeToDate = (time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
};

/**
 * Format Date object to HH:mm string
 */
const formatTimeFromDate = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Validate time format (HH:mm)
 */
const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate that end time is after start time
 */
const isEndAfterStart = (start: string, end: string): boolean => {
  if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) return true;

  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  return endTotal > startTotal;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const WeekDayTimePicker: React.FC<WeekDayTimePickerProps> = ({
  day,
  startTime,
  endTime,
  onChange,
  error,
  disabled = false,
}) => {
  const theme = useTheme();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Capitalize day name
  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
  const abbreviatedDay = dayLabel.substring(0, 3);

  // Handle start time change
  const handleStartTimeChange = useCallback(
    (event: unknown, selectedDate?: Date) => {
      setShowStartPicker(Platform.OS === 'ios');

      if (selectedDate) {
        const newStartTime = formatTimeFromDate(selectedDate);

        // Validate end time is still after start
        if (endTime && !isEndAfterStart(newStartTime, endTime)) {
          setLocalError('End time must be after start time');
        } else {
          setLocalError(null);
        }

        onChange(newStartTime, endTime);
      }
    },
    [endTime, onChange]
  );

  // Handle end time change
  const handleEndTimeChange = useCallback(
    (event: unknown, selectedDate?: Date) => {
      setShowEndPicker(Platform.OS === 'ios');

      if (selectedDate) {
        const newEndTime = formatTimeFromDate(selectedDate);

        // Validate end time is after start
        if (startTime && !isEndAfterStart(startTime, newEndTime)) {
          setLocalError('End time must be after start time');
        } else {
          setLocalError(null);
        }

        onChange(startTime, newEndTime);
      }
    },
    [startTime, onChange]
  );

  // Handle manual text input for start time
  const handleStartTextChange = useCallback(
    (text: string) => {
      // Allow partial input during typing
      onChange(text, endTime);

      if (text && isValidTimeFormat(text)) {
        if (endTime && !isEndAfterStart(text, endTime)) {
          setLocalError('End time must be after start time');
        } else {
          setLocalError(null);
        }
      }
    },
    [endTime, onChange]
  );

  // Handle manual text input for end time
  const handleEndTextChange = useCallback(
    (text: string) => {
      // Allow partial input during typing
      onChange(startTime, text);

      if (text && isValidTimeFormat(text)) {
        if (startTime && !isEndAfterStart(startTime, text)) {
          setLocalError('End time must be after start time');
        } else {
          setLocalError(null);
        }
      }
    },
    [startTime, onChange]
  );

  const displayError = error || localError;

  return (
    <View style={styles.container}>
      {/* Day Label */}
      <View style={styles.dayLabelContainer}>
        <Text style={styles.dayLabel}>{abbreviatedDay}</Text>
      </View>

      {/* Time Inputs */}
      <View style={styles.timeInputsContainer}>
        {/* Start Time */}
        <View style={styles.timeInputWrapper}>
          <TextInput
            mode="outlined"
            label="Start"
            value={startTime}
            onChangeText={handleStartTextChange}
            placeholder="HH:mm"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            disabled={disabled}
            error={!!displayError}
            dense
            style={styles.timeInput}
            right={
              <TextInput.Icon
                icon="clock-outline"
                onPress={() => !disabled && setShowStartPicker(true)}
              />
            }
          />
        </View>

        {/* Separator */}
        <Text style={styles.separator}>-</Text>

        {/* End Time */}
        <View style={styles.timeInputWrapper}>
          <TextInput
            mode="outlined"
            label="End"
            value={endTime}
            onChangeText={handleEndTextChange}
            placeholder="HH:mm"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            disabled={disabled}
            error={!!displayError}
            dense
            style={styles.timeInput}
            right={
              <TextInput.Icon
                icon="clock-outline"
                onPress={() => !disabled && setShowEndPicker(true)}
              />
            }
          />
        </View>
      </View>

      {/* Error Message */}
      {displayError && (
        <HelperText type="error" visible={true} style={styles.errorText}>
          {displayError}
        </HelperText>
      )}

      {/* Start Time Picker (Native) */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime ? parseTimeToDate(startTime) : new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartTimeChange}
        />
      )}

      {/* End Time Picker (Native) */}
      {showEndPicker && (
        <DateTimePicker
          value={endTime ? parseTimeToDate(endTime) : new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndTimeChange}
        />
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  dayLabelContainer: {
    width: 40,
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  timeInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeInputWrapper: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: COLORS.background,
    fontSize: 14,
  },
  separator: {
    marginHorizontal: SPACING.sm,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorText: {
    marginTop: -SPACING.xs,
    paddingLeft: 44, // Align with inputs
  },
});

export default WeekDayTimePicker;
