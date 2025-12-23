/**
 * QuarterCalendar Component
 * Calendar view for a quarter's whereabouts with 3-month tabs
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card, Badge } from '@/src/components/common';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Daily slot structure
 */
export interface DailySlot {
  id: string;
  date: string; // YYYY-MM-DD
  time_start: string; // HH:mm
  time_end: string; // HH:mm
  location_type: 'home' | 'training' | 'gym' | 'competition' | 'other';
  location_name?: string;
  is_complete: boolean;
  is_competition?: boolean;
  competition_name?: string;
}

/**
 * Quarter info
 */
export interface QuarterInfo {
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  start_date: string;
  end_date: string;
}

interface QuarterCalendarProps {
  quarterInfo: QuarterInfo;
  dailySlots: DailySlot[];
  onDayPress: (date: string, slot?: DailySlot) => void;
  editable?: boolean;
  competitions?: { date: string; name: string }[];
}

// Calendar day structure
interface CalendarDay {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isInQuarter: boolean;
  slot?: DailySlot;
  isCompetition?: boolean;
  competitionName?: string;
}

interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LOCATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  training: 'fitness',
  gym: 'barbell',
  competition: 'trophy',
  other: 'location',
};

const LOCATION_COLORS: Record<string, string> = {
  home: '#4CAF50',
  training: '#2196F3',
  gym: '#9C27B0',
  competition: '#F44336',
  other: '#9E9E9E',
};

/**
 * Format time for display (07:00 -> 7:00)
 */
const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  return `${hour}:${minutes}`;
};

/**
 * Get status color
 */
const getStatusColor = (slot?: DailySlot): string => {
  if (!slot) return '#E5E7EB'; // Gray - missing
  if (slot.is_complete) return SemanticColors.success; // Green - complete
  return SemanticColors.warning; // Orange - partial
};

/**
 * Day cell component
 */
