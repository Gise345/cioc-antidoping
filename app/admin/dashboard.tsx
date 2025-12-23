/**
 * Admin Dashboard Screen
 * Overview of athlete statistics and quick actions
 */

import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer, Text, LoadingState } from '@/src/components/common';
import { COLORS, SPACING } from '@/src/constants/theme';
import { AppDispatch } from '@/src/store';
import {
  fetchStatisticsAsync,
  fetchRecentAthletesAsync,
  selectStatistics,
  selectRecentAthletes,
  selectAdminLoading,
} from '@/src/store/slices/adminSlice';
import { seedFirestore, getDatabaseStats } from '@/src/utils/seedFirestore';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = COLORS.primary }) => (
  <Card style={styles.statCard}>
    <Card.Content style={styles.statCardContent}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Card.Content>
  </Card>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const statistics = useSelector(selectStatistics);
  const recentAthletes = useSelector(selectRecentAthletes);
  const loading = useSelector(selectAdminLoading);

  const [refreshing, setRefreshing] = React.useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dbStats, setDbStats] = useState<{ sports: number; config: number } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchStatisticsAsync());
    dispatch(fetchRecentAthletesAsync(5));
    // Fetch database stats in dev mode
    if (__DEV__) {
      getDatabaseStats().then(setDbStats);
    }
  }, [dispatch]);

  // Handle seed database
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const result = await seedFirestore();
      if (result.success) {
        Alert.alert('Success', result.message);
        // Refresh stats
        const stats = await getDatabaseStats();
        setDbStats(stats);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to seed database: ${error}`);
    } finally {
      setSeeding(false);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchStatisticsAsync()),
      dispatch(fetchRecentAthletesAsync(5)),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Navigation handlers
  const handleCreateAthlete = () => {
    router.push('/admin/create-athlete');
  };

  const handleViewAthletes = () => {
    router.push('/admin/athletes');
  };

  const handleAthletePress = (athleteId: string) => {
    router.push(`/admin/athlete/${athleteId}`);
  };

  if (loading && !statistics) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Athletes"
            value={statistics?.totalAthletes || 0}
            icon="people"
            color={COLORS.primary}
          />
          <StatCard
            title="Active"
            value={statistics?.activeAthletes || 0}
            icon="checkmark-circle"
            color={COLORS.success}
          />
          <StatCard
            title="Inactive"
            value={statistics?.inactiveAthletes || 0}
            icon="close-circle"
            color={COLORS.error}
          />
          <StatCard
            title="RTP Athletes"
            value={statistics?.byTestingPool?.RTP || 0}
            icon="shield-checkmark"
            color={COLORS.warning}
          />
        </View>

        {/* Testing Pool Breakdown */}
        <Card style={styles.card}>
          <Card.Title title="Testing Pool Status" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Not in Pool (NONE)</Text>
              <Text style={styles.breakdownValue}>{statistics?.byTestingPool?.NONE || 0}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Registered Testing Pool (RTP)</Text>
              <Text style={styles.breakdownValue}>{statistics?.byTestingPool?.RTP || 0}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Testing Pool (TP)</Text>
              <Text style={styles.breakdownValue}>{statistics?.byTestingPool?.TP || 0}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Residence Status */}
        <Card style={styles.card}>
          <Card.Title title="Residence Status" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <Ionicons name="home" size={18} color={COLORS.primary} />
                <Text style={[styles.breakdownLabel, styles.breakdownLabelWithIcon]}>Local</Text>
              </View>
              <Text style={styles.breakdownValue}>{statistics?.byResidenceStatus?.local || 0}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <Ionicons name="airplane" size={18} color={COLORS.secondary} />
                <Text style={[styles.breakdownLabel, styles.breakdownLabelWithIcon]}>Overseas</Text>
              </View>
              <Text style={styles.breakdownValue}>{statistics?.byResidenceStatus?.overseas || 0}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            icon="plus"
            onPress={handleCreateAthlete}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Create Athlete
          </Button>
          <Button
            mode="outlined"
            icon="account-group"
            onPress={handleViewAthletes}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            View All
          </Button>
        </View>

        {/* Dev Tools - Only visible in development */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionTitle}>Dev Tools</Text>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Sports in DB</Text>
                  <Text style={styles.breakdownValue}>{dbStats?.sports ?? 0}</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>System Config</Text>
                  <Text style={styles.breakdownValue}>{dbStats?.config ?? 0}</Text>
                </View>
                <Divider style={styles.divider} />
                <Button
                  mode="contained"
                  icon="database"
                  onPress={handleSeedDatabase}
                  loading={seeding}
                  disabled={seeding}
                  style={styles.seedButton}
                >
                  {seeding ? 'Seeding...' : 'Seed Database'}
                </Button>
              </Card.Content>
            </Card>
          </>
        )}

        {/* Recent Athletes */}
        <Text style={styles.sectionTitle}>Recently Created</Text>
        <Card style={styles.card}>
          <Card.Content>
            {recentAthletes.length === 0 ? (
              <Text style={styles.emptyText}>No athletes created yet</Text>
            ) : (
              recentAthletes.map((athlete, index) => (
                <React.Fragment key={athlete.id}>
                  <View style={styles.athleteRow}>
                    <View style={styles.athleteInfo}>
                      <Text style={styles.athleteName}>
                        {athlete.athlete.first_name} {athlete.athlete.last_name}
                      </Text>
                      <Text style={styles.athleteDetail}>
                        {athlete.athlete.sport_name || athlete.athlete.sport_id} • {athlete.user.email}
                      </Text>
                    </View>
                    <Button
                      mode="text"
                      compact
                      onPress={() => handleAthletePress(athlete.id)}
                    >
                      View
                    </Button>
                  </View>
                  {index < recentAthletes.length - 1 && <Divider style={styles.divider} />}
                </React.Fragment>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Sport Breakdown */}
        {statistics?.bySport && Object.keys(statistics.bySport).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Athletes by Sport</Text>
            <Card style={styles.card}>
              <Card.Content>
                {Object.entries(statistics.bySport)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([sport, count], index, arr) => (
                    <React.Fragment key={sport}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{sport}</Text>
                        <Text style={styles.breakdownValue}>{count}</Text>
                      </View>
                      {index < arr.length - 1 && <Divider style={styles.divider} />}
                    </React.Fragment>
                  ))}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '48%',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  breakdownLabelWithIcon: {
    marginLeft: SPACING.sm,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  divider: {
    marginVertical: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  actionButtonContent: {
    paddingVertical: SPACING.xs,
  },
  athleteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  athleteDetail: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  seedButton: {
    marginTop: SPACING.sm,
  },
});
