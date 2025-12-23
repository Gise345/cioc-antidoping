/**
 * Create Quarter Screen - Multi-Step Wizard
 * Guides athletes through creating a quarterly whereabouts filing
 *
 * Steps:
 * 1. Select Quarter
 * 2. Choose Filing Method
 * 3. Build Weekly Pattern
 * 4. Review & Apply
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
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
  PressableCard,
  Button,
  Badge,
  Spacer,
  Divider,
} from '@/src/components/common';
import {
  PatternBuilder,
  createDefaultPattern,
} from '@/src/components/whereabouts';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Quarter,
  WeeklyPattern,
  DailySlotSelection,
  FilingMethod,
  QuarterFilingStep,
  DayOfWeek,
} from '@/src/types';
import { AppDispatch, RootState } from '@/src/store/store';
import { selectUser } from '@/src/store/slices/authSlice';
import {
  selectHomeLocation,
  selectTrainingLocation,
  selectGymLocation,
  selectHasMandatoryLocations,
  selectAllCompetitions,
} from '@/src/store/slices/locationsSlice';
import {
  createQuarterWithPatternAsync,
  fetchTemplatesAsync,
  selectSavedTemplates,
  selectQuarterCreationStatus,
  resetCreationState,
} from '@/src/store/slices/whereaboutsSlice';
import { QuarterName } from '@/src/types/firestore';
import { TemplateSelector, SavedTemplate } from '@/src/components/whereabouts';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getQuarterFromDate = (date: Date): { year: number; quarter: Quarter } => {
  const month = date.getMonth();
  const year = date.getFullYear();
  let quarter: Quarter = 'Q1';
  if (month >= 0 && month <= 2) quarter = 'Q1';
  else if (month >= 3 && month <= 5) quarter = 'Q2';
  else if (month >= 6 && month <= 8) quarter = 'Q3';
  else quarter = 'Q4';
  return { year, quarter };
};

const getNextQuarter = (): { year: number; quarter: Quarter } => {
  const today = new Date();
  const { year, quarter } = getQuarterFromDate(today);
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarters.indexOf(quarter);

  if (currentIndex === 3) {
    return { year: year + 1, quarter: 'Q1' };
  }
  return { year, quarter: quarters[currentIndex + 1] };
};

const getQuarterDates = (year: number, quarter: Quarter): { start: Date; end: Date } => {
  const quarterConfig = {
    Q1: { start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
    Q2: { start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
    Q3: { start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
    Q4: { start: new Date(year, 9, 1), end: new Date(year, 11, 31) },
  };
  return quarterConfig[quarter];
};

const getDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
};

const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDaysInQuarter = (year: number, quarter: Quarter): number => {
  const { start, end } = getQuarterDates(year, quarter);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// ============================================================================
// STEP COMPONENTS
// ============================================================================

// Step indicator component
function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: string[];
}) {
  return (
    <View style={stepStyles.container}>
      {steps.map((step, index) => (
        <View key={index} style={stepStyles.stepContainer}>
          <View
            style={[
              stepStyles.stepCircle,
              index < currentStep && stepStyles.stepCircleCompleted,
              index === currentStep && stepStyles.stepCircleActive,
            ]}
          >
            {index < currentStep ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text
                variant="caption"
                customColor={index === currentStep ? '#FFFFFF' : '#9CA3AF'}
              >
                {index + 1}
              </Text>
            )}
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                stepStyles.stepLine,
                index < currentStep && stepStyles.stepLineCompleted,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: BrandColors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: SemanticColors.success,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Spacing.xs,
  },
  stepLineCompleted: {
    backgroundColor: SemanticColors.success,
  },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateQuarterScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const user = useSelector(selectUser);
  const homeLocation = useSelector(selectHomeLocation);
  const trainingLocation = useSelector(selectTrainingLocation);
  const gymLocation = useSelector(selectGymLocation);
  const hasMandatoryLocations = useSelector(selectHasMandatoryLocations);
  const competitions = useSelector(selectAllCompetitions);
  const savedTemplates = useSelector(selectSavedTemplates);
  const isSaving = useSelector(selectWhereaboutsSaving);
  const creationStatus = useSelector(selectQuarterCreationStatus);

  // Local state
  const currentQuarter = getQuarterFromDate(new Date());
  const nextQuarter = getNextQuarter();

  const [step, setStep] = useState(0);
  const [selectedYear, setSelectedYear] = useState(nextQuarter.year);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(nextQuarter.quarter);
  const [filingMethod, setFilingMethod] = useState<FilingMethod | null>(null);
  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPattern>(createDefaultPattern());
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchTemplatesAsync(user.uid));
    }
    // Clean up creation state when leaving
    return () => {
      dispatch(resetCreationState());
    };
  }, [user?.uid, dispatch]);

  const quarterDates = getQuarterDates(selectedYear, selectedQuarter);
  const daysInQuarter = getDaysInQuarter(selectedYear, selectedQuarter);

  const steps = ['Quarter', 'Method', 'Pattern', 'Review'];

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if user can proceed based on current step
  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return filingMethod !== null;
      case 2:
        return weeklyPattern !== null;
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, filingMethod, weeklyPattern]);

  // Generate daily slots from weekly pattern
  const generateDailySlots = useCallback((): DailySlotSelection[] => {
    const slots: DailySlotSelection[] = [];
    const { start, end } = quarterDates;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = getDayOfWeek(currentDate);
      const dayPattern = weeklyPattern[dayOfWeek];
      const dateStr = formatDateISO(currentDate);

      // Check if this date is a competition
      const competition = competitions.find((comp) => {
        const compStart = new Date(comp.start_date);
        const compEnd = new Date(comp.end_date);
        return currentDate >= compStart && currentDate <= compEnd;
      });

      slots.push({
        date: dateStr,
        location_type: dayPattern.location_type,
        time_start: dayPattern.time_start,
        time_end: dayPattern.time_end,
        is_competition: !!competition,
        competition_id: competition?.id,
        notes: competition ? `Competition: ${competition.name}` : undefined,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }, [quarterDates, weeklyPattern, competitions]);

  // Handle step navigation
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // Handle filing method selection
  const handleMethodSelect = (method: FilingMethod) => {
    setFilingMethod(method);

    if (method === 'use_template') {
      // Show template selector
      setShowTemplateSelector(true);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: SavedTemplate) => {
    setWeeklyPattern(template.pattern);
    setShowTemplateSelector(false);
    // Auto-advance to next step after selecting template
    handleNext();
  };

  // Get location ID from location type (uses athleteId + type as unique ID)
  const getLocationId = useCallback(
    (locationType: 'home' | 'training' | 'gym'): string => {
      if (!user?.uid) return '';
      // Location ID is the combination of type and athlete ID (matches Firestore structure)
      return `${locationType}:${user.uid}`;
    },
    [user?.uid]
  );

  // Get location name from location type
  const getLocationName = useCallback(
    (locationType: 'home' | 'training' | 'gym'): string => {
      switch (locationType) {
        case 'home':
          return 'Home';
        case 'training':
          return 'Training Facility';
        case 'gym':
          return 'Gym';
        default:
          return '';
      }
    },
    []
  );

  // Get location address from location type
  const getLocationAddress = useCallback(
    (locationType: 'home' | 'training' | 'gym'): string | undefined => {
      let location: typeof homeLocation = null;
      switch (locationType) {
        case 'home':
          location = homeLocation;
          break;
        case 'training':
          location = trainingLocation;
          break;
        case 'gym':
          location = gymLocation;
          break;
      }

      if (!location) return undefined;

      // Construct address from components
      const parts = [
        location.address_line1,
        location.address_line2,
        location.city,
        location.country,
      ].filter(Boolean);

      return parts.join(', ');
    },
    [homeLocation, trainingLocation, gymLocation]
  );

  // Handle apply pattern and create quarter
  const handleApplyPattern = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to create a quarter.');
      return;
    }

    try {
      // Use the pattern-based quarter creation thunk
      const result = await dispatch(
        createQuarterWithPatternAsync({
          athleteId: user.uid,
          year: selectedYear,
          quarter: selectedQuarter as QuarterName,
          pattern: weeklyPattern,
          competitions: competitions,
        })
      );

      if (!createQuarterWithPatternAsync.fulfilled.match(result)) {
        throw new Error('Failed to create quarter');
      }

      const { quarter, slotsCreated } = result.payload;

      // Show success message
      Alert.alert(
        'Quarter Created',
        `Successfully created ${selectedYear} ${selectedQuarter} with ${slotsCreated} daily slots.`,
        [
          {
            text: 'View Calendar',
            onPress: () => router.replace(`/whereabouts/quarter/${quarter.id}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error applying pattern:', error);
      Alert.alert('Error', 'Failed to create quarter. Please try again.');
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return renderQuarterSelection();
      case 1:
        return renderMethodSelection();
      case 2:
        return renderPatternBuilder();
      case 3:
        return renderReview();
      default:
        return null;
    }
  };

  // Step 1: Quarter Selection
  const renderQuarterSelection = () => (
    <View style={styles.stepContent}>
      <Text variant="h4" style={styles.sectionTitle}>
        Select Quarter
      </Text>

      <View style={styles.quarterGrid}>
        {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q) => {
          const isSelected = selectedQuarter === q && selectedYear === nextQuarter.year;
          const isPast =
            selectedYear < currentQuarter.year ||
            (selectedYear === currentQuarter.year &&
              ['Q1', 'Q2', 'Q3', 'Q4'].indexOf(q) <
                ['Q1', 'Q2', 'Q3', 'Q4'].indexOf(currentQuarter.quarter));

          return (
            <Pressable
              key={q}
              style={[
                styles.quarterOption,
                isSelected && styles.quarterOptionSelected,
                isPast && styles.quarterOptionDisabled,
              ]}
              onPress={() => {
                if (!isPast) {
                  setSelectedQuarter(q);
                  setSelectedYear(nextQuarter.year);
                }
              }}
              disabled={isPast}
            >
              <Text
                variant="h5"
                customColor={
                  isSelected
                    ? BrandColors.primary
                    : isPast
                    ? colors.textDisabled
                    : colors.textPrimary
                }
              >
                {q}
              </Text>
              <Text variant="caption" color={isPast ? 'tertiary' : 'secondary'}>
                {nextQuarter.year}
              </Text>
              {isPast && <Badge label="Past" variant="neutral" size="small" />}
            </Pressable>
          );
        })}
      </View>

      <Spacer size="large" />

      <Card padding="medium">
        <View style={styles.quarterInfo}>
          <View style={styles.quarterInfoIcon}>
            <Ionicons name="calendar" size={24} color={BrandColors.primary} />
          </View>
          <View style={styles.quarterInfoContent}>
            <Text variant="h5">
              {selectedYear} {selectedQuarter}
            </Text>
            <Text variant="bodySmall" color="secondary">
              {formatDate(quarterDates.start)} - {formatDate(quarterDates.end)}
            </Text>
            <Text variant="caption" color="tertiary" style={styles.daysText}>
              {daysInQuarter} days to complete
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );

  // Step 2: Filing Method Selection
  const renderMethodSelection = () => {
    const methods: {
      id: FilingMethod;
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      description: string;
      recommended?: boolean;
    }[] = [
      {
        id: 'create_pattern',
        icon: 'repeat',
        title: 'Create Weekly Pattern',
        description: 'Set your routine once and apply to all 90 days',
        recommended: true,
      },
      {
        id: 'use_template',
        icon: 'bookmark',
        title: 'Use Saved Template',
        description: 'Load a previously saved weekly pattern',
      },
      {
        id: 'copy_previous',
        icon: 'copy',
        title: 'Copy from Previous',
        description: "Use last quarter's schedule as a starting point",
      },
      {
        id: 'manual',
        icon: 'create',
        title: 'Manual Entry',
        description: 'Fill in each day individually',
      },
    ];

    return (
      <View style={styles.stepContent}>
        <Text variant="h4" style={styles.sectionTitle}>
          How do you want to file?
        </Text>

        {!hasMandatoryLocations && (
          <Card style={styles.warningCard} padding="medium">
            <View style={styles.warningContent}>
              <Ionicons name="warning" size={24} color={SemanticColors.warning} />
              <View style={styles.warningText}>
                <Text variant="body" bold>
                  Set Up Locations First
                </Text>
                <Text variant="bodySmall" color="secondary">
                  You need to set up your home and training locations before filing.
                </Text>
                <Spacer size="small" />
                <Button
                  title="Set Up Locations"
                  variant="secondary"
                  size="small"
                  onPress={() => router.push('/locations')}
                />
              </View>
            </View>
          </Card>
        )}

        <Spacer size="medium" />

        {methods.map((method) => (
          <PressableCard
            key={method.id}
            onPress={() => handleMethodSelect(method.id)}
            style={StyleSheet.flatten([
              styles.methodCard,
              filingMethod === method.id ? styles.methodCardSelected : null,
              !hasMandatoryLocations ? styles.methodCardDisabled : null,
            ])}
            padding="medium"
            disabled={!hasMandatoryLocations}
          >
            <View style={styles.methodContent}>
              <View
                style={[
                  styles.methodIcon,
                  filingMethod === method.id && styles.methodIconSelected,
                ]}
              >
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={
                    filingMethod === method.id ? BrandColors.primary : colors.textTertiary
                  }
                />
              </View>
              <View style={styles.methodText}>
                <View style={styles.methodHeader}>
                  <Text variant="h6">{method.title}</Text>
                  {method.recommended && (
                    <Badge label="Recommended" variant="success" size="small" />
                  )}
                </View>
                <Text variant="caption" color="secondary">
                  {method.description}
                </Text>
              </View>
              <Ionicons
                name={
                  filingMethod === method.id ? 'checkmark-circle' : 'ellipse-outline'
                }
                size={24}
                color={filingMethod === method.id ? BrandColors.primary : colors.textTertiary}
              />
            </View>
          </PressableCard>
        ))}
      </View>
    );
  };

  // Step 3: Pattern Builder
  const renderPatternBuilder = () => (
    <View style={styles.stepContent}>
      <PatternBuilder
        value={weeklyPattern}
        onChange={setWeeklyPattern}
        homeLocation={homeLocation}
        trainingLocation={trainingLocation}
        gymLocation={gymLocation}
        showSaveTemplate={true}
        onSaveAsTemplate={(name) => {
          // TODO: Save template to Firestore
          Alert.alert('Template Saved', `Template "${name}" has been saved.`);
        }}
      />
    </View>
  );

  // Step 4: Review
  const renderReview = () => {
    const dailySlots = generateDailySlots();
    const competitionDays = dailySlots.filter((slot) => slot.is_competition).length;

    // Count slots by location type
    const locationCounts = {
      home: dailySlots.filter((s) => s.location_type === 'home').length,
      training: dailySlots.filter((s) => s.location_type === 'training').length,
      gym: dailySlots.filter((s) => s.location_type === 'gym').length,
    };

    return (
      <View style={styles.stepContent}>
        <Text variant="h4" style={styles.sectionTitle}>
          Review & Apply
        </Text>

        <Card padding="medium" style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Ionicons name="calendar-outline" size={24} color={BrandColors.primary} />
            <Text variant="h5" style={styles.reviewTitle}>
              {selectedYear} {selectedQuarter}
            </Text>
          </View>

          <Divider spacing="medium" />

          <View style={styles.reviewStats}>
            <View style={styles.reviewStat}>
              <Text variant="h4" customColor={BrandColors.primary}>
                {daysInQuarter}
              </Text>
              <Text variant="caption" color="secondary">
                Total Days
              </Text>
            </View>
            <View style={styles.reviewStatDivider} />
            <View style={styles.reviewStat}>
              <Text variant="h4" customColor={SemanticColors.success}>
                {daysInQuarter}
              </Text>
              <Text variant="caption" color="secondary">
                Slots to Create
              </Text>
            </View>
            <View style={styles.reviewStatDivider} />
            <View style={styles.reviewStat}>
              <Text variant="h4" customColor={SemanticColors.info}>
                {competitionDays}
              </Text>
              <Text variant="caption" color="secondary">
                Competition Days
              </Text>
            </View>
          </View>

          <Divider spacing="medium" />

          <Text variant="label" color="secondary" style={styles.reviewSubtitle}>
            Location Distribution
          </Text>

          <View style={styles.locationDistribution}>
            <View style={styles.locationDistItem}>
              <Ionicons name="home-outline" size={18} color={BrandColors.primary} />
              <Text variant="body">{locationCounts.home} days</Text>
              <Text variant="caption" color="secondary">Home</Text>
            </View>
            <View style={styles.locationDistItem}>
              <Ionicons name="fitness-outline" size={18} color={BrandColors.secondary} />
              <Text variant="body">{locationCounts.training} days</Text>
              <Text variant="caption" color="secondary">Training</Text>
            </View>
            <View style={styles.locationDistItem}>
              <Ionicons name="barbell-outline" size={18} color={SemanticColors.success} />
              <Text variant="body">{locationCounts.gym} days</Text>
              <Text variant="caption" color="secondary">Gym</Text>
            </View>
          </View>
        </Card>

        <Spacer size="large" />

        {creationStatus.isCreating ? (
          <Card padding="large">
            <View style={styles.applyingContainer}>
              <ActivityIndicator size="large" color={BrandColors.primary} />
              <Spacer size="medium" />
              <Text variant="h6" center>
                {creationStatus.stepLabel}
              </Text>
              <Text variant="caption" color="secondary" center>
                {creationStatus.progress}% complete
              </Text>
              <Spacer size="small" />
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${creationStatus.progress}%` }]}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.confirmCard} padding="medium">
            <View style={styles.confirmContent}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={SemanticColors.info}
              />
              <Text variant="bodySmall" color="secondary" style={styles.confirmText}>
                After creating the quarter, you can adjust individual days from the
                calendar view.
              </Text>
            </View>
          </Card>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer edges={['bottom']}>
      {/* Step Indicator */}
      <StepIndicator currentStep={step} steps={steps} />

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {step > 0 && (
            <Button
              title="Back"
              variant="tertiary"
              onPress={handleBack}
              leftIcon={<Ionicons name="arrow-back" size={20} color={BrandColors.primary} />}
              style={styles.backButton}
            />
          )}

          {step < steps.length - 1 ? (
            <Button
              title="Next"
              onPress={handleNext}
              disabled={!canProceed}
              rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
              style={styles.nextButton}
            />
          ) : (
            <Button
              title="Create Quarter"
              onPress={handleApplyPattern}
              loading={creationStatus.isCreating}
              disabled={creationStatus.isCreating}
              rightIcon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
              style={styles.nextButton}
            />
          )}
        </View>
      </View>

      {/* Template Selector Modal */}
      <TemplateSelector
        visible={showTemplateSelector}
        templates={savedTemplates}
        onSelect={handleTemplateSelect}
        onCancel={() => setShowTemplateSelector(false)}
        onCreateNew={() => {
          setShowTemplateSelector(false);
          // Switch to create pattern method
          setFilingMethod('create_pattern');
          handleNext();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  quarterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quarterOption: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  quarterOptionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  quarterOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  quarterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quarterInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  quarterInfoContent: {
    flex: 1,
  },
  daysText: {
    marginTop: Spacing.xs,
  },
  warningCard: {
    backgroundColor: SemanticColors.warningBackground,
    borderColor: SemanticColors.warning,
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  methodCard: {
    marginBottom: Spacing.sm,
  },
  methodCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(0, 102, 204, 0.02)',
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  methodIconSelected: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  methodText: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  reviewCard: {
    backgroundColor: '#FAFAFA',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewTitle: {
    marginLeft: Spacing.sm,
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reviewStat: {
    alignItems: 'center',
  },
  reviewStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  reviewSubtitle: {
    marginBottom: Spacing.sm,
  },
  locationDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  locationDistItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  applyingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
    borderRadius: 4,
  },
  confirmCard: {
    backgroundColor: SemanticColors.infoBackground,
    borderColor: SemanticColors.info,
    borderWidth: 1,
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  confirmText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
