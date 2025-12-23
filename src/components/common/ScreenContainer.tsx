/**
 * Screen Container Component
 * Provides consistent screen layout with safe area handling
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LightColors,
  DarkColors,
  Spacing,
  BrandColors,
} from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoadingOverlay } from './LoadingState';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Scrollable content */
  scroll?: boolean;
  /** Show loading overlay */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Enable pull to refresh */
  refreshing?: boolean;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Avoid keyboard */
  keyboardAware?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Content style */
  contentStyle?: ViewStyle;
  /** Apply horizontal padding */
  padded?: boolean;
  /** Apply safe area insets */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Background color override */
  backgroundColor?: string;
  /** Status bar style */
  statusBarStyle?: 'light-content' | 'dark-content';
}

export function ScreenContainer({
  children,
  scroll = false,
  loading = false,
  loadingMessage,
  refreshing = false,
  onRefresh,
  keyboardAware = false,
  style,
  contentStyle,
  padded = true,
  edges = ['top', 'bottom'],
  backgroundColor,
  statusBarStyle,
}: ScreenContainerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;
  const insets = useSafeAreaInsets();

  const bgColor = backgroundColor ?? colors.background;
  const barStyle = statusBarStyle ?? (colorScheme === 'light' ? 'dark-content' : 'light-content');

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: bgColor,
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  const innerContentStyle: ViewStyle = {
    ...(padded && { paddingHorizontal: Spacing.md }),
    ...contentStyle,
  };

  const content = scroll ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, innerContentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, innerContentStyle]}>{children}</View>
  );

  const wrappedContent = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={[containerStyle, style]}>
      <StatusBar barStyle={barStyle} backgroundColor={bgColor} />
      {wrappedContent}
      <LoadingOverlay visible={loading} message={loadingMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});

// Header component for screens
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  large?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  large = false,
}: ScreenHeaderProps) {
  const { Text } = require('./Text');

  return (
    <View style={[headerStyles.container, style]}>
      <View style={headerStyles.row}>
        {leftAction && <View style={headerStyles.leftAction}>{leftAction}</View>}
        <View style={headerStyles.titleContainer}>
          <Text variant={large ? 'h2' : 'h4'}>{title}</Text>
          {subtitle && (
            <Text variant="bodySmall" color="secondary" style={headerStyles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction && <View style={headerStyles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftAction: {
    marginRight: Spacing.md,
  },
  rightAction: {
    marginLeft: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
});

// Divider component
interface DividerProps {
  style?: ViewStyle;
  spacing?: 'small' | 'medium' | 'large';
}

export function Divider({ style, spacing = 'medium' }: DividerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'light' ? LightColors : DarkColors;

  const spacingMap = {
    small: Spacing.sm,
    medium: Spacing.md,
    large: Spacing.lg,
  };

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: spacingMap[spacing],
        },
        style,
      ]}
    />
  );
}

// Spacer component
interface SpacerProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  horizontal?: boolean;
}

export function Spacer({ size = 'medium', horizontal = false }: SpacerProps) {
  const sizeMap = {
    small: Spacing.sm,
    medium: Spacing.md,
    large: Spacing.lg,
    xlarge: Spacing.xl,
  };

  const dimension = sizeMap[size];

  return (
    <View
      style={
        horizontal
          ? { width: dimension }
          : { height: dimension }
      }
    />
  );
}
