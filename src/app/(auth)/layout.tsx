import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-accent-soft/40 px-4 py-12">
      <Link
        href="/"
        className="font-display mb-8 text-xl font-semibold tracking-tight text-accent"
      >
        The Fashion Hub
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-muted">
        <Link href="/shop" className="hover:text-accent hover:underline">
          ← Back to shop
        </Link>
      </p>
    </div>
  );
}