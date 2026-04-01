import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { resolveProfilePhotoUrl, getUserInitials } from "../lib/profilePhoto";

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-lg",
  "2xl": "h-20 w-20 text-2xl",
};

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  className = "",
  fallbackClassName = "",
}) {
  const resolvedPhotoUrl = resolveProfilePhotoUrl(photoUrl);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <Avatar className={`${sizeClass} ${className}`.trim()}>
      <AvatarImage src={resolvedPhotoUrl} alt={name || "Usuario"} className="object-cover" />
      <AvatarFallback
        className={`font-bold text-white ${fallbackClassName}`.trim()}
        style={{ background: "linear-gradient(135deg, #0081fd 0%, #0055cc 100%)" }}
      >
        {getUserInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
