"use client";

import { useRef, useState, useTransition } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => Promise<{ success: boolean; error?: string }>;
  children: React.ReactNode;
  className?: string;
  bucket?: string;
}

export function ImageUpload({ onUploadSuccess, children, className, bucket = "profiles" }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Compress Image
      const options = {
        maxSizeMB: 1, // Max size in MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // 2. Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // 4. Update Profile via Server Action
      startTransition(async () => {
        const result = await onUploadSuccess(publicUrl);
        if (result.success) {
          toast.success("Image updated successfully!");
        } else {
          toast.error(result.error || "Failed to save image URL.");
        }
        setIsUploading(false);
      });

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "An error occurred while uploading.");
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={() => !isUploading && !isPending && fileInputRef.current?.click()}>
      {children}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-inherit">
        {(isUploading || isPending) ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <div className="text-white text-sm font-medium">Change Photo</div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
