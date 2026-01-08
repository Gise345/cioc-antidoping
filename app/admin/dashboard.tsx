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
import { logoutAsync } from '@/src/store';

import { ScreenContainer, Text, LoadingState } from '@/src/components/common';
import { COLORS, SPACING, LightColors, DarkColors, BrandColors, SemanticColors } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppDispatch } from '@/src/store';
import { useAppSelector } from '@/src/store/hooks';
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
  colors: typeof LightColors | typeof DarkColors;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = BrandColors.primary, colors }) => (
  <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
    <Card.Content style={styles.statCardContent}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </Card.Content>
  </Card>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  const statistics = useSelector(selectStatistics);
  const recentAthletes = useSelector(selectRecentAthletes);
  const loading = useSelector(selectAdminLoading);

  // Check if user is super admin (role is in userProfile, not user)
  const userProfile = useAppSelector((state) => state.auth.userProfile);
  const isSuperAdmin = userProfile?.role === 'super_admin';

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

  const handleManageAdmins = () => {
    router.push('/admin/manage-admins');
  };

  const handleAthletePress = (athleteId: string) => {
    router.push(`/admin/athlete/${athleteId}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutAsync());
            router.replace('/auth/login');
          },
        },
      ]
    );
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
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Athletes"
            value={statistics?.totalAthletes || 0}
            icon="people"
            color={BrandColors.primary}
            colors={colors}
          />
          <StatCard
            title="Active"
            value={statistics?.activeAthletes || 0}
            icon="checkmark-circle"
            color={SemanticColors.success}
            colors={colors}
          />
          <StatCard
            title="Inactive"
            value={statistics?.inactiveAthletes || 0}
            icon="close-circle"
            color={SemanticColors.error}
            colors={colors}
          />
          <StatCard
            title="RTP Athletes"
            value={statistics?.byTestingPool?.RTP || 0}
            icon="shield-checkmark"
            color={SemanticColors.warning}
            colors={colors}
          />
        </View>

        {/* Testing Pool Breakdown */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Title title="Testing Pool Status" titleStyle={[styles.cardTitle, { color: colors.textPrimary }]} />
          <Card.Content>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>Not in Pool (NONE)</Text>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{statistics?.byTestingPool?.NONE || 0}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>Registered Testing Pool (RTP)</Text>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{statistics?.byTestingPool?.RTP || 0}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>Testing Pool (TP)</Text>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{statistics?.byTestingPool?.TP || 0}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Residence Status */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Title title="Residence Status" titleStyle={[styles.cardTitle, { color: colors.textPrimary }]} />
          <Card.Content>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <Ionicons name="home" size={18} color={BrandColors.primary} />
                <Text style={[styles.breakdownLabel, styles.breakdownLabelWithIcon, { color: colors.textPrimary }]}>Local</Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{statistics?.byResidenceStatus?.local || 0}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <Ionicons name="airplane" size={18} color={BrandColors.secondary} />
                <Text style={[styles.breakdownLabel, styles.breakdownLabelWithIcon, { color: colors.textPrimary }]}>Overseas</Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{statistics?.byResidenceStatus?.overseas || 0}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
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

        {/* Super Admin Actions */}
        {isSuperAdmin && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Super Admin Tools</Text>
            <View style={styles.superAdminActions}>
              <Button
                mode="contained"
                icon="shield-account"
                onPress={handleManageAdmins}
                style={styles.superAdminButton}
                contentStyle={styles.actionButtonContent}
                buttonColor={SemanticColors.warning}
              >
                Manage Admins
              </Button>
              <Button
                mode="contained"
                icon="eye"
                onPress={() => router.push('/(tabs)/home')}
                style={styles.superAdminButton}
                contentStyle={styles.actionButtonContent}
                buttonColor={BrandColors.primary}
              >
                View Athlete Dashboard
              </Button>
            </View>
          </>
        )}

        {/* Dev Tools - Only visible in development */}
        {__DEV__ && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dev Tools</Text>
            <Card style={[styles.card, { backgroundColor: colors.card }]}>
              <Card.Content>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>Sports in DB</Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{dbStats?.sports ?? 0}</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>System Config</Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{dbStats?.config ?? 0}</Text>
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
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recently Created</Text>
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content>
            {recentAthletes.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No athletes created yet</Text>
            ) : (
              recentAthletes.map((athlete, index) => (
                <React.Fragment key={athlete.id}>
                  <View style={styles.athleteRow}>
                    <View style={styles.athleteInfo}>
                      <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                        {athlete.athlete.first_name} {athlete.athlete.last_name}
                      </Text>
                      <Text style={[styles.athleteDetail, { color: colors.textSecondary }]}>
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Athletes by Sport</Text>
            <Card style={[styles.card, { backgroundColor: colors.card }]}>
              <Card.Content>
                {Object.entries(statistics.bySport)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([sport, count], index, arr) => (
                    <React.Fragment key={sport}>
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>{sport}</Text>
                        <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{count}</Text>
                      </View>
                      {index < arr.length - 1 && <Divider style={styles.divider} />}
                    </React.Fragment>
                  ))}
              </Card.Content>
            </Card>
          </>
        )}

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Button
            mode="contained"
            icon="logout"
            onPress={handleLogout}
            style={styles.signOutButton}
            contentStyle={styles.actionButtonContent}
            buttonColor={SemanticColors.error}
            textColor="#FFFFFF"
          >
            Sign Out
          </Button>
        </View>
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
  manageAdminsButton: {
    marginBottom: SPACING.md,
  },
  superAdminActions: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  superAdminButton: {
    marginBottom: SPACING.xs,
  },
  signOutSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  signOutButton: {
    borderRadius: 8,
  },
});
