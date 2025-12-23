/**
 * Create Athlete Screen
 * Multi-step form for creating new athlete accounts
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Clipboard } from 'react-native';
import {
  TextInput,
  Button,
  ProgressBar,
  Card,
  RadioButton,
  HelperText,
  Portal,
  Dialog,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { ScreenContainer, Text } from '@/src/components/common';
import { COLORS, SPACING } from '@/src/constants/theme';
import { SPORTS, NOC_LIST, RESIDENCE_STATUS } from '@/src/constants';
import { AppDispatch } from '@/src/store';
import {
  createAthleteAsync,
  selectAdminCreating,
  selectAdminError,
  selectLastCreatedAthlete,
  clearLastCreatedAthlete,
  clearError,
} from '@/src/store/slices/adminSlice';
import { Gender, TestingPoolStatus, ResidenceStatus } from '@/src/types/firestore';

// ============================================================================
// TYPES
// ============================================================================

interface FormData {
  // Step 1: Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: Gender;
  // Step 2: Athletic
  nocId: string;
  sport: string;
  sportName: string;
  residenceStatus: ResidenceStatus;
  testingPoolStatus: TestingPoolStatus;
}

interface FormErrors {
  [key: string]: string;
}

const INITIAL_FORM_DATA: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '+1-345-',
  dateOfBirth: new Date(2000, 0, 1),
  gender: 'male',
  nocId: 'cayman_islands',
  sport: '',
  sportName: '',
  residenceStatus: 'local',
  testingPoolStatus: 'NONE',
};

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const TESTING_POOL_OPTIONS = [
  { value: 'NONE', label: 'Not in Testing Pool' },
  { value: 'RTP', label: 'Registered Testing Pool (RTP)' },
  { value: 'TP', label: 'Testing Pool (TP)' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateAthleteScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectAdminCreating);
  const error = useSelector(selectAdminError);
  const lastCreated = useSelector(selectLastCreatedAthlete);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);

  // Update form field
  const updateField = useCallback((field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  // Validate Step 1
  const validateStep1 = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone || !/^\+1-345-\d{3}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Phone format: +1-345-XXX-XXXX';
    }

    // Check age (must be at least 10)
    const today = new Date();
    const age = today.getFullYear() - formData.dateOfBirth.getFullYear();
    if (age < 10) {
      newErrors.dateOfBirth = 'Athlete must be at least 10 years old';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Validate Step 2
  const validateStep2 = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nocId) {
      newErrors.nocId = 'Please select a National Olympic Committee';
    }
    if (!formData.sport) {
      newErrors.sport = 'Please select a sport';
    }
    if (!formData.residenceStatus) {
      newErrors.residenceStatus = 'Please select residence status';
    }
    if (!formData.testingPoolStatus) {
      newErrors.testingPoolStatus = 'Please select testing pool status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  }, [step, validateStep1, validateStep2]);

  // Handle back
  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  // Handle create account
  const handleCreate = useCallback(async () => {
    dispatch(clearError());

    const selectedSport = SPORTS.find((s) => s.id === formData.sport);

    const result = await dispatch(
      createAthleteAsync({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth.toISOString().split('T')[0],
        gender: formData.gender,
        nocId: formData.nocId,
        sport: formData.sport,
        sportName: selectedSport?.name,
        residenceStatus: formData.residenceStatus,
        testingPoolStatus: formData.testingPoolStatus,
      })
    );

    if (createAthleteAsync.fulfilled.match(result)) {
      setSuccessDialogVisible(true);
    }
  }, [dispatch, formData]);

  // Handle copy password
  const handleCopyPassword = useCallback(() => {
    if (lastCreated?.tempPassword) {
      Clipboard.setString(lastCreated.tempPassword);
      Alert.alert('Copied', 'Password copied to clipboard');
    }
  }, [lastCreated]);

  // Handle create another
  const handleCreateAnother = useCallback(() => {
    dispatch(clearLastCreatedAthlete());
    setSuccessDialogVisible(false);
    setFormData(INITIAL_FORM_DATA);
    setStep(1);
    setErrors({});
  }, [dispatch]);

  // Handle view athletes
  const handleViewAthletes = useCallback(() => {
    dispatch(clearLastCreatedAthlete());
    setSuccessDialogVisible(false);
    router.replace('/admin/athletes');
  }, [dispatch, router]);

  // Handle date change
  const handleDateChange = useCallback(
    (event: unknown, date?: Date) => {
      setShowDatePicker(false);
      if (date) {
        updateField('dateOfBirth', date);
      }
    },
    [updateField]
  );

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle sport selection
  const handleSportChange = useCallback(
    (sportId: string) => {
      const sport = SPORTS.find((s) => s.id === sportId);
      updateField('sport', sportId);
      updateField('sportName', sport?.name || '');
    },
    [updateField]
  );

  return (
    <ScreenContainer>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={step / 3} color={COLORS.primary} style={styles.progressBar} />
        <Text style={styles.stepText}>Step {step} of 3</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card style={styles.card}>
            <Card.Title title="Personal Information" titleStyle={styles.cardTitle} />
            <Card.Content>
              <TextInput
                mode="outlined"
                label="First Name *"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                error={!!errors.firstName}
                style={styles.input}
              />
              {errors.firstName && (
                <HelperText type="error">{errors.firstName}</HelperText>
              )}

              <TextInput
                mode="outlined"
                label="Last Name *"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                error={!!errors.lastName}
                style={styles.input}
              />
              {errors.lastName && (
                <HelperText type="error">{errors.lastName}</HelperText>
              )}

              <TextInput
                mode="outlined"
                label="Email *"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={styles.input}
              />
              {errors.email && (
                <HelperText type="error">{errors.email}</HelperText>
              )}

              <TextInput
                mode="outlined"
                label="Phone *"
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                keyboardType="phone-pad"
                error={!!errors.phone}
                style={styles.input}
              />
              {errors.phone && (
                <HelperText type="error">{errors.phone}</HelperText>
              )}

              <Text style={styles.label}>Date of Birth *</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                contentStyle={styles.dateButtonContent}
              >
                {formatDate(formData.dateOfBirth)}
              </Button>
              {errors.dateOfBirth && (
                <HelperText type="error">{errors.dateOfBirth}</HelperText>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={formData.dateOfBirth}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1920, 0, 1)}
                />
              )}

              <Text style={styles.label}>Gender *</Text>
              <RadioButton.Group
                value={formData.gender}
                onValueChange={(value) => updateField('gender', value as Gender)}
              >
                {GENDER_OPTIONS.map((option) => (
                  <View key={option.value} style={styles.radioRow}>
                    <RadioButton value={option.value} />
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            </Card.Content>
          </Card>
        )}

        {/* Step 2: Athletic Information */}
        {step === 2 && (
          <Card style={styles.card}>
            <Card.Title title="Athletic Information" titleStyle={styles.cardTitle} />
            <Card.Content>
              <Text style={styles.label}>National Olympic Committee *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.nocId}
                  onValueChange={(value) => updateField('nocId', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select NOC..." value="" />
                  {NOC_LIST.map((noc) => (
                    <Picker.Item key={noc.id} label={noc.name} value={noc.id} />
                  ))}
                </Picker>
              </View>
              {errors.nocId && (
                <HelperText type="error">{errors.nocId}</HelperText>
              )}

              <Text style={styles.label}>Sport *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.sport}
                  onValueChange={handleSportChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Select sport..." value="" />
                  {SPORTS.map((sport) => (
                    <Picker.Item key={sport.id} label={sport.name} value={sport.id} />
                  ))}
                </Picker>
              </View>
              {errors.sport && (
                <HelperText type="error">{errors.sport}</HelperText>
              )}

              <Text style={styles.label}>Residence Status *</Text>
              <RadioButton.Group
                value={formData.residenceStatus}
                onValueChange={(value) => updateField('residenceStatus', value as ResidenceStatus)}
              >
                <View style={styles.radioRow}>
                  <RadioButton value="local" />
                  <Text style={styles.radioLabel}>Local (Cayman Islands)</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="overseas" />
                  <Text style={styles.radioLabel}>Overseas</Text>
                </View>
              </RadioButton.Group>
              {errors.residenceStatus && (
                <HelperText type="error">{errors.residenceStatus}</HelperText>
              )}

              <Text style={styles.label}>Testing Pool Status *</Text>
              <RadioButton.Group
                value={formData.testingPoolStatus}
                onValueChange={(value) =>
                  updateField('testingPoolStatus', value as TestingPoolStatus)
                }
              >
                {TESTING_POOL_OPTIONS.map((option) => (
                  <View key={option.value} style={styles.radioRow}>
                    <RadioButton value={option.value} />
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </View>
                ))}
              </RadioButton.Group>
              {errors.testingPoolStatus && (
                <HelperText type="error">{errors.testingPoolStatus}</HelperText>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <>
            <Card style={styles.card}>
              <Card.Title title="Review Information" titleStyle={styles.cardTitle} />
              <Card.Content>
                <Text style={styles.sectionLabel}>Personal Information</Text>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Name:</Text>
                  <Text style={styles.reviewValue}>
                    {formData.firstName} {formData.lastName}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Email:</Text>
                  <Text style={styles.reviewValue}>{formData.email}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Phone:</Text>
                  <Text style={styles.reviewValue}>{formData.phone}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>DOB:</Text>
                  <Text style={styles.reviewValue}>{formatDate(formData.dateOfBirth)}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Gender:</Text>
                  <Text style={styles.reviewValue}>
                    {GENDER_OPTIONS.find((g) => g.value === formData.gender)?.label}
                  </Text>
                </View>

                <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>
                  Athletic Information
                </Text>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>NOC:</Text>
                  <Text style={styles.reviewValue}>
                    {NOC_LIST.find((n) => n.id === formData.nocId)?.name}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Sport:</Text>
                  <Text style={styles.reviewValue}>{formData.sportName}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Residence:</Text>
                  <Text style={styles.reviewValue}>
                    {formData.residenceStatus === 'local' ? 'Local' : 'Overseas'}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Testing Pool:</Text>
                  <Text style={styles.reviewValue}>
                    {TESTING_POOL_OPTIONS.find((t) => t.value === formData.testingPoolStatus)?.label}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {error && (
              <Card style={[styles.card, styles.errorCard]}>
                <Card.Content>
                  <Text style={styles.errorText}>{error}</Text>
                </Card.Content>
              </Card>
            )}
          </>
        )}

        {/* Navigation Buttons */}
        <View style={styles.buttonsContainer}>
          {step > 1 && (
            <Button
              mode="outlined"
              onPress={handleBack}
              style={styles.backButton}
              disabled={creating}
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.nextButton}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleCreate}
              loading={creating}
              disabled={creating}
              style={styles.nextButton}
            >
              Create Account
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Success Dialog */}
      <Portal>
        <Dialog visible={successDialogVisible} dismissable={false}>
          <Dialog.Title>Account Created</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Athlete account for {lastCreated?.name} has been created successfully.
            </Text>
            <Text style={[styles.dialogText, { marginTop: SPACING.sm }]}>
              Email: {lastCreated?.email}
            </Text>

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Temporary Password:</Text>
              <View style={styles.passwordRow}>
                <Text style={styles.passwordText}>
                  {showPassword ? lastCreated?.tempPassword : '••••••••••••'}
                </Text>
                <IconButton
                  icon={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  onPress={() => setShowPassword(!showPassword)}
                />
                <IconButton
                  icon="content-copy"
                  size={20}
                  onPress={handleCopyPassword}
                />
              </View>
            </View>

            <Text style={styles.warningText}>
              Please share this password securely with the athlete. They will be required to
              change it on first login.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCreateAnother}>Create Another</Button>
            <Button onPress={handleViewAthletes}>View Athletes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  dateButton: {
    marginBottom: SPACING.xs,
  },
  dateButtonContent: {
    justifyContent: 'flex-start',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  radioLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  picker: {
    height: 50,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  reviewLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    width: 100,
  },
  reviewValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  backButton: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nextButton: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  dialogText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  passwordContainer: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  passwordLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'monospace',
    color: COLORS.text.primary,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});
