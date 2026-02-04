import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart3, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      // Wait for Supabase to process the recovery link
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setHasValidSession(true);
      } else {
        // Listen for auth state changes (recovery token processing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setHasValidSession(true);
          }
        });

        // Give it a few seconds for the token to be processed
        setTimeout(() => {
          setIsCheckingSession(false);
        }, 2000);

        return () => subscription.unsubscribe();
      }
      
      setIsCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'Digite a mesma senha nos dois campos.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setResetComplete(true);
      toast({
        title: 'Senha alterada!',
        description: 'Sua nova senha foi definida com sucesso.',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Senha alterada!</CardTitle>
            <CardDescription className="text-base">
              Redirecionando para o dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Link inválido ou expirado</CardTitle>
            <CardDescription className="text-base">
              O link de recuperação não é válido ou já expirou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Solicite um novo link de recuperação de senha.
            </p>
            <Button onClick={() => navigate('/forgot-password')} className="w-full">
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl">
              <BarChart3 className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Criar nova senha</CardTitle>
          <CardDescription className="text-base">
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
