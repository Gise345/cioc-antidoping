/**
 * Edit Location Screen
 * Edit an existing location for a specific slot (home, training, gym)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  Text,
  Button,
  Card,
  LoadingState,
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
  saveHomeLocationAsync,
  saveTrainingLocationAsync,
  saveGymLocationAsync,
  deleteGymLocationAsync,
  selectHomeLocation,
  selectTrainingLocation,
  selectGymLocation,
  selectLocationsLoading,
} from '@/src/store/slices/locationsSlice';
import { selectUser } from '@/src/store/slices/authSlice';
import { LocationWithSchedule } from '@/src/types';
import { TextInput } from 'react-native';

type LocationSlot = 'home' | 'training' | 'gym';

const SLOT_CONFIG: Record<LocationSlot, { title: string; icon: string }> = {
  home: { title: 'Home Location', icon: 'home' },
  training: { title: 'Training Location', icon: 'fitness' },
  gym: { title: 'Gym Location', icon: 'barbell' },
};

export default function EditLocationScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams<{ slot?: string }>();

  const slot = (params.slot as LocationSlot) || 'home';
  const config = SLOT_CONFIG[slot] || SLOT_CONFIG.home;

  const user = useSelector(selectUser);
  const loading = useSelector(selectLocationsLoading);
  const homeLocation = useSelector(selectHomeLocation);
  const trainingLocation = useSelector(selectTrainingLocation);
  const gymLocation = useSelector(selectGymLocation);

  // Get current location based on slot
  const currentLocation = {
    home: homeLocation,
    training: trainingLocation,
    gym: gymLocation,
  }[slot];

  // Form state
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [initialized, setInitialized] = useState(false);

  const [errors, setErrors] = useState<{
    addressLine1?: string;
    city?: string;
  }>({});

  // Initialize form with existing data
  useEffect(() => {
    if (currentLocation && !initialized) {
      setAddressLine1(currentLocation.address_line1 || '');
      setAddressLine2(currentLocation.address_line2 || '');
      setCity(currentLocation.city || '');
      setCountry(currentLocation.country || 'Cayman Islands');
      setPostalCode(currentLocation.postal_code || '');
      setAdditionalInfo(currentLocation.additional_info || '');
      setInitialized(true);
    }
  }, [currentLocation, initialized]);

  // Redirect if no location exists
  useEffect(() => {
    if (!loading && initialized && !currentLocation) {
      Alert.alert('Error', 'Location not found', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [loading, initialized, currentLocation]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!addressLine1.trim()) {
      newErrors.addressLine1 = 'Street address is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to save locations');
      return;
    }

    // Preserve existing schedule if available
    const existingSchedule = currentLocation ? {
      monday_start: currentLocation.monday_start,
      monday_end: currentLocation.monday_end,
      tuesday_start: currentLocation.tuesday_start,
      tuesday_end: currentLocation.tuesday_end,
      wednesday_start: currentLocation.wednesday_start,
      wednesday_end: currentLocation.wednesday_end,
      thursday_start: currentLocation.thursday_start,
      thursday_end: currentLocation.thursday_end,
      friday_start: currentLocation.friday_start,
      friday_end: currentLocation.friday_end,
      saturday_start: currentLocation.saturday_start,
      saturday_end: currentLocation.saturday_end,
      sunday_start: currentLocation.sunday_start,
      sunday_end: currentLocation.sunday_end,
    } : {
      monday_start: '06:00',
      monday_end: '22:00',
      tuesday_start: '06:00',
      tuesday_end: '22:00',
      wednesday_start: '06:00',
      wednesday_end: '22:00',
      thursday_start: '06:00',
      thursday_end: '22:00',
      friday_start: '06:00',
      friday_end: '22:00',
      saturday_start: '06:00',
      saturday_end: '22:00',
      sunday_start: '06:00',
      sunday_end: '22:00',
    };

    const locationData: LocationWithSchedule = {
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || undefined,
      city: city.trim(),
      country: country.trim(),
      postal_code: postalCode.trim() || undefined,
      additional_info: additionalInfo.trim() || undefined,
      ...existingSchedule,
    };

    try {
      const saveAction = {
        home: saveHomeLocationAsync,
        training: saveTrainingLocationAsync,
        gym: saveGymLocationAsync,
      }[slot];

      await dispatch(saveAction({ athleteId: user.uid, data: locationData })).unwrap();

      Alert.alert('Success', `${config.title} updated successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to save location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  const handleDelete = () => {
    if (slot !== 'gym') {
      Alert.alert('Cannot Delete', `${config.title} is required and cannot be deleted.`);
      return;
    }

    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this gym location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await dispatch(deleteGymLocationAsync(user.uid)).unwrap();
              Alert.alert('Deleted', 'Gym location has been removed', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Failed to delete location:', error);
              Alert.alert('Error', 'Failed to delete location. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!initialized && !currentLocation) {
    return <LoadingState message="Loading location..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Edit ${config.title}`,
          headerBackTitle: 'Back',
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Location Type Header */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${BrandColors.primary}15` }]}>
                <Ionicons name={config.icon as any} size={28} color={BrandColors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text variant="h5">{config.title}</Text>
                <Text variant="bodySmall" color="secondary">
                  {slot === 'gym' ? 'Optional' : 'Required for whereabouts'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Address Section */}
          <Text variant="label" color="secondary" style={styles.sectionLabel}>
            ADDRESS
          </Text>

          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text variant="bodySmall" style={[styles.inputLabel, { color: '#000000' }]}>
                Street Address *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.textPrimary },
                  errors.addressLine1 && styles.inputError,
                ]}
                placeholder="123 Main Street"
                placeholderTextColor={colors.textTertiary}
                value={addressLine1}
                onChangeText={(text) => {
                  setAddressLine1(text);
                  if (errors.addressLine1) setErrors((e) => ({ ...e, addressLine1: undefined }));
                }}
              />
              {errors.addressLine1 && (
                <Text variant="caption" color="error">{errors.addressLine1}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text variant="bodySmall" style={[styles.inputLabel, { color: '#000000' }]}>
                Address Line 2
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                placeholder="Apt, Suite, Unit, etc. (optional)"
                placeholderTextColor={colors.textTertiary}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text variant="bodySmall" style={[styles.inputLabel, { color: '#000000' }]}>
                  City *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, color: colors.textPrimary },
                    errors.city && styles.inputError,
                  ]}
                  placeholder="George Town"
                  placeholderTextColor={colors.textTertiary}
                  value={city}
                  onChangeText={(text) => {
                    setCity(text);
                    if (errors.city) setErrors((e) => ({ ...e, city: undefined }));
                  }}
                />
                {errors.city && (
                  <Text variant="caption" color="error">{errors.city}</Text>
                )}
              </View>

              <View style={styles.spacer} />

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text variant="bodySmall" style={[styles.inputLabel, { color: '#000000' }]}>
                  Postal Code
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                  placeholder="KY1-1234"
                  placeholderTextColor={colors.textTertiary}
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text variant="bodySmall" style={[styles.inputLabel, { color: '#000000' }]}>
                Country
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                placeholder="Cayman Islands"
                placeholderTextColor={colors.textTertiary}
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </Card>

          {/* Additional Info */}
          <Text variant="label" color="secondary" style={styles.sectionLabel}>
            ADDITIONAL DETAILS
          </Text>

          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text variant="bodySmall" style={[styles.inputLabel, { color: '#000000' }]}>
                Additional Information
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.textPrimary },
                ]}
                placeholder="Gate codes, parking info, building details..."
                placeholderTextColor={colors.textTertiary}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </Card>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="large"
            leftIcon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
          />

          {/* Delete Button (only for gym) */}
          {slot === 'gym' && (
            <Button
              title="Delete Location"
              onPress={handleDelete}
              variant="secondary"
              fullWidth
              size="large"
              style={styles.deleteButton}
              leftIcon={<Ionicons name="trash-outline" size={20} color="#EF4444" />}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  headerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  formCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: Spacing.md,
  },
  deleteButton: {
    marginTop: Spacing.md,
  },
});
