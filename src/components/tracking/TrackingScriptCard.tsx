import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Copy, Check } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function TrackingScriptCard() {
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="${SUPABASE_URL}/functions/v1/tracking-script" defer></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          Script de Rastreamento UTM
        </CardTitle>
        <CardDescription>
          Cole este script na sua página de vendas para rastrear UTMs automaticamente nos links de checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono border border-border">
            {snippet}
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </>
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>📌 <strong>WordPress:</strong> Cole em Aparência → Editor de Tema → footer.php (antes do <code>&lt;/body&gt;</code>), ou use o plugin "Insert Headers and Footers".</p>
          <p>📌 <strong>Elementor Pro:</strong> Vá em Elementor → Código Personalizado → Adicionar Novo, cole o script. Localização: <code>&lt;/body&gt; - End</code> | Prioridade: padrão (10) | Publicar normalmente.</p>
          <p>🔄 O script captura UTMs da URL, salva em cookie (30 dias) e adiciona automaticamente aos links da Hotmart, Kiwify, Eduzz e Guru.</p>
        </div>
      </CardContent>
    </Card>
  );
}
