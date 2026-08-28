"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastType = "info" | "success" | "error";

type Toast = { id: number; message: string; type: ToastType };

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} />
    </ToastContext.Provider>
  );
}

function Toaster({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-fade-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-full px-4 py-2.5 text-sm text-background shadow-lg",
            t.type === "error" ? "bg-red-700" : t.type === "success" ? "bg-emerald-800" : "bg-accent"
          )}
        >
          {t.type === "success" && <span aria-hidden>✓</span>}
          {t.type === "error" && <span aria-hidden>!</span>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}