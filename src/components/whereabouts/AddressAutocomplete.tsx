/**
 * Address Autocomplete Component
 * Placeholder for Google Places autocomplete integration
 * TODO: Implement Google Places API integration
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common';
import { AddressDocument } from '@/src/types/firestore';
import {
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelect?: (address: AddressDocument) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * Address Autocomplete - Placeholder Implementation
 *
 * This is a placeholder component. Full Google Places integration will be added later.
 * For now, it functions as a simple text input with a location icon.
 *
 * Future implementation will include:
 * - Google Places API integration
 * - Address suggestions dropdown
 * - Geocoding for lat/lng
 * - Place ID storage
 */
export function AddressAutocomplete({
  value,
  onChangeText,
  onAddressSelect,
  placeholder = 'Enter address',
  label,
  error,
  disabled = false,
}: AddressAutocompleteProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? '#F44336'
              : isFocused
              ? '#0066CC'
              : colors.border,
          },
          disabled && styles.disabled,
        ]}
      >
        <Ionicons
          name="location-outline"
          size={20}
          color={colors.textTertiary}
          style={styles.icon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.textPrimary }]}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {value && !disabled && (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {error && (
        <Text variant="caption" customColor="#F44336" style={styles.error}>
          {error}
        </Text>
      )}

      {/* Placeholder hint for future implementation */}
      <View style={styles.hint}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
        <Text variant="caption" color="tertiary" style={styles.hintText}>
          Enter the full address including street, city, and country
        </Text>
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    marginTop: Spacing.xs,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  hintText: {
    flex: 1,
  },
});

export default AddressAutocomplete;
