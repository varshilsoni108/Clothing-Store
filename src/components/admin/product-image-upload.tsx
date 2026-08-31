"use client";

import { useRef, useState } from "react";
import { uploadProductImage } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { UploadCloud } from "lucide-react";

export function ProductImageUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast("Please pick an image file.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5MB.", "error");
      return;
    }

    setPending(true);

    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", "products");

      const res = await uploadProductImage(fd);

      if (res.ok && res.id) {
        onUploaded(res.id);
        toast("Image uploaded.", "success");
      } else {
        toast(res.error ?? "Upload failed.", "error");
      }
    } catch (error) {
      console.error("Product image upload error:", error);

      toast(
        error instanceof Error
          ? error.message
          : "Could not upload the image.",
        "error"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            void handleFile(file);
          }

          e.target.value = "";
        }}
      />

      <Button
        variant="outline"
        size="sm"
        loading={pending}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="h-4 w-4" />
        Upload image
      </Button>
    </div>
  );
}