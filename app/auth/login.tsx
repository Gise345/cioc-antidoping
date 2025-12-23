/**
 * Login Screen
 * Email and password authentication with Redux integration
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Keyboard,
  Alert,
} from 'react-native';
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
} from '@/src/components/common';
import { BrandColors, Spacing, BorderRadius } from '@/src/constants/theme';
import {
  useAppDispatch,
  useAppSelector,
  loginAsync,
  clearAuthError,
  selectAuthError,
  devBypassAuth,
} from '@/src/store';
import { loginSchema, LoginFormData } from '@/src/utils/validation';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const loginLoading = useAppSelector((state) => state.auth.loginLoading);
  const authError = useAppSelector(selectAuthError);

  // Form setup with react-hook-form and yup validation
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Show error from Redux if present
  useEffect(() => {
    if (authError) {
      // Set error on password field for general auth errors
      setError('password', { message: authError.message });
    }
  }, [authError, setError]);

  const onSubmit = async (data: LoginFormData) => {
    Keyboard.dismiss();
    dispatch(clearAuthError());

    try {
      const resultAction = await dispatch(
        loginAsync({ email: data.email, password: data.password })
      );

      if (loginAsync.fulfilled.match(resultAction)) {
        const { requiresPasswordChange } = resultAction.payload;

        if (requiresPasswordChange) {
          // First login - redirect to password change screen
          console.log('[Login] First login detected, redirecting to password change...');
          router.replace('/auth/first-login');
        } else {
          // Normal login - redirect to home
          console.log('[Login] Success, redirecting to home...');
          router.replace('/(tabs)/home');
        }
      } else if (loginAsync.rejected.match(resultAction)) {
        // Error is handled by useEffect above
        console.log('[Login] Failed:', resultAction.payload);
      }
    } catch (error) {
      console.error('[Login] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Account Registration',
      'Athlete accounts are created by CIOC administrators. Please contact your National Olympic Committee or federation to request access.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScreenContainer
      scroll
      keyboardAware
      contentStyle={styles.content}
      padded
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Ionicons name="shield-checkmark" size={64} color={BrandColors.primary} />
        </View>
        <Text variant="h2" center style={styles.appName}>
          CIOC Athlete
        </Text>
        <Text variant="body" color="secondary" center>
          Whereabouts Management
        </Text>
      </View>

      <Spacer size="xlarge" />

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              returnKeyType="next"
              required
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              autoComplete="password"
              leftIcon="lock-closed-outline"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              required
            />
          )}
        />

        <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
          <Text variant="bodySmall" customColor={BrandColors.primary}>
            Forgot Password?
          </Text>
        </Pressable>

        <Spacer size="medium" />

        <Button
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={loginLoading}
          fullWidth
        />
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text variant="caption" color="tertiary" style={styles.dividerText}>
          OR
        </Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialButtons}>
        <Button
          title="Continue with Phone"
          variant="secondary"
          onPress={() => {
            Alert.alert('Coming Soon', 'Phone authentication will be available in a future update.');
          }}
          leftIcon={<Ionicons name="phone-portrait-outline" size={20} color={BrandColors.primary} />}
          fullWidth
        />
      </View>

      <View style={styles.footer}>
        <Text variant="body" color="secondary">
          Need an account?{' '}
        </Text>
        <Pressable onPress={handleContactAdmin}>
          <Text variant="body" customColor={BrandColors.primary} bold>
            Contact Admin
          </Text>
        </Pressable>
      </View>

      {/* Development only: Quick login for testing */}
      {__DEV__ && (
        <View style={styles.devSection}>
          <Text variant="caption" color="tertiary" center>
            Development Mode
          </Text>
          <Button
            title="Skip to Home (Dev)"
            variant="tertiary"
            size="small"
            onPress={() => {
              dispatch(devBypassAuth());
              router.replace('/(tabs)/home');
            }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    marginTop: Spacing.sm,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
    padding: Spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    marginBottom: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  devSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
