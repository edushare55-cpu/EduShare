"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
});

export async function updateProfile(formData: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateProfileSchema.parse(formData);

    const updatedUser = await prisma.user.update({
      where: { id: session.profile.id },
      data: {
        name: validatedData.name,
      },
    });

    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { name: validatedData.name }
    });

    const basePath = session.profile.role === "STUDENT" ? "/student" : "/faculty";
    revalidatePath(`${basePath}/profile`);
    revalidatePath(basePath);

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid form data" };
    }
    return { success: false, error: "An unexpected error occurred while updating profile" };
  }
}

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function updatePassword(formData: z.infer<typeof updatePasswordSchema>) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updatePasswordSchema.parse(formData);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (error) {
      console.error("Supabase password update error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid password data" };
    }
    return { success: false, error: "An unexpected error occurred while updating password" };
  }
}

export async function updateAvatarUrl(url: string) {
  try {
    const session = await getAuthSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const updatedUser = await prisma.user.update({
      where: { id: session.profile.id },
      data: { avatarUrl: url },
    });

    const basePath = session.profile.role === "STUDENT" ? "/student" : "/faculty";
    revalidatePath(`${basePath}/profile`);
    revalidatePath(basePath);

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { success: false, error: "Failed to update avatar" };
  }
}

export async function updateCoverUrl(url: string) {
  try {
    const session = await getAuthSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const updatedUser = await prisma.user.update({
      where: { id: session.profile.id },
      data: { coverUrl: url },
    });

    const basePath = session.profile.role === "STUDENT" ? "/student" : "/faculty";
    revalidatePath(`${basePath}/profile`);
    revalidatePath(basePath);

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating cover photo:", error);
    return { success: false, error: "Failed to update cover photo" };
  }
}
