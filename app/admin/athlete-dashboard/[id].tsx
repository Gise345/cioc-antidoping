/**
 * Athlete Dashboard View (Admin)
 * Allows admin to view an athlete's dashboard as they would see it
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button as PaperButton, Chip } from 'react-native-paper';

import {
  Text,
  Card as CommonCard,
  Button,
  StatusBadge,
  CompletionBadge,
  Spacer,
  Divider,
  LoadingState,
} from '@/src/components/common';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
  COLORS,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getAthleteDetails,
} from '@/src/api/admin';
import {
  getAthleteQuarters,
  getCurrentQuarterInfo
} from '@/src/api/whereabouts';
import {
  getHomeLocation,
  getTrainingLocation,
  getGymLocation
} from '@/src/api/locations';
import { WhereaboutsQuarterDocument } from '@/src/types/firestore';
import { LocationWithSchedule } from '@/src/types';

export default function AthleteDashboardViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [athleteData, setAthleteData] = useState<{ user: any; athlete: any } | null>(null);
  const [currentQuarter, setCurrentQuarter] = useState<(WhereaboutsQuarterDocument & { id: string }) | null>(null);
  const [homeLocation, setHomeLocation] = useState<LocationWithSchedule | null>(null);
  const [trainingLocation, setTrainingLocation] = useState<LocationWithSchedule | null>(null);
  const [gymLocation, setGymLocation] = useState<LocationWithSchedule | null>(null);

  // Get current quarter info
  const { year: currentYear, quarter: currentQuarterName } = getCurrentQuarterInfo();

  // Fetch athlete data
  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch athlete details
      const details = await getAthleteDetails(id);
      setAthleteData(details);

      // Fetch athlete's quarters
      const quartersResult = await getAthleteQuarters(id);
      if (quartersResult.success && quartersResult.quarters) {
        // Find current quarter
        const current = quartersResult.quarters.find(
          q => q.year === currentYear && q.quarter === currentQuarterName
        );
        setCurrentQuarter(current || null);
      }

      // Fetch athlete's locations
      const [home, training, gym] = await Promise.all([
        getHomeLocation(id),
        getTrainingLocation(id),
        getGymLocation(id),
      ]);
      setHomeLocation(home);
      setTrainingLocation(training);
      setGymLocation(gym);

    } catch (error) {
      console.error('Error fetching athlete data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, currentYear, currentQuarterName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Calculate location status
  const locationStatus = {
    homeComplete: !!homeLocation,
    trainingComplete: !!trainingLocation,
    gymComplete: !!gymLocation,
  };
  const hasMandatoryLocations = locationStatus.homeComplete && locationStatus.trainingComplete;

  // Calculate completion data
  const completionPercentage = currentQuarter?.completion_percentage || 0;
  const daysCompleted = currentQuarter?.days_completed || 0;
  const totalDays = currentQuarter?.total_days || 90;

  // Calculate days until deadline
  const daysUntilDeadline = currentQuarter
    ? Math.ceil((new Date(currentQuarter.filing_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

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

  const displayName = athleteData?.athlete?.first_name || 'Athlete';

  if (loading) {
    return <LoadingState message="Loading athlete dashboard..." />;
  }

  if (!athleteData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text variant="h5" style={styles.errorText}>Athlete not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Admin Banner */}
      <View style={styles.adminBanner}>
        <Ionicons name="eye" size={20} color={BrandColors.primary} style={{ marginRight: Spacing.sm }} />
        <Text variant="body" style={{ color: BrandColors.primary, fontWeight: '600' }}>
          Viewing as: {athleteData.athlete.first_name} {athleteData.athlete.last_name}
        </Text>
      </View>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="bodySmall" color="secondary">
              Athlete Dashboard
            </Text>
            <Text variant="h3">{displayName}</Text>
          </View>
          <Chip icon="account" mode="outlined">
            {athleteData.athlete.sport_name || athleteData.athlete.sport_id}
          </Chip>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
          />
        }
      >
        {/* Location Status Section */}
        <CommonCard style={styles.locationCard} padding="medium">
          <View style={styles.locationHeader}>
            <View style={[styles.locationIcon, { backgroundColor: hasMandatoryLocations ? SemanticColors.successBackground : SemanticColors.warningBackground }]}>
              <Ionicons name="location" size={24} color={hasMandatoryLocations ? SemanticColors.success : SemanticColors.warning} />
            </View>
            <View style={styles.locationHeaderText}>
              <Text variant="h6" style={{ color: '#FFFFFF' }}>Locations Status</Text>
              <Text variant="caption" color="secondary">
                {hasMandatoryLocations ? 'Required locations set' : 'Missing required locations'}
              </Text>
            </View>
          </View>

          <Spacer size="medium" />

          {/* Location Status Items */}
          <View style={styles.locationItems}>
            <View style={styles.locationItem}>
              <Ionicons
                name={locationStatus.homeComplete ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={locationStatus.homeComplete ? SemanticColors.success : SemanticColors.warning}
              />
              <Text variant="body" style={[styles.locationItemText, { color: '#000000' }]}>
                Home Location
              </Text>
              <Text
                variant="caption"
                customColor={locationStatus.homeComplete ? SemanticColors.success : SemanticColors.warning}
              >
                {locationStatus.homeComplete ? 'Complete' : 'Missing'}
              </Text>
            </View>

            <View style={styles.locationDivider} />

            <View style={styles.locationItem}>
              <Ionicons
                name={locationStatus.trainingComplete ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={locationStatus.trainingComplete ? SemanticColors.success : SemanticColors.warning}
              />
              <Text variant="body" style={[styles.locationItemText, { color: '#000000' }]}>
                Training Location
              </Text>
              <Text
                variant="caption"
                customColor={locationStatus.trainingComplete ? SemanticColors.success : SemanticColors.warning}
              >
                {locationStatus.trainingComplete ? 'Complete' : 'Missing'}
              </Text>
            </View>

            <View style={styles.locationDivider} />

            <View style={styles.locationItem}>
              <Ionicons
                name={locationStatus.gymComplete ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={locationStatus.gymComplete ? SemanticColors.success : '#9CA3AF'}
              />
              <Text variant="body" style={[styles.locationItemText, { color: '#000000' }]}>
                Gym Location
              </Text>
              <Text
                variant="caption"
                color={locationStatus.gymComplete ? 'primary' : 'tertiary'}
              >
                {locationStatus.gymComplete ? 'Complete' : 'Optional'}
              </Text>
            </View>
          </View>

          <Spacer size="small" />
          <Text variant="caption" color="secondary">
            Total locations: {[homeLocation, trainingLocation, gymLocation].filter(Boolean).length}
          </Text>
        </CommonCard>

        {/* Quarter Status */}
        {!currentQuarter ? (
          <CommonCard style={styles.complianceCard} padding="large">
            <View style={styles.noQuarterContent}>
              <View style={styles.noQuarterIcon}>
                <Ionicons name="calendar-outline" size={48} color={BrandColors.primary} />
              </View>
              <Text variant="h5" center>
                No Quarter Filed
              </Text>
              <Text variant="body" color="secondary" center style={styles.noQuarterText}>
                This athlete hasn't started filing for {currentYear} {currentQuarterName} yet.
              </Text>
            </View>
          </CommonCard>
        ) : (
          <CommonCard style={styles.complianceCard} padding="large">
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

            {/* Deadline Info */}
            <View style={styles.deadlineSection}>
              <View
                style={[
                  styles.deadlineIcon,
                  {
                    backgroundColor:
                      daysUntilDeadline <= 3
                        ? SemanticColors.errorBackground
                        : daysUntilDeadline <= 7
                        ? SemanticColors.warningBackground
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
          </CommonCard>
        )}

        {/* Compliance Summary */}
        <View style={styles.section}>
          <Text variant="h5" style={[styles.sectionTitle, { color: '#FFFFFF' }]}>
            Compliance Summary
          </Text>
          <CommonCard padding="medium">
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
          </CommonCard>
        </View>

        {/* Athlete Details Summary */}
        <View style={styles.section}>
          <Text variant="h5" style={[styles.sectionTitle, { color: '#FFFFFF' }]}>
            Athlete Details
          </Text>
          <CommonCard padding="medium">
            <View style={styles.detailRow}>
              <Text variant="body" color="secondary">Email</Text>
              <Text variant="body" style={{ color: '#FFFFFF' }}>{athleteData.user.email}</Text>
            </View>
            <Divider spacing="small" />
            <View style={styles.detailRow}>
              <Text variant="body" color="secondary">Phone</Text>
              <Text variant="body" style={{ color: '#FFFFFF' }}>{athleteData.athlete.phone || 'Not set'}</Text>
            </View>
            <Divider spacing="small" />
            <View style={styles.detailRow}>
              <Text variant="body" color="secondary">Testing Pool</Text>
              <Text variant="body" style={{ color: '#FFFFFF' }}>{athleteData.athlete.testing_pool_status}</Text>
            </View>
            <Divider spacing="small" />
            <View style={styles.detailRow}>
              <Text variant="body" color="secondary">Residence</Text>
              <Text variant="body" style={{ color: '#FFFFFF' }}>{athleteData.athlete.residence_status === 'local' ? 'Local' : 'Overseas'}</Text>
            </View>
          </CommonCard>
        </View>

        {/* Back Button */}
        <View style={styles.section}>
          <Button
            title="Back to Athlete Details"
            onPress={() => router.back()}
            variant="secondary"
            leftIcon={<Ionicons name="arrow-back" size={20} color={BrandColors.primary} />}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminBanner: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginVertical: Spacing.md,
  },
  locationCard: {
    marginBottom: Spacing.md,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
});
