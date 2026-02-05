import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, 
  Search, ChevronDown, ChevronRight 
} from "lucide-react";

type IntegrationType = 'kiwify' | 'hotmart' | 'guru' | 'eduzz';

interface Integration {
  id: string;
  type: string;
  is_active: boolean;
  credentials: unknown;
}

interface SalesIntegrationCardProps {
  type: IntegrationType;
  projectId: string;
  integration?: Integration;
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const integrationConfig = {
  kiwify: {
    name: 'Kiwify',
    description: 'Conecte a conta Kiwify para importar vendas',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', sensitive: false },
      { key: 'client_secret', label: 'Client Secret', type: 'password', sensitive: true },
      { key: 'account_id', label: 'Account ID', type: 'text', sensitive: false },
    ],
    productsEndpoint: 'kiwify-products',
  },
  hotmart: {
    name: 'Hotmart',
    description: 'Conecte a conta Hotmart para importar vendas',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', sensitive: false },
      { key: 'client_secret', label: 'Client Secret', type: 'password', sensitive: true },
      { key: 'basic_token', label: 'Basic Token (Base64)', type: 'password', sensitive: true },
    ],
    productsEndpoint: 'hotmart-products',
  },
  guru: {
    name: 'Guru DMG',
    description: 'Conecte a conta Guru para importar vendas',
    fields: [
      { key: 'api_token', label: 'API Token', type: 'password', sensitive: true },
    ],
    productsEndpoint: 'guru-products',
  },
  eduzz: {
    name: 'Eduzz',
    description: 'Conecte a conta Eduzz para importar vendas',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', sensitive: true },
    ],
    productsEndpoint: 'eduzz-products',
  },
};

