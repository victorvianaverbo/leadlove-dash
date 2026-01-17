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

const tutorials: TutorialItem[] = [
  { id: 'kiwify', name: 'Kiwify', available: true },
  { id: 'hotmart', name: 'Hotmart', available: false },
  { id: 'guru', name: 'Guru', available: false },
  { id: 'eduzz', name: 'Eduzz', available: false },
];

export function DocSidebar({ activeTutorial, onSelectTutorial }: DocSidebarProps) {
  return (
    <nav className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
        Integrações de Vendas
      </p>
      {tutorials.map((tutorial) => (
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
    </nav>
  );
}
