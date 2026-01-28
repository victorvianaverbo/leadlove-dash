import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
        .single();

      if (error && error.code !== 'PGRST116') {
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
  const updateCache = useMutation({
    mutationFn: async (metrics: CachedMetrics) => {
      if (!projectId) throw new Error('Project ID required');

      // Convert metrics to Json type
      const metricsJson = metrics as unknown as Json;

      // Check if cache entry exists
      const { data: existing } = await supabase
        .from('metrics_cache')
        .select('id')
        .eq('project_id', projectId)
        .eq('cache_date', today)
        .eq('date_range', dateRange)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('metrics_cache')
          .update({
            metrics: metricsJson,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new - use raw SQL-like approach to avoid type issues
        const insertData = {
          project_id: projectId,
          cache_date: today,
          date_range: dateRange,
          metrics: metricsJson,
        };
        
        const { error } = await supabase
          .from('metrics_cache')
          .insert([insertData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['metrics-cache', projectId, dateRange] 
      });
    },
  });

  return {
    cachedMetrics,
    cacheLoading,
    updateCache: updateCache.mutate,
    isCacheValid: !!cachedMetrics,
  };
}
