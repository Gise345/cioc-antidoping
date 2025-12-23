/**
 * AddressForm Component
 * Reusable address input component with validation
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Card, HelperText } from 'react-native-paper';
import { Text } from '../common';
import { LocationWithSchedule } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface AddressFormProps {
  value: LocationWithSchedule;
  onChange: (value: LocationWithSchedule) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showTitle?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_COUNTRY = 'Cayman Islands';

// TODO: Integrate Google Places API for address autocomplete
// This will require:
// 1. Google Places API key configuration
// 2. react-native-google-places-autocomplete package
// 3. Location permissions handling

// ============================================================================
// COMPONENT
// ============================================================================

export const AddressForm: React.FC<AddressFormProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false,
  showTitle = true,
}) => {
  // Handle field change
  const handleFieldChange = useCallback(
    (field: keyof LocationWithSchedule, fieldValue: string) => {
      onChange({
        ...value,
        [field]: fieldValue,
      });
    },
    [value, onChange]
  );

  // Validate Cayman postal code format
  const validatePostalCode = (postalCode: string): boolean => {
    if (!postalCode) return true; // Optional field
    const caymanPostalRegex = /^KY\d-\d{4}$/;
    return caymanPostalRegex.test(postalCode);
  };

  const postalCodeError =
    errors.postal_code ||
    (value.postal_code && !validatePostalCode(value.postal_code)
      ? 'Format: KY1-XXXX'
      : undefined);

  return (
    <Card style={styles.card}>
      {showTitle && (
        <Card.Title
          title="Address"
          subtitle="Enter the location address"
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
        />
      )}

      <Card.Content>
        {/* Address Line 1 (Required) */}
        <View style={styles.fieldContainer}>
          <TextInput
            mode="outlined"
            label="Address Line 1 *"
            value={value.address_line1 || ''}
            onChangeText={(text) => handleFieldChange('address_line1', text)}
            placeholder="Street address, building name"
            disabled={disabled}
            error={!!errors.address_line1}
            maxLength={200}
            style={styles.input}
          />
          {errors.address_line1 && (
            <HelperText type="error" visible={true}>
              {errors.address_line1}
            </HelperText>
          )}
        </View>

        {/* Address Line 2 (Optional) */}
        <View style={styles.fieldContainer}>
          <TextInput
            mode="outlined"
            label="Address Line 2"
            value={value.address_line2 || ''}
            onChangeText={(text) => handleFieldChange('address_line2', text)}
            placeholder="Apartment, suite, unit, floor (optional)"
            disabled={disabled}
            error={!!errors.address_line2}
            maxLength={200}
            style={styles.input}
          />
          {errors.address_line2 && (
            <HelperText type="error" visible={true}>
              {errors.address_line2}
            </HelperText>
          )}
        </View>

        {/* City and Postal Code Row */}
        <View style={styles.row}>
          {/* City (Required) */}
          <View style={[styles.fieldContainer, styles.cityField]}>
            <TextInput
              mode="outlined"
              label="City *"
              value={value.city || ''}
              onChangeText={(text) => handleFieldChange('city', text)}
              placeholder="George Town"
              disabled={disabled}
              error={!!errors.city}
              maxLength={100}
              style={styles.input}
            />
            {errors.city && (
              <HelperText type="error" visible={true}>
                {errors.city}
              </HelperText>
            )}
          </View>

          {/* Postal Code (Optional) */}
          <View style={[styles.fieldContainer, styles.postalField]}>
            <TextInput
              mode="outlined"
              label="Postal Code"
              value={value.postal_code || ''}
              onChangeText={(text) => handleFieldChange('postal_code', text.toUpperCase())}
              placeholder="KY1-XXXX"
              disabled={disabled}
              error={!!postalCodeError}
              maxLength={8}
              autoCapitalize="characters"
              style={styles.input}
            />
            {postalCodeError && (
              <HelperText type="error" visible={true}>
                {postalCodeError}
              </HelperText>
            )}
          </View>
        </View>

        {/* Country (Required, default: Cayman Islands) */}
        <View style={styles.fieldContainer}>
          <TextInput
            mode="outlined"
            label="Country *"
            value={value.country || DEFAULT_COUNTRY}
            onChangeText={(text) => handleFieldChange('country', text)}
            placeholder="Cayman Islands"
            disabled={disabled}
            error={!!errors.country}
            maxLength={100}
            style={styles.input}
          />
          {errors.country && (
            <HelperText type="error" visible={true}>
              {errors.country}
            </HelperText>
          )}
        </View>

        {/* Additional Info (Optional, multiline) */}
        <View style={styles.fieldContainer}>
          <TextInput
            mode="outlined"
            label="Additional Information"
            value={value.additional_info || ''}
            onChangeText={(text) => handleFieldChange('additional_info', text)}
            placeholder="Gate code, parking instructions, building entrance details..."
            disabled={disabled}
            error={!!errors.additional_info}
            maxLength={500}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.multilineInput]}
          />
          <HelperText type="info" visible={true} style={styles.helperText}>
            {(value.additional_info?.length || 0)}/500 characters
          </HelperText>
          {errors.additional_info && (
            <HelperText type="error" visible={true}>
              {errors.additional_info}
            </HelperText>
          )}
        </View>

        {/* TODO: Google Places Autocomplete placeholder */}
        {/*
        <View style={styles.fieldContainer}>
          <Text style={styles.placeholderText}>
            Google Places integration coming soon for address autocomplete
          </Text>
        </View>
        */}

        {/* Coordinates (Hidden, will be set by Google Places) */}
        {value.latitude && value.longitude && (
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesText}>
              Coordinates: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* General form error */}
        {errors.address && (
          <Text style={styles.generalError}>{errors.address}</Text>
        )}
      </Card.Content>
    </Card>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    marginVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  fieldContainer: {
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
  },
  multilineInput: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityField: {
    flex: 2,
    marginRight: SPACING.sm,
  },
  postalField: {
    flex: 1,
  },
  helperText: {
    color: COLORS.text.secondary,
  },
  coordinatesContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
  },
  generalError: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 4,
  },
});

export default AddressForm;
