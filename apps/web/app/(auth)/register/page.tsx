"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const res = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) });
    if (res.error) {
      setServerError(res.error.message);
      return;
    }
    await refresh();
    router.push("/");
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Create your account</h1>
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
            type="text"
            placeholder="Username"
            className="w-full rounded border px-3 py-2 text-sm"
            {...register("username")}
          />
          {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <Link href="/login" className="text-sm text-blue-600 hover:underline">
        Already have an account? Sign in
      </Link>
    </div>
  );
}
