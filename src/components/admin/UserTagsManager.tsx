import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserTagsManagerProps {
  userId: string;
  tags: string[];
  allTags: string[];
  accessToken: string;
  onTagsChange: (userId: string, tags: string[]) => void;
}

const TAG_COLORS: Record<string, string> = {
  VIP: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  "Risco de churn": "bg-destructive/20 text-destructive border-destructive/30",
  Onboarding: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  Trial: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  Novo: "bg-green-500/20 text-green-700 border-green-500/30",
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || "bg-muted text-muted-foreground border-border";
}

export function UserTagsManager({ userId, tags, allTags, accessToken, onTagsChange }: UserTagsManagerProps) {
  const [newTag, setNewTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const suggestedTags = allTags.filter((t) => !tags.includes(t) && t.toLowerCase().includes(newTag.toLowerCase()));

  const addTag = async (tag: string) => {
    if (!tag.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { action: "add_tag", user_id: userId, tag: tag.trim() },
      });
      if (error) throw error;
      onTagsChange(userId, [...tags, tag.trim()]);
      setNewTag("");
    } catch {
      toast.error("Erro ao adicionar tag");
    } finally {
      setLoading(false);
    }
  };

  const removeTag = async (tag: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { action: "remove_tag", user_id: userId, tag },
      });
      if (error) throw error;
      onTagsChange(userId, tags.filter((t) => t !== tag));
    } catch {
      toast.error("Erro ao remover tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className={`cursor-pointer text-xs ${getTagColor(tag)}`}
          onClick={() => removeTag(tag)}
          title="Clique para remover"
        >
          {tag}
          <X className="h-3 w-3 ml-1" />
        </Badge>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={loading}>
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="flex gap-1 mb-2">
            <Input
              placeholder="Nova tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTag(newTag);
                }
              }}
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8 px-2" onClick={() => addTag(newTag)} disabled={!newTag.trim() || loading}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestedTags.slice(0, 8).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer text-xs hover:opacity-80 ${getTagColor(tag)}`}
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
