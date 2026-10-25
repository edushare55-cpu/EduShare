"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { EduShareLogo } from "@/components/auth/EduShareLogo";
import { FormInput } from "@/components/auth/FormInput";
import {
  forgotPasswordSchema,
  ForgotPasswordFormValues,
} from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordAction(data);

      if (result.success) {
        setIsSuccess(true);
        setLastEmail(data.email);
        toast.success("Reset link sent!");
      } else {
        toast.error(result.error || "Failed to send reset link.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordAction({ email: lastEmail });

      if (result.success) {
        toast.success("Reset link resent!");
      } else {
        toast.error(result.error || "Failed to resend reset link.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard>
      {isSuccess ? (
        <div className="flex flex-col items-center text-center space-y-md py-lg">
          <span
            className="material-symbols-outlined text-secondary text-6xl"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            mark_email_read
          </span>
          <h1 className="font-headline-md text-on-surface">Check your inbox</h1>
          <p className="font-body-sm text-on-surface-variant">
            We sent a password reset link to <br />
            <span className="font-medium text-on-surface">{lastEmail}</span>
          </p>
          <div className="pt-md w-full">
            <button
              onClick={handleResend}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center py-[8px] px-[20px] bg-transparent text-secondary border border-secondary rounded font-label-md hover:bg-secondary-container hover:text-on-secondary-container hover:border-transparent focus:ring-2 focus:ring-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend email"
              )}
            </button>
            <div className="mt-lg">
              <Link
                href="/login"
                className="font-label-md text-primary hover:text-primary-container transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <EduShareLogo
            title="Reset your password"
            subtitle="Enter your email and we'll send you a reset link."
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="student@edushare.edu"
              icon="mail"
              {...register("email")}
              error={errors.email?.message}
              disabled={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center py-[8px] px-[20px] bg-secondary text-on-secondary rounded font-label-md shadow-level-1 hover:bg-secondary-container hover:text-on-secondary-container focus:ring-2 focus:ring-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="mt-md text-center">
            <Link
              href="/login"
              className="font-label-md text-primary hover:text-primary-container transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </>
      )}
    </AuthCard>
  );
}
