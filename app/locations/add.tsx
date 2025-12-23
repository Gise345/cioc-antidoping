/**
 * Add Location Screen
 * Create a new location for a specific slot (home, training, gym)
 */

import React, { useState } from 'react';
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

const DEFAULT_SCHEDULE = {
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

export default function AddLocationScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams<{ slot?: string }>();

  const slot = (params.slot as LocationSlot) || 'home';
  const config = SLOT_CONFIG[slot] || SLOT_CONFIG.home;

  const user = useSelector(selectUser);
  const loading = useSelector(selectLocationsLoading);

  // Form state
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('George Town');
  const [country, setCountry] = useState('Cayman Islands');
  const [postalCode, setPostalCode] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [errors, setErrors] = useState<{
    addressLine1?: string;
    city?: string;
  }>({});

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

    const locationData: LocationWithSchedule = {
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || undefined,
      city: city.trim(),
      country: country.trim(),
      postal_code: postalCode.trim() || undefined,
      additional_info: additionalInfo.trim() || undefined,
      ...DEFAULT_SCHEDULE,
    };

    try {
      const saveAction = {
        home: saveHomeLocationAsync,
        training: saveTrainingLocationAsync,
        gym: saveGymLocationAsync,
      }[slot];

      await dispatch(saveAction({ athleteId: user.uid, data: locationData })).unwrap();

      Alert.alert('Success', `${config.title} saved successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to save location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `Add ${config.title}`,
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
              <Text variant="bodySmall" color="secondary" style={styles.inputLabel}>
                Street Address *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text },
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
              <Text variant="bodySmall" color="secondary" style={styles.inputLabel}>
                Address Line 2
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Apt, Suite, Unit, etc. (optional)"
                placeholderTextColor={colors.textTertiary}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text variant="bodySmall" color="secondary" style={styles.inputLabel}>
                  City *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, color: colors.text },
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
                <Text variant="bodySmall" color="secondary" style={styles.inputLabel}>
                  Postal Code
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="KY1-1234"
                  placeholderTextColor={colors.textTertiary}
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text variant="bodySmall" color="secondary" style={styles.inputLabel}>
                Country
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
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
              <Text variant="bodySmall" color="secondary" style={styles.inputLabel}>
                Additional Information
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text },
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

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text variant="bodySmall" color="secondary" style={styles.infoText}>
              Default availability hours (6 AM - 10 PM) will be set automatically.
              You can adjust them later by editing the location.
            </Text>
          </View>

          {/* Save Button */}
          <Button
            title="Save Location"
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="large"
            leftIcon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
          />
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
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
  },
});
