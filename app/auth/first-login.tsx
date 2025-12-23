/**
 * First Login Screen
 * Forces password change for admin-created accounts
 *
 * TESTING CHECKLIST:
 * [ ] Enter wrong current password - should show error
 * [ ] Enter weak new password - should show validation errors
 * [ ] Enter mismatched confirm password - should show error
 * [ ] Successfully change password - should redirect to home
 * [ ] Back button should be disabled
 * [ ] Password strength indicator updates as user types
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  Alert,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ScreenContainer,
  Text,
  Button,
  Input,
  Spacer,
  Card,
} from '@/src/components/common';
import {
  BrandColors,
  SemanticColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import {
  useAppDispatch,
  useAppSelector,
  changePasswordAsync,
  selectPasswordChangeLoading,
  selectAuthError,
  selectAthlete,
  clearAuthError,
} from '@/src/store';

// Password requirements
const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'One uppercase letter', regex: /[A-Z]/ },
  { label: 'One lowercase letter', regex: /[a-z]/ },
  { label: 'One number', regex: /[0-9]/ },
  { label: 'One special character', regex: /[^a-zA-Z0-9]/ },
];

// Validation schema
const firstLoginSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
    .notOneOf([yup.ref('currentPassword')], 'New password must be different from current password'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type FirstLoginFormData = yup.InferType<typeof firstLoginSchema>;

/**
 * Calculate password strength
 */
const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

/**
 * Get color for password strength
 */
const getStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return SemanticColors.error;
    case 'medium':
      return SemanticColors.warning;
    case 'strong':
      return SemanticColors.success;
  }
};

export default function FirstLoginScreen() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectPasswordChangeLoading);
  const authError = useAppSelector(selectAuthError);
  const athlete = useAppSelector(selectAthlete);

  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<FirstLoginFormData>({
    resolver: yupResolver(firstLoginSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // Update password strength when password changes
  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(calculatePasswordStrength(newPassword));
    }
  }, [newPassword]);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        setError('currentPassword', { message: 'The temporary password you entered is incorrect' });
      } else if (authError.code === 'auth/weak-password') {
        setError('newPassword', { message: "Password doesn't meet requirements" });
      } else {
        setError('currentPassword', { message: authError.message });
      }
    }
  }, [authError, setError]);

  // Disable back button - password change is mandatory
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Password Change Required',
        'You must change your password before using the app.',
        [{ text: 'OK' }]
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  const onSubmit = async (data: FirstLoginFormData) => {
    Keyboard.dismiss();
    dispatch(clearAuthError());

    try {
      const resultAction = await dispatch(
        changePasswordAsync({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })
      );

      if (changePasswordAsync.fulfilled.match(resultAction)) {
        Alert.alert(
          'Password Changed',
          'Your password has been changed successfully. Welcome to CIOC Athlete!',
          [
            {
              text: 'Get Started',
              onPress: () => router.replace('/(tabs)/home'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('[FirstLogin] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const displayName = athlete?.first_name || 'Athlete';

  return (
    <ScreenContainer
      scroll
      keyboardAware
      contentStyle={styles.content}
      padded
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-open-outline" size={48} color={BrandColors.primary} />
        </View>
        <Text variant="h2" center>
          Welcome, {displayName}!
        </Text>
        <Spacer size="small" />
        <Text variant="body" color="secondary" center>
          For security, please change your temporary password before continuing.
        </Text>
      </View>

      <Spacer size="xlarge" />

      {/* Password Form */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Temporary Password"
              placeholder="Enter the password you received"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.currentPassword?.message}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              leftIcon="key-outline"
              required
            />
          )}
        />

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="New Password"
              placeholder="Create a strong password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.newPassword?.message}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              leftIcon="lock-closed-outline"
              required
            />
          )}
        />

        {/* Password Strength Indicator */}
        {newPassword && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width:
                      passwordStrength === 'weak'
                        ? '33%'
                        : passwordStrength === 'medium'
                        ? '66%'
                        : '100%',
                    backgroundColor: getStrengthColor(passwordStrength),
                  },
                ]}
              />
            </View>
            <Text
              variant="caption"
              customColor={getStrengthColor(passwordStrength)}
              style={styles.strengthLabel}
            >
              {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
            </Text>
          </View>
        )}

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              leftIcon="checkmark-circle-outline"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              required
            />
          )}
        />
      </View>

      {/* Password Requirements */}
      <Card style={styles.requirementsCard} padding="medium">
        <Text variant="label" color="secondary" style={styles.requirementsTitle}>
          Password Requirements
        </Text>
        {PASSWORD_REQUIREMENTS.map((req, index) => {
          const isMet = newPassword ? req.regex.test(newPassword) : false;
          return (
            <View key={index} style={styles.requirementRow}>
              <Ionicons
                name={isMet ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isMet ? SemanticColors.success : '#9CA3AF'}
              />
              <Text
                variant="bodySmall"
                color={isMet ? 'primary' : 'tertiary'}
                style={styles.requirementText}
              >
                {req.label}
              </Text>
            </View>
          );
        })}
      </Card>

      <Spacer size="large" />

      {/* Submit Button */}
      <Button
        title="Change Password"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        fullWidth
        leftIcon={<Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />}
      />

      <Spacer size="medium" />

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
        <Text variant="caption" color="tertiary" style={styles.securityNoteText}>
          Your password is encrypted and stored securely. CIOC staff cannot see your password.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing['2xl'],
  },
  header: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  form: {
    marginBottom: Spacing.md,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  requirementsCard: {
    backgroundColor: '#F9FAFB',
  },
  requirementsTitle: {
    marginBottom: Spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  requirementText: {
    marginLeft: Spacing.sm,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
  },
  securityNoteText: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
});
