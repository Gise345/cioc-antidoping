/**
 * Athletes List Screen
 * List and search all athletes with filtering
 */

import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, Chip, Card, Badge, Menu, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer, Text, LoadingState, EmptyState } from '@/src/components/common';
import { COLORS, SPACING } from '@/src/constants/theme';
import { SPORTS } from '@/src/constants';
import { AppDispatch } from '@/src/store';
import {
  fetchAthletesAsync,
  setFilters,
  clearFilters,
  selectFilteredAthletes,
  selectAdminLoading,
  selectAdminFilters,
} from '@/src/store/slices/adminSlice';
import { AthleteWithUser } from '@/src/api/admin';

// ============================================================================
// ATHLETE CARD COMPONENT
// ============================================================================

interface AthleteCardProps {
  athlete: AthleteWithUser;
  onPress: () => void;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ athlete, onPress }) => {
  const isActive = athlete.athlete.status === 'active';

  return (
    <Card style={styles.athleteCard} onPress={onPress}>
      <Card.Content style={styles.athleteCardContent}>
        <View style={styles.athleteHeader}>
          <View style={styles.athleteNameRow}>
            <Text style={styles.athleteName}>
              {athlete.athlete.first_name} {athlete.athlete.last_name}
            </Text>
            <Badge
              style={[
                styles.statusBadge,
                { backgroundColor: isActive ? COLORS.success : COLORS.error },
              ]}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </View>
          <Text style={styles.athleteSport}>
            {athlete.athlete.sport_name || athlete.athlete.sport_id}
          </Text>
        </View>

        <View style={styles.athleteDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{athlete.user.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{athlete.athlete.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="shield-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>
              {athlete.athlete.testing_pool_status} • {athlete.athlete.residence_status}
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.text.secondary}
          style={styles.chevron}
        />
      </Card.Content>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AthletesScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const athletes = useSelector(selectFilteredAthletes);
  const loading = useSelector(selectAdminLoading);
  const filters = useSelector(selectAdminFilters);

  const [refreshing, setRefreshing] = useState(false);
  const [sportMenuVisible, setSportMenuVisible] = useState(false);

  // Fetch athletes on mount
  useEffect(() => {
    dispatch(fetchAthletesAsync(undefined));
  }, [dispatch]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchAthletesAsync(undefined));
    setRefreshing(false);
  }, [dispatch]);

  // Search handler
  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setFilters({ searchQuery: query }));
    },
    [dispatch]
  );

  // Filter handlers
  const handleStatusFilter = useCallback(
    (status: string) => {
      dispatch(setFilters({ status: filters.status === status ? '' : status }));
    },
    [dispatch, filters.status]
  );

  const handleResidenceFilter = useCallback(
    (residence: string) => {
      dispatch(setFilters({ residenceStatus: filters.residenceStatus === residence ? '' : residence }));
    },
    [dispatch, filters.residenceStatus]
  );

  const handleTestingPoolFilter = useCallback(
    (pool: string) => {
      dispatch(setFilters({ testingPoolStatus: filters.testingPoolStatus === pool ? '' : pool }));
    },
    [dispatch, filters.testingPoolStatus]
  );

  const handleSportFilter = useCallback(
    (sportId: string) => {
      dispatch(setFilters({ sport: sportId }));
      setSportMenuVisible(false);
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Navigate to athlete detail
  const handleAthletePress = useCallback(
    (athleteId: string) => {
      router.push(`/admin/athlete/${athleteId}`);
    },
    [router]
  );

  // Check if any filters are active
  const hasActiveFilters =
    filters.sport ||
    filters.residenceStatus ||
    filters.testingPoolStatus ||
    filters.status ||
    filters.searchQuery;

  // Render athlete item
  const renderItem = useCallback(
    ({ item }: { item: AthleteWithUser }) => (
      <AthleteCard athlete={item} onPress={() => handleAthletePress(item.id)} />
    ),
    [handleAthletePress]
  );

  const keyExtractor = useCallback((item: AthleteWithUser) => item.id, []);

  return (
    <ScreenContainer>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search by name or email..."
        value={filters.searchQuery}
        onChangeText={handleSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <ScrollableChips>
          {/* Status Filters */}
          <Chip
            selected={filters.status === 'active'}
            onPress={() => handleStatusFilter('active')}
            style={styles.chip}
          >
            Active
          </Chip>
          <Chip
            selected={filters.status === 'inactive'}
            onPress={() => handleStatusFilter('inactive')}
            style={styles.chip}
          >
            Inactive
          </Chip>

          {/* Residence Filters */}
          <Chip
            selected={filters.residenceStatus === 'local'}
            onPress={() => handleResidenceFilter('local')}
            style={styles.chip}
          >
            Local
          </Chip>
          <Chip
            selected={filters.residenceStatus === 'overseas'}
            onPress={() => handleResidenceFilter('overseas')}
            style={styles.chip}
          >
            Overseas
          </Chip>

          {/* Testing Pool Filters */}
          <Chip
            selected={filters.testingPoolStatus === 'RTP'}
            onPress={() => handleTestingPoolFilter('RTP')}
            style={styles.chip}
          >
            RTP
          </Chip>
          <Chip
            selected={filters.testingPoolStatus === 'TP'}
            onPress={() => handleTestingPoolFilter('TP')}
            style={styles.chip}
          >
            TP
          </Chip>

          {/* Sport Filter Menu */}
          <Menu
            visible={sportMenuVisible}
            onDismiss={() => setSportMenuVisible(false)}
            anchor={
              <Chip
                selected={!!filters.sport}
                onPress={() => setSportMenuVisible(true)}
                style={styles.chip}
                icon="chevron-down"
              >
                {filters.sport
                  ? SPORTS.find((s) => s.id === filters.sport)?.name || 'Sport'
                  : 'Sport'}
              </Chip>
            }
          >
            <Menu.Item
              onPress={() => handleSportFilter('')}
              title="All Sports"
            />
            {SPORTS.map((sport) => (
              <Menu.Item
                key={sport.id}
                onPress={() => handleSportFilter(sport.id)}
                title={sport.name}
              />
            ))}
          </Menu>
        </ScrollableChips>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            mode="text"
            compact
            onPress={handleClearFilters}
            style={styles.clearButton}
          >
            Clear
          </Button>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {athletes.length} athlete{athletes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Athletes List */}
      {loading && athletes.length === 0 ? (
        <LoadingState message="Loading athletes..." />
      ) : athletes.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Athletes Found"
          message={
            hasActiveFilters
              ? 'Try adjusting your filters'
              : 'No athletes have been created yet'
          }
        />
      ) : (
        <FlatList
          data={athletes}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

// ============================================================================
// SCROLLABLE CHIPS COMPONENT
// ============================================================================

const ScrollableChips: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.chipsRow}>{children}</View>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    elevation: 1,
  },
  searchInput: {
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  chip: {
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  clearButton: {
    marginLeft: SPACING.sm,
  },
  resultsHeader: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  resultsCount: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  athleteCard: {
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  athleteCardContent: {
    position: 'relative',
  },
  athleteHeader: {
    marginBottom: SPACING.sm,
  },
  athleteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  athleteName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    fontSize: 10,
  },
  athleteSport: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  athleteDetails: {
    marginTop: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  chevron: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -10,
  },
});
