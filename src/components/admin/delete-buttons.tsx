"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory, deleteProduct } from "@/actions/admin";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({
  productId,
  name,
}: {
  productId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  async function confirm() {
    setPending(true);
    try {
      const res = await deleteProduct(productId);
      if (res.ok) {
        toast("Product deleted.", "success");
      } else {
        toast(res.error ?? "Could not delete.", "error");
      }
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Delete ${name}`}
        className="text-muted transition-colors hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete product?"
        description={`"${name}" and its variants and images will be permanently removed.`}
        confirmLabel="Delete"
        tone="danger"
        loading={pending}
        onConfirm={confirm}
      />
    </>
  );
}

export function DeleteCategoryButton({
  categoryId,
  name,
}: {
  categoryId: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  async function confirm() {
    setPending(true);
    try {
      const res = await deleteCategory(categoryId);
      if (res.ok) {
        toast("Category deleted.", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Could not delete.", "error");
      }
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Delete ${name}`}
        className="text-muted transition-colors hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete category?"
        description={`"${name}" will be removed. Products in it keep their category_id but become uncategorized.`}
        confirmLabel="Delete"
        tone="danger"
        loading={pending}
        onConfirm={confirm}
      />
    </>
  );
}