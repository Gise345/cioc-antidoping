/**
 * Location Picker Component
 * Searchable dropdown to select saved locations
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button } from '@/src/components/common';
import { LocationCard } from './LocationCard';
import { LocationTypeIcon } from './LocationTypeIcon';
import { LocationWithId } from '@/src/store/slices/locationsSlice';
import { LocationType } from '@/src/types/firestore';
import {
  BrandColors,
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
  LocationColors,
} from '@/src/constants/theme';
import { LOCATION_TYPE_LABELS, getShortAddress } from '@/src/constants/caymanLocations';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LocationPickerProps {
  locations: LocationWithId[];
  selectedLocation?: LocationWithId | null;
  onSelect: (location: LocationWithId) => void;
  onAddNew?: () => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  filterByType?: LocationType;
  showRecent?: boolean;
}

export function LocationPicker({
  locations,
  selectedLocation,
  onSelect,
  onAddNew,
  placeholder = 'Select a location',
  label,
  error,
  disabled = false,
  filterByType,
  showRecent = true,
}: LocationPickerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<LocationType | null>(filterByType || null);

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let result = [...locations];

    // Filter by type
    if (selectedType) {
      result = result.filter((loc) => loc.type === selectedType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (loc) =>
          loc.name.toLowerCase().includes(query) ||
          loc.address.city.toLowerCase().includes(query) ||
          loc.address.street.toLowerCase().includes(query)
      );
    }

    // Sort by usage count (most used first)
    result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));

    return result;
  }, [locations, searchQuery, selectedType]);

  // Recent locations (top 5 most used)
  const recentLocations = useMemo(() => {
    if (!showRecent || searchQuery) return [];
    return [...locations]
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 5);
  }, [locations, showRecent, searchQuery]);

  const handleSelect = useCallback((location: LocationWithId) => {
    onSelect(location);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedType(filterByType || null);
  }, [onSelect, filterByType]);

  const locationTypes: LocationType[] = [
    'home',
    'training',
    'gym',
    'competition',
    'work',
    'school',
    'hotel',
    'other',
  ];

  const renderLocationItem = ({ item }: { item: LocationWithId }) => (
    <LocationCard
      location={item}
      onPress={() => handleSelect(item)}
      showActions={false}
      showUsageCount={false}
      compact
    />
  );

  const renderHeader = () => (
    <View style={styles.filterContainer}>
      {!filterByType && (
        <FlatList
          horizontal
          data={locationTypes}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: type }) => (
            <Pressable
              onPress={() => setSelectedType(selectedType === type ? null : type)}
              style={[
                styles.typeChip,
                {
                  backgroundColor:
                    selectedType === type
                      ? LocationColors[type]
                      : colors.surfaceVariant,
                },
              ]}
            >
              <Ionicons
                name={selectedType === type ? 'checkmark' : undefined}
                size={14}
                color={selectedType === type ? '#FFFFFF' : LocationColors[type]}
              />
              <Text
                variant="caption"
                customColor={selectedType === type ? '#FFFFFF' : colors.textSecondary}
              >
                {LOCATION_TYPE_LABELS[type]}
              </Text>
            </Pressable>
          )}
          style={styles.typeFilter}
          contentContainerStyle={styles.typeFilterContent}
        />
      )}

      {showRecent && !searchQuery && !selectedType && recentLocations.length > 0 && (
        <View style={styles.recentSection}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            Recently Used
          </Text>
          {recentLocations.slice(0, 3).map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onPress={() => handleSelect(location)}
              showActions={false}
              showUsageCount={false}
              compact
            />
          ))}
        </View>
      )}

      <Text variant="label" color="secondary" style={styles.sectionTitle}>
        {searchQuery ? 'Search Results' : 'All Locations'}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={48} color={colors.textTertiary} />
      <Text variant="body" color="secondary" center style={styles.emptyText}>
        {searchQuery
          ? `No locations found for "${searchQuery}"`
          : 'No locations saved yet'}
      </Text>
      {onAddNew && (
        <Button
          title="Add New Location"
          variant="secondary"
          size="small"
          onPress={() => {
            setIsOpen(false);
            onAddNew();
          }}
          leftIcon={<Ionicons name="add" size={18} color={BrandColors.primary} />}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: error ? '#F44336' : colors.border,
          },
          disabled && styles.disabled,
        ]}
      >
        {selectedLocation ? (
          <View style={styles.selectedContent}>
            <LocationTypeIcon type={selectedLocation.type} size="small" />
            <View style={styles.selectedText}>
              <Text variant="body" numberOfLines={1}>
                {selectedLocation.name}
              </Text>
              <Text variant="caption" color="secondary" numberOfLines={1}>
                {getShortAddress(selectedLocation.address)}
              </Text>
            </View>
          </View>
        ) : (
          <Text variant="body" color="tertiary">
            {placeholder}
          </Text>
        )}
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.textTertiary}
        />
      </Pressable>

      {error && (
        <Text variant="caption" customColor="#F44336" style={styles.error}>
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modal, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text variant="h5">Select Location</Text>
            <Pressable onPress={() => setIsOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="search" size={20} color={colors.textTertiary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search locations..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.textPrimary }]}
              />
              {searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Location List */}
          <FlatList
            data={filteredLocations}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          />

          {/* Add New Button */}
          {onAddNew && (
            <View
              style={[
                styles.addNewContainer,
                {
                  backgroundColor: colors.background,
                  borderTopColor: colors.border,
                  paddingBottom: insets.bottom + Spacing.md,
                },
              ]}
            >
              <Button
                title="Add New Location"
                onPress={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                fullWidth
                leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  selectedText: {
    flex: 1,
  },
  error: {
    marginTop: Spacing.xs,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  searchContainer: {
    padding: Spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: Spacing.sm,
  },
  typeFilter: {
    marginBottom: Spacing.md,
  },
  typeFilterContent: {
    gap: Spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  recentSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyText: {
    marginBottom: Spacing.sm,
  },
  addNewContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
});

export default LocationPicker;
