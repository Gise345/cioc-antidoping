/**
 * Button Component
 * Themed button with multiple variants and loading states
 */

import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  BrandColors,
  SemanticColors,
  LightColors,
  DarkColors,
  BorderRadius,
  Spacing,
  Typography,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  /** Button text */
  title: string;
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Enable haptic feedback */
  haptic?: boolean;
}

const variantStyles: Record<
  ButtonVariant,
  {
    background: string;
    pressedBackground: string;
    text: string;
    border?: string;
  }
> = {
  primary: {
    background: BrandColors.primary,
    pressedBackground: BrandColors.primaryDark,
    text: '#FFFFFF',
  },
  secondary: {
    background: 'transparent',
    pressedBackground: 'rgba(0, 102, 204, 0.1)',
    text: BrandColors.primary,
    border: BrandColors.primary,
  },
  tertiary: {
    background: 'transparent',
    pressedBackground: 'rgba(0, 102, 204, 0.1)',
    text: BrandColors.primary,
  },
  danger: {
    background: SemanticColors.error,
    pressedBackground: SemanticColors.errorDark,
    text: '#FFFFFF',
  },
  success: {
    background: SemanticColors.success,
    pressedBackground: SemanticColors.successDark,
    text: '#FFFFFF',
  },
};

const sizeStyles: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; fontSize: number }
> = {
  small: {
    height: 36,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  medium: {
    height: 48,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  large: {
    height: 56,
    paddingHorizontal: Spacing.xl,
    fontSize: 18,
  },
};

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  haptic = true,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const isDisabled = disabled || loading;

  const handlePress = async (e: any) => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: pressed
            ? variantStyle.pressedBackground
            : variantStyle.background,
          borderColor: variantStyle.border,
          borderWidth: variantStyle.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.text}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            variant={size === 'small' ? 'buttonSmall' : 'button'}
            customColor={variantStyle.text}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});

// Icon-only button variant
interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  haptic?: boolean;
}

const iconButtonSizes = {
  small: 32,
  medium: 44,
  large: 56,
};

export function IconButton({
  icon,
  size = 'medium',
  variant = 'tertiary',
  disabled = false,
  haptic = true,
  style,
  onPress,
  ...props
}: IconButtonProps) {
  const buttonSize = iconButtonSizes[size];
  const variantStyle = variantStyles[variant];

  const handlePress = async (e: any) => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: pressed
            ? variantStyle.pressedBackground
            : variantStyle.background,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style as ViewStyle,
      ]}
      {...props}
    >
      {icon}
    </Pressable>
  );
}
