import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface EduShareLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle: string;
}

export function EduShareLogo({ title, subtitle, className, ...props }: EduShareLogoProps) {
  return (
    <div className={cn("flex flex-col items-center text-center mb-lg", className)} {...props}>
      <div className="flex items-center gap-2 mb-6">
        <Image
          src="/pclu-logo.png"
          alt="Polytechnic College of La Union seal"
          width={52}
          height={56}
          className="h-14 w-auto object-contain"
          priority
        />
        <span className="font-headline-md text-primary font-bold tracking-tight">
          EduShare
        </span>
      </div>
      <h1 className="font-headline-md text-on-surface mb-2">{title}</h1>
      <p className="font-body-sm text-on-surface-variant">{subtitle}</p>
    </div>
  );
}
