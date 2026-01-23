import { useState, useEffect } from "react";
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

interface Integration {
  id: string;
  type: string;
  is_active: boolean;
  credentials: unknown;
}

interface MetaAdsIntegrationCardProps {
  projectId: string;
  integration?: Integration;
  selectedCampaigns: string[];
  onCampaignsChange: (campaigns: string[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MetaAdsIntegrationCard({
  projectId,
  integration,
  selectedCampaigns,
  onCampaignsChange,
  isOpen,
  onOpenChange,
}: MetaAdsIntegrationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState("");

  // Load non-sensitive credentials
  useEffect(() => {
    if (integration?.credentials) {
      const creds = integration.credentials as { ad_account_id?: string };
      setAdAccountId(creds.ad_account_id || "");
    }
  }, [integration]);

  // Fetch campaigns
  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns, isFetching: campaignsRefetching } = useQuery({
    queryKey: ['meta-campaigns', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('meta-campaigns', {
        body: { project_id: projectId }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!integration?.is_active,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const campaigns = campaignsData?.campaigns || [];

  // Save integration mutation
  const saveIntegration = useMutation({
    mutationFn: async () => {
      if (integration?.is_active) {
        if (!accessToken) {
          throw new Error("Digite o Access Token para atualizar");
        }
        const currentCreds = integration.credentials as { ad_account_id?: string };
        const { error } = await supabase
          .from('integrations')
          .update({ 
            credentials: { 
              access_token: accessToken, 
              ad_account_id: adAccountId || currentCreds.ad_account_id 
            }, 
            is_active: true 
          })
          .eq('id', integration.id);
        if (error) throw error;
      } else {
        if (!accessToken || !adAccountId) {
          throw new Error("Preencha todas as credenciais");
        }
        const { error } = await supabase
          .from('integrations')
          .insert([{
            user_id: user!.id,
            project_id: projectId,
            type: 'meta_ads',
            credentials: { access_token: accessToken, ad_account_id: adAccountId },
            is_active: true,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-integrations', projectId] });
      queryClient.invalidateQueries({ queryKey: ['meta-campaigns', projectId] });
      toast({ title: "Meta Ads conectado com sucesso!" });
      setAccessToken("");
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
      toast({ title: "Meta Ads desconectado!" });
      onCampaignsChange([]);
    },
  });

  const isConnected = integration?.is_active;

  // Filter campaigns by search
  const filteredCampaigns = campaigns.filter((c: { name: string }) =>
    c.name.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const toggleCampaign = (campaignId: string) => {
    onCampaignsChange(
      selectedCampaigns.includes(campaignId)
        ? selectedCampaigns.filter(c => c !== campaignId)
        : [...selectedCampaigns, campaignId]
    );
  };

  const selectAllCampaigns = () => {
    const allIds = filteredCampaigns.map((c: { id: string }) => c.id);
    onCampaignsChange([...new Set([...selectedCampaigns, ...allIds])]);
  };

  const clearCampaignSelection = () => {
    onCampaignsChange([]);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAUSED':
        return 'secondary';
      default:
        return 'outline';
    }
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
              <span className="font-medium">Meta Ads</span>
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
                {selectedCampaigns.length} campanha(s)
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
              <div>
                <label className="text-sm font-medium">Access Token</label>
                <div className="relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder={isConnected ? '••••••••••••' : 'Seu Access Token do Meta'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {isConnected && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Oculto por segurança. Digite novamente para atualizar.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Ad Account ID</label>
                <Input
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  placeholder="Ex: act_123456789"
                  className={isConnected && adAccountId ? 'bg-muted/30' : ''}
                />
                {isConnected && adAccountId && (
                  <p className="text-xs text-muted-foreground mt-1">ID configurado</p>
                )}
              </div>
            </div>

            <Button 
              onClick={() => saveIntegration.mutate()} 
              disabled={saveIntegration.isPending}
              className="w-full"
            >
              {saveIntegration.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isConnected ? 'Atualizar Meta Ads' : 'Conectar Meta Ads'}
            </Button>

            {/* Campaigns Selection */}
            {isConnected && (
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Campanhas para Monitorar</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchCampaigns();
                      toast({ title: "Atualizando campanhas..." });
                    }}
                    disabled={campaignsRefetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${campaignsRefetching ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar campanhas..."
                    value={campaignSearch}
                    onChange={(e) => setCampaignSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selectedCampaigns.length} de {campaigns.length} selecionadas
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllCampaigns}>
                      Todas
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearCampaignSelection}>
                      Limpar
                    </Button>
                  </div>
                </div>

                {campaignsLoading || campaignsRefetching ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : filteredCampaigns.length > 0 ? (
                  <ScrollArea className="h-48 rounded-md border p-2">
                    <div className="space-y-1">
                      {filteredCampaigns.map((campaign: { id: string; name: string; status: string; had_recent_activity?: boolean }) => (
                        <div 
                          key={campaign.id} 
                          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedCampaigns.includes(campaign.id)}
                            onCheckedChange={() => toggleCampaign(campaign.id)}
                          />
                          <span className="flex-1 truncate text-sm">{campaign.name}</span>
                          <div className="flex items-center gap-1">
                            {campaign.had_recent_activity && (
                              <Badge variant="outline" className="text-xs">90d</Badge>
                            )}
                            <Badge variant={getStatusVariant(campaign.status)} className="text-xs">
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : campaigns.length > 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma campanha na API</p>
                )}

                {campaignsData?.date_range && (
                  <p className="text-xs text-muted-foreground">
                    Período: {campaignsData.date_range.since} a {campaignsData.date_range.until}
                  </p>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
