import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, 
  Search, ChevronDown, ChevronRight, BookOpen, Copy, Check, Facebook
} from "lucide-react";

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
}

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

  const OAUTH_TEST_USER = "ee3515c2-6a17-40b1-971f-34a788b7d2ec";
  const isOAuthUser = user?.id === OAUTH_TEST_USER;

  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [availableAdAccounts, setAvailableAdAccounts] = useState<AdAccount[]>([]);
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [changingAccount, setChangingAccount] = useState(false);

  // Load credentials
  useEffect(() => {
    if (integration?.credentials) {
      const creds = integration.credentials as { 
        ad_account_id?: string; 
        oauth_connected?: boolean;
        available_ad_accounts?: AdAccount[];
      };
      const storedId = creds.ad_account_id || "";
      setAdAccountId(storedId.replace(/^act_/, ""));
      setIsOAuthConnected(!!creds.oauth_connected);
      setAvailableAdAccounts(creds.available_ad_accounts || []);
    }
  }, [integration]);

  // Handle OAuth redirect result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("meta_oauth");
    if (oauthStatus === "success") {
      toast({ title: "Meta Ads conectado via Facebook!" });
      // Force refetch to get fresh credentials with available_ad_accounts
      queryClient.refetchQueries({ queryKey: ['project-integrations', projectId], type: 'all' });
      queryClient.invalidateQueries({ queryKey: ['meta-campaigns', projectId] });
      // Auto-open the card so the user sees the account selector
      onOpenChange(true);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("meta_oauth");
      window.history.replaceState({}, "", url.toString());
    } else if (oauthStatus === "error") {
      const errorMsg = params.get("meta_oauth_error") || "Erro desconhecido";
      toast({ title: "Erro no OAuth", description: errorMsg, variant: "destructive" });
      const url = new URL(window.location.href);
      url.searchParams.delete("meta_oauth");
      url.searchParams.delete("meta_oauth_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

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
      if (integration) {
        if (!accessToken) {
          throw new Error("Digite o Access Token para atualizar");
        }
        const currentCreds = integration.credentials as { ad_account_id?: string };
        const currentIdWithoutPrefix = (currentCreds.ad_account_id || "").replace(/^act_/, "");
        const finalAdAccountId = adAccountId || currentIdWithoutPrefix;
        const { error } = await supabase
          .from('integrations')
          .update({ 
            credentials: { 
              access_token: accessToken, 
              ad_account_id: finalAdAccountId ? `act_${finalAdAccountId}` : ""
            }, 
            is_active: true 
          })
          .eq('id', integration.id);
        if (error) throw error;
      } else {
        if (!accessToken || !adAccountId) {
          throw new Error("Preencha todas as credenciais");
        }
        const existingIntegration = await supabase
          .from('integrations')
          .select('id')
          .eq('project_id', projectId)
          .eq('type', 'meta_ads')
          .maybeSingle();
        
        if (existingIntegration.data) {
          // Integration exists but was not passed (edge case) - update it
          const { error } = await supabase
            .from('integrations')
            .update({ 
              credentials: { access_token: accessToken, ad_account_id: `act_${adAccountId}` }, 
              is_active: true 
            })
            .eq('id', existingIntegration.data.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('integrations')
            .insert([{
              user_id: user!.id,
              project_id: projectId,
              credentials: { access_token: accessToken, ad_account_id: `act_${adAccountId}` },
              type: 'meta_ads',
              is_active: true,
            }]);
          if (error) throw error;
        }
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

  // Handle ad account change for OAuth users
  const handleAdAccountChange = async (newAccountId: string) => {
    if (!integration) return;
    setChangingAccount(true);
    try {
      const creds = integration.credentials as Record<string, unknown>;
      const { error } = await supabase
        .from('integrations')
        .update({
          credentials: { ...creds, ad_account_id: newAccountId } as unknown as import("@/integrations/supabase/types").Json,
        })
        .eq('id', integration.id);
      if (error) throw error;
      setAdAccountId(newAccountId.replace(/^act_/, ""));
      queryClient.invalidateQueries({ queryKey: ['project-integrations', projectId] });
      queryClient.invalidateQueries({ queryKey: ['meta-campaigns', projectId] });
      toast({ title: "Conta de anúncios atualizada!" });
    } catch (err: any) {
      toast({ title: "Erro ao trocar conta", description: err.message, variant: "destructive" });
    } finally {
      setChangingAccount(false);
    }
  };

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

  const handleFacebookLogin = () => {
    const META_APP_ID = import.meta.env.VITE_SUPABASE_URL 
      ? "" : ""; // App ID comes from edge function
    
    // We'll use the SUPABASE_URL to build the redirect URI
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth-callback`;
    const state = `${projectId}|${user!.id}|${window.location.origin}`;
    const scope = "ads_read,ads_management,read_insights";
    
    // We need the META_APP_ID from the edge function. Let's fetch it.
    setOauthLoading(true);
    supabase.functions.invoke('meta-oauth-callback', {
      method: 'POST',
      body: { action: 'get_app_id' }
    }).then(({ data, error }) => {
      setOauthLoading(false);
      // Fallback: open OAuth URL using the app ID from secrets
      // Since we can't expose the app ID easily, we'll use a different approach
      // The edge function will return the app ID
      if (error || !data?.app_id) {
        toast({ title: "Erro ao iniciar OAuth", description: "Não foi possível obter o App ID", variant: "destructive" });
        return;
      }
      const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${data.app_id}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${scope}`;
      window.open(authUrl, "_blank", "width=600,height=700");
    });
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
            {/* Helper Box - only for manual flow users */}
            {!isOAuthUser && <MetaAdsHelperBox />}
            
            {/* OAuth Flow - for test user (connect or reconnect) */}
            {isOAuthUser && (
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
                  <p className="text-sm font-medium">
                    {isConnected ? 'Reconectar via Facebook Login' : 'Conectar via Facebook Login'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isConnected 
                      ? 'Reconecte para atualizar permissões ou trocar de conta.'
                      : 'Clique no botão abaixo para autorizar o acesso às suas campanhas do Meta Ads diretamente.'}
                  </p>
                  <Button
                    onClick={handleFacebookLogin}
                    disabled={oauthLoading}
                    className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
                  >
                    {oauthLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Facebook className="h-4 w-4 mr-2" />
                    )}
                    {isConnected ? 'Reconectar com Facebook' : 'Conectar com Facebook'}
                  </Button>
                </div>
              </div>
            )}
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

            {/* Ad Account Selector - for OAuth users */}
            {isConnected && isOAuthConnected && availableAdAccounts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Conta de Anúncios</label>
                <Select
                  value={adAccountId ? `act_${adAccountId}` : ""}
                  onValueChange={handleAdAccountChange}
                  disabled={changingAccount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAdAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="flex items-center gap-2">
                          {account.name} ({account.id})
                          {account.account_status !== 1 && (
                            <Badge variant="secondary" className="text-xs ml-1">Inativa</Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {changingAccount && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Salvando...
                  </div>
                )}
              </div>
            )}

            {/* Credentials Form - hidden for OAuth connected users */}
            {!isOAuthConnected && (
              <>
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
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                        act_
                      </span>
                      <Input
                        value={adAccountId}
                        onChange={(e) => {
                          const value = e.target.value.replace(/^act_/, '');
                          setAdAccountId(value);
                        }}
                        placeholder="123456789"
                        className={`rounded-l-none ${isConnected && adAccountId ? 'bg-muted/30' : ''}`}
                      />
                    </div>
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
              </>
            )}

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

function MetaAdsHelperBox() {
  const [copiedPrivacy, setCopiedPrivacy] = useState(false);
  const [copiedTerms, setCopiedTerms] = useState(false);

  const handleCopy = (url: string, type: 'privacy' | 'terms') => {
    navigator.clipboard.writeText(url);
    if (type === 'privacy') {
      setCopiedPrivacy(true);
      setTimeout(() => setCopiedPrivacy(false), 2000);
    } else {
      setCopiedTerms(true);
      setTimeout(() => setCopiedTerms(false), 2000);
    }
  };

  return (
    <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Precisa de ajuda para conectar?</p>
        <Link to="/documentacao?tutorial=meta-ads">
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4 mr-1" />
            Ver Tutorial
          </Button>
        </Link>
      </div>
      
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">URLs para configurar seu App Meta:</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground min-w-[50px]">Privacy:</span>
            <code className="bg-background px-1.5 py-0.5 rounded border truncate flex-1">metrikapro.com.br/privacy</code>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => handleCopy('https://metrikapro.com.br/privacy', 'privacy')}
            >
              {copiedPrivacy ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground min-w-[50px]">Terms:</span>
            <code className="bg-background px-1.5 py-0.5 rounded border truncate flex-1">metrikapro.com.br/terms</code>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => handleCopy('https://metrikapro.com.br/terms', 'terms')}
            >
              {copiedTerms ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
