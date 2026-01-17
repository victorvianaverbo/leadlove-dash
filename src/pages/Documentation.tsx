import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DocSidebar } from '@/components/docs/DocSidebar';
import { KiwifyTutorial } from '@/components/docs/KiwifyTutorial';
import { HotmartTutorial } from '@/components/docs/HotmartTutorial';
import { GuruTutorial } from '@/components/docs/GuruTutorial';
import { EduzzTutorial } from '@/components/docs/EduzzTutorial';

export type TutorialId = 'kiwify' | 'hotmart' | 'guru' | 'eduzz';

export default function Documentation() {
  const [activeTutorial, setActiveTutorial] = useState<TutorialId>('kiwify');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectTutorial = (id: TutorialId) => {
    setActiveTutorial(id);
    setMobileOpen(false);
  };

  const renderTutorial = () => {
    switch (activeTutorial) {
      case 'kiwify':
        return <KiwifyTutorial />;
      case 'hotmart':
        return <HotmartTutorial />;
      case 'guru':
        return <GuruTutorial />;
      case 'eduzz':
        return <EduzzTutorial />;
      default:
        return <KiwifyTutorial />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">MetrikaPRO</span>
              <span className="text-muted-foreground">/ Documentação</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Tutoriais</h2>
              </div>
              <DocSidebar 
                activeTutorial={activeTutorial} 
                onSelectTutorial={handleSelectTutorial} 
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                Tutoriais
              </h2>
              <DocSidebar 
                activeTutorial={activeTutorial} 
                onSelectTutorial={handleSelectTutorial} 
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            {renderTutorial()}
          </main>
        </div>
      </div>
    </div>
  );
}
