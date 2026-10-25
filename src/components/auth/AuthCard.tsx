import React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AuthCard({ className, children, ...props }: AuthCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl shadow-level-1 p-md md:p-lg transition-shadow duration-300 hover:shadow-level-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
