import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface CachedMetrics {
  totalRevenue: number;
  totalSpend: number;
  totalSales: number;
  roas: number;
  totalImpressions: number;
  totalReach: number;
  totalLandingPageViews: number;
  totalLinkClicks: number;
  totalCheckoutsInitiated: number;
  totalThruplays: number;
  totalVideo3sViews: number;
  avgFrequency: number;
  avgCPC: number;
  avgCPM: number;
  ctr: number;
  lpViewRate: number;
  custoPerVenda: number;
  vendaPerLP: number;
  checkoutConversionRate: number;
  creativeEngagementRate: number;
  custoPerCheckout: number;
  dailyBudget: number;
}

const CACHE_TTL_MINUTES = 5;

export function useMetricsCache(projectId: string | undefined, dateRange: string) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Fetch cached metrics
  const { data: cachedMetrics, isLoading: cacheLoading } = useQuery({
    queryKey: ['metrics-cache', projectId, dateRange, today],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('metrics_cache')
        .select('*')
        .eq('project_id', projectId)
        .eq('date_range', dateRange)
        .eq('cache_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching metrics cache:', error);
        return null;
      }

      if (!data) return null;

      // Check if cache is still valid (within TTL)
      const updatedAt = new Date(data.updated_at);
      const now = new Date();
      const minutesOld = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

      if (minutesOld > CACHE_TTL_MINUTES) {
        return null; // Cache expired
      }

      return data.metrics as unknown as CachedMetrics;
    },
    enabled: !!projectId,
    staleTime: CACHE_TTL_MINUTES * 60 * 1000,
  });

  // Update cache mutation
  const updateCacheMutation = useMutation({
    mutationFn: async (metrics: CachedMetrics) => {
      if (!projectId) throw new Error('Project ID required');

      // Convert metrics to Json type
      const metricsJson = metrics as unknown as Json;

      // Use atomic upsert to avoid race conditions (409 Conflict)
      const { error } = await supabase
        .from('metrics_cache')
        .upsert({
          project_id: projectId,
          cache_date: today,
          date_range: dateRange,
          metrics: metricsJson,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,cache_date,date_range'
        });

      // Treat duplicate key errors as success (another request succeeded)
      if (error && error.code !== '23505' && !error.message.includes('duplicate')) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['metrics-cache', projectId, dateRange] 
      });
    },
  });

  // Debounced update function to prevent rapid concurrent calls
  const debouncedUpdateCache = useCallback((metrics: CachedMetrics) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      updateCacheMutation.mutate(metrics);
    }, 500);
  }, [updateCacheMutation]);

  return {
    cachedMetrics,
    cacheLoading,
    updateCache: debouncedUpdateCache,
    isCacheValid: !!cachedMetrics,
  };
}
