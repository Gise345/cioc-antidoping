/**
 * Modal Screen
 * Generic modal placeholder
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, ScreenContainer, Button, Spacer } from '@/src/components/common';
import { BrandColors, Spacing, BorderRadius } from '@/src/constants/theme';

export default function ModalScreen() {
  const handleClose = () => {
    router.back();
  };

  return (
    <ScreenContainer contentStyle={styles.container} padded>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={BrandColors.primary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle-outline" size={64} color={BrandColors.primary} />
        </View>

        <Text variant="h3" center>
          Modal Screen
        </Text>

        <Spacer size="medium" />

        <Text variant="body" color="secondary" center>
          This is a modal placeholder. It can be customized for various purposes like confirmations, alerts, or additional information.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Close"
          onPress={handleClose}
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
});
