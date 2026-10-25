"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/auth/FormInput";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { adminCreateUserSchema, AdminCreateUserFormValues } from "@/lib/validations/auth";
import { adminCreateUserAction } from "@/lib/actions/admin";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddUserModal({ open, onOpenChange, onSuccess }: AddUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdminCreateUserFormValues>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "College of Information Technology",
      role: "FACULTY",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: AdminCreateUserFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await adminCreateUserAction(data);

      if (result.success) {
        toast.success("User created successfully!");
        reset();
        onSuccess();
      } else {
        toast.error(result.error || "Failed to create user.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-surface-container-lowest border-outline-variant p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 bg-surface-container-low border-b border-outline-variant">
          <DialogTitle className="font-headline-sm text-on-surface">Add New User</DialogTitle>
          <DialogDescription className="font-body-sm text-on-surface-variant">
            Provision a new account. The user will be able to log in immediately without email verification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <FormInput
            id="name"
            label="Full Name"
            type="text"
            placeholder="e.g. Maria Santos"
            icon="person"
            {...register("name")}
            error={errors.name?.message}
            disabled={isSubmitting}
          />

          <FormInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="user@edushare.edu"
            icon="mail"
            {...register("email")}
            error={errors.email?.message}
            disabled={isSubmitting}
          />

          <div>
            <p className="font-label-md text-on-surface mb-2">Role</p>
            <div className="grid grid-cols-3 gap-2">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="STUDENT"
                  {...register("role")}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="w-full text-center py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-label-sm peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary-container transition-colors">
                  Student
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="FACULTY"
                  {...register("role")}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="w-full text-center py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-label-sm peer-checked:bg-tertiary-container peer-checked:text-on-tertiary-container peer-checked:border-tertiary-container transition-colors">
                  Faculty
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="ADMIN"
                  {...register("role")}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="w-full text-center py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-label-sm peer-checked:bg-secondary-container peer-checked:text-on-secondary-container peer-checked:border-secondary-container transition-colors">
                  Admin
                </div>
              </label>
            </div>
            {errors.role && (
              <p className="mt-1 text-error font-label-sm">{errors.role.message}</p>
            )}
          </div>

          <FormInput
            id="password"
            label="Initial Password"
            type="password"
            placeholder="••••••••"
            icon="lock"
            {...register("password")}
            error={errors.password?.message}
            disabled={isSubmitting}
          />

          <FormInput
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            icon="lock"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant mt-6">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-variant rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Creating..."
              variant="primary"
              className="px-6 py-2 shadow-sm"
            >
              Create User
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
