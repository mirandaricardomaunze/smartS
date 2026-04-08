import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useCompanyStore } from '@/store/companyStore';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useAutoAlerts() {
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId);
const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!activeCompanyId || !user) return;

    const checkAlerts = async () => {
      try {
        // Run checks
        await notificationService.checkLowStockAlerts(activeCompanyId);
        await notificationService.checkExpiryAlerts(activeCompanyId);
        await notificationService.checkNewOrders(activeCompanyId);

        // Fetch unread to potentially show a summary or just rely on the local triggers
        // The service already creates local DB records. 
        // We could also trigger a push here if we wanted real system notifications
      } catch (error) {
        console.error('Error checking automated alerts:', error);
      }
    };

    // Run on mount
    checkAlerts();

    // Optionally set an interval for long-running sessions (e.g., every 30 mins)
    const interval = setInterval(checkAlerts, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeCompanyId, user?.id]);
}
