/**
 * Admin Tab Screen
 * Redirects to the admin dashboard
 */

import { useEffect } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useAdmin } from '@/src/hooks/useAdmin';
import { LoadingState } from '@/src/components/common';

export default function AdminTabScreen() {
  const { isAdmin } = useAdmin();

  // If not admin, redirect to home
  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Redirect to admin dashboard
  return <Redirect href="/admin/dashboard" />;
}
