import { useState, useEffect, useCallback } from 'react';
import { intelligenceService, StockForecast, ABCAnalysis, ProfitabilityAnalysis } from '@/services/intelligenceService';
import { notificationService } from '@/features/notifications/services/notificationService';
import { useCompanyStore } from '@/store/companyStore';

export const useIntelligence = () => {
  const { activeCompanyId } = useCompanyStore();
  const [forecast, setForecast] = useState<StockForecast[]>([]);
  const [abcData, setAbcData] = useState<ABCAnalysis[]>([]);
  const [profitData, setProfitData] = useState<ProfitabilityAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAll = useCallback(() => {
    if (!activeCompanyId) return;
    setIsLoading(true);
    
    try {
      const f = intelligenceService.getStockForecast();
      const a = intelligenceService.getABCAnalysis();
      const p = intelligenceService.getProfitabilityAnalysis();
      
      setForecast(f);
      setAbcData(a);
      setProfitData(p);
      
      // Check for critical items to notify
      const critical = intelligenceService.getCriticalStockItems();
      if (critical.length > 0) {
        critical.forEach(item => {
          notificationService.sendLowStockAlert(item.name, item.current_stock);
        });
      }
    } catch (error) {
      console.error('Error loading intelligence data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    loadAll();
    // Refresh every 30 minutes in the background if app is open
    const interval = setInterval(loadAll, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAll]);

  return {
    forecast,
    abcData,
    profitData,
    isLoading,
    refresh: loadAll
  };
};
