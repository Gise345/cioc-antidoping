/**
 * Quarter Builder Utility
 * Generates daily slots from weekly patterns for a quarter
 */

import {
  WeeklyPattern,
  DaySlotPattern,
  DayOfWeek,
  DailySlotSelection,
  Competition,
  Quarter,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface QuarterDates {
  startDate: Date;
  endDate: Date;
  filingDeadline: Date;
  totalDays: number;
}

export interface LocationInfo {
  id: string;
  name: string;
  address?: string;
}

export interface LocationResolver {
  home: LocationInfo | null;
  training: LocationInfo | null;
  gym: LocationInfo | null;
}

export interface GenerateOptions {
  pattern: WeeklyPattern;
  quarterStartDate: Date;
  quarterEndDate: Date;
  competitions?: Competition[];
  locations?: LocationResolver;
  athleteId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const QUARTER_CONFIG: Record<Quarter, { startMonth: number; endMonth: number }> = {
  Q1: { startMonth: 0, endMonth: 2 },   // Jan-Mar
  Q2: { startMonth: 3, endMonth: 5 },   // Apr-Jun
  Q3: { startMonth: 6, endMonth: 8 },   // Jul-Sep
  Q4: { startMonth: 9, endMonth: 11 },  // Oct-Dec
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a date to ISO string (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse ISO date string to Date object
 */
export const parseISODate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Get day of week from a date
 */
export const getDayOfWeek = (date: Date): DayOfWeek => {
  return DAY_OF_WEEK_MAP[date.getDay()];
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculate the number of days between two dates (inclusive)
 */
export const daysBetween = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// ============================================================================
// QUARTER DATE FUNCTIONS
// ============================================================================

/**
 * Calculate quarter start and end dates
 */
export const calculateQuarterDates = (year: number, quarter: Quarter): QuarterDates => {
  const config = QUARTER_CONFIG[quarter];

  const startDate = new Date(year, config.startMonth, 1);
  const endDate = new Date(year, config.endMonth + 1, 0); // Last day of end month

  // Filing deadline is 15 days before quarter start
  const filingDeadline = addDays(startDate, -15);

  const totalDays = daysBetween(startDate, endDate);

  return {
    startDate,
    endDate,
    filingDeadline,
    totalDays,
  };
};

/**
 * Get current quarter info
 */
export const getCurrentQuarterInfo = (): { year: number; quarter: Quarter } => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let quarter: Quarter;
  if (month <= 2) quarter = 'Q1';
  else if (month <= 5) quarter = 'Q2';
  else if (month <= 8) quarter = 'Q3';
  else quarter = 'Q4';

  return { year, quarter };
};

/**
 * Get next quarter info
 */
export const getNextQuarterInfo = (): { year: number; quarter: Quarter } => {
  const { year, quarter } = getCurrentQuarterInfo();
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarters.indexOf(quarter);

  if (currentIndex === 3) {
    return { year: year + 1, quarter: 'Q1' };
  }
  return { year, quarter: quarters[currentIndex + 1] };
};

// ============================================================================
// PATTERN APPLICATION
// ============================================================================

/**
 * Check if a date falls within a competition
 */
export const isCompetitionDate = (
  date: Date,
  competitions: Competition[]
): Competition | undefined => {
  const dateStr = formatDateISO(date);

  return competitions.find((comp) => {
    const compStart = parseISODate(comp.start_date);
    const compEnd = parseISODate(comp.end_date);
    return date >= compStart && date <= compEnd;
  });
};

/**
 * Generate daily slots from a weekly pattern
 */
export const generateDailySlotsFromPattern = (
  options: GenerateOptions
): DailySlotSelection[] => {
  const {
    pattern,
    quarterStartDate,
    quarterEndDate,
    competitions = [],
    locations,
    athleteId,
  } = options;

  const slots: DailySlotSelection[] = [];
  const currentDate = new Date(quarterStartDate);

  while (currentDate <= quarterEndDate) {
    const dayOfWeek = getDayOfWeek(currentDate);
    const dayPattern = pattern[dayOfWeek];
    const dateStr = formatDateISO(currentDate);

    // Check if this date is during a competition
    const competition = isCompetitionDate(currentDate, competitions);

    // Get location info if resolver provided
    let locationName: string | undefined;
    let locationAddress: string | undefined;

    if (locations) {
      const locationInfo = locations[dayPattern.location_type];
      if (locationInfo) {
        locationName = locationInfo.name;
        locationAddress = locationInfo.address;
      }
    }

    // Create the slot
    const slot: DailySlotSelection = {
      date: dateStr,
      location_type: competition ? 'training' : dayPattern.location_type, // Competition days default to training
      time_start: dayPattern.time_start,
      time_end: dayPattern.time_end,
      location_name: competition ? competition.location_address : locationName,
      location_address: locationAddress,
      is_competition: !!competition,
      competition_id: competition?.id,
      notes: competition ? `Competition: ${competition.name}` : undefined,
    };

    slots.push(slot);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};

/**
 * Apply a template pattern to a quarter
 * Returns the generated daily slots
 */
export const applyTemplateToQuarter = (
  pattern: WeeklyPattern,
  year: number,
  quarter: Quarter,
  competitions: Competition[] = [],
  locations?: LocationResolver
): DailySlotSelection[] => {
  const { startDate, endDate } = calculateQuarterDates(year, quarter);

  return generateDailySlotsFromPattern({
    pattern,
    quarterStartDate: startDate,
    quarterEndDate: endDate,
    competitions,
    locations,
  });
};

// ============================================================================
// SLOT ANALYSIS
// ============================================================================

/**
 * Calculate completion statistics for a set of slots
 */
export const calculateSlotStats = (
  slots: DailySlotSelection[],
  totalDays: number
): {
  completedDays: number;
  completionPercentage: number;
  missingDays: number;
  competitionDays: number;
  locationBreakdown: Record<string, number>;
} => {
  const completedDays = slots.length;
  const completionPercentage = Math.round((completedDays / totalDays) * 100);
  const missingDays = totalDays - completedDays;
  const competitionDays = slots.filter((s) => s.is_competition).length;

  const locationBreakdown: Record<string, number> = {
    home: 0,
    training: 0,
    gym: 0,
  };

  slots.forEach((slot) => {
    if (locationBreakdown[slot.location_type] !== undefined) {
      locationBreakdown[slot.location_type]++;
    }
  });

  return {
    completedDays,
    completionPercentage,
    missingDays,
    competitionDays,
    locationBreakdown,
  };
};

/**
 * Find missing dates in a quarter
 */
export const findMissingDates = (
  slots: DailySlotSelection[],
  year: number,
  quarter: Quarter
): string[] => {
  const { startDate, endDate } = calculateQuarterDates(year, quarter);
  const filledDates = new Set(slots.map((s) => s.date));
  const missingDates: string[] = [];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = formatDateISO(currentDate);
    if (!filledDates.has(dateStr)) {
      missingDates.push(dateStr);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return missingDates;
};

/**
 * Group slots by week
 */
export const groupSlotsByWeek = (
  slots: DailySlotSelection[]
): Map<number, DailySlotSelection[]> => {
  const weekMap = new Map<number, DailySlotSelection[]>();

  slots.forEach((slot) => {
    const date = parseISODate(slot.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.getTime();

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(slot);
  });

  return weekMap;
};

/**
 * Group slots by month
 */
export const groupSlotsByMonth = (
  slots: DailySlotSelection[]
): Map<string, DailySlotSelection[]> => {
  const monthMap = new Map<string, DailySlotSelection[]>();

  slots.forEach((slot) => {
    const date = parseISODate(slot.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(slot);
  });

  return monthMap;
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a time slot (must be 60 minutes)
 */
export const validateSlotDuration = (
  startTime: string,
  endTime: string
): boolean => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes === 60;
};

/**
 * Validate a weekly pattern
 */
export const validateWeeklyPattern = (
  pattern: WeeklyPattern
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const days: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  days.forEach((day) => {
    const dayPattern = pattern[day];

    if (!dayPattern) {
      errors.push(`Missing pattern for ${day}`);
      return;
    }

    if (!dayPattern.location_type) {
      errors.push(`Missing location type for ${day}`);
    }

    if (!dayPattern.time_start || !dayPattern.time_end) {
      errors.push(`Missing time for ${day}`);
    } else if (!validateSlotDuration(dayPattern.time_start, dayPattern.time_end)) {
      errors.push(`${day} slot must be exactly 60 minutes`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  formatDateISO,
  parseISODate,
  getDayOfWeek,
  addDays,
  daysBetween,
  calculateQuarterDates,
  getCurrentQuarterInfo,
  getNextQuarterInfo,
  isCompetitionDate,
  generateDailySlotsFromPattern,
  applyTemplateToQuarter,
  calculateSlotStats,
  findMissingDates,
  groupSlotsByWeek,
  groupSlotsByMonth,
  validateSlotDuration,
  validateWeeklyPattern,
};
