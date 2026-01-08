/**
 * Common Components Index
 * Export all reusable UI components
 */

// Text
export {
  Text,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  BodyText,
  Caption,
  Label,
} from './Text';
export type { TextProps } from './Text';

// Buttons
export { Button, IconButton } from './Button';
export type { ButtonProps } from './Button';

// Inputs
export { Input, SearchInput } from './Input';

// Cards
export { Card, PressableCard, SectionCard } from './Card';
export type { CardProps } from './Card';

// Badges
export {
  Badge,
  LocationBadge,
  StatusBadge,
  CompletionBadge,
  NotificationBadge,
} from './Badge';

// Loading States
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  SkeletonQuarterCard,
  LoadingIndicator,
  LoadingOverlay,
  LoadingState,
} from './LoadingState';

// Empty States
export {
  EmptyState,
  NoLocationsEmpty,
  NoQuartersEmpty,
  NoCompetitionsEmpty,
  NoNotificationsEmpty,
  SearchNoResultsEmpty,
  ErrorState,
  OfflineState,
} from './EmptyState';

// Screen Layout
export {
  ScreenContainer,
  ScreenHeader,
  Divider,
  Spacer,
} from './ScreenContainer';
