"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const res = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) });
    if (res.error) {
      setServerError(res.error.message);
      return;
    }
    await refresh();
    const redirectUrl = searchParams.get("redirect_url") ?? "/";
    // Studio/Admin redirect here with an absolute cross-app URL; router.push
    // only handles paths within this app, so fall back to a hard navigation.
    if (redirectUrl.startsWith("http")) {
      window.location.href = redirectUrl;
    } else {
      router.push(redirectUrl);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded border px-3 py-2 text-sm"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded border px-3 py-2 text-sm"
            {...register("password")}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="flex justify-between text-sm">
        <Link href="/register" className="text-blue-600 hover:underline">
          Create account
        </Link>
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
