"use client";

import React from "react";
import Link from "next/link";
import MySection from "@/components/student/MySection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClasses } from "@/hooks/use-class";

export default function StudentClassesPage() {
  const { data: classes = [], isLoading } = useClasses();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8 animate-in fade-in duration-500">
        <div className="mb-4">
          <div className="h-10 w-48 bg-surface-container-high rounded-lg animate-pulse mb-2" />
          <div className="h-6 w-96 bg-surface-container-high rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-surface-container-lowest rounded-xl border border-outline-variant/20 h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="mb-4">
        <h1 className="text-3xl font-headline-xl text-primary tracking-tight mb-2">Your Sections</h1>
        <p className="text-lg text-on-surface-variant font-body-lg max-w-2xl">
          Access your class feeds, upcoming assignments, and connect with your peers.
        </p>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {classes.map((cls) => (
            <MySection key={cls.id} classData={cls} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px]">school</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">No Active Sections</h3>
          <p className="text-on-surface-variant max-w-md">
            You are not currently enrolled in any active classes. Please ensure your registration was approved by your instructor.
          </p>
        </div>
      )}
    </div>
  );
}
