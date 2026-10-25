"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormInput } from "@/components/auth/FormInput";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await loginAction(data);

      if (result.success && result.role) {
        toast.success("Login successful!");
        switch (result.role) {
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          case "FACULTY":
            router.push("/faculty/dashboard");
            break;
          case "STUDENT":
          default:
            router.push("/student/dashboard");
            break;
        }
        return; // Early return keeps isSubmitting = true during route transition
      } else {
        toast.error(result.error || "Login failed.");
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/40 w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-10 lg:hidden">
        <Image
          src="/pclu-logo.png"
          alt="Polytechnic College of La Union seal"
          width={58}
          height={62}
          className="h-16 w-auto object-contain mb-4"
          priority
        />
        <h1 className="text-2xl font-black text-on-surface tracking-tight">EduShare</h1>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">Welcome Back</h2>
        <p className="text-on-surface-variant font-medium">Sign in to access your dashboard and classes.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          icon="lock"
          {...register("password")}
          error={errors.password?.message}
          disabled={isSubmitting}
          rightElement={
            <Link
              href="/forgot-password"
              className="font-label-sm font-bold text-primary hover:text-primary-container transition-colors"
            >
              Forgot Password?
            </Link>
          }
        />

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Authenticating..."
          variant="primary"
          className="group w-full py-[14px] px-[20px] rounded-xl font-bold shadow-md hover:shadow-xl hover:bg-primary-container hover:text-on-primary-container focus:ring-4 focus:ring-primary/20 transition-all duration-300 mt-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-shimmer"></div>
          <span className="flex items-center gap-2 group-hover:scale-105 transition-transform">
            Sign In
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </span>
        </LoadingButton>
      </form>

      <div className="mt-10 text-center font-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-label-md font-bold text-primary hover:text-primary-container transition-colors"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
