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
          const f = e.target.files?.[0];
          if (f) handleFile(f);
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