/**
 * Quick Update Screen
 * Quickly update today's or tomorrow's 60-minute slot
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import {
  ScreenContainer,
  Text,
  Card,
  Button,
  Spacer,
  Divider,
} from '@/src/components/common';
import { TimeRangePicker } from '@/src/components/whereabouts';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SlotLocationType } from '@/src/types';
import { AppDispatch, RootState } from '@/src/store/store';
import { selectUser } from '@/src/store/slices/authSlice';
import {
  selectHomeLocation,
  selectTrainingLocation,
  selectGymLocation,
} from '@/src/store/slices/locationsSlice';
import {
  upsertDailySlotAsync,
  fetchDailySlotsAsync,
  selectCurrentQuarter,
  selectDailySlots,
  selectWhereaboutsSaving,
} from '@/src/store/slices/whereaboutsSlice';

// Location type colors
const LOCATION_COLORS = {
  home: '#2196F3', // Blue
  training: '#4CAF50', // Green
  gym: '#FF9800', // Orange
};

const LOCATION_ICONS: Record<SlotLocationType, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  training: 'fitness',
  gym: 'barbell',
};

// Generate time slots from 5:00 to 22:00
const generateTimeSlots = (): { start: string; end: string; label: string }[] => {
  const slots: { start: string; end: string; label: string }[] = [];
  for (let hour = 5; hour <= 22; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour <= 12 ? hour : hour - 12;
    slots.push({
      start,
      end,
      label: `${displayHour}${ampm}`,
    });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Format date to ISO string (YYYY-MM-DD)
const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get today and tomorrow dates
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getTomorrow = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

export default function QuickUpdateScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams<{ date?: string }>();

  // Redux state
  const user = useSelector(selectUser);
  const homeLocation = useSelector(selectHomeLocation);
  const trainingLocation = useSelector(selectTrainingLocation);
  const gymLocation = useSelector(selectGymLocation);
  const currentQuarter = useSelector(selectCurrentQuarter);
  const dailySlots = useSelector(selectDailySlots);
  const isSaving = useSelector(selectWhereaboutsSaving);

  // Local state
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>(
    params.date === 'tomorrow' ? 'tomorrow' : 'today'
  );
  const [selectedLocation, setSelectedLocation] = useState<SlotLocationType>('home');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('07:00');
  const [notes, setNotes] = useState('');
  const [applyToTomorrow, setApplyToTomorrow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate dates
  const today = useMemo(() => getToday(), []);
  const tomorrow = useMemo(() => getTomorrow(), []);
  const activeDate = selectedDate === 'today' ? today : tomorrow;
  const activeDateStr = formatDateISO(activeDate);

  // Get current slot for selected date
  const currentSlot = dailySlots[activeDateStr];

  // Format date for display
  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Load current slot data
  useEffect(() => {
    const loadSlotData = async () => {
      setIsLoading(true);
      try {
        if (currentQuarter?.id) {
          await dispatch(fetchDailySlotsAsync(currentQuarter.id));
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadSlotData();
  }, [currentQuarter?.id, dispatch]);

  // Pre-fill form with existing slot data
  useEffect(() => {
    if (currentSlot) {
      // Extract location type from location_id (format: "type:userId")
      const slotLocationId = currentSlot.slot_60min?.location_id || '';
      if (slotLocationId.startsWith('home')) {
        setSelectedLocation('home');
      } else if (slotLocationId.startsWith('training')) {
        setSelectedLocation('training');
      } else if (slotLocationId.startsWith('gym')) {
        setSelectedLocation('gym');
      }

      setStartTime(currentSlot.slot_60min?.start_time || '06:00');
      setEndTime(currentSlot.slot_60min?.end_time || '07:00');
    } else {
      // Default values
      setSelectedLocation('home');
      setStartTime('06:00');
      setEndTime('07:00');
    }
    setNotes('');
    setApplyToTomorrow(false);
  }, [currentSlot, activeDateStr]);

  // Handle time change
  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  // Get location info
  const getLocationInfo = useCallback(
    (type: SlotLocationType) => {
      switch (type) {
        case 'home':
          return homeLocation;
        case 'training':
          return trainingLocation;
        case 'gym':
          return gymLocation;
        default:
          return null;
      }
    },
    [homeLocation, trainingLocation, gymLocation]
  );

  // Get location address string
  const getLocationAddress = useCallback(
    (type: SlotLocationType): string => {
      const location = getLocationInfo(type);
      if (!location) return 'Not set up';
      const parts = [
        location.address_line1,
        location.city,
        location.country,
      ].filter(Boolean);
      return parts.join(', ') || 'Address not set';
    },
    [getLocationInfo]
  );

  // Save slot
  const handleSave = async () => {
    if (!user?.uid || !currentQuarter?.id) {
      Alert.alert('Error', 'No active quarter found. Please create a quarter first.');
      return;
    }

    try {
      // Create slot data
      const slotData = {
        quarterId: currentQuarter.id,
        athleteId: user.uid,
        date: activeDateStr,
        slot60min: {
          start_time: startTime,
          end_time: endTime,
          location_id: `${selectedLocation}:${user.uid}`,
          location_name: selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1),
          location_address: getLocationAddress(selectedLocation),
        },
        overnightLocationId: `home:${user.uid}`,
        overnightLocationName: 'Home',
      };

      // Save primary slot
      const result = await dispatch(upsertDailySlotAsync(slotData));

      if (!upsertDailySlotAsync.fulfilled.match(result)) {
        throw new Error('Failed to save slot');
      }

      // Save tomorrow's slot if checkbox is checked
      if (applyToTomorrow && selectedDate === 'today') {
        const tomorrowData = {
          ...slotData,
          date: formatDateISO(tomorrow),
        };
        await dispatch(upsertDailySlotAsync(tomorrowData));
      }

      // Show success and navigate back
      Alert.alert(
        'Success',
        applyToTomorrow
          ? 'Updated today and tomorrow!'
          : 'Slot updated!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving slot:', error);
      Alert.alert('Error', 'Failed to update slot. Please try again.');
    }
  };

  // Location options
  const locationOptions: {
    type: SlotLocationType;
    label: string;
    available: boolean;
  }[] = [
    { type: 'home', label: 'Home', available: !!homeLocation },
    { type: 'training', label: 'Training', available: !!trainingLocation },
    { type: 'gym', label: 'Gym', available: !!gymLocation },
  ];

  if (isLoading) {
    return (
      <ScreenContainer edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Spacer size="medium" />
          <Text variant="body" color="secondary">
            Loading slot data...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <Pressable
            style={[
              styles.dateOption,
              selectedDate === 'today' && styles.dateOptionSelected,
            ]}
            onPress={() => setSelectedDate('today')}
          >
            <Text
              variant="body"
              bold={selectedDate === 'today'}
              customColor={selectedDate === 'today' ? '#FFFFFF' : colors.textPrimary}
            >
              Today
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.dateOption,
              selectedDate === 'tomorrow' && styles.dateOptionSelected,
            ]}
            onPress={() => setSelectedDate('tomorrow')}
          >
            <Text
              variant="body"
              bold={selectedDate === 'tomorrow'}
              customColor={selectedDate === 'tomorrow' ? '#FFFFFF' : colors.textPrimary}
            >
              Tomorrow
            </Text>
          </Pressable>
        </View>

        {/* Full Date Display */}
        <View style={styles.dateDisplay}>
          <Ionicons name="calendar-outline" size={20} color={BrandColors.primary} />
          <Text variant="body" style={styles.dateText}>
            {formatDateDisplay(activeDate)}
          </Text>
        </View>

        <Spacer size="large" />

        {/* Current Slot Display */}
        {currentSlot ? (
          <Card style={styles.currentSlotCard} padding="medium">
            <View style={styles.currentSlotHeader}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text variant="label" color="secondary" style={styles.currentSlotLabel}>
                Current Slot
              </Text>
            </View>
            <View style={styles.currentSlotContent}>
              <View style={styles.currentSlotInfo}>
                <Text variant="h5">
                  {currentSlot.slot_60min?.start_time} - {currentSlot.slot_60min?.end_time}
                </Text>
                <Text variant="bodySmall" color="secondary">
                  {currentSlot.slot_60min?.location_name}
                </Text>
              </View>
              <View style={styles.currentSlotBadge}>
                <Ionicons
                  name={LOCATION_ICONS[selectedLocation] || 'location'}
                  size={16}
                  color={LOCATION_COLORS[selectedLocation]}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.noSlotCard} padding="medium">
            <Ionicons name="alert-circle-outline" size={24} color={SemanticColors.warning} />
            <Text variant="body" color="secondary" style={styles.noSlotText}>
              No slot set for this date
            </Text>
          </Card>
        )}

        <Spacer size="large" />
        <Divider />
        <Spacer size="large" />

        {/* Location Selection */}
        <Text variant="h5" style={styles.sectionTitle}>
          Location
        </Text>

        <View style={styles.locationGrid}>
          {locationOptions.map((option) => {
            const isSelected = selectedLocation === option.type;
            const color = LOCATION_COLORS[option.type];

            return (
              <Pressable
                key={option.type}
                style={[
                  styles.locationCard,
                  { borderColor: isSelected ? color : '#E5E7EB' },
                  isSelected && { backgroundColor: `${color}10` },
                  !option.available && styles.locationCardDisabled,
                ]}
                onPress={() => option.available && setSelectedLocation(option.type)}
                disabled={!option.available}
              >
                <View
                  style={[
                    styles.locationIcon,
                    { backgroundColor: `${color}20` },
                  ]}
                >
                  <Ionicons
                    name={LOCATION_ICONS[option.type]}
                    size={24}
                    color={option.available ? color : '#9CA3AF'}
                  />
                </View>
                <Text
                  variant="body"
                  bold={isSelected}
                  color={option.available ? 'primary' : 'tertiary'}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={color} />
                )}
                {!option.available && (
                  <Text variant="caption" color="tertiary">
                    Not set up
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Location Address */}
        <View style={styles.locationAddress}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text variant="caption" color="secondary" style={styles.addressText}>
            {getLocationAddress(selectedLocation)}
          </Text>
        </View>

        <Spacer size="large" />

        {/* Time Selection */}
        <Text variant="h5" style={styles.sectionTitle}>
          60-Minute Slot
        </Text>

        <TimeRangePicker
          startTime={startTime}
          endTime={endTime}
          onChange={handleTimeChange}
          minTime="05:00"
          maxTime="23:00"
        />

        <Spacer size="large" />

        {/* Notes */}
        <Text variant="h5" style={styles.sectionTitle}>
          Notes (Optional)
        </Text>

        <TextInput
          style={[styles.notesInput, { color: colors.textPrimary }]}
          placeholder="Add any notes..."
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          maxLength={200}
          multiline
          numberOfLines={3}
        />

        <Text variant="caption" color="tertiary" style={styles.charCount}>
          {notes.length}/200 characters
        </Text>

        <Spacer size="large" />

        {/* Apply to Tomorrow Checkbox */}
        {selectedDate === 'today' && (
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setApplyToTomorrow(!applyToTomorrow)}
          >
            <Ionicons
              name={applyToTomorrow ? 'checkbox' : 'square-outline'}
              size={24}
              color={applyToTomorrow ? BrandColors.primary : colors.textSecondary}
            />
            <Text variant="body" style={styles.checkboxLabel}>
              Also apply to tomorrow
            </Text>
          </Pressable>
        )}

        <Spacer size="xlarge" />

        {/* Summary Card */}
        <Card style={styles.summaryCard} padding="medium">
          <Text variant="label" color="secondary">
            Summary
          </Text>
          <Spacer size="small" />
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.summaryText}>
              {formatDateDisplay(activeDate)}
              {applyToTomorrow && selectedDate === 'today' && ' + Tomorrow'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.summaryText}>
              {startTime} - {endTime}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons
              name={LOCATION_ICONS[selectedLocation]}
              size={16}
              color={LOCATION_COLORS[selectedLocation]}
            />
            <Text variant="bodySmall" style={styles.summaryText}>
              {selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)}
            </Text>
          </View>
        </Card>

        <Spacer size="xlarge" />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          title={currentSlot ? 'Update Slot' : 'Create Slot'}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          fullWidth
          size="large"
          leftIcon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
        />
        <Spacer size="small" />
        <Button
          title="Cancel"
          variant="tertiary"
          onPress={() => router.back()}
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  dateSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  dateOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  dateOptionSelected: {
    backgroundColor: BrandColors.primary,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dateText: {
    marginLeft: Spacing.sm,
  },
  currentSlotCard: {
    backgroundColor: '#F9FAFB',
  },
  currentSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  currentSlotLabel: {
    marginLeft: Spacing.xs,
  },
  currentSlotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentSlotInfo: {},
  currentSlotBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SemanticColors.warningBackground,
    borderColor: SemanticColors.warning,
    borderWidth: 1,
  },
  noSlotText: {
    marginLeft: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  locationGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  locationCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  locationCardDisabled: {
    opacity: 0.5,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  addressText: {
    marginLeft: Spacing.xs,
    flex: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
  },
  checkboxLabel: {
    marginLeft: Spacing.sm,
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderColor: BrandColors.primary,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryText: {
    marginLeft: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
});
