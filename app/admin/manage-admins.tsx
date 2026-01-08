/**
 * Manage Admins Screen (Super Admin Only)
 * Allows super admins to manage other admin accounts
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Button as PaperButton,
  Chip,
  Dialog,
  Portal,
  TextInput,
  RadioButton,
  Menu,
  IconButton,
  Divider as PaperDivider,
} from 'react-native-paper';

import {
  Text,
  Card as CommonCard,
  Button,
  LoadingState,
  Spacer,
  Divider,
} from '@/src/components/common';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
  COLORS,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector } from '@/src/store/hooks';
import {
  listAdminUsers,
  createAdminAccount,
  updateAdminRole,
  deactivateAdminAccount,
  reactivateAdminAccount,
  removeAdminAccount,
  AdminUser,
} from '@/src/api/admin';

export default function ManageAdminsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();

  // Get current user to check if super_admin (role is in userProfile)
  const currentUser = useAppSelector((state) => state.auth.user);
  const userProfile = useAppSelector((state) => state.auth.userProfile);
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Create admin dialog
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Role change dialog
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');

  // Menu state
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      const adminList = await listAdminUsers();
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      Alert.alert('Error', 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAdmins();
    setRefreshing(false);
  }, [fetchAdmins]);

  // Create admin handler
  const handleCreateAdmin = async () => {
    if (!newAdminEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setActionLoading(true);
    try {
      const result = await createAdminAccount(newAdminEmail.trim(), newAdminRole);
      setTempPassword(result.tempPassword);
      await fetchAdmins();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create admin account');
      setCreateDialogVisible(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Close create dialog
  const handleCloseCreateDialog = () => {
    setCreateDialogVisible(false);
    setNewAdminEmail('');
    setNewAdminRole('admin');
    setTempPassword(null);
  };

  // Role change handler
  const handleChangeRole = async () => {
    if (!selectedAdmin) return;

    setActionLoading(true);
    try {
      await updateAdminRole(selectedAdmin.id, newRole);
      await fetchAdmins();
      setRoleDialogVisible(false);
      setSelectedAdmin(null);
      Alert.alert('Success', 'Admin role updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update admin role');
    } finally {
      setActionLoading(false);
    }
  };

  // Deactivate handler
  const handleDeactivate = async (admin: AdminUser) => {
    Alert.alert(
      'Deactivate Admin',
      `Are you sure you want to deactivate ${admin.email}? They will no longer be able to access the admin panel.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deactivateAdminAccount(admin.id);
              await fetchAdmins();
              Alert.alert('Success', 'Admin account deactivated');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to deactivate admin');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Reactivate handler
  const handleReactivate = async (admin: AdminUser) => {
    setActionLoading(true);
    try {
      await reactivateAdminAccount(admin.id);
      await fetchAdmins();
      Alert.alert('Success', 'Admin account reactivated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reactivate admin');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove admin handler
  const handleRemoveAdmin = async (admin: AdminUser) => {
    Alert.alert(
      'Remove Admin',
      `Are you sure you want to remove ${admin.email} from the admin team? This will revoke all their admin privileges.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await removeAdminAccount(admin.id);
              await fetchAdmins();
              Alert.alert('Success', 'Admin removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove admin');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open role change dialog
  const openRoleDialog = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setNewRole(admin.role);
    setRoleDialogVisible(true);
    setMenuVisible(null);
  };

  // Check if user can manage this admin
  const canManageAdmin = (admin: AdminUser) => {
    // Super admins can manage other admins but not themselves
    return isSuperAdmin && admin.id !== currentUser?.uid;
  };

  if (!isSuperAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={COLORS.error} />
          <Text variant="h5" style={styles.accessDeniedText}>Access Denied</Text>
          <Text variant="body" color="secondary" center>
            Only super admins can manage admin accounts.
          </Text>
          <Spacer size="large" />
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (loading) {
    return <LoadingState message="Loading admin users..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h4">Manage Admins</Text>
          <Text variant="body" color="secondary">
            Add, edit, or remove admin access
          </Text>
        </View>

        {/* Add Admin Button */}
        <Button
          title="Add New Admin"
          onPress={() => setCreateDialogVisible(true)}
          leftIcon={<Ionicons name="person-add" size={20} color="#FFFFFF" />}
          fullWidth
          style={styles.addButton}
        />

        <Spacer size="medium" />

        {/* Admin List */}
        <Text variant="h6" style={styles.sectionTitle}>
          Current Admins ({admins.length})
        </Text>

        {admins.length === 0 ? (
          <CommonCard padding="large">
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text variant="body" color="secondary" center style={styles.emptyText}>
                No admin users found
              </Text>
            </View>
          </CommonCard>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id} style={styles.adminCard}>
              <Card.Content>
                <View style={styles.adminHeader}>
                  <View style={styles.adminInfo}>
                    <View style={[styles.adminAvatar, { backgroundColor: admin.is_active ? BrandColors.primary : '#9CA3AF' }]}>
                      <Ionicons name="person" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.adminDetails}>
                      <Text variant="body" bold style={{ color: '#000000' }}>{admin.email}</Text>
                      <View style={styles.adminChips}>
                        <Chip
                          mode="flat"
                          compact
                          style={[
                            styles.roleChip,
                            { backgroundColor: admin.role === 'super_admin' ? SemanticColors.warningBackground : 'rgba(0, 102, 204, 0.1)' }
                          ]}
                          textStyle={{
                            fontSize: 12,
                            color: admin.role === 'super_admin' ? SemanticColors.warning : BrandColors.primary
                          }}
                        >
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </Chip>
                        {!admin.is_active && (
                          <Chip
                            mode="flat"
                            compact
                            style={[styles.statusChip, { backgroundColor: SemanticColors.errorBackground }]}
                            textStyle={{ fontSize: 12, color: SemanticColors.error }}
                          >
                            Inactive
                          </Chip>
                        )}
                      </View>
                    </View>
                  </View>

                  {canManageAdmin(admin) && (
                    <Menu
                      visible={menuVisible === admin.id}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={24}
                          onPress={() => setMenuVisible(admin.id)}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => openRoleDialog(admin)}
                        title="Change Role"
                        leadingIcon="account-cog"
                      />
                      <PaperDivider />
                      {admin.is_active ? (
                        <Menu.Item
                          onPress={() => {
                            setMenuVisible(null);
                            handleDeactivate(admin);
                          }}
                          title="Deactivate"
                          leadingIcon="account-off"
                        />
                      ) : (
                        <Menu.Item
                          onPress={() => {
                            setMenuVisible(null);
                            handleReactivate(admin);
                          }}
                          title="Reactivate"
                          leadingIcon="account-check"
                        />
                      )}
                      <PaperDivider />
                      <Menu.Item
                        onPress={() => {
                          setMenuVisible(null);
                          handleRemoveAdmin(admin);
                        }}
                        title="Remove Admin"
                        leadingIcon="account-remove"
                        titleStyle={{ color: SemanticColors.error }}
                      />
                    </Menu>
                  )}

                  {admin.id === currentUser?.uid && (
                    <Chip mode="outlined" compact style={styles.youChip}>
                      You
                    </Chip>
                  )}
                </View>

                <Text variant="caption" color="tertiary" style={styles.adminDate}>
                  Added: {new Date(admin.created_at).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Admin Dialog */}
      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={handleCloseCreateDialog}>
          <Dialog.Title style={{ color: '#000000' }}>
            {tempPassword ? 'Admin Created' : 'Add New Admin'}
          </Dialog.Title>
          <Dialog.Content>
            {tempPassword ? (
              <View>
                <Text variant="body" style={{ color: '#000000' }}>
                  Admin account created successfully!
                </Text>
                <Spacer size="medium" />
                <Text variant="bodySmall" color="secondary">
                  Temporary Password:
                </Text>
                <View style={styles.passwordBox}>
                  <Text variant="body" bold style={{ color: '#000000', fontFamily: 'monospace' }}>
                    {tempPassword}
                  </Text>
                </View>
                <Spacer size="small" />
                <Text variant="caption" color="secondary">
                  Please share this password securely with the new admin. They will be required to change it on first login.
                </Text>
              </View>
            ) : (
              <View>
                <TextInput
                  label="Email Address"
                  value={newAdminEmail}
                  onChangeText={setNewAdminEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
                <Spacer size="medium" />
                <Text variant="body" style={{ color: '#000000', marginBottom: 8 }}>Role</Text>
                <RadioButton.Group onValueChange={(value) => setNewAdminRole(value as 'admin' | 'super_admin')} value={newAdminRole}>
                  <View style={styles.radioRow}>
                    <RadioButton.Android value="admin" color={BrandColors.primary} />
                    <Text variant="body" style={{ color: '#000000' }}>Admin</Text>
                  </View>
                  <View style={styles.radioRow}>
                    <RadioButton.Android value="super_admin" color={BrandColors.primary} />
                    <Text variant="body" style={{ color: '#000000' }}>Super Admin</Text>
                  </View>
                </RadioButton.Group>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {tempPassword ? (
              <PaperButton onPress={handleCloseCreateDialog}>Done</PaperButton>
            ) : (
              <>
                <PaperButton onPress={handleCloseCreateDialog}>Cancel</PaperButton>
                <PaperButton
                  onPress={handleCreateAdmin}
                  loading={actionLoading}
                  disabled={actionLoading || !newAdminEmail.trim()}
                >
                  Create
                </PaperButton>
              </>
            )}
          </Dialog.Actions>
        </Dialog>

        {/* Role Change Dialog */}
        <Dialog visible={roleDialogVisible} onDismiss={() => setRoleDialogVisible(false)}>
          <Dialog.Title style={{ color: '#000000' }}>Change Role</Dialog.Title>
          <Dialog.Content>
            <Text variant="body" color="secondary" style={{ marginBottom: 16 }}>
              Change role for: {selectedAdmin?.email}
            </Text>
            <RadioButton.Group onValueChange={(value) => setNewRole(value as 'admin' | 'super_admin')} value={newRole}>
              <View style={styles.radioRow}>
                <RadioButton.Android value="admin" color={BrandColors.primary} />
                <View>
                  <Text variant="body" style={{ color: '#000000' }}>Admin</Text>
                  <Text variant="caption" color="secondary">Can manage athletes and view reports</Text>
                </View>
              </View>
              <Spacer size="small" />
              <View style={styles.radioRow}>
                <RadioButton.Android value="super_admin" color={BrandColors.primary} />
                <View>
                  <Text variant="body" style={{ color: '#000000' }}>Super Admin</Text>
                  <Text variant="caption" color="secondary">Full access including admin management</Text>
                </View>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setRoleDialogVisible(false)}>Cancel</PaperButton>
            <PaperButton
              onPress={handleChangeRole}
              loading={actionLoading}
              disabled={actionLoading || newRole === selectedAdmin?.role}
            >
              Update
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  addButton: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  adminCard: {
    marginBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  adminDetails: {
    flex: 1,
  },
  adminChips: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  roleChip: {
    height: 24,
  },
  statusChip: {
    height: 24,
  },
  youChip: {
    marginLeft: Spacing.sm,
  },
  adminDate: {
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  accessDeniedText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordBox: {
    backgroundColor: '#F3F4F6',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
});
