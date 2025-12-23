/**
 * Whereabouts Tab Screen
 * Shows list of quarters and whereabouts management
 * Connected to Redux for real-time data
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
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
  EmptyState,
  NoQuartersEmpty,
  SkeletonQuarterCard,
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
import { QuarterStatus } from '@/src/types';
import { AppDispatch } from '@/src/store/store';
import {
  fetchQuartersAsync,
  selectQuarters,
  selectWhereaboutsLoading,
  QuarterWithId,
} from '@/src/store/slices/whereaboutsSlice';
import { selectUser } from '@/src/store/slices/authSlice';
import { QuarterName } from '@/src/types/firestore';

type FilterOption = 'all' | 'active' | 'submitted' | 'locked';

/**
 * Get the next quarter to file
 */
function getNextQuarter(quarters: QuarterWithId[]): { year: number; quarter: QuarterName } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Determine current quarter
  let currentQuarter: QuarterName;
  if (currentMonth <= 3) currentQuarter = 'Q1';
  else if (currentMonth <= 6) currentQuarter = 'Q2';
  else if (currentMonth <= 9) currentQuarter = 'Q3';
  else currentQuarter = 'Q4';

  // Check if current quarter already exists
  const currentExists = quarters.some(
    (q) => q.year === currentYear && q.quarter === currentQuarter
  );

  if (!currentExists) {
    return { year: currentYear, quarter: currentQuarter };
  }

  // Otherwise suggest next quarter
  const quarterOrder: QuarterName[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarterOrder.indexOf(currentQuarter);

  if (currentIndex === 3) {
    return { year: currentYear + 1, quarter: 'Q1' };
  }

  return { year: currentYear, quarter: quarterOrder[currentIndex + 1] };
}

export default function WhereaboutsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const user = useSelector(selectUser);
  const quarters = useSelector(selectQuarters);
  const loading = useSelector(selectWhereaboutsLoading);

  const [filter, setFilter] = useState<FilterOption>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch quarters on mount
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchQuartersAsync(user.uid));
    }
  }, [user?.uid, dispatch]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    await dispatch(fetchQuartersAsync(user.uid));
    setRefreshing(false);
  }, [user?.uid, dispatch]);

  // Filter quarters
  const filteredQuarters = useMemo(() => {
    return quarters.filter((quarter) => {
      switch (filter) {
        case 'active':
          return quarter.status === 'draft' || quarter.status === 'incomplete';
        case 'submitted':
          return quarter.status === 'submitted' || quarter.status === 'complete';
        case 'locked':
          return quarter.status === 'locked';
        default:
          return true;
      }
    });
  }, [quarters, filter]);

  // Get next quarter to file
  const nextQuarter = useMemo(() => getNextQuarter(quarters), [quarters]);

  const handleCreateQuarter = () => {
    router.push('/whereabouts/create-quarter');
  };

  const handleQuarterPress = (quarterId: string) => {
    router.push(`/whereabouts/quarter/${quarterId}`);
  };

  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const formatDeadline = (deadline: string): string => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusDescription = (status: QuarterStatus): string => {
    switch (status) {
      case 'draft':
        return 'Not started';
      case 'incomplete':
        return 'In progress';
      case 'complete':
        return 'Ready to submit';
      case 'submitted':
        return 'Submitted to WADA';
      case 'locked':
        return 'Past quarter';
      default:
        return '';
    }
  };

  const renderQuarterCard = ({ item }: { item: QuarterWithId }) => {
    const isActive = item.status === 'draft' || item.status === 'incomplete';
    // Handle Firestore Timestamp or string
    const submittedAt = item.submitted_at
      ? (typeof item.submitted_at === 'string'
          ? new Date(item.submitted_at)
          : (item.submitted_at as any).toDate?.() || new Date(item.submitted_at as any))
      : null;

    return (
      <PressableCard
        style={styles.quarterCard}
        onPress={() => handleQuarterPress(item.id)}
        padding="medium"
      >
        <View style={styles.quarterHeader}>
          <View>
            <Text variant="h5">
              {item.year} {item.quarter}
            </Text>
            <Text variant="caption" color="secondary">
              {formatDateRange(item.start_date, item.end_date)}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <Spacer size="medium" />

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text variant="caption" color="secondary">
              {item.days_completed} of {item.total_days} days
            </Text>
            <CompletionBadge percentage={item.completion_percentage} size="small" />
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.completion_percentage}%`,
                  backgroundColor:
                    item.completion_percentage >= 100
                      ? SemanticColors.success
                      : item.completion_percentage >= 50
                      ? BrandColors.primary
                      : SemanticColors.warning,
                },
              ]}
            />
          </View>
        </View>

        <Spacer size="medium" />

        {/* Footer */}
        <View style={styles.quarterFooter}>
          <View>
            <Text variant="caption" color="tertiary">
              {getStatusDescription(item.status)}
            </Text>
            {isActive && (
              <Text variant="caption" color="secondary" style={styles.deadlineText}>
                Deadline: {formatDeadline(item.filing_deadline)}
              </Text>
            )}
          </View>
          {isActive && (
            <View style={styles.continueButton}>
              <Text variant="caption" customColor={BrandColors.primary}>
                Continue
              </Text>
              <Ionicons name="arrow-forward" size={14} color={BrandColors.primary} />
            </View>
          )}
          {submittedAt && (
            <Text variant="caption" color="tertiary">
              Submitted {submittedAt.toLocaleDateString()}
            </Text>
          )}
        </View>
      </PressableCard>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'locked', label: 'Past' },
        ].map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setFilter(option.key as FilterOption)}
            style={[
              styles.filterChip,
              filter === option.key && styles.filterChipActive,
            ]}
          >
            <Text
              variant="caption"
              customColor={
                filter === option.key ? '#FFFFFF' : colors.textSecondary
              }
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Create Button for current quarter */}
      <Card style={styles.createCard} padding="medium">
        <View style={styles.createCardContent}>
          <View style={styles.createCardIcon}>
            <Ionicons name="add-circle" size={32} color={BrandColors.primary} />
          </View>
          <View style={styles.createCardText}>
            <Text variant="h6">Create New Quarter</Text>
            <Text variant="caption" color="secondary">
              Start filing for {nextQuarter.year} {nextQuarter.quarter}
            </Text>
          </View>
        </View>
        <Button
          title="Create"
          size="small"
          onPress={handleCreateQuarter}
          rightIcon={<Ionicons name="add" size={18} color="#FFFFFF" />}
        />
      </Card>
    </View>
  );

  const renderEmpty = () => (
    <NoQuartersEmpty onCreate={handleCreateQuarter} />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text variant="h2">Whereabouts</Text>
        <Pressable
          onPress={() => router.push('/whereabouts/templates')}
          style={styles.headerButton}
        >
          <Ionicons name="copy-outline" size={24} color={BrandColors.primary} />
        </Pressable>
      </View>

      {loading && quarters.length === 0 ? (
        <View style={styles.loadingContainer}>
          <SkeletonQuarterCard />
          <SkeletonQuarterCard />
          <SkeletonQuarterCard />
        </View>
      ) : (
        <FlatList
          data={filteredQuarters}
          renderItem={renderQuarterCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 80 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BrandColors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(0, 102, 204, 0.02)',
  },
  createCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createCardIcon: {
    marginRight: Spacing.md,
  },
  createCardText: {
    flex: 1,
  },
  quarterCard: {
    marginBottom: Spacing.md,
  },
  quarterHeader: {
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
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  quarterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  deadlineText: {
    marginTop: 2,
  },
});
