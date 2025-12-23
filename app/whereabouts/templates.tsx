/**
 * Templates Screen
 * Manage weekly schedule templates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
  Text,
  Card,
  Button,
  Badge,
  EmptyState,
  Spacer,
  Input,
} from '@/src/components/common';
import { PatternBuilder, createDefaultPattern } from '@/src/components/whereabouts';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WeeklyPattern, DayOfWeek } from '@/src/types';
import { AppDispatch, RootState } from '@/src/store/store';
import { selectUser } from '@/src/store/slices/authSlice';
import {
  selectHomeLocation,
  selectTrainingLocation,
  selectGymLocation,
} from '@/src/store/slices/locationsSlice';
import {
  fetchTemplatesAsync,
  saveTemplateAsync,
  deleteTemplateAsync,
  selectSavedTemplates,
  selectWhereaboutsLoading,
} from '@/src/store/slices/whereaboutsSlice';
import type { SavedTemplate } from '@/src/components/whereabouts/TemplateSelector';

// Location colors
const LOCATION_COLORS = {
  home: '#2196F3',
  training: '#4CAF50',
  gym: '#FF9800',
};

const LOCATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  training: 'fitness-outline',
  gym: 'barbell-outline',
};

const DAYS_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'M',
  tuesday: 'T',
  wednesday: 'W',
  thursday: 'T',
  friday: 'F',
  saturday: 'S',
  sunday: 'S',
};

/**
 * Pattern Preview Component
 */
