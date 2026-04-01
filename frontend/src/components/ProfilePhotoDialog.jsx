import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { UserAvatar } from "./UserAvatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function ProfilePhotoDialog({
  open,
  onOpenChange,
  user,
  onUserUpdated,
  promptMode = false,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl("");
      setSubmitting(false);
      setDismissing(false);
    }
  }, [open]);

  const previewPhotoUrl = useMemo(() => previewUrl || user?.profile_photo_url || "", [previewUrl, user?.profile_photo_url]);

  const handleSelectFile = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    if (!nextFile.type?.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      event.target.value = "";
      return;
    }

    setSelectedFile(nextFile);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione uma foto antes de enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setSubmitting(true);
    try {
      const response = await api.post("/auth/profile-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUserUpdated?.(response.data);
      toast.success("Foto de perfil atualizada.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Erro ao enviar foto de perfil.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissPrompt = async () => {
    if (!promptMode) {
      onOpenChange(false);
      return;
    }

    setDismissing(true);
    try {
      const response = await api.post("/auth/profile-photo/prompt-seen");
      onUserUpdated?.(response.data);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Nao foi possivel fechar o lembrete.");
    } finally {
      setDismissing(false);
    }
  };

  const handleDialogOpenChange = (nextOpen) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (promptMode && !submitting && !dismissing) {
      void handleDismissPrompt();
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Camera className="h-5 w-5" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">
            {promptMode ? "Coloque sua foto de perfil" : "Atualize sua foto de perfil"}
          </DialogTitle>
          <DialogDescription>
            Sua foto ajuda o personal a identificar voce mais rapido em relatos, listas e acompanhamentos.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[160px,1fr] md:items-center">
            <div className="flex justify-center">
              <UserAvatar
                name={user?.name}
                photoUrl={previewPhotoUrl}
                size="2xl"
                className="rounded-[2rem] border-4 border-primary/15 shadow-[0_22px_45px_-28px_rgba(0,129,253,0.55)]"
                fallbackClassName="rounded-[2rem]"
              />
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                <p className="text-sm font-semibold text-foreground">O que muda com a foto</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Seu personal te identifica com mais rapidez nas telas de alunos.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ImagePlus className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Seu perfil fica mais claro em relatos, chat e acompanhamento semanal.</span>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelectFile}
              />

              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }}
              >
                <ImagePlus className="h-4 w-4" />
                {selectedFile ? "Trocar imagem selecionada" : "Selecionar foto"}
              </Button>

              <p className="text-xs text-muted-foreground">
                {selectedFile
                  ? `Arquivo selecionado: ${selectedFile.name}`
                  : "Use uma imagem nítida do rosto para facilitar a identificacao."}
              </p>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDismissPrompt}
            disabled={submitting || dismissing}
          >
            {promptMode ? "Agora nao" : "Fechar"}
          </Button>
          <Button type="button" onClick={handleUpload} disabled={!selectedFile || submitting || dismissing}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Salvar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
