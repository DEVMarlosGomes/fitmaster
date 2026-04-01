import { useTheme } from "../contexts/ThemeContext";
import { BRAND, getBrandLogoByTheme } from "../lib/brand";
import { cn } from "../lib/utils";

export function BrandLogo({ compact = false, className, imageClassName }) {
  const { theme } = useTheme();
  const src = compact ? BRAND.assets.mark : getBrandLogoByTheme(theme);
  const alt = compact ? `Monograma ${BRAND.name}` : `${BRAND.name} - ${BRAND.role}`;

  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <img
        src={src}
        alt={alt}
        className={cn("block h-auto max-w-full object-contain", imageClassName)}
        decoding="async"
      />
    </div>
  );
}
