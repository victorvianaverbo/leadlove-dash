import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface UserData {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  override: { extra_projects: number; notes: string | null } | null;
}

interface EditUserModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    userId: string;
    email: string;
    password?: string;
    isAdmin: boolean;
    extraProjects: number;
    notes: string;
  }) => Promise<void>;
  currentAdminId?: string;
}

export function EditUserModal({ user, isOpen, onClose, onSave, currentAdminId }: EditUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [extraProjects, setExtraProjects] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const isSelf = user?.user_id === currentAdminId;

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setIsAdmin(user.is_admin || false);
      setExtraProjects(user.override?.extra_projects || 0);
      setNotes(user.override?.notes || "");
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    if (password) {
      if (password.length < 6) {
        setPasswordError("Mínimo de 6 caracteres");
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError("As senhas não coincidem");
        return;
      }
    }
    setPasswordError("");

    setSaving(true);
    try {
      await onSave({
        userId: user.user_id,
        email,
        password: password || undefined,
        isAdmin,
        extraProjects,
        notes,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={user?.full_name || ""} disabled className="bg-muted" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Alterar Senha</p>

          <div className="grid gap-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe vazio para não alterar"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Permissões</p>

          <div className="flex items-center justify-between">
            <Label htmlFor="isAdmin">Admin Metrika</Label>
            <Switch
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={setIsAdmin}
              disabled={isSelf}
            />
          </div>
          {isSelf && (
            <p className="text-xs text-muted-foreground">
              Você não pode remover seu próprio acesso admin
            </p>
          )}

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Overrides</p>

          <div className="grid gap-2">
            <Label htmlFor="extraProjects">Projetos Extras</Label>
            <Input
              id="extraProjects"
              type="number"
              min={0}
              value={extraProjects}
              onChange={(e) => setExtraProjects(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Número de projetos adicionais além do limite do plano
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações internas sobre o usuário..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
