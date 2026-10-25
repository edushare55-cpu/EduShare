"use client";

import React from "react";
import Link from "next/link";
import { PasswordForm } from "@/components/profile/password-form";

export default function UpdatePasswordPage() {
  return (
    <main className="w-full max-w-md animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/40 p-8 sm:p-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary shadow-lg mb-4 transform hover:rotate-12 transition-transform duration-300">
            <span className="material-symbols-outlined text-white text-[28px]">
              lock_reset
            </span>
          </div>
          <h1 className="font-headline-lg text-on-surface tracking-tight">
            Update Password
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2">
            Enter your new password below to secure your account.
          </p>
        </div>

        <PasswordForm />

        <div className="mt-10 text-center font-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-8">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-label-md text-primary hover:text-primary-container transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
