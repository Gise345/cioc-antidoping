/**
 * TemplateSelector Component
 * Modal for selecting a saved weekly template
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Card, Badge, Spacer } from '@/src/components/common';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { WeeklyPattern, DayOfWeek } from '@/src/types';

/**
 * Saved template structure
 */
export interface SavedTemplate {
  id: string;
  name: string;
  description?: string;
  pattern: WeeklyPattern;
  usage_count: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

interface TemplateSelectorProps {
  visible: boolean;
  templates: SavedTemplate[];
  onSelect: (template: SavedTemplate) => void;
  onCancel: () => void;
  onCreateNew?: () => void;
}

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
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const LOCATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  training: 'fitness-outline',
  gym: 'barbell-outline',
};

const LOCATION_COLORS: Record<string, string> = {
  home: '#4CAF50',
  training: '#2196F3',
  gym: '#9C27B0',
};

/**
 * Format time for display (07:00 -> 7AM)
 */
const formatTime = (time: string): string => {
  const hour = parseInt(time.split(':')[0], 10);
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour <= 12 ? hour : hour - 12;
  return `${displayHour}${suffix}`;
};

/**
 * Pattern preview row
 */
function PatternPreview({ pattern }: { pattern: WeeklyPattern }) {
  return (
    <View style={styles.patternPreview}>
      {DAYS_ORDER.map((day) => {
        const dayPattern = pattern[day];
        const color = LOCATION_COLORS[dayPattern.location_type] || '#9E9E9E';

        return (
          <View key={day} style={styles.patternDay}>
            <Text variant="caption" color="tertiary">
              {DAY_LABELS[day]}
            </Text>
            <View style={[styles.patternDot, { backgroundColor: color }]}>
              <Ionicons
                name={LOCATION_ICONS[dayPattern.location_type] || 'location-outline'}
                size={10}
                color="#FFFFFF"
              />
            </View>
            <Text variant="caption" color="secondary" style={styles.patternTime}>
              {formatTime(dayPattern.time_start)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Template card component
 */
function TemplateCard({
  template,
  isMostUsed,
  onPress,
}: {
  template: SavedTemplate;
  isMostUsed: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.templateCard,
        pressed && styles.templateCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleRow}>
          <Text variant="h6" numberOfLines={1} style={styles.templateName}>
            {template.name}
          </Text>
          {isMostUsed && (
            <Badge label="Most Used" variant="success" size="small" />
          )}
          {template.is_default && !isMostUsed && (
            <Badge label="Default" variant="primary" size="small" />
          )}
        </View>
        {template.description && (
          <Text variant="caption" color="secondary" numberOfLines={2}>
            {template.description}
          </Text>
        )}
      </View>

      <PatternPreview pattern={template.pattern} />

      <View style={styles.templateFooter}>
        <View style={styles.usageInfo}>
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text variant="caption" color="tertiary">
            Used {template.usage_count} {template.usage_count === 1 ? 'time' : 'times'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </Pressable>
  );
}

export function TemplateSelector({
  visible,
  templates,
  onSelect,
  onCancel,
  onCreateNew,
}: TemplateSelectorProps) {
  const insets = useSafeAreaInsets();

  // Sort templates by usage count to find most used
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => b.usage_count - a.usage_count);
  }, [templates]);

  const mostUsedId = sortedTemplates.length > 0 ? sortedTemplates[0].id : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h4">Select Template</Text>
          <Pressable onPress={onCancel} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={24} color={LightColors.textPrimary} />
          </Pressable>
        </View>

        {/* Templates List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {templates.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="bookmark-outline"
                  size={48}
                  color={LightColors.textTertiary}
                />
              </View>
              <Text variant="h5" center>
                No Templates Yet
              </Text>
              <Spacer size="small" />
              <Text variant="body" color="secondary" center>
                Create your first weekly template to quickly apply it to future quarters.
              </Text>
            </View>
          ) : (
            <>
              {/* Info banner */}
              <View style={styles.infoBanner}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={SemanticColors.info}
                />
                <Text variant="caption" color="secondary" style={styles.infoText}>
                  Templates save your weekly schedule pattern. Select one to auto-fill your quarter.
                </Text>
              </View>

              <Spacer size="medium" />

              {/* Template cards */}
              {sortedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isMostUsed={template.id === mostUsedId && template.usage_count > 0}
                  onPress={() => onSelect(template)}
                />
              ))}
            </>
          )}

          <Spacer size="large" />

          {/* Create New Template */}
          {onCreateNew && (
            <Pressable style={styles.createNewCard} onPress={onCreateNew}>
              <View style={styles.createNewIcon}>
                <Ionicons name="add" size={24} color={BrandColors.primary} />
              </View>
              <View style={styles.createNewText}>
                <Text variant="h6" customColor={BrandColors.primary}>
                  Create New Template
                </Text>
                <Text variant="caption" color="secondary">
                  Build a custom weekly pattern
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BrandColors.primary} />
            </Pressable>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button
            title="Cancel"
            variant="tertiary"
            onPress={onCancel}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
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
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateCardPressed: {
    backgroundColor: '#F9FAFB',
    borderColor: BrandColors.primary,
  },
  templateHeader: {
    marginBottom: Spacing.sm,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  templateName: {
    flex: 1,
  },
  patternPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  patternDay: {
    alignItems: 'center',
    gap: 2,
  },
  patternDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternTime: {
    fontSize: 9,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  createNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    borderStyle: 'dashed',
  },
  createNewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  createNewText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
});

export default TemplateSelector;