export function SalesIntegrationCard({
  type,
  projectId,
  integration,
  selectedProducts,
  onProductsChange,
  isOpen,
  onOpenChange,
}: SalesIntegrationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const config = integrationConfig[type];

  // Credentials state - using dynamic fields
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [productSearch, setProductSearch] = useState("");
  

  // Load non-sensitive credentials from existing integration
  useState(() => {
    if (integration?.credentials) {
      const creds = integration.credentials as Record<string, string>;
      const nonSensitive: Record<string, string> = {};
      config.fields.forEach(field => {
        if (!field.sensitive && creds[field.key]) {
          nonSensitive[field.key] = creds[field.key];
        }
      });
      setCredentials(nonSensitive);
    }
  });

  // Fetch products for this integration
  const { data: products, isLoading: productsLoading, refetch: refetchProducts, isFetching: productsRefetching } = useQuery({
    queryKey: [`${type}-products`, projectId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(config.productsEndpoint, {
        body: { project_id: projectId }
      });
      if (error) throw error;
      return data?.products || [];
    },
    enabled: !!integration?.is_active,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Save integration mutation
  const saveIntegration = useMutation({
    mutationFn: async () => {
      // Build credentials object
      const newCredentials: Record<string, string> = {};
      config.fields.forEach(field => {
        if (credentials[field.key]) {
          newCredentials[field.key] = credentials[field.key];
        } else if (integration?.is_active && !field.sensitive) {
          // Keep existing non-sensitive values
          const existing = integration.credentials as Record<string, string>;
          if (existing[field.key]) {
            newCredentials[field.key] = existing[field.key];
          }
        }
      });

      // Validate required fields
      const missingFields = config.fields.filter(field => {
        if (integration?.is_active && field.sensitive) {
          // For updates, sensitive fields are optional
          return false;
        }
        return !newCredentials[field.key];
      });

      if (missingFields.length > 0 && !integration?.is_active) {
        throw new Error(`Preencha: ${missingFields.map(f => f.label).join(', ')}`);
      }

      // Merge with existing credentials for updates
      if (integration?.is_active) {
        const existing = integration.credentials as Record<string, string>;
        config.fields.forEach(field => {
          if (!newCredentials[field.key] && existing[field.key]) {
            newCredentials[field.key] = existing[field.key];
          }
        });
      }

      const credentialsJson = JSON.parse(JSON.stringify(newCredentials));

      if (integration) {
        const { error } = await supabase
          .from('integrations')
          .update({ credentials: credentialsJson, is_active: true })
          .eq('id', integration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([{
            user_id: user!.id,
            project_id: projectId,
            type,
            credentials: credentialsJson,
            is_active: true,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-integrations', projectId] });
      queryClient.invalidateQueries({ queryKey: [`${type}-products`, projectId] });
      toast({ title: `${config.name} conectado com sucesso!` });
      // Clear sensitive fields after save
      const cleared: Record<string, string> = {};
      config.fields.forEach(field => {
        if (!field.sensitive && credentials[field.key]) {
          cleared[field.key] = credentials[field.key];
        }
      });
      setCredentials(cleared);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  // Disconnect integration mutation
  const disconnectIntegration = useMutation({
    mutationFn: async () => {
      if (integration) {
        const { error } = await supabase
          .from('integrations')
          .update({ is_active: false })
          .eq('id', integration.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-integrations', projectId] });
      toast({ title: `${config.name} desconectado!` });
      onProductsChange([]);
    },
  });

  const isConnected = integration?.is_active;

  // Filter products by search
  const filteredProducts = products?.filter((p: { name: string }) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  const toggleProduct = (productId: string) => {
    onProductsChange(
      selectedProducts.includes(productId)
        ? selectedProducts.filter(p => p !== productId)
        : [...selectedProducts, productId]
    );
  };

  const selectAllProducts = () => {
    const allIds = filteredProducts.map((p: { id: string }) => p.id);
    onProductsChange([...new Set([...selectedProducts, ...allIds])]);
  };

  const clearProductSelection = () => {
    onProductsChange([]);
  };

  const updateCredential = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{config.name}</span>
              {isConnected ? (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </div>
            {isConnected && (
              <span className="text-xs text-muted-foreground">
                {selectedProducts.length} produto(s)
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t border-border">
            {/* Connection Status */}
            {isConnected && (
              <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
                <span className="text-sm text-success">✓ Credenciais salvas com segurança</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    disconnectIntegration.mutate();
                  }}
                  disabled={disconnectIntegration.isPending}
                >
                  Desconectar
                </Button>
              </div>
            )}

            {/* Credentials Form */}
            <div className="space-y-3">
              {config.fields.map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium">{field.label}</label>
                  <div className="relative">
                    <Input
                      type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                      value={credentials[field.key] || ''}
                      onChange={(e) => updateCredential(field.key, e.target.value)}
                      placeholder={isConnected && field.sensitive ? '••••••••••••' : `Seu ${field.label}`}
                      className={isConnected && !field.sensitive && credentials[field.key] ? 'bg-muted/30' : ''}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => toggleSecretVisibility(field.key)}
                      >
                        {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  {isConnected && field.sensitive && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Oculto por segurança. Digite novamente para atualizar.
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Button 
              onClick={() => saveIntegration.mutate()} 
              disabled={saveIntegration.isPending}
              className="w-full"
            >
              {saveIntegration.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isConnected ? `Atualizar ${config.name}` : `Conectar ${config.name}`}
            </Button>

            {/* Products Selection */}
            {isConnected && (
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Produtos para Monitorar</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchProducts();
                      toast({ title: "Atualizando produtos..." });
                    }}
                    disabled={productsRefetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${productsRefetching ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selectedProducts.length} de {products?.length || 0} selecionados
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllProducts}>
                      Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearProductSelection}>
                      Limpar
                    </Button>
                  </div>
                </div>

                {productsLoading || productsRefetching ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <ScrollArea className="h-40 rounded-md border p-2">
                    <div className="space-y-1">
                      {filteredProducts.map((product: { id: string; name: string }) => (
                        <div 
                          key={product.id} 
                          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <span className="flex-1 truncate text-sm">{product.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : products?.length > 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum produto na API</p>
                )}

              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
