"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClassSchema } from "@/lib/validations/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Extended schema to handle the local form
const formSchema = createClassSchema;
type FormValues = z.infer<typeof formSchema>;

interface AdminCreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyList: { id: string; name: string; department: string | null }[];
  onCreated: (newSection: any) => void;
}

export default function AdminCreateSectionModal({
  isOpen,
  onClose,
  facultyList,
  onCreated,
}: AdminCreateSectionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subject: "",
      description: "",
      facultyId: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to create section");
      }

      onCreated(json.data);
      reset();
      onClose();
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl z-50 p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Assign New Section</h2>
            <p className="text-sm text-on-surface-variant mt-1">Create a class and assign a faculty member.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {apiError && (
          <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-lg text-sm border border-error/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Section Name <span className="text-error">*</span>
            </label>
            <Input
              {...register("name")}
              placeholder="e.g. BSCS 3A"
              className="w-full bg-surface-container border-outline-variant/50 focus:border-primary"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Subject <span className="text-error">*</span>
            </label>
            <Input
              {...register("subject")}
              placeholder="e.g. Intro to Computing"
              className="w-full bg-surface-container border-outline-variant/50 focus:border-primary"
            />
            {errors.subject && <p className="text-error text-xs mt-1">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Assign to Faculty <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select
                {...register("facultyId")}
                className="w-full appearance-none bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-lg cursor-pointer"
              >
                <option value="">-- Select Faculty Member --</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.department ? `(${f.department})` : ""}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
            {errors.facultyId && <p className="text-error text-xs mt-1">{errors.facultyId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Description (Optional)
            </label>
            <textarea
              {...register("description")}
              placeholder="Optional course description..."
              className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-lg min-h-[100px] resize-y"
            />
            {errors.description && <p className="text-error text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-outline-variant/50 hover:bg-surface-container"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-on-primary hover:bg-primary/90 shadow-md min-w-[120px]"
            >
              {isLoading ? "Assigning..." : "Assign Section"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
