import { Clock, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function EduzzTutorial() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Obter sua API Key da Eduzz</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>5-10 minutos</span>
          </div>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Este tutorial está sendo preparado e será disponibilizado em breve. 
              Enquanto isso, confira o tutorial da Kiwify para começar a usar o MetrikaPRO.
            </p>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
