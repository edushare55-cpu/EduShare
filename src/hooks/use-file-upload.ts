/**
 * hooks/use-file-upload.ts
 *
 * Custom hook for uploading files to Supabase Storage.
 * Returns upload progress, error state, and the uploaded file URL.
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UploadOptions {
  bucket: string;         // Supabase Storage bucket name
  folder?: string;        // Optional sub-folder path
  maxSizeMB?: number;     // Max file size in MB (default: 50)
}

interface UploadResult {
  url: string;
  path: string;
}

export type UploadState = "idle" | "uploading" | "finalizing" | "complete" | "error";

/**
 * Resolves the MIME type from a file extension.
 * This is necessary because Windows browsers often return an empty string
 * for file.type on .docx and .doc files, which causes Supabase to reject
 * the upload with a 400 Bad Request.
 */
const MIME_BY_EXT: Record<string, string> = {
  pdf:  "application/pdf",
  doc:  "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp4:  "video/mp4",
  webm: "video/webm",
  mov:  "video/quicktime",
  png:  "image/png",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  gif:  "image/gif",
  webp: "image/webp",
};

function resolveMimeType(file: File): string {
  // Use the browser-reported type when it's available and non-empty
  if (file.type && file.type.trim() !== "") return file.type;
  // Fall back to our map keyed by lowercased extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function useFileUpload(options: UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");

  const { bucket, folder = "", maxSizeMB = 50 } = options;

  const upload = async (file: File): Promise<UploadResult | null> => {
    // Type guard: protect against accidental non-File arguments (e.g. a staged
    // URL string being passed by mistake from an onChange handler).
    if (!(file instanceof File)) {
      const msg = "upload() received a non-File argument. Expected a File object.";
      console.error("[useFileUpload]", msg, file);
      setError(msg);
      setUploadState("error");
      return null;
    }

    setError(null);
    setProgress(0);
    setUploadState("idle");

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      setUploadState("error");
      return null;
    }

    setIsUploading(true);
    setUploadState("uploading");

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 500);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const contentType = resolveMimeType(file);

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType, // Always a valid, non-empty MIME string
        });

      clearInterval(progressInterval);
      setUploadState("finalizing");
      setProgress(95);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      setProgress(100);
      setUploadState("complete");
      return { url: publicUrl, path: data.path };
    } catch (err) {
      clearInterval(progressInterval);
      // Safely extract the error message regardless of the error type.
      // StorageApiError objects have a .message property; so do Error instances.
      const message =
        err != null && typeof (err as any).message === "string"
          ? (err as any).message
          : "Upload failed";
      setError(message);
      setUploadState("error");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setError(null);
    setProgress(0);
    setIsUploading(false);
    setUploadState("idle");
  };

  return { upload, isUploading, progress, uploadState, error, reset };
}