function PatternPreview({ pattern }: { pattern: WeeklyPattern }) {
  return (
    <View style={previewStyles.container}>
      {DAYS_ORDER.map((day) => {
        const dayPattern = pattern[day];
        const color = LOCATION_COLORS[dayPattern.location_type] || '#9E9E9E';

        return (
          <View key={day} style={previewStyles.day}>
            <Text variant="caption" color="tertiary">
              {DAY_LABELS[day]}
            </Text>
            <View style={[previewStyles.dot, { backgroundColor: color }]}>
              <Ionicons
                name={LOCATION_ICONS[dayPattern.location_type] || 'location-outline'}
                size={10}
                color="#FFFFFF"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.sm,
  },
  day: {
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Template Card Component
 */
function TemplateCard({
  template,
  isMostUsed,
  onEdit,
  onDelete,
  onSetDefault,
  onUse,
}: {
  template: SavedTemplate;
  isMostUsed: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onUse: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.container,
        template.is_default && cardStyles.containerDefault,
        pressed && cardStyles.containerPressed,
      ]}
      onPress={onEdit}
    >
      {/* Header */}
      <View style={cardStyles.header}>
        <View style={cardStyles.titleRow}>
          <Text variant="h6" numberOfLines={1} style={cardStyles.title}>
            {template.name}
          </Text>
          {template.is_default && (
            <Badge label="Default" variant="primary" size="small" />
          )}
          {isMostUsed && !template.is_default && (
            <Badge label="Most Used" variant="success" size="small" />
          )}
        </View>
        {template.description && (
          <Text variant="caption" color="secondary" numberOfLines={2}>
            {template.description}
          </Text>
        )}
      </View>

      {/* Pattern Preview */}
      <PatternPreview pattern={template.pattern} />

      {/* Footer */}
      <View style={cardStyles.footer}>
        <View style={cardStyles.usageInfo}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text variant="caption" color="tertiary">
            Used {template.usage_count} {template.usage_count === 1 ? 'time' : 'times'}
          </Text>
        </View>

        <View style={cardStyles.actions}>
          {!template.is_default && (
            <Pressable onPress={onSetDefault} hitSlop={8} style={cardStyles.actionButton}>
              <Text variant="caption" customColor={BrandColors.primary}>
                Set Default
              </Text>
            </Pressable>
          )}
          <Pressable onPress={onUse} hitSlop={8} style={cardStyles.actionButton}>
            <Ionicons name="play-outline" size={16} color={BrandColors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={cardStyles.actionButton}>
            <Ionicons name="trash-outline" size={16} color={SemanticColors.error} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerDefault: {
    borderColor: BrandColors.primary,
    borderWidth: 1.5,
  },
  containerPressed: {
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.xs,
  },
});

/**
 * Create/Edit Template Modal
 */
function TemplateFormModal({
  visible,
  template,
  onSave,
  onClose,
  homeLocation,
  trainingLocation,
  gymLocation,
}: {
  visible: boolean;
  template: SavedTemplate | null;
  onSave: (name: string, description: string, pattern: WeeklyPattern) => void;
  onClose: () => void;
  homeLocation: unknown;
  trainingLocation: unknown;
  gymLocation: unknown;
}) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [pattern, setPattern] = useState<WeeklyPattern>(
    template?.pattern || createDefaultPattern()
  );

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setPattern(template.pattern);
    } else {
      setName('');
      setDescription('');
      setPattern(createDefaultPattern());
    }
  }, [template, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name.');
      return;
    }
    onSave(name.trim(), description.trim(), pattern);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[modalStyles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text variant="h4">{template ? 'Edit Template' : 'Create Template'}</Text>
          <Pressable onPress={onClose} style={modalStyles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={modalStyles.scrollView}
          contentContainerStyle={modalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name Input */}
          <View style={modalStyles.field}>
            <Text variant="label" color="secondary">
              Template Name *
            </Text>
            <Spacer size="small" />
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g., Morning Training Routine"
              maxLength={50}
            />
          </View>

          {/* Description Input */}
          <View style={modalStyles.field}>
            <Text variant="label" color="secondary">
              Description (Optional)
            </Text>
            <Spacer size="small" />
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Describe when to use this template..."
              multiline
              numberOfLines={2}
              maxLength={200}
            />
          </View>

          <Spacer size="large" />

          {/* Pattern Builder */}
          <PatternBuilder
            value={pattern}
            onChange={setPattern}
            homeLocation={homeLocation as any}
            trainingLocation={trainingLocation as any}
            gymLocation={gymLocation as any}
            showSaveTemplate={false}
          />
        </ScrollView>

        {/* Footer */}
        <View style={[modalStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button title="Cancel" variant="tertiary" onPress={onClose} style={modalStyles.cancelButton} />
          <Button
            title={template ? 'Save Changes' : 'Create Template'}
            onPress={handleSave}
            style={modalStyles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});

/**
 * Main Templates Screen
 */
export default function TemplatesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const user = useSelector(selectUser);
  const templates = useSelector(selectSavedTemplates);
  const isLoading = useSelector(selectWhereaboutsLoading);
  const homeLocation = useSelector(selectHomeLocation);
  const trainingLocation = useSelector(selectTrainingLocation);
  const gymLocation = useSelector(selectGymLocation);

  // Local state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SavedTemplate | null>(null);

  // Get most used template ID
  const mostUsedId =
    templates.length > 0 && templates[0].usage_count > 0 ? templates[0].id : null;

  // Fetch templates on mount
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchTemplatesAsync(user.uid));
    }
  }, [user?.uid, dispatch]);

  // Handle create template
  const handleCreate = () => {
    setEditingTemplate(null);
    setShowFormModal(true);
  };

  // Handle edit template
  const handleEdit = (template: SavedTemplate) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  };

  // Handle save template
  const handleSave = async (name: string, description: string, pattern: WeeklyPattern) => {
    if (!user?.uid) return;

    try {
      await dispatch(
        saveTemplateAsync({
          athleteId: user.uid,
          templateName: name,
          description,
          pattern,
        })
      );
      setShowFormModal(false);
      Alert.alert('Success', editingTemplate ? 'Template updated!' : 'Template created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save template. Please try again.');
    }
  };

  // Handle delete template
  const handleDelete = (template: SavedTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTemplateAsync(template.id));
              Alert.alert('Deleted', 'Template has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template.');
            }
          },
        },
      ]
    );
  };

  // Handle set default
  const handleSetDefault = (template: SavedTemplate) => {
    // TODO: Implement set default in API
    Alert.alert('Coming Soon', 'Set default functionality is coming soon.');
  };

  // Handle use template (navigate to create quarter with template)
  const handleUse = (template: SavedTemplate) => {
    router.push({
      pathname: '/whereabouts/create-quarter',
      params: { templateId: template.id },
    });
  };

  const renderTemplate = useCallback(
    ({ item }: { item: SavedTemplate }) => (
      <TemplateCard
        template={item}
        isMostUsed={item.id === mostUsedId}
        onEdit={() => handleEdit(item)}
        onDelete={() => handleDelete(item)}
        onSetDefault={() => handleSetDefault(item)}
        onUse={() => handleUse(item)}
      />
    ),
    [mostUsedId]
  );

  const renderEmpty = () => (
    <EmptyState
      icon="bookmark-outline"
      title="No Templates Yet"
      description="Create a weekly schedule template to quickly file your whereabouts for future quarters."
      actionText="Create Your First Template"
      onAction={handleCreate}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color={SemanticColors.info} />
        <Text variant="bodySmall" color="secondary" style={styles.infoText}>
          Templates save your weekly routine. Create once, reuse for any quarter.
        </Text>
      </View>

      <Spacer size="medium" />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: LOCATION_COLORS.home }]} />
          <Text variant="caption" color="secondary">
            Home
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: LOCATION_COLORS.training }]} />
          <Text variant="caption" color="secondary">
            Training
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: LOCATION_COLORS.gym }]} />
          <Text variant="caption" color="secondary">
            Gym
          </Text>
        </View>
      </View>

      <Spacer size="large" />

      <Text variant="label" color="secondary">
        Your Templates ({templates.length})
      </Text>
      <Spacer size="small" />
    </View>
  );

  if (isLoading && templates.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Spacer size="medium" />
        <Text variant="body" color="secondary">
          Loading templates...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
      />

      {/* FAB Button */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + Spacing.md }]}
        onPress={handleCreate}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Form Modal */}
      <TemplateFormModal
        visible={showFormModal}
        template={editingTemplate}
        onSave={handleSave}
        onClose={() => setShowFormModal(false)}
        homeLocation={homeLocation}
        trainingLocation={trainingLocation}
        gymLocation={gymLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    backgroundColor: SemanticColors.infoBackground,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
