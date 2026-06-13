import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Camera, Loader2, Check, Pencil, Settings, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { profileWithJourneyQueryOptions } from "@/lib/queries/profile.queries";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/_authenticated/profile")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = user?.id;

  const profileQ = useQuery(profileWithJourneyQueryOptions(userId));

  const serverName = profileQ.data?.name ?? "Praticante";
  const serverAvatar = profileQ.data?.avatarUrl ?? null;

  const [draftName, setDraftName] = useState(serverName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // mantém draft alinhado quando dados chegam
  useEffect(() => {
    if (!editing) setDraftName(serverName);
  }, [serverName, editing]);

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
    setEditing(false);
    await queryClient.invalidateQueries({ queryKey: ["profile-with-journey"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
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
    await queryClient.invalidateQueries({ queryKey: ["profile-with-journey"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Foto atualizada");
  };

  const completed = profileQ.data?.completed ?? 0;
  const total = profileQ.data?.totalActiveDays ?? 0;
  const pct = total > 0 ? completed / total : 0;

  let journeyTitle = "Plantando a semente do hábito 🌿";
  let journeySub = "Comece sua primeira prática para iniciar a jornada.";
  if (completed > 0 && pct < 0.25) {
    journeyTitle = "Construindo sua rotina 🌱";
    journeySub = "Os primeiros passos já estão acontecendo.";
  } else if (pct >= 0.25 && pct < 0.5) {
    journeyTitle = "Florescendo aos poucos 🌸";
    journeySub = "Sua dedicação já começa a aparecer.";
  } else if (pct >= 0.5 && pct < 0.75) {
    journeyTitle = "Brilho em formação ✨";
    journeySub = "Mais da metade do protocolo concluído.";
  } else if (pct >= 0.75 && pct < 1) {
    journeyTitle = "Quase lá, continue ✨";
    journeySub = "A reta final é só sua.";
  } else if (pct >= 1 && total > 0) {
    journeyTitle = "Jornada completa 🌟";
    journeySub = "Você concluiu o protocolo de 28 dias.";
  }

  return (
    <div className="px-5 pb-6 pt-8 md:mx-auto md:max-w-2xl md:px-8 md:pt-12">
      <h1 className="font-display text-3xl text-foreground">Perfil</h1>

      <div className="mt-6 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-primary to-warm shadow-md transition-transform active:scale-95"
          aria-label="Alterar foto"
        >
          {serverAvatar ? (
            <img src={serverAvatar} alt={serverName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl font-display text-primary-foreground">
              {serverName[0]?.toUpperCase()}
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
                setDraftName(serverName);
                setEditing(true);
              }}
              className="group inline-flex items-center gap-2"
            >
              <span className="font-display text-2xl text-foreground">{serverName}</span>
              <Pencil className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      <Card className="mt-10 p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Sua jornada</p>
        <p className="mt-2 font-display text-lg text-foreground">{journeyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{journeySub}</p>
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
