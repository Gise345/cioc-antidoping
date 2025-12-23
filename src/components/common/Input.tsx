/**
 * Input Component
 * Themed text input with validation support
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  BorderRadius,
  BrandColors,
  DarkColors,
  FontSize,
  LightColors,
  SemanticColors,
  Spacing
} from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon name (Ionicons) */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon name (Ionicons) */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Callback for right icon press */
  onRightIconPress?: () => void;
  /** Show password toggle (for secureTextEntry) */
  showPasswordToggle?: boolean;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Input style */
  inputStyle?: TextStyle;
  /** Required field indicator */
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      showPasswordToggle,
      containerStyle,
      inputStyle,
      required,
      disabled,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = colorScheme === 'light' ? LightColors : DarkColors;
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const hasError = !!error;
    const borderColor = hasError
      ? SemanticColors.error
      : isFocused
      ? BrandColors.primary
      : colors.border;

    const handlePasswordToggle = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const shouldSecure = secureTextEntry && !isPasswordVisible;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <View style={styles.labelContainer}>
            <Text variant="label" color="secondary">
              {label}
            </Text>
            {required && (
              <Text variant="label" color="error">
                {' *'}
              </Text>
            )}
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              borderColor,
              backgroundColor: disabled
                ? colors.backgroundSecondary
                : colors.background,
            },
          ]}
        >
          {leftIcon && (
            <View style={styles.leftIconContainer}>
              <Ionicons
                name={leftIcon}
                size={20}
                color={isFocused ? BrandColors.primary : colors.textTertiary}
              />
            </View>
          )}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                paddingLeft: leftIcon ? 0 : Spacing.md,
                paddingRight: rightIcon || showPasswordToggle ? 0 : Spacing.md,
              },
              inputStyle,
            ]}
            placeholderTextColor={colors.textTertiary}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            secureTextEntry={shouldSecure}
            {...props}
          />

          {showPasswordToggle && secureTextEntry && (
            <Pressable
              onPress={handlePasswordToggle}
              style={styles.rightIconContainer}
              hitSlop={8}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          )}

          {rightIcon && !showPasswordToggle && (
            <Pressable
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              style={styles.rightIconContainer}
              hitSlop={8}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          )}
        </View>

        {(error || helperText) && (
          <Text
            variant="caption"
            color={hasError ? 'error' : 'tertiary'}
            style={styles.helperText}
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    height: '100%',
    paddingVertical: 0,
  },
  leftIconContainer: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  rightIconContainer: {
    paddingRight: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  helperText: {
    marginTop: Spacing.xs,
  },
});

// Search Input variant
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export function SearchInput({ value, onClear, ...props }: SearchInputProps) {
  const hasValue = value && value.length > 0;

  return (
    <Input
      leftIcon="search-outline"
      rightIcon={hasValue ? 'close-circle' : undefined}
      onRightIconPress={onClear}
      placeholder="Search..."
      {...props}
      value={value}
    />
  );
}
