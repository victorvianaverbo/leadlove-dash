import { useCallback, useEffect } from 'react';
import { trackEvent } from '@/lib/meta-pixel';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Stripe publishable key
const stripePromise = loadStripe('pk_live_51SqdPNLGJ9uCQzbb3AvxcLjxvDUlY0oFfN8HCFxYEY4vgJJArQQ40ukTEF1nq71jtSvKpjqVP2UM9n06Zz9qSjTR00eBrHRYYm');

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceId: string | null;
  planName?: string;
}

export function CheckoutModal({ isOpen, onClose, priceId, planName }: CheckoutModalProps) {
  useEffect(() => {
    if (isOpen && priceId) {
      trackEvent('InitiateCheckout', { content_name: planName || 'Unknown' });
    }
  }, [isOpen, priceId, planName]);
  const fetchClientSecret = useCallback(async () => {
    if (!priceId) throw new Error('No price ID provided');
    
    const { data, error } = await supabase.functions.invoke('create-embedded-checkout', {
      body: { priceId },
    });

    if (error) throw error;
    if (!data?.clientSecret) throw new Error('No client secret returned');
    
    return data.clientSecret;
  }, [priceId]);

  if (!priceId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>
            {planName ? `Assinar Plano ${planName}` : 'Finalizar Assinatura'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[calc(90vh-80px)]">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckoutContent />
          </EmbeddedCheckoutProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmbeddedCheckoutContent() {
  return (
    <div className="min-h-[400px]">
      <EmbeddedCheckout />
    </div>
  );
}
