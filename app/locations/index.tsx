/**
 * Locations Index Screen
 * View and manage home, training, and gym locations
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  Text,
  Card,
  Button,
} from '@/src/components/common';
import {
  BrandColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppDispatch } from '@/src/store/store';
import {
  fetchAllLocationsAsync,
  selectHomeLocation,
  selectTrainingLocation,
  selectGymLocation,
  selectLocationsLoading,
  selectLocationCompletionStatus,
} from '@/src/store/slices/locationsSlice';
import { selectUser } from '@/src/store/slices/authSlice';
import { LocationWithSchedule } from '@/src/types';

type LocationSlot = 'home' | 'training' | 'gym';

interface LocationCardData {
  slot: LocationSlot;
  title: string;
  icon: string;
  location: LocationWithSchedule | null;
  required: boolean;
}

export default function LocationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector(selectUser);
  const homeLocation = useSelector(selectHomeLocation);
  const trainingLocation = useSelector(selectTrainingLocation);
  const gymLocation = useSelector(selectGymLocation);
  const loading = useSelector(selectLocationsLoading);
  const completionStatus = useSelector(selectLocationCompletionStatus);

  const [refreshing, setRefreshing] = useState(false);

  // Fetch locations on mount
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchAllLocationsAsync(user.uid));
    }
  }, [user?.uid, dispatch]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    await dispatch(fetchAllLocationsAsync(user.uid));
    setRefreshing(false);
  }, [user?.uid, dispatch]);

  const locationCards: LocationCardData[] = [
    {
      slot: 'home',
      title: 'Home Location',
      icon: 'home',
      location: homeLocation,
      required: true,
    },
    {
      slot: 'training',
      title: 'Training Location',
      icon: 'fitness',
      location: trainingLocation,
      required: true,
    },
    {
      slot: 'gym',
      title: 'Gym Location',
      icon: 'barbell',
      location: gymLocation,
      required: false,
    },
  ];

  const handleEditLocation = (slot: LocationSlot) => {
    router.push(`/locations/edit?slot=${slot}`);
  };

  const handleAddLocation = (slot: LocationSlot) => {
    router.push(`/locations/add?slot=${slot}`);
  };

  const renderLocationCard = (data: LocationCardData) => {
    const { slot, title, icon, location, required } = data;
    const isComplete = location !== null;

    return (
      <Card key={slot} style={styles.locationCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${BrandColors.primary}15` }]}>
            <Ionicons name={icon as any} size={24} color={BrandColors.primary} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text variant="h6">{title}</Text>
            {required && (
              <Text variant="caption" color="secondary">
                Required
              </Text>
            )}
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isComplete ? '#E8F5E9' : '#FFF3E0' }
          ]}>
            <Ionicons
              name={isComplete ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={isComplete ? '#4CAF50' : '#FF9800'}
            />
          </View>
        </View>

        {location ? (
          <View style={styles.cardContent}>
            <Text variant="body" numberOfLines={1}>
              {location.address_line1}
            </Text>
            <Text variant="bodySmall" color="secondary" numberOfLines={2}>
              {location.city}, {location.country}
            </Text>
            <View style={styles.cardActions}>
              <Button
                title="Edit"
                variant="secondary"
                size="small"
                onPress={() => handleEditLocation(slot)}
                leftIcon={<Ionicons name="pencil" size={16} color={BrandColors.primary} />}
              />
            </View>
          </View>
        ) : (
          <View style={styles.cardContent}>
            <Text variant="body" color="secondary">
              No location set
            </Text>
            <View style={styles.cardActions}>
              <Button
                title="Add Location"
                variant="primary"
                size="small"
                onPress={() => handleAddLocation(slot)}
                leftIcon={<Ionicons name="add" size={16} color="#FFFFFF" />}
              />
            </View>
          </View>
        )}
      </Card>
    );
  };

  const renderCompletionStatus = () => {
    const { allMandatoryComplete } = completionStatus;

    return (
      <View style={[
        styles.statusContainer,
        { backgroundColor: allMandatoryComplete ? '#E8F5E9' : '#FFF3E0' }
      ]}>
        <Ionicons
          name={allMandatoryComplete ? 'checkmark-circle' : 'information-circle'}
          size={20}
          color={allMandatoryComplete ? '#4CAF50' : '#FF9800'}
        />
        <Text
          variant="bodySmall"
          customColor={allMandatoryComplete ? '#2E7D32' : '#E65100'}
          style={styles.statusText}
        >
          {allMandatoryComplete
            ? 'All required locations are set up'
            : 'Please set up your home and training locations'}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Locations',
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
          />
        }
      >
        {renderCompletionStatus()}

        <Text variant="label" color="secondary" style={styles.sectionTitle}>
          YOUR LOCATIONS
        </Text>

        {locationCards.map(renderLocationCard)}

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text variant="bodySmall" color="secondary" style={styles.infoText}>
            Your home and training locations are used to auto-fill your whereabouts submissions.
            Make sure they are accurate and up to date.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statusText: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  locationCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginLeft: 44 + Spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
  },
});
