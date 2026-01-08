/**
 * Athlete Detail Screen
 * View and manage individual athlete details
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Button, Badge, Divider, Dialog, Portal, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer, Text, LoadingState } from '@/src/components/common';
import { COLORS, SPACING } from '@/src/constants/theme';
import { SPORTS, RESIDENCE_STATUS } from '@/src/constants';
import { AppDispatch } from '@/src/store';
import {
  fetchAthleteDetailsAsync,
  updateAthleteAsync,
  deactivateAthleteAsync,
  reactivateAthleteAsync,
  resetPasswordAsync,
  selectSelectedAthlete,
  selectAdminLoading,
  selectLastCreatedAthlete,
  clearLastCreatedAthlete,
} from '@/src/store/slices/adminSlice';
import { useAdmin } from '@/src/hooks/useAdmin';

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | undefined;
  iconColor?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, iconColor = COLORS.text.secondary }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabel}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.infoLabelText}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value || 'Not set'}</Text>
  </View>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AthleteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isSuperAdmin } = useAdmin();

  const athlete = useSelector(selectSelectedAthlete);
  const loading = useSelector(selectAdminLoading);
  const lastCreated = useSelector(selectLastCreatedAthlete);

  const [refreshing, setRefreshing] = useState(false);
  const [resetPasswordDialogVisible, setResetPasswordDialogVisible] = useState(false);
  const [deactivateDialogVisible, setDeactivateDialogVisible] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch athlete details on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchAthleteDetailsAsync(id));
    }
  }, [dispatch, id]);

  // Check if this is a newly created athlete
  useEffect(() => {
    if (lastCreated && lastCreated.userId === id) {
      setTempPassword(lastCreated.tempPassword);
      dispatch(clearLastCreatedAthlete());
    }
  }, [lastCreated, id, dispatch]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    await dispatch(fetchAthleteDetailsAsync(id));
    setRefreshing(false);
  }, [dispatch, id]);

  // Reset password handler
  const handleResetPassword = useCallback(async () => {
    if (!id || !athlete) return;
    setActionLoading(true);
    try {
      const result = await dispatch(resetPasswordAsync({ athleteId: id, email: athlete.user.email })).unwrap();
      setTempPassword(result.tempPassword);
      setResetPasswordDialogVisible(false);
      Alert.alert(
        'Password Reset',
        `A password reset email has been sent.\n\nTemporary Password: ${result.tempPassword}\n\nPlease share this with the athlete securely.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [dispatch, id, athlete]);

  // Deactivate handler
  const handleDeactivate = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await dispatch(deactivateAthleteAsync(id)).unwrap();
      setDeactivateDialogVisible(false);
      Alert.alert('Success', 'Athlete account has been deactivated.');
      dispatch(fetchAthleteDetailsAsync(id));
    } catch (error) {
      Alert.alert('Error', 'Failed to deactivate account. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [dispatch, id]);

  // Reactivate handler
  const handleReactivate = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await dispatch(reactivateAthleteAsync(id)).unwrap();
      Alert.alert('Success', 'Athlete account has been reactivated.');
      dispatch(fetchAthleteDetailsAsync(id));
    } catch (error) {
      Alert.alert('Error', 'Failed to reactivate account. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [dispatch, id]);

  // Navigate to edit
  const handleEdit = useCallback(() => {
    router.push(`/admin/edit-athlete/${id}` as any);
  }, [router, id]);

  // Navigate to view athlete's dashboard
  const handleViewAthleteDashboard = useCallback(() => {
    router.push(`/admin/athlete-dashboard/${id}` as any);
  }, [router, id]);

  if (loading && !athlete) {
    return <LoadingState message="Loading athlete details..." />;
  }

  if (!athlete) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Athlete not found</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  const isActive = athlete.athlete.status === 'active';
  const sportName = SPORTS.find((s) => s.id === athlete.athlete.sport_id)?.name || athlete.athlete.sport_id;

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
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
          <Text style={styles.athleteSport}>{sportName}</Text>
          <Text style={styles.athleteEmail}>{athlete.user.email}</Text>
        </View>

        {/* Temporary Password Alert */}
        {tempPassword && (
          <Card style={[styles.card, styles.alertCard]}>
            <Card.Content>
              <View style={styles.alertHeader}>
                <Ionicons name="key" size={24} color={COLORS.warning} />
                <Text style={styles.alertTitle}>Temporary Password</Text>
              </View>
              <Text style={styles.alertMessage}>
                Share this password with the athlete securely. They will be required to change it on first login.
              </Text>
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordText}>{tempPassword}</Text>
              </View>
              <Button
                mode="text"
                compact
                onPress={() => setTempPassword(null)}
                style={styles.dismissButton}
              >
                Dismiss
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Title title="Personal Information" titleStyle={styles.cardTitle} />
          <Card.Content>
            <InfoRow icon="person-outline" label="Full Name" value={`${athlete.athlete.first_name} ${athlete.athlete.last_name}`} />
            <Divider style={styles.divider} />
            <InfoRow icon="mail-outline" label="Email" value={athlete.user.email} />
            <Divider style={styles.divider} />
            <InfoRow icon="call-outline" label="Phone" value={athlete.athlete.phone} />
            <Divider style={styles.divider} />
            <InfoRow icon="calendar-outline" label="Date of Birth" value={athlete.athlete.date_of_birth} />
            <Divider style={styles.divider} />
            <InfoRow icon="transgender-outline" label="Gender" value={athlete.athlete.gender} />
          </Card.Content>
        </Card>

        {/* Athletic Information */}
        <Card style={styles.card}>
          <Card.Title title="Athletic Information" titleStyle={styles.cardTitle} />
          <Card.Content>
            <InfoRow icon="trophy-outline" label="Sport" value={sportName} iconColor={COLORS.primary} />
            <Divider style={styles.divider} />
            <InfoRow icon="flag-outline" label="NOC" value={athlete.athlete.noc_id || 'Cayman Islands'} />
            <Divider style={styles.divider} />
            <InfoRow
              icon="home-outline"
              label="Residence Status"
              value={athlete.athlete.residence_status === 'local' ? 'Local' : 'Overseas'}
            />
            <Divider style={styles.divider} />
            <InfoRow
              icon="shield-outline"
              label="Testing Pool"
              value={
                athlete.athlete.testing_pool_status === 'RTP'
                  ? 'Registered Testing Pool (RTP)'
                  : athlete.athlete.testing_pool_status === 'TP'
                  ? 'Testing Pool (TP)'
                  : 'Not in Pool'
              }
              iconColor={COLORS.warning}
            />
          </Card.Content>
        </Card>

        {/* Account Status */}
        <Card style={styles.card}>
          <Card.Title title="Account Status" titleStyle={styles.cardTitle} />
          <Card.Content>
            <InfoRow
              icon="checkmark-circle-outline"
              label="Status"
              value={isActive ? 'Active' : 'Inactive'}
              iconColor={isActive ? COLORS.success : COLORS.error}
            />
            <Divider style={styles.divider} />
            <InfoRow
              icon="shield-checkmark-outline"
              label="Email Verified"
              value={athlete.user.email_verified ? 'Yes' : 'No'}
            />
            <Divider style={styles.divider} />
            <InfoRow
              icon="key-outline"
              label="Password Change Required"
              value={athlete.user.requires_password_change ? 'Yes' : 'No'}
            />
            <Divider style={styles.divider} />
            <InfoRow icon="time-outline" label="Created" value={typeof athlete.user.created_at === 'string' ? new Date(athlete.user.created_at).toLocaleDateString() : 'Unknown'} />
          </Card.Content>
        </Card>

        {/* Whereabouts Compliance */}
        <Card style={styles.card}>
          <Card.Title title="Whereabouts Compliance" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.complianceStatus}>
              <Ionicons name="analytics-outline" size={48} color={COLORS.text.secondary} />
              <Text style={styles.compliancePlaceholder}>
                Compliance tracking coming soon
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Locations Status */}
        <Card style={styles.card}>
          <Card.Title title="Locations Status" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.locationsGrid}>
              <View style={styles.locationItem}>
                <Ionicons name="home" size={24} color={COLORS.primary} />
                <Text style={styles.locationLabel}>Home</Text>
                <Text style={styles.locationStatus}>-</Text>
              </View>
              <View style={styles.locationItem}>
                <Ionicons name="fitness" size={24} color={COLORS.secondary} />
                <Text style={styles.locationLabel}>Training</Text>
                <Text style={styles.locationStatus}>-</Text>
              </View>
              <View style={styles.locationItem}>
                <Ionicons name="barbell" size={24} color={COLORS.warning} />
                <Text style={styles.locationLabel}>Gym</Text>
                <Text style={styles.locationStatus}>-</Text>
              </View>
              <View style={styles.locationItem}>
                <Ionicons name="trophy" size={24} color={COLORS.error} />
                <Text style={styles.locationLabel}>Competitions</Text>
                <Text style={styles.locationStatus}>-</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon="eye"
            onPress={handleViewAthleteDashboard}
            style={styles.actionButton}
            buttonColor={COLORS.primary}
          >
            View Athlete Dashboard
          </Button>
          <Button
            mode="outlined"
            icon="key"
            onPress={() => setResetPasswordDialogVisible(true)}
            style={styles.actionButton}
            loading={actionLoading}
          >
            Reset Password
          </Button>
          {isActive ? (
            <Button
              mode="outlined"
              icon="close-circle"
              onPress={() => setDeactivateDialogVisible(true)}
              style={[styles.actionButton, styles.dangerButton]}
              textColor={COLORS.error}
              loading={actionLoading}
            >
              Deactivate Account
            </Button>
          ) : (
            <Button
              mode="contained"
              icon="checkmark-circle"
              onPress={handleReactivate}
              style={styles.actionButton}
              buttonColor={COLORS.success}
              loading={actionLoading}
            >
              Reactivate Account
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Reset Password Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={resetPasswordDialogVisible}
          onDismiss={() => setResetPasswordDialogVisible(false)}
        >
          <Dialog.Title>Reset Password</Dialog.Title>
          <Dialog.Content>
            <Text>
              This will send a password reset email to the athlete and generate a new temporary password.
            </Text>
            <Text style={styles.dialogNote}>
              The athlete will be required to change their password on next login.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetPasswordDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleResetPassword} loading={actionLoading}>
              Reset Password
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Deactivate Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deactivateDialogVisible}
          onDismiss={() => setDeactivateDialogVisible(false)}
        >
          <Dialog.Title>Deactivate Account</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to deactivate this athlete's account?
            </Text>
            <Text style={styles.dialogWarning}>
              The athlete will no longer be able to log in or submit whereabouts information.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeactivateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeactivate} textColor={COLORS.error} loading={actionLoading}>
              Deactivate
            </Button>
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  athleteName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    fontSize: 12,
  },
  athleteSport: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  athleteEmail: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  alertCard: {
    backgroundColor: COLORS.warning + '15',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning,
    marginLeft: SPACING.sm,
  },
  alertMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  passwordContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: COLORS.text.primary,
    letterSpacing: 2,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  divider: {
    marginVertical: SPACING.xs,
  },
  complianceStatus: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  compliancePlaceholder: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  locationItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  locationStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionsContainer: {
    gap: SPACING.sm,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
  dangerButton: {
    borderColor: COLORS.error,
  },
  dialogNote: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  dialogWarning: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text.secondary,
    marginVertical: SPACING.md,
  },
});
