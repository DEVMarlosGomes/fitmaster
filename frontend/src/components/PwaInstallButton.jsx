import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/contexts/PwaInstallContext";

export function PwaInstallButton({
  className,
  size = "default",
  variant = "outline",
  fullWidth = false,
  label = "Instalar app",
}) {
  const { canInstall, canShowInstructions, isStandalone, installApp } = usePwaInstall();

  if (isStandalone || (!canInstall && !canShowInstructions)) {
    return null;
  }

  const handleInstall = async () => {
    const result = await installApp();

    if (result?.outcome === "accepted") {
      toast.success("Instalação iniciada no dispositivo.");
      return;
    }

    if (result?.outcome === "dismissed") {
      toast.info("Instalação cancelada.");
      return;
    }

    if (result?.outcome === "instructions") {
      toast.info("No iPhone/iPad, use Compartilhar > Adicionar à Tela de Início.");
      return;
    }

    toast.error("Instalação não disponível neste navegador.");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleInstall}
      className={`${fullWidth ? "w-full" : ""} ${className || ""}`.trim()}
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
