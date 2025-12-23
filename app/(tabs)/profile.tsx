/**
 * Profile Tab Screen
 * Athlete profile, settings, and account management
 * Connected to Redux state
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Text,
  Card,
  Button,
  Badge,
  Spacer,
  Divider,
  Input,
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
import {
  useAppDispatch,
  useAppSelector,
  selectUser,
  selectUserProfile,
  selectAthlete,
  logoutAsync,
  changePasswordAsync,
  selectPasswordChangeLoading,
  selectAuthError,
  clearAuthError,
} from '@/src/store';

// Password change validation schema
const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain lowercase letter')
    .matches(/[A-Z]/, 'Must contain uppercase letter')
    .matches(/[0-9]/, 'Must contain number')
    .matches(/[^a-zA-Z0-9]/, 'Must contain special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type ChangePasswordFormData = yup.InferType<typeof changePasswordSchema>;

interface MenuItem {
  icon: string;
  label: string;
  description?: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'error';
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Account',
    items: [
      {
        icon: 'person-outline',
        label: 'Edit Profile',
        description: 'Update your personal information',
        route: '/profile/edit',
      },
      {
        icon: 'location-outline',
        label: 'My Locations',
        description: 'Manage saved locations',
        route: '/locations',
      },
      {
        icon: 'trophy-outline',
        label: 'Competitions',
        description: 'Manage upcoming events',
        route: '/competitions',
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        icon: 'notifications-outline',
        label: 'Notifications',
        description: 'Configure alerts and reminders',
        route: '/profile/notifications',
      },
      {
        icon: 'moon-outline',
        label: 'Appearance',
        description: 'Theme and display settings',
        route: '/profile/appearance',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        icon: 'help-circle-outline',
        label: 'Help Center',
        description: 'FAQs and guides',
        route: '/profile/help',
      },
      {
        icon: 'chatbubble-outline',
        label: 'Contact Support',
        description: 'Get help from CIOC',
        route: '/profile/contact',
      },
      {
        icon: 'document-text-outline',
        label: 'WADA Guidelines',
        description: 'Whereabouts requirements',
        route: '/profile/guidelines',
      },
    ],
  },
  {
    title: 'About',
    items: [
      {
        icon: 'information-circle-outline',
        label: 'About CIOC Athlete',
        description: 'Version 1.0.0',
        route: '/profile/about',
      },
      {
        icon: 'shield-checkmark-outline',
        label: 'Privacy Policy',
        route: '/profile/privacy',
      },
      {
        icon: 'document-outline',
        label: 'Terms of Service',
        route: '/profile/terms',
      },
    ],
  },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  // Redux state
  const user = useAppSelector(selectUser);
  const userProfile = useAppSelector(selectUserProfile);
  const athlete = useAppSelector(selectAthlete);
  const passwordChangeLoading = useAppSelector(selectPasswordChangeLoading);
  const authError = useAppSelector(selectAuthError);

  // Local state
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Password change form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ChangePasswordFormData>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

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

  const handleOpenPasswordModal = () => {
    dispatch(clearAuthError());
    reset();
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    reset();
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    dispatch(clearAuthError());

    const resultAction = await dispatch(
      changePasswordAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
    );

    if (changePasswordAsync.fulfilled.match(resultAction)) {
      handleClosePasswordModal();
      Alert.alert('Success', 'Your password has been changed successfully.');
    } else if (changePasswordAsync.rejected.match(resultAction)) {
      const error = resultAction.payload;
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setError('currentPassword', { message: 'Current password is incorrect' });
      } else {
        setError('currentPassword', { message: error?.message || 'Failed to change password' });
      }
    }
  };

  const getTestingPoolLabel = (status?: string): string => {
    switch (status) {
      case 'RTP':
        return 'Registered Testing Pool';
      case 'TP':
        return 'Testing Pool';
      case 'NONE':
      default:
        return 'Not in Testing Pool';
    }
  };

  const getResidenceStatusLabel = (status?: string): string => {
    switch (status) {
      case 'local':
        return 'Local (Cayman Islands)';
      case 'overseas':
        return 'Overseas';
      default:
        return 'Not specified';
    }
  };

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <Pressable
      key={item.label}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={() => {
        if (item.onPress) {
          item.onPress();
        } else if (item.route) {
          router.push(item.route as any);
        }
      }}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
      </View>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemHeader}>
          <Text variant="body">{item.label}</Text>
          {item.badge && (
            <Badge
              label={item.badge}
              variant={item.badgeVariant || 'primary'}
              size="small"
            />
          )}
        </View>
        {item.description && (
          <Text variant="caption" color="tertiary">
            {item.description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );

  // Display data
  const displayName = athlete
    ? `${athlete.first_name} ${athlete.last_name}`
    : user?.displayName || 'Athlete';
  const initials = athlete
    ? `${athlete.first_name?.[0] || ''}${athlete.last_name?.[0] || ''}`
    : displayName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md, paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Pressable style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text variant="h2" customColor="#FFFFFF">
                {initials}
              </Text>
            </View>
            <View style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </Pressable>

          <Spacer size="medium" />

          <Text variant="h3">{displayName}</Text>
          <Text variant="body" color="secondary">
            {athlete?.sport_name || 'Athlete'} • {athlete?.nationality || 'Cayman Islands'}
          </Text>

          <Spacer size="small" />

          <View style={styles.badges}>
            {athlete?.testing_pool_status && athlete.testing_pool_status !== 'NONE' && (
              <Badge
                label={athlete.testing_pool_status}
                variant="primary"
                outline
              />
            )}
            {athlete?.sport_id && (
              <Badge
                label={athlete.sport_id.toUpperCase().slice(0, 3)}
                variant="secondary"
                outline
              />
            )}
          </View>
        </View>

        {/* Athlete Info Card */}
        <Card style={styles.infoCard} padding="medium">
          {/* NOC and Sport */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text variant="caption" color="secondary">
                National Olympic Committee
              </Text>
              <Text variant="bodySmall" bold>
                {athlete?.noc_id || 'CIOC'}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text variant="caption" color="secondary">
                Sport
              </Text>
              <Text variant="bodySmall" bold>
                {athlete?.sport_name || 'Not specified'}
              </Text>
            </View>
          </View>

          <Divider spacing="medium" />

          {/* Residence and Testing Pool Status */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text variant="caption" color="secondary">
                Residence Status
              </Text>
              <Text variant="bodySmall">
                {getResidenceStatusLabel(athlete?.residence_status)}
              </Text>
            </View>
          </View>

          <Spacer size="small" />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text variant="caption" color="secondary">
                Testing Pool Status
              </Text>
              <Text variant="bodySmall">
                {getTestingPoolLabel(athlete?.testing_pool_status)}
              </Text>
            </View>
          </View>

          <Divider spacing="medium" />

          {/* Admin contact note */}
          <View style={styles.adminNote}>
            <Ionicons name="information-circle-outline" size={16} color={SemanticColors.info} />
            <Text variant="caption" color="secondary" style={styles.adminNoteText}>
              Contact admin to update NOC, sport, or testing pool status
            </Text>
          </View>
        </Card>

        {/* Security Section */}
        <View style={styles.menuSection}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            Security
          </Text>
          <Card padding="none">
            <Pressable
              style={styles.menuItem}
              onPress={handleOpenPasswordModal}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name="key-outline" size={22} color={colors.textSecondary} />
              </View>
              <View style={styles.menuItemContent}>
                <Text variant="body">Change Password</Text>
                <Text variant="caption" color="tertiary">
                  Update your account password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
          </Card>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text variant="label" color="secondary" style={styles.sectionTitle}>
              {section.title}
            </Text>
            <Card padding="none">
              {section.items.map((item, index) =>
                renderMenuItem(item, index === section.items.length - 1)
              )}
            </Card>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            variant="secondary"
            onPress={handleLogout}
            fullWidth
            leftIcon={
              <Ionicons name="log-out-outline" size={20} color={BrandColors.primary} />
            }
          />
        </View>

        {/* App Version */}
        <View style={styles.versionInfo}>
          <Text variant="caption" color="tertiary" center>
            CIOC Athlete v1.0.0
          </Text>
          <Text variant="caption" color="tertiary" center>
            Cayman Islands Olympic Committee
          </Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClosePasswordModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text variant="h4">Change Password</Text>
            <Pressable onPress={handleClosePasswordModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text variant="body" color="secondary" style={styles.modalDescription}>
              Enter your current password and choose a new password.
            </Text>

            <Spacer size="large" />

            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Current Password"
                  placeholder="Enter current password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.currentPassword?.message}
                  secureTextEntry
                  showPasswordToggle
                  leftIcon="lock-closed-outline"
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
                  placeholder="Enter new password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                  secureTextEntry
                  showPasswordToggle
                  leftIcon="key-outline"
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  showPasswordToggle
                  leftIcon="checkmark-circle-outline"
                  required
                />
              )}
            />

            <Spacer size="large" />

            <Button
              title="Change Password"
              onPress={handleSubmit(handleChangePassword)}
              loading={passwordChangeLoading}
              fullWidth
            />

            <Spacer size="medium" />

            <Button
              title="Cancel"
              variant="tertiary"
              onPress={handleClosePasswordModal}
              fullWidth
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Spacing.md,
  },
  adminNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SemanticColors.infoBackground,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  adminNoteText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  menuSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoutSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  modalDescription: {
    marginBottom: Spacing.md,
  },
});
