/**
 * Forgot Password Screen
 * Request password reset email with Redux integration
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Keyboard, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ScreenContainer,
  Text,
  Button,
  Input,
  Spacer,
  IconButton,
} from '@/src/components/common';
import { BrandColors, SemanticColors, Spacing, BorderRadius } from '@/src/constants/theme';
import {
  useAppDispatch,
  useAppSelector,
  resetPasswordAsync,
  clearAuthError,
  selectAuthError,
} from '@/src/store';
import { forgotPasswordSchema, ForgotPasswordData } from '@/src/utils/validation';

export default function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const resetPasswordLoading = useAppSelector((state) => state.auth.resetPasswordLoading);
  const authError = useAppSelector(selectAuthError);

  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ForgotPasswordData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Show error from Redux if present
  useEffect(() => {
    if (authError) {
      setError('email', { message: authError.message });
    }
  }, [authError, setError]);

  const onSubmit = async (data: ForgotPasswordData) => {
    Keyboard.dismiss();
    dispatch(clearAuthError());

    try {
      const resultAction = await dispatch(resetPasswordAsync(data.email));

      if (resetPasswordAsync.fulfilled.match(resultAction)) {
        setSubmittedEmail(data.email);
        setIsSuccess(true);
      } else if (resetPasswordAsync.rejected.match(resultAction)) {
        // Error is handled by useEffect above
        console.log('[ResetPassword] Failed:', resultAction.payload);
      }
    } catch (error) {
      console.error('[ResetPassword] Unexpected error:', error);
      setError('email', { message: 'An unexpected error occurred. Please try again.' });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleTryAgain = () => {
    setIsSuccess(false);
    setSubmittedEmail('');
    reset();
    dispatch(clearAuthError());
  };

  const handleOpenEmail = async () => {
    // Try to open email app
    const mailUrl = Platform.select({
      ios: 'message://',
      android: 'mailto:',
      default: 'mailto:',
    });

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
      }
    } catch (error) {
      console.log('Could not open email app');
    }
  };

  if (isSuccess) {
    return (
      <ScreenContainer contentStyle={styles.successContent} padded>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="mail-outline"
              size={64}
              color={BrandColors.primary}
            />
          </View>

          <Text variant="h3" center style={styles.successTitle}>
            Check Your Email
          </Text>

          <Text variant="body" color="secondary" center style={styles.successText}>
            We've sent a password reset link to:
          </Text>

          <Text variant="body" center bold style={styles.emailText}>
            {submittedEmail}
          </Text>

          <Spacer size="large" />

          <Text variant="bodySmall" color="tertiary" center>
            Didn't receive the email? Check your spam folder or try again.
          </Text>

          <Spacer size="xlarge" />

          <Button
            title="Open Email App"
            onPress={handleOpenEmail}
            fullWidth
            leftIcon={<Ionicons name="mail-open-outline" size={20} color="#FFFFFF" />}
          />

          <Spacer size="medium" />

          <Button
            title="Try Different Email"
            variant="secondary"
            onPress={handleTryAgain}
            fullWidth
          />

          <Spacer size="large" />

          <Button
            title="Back to Sign In"
            variant="tertiary"
            onPress={handleBack}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      keyboardAware
      contentStyle={styles.content}
      padded
    >
      <View style={styles.header}>
        <IconButton
          icon={<Ionicons name="arrow-back" size={24} color={BrandColors.primary} />}
          onPress={handleBack}
          style={styles.backButton}
        />
      </View>

      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Ionicons
            name="lock-open-outline"
            size={48}
            color={BrandColors.primary}
          />
        </View>
      </View>

      <Text variant="h2" center>
        Forgot Password?
      </Text>

      <Spacer size="small" />

      <Text variant="body" color="secondary" center style={styles.description}>
        No worries! Enter your email address and we'll send you a link to reset your password.
      </Text>

      <Spacer size="xlarge" />

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              required
            />
          )}
        />

        <Spacer size="medium" />

        <Button
          title="Send Reset Link"
          onPress={handleSubmit(onSubmit)}
          loading={resetPasswordLoading}
          fullWidth
          rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="body" color="secondary">
          Remember your password?{' '}
        </Text>
        <Text
          variant="body"
          customColor={BrandColors.primary}
          bold
          onPress={handleBack}
        >
          Sign In
        </Text>
      </View>

      <View style={styles.helpSection}>
        <View style={styles.helpCard}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={SemanticColors.info}
          />
          <View style={styles.helpText}>
            <Text variant="bodySmall" bold>
              Need Help?
            </Text>
            <Text variant="caption" color="secondary">
              Contact CIOC support if you're having trouble accessing your account.
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
  },
  successContent: {
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginLeft: -Spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    paddingHorizontal: Spacing.lg,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  helpSection: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SemanticColors.infoBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  helpText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    marginBottom: Spacing.md,
  },
  successText: {
    marginBottom: Spacing.xs,
  },
  emailText: {
    marginTop: Spacing.xs,
  },
});
