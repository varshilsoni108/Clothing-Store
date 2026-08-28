"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup, login, forgotPassword, updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/types";

export function AuthForm({
  mode,
  redirectTo,
}: {
  mode: "login" | "signup" | "forgot-password" | "reset-password";
  redirectTo?: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-background p-7 shadow-sm sm:p-9">
      {mode === "login" && <LoginCard redirectTo={redirectTo} />}
      {mode === "signup" && <SignupCard />}
      {mode === "forgot-password" && <ForgotPasswordCard />}
      {mode === "reset-password" && <ResetPasswordCard />}
    </div>
  );
}

type FieldName = "full_name" | "email" | "password";

function firstError(state: ActionState<FieldName>, field: FieldName) {
  return state.errors?.[field]?.[0];
}

function LoginCard({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(login, {});
  const needsEmailConfirm = state.success === true && state.session === false;

  useEffect(() => {
    if (!state.success) return;
    if (state.session === false) return;
    router.refresh();
    router.push(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
  }, [state, router, redirectTo]);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account to continue shopping."
    >
      {needsEmailConfirm ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Account created! Check your email to confirm your account, then sign in
          below.
        </p>
      ) : (
        <form action={action}>
          <div className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              error={firstError(state, "email")}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              error={firstError(state, "password")}
            />
          </div>
          {state.message && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {state.message}
            </p>
          )}
          <Button type="submit" fullWidth className="mt-6" loading={pending}>
            Sign in
          </Button>
          <div className="mt-4 flex items-center justify-between text-xs">
            <Link
              href="/forgot-password"
              className="text-muted underline-offset-2 hover:text-accent hover:underline"
            >
              Forgot password?
            </Link>
            <Link
              href="/signup"
              className="font-medium text-accent underline-offset-2 hover:underline"
            >
              Create account
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

function SignupCard() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signup, {});

  useEffect(() => {
    if (!state.success) return;
    if (state.session === false) {
      // Email confirmation required — nothing to refresh, just show message.
      return;
    }
    router.refresh();
    router.push("/");
  }, [state, router]);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join The Fashion Hub for faster checkout and order tracking."
    >
      <form action={action}>
        <div className="space-y-4">
          <Input
            label="Full name"
            name="full_name"
            required
            placeholder="Jane Doe"
            error={firstError(state, "full_name")}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            error={firstError(state, "email")}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            error={firstError(state, "password")}
          />
        </div>
        {state.message && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {state.message}
          </p>
        )}
        <Button type="submit" fullWidth className="mt-6" loading={pending}>
          Create account
        </Button>
        <p className="mt-4 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function ForgotPasswordCard() {
  const [state, action, pending] = useActionState(forgotPassword, {});

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form action={action}>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          error={firstError(state, "email")}
        />
        {state.success ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {state.message}
          </p>
        ) : (
          state.message && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {state.message}
            </p>
          )
        )}
        <Button type="submit" fullWidth className="mt-6" loading={pending}>
          Send reset link
        </Button>
        <p className="mt-4 text-center text-xs text-muted">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function ResetPasswordCard() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account."
    >
      <form action={action}>
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          error={firstError(state, "password")}
        />
        {state.success ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {state.message} You can now{" "}
            <Link href="/login" className="font-medium underline">
              sign in
            </Link>
            .
          </p>
        ) : (
          state.message && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {state.message}
            </p>
          )
        )}
        <Button type="submit" fullWidth className="mt-6" loading={pending}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-accent">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </>
  );
}