import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Check, X, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Kiwify state
  const [kiwifyClientId, setKiwifyClientId] = useState('');
  const [kiwifyClientSecret, setKiwifyClientSecret] = useState('');
  const [showKiwifySecret, setShowKiwifySecret] = useState(false);

  // Meta state
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaAdAccountId, setMetaAdAccountId] = useState('');
  const [showMetaToken, setShowMetaToken] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const kiwifyIntegration = integrations?.find(i => i.type === 'kiwify');
  const metaIntegration = integrations?.find(i => i.type === 'meta_ads');

  const saveIntegration = useMutation({
    mutationFn: async ({ type, credentials }: { type: string; credentials: Record<string, string> }) => {
      const existing = integrations?.find(i => i.type === type);
      
      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({ credentials, is_active: true })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert({ user_id: user!.id, type, credentials });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: 'Integração salva!', description: 'Suas credenciais foram salvas com sucesso.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  const disconnectIntegration = useMutation({
    mutationFn: async (type: string) => {
      const existing = integrations?.find(i => i.type === type);
      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({ is_active: false })
          .eq('id', existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: 'Integração desconectada' });
    },
  });

  const handleSaveKiwify = () => {
    if (!kiwifyClientId || !kiwifyClientSecret) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    saveIntegration.mutate({
      type: 'kiwify',
      credentials: { client_id: kiwifyClientId, client_secret: kiwifyClientSecret },
    });
  };

  const handleSaveMeta = () => {
    if (!metaAccessToken || !metaAdAccountId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    saveIntegration.mutate({
      type: 'meta_ads',
      credentials: { access_token: metaAccessToken, ad_account_id: metaAdAccountId },
    });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Configurações</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Kiwify Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Kiwify
                      {kiwifyIntegration?.is_active ? (
                        <span className="flex items-center text-sm font-normal text-green-500">
                          <Check className="h-4 w-4 mr-1" /> Conectado
                        </span>
                      ) : (
                        <span className="flex items-center text-sm font-normal text-muted-foreground">
                          <X className="h-4 w-4 mr-1" /> Desconectado
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Conecte sua conta Kiwify para importar vendas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kiwify-client-id">Client ID</Label>
                  <Input
                    id="kiwify-client-id"
                    placeholder="Seu Client ID da Kiwify"
                    value={kiwifyClientId}
                    onChange={(e) => setKiwifyClientId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kiwify-client-secret">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="kiwify-client-secret"
                      type={showKiwifySecret ? 'text' : 'password'}
                      placeholder="Seu Client Secret da Kiwify"
                      value={kiwifyClientSecret}
                      onChange={(e) => setKiwifyClientSecret(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKiwifySecret(!showKiwifySecret)}
                    >
                      {showKiwifySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveKiwify} disabled={saveIntegration.isPending}>
                    {saveIntegration.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                  {kiwifyIntegration?.is_active && (
                    <Button 
                      variant="outline" 
                      onClick={() => disconnectIntegration.mutate('kiwify')}
                      disabled={disconnectIntegration.isPending}
                    >
                      Desconectar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Você pode obter essas credenciais em Kiwify → Configurações → API
                </p>
              </CardContent>
            </Card>

            {/* Meta Ads Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Meta Ads
                      {metaIntegration?.is_active ? (
                        <span className="flex items-center text-sm font-normal text-green-500">
                          <Check className="h-4 w-4 mr-1" /> Conectado
                        </span>
                      ) : (
                        <span className="flex items-center text-sm font-normal text-muted-foreground">
                          <X className="h-4 w-4 mr-1" /> Desconectado
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Conecte sua conta Meta Ads para importar gastos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-token">Access Token</Label>
                  <div className="relative">
                    <Input
                      id="meta-token"
                      type={showMetaToken ? 'text' : 'password'}
                      placeholder="Seu Access Token do Meta"
                      value={metaAccessToken}
                      onChange={(e) => setMetaAccessToken(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowMetaToken(!showMetaToken)}
                    >
                      {showMetaToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-account">ID da Conta de Anúncios</Label>
                  <Input
                    id="meta-account"
                    placeholder="act_123456789"
                    value={metaAdAccountId}
                    onChange={(e) => setMetaAdAccountId(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveMeta} disabled={saveIntegration.isPending}>
                    {saveIntegration.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                  {metaIntegration?.is_active && (
                    <Button 
                      variant="outline" 
                      onClick={() => disconnectIntegration.mutate('meta_ads')}
                      disabled={disconnectIntegration.isPending}
                    >
                      Desconectar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gere um token de acesso em developers.facebook.com com permissões de ads_read
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
