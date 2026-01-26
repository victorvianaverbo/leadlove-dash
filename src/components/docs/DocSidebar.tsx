import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TutorialId } from '@/pages/Documentation';

interface DocSidebarProps {
  activeTutorial: TutorialId;
  onSelectTutorial: (id: TutorialId) => void;
}

interface TutorialItem {
  id: TutorialId;
  name: string;
  available: boolean;
}

interface TutorialCategory {
  name: string;
  items: TutorialItem[];
}

const tutorialCategories: TutorialCategory[] = [
  {
    name: 'Integrações de Vendas',
    items: [
      { id: 'kiwify', name: 'Kiwify', available: true },
      { id: 'hotmart', name: 'Hotmart', available: true },
      { id: 'guru', name: 'Guru', available: true },
      { id: 'eduzz', name: 'Eduzz', available: true },
    ],
  },
  {
    name: 'Integrações de Tráfego',
    items: [
      { id: 'meta-ads', name: 'Meta Ads', available: true },
    ],
  },
];

export function DocSidebar({ activeTutorial, onSelectTutorial }: DocSidebarProps) {
  return (
    <nav className="space-y-6">
      {tutorialCategories.map((category) => (
        <div key={category.name} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
            {category.name}
          </p>
          {category.items.map((tutorial) => (
            <button
              key={tutorial.id}
              onClick={() => tutorial.available && onSelectTutorial(tutorial.id)}
              disabled={!tutorial.available}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors',
                tutorial.available 
                  ? 'hover:bg-muted cursor-pointer' 
                  : 'cursor-not-allowed opacity-60',
                activeTutorial === tutorial.id && tutorial.available && 'bg-primary-soft text-primary font-medium'
              )}
            >
              <span>{tutorial.name}</span>
              {!tutorial.available && (
                <Badge variant="secondary" className="text-xs">
                  Em breve
                </Badge>
              )}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