function DayCell({
  day,
  onPress,
  editable,
  colors,
}: {
  day: CalendarDay;
  onPress: () => void;
  editable: boolean;
  colors: typeof LightColors | typeof DarkColors;
}) {
  const statusColor = getStatusColor(day.slot);
  const locationColor = day.slot
    ? LOCATION_COLORS[day.slot.location_type] || LOCATION_COLORS.other
    : '#9CA3AF';
  const locationIcon = day.slot
    ? LOCATION_ICONS[day.slot.location_type] || LOCATION_ICONS.other
    : 'time-outline';

  if (!day.isCurrentMonth) {
    return (
      <View style={[styles.dayCell, styles.dayCellOutside]}>
        <Text variant="caption" color="tertiary">
          {day.dayOfMonth}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      style={[
        styles.dayCell,
        day.isToday && styles.dayCellToday,
        day.isCompetition && styles.dayCellCompetition,
        !day.isInQuarter && styles.dayCellDisabled,
      ]}
      onPress={onPress}
      disabled={!editable || !day.isInQuarter}
    >
      {/* Date number */}
      <View style={styles.dayNumber}>
        <Text
          variant="bodySmall"
          bold={day.isToday}
          customColor={
            day.isToday
              ? BrandColors.primary
              : day.isCompetition
              ? SemanticColors.error
              : !day.isInQuarter
              ? colors.textDisabled
              : colors.textPrimary
          }
        >
          {day.dayOfMonth}
        </Text>
      </View>

      {/* Slot info */}
      {day.isInQuarter && (
        <View style={styles.dayContent}>
          {day.slot ? (
            <>
              {/* Time */}
              <Text
                variant="caption"
                customColor={colors.textSecondary}
                style={styles.slotTime}
                numberOfLines={1}
              >
                {formatTime(day.slot.time_start)}
              </Text>

              {/* Location icon */}
              <View style={[styles.locationIcon, { backgroundColor: `${locationColor}20` }]}>
                <Ionicons name={locationIcon} size={10} color={locationColor} />
              </View>
            </>
          ) : (
            <View style={styles.emptySlot}>
              <Ionicons name="add" size={12} color={colors.textTertiary} />
            </View>
          )}

          {/* Status dot */}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
      )}

      {/* Competition indicator */}
      {day.isCompetition && (
        <View style={styles.competitionBadge}>
          <Ionicons name="trophy" size={8} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

export function QuarterCalendar({
  quarterInfo,
  dailySlots,
  onDayPress,
  editable = true,
  competitions = [],
}: QuarterCalendarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  // State for selected month (0, 1, 2 for the 3 months in quarter)
  const [selectedMonth, setSelectedMonth] = useState(0);

  // Calculate quarter months
  const quarterMonths = useMemo(() => {
    const startDate = new Date(quarterInfo.start_date);
    const months: { month: number; year: number; name: string; shortName: string }[] = [];

    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      months.push({
        month: monthDate.getMonth(),
        year: monthDate.getFullYear(),
        name: monthDate.toLocaleDateString('en-US', { month: 'long' }),
        shortName: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return months;
  }, [quarterInfo.start_date]);

  // Create slots lookup map
  const slotsMap = useMemo(() => {
    const map = new Map<string, DailySlot>();
    dailySlots.forEach((slot) => {
      map.set(slot.date, slot);
    });
    return map;
  }, [dailySlots]);

  // Create competitions lookup map
  const competitionsMap = useMemo(() => {
    const map = new Map<string, string>();
    competitions.forEach((comp) => {
      map.set(comp.date, comp.name);
    });
    return map;
  }, [competitions]);

  // Quarter date range
  const quarterStart = new Date(quarterInfo.start_date);
  const quarterEnd = new Date(quarterInfo.end_date);

  // Build calendar grid for selected month
  const calendarWeeks = useMemo((): CalendarWeek[] => {
    if (quarterMonths.length === 0) return [];

    const { month, year } = quarterMonths[selectedMonth] || quarterMonths[0];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks: CalendarWeek[] = [];
    let currentWeek: CalendarDay[] = [];
    let weekNumber = 1;

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
        isToday: false,
        isInQuarter: prevDate >= quarterStart && prevDate <= quarterEnd,
        slot: slotsMap.get(dateStr),
      });
    }

    // Fill in days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isInQuarter = date >= quarterStart && date <= quarterEnd;
      const competitionName = competitionsMap.get(dateStr);

      currentWeek.push({
        date,
        dateStr,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isInQuarter,
        slot: slotsMap.get(dateStr),
        isCompetition: !!competitionName,
        competitionName,
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
          isToday: false,
          isInQuarter: nextDate >= quarterStart && nextDate <= quarterEnd,
          slot: slotsMap.get(dateStr),
        });
      }
      weeks.push({ weekNumber, days: currentWeek });
    }

    return weeks;
  }, [quarterMonths, selectedMonth, slotsMap, competitionsMap, quarterStart, quarterEnd]);

  // Calculate stats for selected month
  const monthStats = useMemo(() => {
    const { month, year } = quarterMonths[selectedMonth] || quarterMonths[0];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let totalDays = 0;
    let completeDays = 0;
    let partialDays = 0;
    let missingDays = 0;

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      if (date >= quarterStart && date <= quarterEnd) {
        totalDays++;
        const dateStr = date.toISOString().split('T')[0];
        const slot = slotsMap.get(dateStr);
        if (slot?.is_complete) {
          completeDays++;
        } else if (slot) {
          partialDays++;
        } else {
          missingDays++;
        }
      }
    }

    return { totalDays, completeDays, partialDays, missingDays };
  }, [quarterMonths, selectedMonth, slotsMap, quarterStart, quarterEnd]);

  // Handle day press
  const handleDayPress = useCallback(
    (day: CalendarDay) => {
      if (!day.isInQuarter) return;
      onDayPress(day.dateStr, day.slot);
    },
    [onDayPress]
  );

  return (
    <View style={styles.container}>
      {/* Month tabs */}
      <View style={styles.monthTabs}>
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
              customColor={
                selectedMonth === index ? BrandColors.primary : colors.textSecondary
              }
            >
              {m.shortName}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Month stats */}
      <View style={styles.monthStats}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: SemanticColors.success }]} />
          <Text variant="caption" color="secondary">
            {monthStats.completeDays} complete
          </Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: SemanticColors.warning }]} />
          <Text variant="caption" color="secondary">
            {monthStats.partialDays} partial
          </Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#E5E7EB' }]} />
          <Text variant="caption" color="secondary">
            {monthStats.missingDays} missing
          </Text>
        </View>
      </View>

      {/* Calendar grid */}
      <Card padding="small" style={styles.calendarCard}>
        {/* Weekday headers */}
        <View style={styles.weekdayHeader}>
          {WEEKDAY_LABELS.map((day, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text
                variant="caption"
                color="tertiary"
                center
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar weeks */}
        {calendarWeeks.map((week) => (
          <View key={week.weekNumber} style={styles.calendarRow}>
            {week.days.map((day) => (
              <DayCell
                key={day.dateStr}
                day={day}
                onPress={() => handleDayPress(day)}
                editable={editable}
                colors={colors}
              />
            ))}
          </View>
        ))}
      </Card>

      {/* Legend */}
      <View style={styles.legend}>
        <Text variant="caption" color="tertiary" style={styles.legendTitle}>
          Legend:
        </Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="home" size={10} color="#4CAF50" />
            </View>
            <Text variant="caption" color="secondary">Home</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#2196F320' }]}>
              <Ionicons name="fitness" size={10} color="#2196F3" />
            </View>
            <Text variant="caption" color="secondary">Training</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#9C27B020' }]}>
              <Ionicons name="barbell" size={10} color="#9C27B0" />
            </View>
            <Text variant="caption" color="secondary">Gym</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#F4433620' }]}>
              <Ionicons name="trophy" size={10} color="#F44336" />
            </View>
            <Text variant="caption" color="secondary">Competition</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthTabs: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
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
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendarCard: {
    marginBottom: Spacing.sm,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: Spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: Spacing.xs,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 0.85,
    padding: 2,
    borderRadius: BorderRadius.sm,
    margin: 1,
    backgroundColor: '#FFFFFF',
  },
  dayCellOutside: {
    opacity: 0.3,
    backgroundColor: 'transparent',
  },
  dayCellToday: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
  },
  dayCellCompetition: {
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  dayCellDisabled: {
    opacity: 0.5,
  },
  dayNumber: {
    alignItems: 'center',
    paddingTop: 2,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  slotTime: {
    fontSize: 8,
    lineHeight: 10,
  },
  locationIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  competitionBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SemanticColors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    paddingHorizontal: Spacing.sm,
  },
  legendTitle: {
    marginBottom: Spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default QuarterCalendar;
