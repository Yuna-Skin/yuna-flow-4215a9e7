import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Camera, Loader2, Check, Pencil, Settings, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("Praticante");
  const [draftName, setDraftName] = useState("Praticante");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.name) {
        setName(prof.name);
        setDraftName(prof.name);
      }
      setAvatarUrl(prof?.avatar_url ?? null);
    })();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const handleSaveName = async () => {
    if (!user) return;
    const trimmed = draftName.trim();
    if (!trimmed) {
      toast.error("O nome não pode ficar vazio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: trimmed })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar");
      return;
    }
    setName(trimmed);
    setEditing(false);
    toast.success("Nome atualizado");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("Falha no upload");
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);
    setUploading(false);
    if (dbErr) {
      toast.error("Não foi possível salvar a foto");
      return;
    }
    setAvatarUrl(url);
    toast.success("Foto atualizada");
  };

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="font-display text-3xl text-foreground">Perfil</h1>

      <div className="mt-6 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-primary to-warm shadow-md transition-transform active:scale-95"
          aria-label="Alterar foto"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl font-display text-primary-foreground">
              {name[0]?.toUpperCase()}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </span>
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/45">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <div className="mt-5 w-full max-w-xs">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Seu nome"
                maxLength={60}
                className="h-11 rounded-full bg-card text-center text-base"
                autoFocus
              />
              <Button
                onClick={handleSaveName}
                disabled={saving}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftName(name);
                setEditing(true);
              }}
              className="group inline-flex items-center gap-2"
            >
              <span className="font-display text-2xl text-foreground">{name}</span>
              <Pencil className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      <JourneyCard userId={user?.id} />



      <Link
        to="/settings"
        className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Configurações</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="mt-4 h-12 w-full rounded-full border-border"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}

function JourneyCard({ userId }: { userId: string | undefined }) {
  const q = useQuery({
    queryKey: ["journey-progress", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ count: completed }, { data: days }] = await Promise.all([
        supabase
          .from("user_progress")
          .select("day_id", { count: "exact", head: true })
          .eq("user_id", userId!)
          .eq("completed", true),
        supabase.from("days").select("id, is_rest").eq("is_rest", false),
      ]);
      return {
        completed: completed ?? 0,
        total: days?.length ?? 0,
      };
    },
  });

  const completed = q.data?.completed ?? 0;
  const total = q.data?.total ?? 0;
  const pct = total > 0 ? completed / total : 0;

  let title = "Plantando a semente do hábito 🌿";
  let sub = "Comece sua primeira prática para iniciar a jornada.";
  if (completed > 0 && pct < 0.25) {
    title = "Construindo sua rotina 🌱";
    sub = "Os primeiros passos já estão acontecendo.";
  } else if (pct >= 0.25 && pct < 0.5) {
    title = "Florescendo aos poucos 🌸";
    sub = "Sua dedicação já começa a aparecer.";
  } else if (pct >= 0.5 && pct < 0.75) {
    title = "Brilho em formação ✨";
    sub = "Mais da metade do protocolo concluído.";
  } else if (pct >= 0.75 && pct < 1) {
    title = "Quase lá, continue ✨";
    sub = "A reta final é só sua.";
  } else if (pct >= 1 && total > 0) {
    title = "Jornada completa 🌟";
    sub = "Você concluiu o protocolo de 28 dias.";
  }

  return (
    <Card className="mt-10 p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Sua jornada</p>
      <p className="mt-2 font-display text-lg text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      {total > 0 && (
        <>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Progresso</span>
            <span className="text-xs font-semibold text-foreground">
              {completed} / {total} dias
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.round(pct * 100)}%` }}
            />
          </div>
        </>
      )}
    </Card>
  );
}
