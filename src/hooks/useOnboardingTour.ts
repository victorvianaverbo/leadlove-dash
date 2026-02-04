import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useOnboardingTour() {
  const { user, subscribed } = useAuth();
  const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tour status from profile
  useEffect(() => {
    async function fetchTourStatus() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_seen_tour')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching tour status:', error);
          setHasSeenTour(true); // Default to true if error (don't show tour)
        } else {
          setHasSeenTour((data as any)?.has_seen_tour ?? false);
        }
      } catch (error) {
        console.error('Error fetching tour status:', error);
        setHasSeenTour(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTourStatus();
  }, [user]);

  // Start tour with delay if user hasn't seen it and is subscribed
  useEffect(() => {
    if (isLoading || hasSeenTour === null) return;
    
    if (!hasSeenTour && subscribed) {
      // Small delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, subscribed, isLoading]);

  const finishTour = useCallback(() => {
    setShowTour(false);
    setHasSeenTour(true);
  }, []);

  const restartTour = useCallback(() => {
    setShowTour(true);
  }, []);

  return {
    showTour,
    hasSeenTour,
    isLoading,
    finishTour,
    restartTour,
  };
}
