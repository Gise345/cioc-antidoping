/**
 * TimeRangePicker Component
 * Select a 60-minute time slot with preset options and custom selection
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button, Card } from '@/src/components/common';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onChange: (start: string, end: string) => void;
  minTime?: string; // Location opens at
  maxTime?: string; // Location closes at
  disabled?: boolean;
  error?: string;
  label?: string;
}

// Common 60-minute slot presets
const TIME_PRESETS = [
  { start: '06:00', end: '07:00', label: '6-7 AM' },
  { start: '07:00', end: '08:00', label: '7-8 AM' },
  { start: '08:00', end: '09:00', label: '8-9 AM' },
  { start: '17:00', end: '18:00', label: '5-6 PM' },
  { start: '18:00', end: '19:00', label: '6-7 PM' },
  { start: '19:00', end: '20:00', label: '7-8 PM' },
];

// Generate all valid 60-minute slots between 05:00 and 23:00
const generateAllSlots = () => {
  const slots: { start: string; end: string; label: string }[] = [];
  for (let hour = 5; hour < 23; hour++) {
    const startHour = hour.toString().padStart(2, '0');
    const endHour = (hour + 1).toString().padStart(2, '0');
    const startTime = `${startHour}:00`;
    const endTime = `${endHour}:00`;

    // Format label
    const startLabel = hour <= 12 ? `${hour}` : `${hour - 12}`;
    const endLabel = (hour + 1) <= 12 ? `${hour + 1}` : `${hour + 1 - 12}`;
    const startSuffix = hour < 12 ? 'AM' : 'PM';
    const endSuffix = (hour + 1) < 12 || (hour + 1) === 24 ? 'AM' : 'PM';

    slots.push({
      start: startTime,
      end: endTime,
      label: `${startLabel}${startSuffix === endSuffix ? '' : startSuffix}-${endLabel}${endSuffix}`,
    });
  }
  return slots;
};

const ALL_SLOTS = generateAllSlots();

export function TimeRangePicker({
  startTime,
  endTime,
  onChange,
  minTime = '05:00',
  maxTime = '23:00',
  disabled = false,
  error,
  label,
}: TimeRangePickerProps) {
  const [showModal, setShowModal] = useState(false);

  // Filter available slots based on location hours
  const availableSlots = useMemo(() => {
    const minHour = parseInt(minTime.split(':')[0], 10);
    const maxHour = parseInt(maxTime.split(':')[0], 10);

    return ALL_SLOTS.filter((slot) => {
      const slotStartHour = parseInt(slot.start.split(':')[0], 10);
      const slotEndHour = parseInt(slot.end.split(':')[0], 10);
      return slotStartHour >= minHour && slotEndHour <= maxHour;
    });
  }, [minTime, maxTime]);

  // Check if current selection is valid
  const isValidSelection = useMemo(() => {
    if (!startTime || !endTime) return false;
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const minHour = parseInt(minTime.split(':')[0], 10);
    const maxHour = parseInt(maxTime.split(':')[0], 10);
    return startHour >= minHour && endHour <= maxHour && endHour - startHour === 1;
  }, [startTime, endTime, minTime, maxTime]);

  // Format time for display
  const formatTimeDisplay = (time: string) => {
    const hour = parseInt(time.split(':')[0], 10);
    const suffix = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour <= 12 ? hour : hour - 12;
    return `${displayHour}:00 ${suffix}`;
  };

  const displayValue = startTime && endTime
    ? `${formatTimeDisplay(startTime)} - ${formatTimeDisplay(endTime)}`
    : 'Select time slot';

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}

      <Pressable
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
          error && styles.selectorError,
          !isValidSelection && startTime && styles.selectorWarning,
        ]}
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={disabled ? '#9CA3AF' : BrandColors.primary}
        />
        <Text
          variant="body"
          color={startTime ? 'primary' : 'tertiary'}
          style={styles.selectorText}
        >
          {displayValue}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? '#9CA3AF' : '#6B7280'}
        />
      </Pressable>

      {error && (
        <Text variant="caption" customColor={SemanticColors.error} style={styles.errorText}>
          {error}
        </Text>
      )}

      {!isValidSelection && startTime && !error && (
        <Text variant="caption" customColor={SemanticColors.warning} style={styles.errorText}>
          Selected time is outside location hours ({minTime} - {maxTime})
        </Text>
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="h4">Select 60-Minute Slot</Text>
            <Pressable onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={LightColors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.modalSubheader}>
            <Ionicons name="information-circle-outline" size={18} color={SemanticColors.info} />
            <Text variant="caption" color="secondary" style={styles.infoText}>
              Location hours: {formatTimeDisplay(minTime)} - {formatTimeDisplay(maxTime)}
            </Text>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsSection}>
            <Text variant="label" color="secondary" style={styles.sectionLabel}>
              Quick Select
            </Text>
            <View style={styles.presetGrid}>
              {TIME_PRESETS.filter(preset => {
                const startHour = parseInt(preset.start.split(':')[0], 10);
                const endHour = parseInt(preset.end.split(':')[0], 10);
                const minHour = parseInt(minTime.split(':')[0], 10);
                const maxHour = parseInt(maxTime.split(':')[0], 10);
                return startHour >= minHour && endHour <= maxHour;
              }).map((preset) => (
                <Pressable
                  key={preset.start}
                  style={[
                    styles.presetChip,
                    startTime === preset.start && endTime === preset.end && styles.presetChipSelected,
                  ]}
                  onPress={() => {
                    onChange(preset.start, preset.end);
                    setShowModal(false);
                  }}
                >
                  <Text
                    variant="bodySmall"
                    customColor={
                      startTime === preset.start && endTime === preset.end
                        ? '#FFFFFF'
                        : BrandColors.primary
                    }
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* All Slots */}
          <View style={styles.allSlotsSection}>
            <Text variant="label" color="secondary" style={styles.sectionLabel}>
              All Available Slots
            </Text>
            <ScrollView
              style={styles.slotsList}
              showsVerticalScrollIndicator={false}
            >
              {availableSlots.map((slot) => (
                <Pressable
                  key={slot.start}
                  style={[
                    styles.slotItem,
                    startTime === slot.start && endTime === slot.end && styles.slotItemSelected,
                  ]}
                  onPress={() => {
                    onChange(slot.start, slot.end);
                    setShowModal(false);
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={
                      startTime === slot.start && endTime === slot.end
                        ? '#FFFFFF'
                        : '#6B7280'
                    }
                  />
                  <Text
                    variant="body"
                    customColor={
                      startTime === slot.start && endTime === slot.end
                        ? '#FFFFFF'
                        : LightColors.textPrimary
                    }
                    style={styles.slotText}
                  >
                    {formatTimeDisplay(slot.start)} - {formatTimeDisplay(slot.end)}
                  </Text>
                  {startTime === slot.start && endTime === slot.end && (
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="tertiary"
              onPress={() => setShowModal(false)}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  selectorDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  selectorError: {
    borderColor: SemanticColors.error,
  },
  selectorWarning: {
    borderColor: SemanticColors.warning,
  },
  selectorText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: LightColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: SemanticColors.infoBackground,
  },
  infoText: {
    marginLeft: Spacing.sm,
  },
  presetsSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    backgroundColor: 'transparent',
  },
  presetChipSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  allSlotsSection: {
    flex: 1,
    padding: Spacing.md,
  },
  slotsList: {
    flex: 1,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    backgroundColor: '#F9FAFB',
  },
  slotItemSelected: {
    backgroundColor: BrandColors.primary,
  },
  slotText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  modalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default TimeRangePicker;
