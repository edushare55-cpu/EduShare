/**
 * components/shared/user-avatar.tsx
 * User avatar with fallback initials — used in Navbar and post cards.
 * TODO: Implement using shadcn Avatar + getInitials utility.
 */

"use client";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({ name, avatarUrl, size = "md" }: UserAvatarProps) {
  const sizeMap = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base", xl: "h-24 w-24 text-2xl" };
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={`${sizeMap[size]} rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="rounded-full object-cover w-full h-full" />
      ) : (
        initials
      )}
    </div>
  );
}
