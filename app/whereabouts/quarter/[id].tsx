/**
 * Quarter Detail Screen
 * View and edit a specific quarter's whereabouts with calendar
 * Enhanced with pattern tools, location breakdown, and quick fill actions
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
  Text,
  Card,
  PressableCard,
  Button,
  StatusBadge,
  CompletionBadge,
  Badge,
  Spacer,
  Divider,
  EmptyState,
  LoadingState,
  Input,
} from '@/src/components/common';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppDispatch, RootState } from '@/src/store/store';
import { selectUser } from '@/src/store/slices/authSlice';
import {
  fetchQuarterAsync,
  fetchDailySlotsAsync,
  selectCurrentQuarter,
  selectCurrentQuarterSlots,
  selectWhereaboutsLoading,
  selectSlotsLoading,
  selectMissingDates,
  submitQuarterAsync,
  selectWhereaboutsSubmitting,
  applyPatternToQuarterAsync,
  extractPatternAsync,
  saveTemplateAsync,
  selectCurrentPattern,
  selectWhereaboutsSaving,
  selectCreationStep,
} from '@/src/store/slices/whereaboutsSlice';
import { QuarterStatus, CreateWeeklyTemplateDocument } from '@/src/types/firestore';
import type { SlotWithId } from '@/src/store/slices/whereaboutsSlice';
import { WeeklyPattern, DayOfWeek } from '@/src/types';

// Location type colors for visual distinction
const LOCATION_COLORS = {
  home: '#2196F3', // Blue
  training: '#4CAF50', // Green
  gym: '#FF9800', // Orange
};

// Calendar week structure
interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  slot?: SlotWithId;
  isToday: boolean;
}

export default function QuarterDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Redux state
  const user = useSelector(selectUser);
  const quarter = useSelector(selectCurrentQuarter);
  const slots = useSelector(selectCurrentQuarterSlots);
  const loading = useSelector(selectWhereaboutsLoading);
  const slotsLoading = useSelector(selectSlotsLoading);
  const missingDates = useSelector(selectMissingDates);
  const submitting = useSelector(selectWhereaboutsSubmitting);
  const currentPattern = useSelector(selectCurrentPattern);
  const saving = useSelector(selectWhereaboutsSaving);
  const creationStep = useSelector(selectCreationStep);

  // Local state
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = first month, 1 = second, 2 = third
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showPatternTools, setShowPatternTools] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isApplyingPattern, setIsApplyingPattern] = useState(false);

  // Fetch quarter and slots on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchQuarterAsync(id));
      dispatch(fetchDailySlotsAsync(id));
    }
  }, [dispatch, id]);

  // Extract pattern from quarter if it was created with one
  useEffect(() => {
    if (id && quarter && !currentPattern) {
      dispatch(extractPatternAsync(id));
    }
  }, [dispatch, id, quarter, currentPattern]);

  // Calculate location breakdown
  const locationBreakdown = useMemo(() => {
    const breakdown = {
      home: { count: 0, percentage: 0, color: LOCATION_COLORS.home },
      training: { count: 0, percentage: 0, color: LOCATION_COLORS.training },
      gym: { count: 0, percentage: 0, color: LOCATION_COLORS.gym },
      total: slots.length,
    };

    slots.forEach((slot) => {
      // Determine location type from slot data
      const locationType = slot.location_type || 'home';
      if (locationType === 'home') breakdown.home.count++;
      else if (locationType === 'training') breakdown.training.count++;
      else if (locationType === 'gym') breakdown.gym.count++;
    });

    if (breakdown.total > 0) {
      breakdown.home.percentage = (breakdown.home.count / breakdown.total) * 100;
      breakdown.training.percentage = (breakdown.training.count / breakdown.total) * 100;
      breakdown.gym.percentage = (breakdown.gym.count / breakdown.total) * 100;
    }

    return breakdown;
  }, [slots]);

  // Check if quarter has pattern (created with pattern or has extracted pattern)
  const hasPattern = useMemo(() => {
    return currentPattern !== null;
  }, [currentPattern]);

  // Handle apply pattern again
  const handleApplyPattern = useCallback(async (overwrite: boolean = false) => {
    if (!id || !user?.uid || !currentPattern) return;

    setIsApplyingPattern(true);
    try {
      await dispatch(applyPatternToQuarterAsync({
        quarterId: id,
        athleteId: user.uid,
        pattern: currentPattern,
        overwriteExisting: overwrite,
      })).unwrap();

      // Refresh slots after applying
      await dispatch(fetchDailySlotsAsync(id));

      Alert.alert(
        'Pattern Applied',
        overwrite
          ? 'Pattern has been applied to all days in the quarter.'
          : 'Pattern has been applied to remaining empty days.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to apply pattern. Please try again.');
    } finally {
      setIsApplyingPattern(false);
    }
  }, [dispatch, id, user?.uid, currentPattern]);

  // Handle fill remaining days
  const handleFillRemaining = useCallback(() => {
    Alert.alert(
      'Fill Remaining Days',
      `This will fill ${missingDates.length} remaining days with the weekly pattern.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Fill Days', onPress: () => handleApplyPattern(false) },
      ]
    );
  }, [handleApplyPattern, missingDates.length]);

  // Handle apply pattern to all (with overwrite)
  const handleApplyPatternAll = useCallback(() => {
    Alert.alert(
      'Apply Pattern to All Days',
      'This will overwrite all existing slots with the weekly pattern. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply to All', style: 'destructive', onPress: () => handleApplyPattern(true) },
      ]
    );
  }, [handleApplyPattern]);

  // Handle save as template
  const handleSaveAsTemplate = useCallback(async () => {
    if (!user?.uid || !currentPattern || !templateName.trim()) return;

    try {
      // Convert WeeklyPattern to template format
      const templateData: CreateWeeklyTemplateDocument = {
        athlete_id: user.uid,
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        is_default: false,
        usage_count: 0,
        monday: {
          slot_60min: {
            start_time: currentPattern.monday.time_start,
            end_time: currentPattern.monday.time_end,
            location_id: `${currentPattern.monday.location_type}:${user.uid}`,
          },
        },
        tuesday: {
          slot_60min: {
            start_time: currentPattern.tuesday.time_start,
            end_time: currentPattern.tuesday.time_end,
            location_id: `${currentPattern.tuesday.location_type}:${user.uid}`,
          },
        },
        wednesday: {
          slot_60min: {
            start_time: currentPattern.wednesday.time_start,
            end_time: currentPattern.wednesday.time_end,
            location_id: `${currentPattern.wednesday.location_type}:${user.uid}`,
          },
        },
        thursday: {
          slot_60min: {
            start_time: currentPattern.thursday.time_start,
            end_time: currentPattern.thursday.time_end,
            location_id: `${currentPattern.thursday.location_type}:${user.uid}`,
          },
        },
        friday: {
          slot_60min: {
            start_time: currentPattern.friday.time_start,
            end_time: currentPattern.friday.time_end,
            location_id: `${currentPattern.friday.location_type}:${user.uid}`,
          },
        },
        saturday: {
          slot_60min: {
            start_time: currentPattern.saturday.time_start,
            end_time: currentPattern.saturday.time_end,
            location_id: `${currentPattern.saturday.location_type}:${user.uid}`,
          },
        },
        sunday: {
          slot_60min: {
            start_time: currentPattern.sunday.time_start,
            end_time: currentPattern.sunday.time_end,
            location_id: `${currentPattern.sunday.location_type}:${user.uid}`,
          },
        },
      };

      await dispatch(saveTemplateAsync(templateData)).unwrap();

      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');

      Alert.alert('Success', 'Pattern saved as template successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save template. Please try again.');
    }
  }, [dispatch, user?.uid, currentPattern, templateName, templateDescription]);

  // Calculate quarter months
  const quarterMonths = useMemo(() => {
    if (!quarter) return [];
    const startDate = new Date(quarter.start_date);
    const months: { month: number; year: number; name: string }[] = [];

    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      months.push({
        month: monthDate.getMonth(),
        year: monthDate.getFullYear(),
        name: monthDate.toLocaleDateString('en-US', { month: 'long' }),
      });
    }
    return months;
  }, [quarter]);

  // Build calendar grid for selected month
  const calendarWeeks = useMemo((): CalendarWeek[] => {
    if (!quarter || quarterMonths.length === 0) return [];

    const { month, year } = quarterMonths[selectedMonth] || quarterMonths[0];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks: CalendarWeek[] = [];
    let currentWeek: CalendarDay[] = [];
    let weekNumber = 1;

    // Create slots lookup map
    const slotsMap = new Map<string, SlotWithId>();
    slots.forEach((slot) => {
      slotsMap.set(slot.date, slot);
    });

    // Fill in days before first of month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, 1 - (firstDayOfWeek - i));
      const dateStr = prevDate.toISOString().split('T')[0];
      currentWeek.push({
        date: prevDate,
        dateStr,
        dayOfMonth: prevDate.getDate(),
        isCurrentMonth: false,
        slot: slotsMap.get(dateStr),
        isToday: false,
      });
    }

    // Fill in days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];

      currentWeek.push({
        date,
        dateStr,
        dayOfMonth: day,
        isCurrentMonth: true,
        slot: slotsMap.get(dateStr),
        isToday: date.getTime() === today.getTime(),
      });

      if (currentWeek.length === 7) {
        weeks.push({ weekNumber, days: currentWeek });
        currentWeek = [];
        weekNumber++;
      }
    }

    // Fill in remaining days
    if (currentWeek.length > 0) {
      const remaining = 7 - currentWeek.length;
      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(year, month + 1, i);
        const dateStr = nextDate.toISOString().split('T')[0];
        currentWeek.push({
          date: nextDate,
          dateStr,
          dayOfMonth: i,
          isCurrentMonth: false,
          slot: slotsMap.get(dateStr),
          isToday: false,
        });
      }
      weeks.push({ weekNumber, days: currentWeek });
    }

    return weeks;
  }, [quarter, quarterMonths, selectedMonth, slots]);

  // Format date range
  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Handle day press
  const handleDayPress = useCallback((day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    // Navigate to day edit screen
    router.push({
      pathname: '/whereabouts/quick-update',
      params: { date: day.dateStr },
    });
  }, []);

  // Handle submit quarter
  const handleSubmit = useCallback(async () => {
    if (!id) return;
    await dispatch(submitQuarterAsync(id));
  }, [dispatch, id]);

  // Get slot status indicator
  const getSlotStatus = (slot?: SlotWithId) => {
    if (!slot) return 'empty';
    if (slot.is_complete) return 'complete';
    return 'partial';
  };

  // Render day cell
  const renderDayCell = (day: CalendarDay) => {
    const status = getSlotStatus(day.slot);

    return (
      <Pressable
        key={day.dateStr}
        style={[
          styles.dayCell,
          !day.isCurrentMonth && styles.dayCellOutside,
          day.isToday && styles.dayCellToday,
        ]}
        onPress={() => handleDayPress(day)}
        disabled={!day.isCurrentMonth}
      >
        <Text
          variant="bodySmall"
          customColor={
            !day.isCurrentMonth
              ? colors.textDisabled
              : day.isToday
              ? BrandColors.primary
              : colors.textPrimary
          }
        >
          {day.dayOfMonth}
        </Text>
        {day.isCurrentMonth && (
          <View
            style={[
              styles.slotIndicator,
              status === 'complete' && styles.slotComplete,
              status === 'partial' && styles.slotPartial,
              status === 'empty' && styles.slotEmpty,
            ]}
          />
        )}
      </Pressable>
    );
  };

  if (loading || !quarter) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading quarter..." />
      </View>
    );
  }

  const completionPercentage = quarter.completion_percentage || 0;
  const isComplete = completionPercentage >= 100;
  const canSubmit = isComplete && quarter.status !== 'submitted' && quarter.status !== 'locked';

  return (
    <>
      <Stack.Screen
        options={{
          title: `${quarter.year} ${quarter.quarter}`,
          headerRight: () => (
            <Pressable
              onPress={() => {}}
              hitSlop={8}
              style={{ marginRight: Spacing.sm }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={BrandColors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card padding="large" style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text variant="h3">
                {quarter.year} {quarter.quarter}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {formatDateRange(quarter.start_date, quarter.end_date)}
              </Text>
            </View>
            <StatusBadge status={quarter.status as 'draft' | 'submitted' | 'complete' | 'incomplete'} />
          </View>

          <Spacer size="medium" />

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="bodySmall" color="secondary">
                Overall Progress
              </Text>
              <CompletionBadge percentage={completionPercentage} />
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${completionPercentage}%`,
                    backgroundColor: isComplete ? SemanticColors.success : BrandColors.primary,
                  },
                ]}
              />
            </View>
            <Text variant="caption" color="tertiary">
              {quarter.days_completed || 0} of {quarter.total_days || 90} days have 60-minute slots
            </Text>
          </View>

          {/* Missing days warning */}
          {missingDates.length > 0 && (
            <>
              <Spacer size="medium" />
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={18} color={SemanticColors.warning} />
                <Text variant="bodySmall" customColor={SemanticColors.warning}>
                  {missingDates.length} {missingDates.length === 1 ? 'day is' : 'days are'} missing required slots
                </Text>
              </View>
            </>
          )}

          {/* Location Breakdown */}
          {locationBreakdown.total > 0 && (
            <>
              <Spacer size="medium" />
              <Divider />
              <Spacer size="medium" />
              <View style={styles.locationBreakdownSection}>
                <Text variant="label" color="secondary" style={styles.sectionLabel}>
                  Location Breakdown
                </Text>

                {/* Stacked progress bar */}
                <View style={styles.locationBreakdownBar}>
                  {locationBreakdown.home.percentage > 0 && (
                    <View
                      style={[
                        styles.locationSegment,
                        {
                          width: `${locationBreakdown.home.percentage}%`,
                          backgroundColor: LOCATION_COLORS.home,
                        },
                      ]}
                    />
                  )}
                  {locationBreakdown.training.percentage > 0 && (
                    <View
                      style={[
                        styles.locationSegment,
                        {
                          width: `${locationBreakdown.training.percentage}%`,
                          backgroundColor: LOCATION_COLORS.training,
                        },
                      ]}
                    />
                  )}
                  {locationBreakdown.gym.percentage > 0 && (
                    <View
                      style={[
                        styles.locationSegment,
                        {
                          width: `${locationBreakdown.gym.percentage}%`,
                          backgroundColor: LOCATION_COLORS.gym,
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Legend */}
                <View style={styles.locationBreakdownLegend}>
                  <View style={styles.locationLegendItem}>
                    <View style={[styles.locationDot, { backgroundColor: LOCATION_COLORS.home }]} />
                    <Text variant="caption" color="secondary">
                      Home ({locationBreakdown.home.count})
                    </Text>
                  </View>
                  <View style={styles.locationLegendItem}>
                    <View style={[styles.locationDot, { backgroundColor: LOCATION_COLORS.training }]} />
                    <Text variant="caption" color="secondary">
                      Training ({locationBreakdown.training.count})
                    </Text>
                  </View>
                  <View style={styles.locationLegendItem}>
                    <View style={[styles.locationDot, { backgroundColor: LOCATION_COLORS.gym }]} />
                    <Text variant="caption" color="secondary">
                      Gym ({locationBreakdown.gym.count})
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Pattern Tools Section */}
        {hasPattern && (
          <Card padding="medium" style={styles.patternToolsCard}>
            <Pressable
              style={styles.patternToolsHeader}
              onPress={() => setShowPatternTools(!showPatternTools)}
            >
              <View style={styles.patternToolsTitleRow}>
                <View style={styles.patternToolsIcon}>
                  <Ionicons name="grid-outline" size={20} color={BrandColors.primary} />
                </View>
                <View>
                  <Text variant="label" bold>Pattern Tools</Text>
                  <Text variant="caption" color="secondary">
                    Apply weekly pattern to fill days
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showPatternTools ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </Pressable>

            {showPatternTools && (
              <View style={styles.patternToolsContent}>
                <Divider style={styles.patternToolsDivider} />

                {/* Fill Remaining Days */}
                {missingDates.length > 0 && (
                  <Pressable
                    style={styles.patternToolAction}
                    onPress={handleFillRemaining}
                    disabled={isApplyingPattern}
                  >
                    <View style={[styles.patternToolActionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                      <Ionicons name="add-circle-outline" size={20} color={SemanticColors.success} />
                    </View>
                    <View style={styles.patternToolActionContent}>
                      <Text variant="body" bold>Fill Remaining Days</Text>
                      <Text variant="caption" color="secondary">
                        Fill {missingDates.length} empty days with pattern
                      </Text>
                    </View>
                    {isApplyingPattern ? (
                      <ActivityIndicator size="small" color={BrandColors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    )}
                  </Pressable>
                )}

                {/* Apply Pattern to All */}
                <Pressable
                  style={styles.patternToolAction}
                  onPress={handleApplyPatternAll}
                  disabled={isApplyingPattern}
                >
                  <View style={[styles.patternToolActionIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
                    <Ionicons name="refresh-outline" size={20} color={BrandColors.primary} />
                  </View>
                  <View style={styles.patternToolActionContent}>
                    <Text variant="body" bold>Apply Pattern to All</Text>
                    <Text variant="caption" color="secondary">
                      Overwrite all days with pattern
                    </Text>
                  </View>
                  {isApplyingPattern ? (
                    <ActivityIndicator size="small" color={BrandColors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  )}
                </Pressable>

                {/* Save as Template */}
                <Pressable
                  style={styles.patternToolAction}
                  onPress={() => setShowSaveTemplateModal(true)}
                >
                  <View style={[styles.patternToolActionIcon, { backgroundColor: 'rgba(0, 206, 209, 0.1)' }]}>
                    <Ionicons name="bookmark-outline" size={20} color={BrandColors.secondary} />
                  </View>
                  <View style={styles.patternToolActionContent}>
                    <Text variant="body" bold>Save as Template</Text>
                    <Text variant="caption" color="secondary">
                      Reuse this pattern for future quarters
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </Pressable>

                {/* View/Edit Pattern */}
                <Pressable
                  style={styles.patternToolAction}
                  onPress={() => router.push('/whereabouts/templates')}
                >
                  <View style={[styles.patternToolActionIcon, { backgroundColor: 'rgba(156, 163, 175, 0.1)' }]}>
                    <Ionicons name="eye-outline" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.patternToolActionContent}>
                    <Text variant="body" bold>Manage Templates</Text>
                    <Text variant="caption" color="secondary">
                      View and edit saved templates
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            )}
          </Card>
        )}

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          {quarterMonths.map((m, index) => (
            <Pressable
              key={index}
              style={[
                styles.monthTab,
                selectedMonth === index && styles.monthTabActive,
              ]}
              onPress={() => setSelectedMonth(index)}
            >
              <Text
                variant="label"
                customColor={selectedMonth === index ? BrandColors.primary : colors.textSecondary}
              >
                {m.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Calendar View */}
        <Card padding="medium" style={styles.calendarCard}>
          {/* Day headers */}
          <View style={styles.calendarHeader}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <View key={i} style={styles.dayHeader}>
                <Text variant="caption" color="tertiary">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar weeks */}
          {slotsLoading ? (
            <View style={styles.calendarLoading}>
              <ActivityIndicator size="small" color={BrandColors.primary} />
            </View>
          ) : (
            calendarWeeks.map((week) => (
              <View key={week.weekNumber} style={styles.calendarRow}>
                {week.days.map((day) => renderDayCell(day))}
              </View>
            ))
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.slotComplete]} />
              <Text variant="caption" color="secondary">Complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.slotPartial]} />
              <Text variant="caption" color="secondary">Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.slotEmpty]} />
              <Text variant="caption" color="secondary">Missing</Text>
            </View>
          </View>
        </Card>

        <Spacer size="large" />

        {/* Quick Actions */}
        <Text variant="h5" style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.quickActions}>
          <PressableCard
            style={styles.quickAction}
            onPress={() => router.push('/whereabouts/quick-update')}
            padding="medium"
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: 'rgba(0, 102, 204, 0.1)' },
              ]}
            >
              <Ionicons name="flash" size={24} color={BrandColors.primary} />
            </View>
            <Text variant="label">Quick Update</Text>
          </PressableCard>

          <PressableCard
            style={styles.quickAction}
            onPress={() => router.push('/whereabouts/templates')}
            padding="medium"
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: 'rgba(0, 206, 209, 0.1)' },
              ]}
            >
              <Ionicons name="bookmark" size={24} color={BrandColors.secondary} />
            </View>
            <Text variant="label">Templates</Text>
          </PressableCard>
        </View>

        <Spacer size="xlarge" />

        {/* Submit Button */}
        {canSubmit && (
          <Button
            title="Review & Submit"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            fullWidth
            size="large"
            rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          />
        )}

        {quarter.status === 'submitted' && (
          <Card style={styles.submittedCard} padding="medium">
            <View style={styles.submittedContent}>
              <Ionicons name="checkmark-circle" size={24} color={SemanticColors.success} />
              <View style={styles.submittedText}>
                <Text variant="body" bold>Quarter Submitted</Text>
                <Text variant="caption" color="secondary">
                  Your whereabouts have been submitted for this quarter.
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Save Template Modal */}
      <Modal
        visible={showSaveTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.md }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text variant="h4">Save as Template</Text>
              <Pressable
                onPress={() => setShowSaveTemplateModal(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <Spacer size="medium" />

            {/* Template Name */}
            <Input
              label="Template Name"
              placeholder="e.g., Regular Training Week"
              value={templateName}
              onChangeText={setTemplateName}
            />

            <Spacer size="medium" />

            {/* Template Description */}
            <Input
              label="Description (optional)"
              placeholder="Brief description of this pattern"
              value={templateDescription}
              onChangeText={setTemplateDescription}
              multiline
              numberOfLines={3}
            />

            <Spacer size="large" />

            {/* Pattern Preview */}
            {currentPattern && (
              <View style={styles.templatePreview}>
                <Text variant="label" color="secondary" style={styles.sectionLabel}>
                  Pattern Preview
                </Text>
                <View style={styles.patternPreviewRow}>
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => {
                    const locationType = currentPattern[day]?.location_type || 'home';
                    return (
                      <View key={day} style={styles.patternPreviewDay}>
                        <View
                          style={[
                            styles.patternPreviewDot,
                            { backgroundColor: LOCATION_COLORS[locationType] },
                          ]}
                        />
                        <Text variant="caption" color="tertiary">
                          {day.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <Spacer size="large" />

            {/* Actions */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowSaveTemplateModal(false)}
                style={{ flex: 1 }}
              />
              <Spacer horizontal size="small" />
              <Button
                title="Save Template"
                onPress={handleSaveAsTemplate}
                loading={saving}
                disabled={!templateName.trim() || saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: SemanticColors.warningBackground,
    borderRadius: BorderRadius.sm,
  },
  monthSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  monthTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  monthTabActive: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  calendarCard: {
    marginBottom: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
  dayCellOutside: {
    opacity: 0.4,
  },
  dayCellToday: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: BorderRadius.sm,
  },
  slotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  slotComplete: {
    backgroundColor: SemanticColors.success,
  },
  slotPartial: {
    backgroundColor: SemanticColors.warning,
  },
  slotEmpty: {
    backgroundColor: '#E5E7EB',
  },
  calendarLoading: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  submittedCard: {
    backgroundColor: SemanticColors.successBackground,
    borderColor: SemanticColors.success,
    borderWidth: 1,
  },
  submittedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  submittedText: {
    flex: 1,
  },
  // Location Breakdown Styles
  locationBreakdownSection: {
    gap: Spacing.sm,
  },
  locationBreakdownBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  locationSegment: {
    height: '100%',
  },
  locationBreakdownLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  locationLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Pattern Tools Styles
  patternToolsCard: {
    marginBottom: Spacing.md,
  },
  patternToolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternToolsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  patternToolsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternToolsContent: {
    marginTop: Spacing.sm,
  },
  patternToolsDivider: {
    marginBottom: Spacing.sm,
  },
  patternToolAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  patternToolActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternToolActionContent: {
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  templatePreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  patternPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  patternPreviewDay: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  patternPreviewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
});
