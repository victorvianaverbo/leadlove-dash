import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const steps: Step[] = [
  {
    target: 'body',
    content: 'Bem-vindo ao MetrikaPRO! 🎉 Vamos fazer um tour rápido pela plataforma para você aproveitar ao máximo.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '#tour-plan-card',
    content: 'Aqui você vê seu plano atual e quantos projetos ainda pode criar. Acompanhe seu limite de projetos facilmente.',
    placement: 'bottom',
  },
  {
    target: '#tour-new-project',
    content: 'Clique aqui para criar seu primeiro projeto e começar a acompanhar suas métricas de vendas e anúncios.',
    placement: 'bottom',
  },
  {
    target: '#tour-documentation',
    content: 'Acesse tutoriais completos para conectar Kiwify, Hotmart, Guru, Eduzz e Meta Ads ao seu projeto.',
    placement: 'bottom',
  },
  {
    target: '#tour-manage-subscription',
    content: 'Gerencie sua assinatura, altere forma de pagamento ou faça upgrade do seu plano.',
    placement: 'bottom',
  },
  {
    target: 'body',
    content: 'Pronto! 🚀 Agora crie seu primeiro projeto e conecte suas plataformas de vendas para ver suas métricas em tempo real.',
    placement: 'center',
  },
];

const joyrideStyles = {
  options: {
    backgroundColor: 'hsl(var(--card))',
    textColor: 'hsl(var(--foreground))',
    primaryColor: 'hsl(var(--primary))',
    overlayColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
    arrowColor: 'hsl(var(--card))',
  },
  tooltip: {
    borderRadius: '12px',
    padding: '20px',
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: '16px',
    fontWeight: 600,
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: 1.6,
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  buttonBack: {
    color: 'hsl(var(--primary))',
    marginRight: '8px',
    fontSize: '14px',
  },
  buttonSkip: {
    color: 'hsl(var(--muted-foreground))',
    fontSize: '14px',
  },
  spotlight: {
    borderRadius: '12px',
  },
};

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

export function OnboardingTour({ run, onFinish }: OnboardingTourProps) {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  const handleCallback = async (data: CallBackProps) => {
    const { status, index, type } = data;
    
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      // Save to database that user has seen the tour
      if (user) {
        try {
          await supabase
            .from('profiles')
            .update({ has_seen_tour: true } as any)
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Error saving tour status:', error);
        }
      }
      onFinish();
    }
  };

  if (!run) return null;

  return (
    <Joyride
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      spotlightClicks
      callback={handleCallback}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
      styles={joyrideStyles}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
}
