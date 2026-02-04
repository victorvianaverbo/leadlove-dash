

# Tour Guiado para Novos Usuários

## Objetivo

Implementar um tour guiado interativo que aparece automaticamente quando o usuário acessa o Dashboard pela primeira vez após ativar a assinatura. O tour vai guiar o usuário pelos principais elementos da interface.

---

## Biblioteca Escolhida

**react-joyride** - A biblioteca mais popular para tours em React, com:
- Fácil integração com componentes existentes
- Suporte a spotlight (destaque de elementos)
- Navegação entre passos com "Próximo" e "Voltar"
- Opção de pular o tour
- Customização visual para combinar com o tema escuro

---

## Fluxo do Tour

```text
┌─────────────────────────────────────────────────────────────────────┐
│  1. BOAS-VINDAS                                                     │
│     "Bem-vindo ao MetrikaPRO! Vamos fazer um tour rápido?"         │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  2. CARD DO PLANO                                                   │
│     "Aqui você vê seu plano atual e quantos projetos pode criar"   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  3. BOTÃO NOVO PROJETO                                              │
│     "Clique aqui para criar seu primeiro projeto"                   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  4. DOCUMENTAÇÃO                                                    │
│     "Acesse tutoriais de integração com Kiwify, Hotmart e Meta"    │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  5. GERENCIAR ASSINATURA                                            │
│     "Gerencie sua assinatura e dados de pagamento aqui"            │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  6. FIM                                                             │
│     "Pronto! Agora crie seu primeiro projeto e conecte suas contas"│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Controle de Exibição

O tour aparece apenas **uma vez** por usuário. Após completar ou pular:

1. Salvar flag `has_seen_tour: true` na tabela `profiles`
2. Não mostrar o tour novamente em acessos futuros
3. Opção de refazer tour na página de documentação (botão "Ver Tour")

---

## Alterações Necessárias

### 1. Banco de Dados

Adicionar coluna na tabela `profiles`:

| Coluna | Tipo | Default |
|--------|------|---------|
| `has_seen_tour` | boolean | false |

### 2. Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/components/onboarding/OnboardingTour.tsx` | Componente do tour com react-joyride |
| `src/hooks/useOnboardingTour.ts` | Hook para gerenciar estado do tour |

### 3. Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Adicionar IDs nos elementos-alvo e integrar componente do tour |
| `src/contexts/AuthContext.tsx` | Expor `hasSeenTour` do perfil |

### 4. Dependência

```bash
npm install react-joyride
```

---

## Elementos do Tour (IDs)

Para o tour funcionar, os elementos precisam de IDs ou classes específicas:

```typescript
const steps = [
  {
    target: 'body',
    content: 'Bem-vindo ao MetrikaPRO! Vamos fazer um tour rápido pela plataforma?',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '#tour-plan-card',
    content: 'Aqui você vê seu plano atual e quantos projetos ainda pode criar.',
  },
  {
    target: '#tour-new-project',
    content: 'Clique aqui para criar seu primeiro projeto e começar a acompanhar suas métricas.',
  },
  {
    target: '#tour-documentation',
    content: 'Acesse tutoriais completos para conectar Kiwify, Hotmart, Guru e Meta Ads.',
  },
  {
    target: '#tour-manage-subscription',
    content: 'Gerencie sua assinatura, altere forma de pagamento ou faça upgrade.',
  },
  {
    target: 'body',
    content: 'Pronto! Agora crie seu primeiro projeto e conecte suas plataformas de vendas.',
    placement: 'center',
  },
];
```

---

## Estilização

O tour será customizado para combinar com o tema escuro:

```typescript
styles: {
  options: {
    backgroundColor: '#1a1a2e',
    textColor: '#e2e8f0',
    primaryColor: '#8b5cf6', // primary purple
    overlayColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
  buttonNext: {
    backgroundColor: '#8b5cf6',
    color: '#fff',
  },
  buttonBack: {
    color: '#8b5cf6',
  },
  buttonSkip: {
    color: '#64748b',
  },
}
```

---

## Resultado Esperado

1. Usuário assina o plano e é redirecionado ao Dashboard
2. Tour inicia automaticamente com mensagem de boas-vindas
3. Usuário navega pelos 6 passos com "Próximo" e "Voltar"
4. Ao finalizar ou pular, flag é salva no banco
5. Em acessos futuros, tour não aparece novamente
6. Usuário pode refazer o tour manualmente via documentação

---

## Seção Tecnica

### Estrutura do Componente

```typescript
// src/components/onboarding/OnboardingTour.tsx
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const steps = [/* ... steps config ... */];

export function OnboardingTour() {
  const { user, hasSeenTour, setHasSeenTour } = useAuth();
  const [run, setRun] = useState(!hasSeenTour);

  const handleCallback = async (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      await supabase
        .from('profiles')
        .update({ has_seen_tour: true })
        .eq('user_id', user!.id);
      setHasSeenTour(true);
    }
  };

  if (hasSeenTour) return null;

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
      styles={/* ... custom styles ... */}
    />
  );
}
```

### Hook de Gerenciamento

```typescript
// src/hooks/useOnboardingTour.ts
export function useOnboardingTour() {
  const { hasSeenTour } = useAuth();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Delay tour start to ensure DOM is ready
    if (!hasSeenTour) {
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour]);

  return { showTour, setShowTour };
}
```

