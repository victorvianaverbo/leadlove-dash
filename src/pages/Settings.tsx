import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, User, Mail, Lock, BarChart3, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Settings() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Name form state
  const [fullName, setFullName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Set initial values when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Digite seu nome completo.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user!.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: 'Nome atualizado!',
        description: 'Seu nome foi alterado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar nome',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast({
        title: 'Email inválido',
        description: 'Digite um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Email de confirmação enviado!',
        description: 'Verifique sua caixa de entrada para confirmar a alteração.',
      });
      setNewEmail('');
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // First verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: 'Senha atual incorreta',
          description: 'Verifique sua senha atual e tente novamente.',
          variant: 'destructive',
        });
        setIsUpdatingPassword(false);
        return;
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-xl shadow-purple-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl font-display">Configurações</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize seu nome de exibição</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" disabled={isUpdatingName}>
                {isUpdatingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar nome
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Alterar Email</CardTitle>
                <CardDescription>
                  Email atual: <strong>{user?.email}</strong>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ao alterar seu email, você receberá um link de confirmação no novo endereço.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Novo email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" disabled={isUpdatingEmail}>
                {isUpdatingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar email
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Mantenha sua conta segura</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="h-11"
                />
              </div>
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
