/**
 * Dashboard / Home Screen
 * Main screen showing compliance status, quick actions, and current quarter overview
 * Connected to Redux for real-time data
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  Text,
  Card,
  PressableCard,
  Button,
  StatusBadge,
  CompletionBadge,
  Spacer,
  Divider,
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
import {
  fetchCurrentQuarterAsync,
  fetchQuartersAsync,
  fetchTemplatesAsync,
  selectCurrentQuarter,
  selectDaysUntilDeadline,
  selectWhereaboutsLoading,
  selectUpcomingDeadline,
  selectMissingDates,
  selectDefaultTemplate,
  selectTemplates,
  applyPatternToQuarterAsync,
  selectCurrentPattern,
} from '@/src/store/slices/whereaboutsSlice';
import { selectUser, selectAthlete } from '@/src/store/slices/authSlice';
import {
  fetchAllLocationsAsync,
  selectLocationCompletionStatus,
  selectHasMandatoryLocations,
} from '@/src/store/slices/locationsSlice';
import { getCurrentQuarterInfo } from '@/src/api/whereabouts';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector(selectUser);
  const athlete = useSelector(selectAthlete);
  const currentQuarter = useSelector(selectCurrentQuarter);
  const daysUntilDeadline = useSelector(selectDaysUntilDeadline);
  const upcomingDeadline = useSelector(selectUpcomingDeadline);
  const loading = useSelector(selectWhereaboutsLoading);
  const locationStatus = useSelector(selectLocationCompletionStatus);
  const hasMandatoryLocations = useSelector(selectHasMandatoryLocations);
  const missingDates = useSelector(selectMissingDates);
  const defaultTemplate = useSelector(selectDefaultTemplate);
  const templates = useSelector(selectTemplates);
  const currentPattern = useSelector(selectCurrentPattern);

  const [refreshing, setRefreshing] = useState(false);

  // Get current quarter info
  const { year: currentYear, quarter: currentQuarterName } = getCurrentQuarterInfo();

  // Fetch data on mount
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchCurrentQuarterAsync(user.uid));
      dispatch(fetchQuartersAsync(user.uid));
      dispatch(fetchAllLocationsAsync(user.uid));
      dispatch(fetchTemplatesAsync(user.uid));
    }
  }, [user?.uid, dispatch]);

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchCurrentQuarterAsync(user.uid)),
      dispatch(fetchQuartersAsync(user.uid)),
      dispatch(fetchAllLocationsAsync(user.uid)),
      dispatch(fetchTemplatesAsync(user.uid)),
    ]);
    setRefreshing(false);
  }, [user?.uid, dispatch]);

  const handleCreateQuarter = () => {
    router.push('/whereabouts/create-quarter');
  };

  const handleViewQuarter = () => {
    if (currentQuarter) {
      router.push(`/whereabouts/quarter/${currentQuarter.id}`);
    } else {
      router.push('/whereabouts/create-quarter');
    }
  };

  const handleQuickUpdate = () => {
    router.push('/whereabouts/quick-update');
  };

  const formatDeadline = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDeadlineColor = (days: number): string => {
    if (days <= 3) return SemanticColors.error;
    if (days <= 7) return SemanticColors.warning;
    return BrandColors.primary;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = athlete?.first_name || user?.displayName?.split(' ')[0] || 'Athlete';

  // Calculate compliance status
  const completionPercentage = currentQuarter?.completion_percentage || 0;
  const daysCompleted = currentQuarter?.days_completed || 0;
  const totalDays = currentQuarter?.total_days || 90;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="bodySmall" color="secondary">
              {getGreeting()},
            </Text>
            <Text variant="h3">{displayName}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={[styles.notificationButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            <View style={styles.notificationBadge} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
          />
        }
      >
        {/* Location Completion Section */}
        {!hasMandatoryLocations && (
          <Card style={styles.locationCard} padding="medium">
            <View style={styles.locationHeader}>
              <View style={[styles.locationIcon, { backgroundColor: SemanticColors.warningBackground }]}>
                <Ionicons name="location" size={24} color={SemanticColors.warning} />
              </View>
              <View style={styles.locationHeaderText}>
                <Text variant="h6">Set Up Your Locations</Text>
                <Text variant="caption" color="secondary">
                  Required before filing whereabouts
                </Text>
              </View>
            </View>

            <Spacer size="medium" />

            {/* Location Status Items */}
            <View style={styles.locationItems}>
              <Pressable
                style={styles.locationItem}
                onPress={() => router.push('/locations')}
              >
                <Ionicons
                  name={locationStatus.homeComplete ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={locationStatus.homeComplete ? SemanticColors.success : SemanticColors.warning}
                />
                <Text variant="body" style={styles.locationItemText}>
                  Home Location
                </Text>
                <Text
                  variant="caption"
                  customColor={locationStatus.homeComplete ? SemanticColors.success : SemanticColors.warning}
                >
                  {locationStatus.homeComplete ? 'Complete' : 'Incomplete'}
                </Text>
              </Pressable>

              <View style={styles.locationDivider} />

              <Pressable
                style={styles.locationItem}
                onPress={() => router.push('/locations')}
              >
                <Ionicons
                  name={locationStatus.trainingComplete ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={locationStatus.trainingComplete ? SemanticColors.success : SemanticColors.warning}
                />
                <Text variant="body" style={styles.locationItemText}>
                  Training Location
                </Text>
                <Text
                  variant="caption"
                  customColor={locationStatus.trainingComplete ? SemanticColors.success : SemanticColors.warning}
                >
                  {locationStatus.trainingComplete ? 'Complete' : 'Incomplete'}
                </Text>
              </Pressable>

              <View style={styles.locationDivider} />

              <Pressable
                style={styles.locationItem}
                onPress={() => router.push('/locations')}
              >
                <Ionicons
                  name={locationStatus.gymComplete ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={locationStatus.gymComplete ? SemanticColors.success : '#9CA3AF'}
                />
                <Text variant="body" style={styles.locationItemText}>
                  Gym Location
                </Text>
                <Text
                  variant="caption"
                  color={locationStatus.gymComplete ? 'primary' : 'tertiary'}
                >
                  {locationStatus.gymComplete ? 'Complete' : 'Optional'}
                </Text>
              </Pressable>
            </View>

            <Spacer size="medium" />

            <Button
              title="Complete Your Locations"
              onPress={() => router.push('/locations')}
              fullWidth
              variant="secondary"
              leftIcon={<Ionicons name="location" size={20} color={BrandColors.primary} />}
            />
          </Card>
        )}

        {/* Locations Complete Badge */}
        {hasMandatoryLocations && (
          <View style={styles.locationsCompleteBadge}>
            <Ionicons name="checkmark-circle" size={18} color={SemanticColors.success} />
            <Text variant="bodySmall" customColor={SemanticColors.success} style={styles.locationsCompleteText}>
              Locations Complete
            </Text>
            <Pressable onPress={() => router.push('/locations')}>
              <Text variant="caption" customColor={BrandColors.primary}>
                Manage
              </Text>
            </Pressable>
          </View>
        )}

        {/* No Quarter Card - Show when no current quarter exists */}
        {!currentQuarter && !loading && (
          <Card style={styles.complianceCard} padding="large">
            <View style={styles.noQuarterContent}>
              <View style={styles.noQuarterIcon}>
                <Ionicons name="calendar-outline" size={48} color={BrandColors.primary} />
              </View>
              <Text variant="h5" center>
                No Quarter Filed
              </Text>
              <Text variant="body" color="secondary" center style={styles.noQuarterText}>
                You haven't started filing for {currentYear} {currentQuarterName} yet.
                Start now to maintain your compliance status.
              </Text>
              <Spacer size="medium" />
              <Button
                title="Create New Quarter"
                onPress={handleCreateQuarter}
                fullWidth
                leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />}
              />
            </View>
          </Card>
        )}

        {/* Compliance Status Card - Show when current quarter exists */}
        {currentQuarter && (
          <Card style={styles.complianceCard} padding="large">
            <View style={styles.complianceHeader}>
              <View>
                <Text variant="label" color="secondary">
                  Current Quarter
                </Text>
                <Text variant="h4">
                  {currentQuarter.year} {currentQuarter.quarter}
                </Text>
              </View>
              <StatusBadge status={currentQuarter.status} />
            </View>

            <Spacer size="medium" />

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text variant="bodySmall" color="secondary">
                  Completion Progress
                </Text>
                <CompletionBadge percentage={completionPercentage} />
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${completionPercentage}%`,
                      backgroundColor:
                        completionPercentage >= 100
                          ? SemanticColors.success
                          : completionPercentage >= 50
                          ? BrandColors.primary
                          : SemanticColors.warning,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" color="tertiary">
                {daysCompleted} of {totalDays} days completed
              </Text>
            </View>

            <Divider spacing="medium" />

            {/* Deadline Warning */}
            <View style={styles.deadlineSection}>
              <View
                style={[
                  styles.deadlineIcon,
                  {
                    backgroundColor:
                      upcomingDeadline?.isUrgent
                        ? SemanticColors.warningBackground
                        : upcomingDeadline?.isCritical
                        ? SemanticColors.errorBackground
                        : 'rgba(0, 102, 204, 0.1)',
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={getDeadlineColor(daysUntilDeadline)}
                />
              </View>
              <View style={styles.deadlineInfo}>
                <Text variant="bodySmall" color="secondary">
                  Filing Deadline
                </Text>
                <Text variant="body" bold>
                  {formatDeadline(currentQuarter.filing_deadline)}
                </Text>
              </View>
              <View style={styles.daysLeft}>
                <Text
                  variant="h4"
                  customColor={getDeadlineColor(daysUntilDeadline)}
                >
                  {Math.max(0, daysUntilDeadline)}
                </Text>
                <Text variant="caption" color="secondary">
                  days left
                </Text>
              </View>
            </View>

            <Spacer size="medium" />

            <Button
              title={completionPercentage >= 100 ? 'Review & Submit' : 'Continue Filing'}
              onPress={handleViewQuarter}
              fullWidth
              rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            />
          </Card>
        )}

        {/* Smart Suggestions - Context-aware actions */}
        {(currentQuarter && missingDates.length > 0 && (defaultTemplate || currentPattern)) && (
          <View style={styles.section}>
            <Text variant="h5" style={styles.sectionTitle}>
              Suggested Actions
            </Text>
            <Card padding="medium" style={styles.suggestionsCard}>
              <Pressable
                style={styles.suggestionItem}
                onPress={() => {
                  if (currentQuarter) {
                    router.push(`/whereabouts/quarter/${currentQuarter.id}`);
                  }
                }}
              >
                <View style={[styles.suggestionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <Ionicons name="sparkles" size={20} color={SemanticColors.success} />
                </View>
                <View style={styles.suggestionContent}>
                  <Text variant="body" bold>Fill {missingDates.length} Missing Days</Text>
                  <Text variant="caption" color="secondary">
                    {defaultTemplate
                      ? `Apply "${defaultTemplate.name}" template to complete`
                      : 'Use your weekly pattern to fill remaining days'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            </Card>
          </View>
        )}

        {/* Show template suggestion when no quarter and has templates */}
        {!currentQuarter && !loading && templates.length > 0 && (
          <View style={styles.section}>
            <Text variant="h5" style={styles.sectionTitle}>
              Quick Start
            </Text>
            <Card padding="medium" style={styles.suggestionsCard}>
              <Pressable
                style={styles.suggestionItem}
                onPress={handleCreateQuarter}
              >
                <View style={[styles.suggestionIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
                  <Ionicons name="rocket" size={20} color={BrandColors.primary} />
                </View>
                <View style={styles.suggestionContent}>
                  <Text variant="body" bold>File with Template</Text>
                  <Text variant="caption" color="secondary">
                    {defaultTemplate
                      ? `Use "${defaultTemplate.name}" for ${currentYear} ${currentQuarterName}`
                      : `Choose from ${templates.length} saved templates`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <PressableCard
              style={styles.quickAction}
              onPress={handleQuickUpdate}
              padding="medium"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(0, 206, 209, 0.1)' }]}>
                <Ionicons name="flash" size={24} color={BrandColors.secondary} />
              </View>
              <Text variant="label">Quick Update</Text>
              <Text variant="caption" color="secondary">
                Update today
              </Text>
            </PressableCard>

            <PressableCard
              style={styles.quickAction}
              onPress={() => router.push('/whereabouts/templates')}
              padding="medium"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                <Ionicons name="grid-outline" size={24} color={SemanticColors.warning} />
              </View>
              <Text variant="label">Templates</Text>
              <Text variant="caption" color="secondary">
                {templates.length > 0 ? `${templates.length} saved` : 'Create pattern'}
              </Text>
            </PressableCard>

            <PressableCard
              style={styles.quickAction}
              onPress={() => router.push('/locations')}
              padding="medium"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="location" size={24} color={SemanticColors.success} />
              </View>
              <Text variant="label">Locations</Text>
              <Text variant="caption" color="secondary">
                Manage places
              </Text>
            </PressableCard>
          </View>
        </View>

        {/* Template Shortcuts - Show if templates exist */}
        {templates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="h5">Your Templates</Text>
              <Pressable onPress={() => router.push('/whereabouts/templates')}>
                <Text variant="caption" customColor={BrandColors.primary}>
                  See all
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
              contentContainerStyle={styles.templateScrollContent}
            >
              {templates.slice(0, 3).map((template) => (
                <Pressable
                  key={template.id}
                  style={[
                    styles.templateShortcut,
                    template.is_default && styles.templateShortcutDefault,
                  ]}
                  onPress={() => router.push('/whereabouts/templates')}
                >
                  <View style={styles.templateShortcutHeader}>
                    <Text variant="label" numberOfLines={1}>
                      {template.name}
                    </Text>
                    {template.is_default && (
                      <View style={styles.defaultBadge}>
                        <Ionicons name="star" size={10} color={BrandColors.secondary} />
                      </View>
                    )}
                  </View>
                  <Text variant="caption" color="secondary" numberOfLines={1}>
                    Used {template.usage_count || 0} times
                  </Text>
                </Pressable>
              ))}

              {/* Create Template Button */}
              <Pressable
                style={styles.templateShortcutAdd}
                onPress={() => router.push('/whereabouts/templates')}
              >
                <Ionicons name="add" size={24} color={BrandColors.primary} />
                <Text variant="caption" customColor={BrandColors.primary}>
                  Create New
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* Compliance Summary */}
        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            Compliance Summary
          </Text>
          <Card padding="medium">
            <View style={styles.complianceStats}>
              <View style={styles.statItem}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: SemanticColors.successBackground },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color={SemanticColors.success} />
                </View>
                <Text variant="h4">0</Text>
                <Text variant="caption" color="secondary">
                  Missed Tests
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: SemanticColors.successBackground },
                  ]}
                >
                  <Ionicons name="document-text" size={20} color={SemanticColors.success} />
                </View>
                <Text variant="h4">0</Text>
                <Text variant="caption" color="secondary">
                  Filing Failures
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: SemanticColors.successBackground },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={20} color={SemanticColors.success} />
                </View>
                <Text variant="h4">Good</Text>
                <Text variant="caption" color="secondary">
                  Status
                </Text>
              </View>
            </View>

            <View style={[styles.warningBanner, { backgroundColor: SemanticColors.infoBackground }]}>
              <Ionicons name="information-circle" size={20} color={SemanticColors.info} />
              <Text variant="caption" color="secondary" style={styles.warningText}>
                3 missed tests or filing failures in 12 months = potential suspension
              </Text>
            </View>
          </Card>
        </View>

        {/* Tips Card */}
        <View style={styles.section}>
          <Card padding="medium">
            <View style={styles.tipsHeader}>
              <View style={[styles.tipIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
                <Ionicons name="bulb-outline" size={20} color={BrandColors.primary} />
              </View>
              <Text variant="h6">Filing Tip</Text>
            </View>
            <Text variant="body" color="secondary" style={styles.tipText}>
              Set up a weekly template to quickly fill in your regular schedule.
              You can then adjust individual days as needed.
            </Text>
            <Pressable
              onPress={() => router.push('/whereabouts/templates')}
              style={styles.tipLink}
            >
              <Text variant="bodySmall" customColor={BrandColors.primary}>
                Create a template
              </Text>
              <Ionicons name="arrow-forward" size={16} color={BrandColors.primary} />
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SemanticColors.error,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  complianceCard: {
    marginBottom: Spacing.lg,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noQuarterContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noQuarterIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  noQuarterText: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
  deadlineSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  deadlineInfo: {
    flex: 1,
  },
  daysLeft: {
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
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
  complianceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  warningText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  tipText: {
    marginBottom: Spacing.sm,
  },
  tipLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  // Location Completion Section styles
  locationCard: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.warning,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  locationHeaderText: {
    flex: 1,
  },
  locationItems: {
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  locationItemText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Spacing.md,
  },
  locationsCompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SemanticColors.successBackground,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  locationsCompleteText: {
    flex: 1,
  },
  // Smart Suggestions styles
  suggestionsCard: {
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  suggestionContent: {
    flex: 1,
  },
  // Template shortcuts styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  templateScroll: {
    marginHorizontal: -Spacing.md,
  },
  templateScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  templateShortcut: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateShortcutDefault: {
    borderColor: BrandColors.secondary,
    backgroundColor: 'rgba(0, 206, 209, 0.05)',
  },
  templateShortcutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  defaultBadge: {
    backgroundColor: 'rgba(0, 206, 209, 0.2)',
    padding: 2,
    borderRadius: 6,
  },
  templateShortcutAdd: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minWidth: 100,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});
